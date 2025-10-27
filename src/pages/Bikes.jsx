// Bikes.jsx - WITH SERVER-SIDE PAGINATION ✅

import React, { useEffect, useState } from "react";
import { FaEdit, FaTrash, FaSearch, FaPlus, FaMotorcycle, FaEye, FaExclamationTriangle, FaRedo, FaCheck } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { bikeAPI, brandAPI, categoryAPI, modelAPI, BASE_URL } from "../api/apiConfig";

const Bikes = () => {
  const navigate = useNavigate();

  // State management
  const [rawBikes, setRawBikes] = useState([]);
  const [processedBikes, setProcessedBikes] = useState([]);
  const [filteredBikes, setFilteredBikes] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [referencesLoaded, setReferencesLoaded] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  
  // Search and pagination - UPDATED
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0); // ✅ Backend uses 0-based index
  const [itemsPerPage, setItemsPerPage] = useState(10); // ✅ Can be changed
  const [totalPages, setTotalPages] = useState(0); // ✅ From backend
  const [totalElements, setTotalElements] = useState(0); // ✅ From backend
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // ✅ Helper function to match IDs
  const getNameById = (array, id, fieldName, defaultValue) => {
    if (!array || !Array.isArray(array) || !id) return defaultValue;
    const targetId = String(id).trim();
    const found = array.find(item => String(item.id).trim() === targetId);
    return found ? (found[fieldName] || defaultValue) : defaultValue;
  };

  // ✅ Get image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    
    let cleanPath = imagePath.trim();
    cleanPath = cleanPath.replace(/^\/+/, '');
    
    if (cleanPath.startsWith('uploads/')) {
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

  // ✅ REMOVED: Client-side search filtering
  // Now search happens on backend

  // ✅ STEP 1: Fetch reference data with retry logic
  const fetchReferenceData = async (retryAttempt = 0) => {
    try {
      console.log("🔄 Fetching reference data...");
      
      const [brandsRes, categoriesRes, modelsRes] = await Promise.allSettled([
        brandAPI.getActive(),
        categoryAPI.getActive(),
        modelAPI.getActive()
      ]);

      // Process brands
      if (brandsRes.status === 'fulfilled') {
        const brandsData = brandsRes.value.data?.data || brandsRes.value.data || [];
        console.log("✅ Brands loaded:", brandsData.length);
        setBrands(brandsData);
      } else {
        console.error("❌ Failed to fetch brands");
        setBrands([]);
      }

      // Process categories
      if (categoriesRes.status === 'fulfilled') {
        const categoriesData = categoriesRes.value.data?.data || categoriesRes.value.data || [];
        console.log("✅ Categories loaded:", categoriesData.length);
        setCategories(categoriesData);
      } else {
        console.error("❌ Failed to fetch categories");
        setCategories([]);
      }

      // Process models
      if (modelsRes.status === 'fulfilled') {
        const modelsData = modelsRes.value.data?.data || modelsRes.value.data || [];
        console.log("✅ Models loaded:", modelsData.length);
        setModels(modelsData);
      } else {
        console.error("❌ Failed to fetch models");
        setModels([]);
      }

      setReferencesLoaded(true);
      setRetryCount(0);
      console.log("✅ Reference data loaded");

    } catch (error) {
      console.error("❌ Error fetching reference data:", error);
      toast.error("Failed to load reference data");
      
      if (retryAttempt < 2) {
        console.log(`🔄 Retrying (${retryAttempt + 1}/3)...`);
        setRetryCount(retryAttempt + 1);
        setTimeout(() => fetchReferenceData(retryAttempt + 1), 3000);
      } else {
        setReferencesLoaded(true);
      }
    }
  };

  // ✅ STEP 2: Fetch bikes with SERVER-SIDE PAGINATION
  const fetchBikes = async (page = 0, size = 10, retryAttempt = 0) => {
    try {
      setLoading(true);
      console.log(`🚲 Fetching bikes: page=${page}, size=${size}`);
      
      const response = await bikeAPI.getAll({ page, size });
      
      console.log("✅ Backend response:", response.data);
      
      // ✅ Handle paginated response from backend
      if (response.data?.content) {
        const bikesData = response.data.content;
        setRawBikes(bikesData);
        setTotalPages(response.data.totalPages || 0);
        setTotalElements(response.data.totalElements || bikesData.length);
        setCurrentPage(response.data.number || page); // Backend returns current page number
        
        console.log(`✅ Loaded ${bikesData.length} bikes (Page ${page + 1}/${response.data.totalPages})`);
      } else if (Array.isArray(response.data)) {
        // Fallback for non-paginated response
        setRawBikes(response.data);
        setTotalPages(1);
        setTotalElements(response.data.length);
      }
      
      setRetryCount(0);
      
    } catch (error) {
      console.error("❌ Error fetching bikes:", error);
      toast.error("Failed to fetch bikes");
      setRawBikes([]);
      
      if (retryAttempt < 2) {
        console.log(`🔄 Retrying (${retryAttempt + 1}/3)...`);
        setRetryCount(retryAttempt + 1);
        setTimeout(() => fetchBikes(page, size, retryAttempt + 1), 3000);
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ STEP 3: Process bikes
  useEffect(() => {
    if (!referencesLoaded || rawBikes.length === 0) {
      if (referencesLoaded && rawBikes.length === 0) {
        setProcessedBikes([]);
        setFilteredBikes([]);
        setLoading(false);
      }
      return;
    }

    console.log("🔄 Processing bikes...");

    const processed = rawBikes.map((bike) => {
      // Get primary image
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

      // Resolve names
      const brandName = getNameById(brands, bike.brandId, 'brandName', 'Unknown Brand');
      const modelName = getNameById(models, bike.modelId, 'modelName', 'Unknown Model');
      const categoryName = getNameById(categories, bike.categoryId, 'categoryName', 'Unknown Category');

      // Handle status
      let bikeStatus = "AVAILABLE";
      if (bike.status !== undefined && bike.status !== null) {
        bikeStatus = bike.status;
      } else if (bike.isActive !== undefined) {
        bikeStatus = bike.isActive ? "AVAILABLE" : "INACTIVE";
      }

      return {
        ...bike,
        brandName,
        modelName,
        categoryName,
        registrationNumber: bike.registrationNumber || "N/A",
        vehicleStatus: bikeStatus,
        bikeImage: primaryImage,
        displayName: `${brandName} ${modelName}`.trim(),
        hasImages: !!(primaryImage),
        totalImages: (bike.bikeImages?.length || 0) + 
                    (bike.pucImageUrl ? 1 : 0) + 
                    (bike.insuranceImageUrl ? 1 : 0) + 
                    (bike.documentImageUrl ? 1 : 0)
      };
    });

    console.log(`✅ Processed ${processed.length} bikes`);
    setProcessedBikes(processed);
    setFilteredBikes(processed);

  }, [rawBikes, brands, categories, models, referencesLoaded]);

  // ✅ STEP 4: Initial load
  useEffect(() => {
    const loadData = async () => {
      console.log("🚀 Starting data load...");
      await fetchReferenceData();
      await fetchBikes(currentPage, itemsPerPage);
    };
    
    loadData();
    window.scrollTo(0, 0);
  }, []);

  // ✅ Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
      fetchBikes(newPage, itemsPerPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // ✅ Handle page size change
  const handlePageSizeChange = (newSize) => {
    setItemsPerPage(newSize);
    setCurrentPage(0); // Reset to first page
    fetchBikes(0, newSize);
  };

  // Retry function
  const handleRetry = () => {
    setError("");
    setRetryCount(0);
    fetchBikes(currentPage, itemsPerPage);
  };

  // Navigation handlers
  const handleAddBike = () => navigate("/dashboard/addBike");
  const handleEditBike = (bikeId) => navigate(`/dashboard/bikes/edit/${bikeId}`);
  const handleViewBike = (bikeId) => navigate(`/dashboard/bikes/view/${bikeId}`);

  // Status display
  const getStatusDisplay = (status) => {
    if (!status) return { text: 'Unknown', class: 'bg-gray-100 text-gray-800' };
    
    const normalizedStatus = String(status).toUpperCase().trim();
    
    switch (normalizedStatus) {
      case 'AVAILABLE':
      case 'ACTIVE':
      case '1':
      case 'TRUE':
        return { text: 'Available', class: 'bg-green-100 text-green-800' };
      case 'INACTIVE':
      case 'MAINTENANCE':
      case '0':
      case 'FALSE':
        return { text: 'Maintenance', class: 'bg-red-100 text-red-800' };
      case 'RENTED':
      case 'BOOKED':
        return { text: 'Rented', class: 'bg-blue-100 text-blue-800' };
      default:
        return { text: normalizedStatus, class: 'bg-purple-100 text-purple-800' };
    }
  };

  // ✅ Updated pagination helpers
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(0, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages - 1, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(0, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  // Image error handlers
  const handleImageError = (e, bikeName) => {
    console.error(`Image failed for "${bikeName}"`);
    e.target.style.display = 'none';
    const fallbackDiv = e.target.nextElementSibling;
    if (fallbackDiv) fallbackDiv.style.display = 'flex';
  };

  const handleImageLoad = (e) => {
    e.target.style.display = 'block';
    const fallbackDiv = e.target.nextElementSibling;
    if (fallbackDiv) fallbackDiv.style.display = 'none';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                All Bikes
              </h1>
              <p className="text-gray-500 mt-1">
                Manage your bike inventory ({totalElements} bikes)
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* ✅ Page Size Selector */}
              <select
                value={itemsPerPage}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
              </select>

              <button
                onClick={handleAddBike}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl hover:from-indigo-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
              >
                <FaPlus className="mr-2" />
                Add New Bike
              </button>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 rounded-r-xl p-4">
            <div className="flex items-center">
              <FaCheck className="text-green-500 mr-3" />
              <p className="text-green-700 font-medium">{success}</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 rounded-r-xl p-4">
            <div className="flex items-start">
              <FaExclamationTriangle className="text-red-500 mr-3 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-700 font-medium">{error}</p>
                <button
                  onClick={handleRetry}
                  className="mt-2 inline-flex items-center px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
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
                <tr className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
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
                        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                        <p className="text-gray-500 font-medium">Loading bikes...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredBikes.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-16">
                      <div className="flex flex-col items-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <FaMotorcycle className="text-gray-400 text-3xl" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No bikes found</h3>
                        <p className="text-gray-500">Get started by adding your first bike</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredBikes.map((bike, index) => {
                    const statusInfo = getStatusDisplay(bike.vehicleStatus);
                    const globalIndex = (currentPage * itemsPerPage) + index + 1;
                    return (
                      <tr key={bike.id} className="hover:bg-indigo-50 transition-colors">
                        <td className="px-6 py-4 font-medium">{globalIndex}</td>
                        <td className="px-6 py-4">
                          <div className="flex-shrink-0 h-16 w-20 relative">
                            {bike.bikeImage ? (
                              <>
                                <img
                                  src={bike.bikeImage}
                                  alt={bike.displayName}
                                  className="h-16 w-20 rounded-xl object-cover ring-2 ring-gray-200"
                                  onError={(e) => handleImageError(e, bike.displayName)}
                                  onLoad={handleImageLoad}
                                  style={{ display: 'block' }}
                                />
                                <div 
                                  className="h-16 w-20 rounded-xl bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center absolute top-0"
                                  style={{ display: 'none' }}
                                >
                                  <FaMotorcycle className="text-indigo-400 text-2xl" />
                                </div>
                              </>
                            ) : (
                              <div className="h-16 w-20 rounded-xl bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center">
                                <FaMotorcycle className="text-indigo-400 text-2xl" />
                              </div>
                            )}
                            {bike.totalImages > 0 && (
                              <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                {bike.totalImages}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-900">{bike.brandName}</td>
                        <td className="px-6 py-4 text-gray-600">{bike.categoryName}</td>
                        <td className="px-6 py-4 text-gray-600">{bike.modelName}</td>
                        <td className="px-6 py-4 font-mono text-sm text-gray-900">{bike.registrationNumber}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.class}`}>
                            {statusInfo.text}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleViewBike(bike.id)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View"
                            >
                              <FaEye />
                            </button>
                            <button
                              onClick={() => handleEditBike(bike.id)}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <FaEdit />
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

          {/* ✅ UPDATED Pagination */}
          {!loading && filteredBikes.length > 0 && totalPages > 1 && (
            <div className="border-t border-gray-100 px-6 py-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing <span className="font-semibold">{(currentPage * itemsPerPage) + 1}</span> to{" "}
                  <span className="font-semibold">{Math.min((currentPage + 1) * itemsPerPage, totalElements)}</span> of{" "}
                  <span className="font-semibold">{totalElements}</span> bikes
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 0}
                    className="px-4 py-2 text-sm bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  {getPageNumbers().map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                        currentPage === pageNum
                          ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md"
                          : "bg-white border hover:bg-gray-50"
                      }`}
                    >
                      {pageNum + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages - 1}
                    className="px-4 py-2 text-sm bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Bikes;
