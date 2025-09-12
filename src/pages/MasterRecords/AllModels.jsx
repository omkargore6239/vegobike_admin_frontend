import React, { useEffect, useState } from "react";
import { FaEdit, FaTrash, FaImage, FaSearch, FaPlus } from "react-icons/fa";
import apiClient, { BASE_URL } from "../../api/apiConfig"; // Import BASE_URL from apiConfig

const AllModels = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [formVisible, setFormVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [formData, setFormData] = useState({
    brandId: "",
    modelName: "",
    image: null,
  });
  const [brands, setBrands] = useState([]);
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

  // ROBUST helper function to get full image URL - handles ALL backend inconsistencies
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    // If the path already includes the full URL, return as is
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    let cleanPath = imagePath.trim();
    
    // Remove all leading slashes
    cleanPath = cleanPath.replace(/^\/+/, '');
    
    // Handle the most problematic case: "/uploads//uploads/models/filename.jpg"
    cleanPath = cleanPath.replace(/^uploads\/\/uploads\/models\/+/, '');
    
    // Remove any occurrence of 'uploads/models/' from the beginning
    cleanPath = cleanPath.replace(/^uploads\/models\/+/, '');
    
    // Remove any occurrence of just 'uploads/' from the beginning  
    cleanPath = cleanPath.replace(/^uploads\/+/, '');
    
    // Remove any occurrence of just 'models/' from the beginning
    cleanPath = cleanPath.replace(/^models\/+/, '');
    
    // Extract just the filename if there are still path segments
    const filename = cleanPath.split('/').pop();
    
    // Construct the final URL with just the filename
    const finalUrl = `${BACKEND_URL}/uploads/models/${filename}`;
    console.log(`Image URL constructed: ${finalUrl} from original path: ${imagePath}`);
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
      setFilteredData(data);
    } else {
      const filtered = data.filter((model) =>
        model.modelName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredData(filtered);
    }
  }, [searchQuery, data]);

  // Fetch brands for dropdown
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const response = await apiClient.get("/brands/active");
        if (response.data && response.data.success) {
          setBrands(response.data.data || []);
        }
      } catch (error) {
        console.error("Error fetching brands:", error);
      }
    };
    fetchBrands();
  }, []);

  // Fetch Models data with pagination
  const fetchModels = async (page = 0, size = 10) => {
    setLoading(true);
    setError("");
    try {
      let url = `/models/all?page=${page}&size=${size}&sort=createdAt,desc`;
      if (searchQuery.trim()) {
        url = `/models/search?query=${encodeURIComponent(searchQuery)}&page=${page}&size=${size}&sort=createdAt,desc`;
      }

      const response = await apiClient.get(url);
      console.log("Fetched models data:", response.data);
      
      if (response.data && response.data.success) {
        const modelsData = response.data.data || [];
        
        // Process each model to ensure proper image URLs
        const processedModels = modelsData.map((model, index) => {
          const processedModel = {
            ...model,
            id: model.id || model.modelId || `fallback-${index}-${Date.now()}`,
            modelImage: model.modelImage ? getImageUrl(model.modelImage) : null
          };
          
          console.log(`Processed model ${model.modelName}:`, {
            id: processedModel.id,
            original: model.modelImage,
            processed: processedModel.modelImage
          });
          return processedModel;
        });
        
        setData(processedModels);
        setFilteredData(processedModels);
        
        if (response.data.pagination) {
          setCurrentPage(response.data.pagination.currentPage);
          setTotalPages(response.data.pagination.totalPages);
          setTotalElements(response.data.pagination.totalElements);
          setHasNext(response.data.pagination.hasNext);
          setHasPrevious(response.data.pagination.hasPrevious);
        }
      } else {
        setError("Failed to fetch models data");
        setData([]);
        setFilteredData([]);
      }
    } catch (error) {
      console.error("Error fetching models:", error);
      setError(error.response?.data?.message || "Error fetching models data");
      setData([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels(currentPage, itemsPerPage);
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

      setFormData({ ...formData, image: file });
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      
      setError("");
    }
  };

  // Add Model
  const handleAddModel = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    if (!formData.brandId || !formData.modelName.trim()) {
      setError("Brand and Model name are required");
      setSubmitting(false);
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('brandId', formData.brandId);
    formDataToSend.append('modelName', formData.modelName.trim());
    if (formData.image) {
      formDataToSend.append('modelImage', formData.image);
    }

    try {
      const response = await apiClient.post("/models/add", formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data && response.data.success) {
        setSuccess("Model added successfully!");
        resetForm();
        await fetchModels(currentPage, itemsPerPage);
      } else {
        setError(response.data?.message || "Failed to add model");
      }
    } catch (error) {
      console.error("Error adding model:", error);
      setError(error.response?.data?.message || "Error adding model");
    } finally {
      setSubmitting(false);
    }
  };

  // Edit Model
  const handleEditModel = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    if (!formData.brandId || !formData.modelName.trim()) {
      setError("Brand and Model name are required");
      setSubmitting(false);
      return;
    }

    if (!editingId) {
      setError("Invalid model ID");
      setSubmitting(false);
      return;
    }

    const formDataToSend = new FormData();
    
    // Create the request object for the edit endpoint
    const requestData = {
      brandId: formData.brandId,
      modelName: formData.modelName.trim()
    };
    
    formDataToSend.append('request', new Blob([JSON.stringify(requestData)], {
      type: 'application/json'
    }));
    
    if (formData.image) {
      formDataToSend.append('image', formData.image);
    }

    try {
      const response = await apiClient.post(`/models/edit/${editingId}`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data && response.data.success) {
        setSuccess("Model updated successfully!");
        resetForm();
        await fetchModels(currentPage, itemsPerPage);
      } else {
        setError(response.data?.message || "Failed to update model");
      }
    } catch (error) {
      console.error("Error updating model:", error);
      setError(error.response?.data?.message || "Error updating model");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Model
  const handleDeleteModel = async (id) => {
    if (!id || id.toString().startsWith('fallback-')) {
      setError("Invalid model ID");
      setConfirmDeleteId(null);
      return;
    }

    setError("");
    setSuccess("");
    try {
      const response = await apiClient.delete(`/models/delete/${id}`);
      if (response.data && response.data.success) {
        setSuccess("Model deleted successfully!");
        setConfirmDeleteId(null);
        
        if (data.length === 1 && currentPage > 0) {
          await fetchModels(currentPage - 1, itemsPerPage);
        } else {
          await fetchModels(currentPage, itemsPerPage);
        }
      } else {
        setError(response.data?.message || "Failed to delete model");
        setConfirmDeleteId(null);
      }
    } catch (error) {
      console.error("Error deleting model:", error);
      setError(error.response?.data?.message || "Error deleting model");
      setConfirmDeleteId(null);
    }
  };

  // Edit form prefill
  const handleEditModelClick = (model) => {
    if (!model || !model.id || model.id.toString().startsWith('fallback-')) {
      setError("Invalid model data or missing ID");
      return;
    }

    setEditingId(model.id);
    setFormData({
      brandId: model.brandId || "",
      modelName: model.modelName || "",
      image: null,
    });
    
    if (model.modelImage) {
      setImagePreview(model.modelImage);
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
      brandId: "",
      modelName: "",
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
      fetchModels(nextPage, itemsPerPage);
    }
  };

  const handlePrevPage = () => {
    if (hasPrevious) {
      const prevPage = currentPage - 1;
      fetchModels(prevPage, itemsPerPage);
    }
  };

  const handlePageClick = (pageNumber) => {
    fetchModels(pageNumber, itemsPerPage);
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

  // Simple image error handler - just hide broken images
  const handleImageError = (e, modelName) => {
    console.error(`Image failed to load for model "${modelName}":`, e.target.src);
    e.target.style.display = 'none';
    const fallbackDiv = e.target.nextElementSibling;
    if (fallbackDiv) {
      fallbackDiv.style.display = 'flex';
    }
  };

  // Image load success handler
  const handleImageLoad = (e, modelName) => {
    console.log(`Image loaded successfully for model "${modelName}":`, e.target.src);
    e.target.style.display = 'block';
    const fallbackDiv = e.target.nextElementSibling;
    if (fallbackDiv) {
      fallbackDiv.style.display = 'none';
    }
  };

  // Get brand name by ID
  const getBrandName = (brandId) => {
    const brand = brands.find(b => b.brandId === brandId || b.id === brandId);
    return brand ? brand.brandName || brand.name : brandId;
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Models Management</h1>
          <p className="text-gray-600 mt-1">Manage your vehicle models catalog ({totalElements} models)</p>
        </div>
        {!formVisible && (
          <button
            onClick={() => setFormVisible(true)}
            className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition duration-200 shadow-lg hover:shadow-xl"
          >
            <FaPlus className="mr-2" />
            Add New Model
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
              {editingId ? "Edit Model" : "Add New Model"}
            </h2>
            <p className="text-gray-600 mt-1">
              {editingId ? "Update model information below" : "Fill in the details to create a new model"}
            </p>
          </div>
          
          <form onSubmit={editingId ? handleEditModel : handleAddModel} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Brand Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Brand <span className="text-red-500">*</span>
                </label>
                <select
                  name="brandId"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                  value={formData.brandId}
                  onChange={(e) =>
                    setFormData({ ...formData, brandId: e.target.value })
                  }
                  required
                  disabled={submitting}
                >
                  <option value="">Select Brand</option>
                  {brands.map((brand) => (
                    <option key={brand.brandId || brand.id} value={brand.brandId || brand.id}>
                      {brand.brandName || brand.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Model Name */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Model Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="modelName"
                  placeholder="Enter model name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                  value={formData.modelName}
                  onChange={(e) =>
                    setFormData({ ...formData, modelName: e.target.value })
                  }
                  required
                  maxLength={100}
                  disabled={submitting}
                />
              </div>

              {/* Model Image */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Model Image
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
                    alt="Model preview"
                    className="w-full h-full object-contain"
                    onError={(e) => handleImageError(e, "Preview")}
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
                  editingId ? "Update Model" : "Create Model"
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
                All Models ({totalElements} total)
              </h3>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search models..."
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
                    Model Image
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Model Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Brand
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
                        <p className="text-gray-500">Loading models...</p>
                      </div>
                    </td>
                  </tr>
                ) : getCurrentPageData().length === 0 ? (
                  <tr key="empty-row">
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <FaImage className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No models found</h3>
                        <p className="text-gray-500">
                          {searchQuery ? `No models match "${searchQuery}"` : "Get started by creating your first model"}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  getCurrentPageData().map((model, index) => (
                    <tr 
                      key={`model-row-${model.id}-${index}`} 
                      className="hover:bg-gray-50 transition duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {searchQuery ? index + 1 : (currentPage * itemsPerPage + index + 1)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex-shrink-0 h-16 w-20 relative">
                          {model.modelImage ? (
                            <>
                              <img
                                src={model.modelImage}
                                alt={model.modelName}
                                className="h-16 w-20 rounded-lg object-contain border border-gray-200 shadow-sm bg-white"
                                onError={(e) => handleImageError(e, model.modelName)}
                                onLoad={(e) => handleImageLoad(e, model.modelName)}
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{model.modelName}</div>
                        <div className="text-sm text-gray-500">ID: {model.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{getBrandName(model.brandId)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-3">
                          <button
                            className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition duration-200 ${
                              model.id.toString().startsWith('fallback-')
                                ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                                : "text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                            }`}
                            onClick={() => handleEditModelClick(model)}
                            title="Edit model"
                            disabled={model.id.toString().startsWith('fallback-')}
                          >
                            <FaEdit className="mr-1" />
                            Edit
                          </button>
                          <button
                            className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition duration-200 ${
                              model.id.toString().startsWith('fallback-')
                                ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                                : "text-red-700 bg-red-100 hover:bg-red-200"
                            }`}
                            onClick={() => setConfirmDeleteId(model.id)}
                            title="Delete model"
                            disabled={model.id.toString().startsWith('fallback-')}
                          >
                            <FaTrash className="mr-1" />
                            Delete
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
                    <h3 className="text-lg font-medium text-gray-900">Delete Model</h3>
                    <p className="text-sm text-gray-500">This action cannot be undone</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-6">
                  Are you sure you want to delete this model? All associated data and images will be permanently removed.
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
                    onClick={() => handleDeleteModel(confirmDeleteId)}
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

export default AllModels;
