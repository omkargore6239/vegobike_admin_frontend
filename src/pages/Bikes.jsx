import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  FaEdit,
  FaPlus,
  FaMotorcycle,
  FaExclamationTriangle,
  FaRedo,
  FaCheck,
  FaSearch,
  FaTimes,
  FaToggleOn,
  FaToggleOff,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  bikeAPI,
  brandAPI,
  categoryAPI,
  modelAPI,
  BASE_URL,
} from "../api/apiConfig";

const Bikes = () => {
  const navigate = useNavigate();

  // State management
  const [rawBikes, setRawBikes] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [referencesLoaded, setReferencesLoaded] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Server-side pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [sortBy] = useState("createdAt");
  const [sortDirection] = useState("desc");

  // ✅ SIMPLIFIED: Only search filter (removed brand/category/model)
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // Refs
  const isFetchingRef = useRef(false);
  const abortControllerRef = useRef(null);

  // ✅ Helper function to check if bike is active
  const isBikeActive = (bike) => {
    return bike.active === true;
  };

  // Get image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http")) return imagePath;

    let cleanPath = imagePath.trim();
    while (cleanPath.startsWith("/")) {
      cleanPath = cleanPath.substring(1);
    }

    if (cleanPath.startsWith("uploads/")) {
      return `${BASE_URL}/${cleanPath}`;
    }
    return `${BASE_URL}/uploads/${cleanPath}`;
  };

  // Clear messages
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess("");
        setError("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  // ✅ Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // ✅ Direct Toggle - No confirmation modal
  const handleToggleActive = async (bike) => {
    const currentActive = isBikeActive(bike);
    const statusText = currentActive ? 'Inactive' : 'Active';

    try {
      console.log(`🔄 Toggling bike ${bike.id} to ${statusText}`);
      
      await bikeAPI.toggleActive(bike.id);
      
      toast.success(`✅ Bike marked as ${statusText} successfully!`);
      
      // Refetch to get updated data
      await fetchBikesRef.current(currentPage, pageSize, debouncedSearchTerm);
      
    } catch (error) {
      console.error('❌ Error toggling bike status:', error);
      
      const errorMsg = error.response?.data?.message || 
                       error.response?.data?.error || 
                       error.message ||
                       'Failed to update bike status';
      toast.error(`❌ ${errorMsg}`);
    }
  };

  // Fetch reference data
  const fetchReferenceData = async (retryAttempt = 0) => {
    try {
      console.log("🔄 Fetching reference data...");

      const [brandsRes, categoriesRes, modelsRes] = await Promise.allSettled([
        brandAPI.getActive(),
        categoryAPI.getActive(),
        modelAPI.getActive(),
      ]);

      if (brandsRes.status === "fulfilled") {
        const brandsData = brandsRes.value.data?.data || brandsRes.value.data || [];
        console.log("✅ Brands loaded:", brandsData.length);
        setBrands(brandsData);
      } else {
        console.error("❌ Failed to fetch brands");
        setBrands([]);
      }

      if (categoriesRes.status === "fulfilled") {
        const categoriesData = categoriesRes.value.data?.data || categoriesRes.value.data || [];
        console.log("✅ Categories loaded:", categoriesData.length);
        setCategories(categoriesData);
      } else {
        console.error("❌ Failed to fetch categories");
        setCategories([]);
      }

      if (modelsRes.status === "fulfilled") {
        const modelsData = modelsRes.value.data?.data || modelsRes.value.data || [];
        console.log("✅ Models loaded:", modelsData.length);
        setModels(modelsData);
      } else {
        console.error("❌ Failed to fetch models");
        setModels([]);
      }

      setReferencesLoaded(true);
      console.log("✅ Reference data loaded");
    } catch (error) {
      console.error("❌ Error fetching reference data:", error);
      toast.error("Failed to load reference data");

      if (retryAttempt < 2) {
        console.log(`🔄 Retrying (${retryAttempt + 1}/3)...`);
        setTimeout(() => fetchReferenceData(retryAttempt + 1), 3000);
      } else {
        setReferencesLoaded(true);
      }
    }
  };

  // Process bike data
  const processBikeData = (bike) => {
    let primaryImage = null;
    if (bike.bikeImages && bike.bikeImages.length > 0) {
      primaryImage = getImageUrl(bike.bikeImages[0]);
    } else if (bike.documentImageUrl) {
      primaryImage = getImageUrl(bike.documentImageUrl);
    } else if (bike.pucImageUrl) {
      primaryImage = getImageUrl(bike.pucImageUrl);
    } else if (bike.insuranceImageUrl) {
      primaryImage = getImageUrl(bike.insuranceImageUrl);
    }

    const brandName = bike.brandName || "Unknown Brand";
    const modelName = bike.modelName || "Unknown Model";
    const categoryName = bike.categoryName || "Unknown Category";

    const bikeStatus = bike.status || "AVAILABLE";

    const displayName = `${brandName} ${modelName}`.trim();

    return {
      ...bike,
      brandName,
      modelName,
      categoryName,
      registrationNumber: bike.registrationNumber || "N/A",
      vehicleStatus: bikeStatus,
      bikeImage: primaryImage,
      displayName,
      hasImages: !!primaryImage,
      totalImages:
        (bike.bikeImages?.length || 0) +
        (bike.pucImageUrl ? 1 : 0) +
        (bike.insuranceImageUrl ? 1 : 0) +
        (bike.documentImageUrl ? 1 : 0),
    };
  };

  // ✅ Fetch bikes with pagination and search
  const fetchBikes = async (page = 0, size = 10, searchQuery = "") => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (isFetchingRef.current) {
      console.log("⏭️ Already fetching, skipping duplicate request");
      return;
    }

    isFetchingRef.current = true;
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      console.log(
        `🚲 Fetching bikes: page=${page}, size=${size}, sortBy=${sortBy}, sortDirection=${sortDirection}, search=${searchQuery}`
      );

      const params = {
        page,
        size,
        sortBy,
        sortDirection,
      };

      // ✅ Add search parameter if exists
      if (searchQuery && searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const response = await bikeAPI.getAll(params);

      console.log("✅ Backend response:", response.data);

      if (response.data?.content) {
        const bikesData = response.data.content;
        const processed = bikesData.map(processBikeData);

        setRawBikes(processed);
        setTotalPages(response.data.totalPages || 0);
        setTotalItems(response.data.totalElements || 0);

        console.log(
          `✅ Loaded ${processed.length} bikes (Page ${page + 1}/${
            response.data.totalPages || 1
          })`
        );
      } else if (Array.isArray(response.data)) {
        const processed = response.data.map(processBikeData);

        setRawBikes(processed);
        setTotalPages(1);
        setTotalItems(processed.length);
      }

      setError("");
    } catch (error) {
      if (error.name === "AbortError" || error.name === "CanceledError") {
        console.log("🚫 Request cancelled");
        return;
      }

      console.error("❌ Error fetching bikes:", error);
      setError("Failed to fetch bikes");
      toast.error("Failed to fetch bikes");
      setRawBikes([]);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
      abortControllerRef.current = null;
    }
  };

  const fetchBikesRef = useRef(fetchBikes);

  useEffect(() => {
    fetchBikesRef.current = fetchBikes;
  });

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      console.log("🚀 Starting data load...");
      await fetchReferenceData();
    };

    loadData();
    window.scrollTo(0, 0);
  }, []);

  // ✅ Fetch bikes when page, size, or search changes
  useEffect(() => {
    if (!referencesLoaded) {
      return;
    }

    fetchBikesRef.current(currentPage, pageSize, debouncedSearchTerm);

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [referencesLoaded, currentPage, pageSize, debouncedSearchTerm]);

  // ✅ REMOVED: Frontend filtering - backend handles everything
  const filteredBikes = rawBikes;

  // Handle page size change
  const handlePageSizeChange = (newSize) => {
    console.log(`🔄 Page size change: ${pageSize} → ${newSize}`);
    setPageSize(newSize);
    setCurrentPage(0);
  };

  // Retry function
  const handleRetry = () => {
    setError("");
    fetchBikesRef.current(currentPage, pageSize, debouncedSearchTerm);
  };

  // ✅ SIMPLIFIED: Clear only search filter
  const handleClearFilters = () => {
    console.log("🧹 Clearing search filter");
    setSearchTerm("");
  };

  // Navigation handlers
  const handleAddBike = () => navigate("/dashboard/addBike");

  // Edit handler
  // In your Bikes.jsx - Replace the handleEditBike function

const handleEditBike = (bike) => {
  console.log("📝 Editing bike - Full data:", bike);
  
  // Prepare comprehensive bike data for edit
  const bikeDataForEdit = {
    id: bike.id,
    name: bike.name || bike.displayName || `${bike.brandName} ${bike.modelName}`.trim(),
    vehicleTypeId: bike.vehicleTypeId || null,
    categoryId: bike.categoryId || null,
    brandId: bike.brandId || null,
    modelId: bike.modelId || null,
    fuelType: bike.fuelType || 'PETROL',
    registrationNumber: bike.registrationNumber || '',
    registrationYear: bike.registrationYear || bike.registrationYearId || new Date().getFullYear(),
    chassisNumber: bike.chassisNumber || '',
    engineNumber: bike.engineNumber || '',
    storeId: bike.storeId || null,
    storeName: bike.storeName || '',
    imeiNumber: bike.imeiNumber || '',
    batteryId: bike.batteryId || '',
    latitude: bike.latitude || '',
    longitude: bike.longitude || '',
    
    // Boolean fields
    isPuc: bike.puc === true || bike.isPuc === true,
    isInsurance: bike.insurance === true || bike.isInsurance === true,
    isDocuments: bike.documents === true || bike.isDocuments === true,
    active: bike.active === true,
    
    // Image URLs
    bikeImages: Array.isArray(bike.bikeImages) ? bike.bikeImages : [],
    pucImageUrl: bike.pucImageUrl || null,
    insuranceImageUrl: bike.insuranceImageUrl || null,
    documentImageUrl: bike.documentImageUrl || null,
    
    // Additional metadata
    brandName: bike.brandName || '',
    modelName: bike.modelName || '',
    categoryName: bike.categoryName || '',
    
    // For edit mode reference
    existingBikeImages: Array.isArray(bike.bikeImages) ? bike.bikeImages : [],
    existingPucImage: bike.pucImageUrl || null,
    existingInsuranceImage: bike.insuranceImageUrl || null,
    existingDocumentImage: bike.documentImageUrl || null,
  };
  
  console.log("📤 Navigating to edit form with data:", bikeDataForEdit);
  
  // Navigate with state
  navigate(`/dashboard/addBike/${bike.id}`, {
    state: {
      bike: bikeDataForEdit,
      isEditMode: true,
    },
    replace: false,
  });
};



  // Status Display
  const getStatusDisplay = (bike) => {
    const isActive = bike.active === true;
    
    return {
      text: isActive ? "Active" : "Inactive",
      class: isActive 
        ? "bg-emerald-100 text-emerald-800 border border-emerald-200" 
        : "bg-gray-100 text-gray-800 border border-gray-200",
      icon: isActive ? "✓" : "○",
      dotColor: isActive ? "bg-emerald-500" : "bg-gray-400"
    };
  };

  // Image error handlers
  const handleImageError = (e, bikeName) => {
    console.error(`⚠️ Image failed for ${bikeName}`);
    e.target.style.display = "none";
    const fallbackDiv = e.target.nextElementSibling;
    if (fallbackDiv) fallbackDiv.style.display = "flex";
  };

  const handleImageLoad = (e) => {
    e.target.style.display = "block";
    const fallbackDiv = e.target.nextElementSibling;
    if (fallbackDiv) fallbackDiv.style.display = "none";
  };

  // ✅ SIMPLIFIED: Check if search filter is active
  const hasActiveFilters = searchTerm.trim() !== "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#2B2B80] to-[#1a1a4d] bg-clip-text text-transparent">
                🏍️ All Bikes
              </h1>
              <p className="text-gray-500 mt-1">
                Manage your bike inventory ({totalItems} bikes total)
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2B2B80] text-sm font-medium"
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
              </select>

              <button
                onClick={handleAddBike}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#2B2B80] to-[#1a1a4d] text-white rounded-xl hover:from-[#1f1f60] hover:to-[#0f0f3a] transition-all shadow-lg hover:shadow-xl font-semibold"
              >
                <FaPlus className="mr-2" />
                Add New Bike
              </button>
            </div>
          </div>
        </div>

        {/* ✅ SIMPLIFIED: Search Section (removed brand/category/model filters) */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              <FaSearch className="inline mr-2" />
              Search Bikes
            </h2>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="inline-flex items-center px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition font-medium"
              >
                <FaTimes className="mr-2" />
                Clear Search
              </button>
            )}
          </div>

          {/* ✅ Single Search Input */}
          <div className="max-w-2xl">
            <input
              type="text"
              placeholder="Search by registration, brand, model, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2B2B80] focus:border-transparent transition text-base"
            />
         
          </div>

          {/* Search Info */}
          {hasActiveFilters && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Showing {filteredBikes.length}</strong> result(s) for "<strong>{searchTerm}</strong>"
              </p>
            </div>
          )}
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-xl p-4 animate-slideIn">
            <div className="flex items-center">
              <FaCheck className="text-emerald-500 mr-3" />
              <p className="text-emerald-700 font-medium">{success}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 rounded-r-xl p-4 animate-slideIn">
            <div className="flex items-start">
              <FaExclamationTriangle className="text-red-500 mr-3 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-700 font-medium">{error}</p>
                <button
                  onClick={handleRetry}
                  className="mt-2 inline-flex items-center px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                >
                  <FaRedo className="mr-1" />
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bikes Table */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-[#2B2B80] to-[#1a1a4d] text-white">
                  <th className="px-6 py-4 text-left text-sm font-semibold">No.</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Image</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Brand</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Category</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Model</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Registration</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-16">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 border-4 border-[#2B2B80] border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-gray-500 font-medium">Loading bikes...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredBikes.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-16">
                      <div className="flex flex-col items-center">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                          <FaMotorcycle className="text-slate-400 text-3xl" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No bikes found</h3>
                        <p className="text-gray-500">
                          {hasActiveFilters ? "Try a different search term" : "Add your first bike"}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredBikes.map((bike, index) => {
                    const statusInfo = getStatusDisplay(bike);
                    const globalIndex = currentPage * pageSize + index + 1;
                    const isActive = bike.active === true;
                    
                    return (
                      <tr key={bike.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">{globalIndex}</td>
                        <td className="px-6 py-4">
                          <div className="flex-shrink-0 h-16 w-20 relative">
                            {bike.bikeImage ? (
                              <>
                                <img
                                  src={bike.bikeImage}
                                  alt={bike.displayName}
                                  className="h-16 w-20 rounded-xl object-cover ring-2 ring-[#2B2B80]"
                                  onError={(e) => handleImageError(e, bike.displayName)}
                                  onLoad={handleImageLoad}
                                  style={{ display: "block" }}
                                />
                                <div
                                  className="h-16 w-20 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center absolute top-0"
                                  style={{ display: "none" }}
                                >
                                  <FaMotorcycle className="text-slate-600 text-2xl" />
                                </div>
                              </>
                            ) : (
                              <div className="h-16 w-20 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                                <FaMotorcycle className="text-slate-600 text-2xl" />
                              </div>
                            )}
                            {bike.totalImages > 0 && (
                              <div className="absolute -bottom-1 -right-1 bg-[#2B2B80] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                                {bike.totalImages}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-900">{bike.brandName}</td>
                        <td className="px-6 py-4 text-gray-600">{bike.categoryName}</td>
                        <td className="px-6 py-4 text-gray-600">{bike.modelName}</td>
                        <td className="px-6 py-4 font-mono text-sm text-gray-900">{bike.registrationNumber}</td>
                        
                        {/* Status Badge */}
                        <td className="px-6 py-4">
                          <div className="inline-flex items-center">
                            <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold ${statusInfo.class}`}>
                              <span className={`w-2 h-2 rounded-full ${statusInfo.dotColor} mr-2`}></span>
                              {statusInfo.text}
                            </span>
                          </div>
                        </td>
                        
                        {/* Action Buttons */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center space-x-2">
                            {/* Edit Button */}
                            <button
                              onClick={() => handleEditBike(bike)}
                              className="group relative p-2.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 font-semibold border border-blue-200 hover:border-blue-300"
                              title="Edit Bike"
                            >
                              <FaEdit size={18} />
                            </button>
                            
                            {/* Toggle Button */}
                            <button
                              onClick={() => handleToggleActive(bike)}
                              className={`group relative p-2.5 rounded-lg transition-all duration-200 font-semibold border-2 ${
                                isActive
                                  ? 'text-emerald-600 bg-emerald-50 border-emerald-300 hover:bg-emerald-100'
                                  : 'text-gray-500 bg-gray-50 border-gray-300 hover:bg-gray-100'
                              }`}
                              title={isActive ? 'Active - Click to Deactivate' : 'Inactive - Click to Activate'}
                            >
                              {isActive ? (
                                <FaToggleOn size={20} className="text-emerald-600" />
                              ) : (
                                <FaToggleOff size={20} className="text-gray-400" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && rawBikes.length > 0 && totalPages > 1 && (
            <div className="border-t border-gray-100 px-3 py-2 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-600">
                  Showing <span className="font-semibold text-gray-900">{currentPage * pageSize + 1}</span> to{" "}
                  <span className="font-semibold text-gray-900">{Math.min((currentPage + 1) * pageSize, totalItems)}</span> of{" "}
                  <span className="font-semibold text-gray-900">{totalItems}</span> bikes
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setCurrentPage(0)}
                    disabled={currentPage === 0}
                    className="px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    First
                  </button>
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 0}
                    className="px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <span className="px-2 py-1 text-xs font-medium text-gray-700">
                    Page {currentPage + 1} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages - 1}
                    className="px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages - 1)}
                    disabled={currentPage === totalPages - 1}
                    className="px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Last
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Bikes;
