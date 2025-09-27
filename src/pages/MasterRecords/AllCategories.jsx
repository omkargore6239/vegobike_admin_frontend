import React, { useEffect, useMemo, useState } from "react";
import {
  FaEdit,
  FaTrash,
  FaToggleOn,
  FaToggleOff,
  FaPlus,
  FaSearch,
  FaImage,
  FaEye,
} from "react-icons/fa";

const AllCategories = () => {
  // State
  const [data, setData] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [formVisible, setFormVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    categoryName: "",
    vehicleTypeId: "",
    image: null,
  });
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [imageLoadErrors, setImageLoadErrors] = useState(new Set());

  // API
  const API_BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:8081";
  const API = useMemo(
    () => ({
      categories: {
        list: `${API_BASE_URL}/api/categories/all`,
        active: `${API_BASE_URL}/api/categories/active`,
        add: `${API_BASE_URL}/api/categories/add`,
        edit: (id) => `${API_BASE_URL}/api/categories/edit/${id}`,
        toggle: (id) => `${API_BASE_URL}/api/categories/status/${id}`,
        get: (id) => `${API_BASE_URL}/api/categories/${id}`,
      },
      vehicleTypes: {
        active: `${API_BASE_URL}/api/vehicle-types/active`,
      },
    }),
    [API_BASE_URL]
  );

  // Image URL helper function
  const fixImageUrl = (imagePath) => {
    if (!imagePath || imagePath.trim() === '') return null;
    
    const path = imagePath.trim();
    
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    
    if (path.startsWith('/')) {
      return API_BASE_URL + path;
    }
    
    return API_BASE_URL + '/' + path;
  };

  // Helpers
  const token = typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;

  const makeApiCall = async (url, options = {}) => {
    const headers = new Headers(options.headers || {});
    if (token) headers.set("Authorization", `Bearer ${token}`);
    
    if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const finalOptions = { method: "GET", ...options, headers };
    console.log("🔄 API Call:", url, finalOptions.method);

    const res = await fetch(url, finalOptions);
    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");

    let responseData;
    try {
      responseData = isJson ? await res.json() : await res.text();
    } catch (parseError) {
      console.warn("⚠️ Parse error:", parseError);
      responseData = null;
    }

    if (!res.ok) {
      const errorMsg = (isJson && (responseData?.message || responseData?.error)) || 
                       res.statusText || `HTTP ${res.status}`;
      throw new Error(errorMsg);
    }

    console.log("✅ API Response:", responseData);
    return responseData;
  };

  // Vehicle types
  const fetchVehicleTypes = async () => {
    try {
      console.log("📡 Fetching vehicle types...");
      const resp = await makeApiCall(API.vehicleTypes.active);
      const vehicleTypesData = Array.isArray(resp?.data) ? resp.data : Array.isArray(resp) ? resp : [];
      setVehicleTypes(vehicleTypesData);
      console.log("✅ Vehicle types loaded:", vehicleTypesData.length);
    } catch (err) {
      console.warn("❌ Vehicle types fetch failed:", err.message);
      setVehicleTypes([]);
    }
  };

  const getVehicleTypeName = (vehicleTypeId) => {
    const vt = vehicleTypes.find((v) => v.id === vehicleTypeId);
    return vt?.name || "N/A";
  };

  // Fetch categories with image URL fixing
  const fetchCategories = async () => {
    setPageLoading(true);
    try {
      console.log("📡 Fetching categories - Page:", currentPage, "Size:", itemsPerPage);
      const url = `${API.categories.list}?page=${currentPage}&size=${itemsPerPage}`;
      const resp = await makeApiCall(url);
      
      if (resp?.success) {
        const categoriesData = Array.isArray(resp.data) ? resp.data : [];
        
        const categoriesWithFixedImages = categoriesData.map(category => ({
          ...category,
          image: fixImageUrl(category.image)
        }));
        
        console.log("✅ Categories loaded:", categoriesWithFixedImages.length);
        
        categoriesWithFixedImages.forEach(cat => {
          if (cat.image) {
            console.log(`🖼️  Category ${cat.id} (${cat.categoryName}) fixed image:`, cat.image);
          }
        });
        
        setData(categoriesWithFixedImages);
        setImageLoadErrors(new Set());
        
        if (resp.pagination) {
          setTotalPages(resp.pagination.totalPages);
          setTotalElements(resp.pagination.totalElements);
        }
      } else {
        console.warn("⚠️ Categories response not successful:", resp);
        setData([]);
        setError(resp?.message || "Failed to load categories");
      }
    } catch (err) {
      console.error("❌ Categories fetch error:", err);
      setError(`Failed to load categories: ${err.message}`);
      setData([]);
    } finally {
      setPageLoading(false);
    }
  };

  // Image error handling
  const handleImageError = (categoryId, imageUrl) => {
    console.error(`❌ Image load failed for category ${categoryId}:`, imageUrl);
    setImageLoadErrors(prev => new Set([...prev, categoryId]));
  };

  const handleImageLoad = (categoryId, imageUrl) => {
    console.log(`✅ Image loaded successfully for category ${categoryId}:`, imageUrl);
    setImageLoadErrors(prev => {
      const newSet = new Set(prev);
      newSet.delete(categoryId);
      return newSet;
    });
  };

  // Initial load and page changes
  useEffect(() => {
    fetchCategories();
    fetchVehicleTypes();
  }, [currentPage, itemsPerPage]);

  // Auto clear messages
  useEffect(() => {
    if (!error && !success) return;
    const timer = setTimeout(() => {
      setError("");
      setSuccess("");
    }, 4000);
    return () => clearTimeout(timer);
  }, [error, success]);

  // Image handling for form
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError("Please select a valid image file (JPG, PNG, GIF, WebP)");
      e.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Image size must be ≤ 10MB");
      e.target.value = "";
      return;
    }

    setFormData((s) => ({ ...s, image: file }));
    
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImagePreview(ev.target.result);
      console.log("🖼️  Image preview created");
    };
    reader.readAsDataURL(file);
    setError("");
  };

  // Add category
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!formData.categoryName?.trim()) {
      setError("Category name is required");
      return;
    }
    if (!formData.vehicleTypeId) {
      setError("Vehicle type is required");
      return;
    }

    setLoading(true);
    try {
      console.log("📤 Adding category:", formData.categoryName);
      
      const formDataToSend = new FormData();
      formDataToSend.append("categoryName", formData.categoryName.trim());
      formDataToSend.append("vehicleTypeId", formData.vehicleTypeId.toString());
      
      if (formData.image) {
        formDataToSend.append("image", formData.image);
        console.log("📎 Image attached:", formData.image.name, formData.image.size, "bytes");
      }

      const resp = await makeApiCall(API.categories.add, {
        method: "POST",
        body: formDataToSend,
      });

      if (resp?.success) {
        setSuccess("Category created successfully!");
        await fetchCategories();
        resetForm();
        setCurrentPage(0);
      } else {
        setError(resp?.message || "Failed to create category");
      }
    } catch (err) {
      console.error("❌ Add category error:", err);
      setError(`Failed to create category: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Edit handlers
  const handleEditCategory = (category) => {
    console.log("✏️  Editing category:", category);
    setEditingId(category.id);
    setFormData({
      categoryName: category.categoryName || "",
      vehicleTypeId: (category.vehicleType?.id || category.vehicleTypeId || "").toString(),
      image: null,
    });
    
    setImagePreview(category.image || null);
    setFormVisible(true);
    setError("");
    setSuccess("");
  };

  const handleSaveEditCategory = async (e) => {
    e.preventDefault();
    if (!formData.categoryName?.trim()) {
      setError("Category name is required");
      return;
    }
    if (!formData.vehicleTypeId) {
      setError("Vehicle type is required");
      return;
    }

    setLoading(true);
    try {
      console.log("💾 Updating category ID:", editingId);
      
      const formDataToSend = new FormData();
      formDataToSend.append("categoryName", formData.categoryName.trim());
      formDataToSend.append("vehicleTypeId", formData.vehicleTypeId.toString());
      
      if (formData.image) {
        formDataToSend.append("image", formData.image);
        console.log("📎 New image attached:", formData.image.name);
      }

      const resp = await makeApiCall(API.categories.edit(editingId), {
        method: "POST",
        body: formDataToSend,
      });

      if (resp?.success) {
        setSuccess("Category updated successfully!");
        await fetchCategories();
        resetForm();
      } else {
        setError(resp?.message || "Failed to update category");
      }
    } catch (err) {
      console.error("❌ Update category error:", err);
      setError(`Failed to update category: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Status toggle
  const handleToggleStatus = async (id) => {
    setLoading(true);
    try {
      console.log("🔄 Toggling status for category ID:", id);
      const resp = await makeApiCall(API.categories.toggle(id));
      
      if (resp?.success) {
        setSuccess("Category status updated successfully!");
        await fetchCategories();
      } else {
        setError("Failed to update status");
      }
    } catch (err) {
      console.error("❌ Toggle status error:", err);
      setError(`Failed to update status: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Delete (deactivate)
  const confirmDeleteCategory = async (id) => {
    setLoading(true);
    try {
      await handleToggleStatus(id);
      setConfirmDeleteId(null);
    } finally {
      setLoading(false);
    }
  };

  // Form reset
  const resetForm = () => {
    setEditingId(null);
    setFormData({ categoryName: "", vehicleTypeId: "", image: null });
    setImagePreview(null);
    setFormVisible(false);
    setError("");
    setSuccess("");
    
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = "";
  };

  // Search filter
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const query = searchQuery.toLowerCase();
    return data.filter((item) =>
      (item.categoryName || "").toLowerCase().includes(query)
    );
  }, [data, searchQuery]);

  // Image component with better error handling
  const CategoryImage = ({ category }) => {
    const hasError = imageLoadErrors.has(category.id);
    const imageUrl = category.image;

    if (!imageUrl || hasError) {
      return (
        <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
          <FaImage className="text-lg" />
        </div>
      );
    }

    return (
      <div className="relative">
        <img
          src={imageUrl}
          alt={category.categoryName}
          className="w-12 h-12 object-cover rounded border"
          onLoad={() => handleImageLoad(category.id, imageUrl)}
          onError={() => handleImageError(category.id, imageUrl)}
          loading="lazy"
        />
      </div>
    );
  };

  return (
    <div className="bg-gray-100 min-h-screen p-4">
      {/* Header */}
      <div className="flex justify-between items-center mt-4 mb-4">
        <h1 className="text-2xl font-bold text-gray-800">All Categories</h1>
        {!formVisible && (
          <button
            onClick={() => setFormVisible(true)}
            className="flex items-center px-4 py-2 bg-indigo-900 text-white rounded hover:bg-indigo-600 transition duration-200"
            disabled={loading}
          >
            <FaPlus className="mr-2" />
            Add Category
          </button>
        )}
      </div>

      {/* Messages */}
      {success && (
        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-md border-l-4 border-green-500">
          <div className="flex">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {success}
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md border-l-4 border-red-500">
          <div className="flex">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        </div>
      )}

      {/* Form or Table */}
      {formVisible ? (
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-4">
            {editingId ? "Edit Category" : "Add New Category"}
          </h2>

          <form onSubmit={editingId ? handleSaveEditCategory : handleAddCategory}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category Name */}
              <div>
                <label className="font-medium block mb-2">Category Name *</label>
                <input
                  type="text"
                  placeholder="Enter category name"
                  className="border border-gray-300 p-3 rounded w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formData.categoryName}
                  onChange={(e) =>
                    setFormData((s) => ({ ...s, categoryName: e.target.value }))
                  }
                  required
                  maxLength={100}
                />
              </div>

              {/* Vehicle Type */}
              <div>
                <label className="font-medium block mb-2">Vehicle Type *</label>
                <select
                  className="border border-gray-300 p-3 rounded w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formData.vehicleTypeId}
                  onChange={(e) =>
                    setFormData((s) => ({ ...s, vehicleTypeId: e.target.value }))
                  }
                  required
                >
                  <option value="">-- Select Vehicle Type --</option>
                  {vehicleTypes.map((vt) => (
                    <option key={vt.id} value={vt.id}>
                      {vt.name}
                    </option>
                  ))}
                </select>
                {vehicleTypes.length === 0 && (
                  <p className="text-xs text-orange-600 mt-1">
                    No vehicle types available. Please add vehicle types first.
                  </p>
                )}
              </div>

              {/* Image Upload */}
              <div className="md:col-span-2">
                <label className="font-medium block mb-2">Category Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="border border-gray-300 p-3 rounded w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supported: JPG, PNG, GIF, WebP. Max size: 10MB
                </p>

                {imagePreview && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-600 mb-2">
                      {editingId && !formData.image ? "Current Image:" : "Preview:"}
                    </p>
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-24 h-24 object-cover rounded border shadow-sm"
                      onError={(e) => {
                        console.warn("Preview image error:", e);
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end mt-6 space-x-2">
              <button
                type="button"
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition duration-200"
                onClick={resetForm}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 text-white bg-indigo-900 rounded hover:bg-indigo-600 transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </div>
                ) : (
                  editingId ? "Save Changes" : "Add Category"
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white p-6 shadow-md rounded-lg">
          {/* Search and Stats */}
          <div className="flex justify-between items-center mb-6">
            <div className="relative">
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search categories..."
                className="border border-gray-300 rounded pl-10 pr-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="text-sm text-gray-600">
              Total Categories: <span className="font-semibold">{totalElements}</span>
            </div>
          </div>

          {/* Categories Table */}
          <div className="relative overflow-x-auto shadow-md rounded-lg">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-200">
                <tr>
                  <th className="px-6 py-3">ID</th>
                  <th className="px-6 py-3">Image</th>
                  <th className="px-6 py-3">Category Name</th>
                  <th className="px-6 py-3">Vehicle Type</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Created Date</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageLoading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12">
                      <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-900 mb-4"></div>
                        <span className="text-gray-600">Loading categories...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12">
                      <div className="flex flex-col items-center text-gray-500">
                        <FaSearch className="text-4xl mb-4" />
                        <span>
                          {searchQuery ? "No categories match your search" : "No categories found"}
                        </span>
                        {!searchQuery && (
                          <button
                            onClick={() => setFormVisible(true)}
                            className="mt-4 px-4 py-2 bg-indigo-900 text-white rounded hover:bg-indigo-600 transition duration-200"
                          >
                            Add Your First Category
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((category) => {
                    const vtId = category.vehicleType?.id || category.vehicleTypeId;
                    return (
                      <tr key={category.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm">#{category.id}</span>
                        </td>
                        <td className="px-6 py-4">
                          <CategoryImage category={category} />
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {category.categoryName}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            {getVehicleTypeName(vtId)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              category.isActive === 1
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {category.isActive === 1 ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {category.createdAt
                            ? new Date(category.createdAt).toLocaleDateString()
                            : "N/A"}
                        </td>
                        <td className="px-6 py-4">
                          {/* ✅ FIXED: Properly wrapped JSX elements */}
                          <div className="flex items-center space-x-1">
                            <button
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                              onClick={() => handleEditCategory(category)}
                              title="Edit Category"
                              disabled={loading}
                            >
                              <FaEdit />
                            </button>
                            <button
                              className={`p-2 rounded-lg transition-colors ${
                                category.isActive === 1
                                  ? "text-orange-600 hover:bg-orange-100"
                                  : "text-green-600 hover:bg-green-100"
                              }`}
                              onClick={() => handleToggleStatus(category.id)}
                              title={category.isActive === 1 ? "Deactivate" : "Activate"}
                              disabled={loading}
                            >
                              {category.isActive === 1 ? <FaToggleOn /> : <FaToggleOff />}
                            </button>
                            <button
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                              onClick={() => setConfirmDeleteId(category.id)}
                              title="Deactivate"
                              disabled={loading}
                            >
                              <FaTrash />
                            </button>
                            {category.image && (
                              <button
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                onClick={() => window.open(category.image, '_blank')}
                                title="View Full Image"
                              >
                                <FaEye />
                              </button>
                            )}
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
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-6">
              <p className="text-sm text-gray-500">
                Showing {totalElements === 0 ? 0 : currentPage * itemsPerPage + 1} to{" "}
                {Math.min((currentPage + 1) * itemsPerPage, totalElements)} of {totalElements} entries
              </p>
              <div className="flex space-x-2">
                <button
                  className="px-3 py-2 text-sm text-white bg-indigo-900 rounded disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
                  disabled={currentPage === 0 || pageLoading}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  Previous
                </button>
                {[...Array(Math.min(totalPages, 5))].map((_, idx) => {
                  const pageNum = currentPage < 3 ? idx : currentPage - 2 + idx;
                  if (pageNum >= totalPages) return null;
                  return (
                    <button
                      key={pageNum}
                      className={`px-3 py-2 rounded transition-colors ${
                        currentPage === pageNum
                          ? "bg-indigo-900 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                      onClick={() => setCurrentPage(pageNum)}
                      disabled={pageLoading}
                    >
                      {pageNum + 1}
                    </button>
                  );
                })}
                <button
                  disabled={currentPage >= totalPages - 1 || pageLoading}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className={`px-3 py-2 text-sm rounded transition-colors ${
                    currentPage >= totalPages - 1
                      ? "bg-gray-300 text-gray-500"
                      : "bg-indigo-900 text-white hover:bg-indigo-700"
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-bold mb-4">Confirm Action</h3>
            <p className="mb-6 text-gray-600">
              Are you sure you want to change this category's status?
            </p>
            <div className="flex justify-end space-x-2">
              <button
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                onClick={() => setConfirmDeleteId(null)}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:bg-red-400"
                onClick={() => confirmDeleteCategory(confirmDeleteId)}
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  "Confirm"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllCategories;
