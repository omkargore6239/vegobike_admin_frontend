import React, { useEffect, useState } from "react";
import { FaEdit, FaImage, FaSearch, FaPlus, FaToggleOn, FaToggleOff } from "react-icons/fa";
import apiClient from "../api/apiConfig";

const StoreManagement = () => {
  const [stores, setStores] = useState([]);
  const [filteredStores, setFilteredStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  // Form states
  const [formVisible, setFormVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState("");

  const [formData, setFormData] = useState({
    storeName: "",
    contactNumber: "",
    address: "",
    googleMapUrl: "",
    storeImage: null,
  });

  // Backend base URL for images
  const BACKEND_URL = "http://localhost:8081";

  // Helper function to get full image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    let cleanPath = imagePath.trim();
    cleanPath = cleanPath.replace(/^\/+/, '');
    cleanPath = cleanPath.replace(/^uploads\/stores\/+/, '');
    cleanPath = cleanPath.replace(/^uploads\/+/, '');
    cleanPath = cleanPath.replace(/^stores\/+/, '');
    
    const filename = cleanPath.split('/').pop();
    const finalUrl = `${BACKEND_URL}/uploads/stores/${filename}`;
    console.log(`Store image URL constructed: ${finalUrl} from original path: ${imagePath}`);
    return finalUrl;
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
      setFilteredStores(stores);
    } else {
      const filtered = stores.filter((store) =>
        store.storeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.address?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredStores(filtered);
    }
  }, [searchQuery, stores]);

  // Fetch Stores data with pagination
  const fetchStores = async (page = 0, size = 10) => {
    setLoading(true);
    setError("");
    try {
      const response = await apiClient.get(`/stores/all?page=${page}&size=${size}&sort=createdAt,desc`);
      console.log("Fetched stores data:", response.data);
      
      if (response.data && response.data.success) {
        const storesData = response.data.data || [];
        
        // Process each store to ensure proper image URLs
        const processedStores = storesData.map((store, index) => {
          const processedStore = {
            ...store,
            id: store.id || store.storeId || `fallback-${index}-${Date.now()}`,
            storeImage: store.storeImage ? getImageUrl(store.storeImage) : null
          };
          
          console.log(`Processed store ${store.storeName}:`, {
            id: processedStore.id,
            original: store.storeImage,
            processed: processedStore.storeImage
          });
          return processedStore;
        });
        
        setStores(processedStores);
        setFilteredStores(processedStores);
        
        if (response.data.pagination) {
          setCurrentPage(response.data.pagination.currentPage);
          setTotalPages(response.data.pagination.totalPages);
          setTotalElements(response.data.pagination.totalElements);
          setHasNext(response.data.pagination.hasNext);
          setHasPrevious(response.data.pagination.hasPrevious);
        }
      } else {
        setError("Failed to fetch stores data");
        setStores([]);
        setFilteredStores([]);
      }
    } catch (error) {
      console.error("Error fetching stores:", error);
      setError(error.response?.data?.message || "Error fetching stores data");
      setStores([]);
      setFilteredStores([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores(currentPage, itemsPerPage);
    window.scrollTo(0, 0);
  }, []);

  // Handle image selection with preview
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError("Please select a valid image file");
        e.target.value = '';
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size should be less than 5MB");
        e.target.value = '';
        return;
      }

      setFormData({ ...formData, storeImage: file });
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      
      setError("");
    }
  };

  // Add Store
  const handleAddStore = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    if (!formData.storeName.trim() || !formData.contactNumber.trim() || !formData.address.trim()) {
      setError("Store name, contact number, and address are required");
      setSubmitting(false);
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('storeName', formData.storeName.trim());
    formDataToSend.append('contactNumber', formData.contactNumber.trim());
    formDataToSend.append('address', formData.address.trim());
    formDataToSend.append('googleMapUrl', formData.googleMapUrl.trim());
    if (formData.storeImage) {
      formDataToSend.append('storeImage', formData.storeImage);
    }

    try {
      const response = await apiClient.post("/stores/add", formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data && response.data.success) {
        setSuccess("Store added successfully!");
        resetForm();
        await fetchStores(currentPage, itemsPerPage);
      } else {
        setError(response.data?.message || "Failed to add store");
      }
    } catch (error) {
      console.error("Error adding store:", error);
      setError(error.response?.data?.message || "Error adding store");
    } finally {
      setSubmitting(false);
    }
  };

  // Edit Store
  const handleEditStore = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    if (!formData.storeName.trim() || !formData.contactNumber.trim() || !formData.address.trim()) {
      setError("Store name, contact number, and address are required");
      setSubmitting(false);
      return;
    }

    if (!editingId) {
      setError("Invalid store ID");
      setSubmitting(false);
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('storeName', formData.storeName.trim());
    formDataToSend.append('contactNumber', formData.contactNumber.trim());
    formDataToSend.append('address', formData.address.trim());
    formDataToSend.append('googleMapUrl', formData.googleMapUrl.trim());
    if (formData.storeImage) {
      formDataToSend.append('storeImage', formData.storeImage);
    }

    try {
      const response = await apiClient.post(`/stores/edit/${editingId}`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data && response.data.success) {
        setSuccess("Store updated successfully!");
        resetForm();
        await fetchStores(currentPage, itemsPerPage);
      } else {
        setError(response.data?.message || "Failed to update store");
      }
    } catch (error) {
      console.error("Error updating store:", error);
      setError(error.response?.data?.message || "Error updating store");
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Store Status
  const handleToggleStatus = async (id) => {
    if (!id || id.toString().startsWith('fallback-')) {
      setError("Invalid store ID");
      return;
    }

    setError("");
    setSuccess("");
    try {
      const response = await apiClient.put(`/stores/${id}/status`);
      if (response.data && response.data.success) {
        setSuccess(response.data.message);
        await fetchStores(currentPage, itemsPerPage);
      } else {
        setError(response.data?.message || "Failed to update status");
      }
    } catch (error) {
      console.error("Error toggling status:", error);
      setError(error.response?.data?.message || "Error updating status");
    }
  };

  // Edit form prefill
  const handleEditStoreClick = (store) => {
    if (!store || !store.id || store.id.toString().startsWith('fallback-')) {
      setError("Invalid store data or missing ID");
      return;
    }

    setEditingId(store.id);
    setFormData({
      storeName: store.storeName || "",
      contactNumber: store.contactNumber || "",
      address: store.address || "",
      googleMapUrl: store.googleMapUrl || "",
      storeImage: null,
    });
    
    if (store.storeImage) {
      setImagePreview(store.storeImage);
    } else {
      setImagePreview("");
    }
    
    setFormVisible(true);
    setError("");
    setSuccess("");
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset Form
  const resetForm = () => {
    setEditingId(null);
    setFormData({
      storeName: "",
      contactNumber: "",
      address: "",
      googleMapUrl: "",
      storeImage: null,
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
      fetchStores(nextPage, itemsPerPage);
    }
  };

  const handlePrevPage = () => {
    if (hasPrevious) {
      const prevPage = currentPage - 1;
      fetchStores(prevPage, itemsPerPage);
    }
  };

  const handlePageClick = (pageNumber) => {
    fetchStores(pageNumber, itemsPerPage);
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
    return searchQuery.trim() !== "" ? filteredStores : filteredStores;
  };

  // Image error handler
  const handleImageError = (e, storeName) => {
    console.error(`Image failed to load for store "${storeName}":`, e.target.src);
    e.target.style.display = 'none';
    const fallbackDiv = e.target.nextElementSibling;
    if (fallbackDiv) {
      fallbackDiv.style.display = 'flex';
    }
  };

  // Image load success handler
  const handleImageLoad = (e, storeName) => {
    console.log(`Image loaded successfully for store "${storeName}":`, e.target.src);
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
          <h1 className="text-3xl font-bold text-gray-900">Store Management</h1>
          <p className="text-gray-600 mt-1">Manage your store locations ({totalElements} stores)</p>
        </div>
        {!formVisible && (
          <button
            onClick={() => setFormVisible(true)}
            className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition duration-200 shadow-lg hover:shadow-xl"
          >
            <FaPlus className="mr-2" />
            Add New Store
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
              {editingId ? "Edit Store" : "Add New Store"}
            </h2>
            <p className="text-gray-600 mt-1">
              {editingId ? "Update store information below" : "Fill in the details to create a new store"}
            </p>
          </div>
          
          <form onSubmit={editingId ? handleEditStore : handleAddStore} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Store Name */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Store Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="storeName"
                  placeholder="Enter store name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                  value={formData.storeName}
                  onChange={(e) =>
                    setFormData({ ...formData, storeName: e.target.value })
                  }
                  required
                  maxLength={100}
                  disabled={submitting}
                />
              </div>

              {/* Contact Number */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Contact Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="contactNumber"
                  placeholder="Enter contact number"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                  value={formData.contactNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, contactNumber: e.target.value })
                  }
                  required
                  maxLength={15}
                  disabled={submitting}
                />
              </div>

              {/* Address */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="address"
                  placeholder="Enter store address"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  required
                  maxLength={255}
                  disabled={submitting}
                  rows={3}
                />
              </div>

              {/* Google Map URL */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Google Map URL
                </label>
                <input
                  type="url"
                  name="googleMapUrl"
                  placeholder="Enter Google Map URL"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                  value={formData.googleMapUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, googleMapUrl: e.target.value })
                  }
                  maxLength={500}
                  disabled={submitting}
                />
              </div>

              {/* Store Image */}
              <div className="space-y-2 lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Store Image
                </label>
                <div className="space-y-4">
                  <input
                    type="file"
                    name="storeImage"
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
                <div className="relative w-64 h-40 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                  <img
                    src={imagePreview}
                    alt="Store preview"
                    className="w-full h-full object-cover"
                    onError={(e) => handleImageError(e, "Preview")}
                    onLoad={(e) => handleImageLoad(e, "Preview")}
                  />
                  <div 
                    className="absolute inset-0 flex items-center justify-center bg-gray-100"
                    style={{ display: 'none' }}
                  >
                    <div className="text-center">
                      <FaImage className="h-8 w-8 text-gray-400 mx-auto mb-1" />
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
                  editingId ? "Update Store" : "Create Store"
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
                All Stores ({totalElements} total)
              </h3>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search stores..."
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
                    Store Image
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Store Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact Info
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
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                        <p className="text-gray-500">Loading stores...</p>
                      </div>
                    </td>
                  </tr>
                ) : getCurrentPageData().length === 0 ? (
                  <tr key="empty-row">
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <FaImage className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No stores found</h3>
                        <p className="text-gray-500">
                          {searchQuery ? `No stores match "${searchQuery}"` : "Get started by creating your first store"}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  getCurrentPageData().map((store, index) => (
                    <tr 
                      key={`store-row-${store.id}-${index}`} 
                      className="hover:bg-gray-50 transition duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {searchQuery ? index + 1 : (currentPage * itemsPerPage + index + 1)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex-shrink-0 h-16 w-20 relative">
                          {store.storeImage ? (
                            <>
                              <img
                                src={store.storeImage}
                                alt={store.storeName}
                                className="h-16 w-20 rounded-lg object-cover border border-gray-200 shadow-sm bg-white"
                                onError={(e) => handleImageError(e, store.storeName)}
                                onLoad={(e) => handleImageLoad(e, store.storeName)}
                                style={{ display: 'block' }}
                              />
                              <div 
                                className="h-16 w-20 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center absolute top-0 left-0"
                                style={{ display: 'none' }}
                              >
                                <div className="text-center">
                                  <FaImage className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                                  <p className="text-xs text-gray-500">No Image</p>
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="h-16 w-20 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                              <div className="text-center">
                                <FaImage className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                                <p className="text-xs text-gray-500">No Image</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{store.storeName}</div>
                        <div className="text-sm text-gray-500 max-w-xs truncate">{store.address}</div>
                        {store.googleMapUrl && (
                          <a 
                            href={store.googleMapUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-indigo-600 hover:text-indigo-800"
                          >
                            View on Map
                          </a>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{store.contactNumber}</div>
                        <div className="text-sm text-gray-500">ID: {store.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(store.id)}
                          className={`inline-flex items-center px-3 py-2 rounded-full text-xs font-medium transition duration-200 ${
                            store.isActive === 1
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : "bg-red-100 text-red-800 hover:bg-red-200"
                          }`}
                          title={`Click to ${store.isActive === 1 ? 'deactivate' : 'activate'} store`}
                          disabled={store.id.toString().startsWith('fallback-')}
                        >
                          {store.isActive === 1 ? (
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
                              store.id.toString().startsWith('fallback-')
                                ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                                : "text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                            }`}
                            onClick={() => handleEditStoreClick(store)}
                            title="Edit store"
                            disabled={store.id.toString().startsWith('fallback-')}
                          >
                            <FaEdit className="mr-1" />
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && !searchQuery && stores.length > 0 && totalPages > 1 && (
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
        </div>
      )}
    </div>
  );
};

export default StoreManagement;
