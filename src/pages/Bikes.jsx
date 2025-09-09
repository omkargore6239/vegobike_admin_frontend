import React, { useEffect, useState } from "react";
import { FaEdit, FaTrash, FaSearch, FaPlus, FaMotorcycle, FaEye } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import apiClient from "../api/apiConfig";

const Bikes = () => {
  const navigate = useNavigate();

  // State management
  const [bikes, setBikes] = useState([]);
  const [filteredBikes, setFilteredBikes] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [models, setModels] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Search and pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Backend base URL for images
  const BACKEND_URL = "http://localhost:8081";

  // Helper function to get full image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    let cleanPath = imagePath.trim();
    // Handle the bikes/ prefix that comes from backend
    if (cleanPath.startsWith('bikes/')) {
      return `${BACKEND_URL}/uploads/${cleanPath}`;
    } else {
      cleanPath = cleanPath.replace(/^\/+/, '');
      cleanPath = cleanPath.replace(/^uploads\/+/, '');
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
      setFilteredBikes(bikes);
    } else {
      const filtered = bikes.filter((bike) => {
        const searchTerm = searchQuery.toLowerCase();
        return (
          bike.brand?.toLowerCase().includes(searchTerm) ||
          bike.model?.toLowerCase().includes(searchTerm) ||
          bike.registrationNumber?.toLowerCase().includes(searchTerm) ||
          bike.vehicleRegistrationNumber?.toLowerCase().includes(searchTerm) ||
          bike.categoryName?.toLowerCase().includes(searchTerm)
        );
      });
      setFilteredBikes(filtered);
    }
  }, [searchQuery, bikes]);

  // Fetch reference data (brands, categories, models, stores)
  const fetchReferenceData = async () => {
    try {
      const [brandsRes, categoriesRes, modelsRes, storesRes] = await Promise.allSettled([
        apiClient.get("/brands/all"),
        apiClient.get("/category/all"), 
        apiClient.get("/models/all"),
        apiClient.get("/stores/active")
      ]);

      if (brandsRes.status === 'fulfilled' && brandsRes.value.data) {
        setBrands(brandsRes.value.data.content || brandsRes.value.data.data || brandsRes.value.data || []);
      }

      if (categoriesRes.status === 'fulfilled' && categoriesRes.value.data) {
        setCategories(categoriesRes.value.data.content || categoriesRes.value.data.data || categoriesRes.value.data || []);
      }

      if (modelsRes.status === 'fulfilled' && modelsRes.value.data) {
        setModels(modelsRes.value.data.content || modelsRes.value.data.data || modelsRes.value.data || []);
      }

      if (storesRes.status === 'fulfilled' && storesRes.value.data) {
        const storeData = storesRes.value.data.data || storesRes.value.data.content || storesRes.value.data || [];
        setStores(storeData);
      }
    } catch (error) {
      console.error("Error fetching reference data:", error);
    }
  };

  // Get brand name by ID
  const getBrandName = (brandId) => {
    const brand = brands.find(b => b.id === brandId);
    return brand ? brand.name : null;
  };

  // Get category name by ID  
  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : null;
  };

  // Get model name by ID
  const getModelName = (modelId) => {
    const model = models.find(m => m.id === modelId);
    return model ? model.name : null;
  };

  // Get store name by ID
  const getStoreName = (storeId) => {
    const store = stores.find(s => s.id === storeId);
    return store ? (store.storeName || store.name) : null;
  };

  // Fetch all bikes from backend
  const fetchBikes = async () => {
    setLoading(true);
    setError("");
    try {
      console.log("Fetching bikes from /bikes/all");
      
      const response = await apiClient.get("/bikes/all");
      
      console.log("Raw bikes response:", response.data);
      
      if (response.data && Array.isArray(response.data)) {
        // Process bikes with the exact data structure from your backend
        const processedBikes = response.data.map((bike, index) => {
          console.log(`Processing bike ${index}:`, bike);
          
          // Get the primary image (prefer documentImageUrl, then pucImageUrl, then insuranceImageUrl)
          let primaryImage = null;
          if (bike.documentImageUrl) {
            primaryImage = getImageUrl(bike.documentImageUrl);
          } else if (bike.pucImageUrl) {
            primaryImage = getImageUrl(bike.pucImageUrl);
          } else if (bike.insuranceImageUrl) {
            primaryImage = getImageUrl(bike.insuranceImageUrl);
          }

          // Resolve names using IDs if the names are "Unknown"
          const resolvedBrand = (bike.brand === "Unknown Brand" || !bike.brand) 
            ? getBrandName(bike.brandId) || "Unknown Brand"
            : bike.brand;

          const resolvedModel = (bike.model === "Unknown Model" || !bike.model)
            ? getModelName(bike.modelId) || "Unknown Model"  
            : bike.model;

          const resolvedCategory = (bike.categoryName === "Unknown Category" || !bike.categoryName)
            ? getCategoryName(bike.categoryId) || "Unknown Category"
            : bike.categoryName;

          const resolvedStore = bike.storeName || getStoreName(bike.storeId) || "Unknown Store";
          
          return {
            // Keep all original properties
            ...bike,
            
            // Use the correct field names from your backend
            id: bike.id,
            brand: resolvedBrand,
            model: resolvedModel,
            categoryName: resolvedCategory,
            registrationNumber: bike.registrationNumber || bike.vehicleRegistrationNumber,
            vehicleStatus: bike.vehicleStatus || "UNKNOWN",
            storeName: resolvedStore,
            
            // Set the primary image
            bikeImage: primaryImage,
            
            // Additional computed fields
            displayName: `${resolvedBrand} ${resolvedModel}`.trim(),
            hasImages: !!(bike.pucImageUrl || bike.insuranceImageUrl || bike.documentImageUrl),
            totalImages: [bike.pucImageUrl, bike.insuranceImageUrl, bike.documentImageUrl].filter(Boolean).length
          };
        });
        
        console.log("Processed bikes:", processedBikes);
        
        setBikes(processedBikes);
        setFilteredBikes(processedBikes);
        setSuccess(`Successfully loaded ${processedBikes.length} bikes`);
        
        // Clear success message after showing briefly
        setTimeout(() => setSuccess(""), 3000);
      } else {
        console.error("Invalid response format:", response.data);
        setError("Invalid response format from server");
        setBikes([]);
        setFilteredBikes([]);
      }
    } catch (error) {
      console.error("Error fetching bikes:", error);
      setError(error.response?.data?.message || error.message || "Failed to fetch bikes");
      toast.error("Failed to fetch bikes");
      setBikes([]);
      setFilteredBikes([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    const loadData = async () => {
      await fetchReferenceData();
      await fetchBikes();
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
      console.log(`Deleting bike with ID: ${id}`);
      
      await apiClient.delete(`/bikes/${id}`);
      
      setSuccess("Bike deleted successfully!");
      toast.success("Bike deleted successfully!");
      setConfirmDeleteId(null);
      
      // Refresh the bikes list
      await fetchBikes();
    } catch (error) {
      console.error("Error deleting bike:", error);
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

  // Get status display
  const getStatusDisplay = (status) => {
    if (!status) {
      return { text: 'Unknown', class: 'bg-gray-100 text-gray-800' };
    }
    
    const normalizedStatus = status.toString().toUpperCase();
    
    switch (normalizedStatus) {
      case 'AVAILABLE':
        return { text: 'Available', class: 'bg-green-100 text-green-800' };
      case 'DISABLED':
      case 'MAINTENANCE':
        return { text: 'Maintenance', class: 'bg-red-100 text-red-800' };
      case 'RENTED':
      case 'BOOKED':
        return { text: 'Rented', class: 'bg-blue-100 text-blue-800' };
      case 'OUT_OF_SERVICE':
        return { text: 'Out of Service', class: 'bg-gray-100 text-gray-800' };
      case 'ACTIVE':
        return { text: 'Available', class: 'bg-green-100 text-green-800' };
      case 'INACTIVE':
        return { text: 'Inactive', class: 'bg-yellow-100 text-yellow-800' };
      case 'UNKNOWN':
        return { text: 'Unknown', class: 'bg-gray-100 text-gray-800' };
      default:
        return { text: normalizedStatus, class: 'bg-gray-100 text-gray-800' };
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
    console.error(`Bike image failed to load for "${bikeName}":`, e.target.src);
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
            Manage your bike inventory ({filteredBikes.length} bikes{searchQuery && `, filtered from ${bikes.length} total`})
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
                      <p className="text-gray-500">Loading bikes...</p>
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
                  const displayName = bike.displayName || bike.model || bike.brand || "Unknown";
                  
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
                          {bike.brand}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {bike.categoryName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {bike.model}
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
