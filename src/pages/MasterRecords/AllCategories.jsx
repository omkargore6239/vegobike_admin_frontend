// AllCategories.jsx - Updated to work with CategoryDTO (no nested vehicleType)

import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  FaEdit,
  FaTrash,
  FaToggleOn,
  FaToggleOff,
  FaPlus,
  FaSearch,
  FaImage,
  FaEye,
  FaTimes,
  FaList,
  FaTh,
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
  const [viewMode, setViewMode] = useState("table");
  const [formData, setFormData] = useState({
    categoryName: "",
    vehicleTypeId: "",
    image: null,
  });
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const imageErrorTrackerRef = useRef(new Set());
  const imageLoadTrackerRef = useRef(new Set());

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

  // Image URL helper
  const fixImageUrl = (imagePath) => {
    if (!imagePath || imagePath.trim() === "") return null;
    const path = imagePath.trim();
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    if (path.startsWith("/")) return API_BASE_URL + path;
    return API_BASE_URL + "/" + path;
  };

  const token = typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;

  const makeApiCall = async (url, options = {}) => {
    const headers = new Headers(options.headers || {});
    if (token) headers.set("Authorization", `Bearer ${token}`);
    if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const finalOptions = { method: "GET", ...options, headers };
    const res = await fetch(url, finalOptions);
    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");

    let responseData;
    try {
      responseData = isJson ? await res.json() : await res.text();
    } catch (parseError) {
      responseData = null;
    }

    if (!res.ok) {
      const errorMsg =
        (isJson && (responseData?.message || responseData?.error)) ||
        res.statusText ||
        `HTTP ${res.status}`;
      throw new Error(errorMsg);
    }

    return responseData;
  };

  // ✅ Fetch vehicle types FIRST
  const fetchVehicleTypes = async () => {
    try {
      console.log("📡 Fetching vehicle types...");
      const resp = await makeApiCall(API.vehicleTypes.active);
      
      // Handle different response structures
      let vehicleTypesData = [];
      if (Array.isArray(resp)) {
        vehicleTypesData = resp;
      } else if (Array.isArray(resp?.data)) {
        vehicleTypesData = resp.data;
      } else if (resp?.success && Array.isArray(resp?.data)) {
        vehicleTypesData = resp.data;
      }

      console.log("✅ Vehicle types loaded:", vehicleTypesData);
      setVehicleTypes(vehicleTypesData);
    } catch (err) {
      console.error("❌ Vehicle types fetch failed:", err.message);
      setVehicleTypes([]);
    }
  };

  // ✅ Helper to get vehicle type name by ID
  // ✅ Helper to get vehicle type name by ID with DEBUGGING
const getVehicleTypeName = (vehicleTypeId) => {
  console.log("🔎 getVehicleTypeName called with:", vehicleTypeId, "Type:", typeof vehicleTypeId);
  console.log("🔎 Available vehicle types:", vehicleTypes);
  
  if (!vehicleTypeId) {
    console.warn("⚠️ vehicleTypeId is null/undefined");
    return "N/A";
  }
  
  const vt = vehicleTypes.find((v) => {
    console.log(`  Comparing: ${v.id} (${typeof v.id}) === ${vehicleTypeId} (${typeof vehicleTypeId})`);
    return v.id == vehicleTypeId; // Use == for type coercion
  });
  
  if (!vt) {
    console.warn(`⚠️ Vehicle type NOT FOUND for ID: ${vehicleTypeId}`);
    console.log("Available IDs:", vehicleTypes.map(v => v.id));
    return "N/A";
  }
  
  console.log("✅ Found vehicle type:", vt);
  return vt.name || vt.typeName || "N/A";
};


  // ✅ Fetch categories
  // ✅ Fetch categories with DETAILED DEBUGGING
