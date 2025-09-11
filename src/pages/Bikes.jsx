import React, { useEffect, useState } from "react";
import { FaEdit, FaTrash, FaSearch, FaPlus, FaMotorcycle, FaEye } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import apiClient from "../api/apiConfig";

const Bikes = () => {
  const navigate = useNavigate();

  // State management
  const [rawBikes, setRawBikes] = useState([]); // ✅ Raw bike data from API
  const [processedBikes, setProcessedBikes] = useState([]); // ✅ Bikes with resolved names
  const [filteredBikes, setFilteredBikes] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [referencesLoaded, setReferencesLoaded] = useState(false); // ✅ Track if references are ready
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Search and pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Backend base URL for images
  const BACKEND_URL = "http://localhost:8081";

  // ✅ FIXED: Helper function to match IDs properly (handles string/number mismatch)
  const getNameById = (array, id, fieldName, defaultValue) => {
    if (!array || !Array.isArray(array) || !id) {
      return defaultValue;
    }
    
    // Convert both IDs to strings for comparison
    const targetId = String(id).trim();
    const found = array.find(item => String(item.id).trim() === targetId);
    
    return found ? (found[fieldName] || defaultValue) : defaultValue;
  };

  // Helper function to get full image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    let cleanPath = imagePath.trim();
    if (cleanPath.startsWith('uploads/')) {
      return `${BACKEND_URL}/${cleanPath}`;
    } else {
      cleanPath = cleanPath.replace(/^\/+/, '');
      return `${BACKEND_URL}/uploads/${cleanPath}`;
    }
  };

  // Clear messages after 5 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess("");
        setError("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  // Handle search
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredBikes(processedBikes);
    } else {
      const filtered = processedBikes.filter((bike) => {
        const searchTerm = searchQuery.toLowerCase();
        return (
          bike.brandName?.toLowerCase().includes(searchTerm) ||
          bike.modelName?.toLowerCase().includes(searchTerm) ||
          bike.registrationNumber?.toLowerCase().includes(searchTerm) ||
          bike.categoryName?.toLowerCase().includes(searchTerm)
        );
      });
      setFilteredBikes(filtered);
    }
    setCurrentPage(1);
  }, [searchQuery, processedBikes]);

  // ✅ STEP 1: Fetch reference data FIRST
  const fetchReferenceData = async () => {
    try {
      console.log("🔄 Fetching reference data...");
      
      const [brandsRes, categoriesRes, modelsRes] = await Promise.allSettled([
        apiClient.get('/brands/active'),
        apiClient.get('/categories/active'), 
        apiClient.get('/models/active')
      ]);

      // Process brands
      if (brandsRes.status === 'fulfilled' && brandsRes.value.data?.success) {
        const brandsData = brandsRes.value.data.data || [];
        console.log("✅ Brands loaded:", brandsData.length, "items");
        setBrands(brandsData);
      } else {
        console.error("❌ Failed to fetch brands");
        setBrands([]);
      }

      // Process categories
      if (categoriesRes.status === 'fulfilled' && categoriesRes.value.data?.success) {
        const categoriesData = categoriesRes.value.data.data || [];
        console.log("✅ Categories loaded:", categoriesData.length, "items");
        setCategories(categoriesData);
      } else {
        console.error("❌ Failed to fetch categories");
        setCategories([]);
      }

      // Process models
      if (modelsRes.status === 'fulfilled' && modelsRes.value.data?.success) {
        const modelsData = modelsRes.value.data.data || [];
        console.log("✅ Models loaded:", modelsData.length, "items");
        setModels(modelsData);
      } else {
        console.error("❌ Failed to fetch models");
        setModels([]);
      }

      // ✅ Mark references as loaded
      setReferencesLoaded(true);
      console.log("✅ All reference data loaded successfully");

    } catch (error) {
      console.error("❌ Error fetching reference data:", error);
      setError("Failed to load reference data");
      setReferencesLoaded(true); // Still mark as loaded to proceed
    }
  };

  // ✅ STEP 2: Fetch raw bikes data
  const fetchRawBikes = async () => {
    try {
      console.log("🚲 Fetching raw bikes data...");
      
      const response = await apiClient.get('/bikes/all');
      const bikesData = Array.isArray(response.data) ? response.data : [];
      
      console.log("✅ Raw bikes loaded:", bikesData.length, "items");
      setRawBikes(bikesData);
      
    } catch (error) {
      console.error("❌ Error fetching bikes:", error);
      setError("Failed to fetch bikes");
      toast.error("Failed to fetch bikes");
      setRawBikes([]);
    }
  };

  // ✅ STEP 3: Process bikes ONLY when both raw bikes and references are available
  useEffect(() => {
    if (!referencesLoaded || rawBikes.length === 0) {
      console.log("⏳ Waiting for data:", { referencesLoaded, rawBikesCount: rawBikes.length });
      if (referencesLoaded && rawBikes.length === 0) {
        setProcessedBikes([]);
        setFilteredBikes([]);
        setLoading(false);
      }
      return;
    }

    console.log("🔄 Processing bikes with reference data...");
    console.log("Available references:", {
      brands: brands.length,
      categories: categories.length,
      models: models.length
    });

    const processed = rawBikes.map((bike, index) => {
      // Get images
      let primaryImage = null;
      if (bike.documentImageUrl) {
        primaryImage = getImageUrl(bike.documentImageUrl);
      } else if (bike.pucImageUrl) {
        primaryImage = getImageUrl(bike.pucImageUrl);
      } else if (bike.insuranceImageUrl) {
        primaryImage = getImageUrl(bike.insuranceImageUrl);
      } else if (bike.bikeImage) {
        primaryImage = getImageUrl(bike.bikeImage);
      }

      // ✅ Resolve names using the fixed helper function
      const brandName = getNameById(brands, bike.brandId, 'brandName', 'Unknown Brand');
      const modelName = getNameById(models, bike.modelId, 'modelName', 'Unknown Model');
      const categoryName = getNameById(categories, bike.categoryId, 'categoryName', 'Unknown Category');

      // Handle status
      let bikeStatus = "UNKNOWN";
      if (bike.vehicleStatus) {
        bikeStatus = bike.vehicleStatus;
      } else if (bike.status) {
        bikeStatus = bike.status;
      } else if (bike.bikeStatus) {
        bikeStatus = bike.bikeStatus;
      } else if (bike.state) {
        bikeStatus = bike.state;
      } else if (bike.condition) {
        bikeStatus = bike.condition;
      } else if (bike.active !== undefined) {
        bikeStatus = bike.active ? "ACTIVE" : "INACTIVE";
      } else if (bike.isActive !== undefined) {
        bikeStatus = (typeof bike.isActive === 'number') 
          ? (bike.isActive === 1 ? "ACTIVE" : "INACTIVE")
          : (bike.isActive ? "ACTIVE" : "INACTIVE");
      } else {
        bikeStatus = "AVAILABLE";
      }

      const processedBike = {
        ...bike,
        brandName: brandName,
        modelName: modelName,
        categoryName: categoryName,
        registrationNumber: bike.registrationNumber || bike.vehicleRegistrationNumber || "N/A",
        vehicleStatus: bikeStatus,
        bikeImage: primaryImage,
        displayName: `${brandName} ${modelName}`.trim(),
        hasImages: !!(bike.pucImageUrl || bike.insuranceImageUrl || bike.documentImageUrl || bike.bikeImage),
        totalImages: [bike.pucImageUrl, bike.insuranceImageUrl, bike.documentImageUrl, bike.bikeImage].filter(Boolean).length
      };

      console.log(`✅ Processed bike ${index + 1}:`, {
        id: processedBike.id,
        brandName: processedBike.brandName,
        categoryName: processedBike.categoryName,
        modelName: processedBike.modelName
      });

      return processedBike;
    });

    console.log(`✅ Successfully processed ${processed.length} bikes`);
    
    setProcessedBikes(processed);
    setFilteredBikes(processed);
    setLoading(false);
    setSuccess(`Successfully loaded ${processed.length} bikes`);
    setTimeout(() => setSuccess(""), 3000);

  }, [rawBikes, brands, categories, models, referencesLoaded]);

  // ✅ STEP 4: Load data in proper sequence
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log("🚀 Starting data load sequence...");
        setLoading(true);
        
        // First load all reference data
        await fetchReferenceData();
        
        // Then load bikes
        await fetchRawBikes();
        
      } catch (error) {
        console.error("❌ Error in data load sequence:", error);
        setError("Failed to load data");
        setLoading(false);
      }
    };
    
    loadData();
    window.scrollTo(0, 0);
  }, []);

  // Delete bike
  const handleDeleteBike = async (id) => {
    if (!id) {
      setError("Invalid bike ID");
      setConfirmDeleteId(null);
      return;
    }

    setError("");
    setSuccess("");
    try {
      console.log(`🗑️ Deleting bike with ID: ${id}`);
      
      await apiClient.delete(`/bikes/${id}`);
      
      setSuccess("Bike deleted successfully!");
      toast.success("Bike deleted successfully!");
      setConfirmDeleteId(null);
      
      // Refresh data
      await fetchRawBikes();
      
    } catch (error) {
      console.error("❌ Error deleting bike:", error);
      setError(error.response?.data?.message || "Failed to delete bike");
      toast.error("Failed to delete bike");
      setConfirmDeleteId(null);
    }
  };

  // Handle navigation
  const handleAddBike = () => {
    navigate("/dashboard/addBike");
  };

  const handleEditBike = (bikeId) => {
    navigate(`/dashboard/bikes/edit/${bikeId}`);
  };

  const handleViewBike = (bikeId) => {
    navigate(`/dashboard/bikes/view/${bikeId}`);
  };

  // Enhanced status display function
  const getStatusDisplay = (status) => {
    if (!status || status === null || status === undefined) {
      return { text: 'Unknown', class: 'bg-gray-100 text-gray-800' };
    }
    
    if (typeof status === 'number') {
      switch (status) {
        case 1:
          return { text: 'Available', class: 'bg-green-100 text-green-800' };
        case 0:
          return { text: 'Inactive', class: 'bg-red-100 text-red-800' };
        case 2:
          return { text: 'Maintenance', class: 'bg-yellow-100 text-yellow-800' };
        case 3:
          return { text: 'Rented', class: 'bg-blue-100 text-blue-800' };
        default:
          return { text: `Status ${status}`, class: 'bg-gray-100 text-gray-800' };
      }
    }
    
    if (typeof status === 'boolean') {
      return status 
        ? { text: 'Available', class: 'bg-green-100 text-green-800' }
        : { text: 'Inactive', class: 'bg-red-100 text-red-800' };
    }
    
    const normalizedStatus = status.toString().toUpperCase().trim();
    
    switch (normalizedStatus) {
      case 'AVAILABLE':
      case 'ACTIVE':
      case 'READY':
      case 'FREE':
      case 'ONLINE':
      case '1':
      case 'TRUE':
      case 'YES':
        return { text: 'Available', class: 'bg-green-100 text-green-800' };
      
      case 'DISABLED':
      case 'MAINTENANCE':
      case 'INACTIVE':
      case 'REPAIR':
      case 'SERVICE':
      case 'DAMAGED':
      case 'BROKEN':
      case 'OFFLINE':
      case '0':
      case 'FALSE':
      case 'NO':
        return { text: 'Maintenance', class: 'bg-red-100 text-red-800' };
      
      case 'RENTED':
      case 'BOOKED':
      case 'OCCUPIED':
      case 'BUSY':
      case 'IN_USE':
      case 'RESERVED':
      case 'ASSIGNED':
        return { text: 'Rented', class: 'bg-blue-100 text-blue-800' };
      
      case 'OUT_OF_SERVICE':
      case 'RETIRED':
      case 'DECOMMISSIONED':
      case 'SCRAPPED':
        return { text: 'Out of Service', class: 'bg-gray-100 text-gray-800' };
      
      case 'PENDING':
      case 'PROCESSING':
      case 'CHECKING':
      case 'VERIFYING':
      case 'REVIEW':
        return { text: 'Pending', class: 'bg-yellow-100 text-yellow-800' };
      
      case 'UNKNOWN':
      case 'NULL':
      case '':
      case 'UNDEFINED':
        return { text: 'Unknown', class: 'bg-gray-100 text-gray-800' };
      
      default:
        return { text: normalizedStatus, class: 'bg-purple-100 text-purple-800' };
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredBikes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBikes = filteredBikes.slice(startIndex, endIndex);

  // Pagination handlers
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  // Image error handler
  const handleImageError = (e, bikeName) => {
    e.target.style.display = 'none';
    const fallbackDiv = e.target.nextElementSibling;
    if (fallbackDiv) {
      fallbackDiv.style.display = 'flex';
    }
  };

  // Image load success handler
  const handleImageLoad = (e) => {
    e.target.style.display = 'block';
    const fallbackDiv = e.target.nextElementSibling;
    if (fallbackDiv) {
      fallbackDiv.style.display = 'none';
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">All Bikes</h1>
          <p className="text-gray-600 mt-1">
            Manage your bike inventory ({filteredBikes.length} bikes{searchQuery && `, filtered from ${processedBikes.length} total`})
          </p>
        </div>
        <button
          onClick={handleAddBike}
          className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition duration-200 shadow-lg hover:shadow-xl"
        >
          <FaPlus className="mr-2" />
          Add New Bike
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-400 rounded-r-lg">
          <p className="text-sm text-green-700 font-medium">{success}</p>
        </div>
      )}
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Search and Filters */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <h3 className="text-lg font-semibold text-gray-900">
              All Bikes ({filteredBikes.length} total)
            </h3>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search bikes by brand, model, or registration..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-96"
              />
            </div>
          </div>
        </div>
        
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-indigo-900 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider rounded-tl-lg">
                  No.
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">
                  Image
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">
                  Brand
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">
                  Model
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">
                  Registration No.
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider rounded-tr-lg">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                      <p className="text-gray-500">
                        {!referencesLoaded ? "Loading reference data..." : "Processing bikes..."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : currentBikes.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <FaMotorcycle className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No bikes found</h3>
                      <p className="text-gray-500">
                        {searchQuery ? `No bikes match "${searchQuery}"` : "Get started by adding your first bike"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentBikes.map((bike, index) => {
                  const statusInfo = getStatusDisplay(bike.vehicleStatus);
                  const displayName = bike.displayName || bike.modelName || bike.brandName || "Unknown";
                  
                  return (
                    <tr 
                      key={`bike-row-${bike.id || index}`} 
                      className="hover:bg-gray-50 transition duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {startIndex + index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex-shrink-0 h-16 w-20 relative">
                          {bike.bikeImage ? (
                            <>
                              <img
                                src={bike.bikeImage}
                                alt={displayName}
                                className="h-16 w-20 rounded-lg object-cover border border-gray-200 shadow-sm bg-white"
                                onError={(e) => handleImageError(e, displayName)}
                                onLoad={(e) => handleImageLoad(e)}
                                style={{ display: 'block' }}
                              />
                              <div 
                                className="h-16 w-20 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center absolute top-0 left-0"
                                style={{ display: 'none' }}
                              >
                                <FaMotorcycle className="h-8 w-8 text-gray-400" />
                              </div>
                            </>
                          ) : (
                            <div className="h-16 w-20 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                              <FaMotorcycle className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                          {bike.totalImages > 0 && (
                            <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                              {bike.totalImages}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {bike.brandName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {bike.categoryName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {bike.modelName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono text-gray-900">
                          {bike.registrationNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusInfo.class}`}>
                          {statusInfo.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            className="inline-flex items-center px-2 py-1 text-sm font-medium rounded-lg transition duration-200 text-blue-700 bg-blue-100 hover:bg-blue-200"
                            onClick={() => handleViewBike(bike.id)}
                            title="View bike details"
                          >
                            <FaEye className="mr-1" />
                            View
                          </button>
                          <button
                            className="inline-flex items-center px-2 py-1 text-sm font-medium rounded-lg transition duration-200 text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                            onClick={() => handleEditBike(bike.id)}
                            title="Edit bike"
                          >
                            <FaEdit className="mr-1" />
                            Edit
                          </button>
                          <button
                            className="inline-flex items-center px-2 py-1 text-sm font-medium rounded-lg transition duration-200 text-red-700 bg-red-100 hover:bg-red-200"
                            onClick={() => setConfirmDeleteId(bike.id)}
                            title="Delete bike"
                          >
                            <FaTrash className="mr-1" />
                            Delete
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
        {!loading && filteredBikes.length > 0 && totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  Previous
                </button>
                <button
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{" "}
                    <span className="font-medium">{startIndex + 1}</span> to{" "}
                    <span className="font-medium">
                      {Math.min(endIndex, filteredBikes.length)}
                    </span>{" "}
                    of <span className="font-medium">{filteredBikes.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                      disabled={currentPage === 1}
                      onClick={() => handlePageChange(currentPage - 1)}
                      title="Previous page"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {getPageNumbers().map((pageNumber) => (
                      <button
                        key={`page-btn-${pageNumber}`}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition duration-200 ${
                          currentPage === pageNumber
                            ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                            : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                        }`}
                        onClick={() => handlePageChange(pageNumber)}
                        title={`Go to page ${pageNumber}`}
                      >
                        {pageNumber}
                      </button>
                    ))}
                    
                    <button
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                      disabled={currentPage === totalPages}
                      onClick={() => handlePageChange(currentPage + 1)}
                      title="Next page"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-10 h-10 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <FaTrash className="w-5 h-5 text-red-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Delete Bike</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to delete this bike? This will permanently remove the bike from your inventory.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition duration-200"
                onClick={() => setConfirmDeleteId(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200"
                onClick={() => handleDeleteBike(confirmDeleteId)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bikes;
