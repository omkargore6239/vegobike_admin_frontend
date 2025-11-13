// AllModels.jsx - FULLY MOBILE RESPONSIVE + brandId Support ✅

import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  FaEdit,
  FaTrash,
  FaImage,
  FaSearch,
  FaPlus,
  FaTimes,
  FaList,
  FaTh,
  FaEye,
  FaToggleOn,
  FaToggleOff,
} from "react-icons/fa";
import apiClient, { BASE_URL } from "../../api/apiConfig";

const AllModels = () => {
  // State
  const [data, setData] = useState([]);
  const [brands, setBrands] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [formVisible, setFormVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [viewMode, setViewMode] = useState("table");

  const [formData, setFormData] = useState({
    brandId: "",
    modelName: "",
    image: null,
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [validationErrors, setValidationErrors] = useState({});

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  // Image error tracking
  const imageErrorTrackerRef = useRef(new Set());

  const BACKEND_URL = BASE_URL;

  // Helper: Get full image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http")) return imagePath;

    let cleanPath = imagePath.trim();
    cleanPath = cleanPath.replace(/^\/+/, "");
    cleanPath = cleanPath.replace(/^uploads\/\/uploads\/models\/+/, "");
    cleanPath = cleanPath.replace(/^uploads\/models\/+/, "");
    cleanPath = cleanPath.replace(/^uploads\/+/, "");
    cleanPath = cleanPath.replace(/^models\/+/, "");

    const filename = cleanPath.split("/").pop();
    return `${BACKEND_URL}/uploads/models/${filename}`;
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

  // ✅ Fetch Brands
  const fetchBrands = async () => {
    setBrandsLoading(true);
    try {
      const response = await apiClient.get("/api/brands/active");

      console.log("✅ Brands API Response:", response.data);

      let brandsData = [];
      if (response.data?.success && response.data?.data) {
        brandsData = Array.isArray(response.data.data)
          ? response.data.data
          : response.data.data.content || [];
      } else if (Array.isArray(response.data)) {
        brandsData = response.data;
      }

      setBrands(brandsData || []);
      console.log("✅ Brands loaded:", brandsData.length);
    } catch (error) {
      console.error("❌ Error fetching brands:", error);
      setError("Failed to load brands");
    } finally {
      setBrandsLoading(false);
    }
  };

  // ✅ Fetch Models
  const fetchModels = async (page = 0, size = 10) => {
    setLoading(true);
    setError("");
    try {
      const response = await apiClient.get(
        `/api/models/all?page=${page}&size=${size}&sort=createdAt,desc`
      );

      console.log("✅ Models API Response:", response.data);

      if (response.data && response.data.success) {
        const modelsData = response.data.data || [];

        const processedModels = modelsData.map((model) => ({
          ...model,
          id: model.id || model.modelId,
          brandId: model.brandId || null,
          modelImage: model.modelImage ? getImageUrl(model.modelImage) : null,
        }));

        setData(processedModels);

        if (response.data.pagination) {
          setCurrentPage(response.data.pagination.currentPage);
          setTotalPages(response.data.pagination.totalPages);
          setTotalElements(response.data.pagination.totalElements);
          setHasNext(response.data.pagination.hasNext);
          setHasPrevious(response.data.pagination.hasPrevious);
        }
      } else {
        setError("Failed to fetch models");
        setData([]);
      }
    } catch (error) {
      console.error("❌ Error fetching models:", error);
      setError(error.response?.data?.message || "Error fetching models");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchModels(0, itemsPerPage);
    fetchBrands();
  }, []);

  // Search filter
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const query = searchQuery.toLowerCase();
    return data.filter((model) =>
      model.modelName?.toLowerCase().includes(query)
    );
  }, [data, searchQuery]);

  // Get brand name by ID
  const getBrandName = (brandId) => {
    if (!brandId) return "Unknown";
    const brand = brands.find(
      (b) => parseInt(b.id || b.brandId) === parseInt(brandId)
    );
    return brand?.brandName || brand?.name || "Unknown";
  };

  // Validate form
  const validateForm = () => {
    const errors = {};

    if (!formData.modelName || formData.modelName.trim().length === 0) {
      errors.modelName = "Model name is required";
    } else if (formData.modelName.trim().length < 2) {
      errors.modelName = "Model name must be at least 2 characters";
    } else if (formData.modelName.trim().length > 100) {
      errors.modelName = "Model name must not exceed 100 characters";
    }

    if (!formData.brandId || formData.brandId === "") {
      errors.brandId = "Brand is required";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (validationErrors[name]) {
      setValidationErrors({ ...validationErrors, [name]: "" });
    }
  };

  // Handle image change
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      if (!validTypes.includes(file.type)) {
        setError("Invalid image format");
        return;
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        setError("Image size must not exceed 5MB");
        return;
      }

      setFormData({ ...formData, image: file });
      setImagePreview(URL.createObjectURL(file));
      setError("");
    }
  };

  // Add Model
  const handleAddModel = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("brandId", formData.brandId);
      formDataToSend.append("modelName", formData.modelName.trim());
      if (formData.image) {
        formDataToSend.append("modelImage", formData.image);
      }

      console.log("🚀 Adding Model:", {
        brandId: formData.brandId,
        modelName: formData.modelName.trim(),
      });

      const response = await apiClient.post("/api/models/add", formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data && response.data.success) {
        setSuccess(response.data.message || "Model added successfully!");
        resetForm();
        fetchModels(0, itemsPerPage);
      } else {
        setError(response.data?.message || "Failed to add model");
      }
    } catch (error) {
      setError(error.response?.data?.message || "Error adding model");
      console.error("❌ Error adding model:", error);
    } finally {
      setSubmitting(false);
    }
  };

  // Update Model
  const handleUpdateModel = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const formDataToSend = new FormData();

      const requestData = {
        brandId: formData.brandId,
        modelName: formData.modelName.trim(),
      };

      formDataToSend.append(
        "request",
        new Blob([JSON.stringify(requestData)], {
          type: "application/json",
        })
      );

      if (formData.image) {
        formDataToSend.append("image", formData.image);
      }

      const response = await apiClient.post(
        `/api/models/edit/${editingId}`,
        formDataToSend,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (response.data && response.data.success) {
        setSuccess(response.data.message || "Model updated successfully!");
        resetForm();
        fetchModels(currentPage, itemsPerPage);
      } else {
        setError(response.data?.message || "Failed to update model");
      }
    } catch (error) {
      setError(error.response?.data?.message || "Error updating model");
      console.error("❌ Error updating model:", error);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Model
  const handleDeleteModel = async (id) => {
    setError("");
    setSuccess("");
    try {
      const response = await apiClient.delete(`/api/models/delete/${id}`);
      if (response.data && response.data.success) {
        setSuccess("Model deleted successfully!");
        setConfirmDeleteId(null);

        if (data.length === 1 && currentPage > 0) {
          fetchModels(currentPage - 1, itemsPerPage);
        } else {
          fetchModels(currentPage, itemsPerPage);
        }
      } else {
        setError(response.data?.message || "Failed to delete model");
        setConfirmDeleteId(null);
      }
    } catch (error) {
      setError(error.response?.data?.message || "Error deleting model");
      setConfirmDeleteId(null);
    }
  };

  // Edit Model
  const handleEditModelClick = (model) => {
    console.log("📝 Editing Model:", model);

    setEditingId(model.id);
    setFormData({
      brandId: model.brandId ? model.brandId.toString() : "",
      modelName: model.modelName || "",
      image: null,
    });

    setImagePreview(model.modelImage || "");
    setFormVisible(true);
    setError("");
    setSuccess("");
    setValidationErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    setValidationErrors({});
    setSubmitting(false);
  };

  // Pagination
  const handleNextPage = () => {
    if (hasNext) fetchModels(currentPage + 1, itemsPerPage);
  };

  const handlePrevPage = () => {
    if (hasPrevious) fetchModels(currentPage - 1, itemsPerPage);
  };

  const handlePageClick = (pageNumber) => {
    fetchModels(pageNumber, itemsPerPage);
  };

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

  // Image error handler
  const handleImageError = (e, modelId) => {
    const key = `${modelId}-${e.target.src}`;
    if (imageErrorTrackerRef.current.has(key)) {
      e.target.style.display = "none";
      return;
    }
    imageErrorTrackerRef.current.add(key);
    e.target.style.display = "none";
  };

  // Model Image Component
  const ModelImage = ({ model }) => {
    if (!model.modelImage) {
      return (
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">
          <FaImage className="text-lg sm:text-xl" />
        </div>
      );
    }

    return (
      <img
        src={model.modelImage}
        alt={model.modelName}
        className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-lg border-2 border-gray-200 shadow-sm bg-white"
        onError={(e) => handleImageError(e, model.id)}
        loading="lazy"
      />
    );
  };

  // Model Card Component (Mobile)
  const ModelCard = ({ model }) => {
    return (
      <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow p-4 border border-gray-200">
        <div className="flex items-start justify-between mb-3">
          <ModelImage model={model} />
          <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
            {getBrandName(model.brandId)}
          </span>
        </div>

        <h3 className="font-bold text-gray-900 text-lg mb-2">{model.modelName}</h3>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">ID:</span>
            <span className="font-mono text-xs text-gray-700">#{model.id}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Created:</span>
            <span className="text-xs text-gray-700">
              {model.createdAt
                ? new Date(model.createdAt).toLocaleDateString()
                : "N/A"}
            </span>
          </div>
        </div>

        <div className="flex gap-2 border-t pt-3">
          <button
            className="flex-1 flex items-center justify-center gap-1 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
            onClick={() => handleEditModelClick(model)}
            disabled={submitting}
          >
            <FaEdit /> Edit
          </button>
          <button
            className="px-3 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            onClick={() => setConfirmDeleteId(model.id)}
            disabled={submitting}
          >
            <FaTrash />
          </button>
          {model.modelImage && (
            <button
              className="px-3 py-2 text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={() => window.open(model.modelImage, "_blank")}
            >
              <FaEye />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen p-3 sm:p-4 md:p-6">
      {/* Header - Mobile Responsive */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">
            🚗 Models Management
          </h1>
          <p className="text-gray-600 text-sm sm:text-base mt-1">
            Manage your vehicle models catalog ({totalElements} models)
          </p>
        </div>
        {!formVisible && (
          <button
            onClick={() => setFormVisible(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-900 text-white rounded-lg hover:bg-indigo-700 transition shadow-md text-sm sm:text-base"
            disabled={loading}
          >
            <FaPlus />
            Add New Model
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

      {/* Form */}
      {formVisible && (
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg mb-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">
              {editingId ? "✏️ Edit Model" : "➕ Add New Model"}
            </h2>
            <button
              onClick={resetForm}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={submitting}
            >
              <FaTimes className="text-gray-600 text-lg" />
            </button>
          </div>

          <form onSubmit={editingId ? handleUpdateModel : handleAddModel}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Brand */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand <span className="text-red-500">*</span>
                </label>
                <select
                  name="brandId"
                  value={formData.brandId}
                  onChange={handleInputChange}
                  disabled={brandsLoading || submitting}
                  className={`w-full px-3 py-2.5 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition ${
                    validationErrors.brandId
                      ? "border-red-500 bg-red-50"
                      : "border-gray-300"
                  }`}
                >
                  <option value="">
                    {brandsLoading ? "Loading..." : "-- Select Brand --"}
                  </option>
                  {brands.map((brand) => (
                    <option key={brand.id || brand.brandId} value={brand.id || brand.brandId}>
                      {brand.brandName || brand.name}
                    </option>
                  ))}
                </select>
                {validationErrors.brandId && (
                  <p className="mt-1 text-xs text-red-600">
                    {validationErrors.brandId}
                  </p>
                )}
              </div>

              {/* Model Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Model Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="modelName"
                  value={formData.modelName}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2.5 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition ${
                    validationErrors.modelName
                      ? "border-red-500 bg-red-50"
                      : "border-gray-300"
                  }`}
                  placeholder="Enter model name"
                  maxLength="100"
                />
                {validationErrors.modelName && (
                  <p className="mt-1 text-xs text-red-600">
                    {validationErrors.modelName}
                  </p>
                )}
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Model Image
                </label>
                <input
                  type="file"
                  name="image"
                  onChange={handleImageChange}
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                <p className="text-xs text-gray-500 mt-1">Max: 5MB</p>
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="mt-3 w-20 h-20 sm:w-24 sm:h-24 object-contain rounded-lg border-2 border-indigo-200 shadow-sm bg-white"
                  />
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col-reverse sm:flex-row justify-end mt-6 gap-2">
              <button
                type="button"
                onClick={resetForm}
                className="w-full sm:w-auto px-6 py-2.5 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition text-sm font-medium"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-6 py-2.5 text-white bg-indigo-900 rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium shadow-md"
              >
                {submitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </div>
                ) : editingId ? (
                  "Update Model"
                ) : (
                  "Add Model"
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search and View Toggle */}
      {!formVisible && (
        <div className="bg-white p-4 sm:p-6 shadow-md rounded-xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
            <div className="relative w-full sm:w-auto">
              <FaSearch className="absolute left-3 top-3 text-gray-400 text-sm" />
              <input
                type="text"
                placeholder="Search models..."
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
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-900 mb-4"></div>
              <span className="text-gray-600 text-sm">Loading models...</span>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <FaSearch className="text-4xl mb-4" />
              <span className="text-sm">
                {searchQuery ? "No models match your search" : "No models found"}
              </span>
              {!searchQuery && (
                <button
                  onClick={() => setFormVisible(true)}
                  className="mt-4 px-4 py-2 bg-indigo-900 text-white rounded-lg hover:bg-indigo-700 transition text-sm"
                >
                  Add Your First Model
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Mobile: Grid */}
              <div className="block sm:hidden">
                <div className="grid grid-cols-1 gap-4">
                  {filteredData.map((model) => (
                    <ModelCard key={model.id} model={model} />
                  ))}
                </div>
              </div>

              {/* Desktop: Table or Grid */}
              <div className="hidden sm:block">
                {viewMode === "grid" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredData.map((model) => (
                      <ModelCard key={model.id} model={model} />
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg shadow">
                    <table className="w-full text-sm text-left text-gray-500">
                      <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                        <tr>
                          <th className="px-6 py-3">#</th>
                          <th className="px-6 py-3">Image</th>
                          <th className="px-6 py-3">Model Name</th>
                          <th className="px-6 py-3">Brand</th>
                          <th className="px-6 py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredData.map((model, index) => (
                          <tr
                            key={model.id}
                            className="bg-white border-b hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-4 font-medium text-gray-900">
                              {currentPage * itemsPerPage + index + 1}
                            </td>
                            <td className="px-6 py-4">
                              <ModelImage model={model} />
                            </td>
                            <td className="px-6 py-4 font-medium text-gray-900">
                              {model.modelName}
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                {getBrandName(model.brandId)}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-1">
                                <button
                                  className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                  onClick={() => handleEditModelClick(model)}
                                  disabled={submitting}
                                >
                                  <FaEdit />
                                </button>
                                <button
                                  className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                  onClick={() => setConfirmDeleteId(model.id)}
                                  disabled={submitting}
                                >
                                  <FaTrash />
                                </button>
                                {model.modelImage && (
                                  <button
                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    onClick={() => window.open(model.modelImage, "_blank")}
                                  >
                                    <FaEye />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
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
                  disabled={!hasPrevious || loading}
                  onClick={handlePrevPage}
                >
                  Previous
                </button>
                {getPageNumbers().map((page) => (
                  <button
                    key={page}
                    className={`px-3 py-2 rounded-lg transition-colors text-xs sm:text-sm ${
                      currentPage === page
                        ? "bg-indigo-900 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                    onClick={() => handlePageClick(page)}
                    disabled={loading}
                  >
                    {page + 1}
                  </button>
                ))}
                <button
                  disabled={!hasNext || loading}
                  onClick={handleNextPage}
                  className={`px-3 py-2 text-xs sm:text-sm rounded-lg transition-colors ${
                    !hasNext
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
            <h3 className="text-lg font-bold mb-4">Confirm Delete</h3>
            <p className="mb-6 text-gray-600 text-sm">
              Are you sure you want to delete this model? This action cannot be undone.
            </p>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
              <button
                className="w-full sm:w-auto px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm"
                onClick={() => setConfirmDeleteId(null)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-red-400 text-sm"
                onClick={() => handleDeleteModel(confirmDeleteId)}
                disabled={submitting}
              >
                {submitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </div>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllModels;
  