const fetchCategories = async () => {
  setPageLoading(true);
  try {
    const url = `${API.categories.list}?page=${currentPage}&size=${itemsPerPage}`;
    console.log("📡 Fetching categories:", url);
    
    const resp = await makeApiCall(url);

    if (resp?.success) {
      const categoriesData = Array.isArray(resp.data) ? resp.data : [];

      console.log("✅ Categories loaded:", categoriesData.length);
      
      // ✅ DETAILED DEBUGGING - Check first category
      if (categoriesData.length > 0) {
        const sampleCategory = categoriesData[0];
        console.log("📋 Sample category FULL OBJECT:", sampleCategory);
        console.log("🔍 Category keys:", Object.keys(sampleCategory));
        console.log("🔍 vehicleTypeId value:", sampleCategory.vehicleTypeId);
        console.log("🔍 vehicleTypeId type:", typeof sampleCategory.vehicleTypeId);
        
        // Check all possible field names
        console.log("🔍 Checking all possible vehicle type fields:");
        console.log("  - vehicleTypeId:", sampleCategory.vehicleTypeId);
        console.log("  - vehicleType:", sampleCategory.vehicleType);
        console.log("  - vehicle_type_id:", sampleCategory.vehicle_type_id);
        console.log("  - type_id:", sampleCategory.type_id);
      }

      // ✅ Fix image URLs
      const categoriesWithFixedImages = categoriesData.map((category) => ({
        ...category,
        image: fixImageUrl(category.image),
      }));

      setData(categoriesWithFixedImages);

      // Clear image trackers
      imageErrorTrackerRef.current.clear();
      imageLoadTrackerRef.current.clear();

      if (resp.pagination) {
        setTotalPages(resp.pagination.totalPages);
        setTotalElements(resp.pagination.totalElements);
      }
    } else {
      setData([]);
      setError(resp?.message || "Failed to load categories");
    }
  } catch (err) {
    console.error("❌ Fetch categories error:", err);
    setError(`Failed to load categories: ${err.message}`);
    setData([]);
  } finally {
    setPageLoading(false);
  }
};


  // Image handling
  const handleImageError = (categoryId, imageUrl, e) => {
    const key = `${categoryId}-${imageUrl}`;
    if (imageErrorTrackerRef.current.has(key)) {
      e.target.style.display = "none";
      return;
    }
    imageErrorTrackerRef.current.add(key);
    console.error(`❌ Image failed: category ${categoryId}`);
    e.target.style.display = "none";
  };

  const handleImageLoad = (categoryId, imageUrl) => {
    const key = `${categoryId}-${imageUrl}`;
    if (!imageLoadTrackerRef.current.has(key)) {
      console.log(`✅ Image loaded: category ${categoryId}`);
      imageLoadTrackerRef.current.add(key);
    }
  };

  // ✅ Initial load - IMPORTANT: Fetch vehicle types FIRST, then categories
  useEffect(() => {
    const loadData = async () => {
      await fetchVehicleTypes(); // Wait for vehicle types
      await fetchCategories();   // Then load categories
    };
    loadData();
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

  // Form handlers
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError("Please select a valid image file");
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
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
    setError("");
  };

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
      const formDataToSend = new FormData();
      formDataToSend.append("categoryName", formData.categoryName.trim());
      formDataToSend.append("vehicleTypeId", formData.vehicleTypeId.toString());

      if (formData.image) {
        formDataToSend.append("image", formData.image);
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
      setError(`Failed to create category: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditCategory = (category) => {
    console.log("✏️ Editing category:", category);
    
    setEditingId(category.id);
    setFormData({
      categoryName: category.categoryName || "",
      vehicleTypeId: (category.vehicleTypeId || "").toString(), // ✅ Use vehicleTypeId directly
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
      const formDataToSend = new FormData();
      formDataToSend.append("categoryName", formData.categoryName.trim());
      formDataToSend.append("vehicleTypeId", formData.vehicleTypeId.toString());

      if (formData.image) {
        formDataToSend.append("image", formData.image);
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
      setError(`Failed to update category: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id) => {
    setLoading(true);
    try {
      const resp = await makeApiCall(API.categories.toggle(id));

      if (resp?.success) {
        setSuccess("Status updated!");
        await fetchCategories();
      } else {
        setError("Failed to update status");
      }
    } catch (err) {
      setError(`Failed to update status: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteCategory = async (id) => {
    setLoading(true);
    try {
      await handleToggleStatus(id);
      setConfirmDeleteId(null);
    } finally {
      setLoading(false);
    }
  };

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

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const query = searchQuery.toLowerCase();
    return data.filter((item) => (item.categoryName || "").toLowerCase().includes(query));
  }, [data, searchQuery]);

  // ✅ Category Image Component
  const CategoryImage = ({ category }) => {
    const imageUrl = category.image;
    const key = `${category.id}-${imageUrl}`;
    const hasError = imageErrorTrackerRef.current.has(key);

    if (!imageUrl || hasError) {
      return (
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded flex items-center justify-center text-gray-500">
          <FaImage className="text-lg sm:text-xl" />
        </div>
      );
    }

    return (
      <img
        src={imageUrl}
        alt={category.categoryName}
        className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded border shadow-sm"
        onLoad={() => handleImageLoad(category.id, imageUrl)}
        onError={(e) => handleImageError(category.id, imageUrl, e)}
        loading="lazy"
      />
    );
  };

  // ✅ Category Card Component
  const CategoryCard = ({ category }) => {
    // ✅ Get vehicleTypeId directly from category
  console.log("🎴 CategoryCard - Full category:", category);
  console.log("🎴 CategoryCard - vehicleTypeId:", category.vehicleTypeId);
    const vehicleTypeId = category.vehicleTypeId;
    const vehicleTypeName = getVehicleTypeName(vehicleTypeId);

    return (
      <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow p-4 border border-gray-200">
        <div className="flex items-start justify-between mb-3">
          <CategoryImage category={category} />
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
              category.isActive === 1
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {category.isActive === 1 ? "Active" : "Inactive"}
          </span>
        </div>

        <h3 className="font-bold text-gray-900 text-lg mb-2">{category.categoryName}</h3>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Vehicle Type:</span>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
              {vehicleTypeName}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">ID:</span>
            <span className="font-mono text-xs text-gray-700">#{category.id}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Created:</span>
            <span className="text-xs text-gray-700">
              {category.createdAt
                ? new Date(category.createdAt).toLocaleDateString()
                : "N/A"}
            </span>
          </div>
        </div>

        <div className="flex gap-2 border-t pt-3">
          <button
            className="flex-1 flex items-center justify-center gap-1 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
            onClick={() => handleEditCategory(category)}
            disabled={loading}
          >
            <FaEdit /> Edit
          </button>
          <button
            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg transition-colors text-sm font-medium ${
              category.isActive === 1
                ? "text-orange-600 bg-orange-50 hover:bg-orange-100"
                : "text-green-600 bg-green-50 hover:bg-green-100"
            }`}
            onClick={() => handleToggleStatus(category.id)}
            disabled={loading}
          >
            {category.isActive === 1 ? <FaToggleOn /> : <FaToggleOff />}
            {category.isActive === 1 ? "Disable" : "Enable"}
          </button>
          <button
            className="px-3 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            onClick={() => setConfirmDeleteId(category.id)}
            disabled={loading}
          >
            <FaTrash />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">
          📋 All Categories
        </h1>
        {!formVisible && (
          <button
            onClick={() => setFormVisible(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-900 text-white rounded-lg hover:bg-indigo-700 transition shadow-md text-sm sm:text-base"
            disabled={loading}
          >
            <FaPlus />
            Add Category
          </button>
        )}
      </div>

      {/* Messages */}
      {success && (
        <div className="mb-4 p-3 sm:p-4 bg-green-100 text-green-700 rounded-lg border-l-4 border-green-500 shadow-md">
          <div className="flex items-start">
            <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-sm sm:text-base">{success}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 sm:p-4 bg-red-100 text-red-700 rounded-lg border-l-4 border-red-500 shadow-md">
          <div className="flex items-start">
            <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <p className="text-sm sm:text-base">{error}</p>
          </div>
        </div>
      )}

      {/* Form or List */}
      {formVisible ? (
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">
              {editingId ? "✏️ Edit Category" : "➕ Add New Category"}
            </h2>
            <button
              onClick={resetForm}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={loading}
            >
              <FaTimes className="text-gray-600 text-lg" />
            </button>
          </div>

          <form onSubmit={editingId ? handleSaveEditCategory : handleAddCategory}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Category Name */}
              <div>
                <label className="font-medium block mb-2 text-sm">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter category name"
                  className="border border-gray-300 p-2.5 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  value={formData.categoryName}
                  onChange={(e) => setFormData((s) => ({ ...s, categoryName: e.target.value }))}
                  required
                  maxLength={255}
                />
              </div>

              {/* Vehicle Type */}
              <div>
                <label className="font-medium block mb-2 text-sm">
                  Vehicle Type <span className="text-red-500">*</span>
                </label>
                <select
                  className="border border-gray-300 p-2.5 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  value={formData.vehicleTypeId}
                  onChange={(e) => setFormData((s) => ({ ...s, vehicleTypeId: e.target.value }))}
                  required
                >
                  <option value="">-- Select Vehicle Type --</option>
                  {vehicleTypes.map((vt) => (
                    <option key={vt.id} value={vt.id}>
                      {vt.name || vt.typeName}
                    </option>
                  ))}
                </select>
                {vehicleTypes.length === 0 && (
                  <p className="text-xs text-orange-600 mt-1">
                    ⚠️ No vehicle types available
                  </p>
                )}
              </div>

              {/* Image Upload */}
              <div className="sm:col-span-2">
                <label className="font-medium block mb-2 text-sm">Category Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="border border-gray-300 p-2.5 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supported: JPG, PNG, GIF, WebP. Max: 10MB
                </p>

                {imagePreview && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-600 mb-2">
                      {editingId && !formData.image ? "Current Image:" : "Preview:"}
                    </p>
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-lg border shadow-sm"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col-reverse sm:flex-row justify-end mt-6 gap-2">
              <button
                type="button"
                className="w-full sm:w-auto px-6 py-2.5 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition text-sm font-medium"
                onClick={resetForm}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-6 py-2.5 text-white bg-indigo-900 rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium shadow-md"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </div>
                ) : editingId ? (
                  "Save Changes"
                ) : (
                  "Add Category"
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white p-4 sm:p-6 shadow-md rounded-xl">
          {/* Search and Stats */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
            <div className="relative w-full sm:w-auto">
              <FaSearch className="absolute left-3 top-3 text-gray-400 text-sm" />
              <input
                type="text"
                placeholder="Search categories..."
                className="border border-gray-300 rounded-lg pl-10 pr-4 py-2 w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between w-full sm:w-auto gap-3">
              <div className="text-xs sm:text-sm text-gray-600">
                Total: <span className="font-semibold text-indigo-900">{totalElements}</span>
              </div>

              {/* View Toggle - Desktop only */}
              <div className="hidden sm:flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("table")}
                  className={`px-3 py-1.5 rounded-md transition-colors text-sm ${
                    viewMode === "table"
                      ? "bg-white text-indigo-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <FaList />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-3 py-1.5 rounded-md transition-colors text-sm ${
                    viewMode === "grid"
                      ? "bg-white text-indigo-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <FaTh />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          {pageLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-900 mb-4"></div>
              <span className="text-gray-600 text-sm">Loading categories...</span>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <FaSearch className="text-4xl mb-4" />
              <span className="text-sm">
                {searchQuery ? "No categories match your search" : "No categories found"}
              </span>
              {!searchQuery && (
                <button
                  onClick={() => setFormVisible(true)}
                  className="mt-4 px-4 py-2 bg-indigo-900 text-white rounded-lg hover:bg-indigo-700 transition text-sm"
                >
                  Add Your First Category
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Mobile: Grid */}
              <div className="block sm:hidden">
                <div className="grid grid-cols-1 gap-4">
                  {filteredData.map((category) => (
                    <CategoryCard key={category.id} category={category} />
                  ))}
                </div>
              </div>

              {/* Desktop: Table or Grid */}
              <div className="hidden sm:block">
                {viewMode === "grid" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredData.map((category) => (
                      <CategoryCard key={category.id} category={category} />
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg shadow">
                    <table className="w-full text-sm text-left text-gray-500">
                      <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                        <tr>
                          <th className="px-6 py-3">ID</th>
                          <th className="px-6 py-3">Image</th>
                          <th className="px-6 py-3">Category Name</th>
                          <th className="px-6 py-3">Vehicle Type</th>
                          <th className="px-6 py-3">Status</th>
                          <th className="px-6 py-3">Created</th>
                          <th className="px-6 py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredData.map((category) => {
                          // ✅ Use vehicleTypeId directly
                          const vehicleTypeId = category.vehicleTypeId;
                          const vehicleTypeName = getVehicleTypeName(vehicleTypeId);

                          return (
                            <tr
                              key={category.id}
                              className="bg-white border-b hover:bg-gray-50 transition-colors"
                            >
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
                                  {vehicleTypeName}
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
                                <div className="flex items-center space-x-1">
                                  <button
                                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                    onClick={() => handleEditCategory(category)}
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
                                    disabled={loading}
                                  >
                                    {category.isActive === 1 ? <FaToggleOn /> : <FaToggleOff />}
                                  </button>
                                  <button
                                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                    onClick={() => setConfirmDeleteId(category.id)}
                                    disabled={loading}
                                  >
                                    <FaTrash />
                                  </button>
                                  {category.image && (
                                    <button
                                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                      onClick={() => window.open(category.image, "_blank")}
                                    >
                                      <FaEye />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-6">
              <p className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
                Showing {totalElements === 0 ? 0 : currentPage * itemsPerPage + 1} to{" "}
                {Math.min((currentPage + 1) * itemsPerPage, totalElements)} of {totalElements}
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  className="px-3 py-2 text-xs sm:text-sm text-white bg-indigo-900 rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
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
                      className={`px-3 py-2 rounded-lg transition-colors text-xs sm:text-sm ${
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
                  className={`px-3 py-2 text-xs sm:text-sm rounded-lg transition-colors ${
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-4 sm:p-6 rounded-xl max-w-md w-full shadow-xl">
            <h3 className="text-lg font-bold mb-4">Confirm Action</h3>
            <p className="mb-6 text-gray-600 text-sm">
              Are you sure you want to change this category's status?
            </p>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
              <button
                className="w-full sm:w-auto px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm"
                onClick={() => setConfirmDeleteId(null)}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-red-400 text-sm"
                onClick={() => confirmDeleteCategory(confirmDeleteId)}
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
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
