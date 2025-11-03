import React, { useEffect, useState } from "react";
import { FaEdit, FaTrash, FaToggleOn, FaToggleOff, FaImage, FaSearch, FaPlus } from "react-icons/fa";
import apiClient, { BASE_URL } from "../../api/apiConfig";

const AllBrands = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [formVisible, setFormVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const [formData, setFormData] = useState({
    brandName: "",
    categoryId: "",
    image: null,
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [validationErrors, setValidationErrors] = useState({});

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  const BACKEND_URL = BASE_URL;

  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  // Helper function to get full image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;

    if (imagePath.startsWith("http")) {
      return imagePath;
    }

    let cleanPath = imagePath.trim();
    if (cleanPath.startsWith("/")) {
      cleanPath = cleanPath.substring(1);
    }
    if (cleanPath.startsWith("uploads/")) {
      cleanPath = cleanPath.substring(8);
    }

    if (cleanPath.includes("brands/")) {
      return `${BACKEND_URL}/uploads/${cleanPath}`;
    } else {
      return `${BACKEND_URL}/uploads/brands/${cleanPath}`;
    }
  };

  // Helper function for fallback image URLs
  const getFallbackImageUrls = (originalPath) => {
    if (!originalPath) return [];

    const cleanPath = originalPath
      .replace(BACKEND_URL, "")
      .replace(/^\/*/, "")
      .replace(/^uploads\//, "");
    const filename = cleanPath.includes("/") ? cleanPath.split("/").pop() : cleanPath;

    return [
      `${BACKEND_URL}/uploads/brands/${filename}`,
      `${BACKEND_URL}/uploads/${filename}`,
      `${BACKEND_URL}/uploads/brands/${cleanPath}`,
      `${BACKEND_URL}/uploads/${cleanPath}`,
    ].filter((url, index, self) => self.indexOf(url) === index);
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

  // ✅ Fetch all categories
  const fetchCategories = async () => {
    setCategoriesLoading(true);
    try {
      const response = await apiClient.get("/api/categories/active");

      console.log("✅ Categories API Full Response:", response.data);

      let categoriesData = [];

      // Try multiple response structure patterns
      if (response.data?.success && response.data?.data) {
        categoriesData = Array.isArray(response.data.data)
          ? response.data.data
          : response.data.data.content || response.data.data.categories || [];
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        categoriesData = response.data.data;
      } else if (Array.isArray(response.data)) {
        categoriesData = response.data;
      } else if (response.data?.content) {
        categoriesData = response.data.content;
      }

      setCategories(categoriesData || []);
      console.log("✅ Final Processed Categories:", categoriesData);
    } catch (error) {
      console.error("❌ Error fetching categories:", error);
      setError("Failed to load categories. Please refresh the page.");
    } finally {
      setCategoriesLoading(false);
    }
  };

  // ✅ Fetch Brands data with pagination - FIXED to include categoryId
  const fetchBrands = async (page = 0, size = 10) => {
    setLoading(true);
    setError("");
    try {
      const response = await apiClient.get(
        `/api/brands/all?page=${page}&size=${size}&sort=createdAt,desc`
      );

      console.log("✅ Brands API Full Response:", response.data);

      if (response.data && response.data.success) {
        const brandsData = response.data.data || [];

        // ✅ FIXED: Ensure categoryId is properly extracted
        const processedBrands = brandsData.map((brand, index) => {
          console.log("📊 Brand Data:", {
            brandId: brand.id,
            brandName: brand.brandName,
            categoryId: brand.categoryId || brand.category_id,
            fullBrand: brand,
          });

          return {
            ...brand,
            id: brand.id || brand.brandId || `fallback-${index}-${Date.now()}`,
            brandId: brand.id || brand.brandId || `fallback-${index}-${Date.now()}`,
            categoryId: brand.categoryId || brand.category_id || null, // ✅ FIXED
            brandImage: brand.brandImage ? getImageUrl(brand.brandImage) : null,
          };
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

  // Initialize: Fetch brands and categories
  useEffect(() => {
    fetchBrands(0, itemsPerPage);
    fetchCategories();
  }, []);

  // Validate form data
  const validateForm = () => {
    const errors = {};

    if (!formData.brandName || formData.brandName.trim().length === 0) {
      errors.brandName = "Brand name is required";
    } else if (formData.brandName.trim().length < 2) {
      errors.brandName = "Brand name must be at least 2 characters";
    } else if (formData.brandName.trim().length > 255) {
      errors.brandName = "Brand name must not exceed 255 characters";
    }

    if (!formData.categoryId || formData.categoryId === "") {
      errors.categoryId = "Category is required";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "categoryId") {
      setFormData({ ...formData, [name]: value.toString() });
      console.log("✅ Category Selected:", value);
    } else {
      setFormData({ ...formData, [name]: value });
    }

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
        setError("Invalid image format. Please upload JPEG, PNG, GIF, or WebP");
        return;
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        setError("Image size must not exceed 5MB");
        return;
      }

      setFormData({ ...formData, image: file });
      const preview = URL.createObjectURL(file);
      setImagePreview(preview);
      setError("");
    }
  };

  // ✅ Add Brand - FIXED
  const handleAddBrand = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("brandName", formData.brandName.trim());
      formDataToSend.append("categoryId", formData.categoryId); // ✅ FIXED
      if (formData.image) {
        formDataToSend.append("image", formData.image);
      }

      console.log("🚀 Adding Brand with Data:");
      console.log("  brandName:", formData.brandName.trim());
      console.log("  categoryId:", formData.categoryId);
      console.log("  image:", formData.image ? "present" : "none");

      const response = await apiClient.post("/api/brands/add", formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("✅ Add Brand Response:", response.data);

      if (response.data && response.data.success) {
        setSuccess(response.data.message || "Brand added successfully!");
        resetForm();
        fetchBrands(0, itemsPerPage);
      } else {
        setError(response.data?.message || "Failed to add brand");
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || "Error adding brand";
      setError(errorMessage);
      console.error("❌ Error adding brand:", error);
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ Update Brand - FIXED
  const handleUpdateBrand = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!editingId || editingId.toString().startsWith("fallback-")) {
      setError("Invalid brand ID");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("brandName", formData.brandName.trim());
      formDataToSend.append("categoryId", formData.categoryId); // ✅ FIXED
      if (formData.image) {
        formDataToSend.append("image", formData.image);
      }

      console.log("🚀 Updating Brand with Data:");
      console.log("  brandId:", editingId);
      console.log("  brandName:", formData.brandName.trim());
      console.log("  categoryId:", formData.categoryId);
      console.log("  image:", formData.image ? "present" : "none");

      const response = await apiClient.put(
        `/api/brands/update/${editingId}`,
        formDataToSend,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      console.log("✅ Update Brand Response:", response.data);

      if (response.data && response.data.success) {
        setSuccess(response.data.message || "Brand updated successfully!");
        resetForm();
        fetchBrands(currentPage, itemsPerPage);
      } else {
        setError(response.data?.message || "Failed to update brand");
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || "Error updating brand";
      setError(errorMessage);
      console.error("❌ Error updating brand:", error);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle form submit
  const handleSubmit = (e) => {
    if (editingId) {
      handleUpdateBrand(e);
    } else {
      handleAddBrand(e);
    }
  };

  // Toggle Status
  const handleToggleStatus = async (id) => {
    if (!id || id.toString().startsWith("fallback-")) {
      setError("Invalid brand ID");
      return;
    }

    setError("");
    setSuccess("");
    try {
      const response = await apiClient.get(`/api/brands/status/${id}`);
      if (response.data && response.data.success) {
        setSuccess("Status updated successfully!");
        fetchBrands(currentPage, itemsPerPage);
      } else {
        setError(response.data?.message || "Failed to update status");
      }
    } catch (error) {
      setError(error.response?.data?.message || "Error updating status");
    }
  };

  // Delete Brand
  const handleDeleteBrand = async (id) => {
    if (!id || id.toString().startsWith("fallback-")) {
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

        if (data.length === 1 && currentPage > 0) {
          fetchBrands(currentPage - 1, itemsPerPage);
        } else {
          fetchBrands(currentPage, itemsPerPage);
        }
      } else {
        setError(response.data?.message || "Failed to delete brand");
        setConfirmDeleteId(null);
      }
    } catch (error) {
      setError(error.response?.data?.message || "Error deleting brand");
      setConfirmDeleteId(null);
    }
  };

  // Edit form prefill
  const handleEditBrandClick = (brand) => {
    if (!brand || !brand.brandId || brand.brandId.toString().startsWith("fallback-")) {
      setError("Invalid brand data");
      return;
    }

    console.log("📝 Editing Brand:", brand);

    setEditingId(brand.brandId);
    setFormData({
      brandName: brand.brandName || "",
      categoryId: brand.categoryId ? brand.categoryId.toString() : "", // ✅ FIXED
      image: null,
    });

    if (brand.brandImage) {
      setImagePreview(brand.brandImage);
    } else {
      setImagePreview("");
    }

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
      brandName: "",
      categoryId: "",
      image: null,
    });
    setImagePreview("");
    setFormVisible(false);
    setError("");
    setSuccess("");
    setValidationErrors({});
    setSubmitting(false);
  };

  // Pagination handlers
  const handleNextPage = () => {
    if (hasNext) {
      fetchBrands(currentPage + 1, itemsPerPage);
    }
  };

  const handlePrevPage = () => {
    if (hasPrevious) {
      fetchBrands(currentPage - 1, itemsPerPage);
    }
  };

  const handlePageClick = (pageNumber) => {
    fetchBrands(pageNumber, itemsPerPage);
  };

  // Generate page numbers
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

  // Enhanced image error handler
  const handleImageError = (e, brandName, brandId) => {
    const fallbackUrls = getFallbackImageUrls(e.target.src);
    const currentIndex = parseInt(e.target.dataset.fallbackIndex || "0");
    const nextIndex = currentIndex + 1;

    if (nextIndex < fallbackUrls.length) {
      e.target.dataset.fallbackIndex = nextIndex.toString();
      e.target.src = fallbackUrls[nextIndex];
    } else {
      e.target.style.display = "none";
      const fallbackDiv = e.target.nextElementSibling;
      if (fallbackDiv) {
        fallbackDiv.style.display = "flex";
      }
    }
  };

  // Get category name by ID
  const getCategoryName = (categoryId) => {
    if (!categoryId) return "Uncategorized";
    const category = categories.find(
      (c) => parseInt(c.id || c.categoryId) === parseInt(categoryId)
    );
    return category?.categoryName || category?.name || "Unknown";
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4">
      {/* Header */}
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

      {/* Messages */}
      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center">
          <span>✓</span>
          <span className="ml-2">{success}</span>
        </div>
      )}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center">
          <span>✕</span>
          <span className="ml-2">{error}</span>
        </div>
      )}

      {/* Add/Edit Form */}
      {formVisible && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold mb-6">
            {editingId ? "Edit Brand" : "Add New Brand"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Brand Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="brandName"
                  value={formData.brandName}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition ${
                    validationErrors.brandName
                      ? "border-red-500 bg-red-50"
                      : "border-gray-300"
                  }`}
                  placeholder="Enter brand name"
                  maxLength="255"
                />
                {validationErrors.brandName && (
                  <p className="mt-1 text-sm text-red-600">
                    {validationErrors.brandName}
                  </p>
                )}
              </div>

              {/* Category Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleInputChange}
                  disabled={categoriesLoading}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition ${
                    validationErrors.categoryId
                      ? "border-red-500 bg-red-50"
                      : "border-gray-300"
                  }`}
                >
                  <option value="">
                    {categoriesLoading ? "Loading..." : "-- Select Category --"}
                  </option>
                  {Array.isArray(categories) &&
                    categories.map((cat) => (
                      <option
                        key={cat.id || cat.categoryId}
                        value={cat.id || cat.categoryId}
                      >
                        {cat.categoryName || cat.name}
                      </option>
                    ))}
                </select>
                {validationErrors.categoryId && (
                  <p className="mt-1 text-sm text-red-600">
                    {validationErrors.categoryId}
                  </p>
                )}
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand Image
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="file"
                    name="image"
                    onChange={handleImageChange}
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-20 h-20 object-cover rounded-md"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400"
              >
                {submitting ? "Saving..." : editingId ? "Update Brand" : "Add Brand"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6 relative">
        <FaSearch className="absolute left-3 top-3 text-gray-400" />
        <input
          type="text"
          placeholder="Search brands..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
        />
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-12">Loading brands...</div>
      ) : filteredData.length === 0 ? (
        <div className="text-center py-12">No brands found</div>
      ) : (
        <>
          {/* Brands Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Image</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Brand Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredData.map((brand) => (
                  <tr key={brand.brandId} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      {brand.brandImage ? (
                        <img
                          src={brand.brandImage}
                          alt={brand.brandName}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-200" />
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {brand.brandName}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getCategoryName(brand.categoryId)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => handleToggleStatus(brand.brandId)}
                        className={`px-3 py-1 rounded text-xs font-medium ${
                          brand.isActive === 1
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {brand.isActive === 1 ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {brand.createdAt
                        ? new Date(brand.createdAt).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      <button
                        onClick={() => handleEditBrandClick(brand)}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(brand.brandId)}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Delete Modal */}
          {confirmDeleteId && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-sm">
                <h3 className="text-lg font-medium mb-4">Confirm Delete</h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete this brand?
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteBrand(confirmDeleteId)}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex justify-between items-center">
              <div>
                Showing {currentPage * itemsPerPage + 1} to{" "}
                {Math.min((currentPage + 1) * itemsPerPage, totalElements)} of{" "}
                {totalElements}
              </div>
              <div className="space-x-2">
                <button
                  onClick={handlePrevPage}
                  disabled={!hasPrevious}
                  className="px-4 py-2 border rounded disabled:opacity-50"
                >
                  Previous
                </button>
                {getPageNumbers().map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageClick(page)}
                    className={`px-3 py-2 rounded ${
                      currentPage === page
                        ? "bg-indigo-600 text-white"
                        : "border hover:bg-gray-100"
                    }`}
                  >
                    {page + 1}
                  </button>
                ))}
                <button
                  onClick={handleNextPage}
                  disabled={!hasNext}
                  className="px-4 py-2 border rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AllBrands;
