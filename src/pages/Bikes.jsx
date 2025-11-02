import React, { useEffect, useState } from "react";
import {
  FaEdit,
  FaPlus,
  FaMotorcycle,
  FaExclamationTriangle,
  FaRedo,
  FaCheck,
  FaSearch,
  FaTimes,
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
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // Helper function to match IDs
  const getNameById = (array, id, fieldName, defaultValue) => {
    if (!array || !Array.isArray(array) || !id) return defaultValue;
    const targetId = String(id).trim();
    const found = array.find((item) => String(item.id).trim() === targetId);
    return found ? found[fieldName] || defaultValue : defaultValue;
  };

  // Get image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http")) return imagePath;

    let cleanPath = imagePath.trim();

    // Remove leading forward slashes
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

  // Fetch reference data with retry logic
  const fetchReferenceData = async (retryAttempt = 0) => {
    try {
      console.log("🔄 Fetching reference data...");

      const [brandsRes, categoriesRes, modelsRes] = await Promise.allSettled([
        brandAPI.getActive(),
        categoryAPI.getActive(),
        modelAPI.getActive(),
      ]);

      // Process brands
      if (brandsRes.status === "fulfilled") {
        const brandsData =
          brandsRes.value.data?.data || brandsRes.value.data || [];
        console.log("✅ Brands loaded:", brandsData.length);
        setBrands(brandsData);
      } else {
        console.error("❌ Failed to fetch brands");
        setBrands([]);
      }

      // Process categories
      if (categoriesRes.status === "fulfilled") {
        const categoriesData =
          categoriesRes.value.data?.data || categoriesRes.value.data || [];
        console.log("✅ Categories loaded:", categoriesData.length);
        setCategories(categoriesData);
      } else {
        console.error("❌ Failed to fetch categories");
        setCategories([]);
      }

      // Process models
      if (modelsRes.status === "fulfilled") {
        const modelsData =
          modelsRes.value.data?.data || modelsRes.value.data || [];
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
        const retryMsg = `🔄 Retrying (${retryAttempt + 1}/3)...`;
        console.log(retryMsg);
        setTimeout(() => fetchReferenceData(retryAttempt + 1), 3000);
      } else {
        setReferencesLoaded(true);
      }
    }
  };

  // Fetch bikes with deterministic sorting
  const fetchBikes = async (page = 0, size = 10, retryAttempt = 0) => {
    try {
      setLoading(true);
      console.log(`🚲 Fetching bikes: page=${page}, size=${size}`);

      let response;

      // If only search term is provided and no other filters, use search API
      if (
        searchTerm.trim() &&
        !selectedBrand &&
        !selectedCategory &&
        !selectedModel &&
        !selectedStatus
      ) {
        console.log("🔍 Using search API for query:", searchTerm.trim());
        
        // Use search endpoint - returns List, not Page
        response = await bikeAPI.search(searchTerm.trim());
        
        // Handle search response (non-paginated)
        if (response.data && Array.isArray(response.data)) {
          const searchResults = response.data;
          
          // Process search results
          const processed = searchResults.map((bike) => {
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

            const brandName = getNameById(
              brands,
              bike.brandId,
              "brandName",
              "Unknown Brand"
            );
            const modelName = getNameById(
              models,
              bike.modelId,
              "modelName",
              "Unknown Model"
            );
            const categoryName = getNameById(
              categories,
              bike.categoryId,
              "categoryName",
              "Unknown Category"
            );

            let bikeStatus = "AVAILABLE";
            if (bike.status !== undefined && bike.status !== null) {
              bikeStatus = bike.status;
            } else if (bike.isActive !== undefined) {
              bikeStatus = bike.isActive ? "AVAILABLE" : "INACTIVE";
            }

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
          });

          setRawBikes(processed);
          setTotalPages(1);
          setTotalElements(processed.length);
          setCurrentPage(0);
          
          console.log(`✅ Search returned ${processed.length} results`);
          setError("");
          setLoading(false);
          return;
        }
      }

      // Otherwise, use paginated API with filters
      const params = {
        page,
        size,
        // Pass sort as array - bikeAPI should serialize this as repeated params
        sort: ["createdAt,desc", "id,desc"],
      };

      // Add filters if provided
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }
      if (selectedBrand) {
        params.brandId = selectedBrand;
      }
      if (selectedCategory) {
        params.categoryId = selectedCategory;
      }
      if (selectedModel) {
        params.modelId = selectedModel;
      }
      if (selectedStatus) {
        params.status = selectedStatus;
      }

      console.log("📤 Request params:", params);

      response = await bikeAPI.getAll(params);

      console.log("✅ Backend response:", response.data);

      // Handle paginated response from backend
      if (response.data?.content) {
        const bikesData = response.data.content;

        // Process bikes with names
        const processed = bikesData.map((bike) => {
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
          const brandName = getNameById(
            brands,
            bike.brandId,
            "brandName",
            "Unknown Brand"
          );
          const modelName = getNameById(
            models,
            bike.modelId,
            "modelName",
            "Unknown Model"
          );
          const categoryName = getNameById(
            categories,
            bike.categoryId,
            "categoryName",
            "Unknown Category"
          );

          // Handle status
          let bikeStatus = "AVAILABLE";
          if (bike.status !== undefined && bike.status !== null) {
            bikeStatus = bike.status;
          } else if (bike.isActive !== undefined) {
            bikeStatus = bike.isActive ? "AVAILABLE" : "INACTIVE";
          }

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
        });

        setRawBikes(processed);
        setTotalPages(response.data.totalPages || 0);
        setTotalElements(response.data.totalElements || 0);
        // Use server page number as source of truth
        setCurrentPage(response.data.number ?? page);

        console.log(
          `✅ Loaded ${processed.length} bikes (Page ${
            (response.data.number ?? page) + 1
          }/${response.data.totalPages || 1})`
        );
        console.log(`📊 Total bikes: ${response.data.totalElements || 0}`);
      } else if (Array.isArray(response.data)) {
        // Fallback for non-paginated response
        setRawBikes(response.data);
        setTotalPages(1);
        setTotalElements(response.data.length);
        setCurrentPage(0);
      }

      setError("");
    } catch (error) {
      console.error("❌ Error fetching bikes:", error);
      setError("Failed to fetch bikes");
      toast.error("Failed to fetch bikes");
      setRawBikes([]);

      if (retryAttempt < 2) {
        console.log(`🔄 Retrying (${retryAttempt + 1}/3)...`);
        setTimeout(() => fetchBikes(page, size, retryAttempt + 1), 3000);
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial load - fetch reference data only once
  useEffect(() => {
    const loadData = async () => {
      console.log("🚀 Starting data load...");
      await fetchReferenceData();
    };

    loadData();
    window.scrollTo(0, 0);
  }, []);

  // Load bikes when page or size changes (AFTER references are loaded)
  useEffect(() => {
    if (referencesLoaded) {
      fetchBikes(currentPage, itemsPerPage);
    }
  }, [currentPage, itemsPerPage, referencesLoaded]);

  // Apply filters - reset to page 0 when filters change
  useEffect(() => {
    if (referencesLoaded) {
      console.log("🔄 Filters changed, resetting to page 0");
      setCurrentPage(0);
      // Fetch immediately with page 0
      fetchBikes(0, itemsPerPage);
    }
  }, [searchTerm, selectedBrand, selectedCategory, selectedModel, selectedStatus]);

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Handle page size change
  const handlePageSizeChange = (newSize) => {
    setItemsPerPage(newSize);
    setCurrentPage(0);
  };

  // Retry function
  const handleRetry = () => {
    setError("");
    fetchBikes(currentPage, itemsPerPage);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedBrand("");
    setSelectedCategory("");
    setSelectedModel("");
    setSelectedStatus("");
    setCurrentPage(0);
  };

  // Navigation handlers
  const handleAddBike = () => navigate("/dashboard/addBike");

  // Edit handler
  const handleEditBike = (bike) => {
    console.log("📝 Editing bike:", bike);
    navigate(`/dashboard/addBike`, {
      state: {
        bike,
        isEditMode: true,
        editId: bike.id,
      },
    });
  };

  // Status display
  const getStatusDisplay = (status) => {
    if (!status)
      return { text: "Unknown", class: "bg-gray-100 text-gray-800" };

    const normalizedStatus = String(status).toUpperCase().trim();

    switch (normalizedStatus) {
      case "AVAILABLE":
      case "ACTIVE":
      case "1":
      case "TRUE":
        return {
          text: "Available",
          class: "bg-emerald-100 text-emerald-800",
        };
      case "INACTIVE":
      case "MAINTENANCE":
      case "0":
      case "FALSE":
        return { text: "Maintenance", class: "bg-red-100 text-red-800" };
      case "RENTED":
      case "BOOKED":
        return { text: "Rented", class: "bg-amber-100 text-amber-800" };
      default:
        return {
          text: normalizedStatus,
          class: "bg-slate-100 text-slate-800",
        };
    }
  };

  // Pagination helpers
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

  // Check if any filters are active
  const hasActiveFilters =
    searchTerm ||
    selectedBrand ||
    selectedCategory ||
    selectedModel ||
    selectedStatus;

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
                Manage your bike inventory ({totalElements} bikes total)
              </p>
            </div>

            <div className="flex items-center space-x-4">
              {/* Page Size Selector */}
              <select
                value={itemsPerPage}
                onChange={(e) =>
                  handlePageSizeChange(Number(e.target.value))
                }
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

        {/* Filters Section */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              <FaSearch className="inline mr-2" />
              Filters & Search
            </h2>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="inline-flex items-center px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition font-medium"
              >
                <FaTimes className="mr-2" />
                Clear Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                placeholder="Search bikes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2B2B80] focus:border-transparent transition"
              />
            </div>

            {/* Brand Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Brand
              </label>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2B2B80] focus:border-transparent transition"
              >
                <option value="">All Brands</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.brandName}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2B2B80] focus:border-transparent transition"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.categoryName}
                  </option>
                ))}
              </select>
            </div>

            {/* Model Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2B2B80] focus:border-transparent transition"
              >
                <option value="">All Models</option>
                {models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.modelName}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2B2B80] focus:border-transparent transition"
              >
                <option value="">All Status</option>
                <option value="AVAILABLE">Available</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="RENTED">Rented</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>
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
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    No.
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Image
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Brand
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Model
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Registration
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Status
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-16">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 border-4 border-[#2B2B80] border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-gray-500 font-medium">
                          Loading bikes...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : rawBikes.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-16">
                      <div className="flex flex-col items-center">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                          <FaMotorcycle className="text-slate-400 text-3xl" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          No bikes found
                        </h3>
                        <p className="text-gray-500">
                          Try adjusting your filters or add your first bike
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  rawBikes.map((bike, index) => {
                    const statusInfo = getStatusDisplay(bike.vehicleStatus);
                    const globalIndex = currentPage * itemsPerPage + index + 1;
                    return (
                      <tr
                        key={bike.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {globalIndex}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex-shrink-0 h-16 w-20 relative">
                            {bike.bikeImage ? (
                              <>
                                <img
                                  src={bike.bikeImage}
                                  alt={bike.displayName}
                                  className="h-16 w-20 rounded-xl object-cover ring-2 ring-[#2B2B80]"
                                  onError={(e) =>
                                    handleImageError(e, bike.displayName)
                                  }
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
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          {bike.brandName}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {bike.categoryName}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {bike.modelName}
                        </td>
                        <td className="px-6 py-4 font-mono text-sm text-gray-900">
                          {bike.registrationNumber}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.class}`}
                          >
                            {statusInfo.text}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center">
                            <button
                              onClick={() => handleEditBike(bike)}
                              className="p-2.5 text-[#2B2B80] hover:bg-[#2B2B80] hover:text-white rounded-lg transition-all duration-200 font-semibold"
                              title="Edit Bike"
                            >
                              <FaEdit size={18} />
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
            <div className="border-t border-gray-100 px-6 py-4 bg-slate-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing{" "}
                  <span className="font-semibold">
                    {currentPage * itemsPerPage + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold">
                    {Math.min(
                      (currentPage + 1) * itemsPerPage,
                      totalElements
                    )}
                  </span>{" "}
                  of <span className="font-semibold">{totalElements}</span>{" "}
                  bikes
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 0}
                    className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    Previous
                  </button>
                  {getPageNumbers().map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-4 py-2 text-sm rounded-lg transition-colors font-medium ${
                        currentPage === pageNum
                          ? "bg-gradient-to-r from-[#2B2B80] to-[#1a1a4d] text-white shadow-md"
                          : "bg-white border border-gray-300 hover:bg-slate-50"
                      }`}
                    >
                      {pageNum + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages - 1}
                    className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
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
      `}</style>
    </div>
  );
};

export default Bikes;