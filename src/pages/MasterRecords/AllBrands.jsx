import React, { useEffect, useState } from "react";
import { FaEdit, FaTrash, FaToggleOn, FaToggleOff, FaImage, FaSearch, FaPlus } from "react-icons/fa";
import apiClient, { BASE_URL } from "../../api/apiConfig"; // Import BASE_URL for image URLs

const AllBrands = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [formVisible, setFormVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [formData, setFormData] = useState({
    brandName: "",
    image: null,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [imagePreview, setImagePreview] = useState("");

  // ✅ Updated: Backend base URL for images from env variable
  const BACKEND_URL = BASE_URL;

  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  // Helper function to get full image URL - handles both folder structures
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    // If the path already includes the full URL, return as is
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // Clean the path to avoid double slashes
    let cleanPath = imagePath.trim();
    
    // Remove leading slash if present
    if (cleanPath.startsWith('/')) {
      cleanPath = cleanPath.substring(1);
    }
    
    // Remove 'uploads/' prefix if present to normalize the path
    if (cleanPath.startsWith('uploads/')) {
      cleanPath = cleanPath.substring(8); // Remove 'uploads/'
    }
    
    // Now construct the proper URL - try brands folder first, then root uploads
    let finalUrl;
    if (cleanPath.includes('brands/')) {
      // Already has brands in path
      finalUrl = `${BACKEND_URL}/uploads/${cleanPath}`;
    } else {
      // Try brands folder first
      finalUrl = `${BACKEND_URL}/uploads/brands/${cleanPath}`;
    }
    
    console.log(`Image URL constructed: ${finalUrl} from path: ${imagePath}`);
    return finalUrl;
  };

  // Helper function to get fallback image URLs
  const getFallbackImageUrls = (originalPath) => {
    if (!originalPath) return [];
    
    const cleanPath = originalPath.replace(BACKEND_URL, '').replace(/^\/+/, '').replace(/^uploads\//, '');
    const filename = cleanPath.includes('/') ? cleanPath.split('/').pop() : cleanPath;
    
    return [
      `${BACKEND_URL}/uploads/brands/${filename}`,
      `${BACKEND_URL}/uploads/${filename}`,
      `${BACKEND_URL}/uploads/brands/${cleanPath}`,
      `${BACKEND_URL}/uploads/${cleanPath}`,
    ].filter((url, index, self) => self.indexOf(url) === index); // Remove duplicates
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
      setFilteredData(data);
    } else {
      const filtered = data.filter((brand) =>
        brand.brandName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredData(filtered);
    }
  }, [searchQuery, data]);

  // Fetch Brands data with pagination
  const fetchBrands = async (page = 0, size = 10) => {
    setLoading(true);
    setError("");
    try {
      const response = await apiClient.get(`/api/brands/all?page=${page}&size=${size}&sort=createdAt,desc`);
      console.log("Fetched brand data:", response.data);
      
      if (response.data && response.data.success) {
        const brandsData = response.data.data || [];
        console.log("Raw brands data:", brandsData);
        
        // Process each brand to ensure proper image URLs and use actual brandId
        const processedBrands = brandsData.map((brand, index) => {
          const processedBrand = {
            ...brand,
            // Use actual brandId from backend, fallback only if truly missing
            brandId: brand.brandId || brand.id || `fallback-${index}-${Date.now()}`,
            brandImage: brand.brandImage ? getImageUrl(brand.brandImage) : null
          };
          
          console.log(`Processed brand ${brand.brandName}:`, {
            id: processedBrand.brandId,
            original: brand.brandImage,
            processed: processedBrand.brandImage
          });
          return processedBrand;
        });
        
        setData(processedBrands);
        setFilteredData(processedBrands);
        
        if (response.data.pagination) {
          setCurrentPage(response.data.pagination.currentPage);
          setTotalPages(response.data.pagination.totalPages);
          setTotalElements(response.data.pagination.totalElements);
          setHasNext(response.data.pagination.hasNext);
          setHasPrevious(response.data.pagination.hasPrevious);
        }
      } else {
        setError("Failed to fetch brands data");
        setData([]);
        setFilteredData([]);
      }
    } catch (error) {
      console.error("Error fetching brands:", error);
      setError(error.response?.data?.message || "Error fetching brands data");
      setData([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands(currentPage, itemsPerPage);
    window.scrollTo(0, 0);
  }, []);

  // Handle image selection with preview
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError("Please select a valid image file");
        e.target.value = '';
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size should be less than 5MB");
        e.target.value = '';
        return;
      }

      setFormData({ ...formData, image: file });
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      
      // Clear any previous errors
      setError("");
    }
  };

  // Add Brand
  const handleAddBrand = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    if (!formData.brandName.trim()) {
      setError("Brand name is required");
      setSubmitting(false);
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('brandName', formData.brandName.trim());
    if (formData.image) {
      formDataToSend.append('image', formData.image);
    }

    try {
      const response = await apiClient.post("/api/brands/add", formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data && response.data.success) {
        setSuccess("Brand added successfully!");
        resetForm();
        // Refresh current page
        await fetchBrands(currentPage, itemsPerPage);
      } else {
        setError(response.data?.message || "Failed to add brand");
      }
    } catch (error) {
      console.error("Error adding brand:", error);
      setError(error.response?.data?.message || "Error adding brand");
    } finally {
      setSubmitting(false);
    }
  };

  // Edit Brand
  const handleEditBrand = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    if (!formData.brandName.trim()) {
      setError("Brand name is required");
      setSubmitting(false);
      return;
    }

    if (!editingId) {
      setError("Invalid brand ID");
      setSubmitting(false);
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('brandName', formData.brandName.trim());
    if (formData.image) {
      formDataToSend.append('image', formData.image);
    }

    try {
      const response = await apiClient.post(`/api/brands/edit/${editingId}`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data && response.data.success) {
        setSuccess("Brand updated successfully!");
        resetForm();
        // Refresh current page
        await fetchBrands(currentPage, itemsPerPage);
      } else {
        setError(response.data?.message || "Failed to update brand");
      }
    } catch (error) {
      console.error("Error updating brand:", error);
      setError(error.response?.data?.message || "Error updating brand");
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Status
  const handleToggleStatus = async (id) => {
    if (!id || id.toString().startsWith('fallback-')) {
      setError("Invalid brand ID");
      return;
    }

    setError("");
    setSuccess("");
    try {
      const response = await apiClient.get(`/api/brands/status/${id}`);
      if (response.data && response.data.success) {
        setSuccess("Status updated successfully!");
        // Refresh current page
        await fetchBrands(currentPage, itemsPerPage);
      } else {
        setError(response.data?.message || "Failed to update status");
      }
    } catch (error) {
      console.error("Error toggling status:", error);
      setError(error.response?.data?.message || "Error updating status");
    }
  };

  // Delete Brand
  const handleDeleteBrand = async (id) => {
    if (!id || id.toString().startsWith('fallback-')) {
      setError("Invalid brand ID");
      setConfirmDeleteId(null);
      return;
    }

    setError("");
    setSuccess("");
    try {
      const response = await apiClient.delete(`/api/brands/delete/${id}`);
      if (response.data && response.data.success) {
        setSuccess("Brand deleted successfully!");
        setConfirmDeleteId(null);
        
        // If this was the last item on current page and not first page, go to previous page
        if (data.length === 1 && currentPage > 0) {
          await fetchBrands(currentPage - 1, itemsPerPage);
        } else {
          await fetchBrands(currentPage, itemsPerPage);
        }
      } else {
        setError(response.data?.message || "Failed to delete brand");
        setConfirmDeleteId(null);
      }
    } catch (error) {
      console.error("Error deleting brand:", error);
      setError(error.response?.data?.message || "Error deleting brand");
      setConfirmDeleteId(null);
    }
  };

  // Edit form prefill
  const handleEditBrandClick = (brand) => {
    if (!brand || !brand.brandId || brand.brandId.toString().startsWith('fallback-')) {
      setError("Invalid brand data or missing ID");
      return;
    }

    setEditingId(brand.brandId);
    setFormData({
      brandName: brand.brandName || "",
      image: null,
    });
    
    // Set existing image as preview if available
    if (brand.brandImage) {
      setImagePreview(brand.brandImage);
    } else {
      setImagePreview("");
    }
    
    setFormVisible(true);
    setError("");
    setSuccess("");
    
    // Scroll to top for better UX
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset Form
  const resetForm = () => {
    setEditingId(null);
    setFormData({
      brandName: "",
      image: null,
    });
    setImagePreview("");
    setFormVisible(false);
    setError("");
    setSuccess("");
    setSubmitting(false);
  };

  // Pagination handlers
  const handleNextPage = () => {
    if (hasNext) {
      const nextPage = currentPage + 1;
      fetchBrands(nextPage, itemsPerPage);
    }
  };

  const handlePrevPage = () => {
    if (hasPrevious) {
      const prevPage = currentPage - 1;
      fetchBrands(prevPage, itemsPerPage);
    }
  };

  const handlePageClick = (pageNumber) => {
    fetchBrands(pageNumber, itemsPerPage);
  };

  // Generate page numbers for pagination
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

  // Get current page data
  const getCurrentPageData = () => {
    return searchQuery.trim() !== "" ? filteredData : filteredData;
  };

  // Enhanced image error handler with fallback attempts
  const handleImageError = (e, brandName, brandId) => {
    console.error(`Image failed to load for brand "${brandName}" (ID: ${brandId}):`, e.target.src);
    
    // Try fallback URLs
    const fallbackUrls = getFallbackImageUrls(e.target.src);
    const currentIndex = parseInt(e.target.dataset.fallbackIndex || '0');
    const nextIndex = currentIndex + 1;
    
    if (nextIndex < fallbackUrls.length) {
      e.target.dataset.fallbackIndex = nextIndex.toString();
      e.target.src = fallbackUrls[nextIndex];
      console.log(`Trying fallback URL ${nextIndex}:`, fallbackUrls[nextIndex]);
    } else {
      // All fallback URLs failed, show placeholder
      e.target.style.display = 'none';
      const fallbackDiv = e.target.nextElementSibling;
      if (fallbackDiv) {
        fallbackDiv.style.display = 'flex';
      }
    }
  };

  // Image load success handler
  const handleImageLoad = (e, brandName) => {
    console.log(`Image loaded successfully for brand "${brandName}":`, e.target.src);
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
          <h1 className="text-3xl font-bold text-gray-900">Brand Management</h1>
          <p className="text-gray-600 mt-1">Manage your brand catalog efficiently</p>
        </div>
        {!formVisible && (
          <button
            onClick={() => setFormVisible(true)}
            className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition duration-200 shadow-lg hover:shadow-xl"
          >
            <FaPlus className="mr-2" />
            Add New Brand
          </button>
        )}
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-400 rounded-r-lg animate-fade-in">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700 font-medium">{success}</p>
            </div>
          </div>
        </div>
      )}
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg animate-fade-in">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          </div>
        </div>
      )}

      {formVisible ? (
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {editingId ? "Edit Brand" : "Add New Brand"}
            </h2>
            <p className="text-gray-600 mt-1">
              {editingId ? "Update brand information below" : "Fill in the details to create a new brand"}
            </p>
          </div>
          
          <form onSubmit={editingId ? handleEditBrand : handleAddBrand} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Brand Name */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Brand Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="brandName"
                  placeholder="Enter brand name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                  value={formData.brandName}
                  onChange={(e) =>
                    setFormData({ ...formData, brandName: e.target.value })
                  }
                  required
                  maxLength={100}
                  disabled={submitting}
                />
              </div>

              {/* Brand Image */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Brand Logo/Image
                </label>
                <div className="space-y-4">
                  <input
                    type="file"
                    name="image"
                    accept="image/jpeg,image/jpg,image/png,image/gif"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    onChange={handleImageChange}
                    disabled={submitting}
                  />
                  <p className="text-xs text-gray-500">
                    Supported formats: JPG, PNG, GIF. Maximum size: 5MB
                  </p>
                </div>
              </div>
            </div>

            {/* Image Preview */}
            {imagePreview && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Image Preview
                </label>
                <div className="relative w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                  <img
                    src={imagePreview}
                    alt="Brand preview"
                    className="w-full h-full object-contain"
                    onError={(e) => handleImageError(e, "Preview", "preview")}
                    onLoad={(e) => handleImageLoad(e, "Preview")}
                  />
                  <div 
                    className="absolute inset-0 flex items-center justify-center bg-gray-100"
                    style={{ display: 'none' }}
                  >
                    <div className="text-center">
                      <FaImage className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                      <p className="text-xs text-gray-500">Preview not available</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition duration-200"
                onClick={resetForm}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={submitting}
              >
                {submitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  editingId ? "Update Brand" : "Create Brand"
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Search and Filters */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <h3 className="text-lg font-semibold text-gray-900">
                All Brands ({totalElements})
              </h3>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search brands..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-80"
                />
              </div>
            </div>
          </div>
          
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Brand Image
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Brand Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr key="loading-row">
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                        <p className="text-gray-500">Loading brands...</p>
                      </div>
                    </td>
                  </tr>
                ) : getCurrentPageData().length === 0 ? (
                  <tr key="empty-row">
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <FaImage className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No brands found</h3>
                        <p className="text-gray-500">
                          {searchQuery ? `No brands match "${searchQuery}"` : "Get started by creating your first brand"}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  getCurrentPageData().map((brand, index) => (
                    <tr 
                      key={`brand-row-${brand.brandId}-${index}`} 
                      className="hover:bg-gray-50 transition duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {searchQuery ? index + 1 : (currentPage * itemsPerPage + index + 1)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex-shrink-0 h-16 w-16 relative">
                          {brand.brandImage ? (
                            <>
                              <img
                                src={brand.brandImage}
                                alt={brand.brandName}
                                className="h-16 w-16 rounded-lg object-contain border border-gray-200 shadow-sm bg-white"
                                onError={(e) => handleImageError(e, brand.brandName, brand.brandId)}
                                onLoad={(e) => handleImageLoad(e, brand.brandName)}
                                style={{ display: 'block' }}
                                data-fallback-index="0"
                              />
                              <div 
                                className="h-16 w-16 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center absolute top-0 left-0"
                                style={{ display: 'none' }}
                              >
                                <div className="text-center">
                                  <FaImage className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                                  <p className="text-xs text-gray-500">No Image</p>
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="h-16 w-16 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                              <div className="text-center">
                                <FaImage className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                                <p className="text-xs text-gray-500">No Image</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{brand.brandName}</div>
                        <div className="text-sm text-gray-500">ID: {brand.brandId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(brand.brandId)}
                          className={`inline-flex items-center px-3 py-2 rounded-full text-xs font-medium transition duration-200 ${
                            brand.isActive === 1
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : "bg-red-100 text-red-800 hover:bg-red-200"
                          }`}
                          title={`Click to ${brand.isActive === 1 ? 'deactivate' : 'activate'} brand`}
                          disabled={brand.brandId.toString().startsWith('fallback-')}
                        >
                          {brand.isActive === 1 ? (
                            <>
                              <FaToggleOn className="mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <FaToggleOff className="mr-1" />
                              Inactive
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-3">
                          <button
                            className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition duration-200 ${
                              brand.brandId.toString().startsWith('fallback-')
                                ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                                : "text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                            }`}
                            onClick={() => handleEditBrandClick(brand)}
                            title="Edit brand"
                            disabled={brand.brandId.toString().startsWith('fallback-')}
                          >
                            <FaEdit className="mr-1" />
                            Edit
                          </button>
                          {/* <button */}
                            {/* className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition duration-200 ${
                              brand.brandId.toString().startsWith('fallback-')
                                ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                                : "text-red-700 bg-red-100 hover:bg-red-200"
                            }`} */}
                            {/* onClick={() => setConfirmDeleteId(brand.brandId)}
                            title="Delete brand"
                            disabled={brand.brandId.toString().startsWith('fallback-')} */}
                          {/* >
                            <FaTrash className="mr-1" />
                            Delete */}
                          {/* </button> */}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && !searchQuery && data.length > 0 && totalPages > 1 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                    disabled={!hasPrevious}
                    onClick={handlePrevPage}
                  >
                    Previous
                  </button>
                  <button
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                    disabled={!hasNext}
                    onClick={handleNextPage}
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{" "}
                      <span className="font-medium">{currentPage * itemsPerPage + 1}</span> to{" "}
                      <span className="font-medium">
                        {Math.min((currentPage + 1) * itemsPerPage, totalElements)}
                      </span>{" "}
                      of <span className="font-medium">{totalElements}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                        disabled={!hasPrevious}
                        onClick={handlePrevPage}
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
                          onClick={() => handlePageClick(pageNumber)}
                          title={`Go to page ${pageNumber + 1}`}
                        >
                          {pageNumber + 1}
                        </button>
                      ))}
                      
                      <button
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                        disabled={!hasNext}
                        onClick={handleNextPage}
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

          {/* Delete Confirmation Modal */}
          {confirmDeleteId && (
            <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0 w-10 h-10 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                    <FaTrash className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Delete Brand</h3>
                    <p className="text-sm text-gray-500">This action cannot be undone</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-6">
                  Are you sure you want to delete this brand? All associated data and images will be permanently removed.
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
                    onClick={() => handleDeleteBrand(confirmDeleteId)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AllBrands;
