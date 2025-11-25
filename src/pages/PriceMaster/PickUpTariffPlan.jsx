import React, { useEffect, useState } from "react";
import { FaEdit, FaTrash, FaPlus, FaSearch, FaToggleOn, FaToggleOff, FaExclamationTriangle, FaRedo, FaCheck, FaTimes, FaArrowLeft, FaClock, FaCalendarAlt } from "react-icons/fa";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import apiClient, { BASE_URL } from "../../api/apiConfig";

const PriceManagement = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Pagination from backend
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
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [validationErrors, setValidationErrors] = useState({});

  // Add after existing state declarations
const [filterCategoryName, setFilterCategoryName] = useState("");
const [filterMinPrice, setFilterMinPrice] = useState("");
const [filterMaxPrice, setFilterMaxPrice] = useState("");
const [filterDays, setFilterDays] = useState("");
const [sortBy, setSortBy] = useState("id");
const [sortDir, setSortDir] = useState("desc");

  
  // Pricing type state
  const [pricingType, setPricingType] = useState("daily"); // "hourly" or "daily"
  
  const [formData, setFormData] = useState({
    categoryId: "",
    days: "",
    price: "",
    deposit: "",
    hourlyChargeAmount: "",
    isActive: 1,
  });
  
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // ✅ ERROR HANDLING UTILITIES
  const ErrorTypes = {
    NETWORK: 'NETWORK',
    VALIDATION: 'VALIDATION',
    PERMISSION: 'PERMISSION',
    NOT_FOUND: 'NOT_FOUND',
    SERVER: 'SERVER',
    DUPLICATE: 'DUPLICATE',
    UNKNOWN: 'UNKNOWN'
  };

  const getErrorInfo = (error) => {
    let type = ErrorTypes.UNKNOWN;
    let message = "An unexpected error occurred";
    let isRetryable = false;
    let suggestions = [];

    if (!error) return { type, message, isRetryable, suggestions };

    if (error.code === 'ERR_NETWORK' || error.message?.toLowerCase().includes('network')) {
      type = ErrorTypes.NETWORK;
      message = `Unable to connect to the server`;
      isRetryable = true;
      suggestions = ["Check your internet connection", "Verify the backend server is running"];
    } else if (error.response?.status) {
      const status = error.response.status;
      const serverMessage = error.response.data?.message || error.response.data?.error;

      switch (status) {
        case 400:
          type = ErrorTypes.VALIDATION;
          message = serverMessage || "Invalid request data";
          break;
        case 409:
          type = ErrorTypes.DUPLICATE;
          message = serverMessage || "This combination already exists";
          break;
        case 500:
        case 502:
        case 503:
          type = ErrorTypes.SERVER;
          message = "Server error occurred";
          isRetryable = true;
          break;
        default:
          message = serverMessage || `Server error ${status}`;
          isRetryable = status >= 500;
      }
    } else if (error.message) {
      message = error.message;
    }

    return { type, message, isRetryable, suggestions };
  };

  const showErrorNotification = (error, context = "") => {
    const errorInfo = getErrorInfo(error);
    const contextMessage = context ? `${context}: ` : "";

    toast.error(`${contextMessage}${errorInfo.message}`, {
      position: "top-right",
      autoClose: 5000,
    });

    setError(`${contextMessage}${errorInfo.message}`);
    return errorInfo;
  };

  // ✅ VALIDATION
  // VALIDATION
const validateForm = () => {
  const errors = {};
  const fieldErrors = [];

  // Category validation
  if (!formData.categoryId || !formData.categoryId) {
    errors.categoryId = "Category is required";
    fieldErrors.push("Please select a category");
  }

  // For DAILY pricing - validate days and price
  if (pricingType === "daily") {
    // Days validation - only for daily
    if (!formData.days || formData.days === null || formData.days === undefined || formData.days === "") {
      errors.days = "Number of days is required";
      fieldErrors.push("Please enter number of days");
    } else {
      const daysValue = parseInt(formData.days);
      if (isNaN(daysValue) || daysValue <= 0) {
        errors.days = "Days must be greater than 0";
        fieldErrors.push("Days must be greater than 0");
      } else if (daysValue > 365) {
        errors.days = "Days cannot exceed 365";
        fieldErrors.push("Days cannot exceed 365");
      }
    }

    // Price validation for daily
    if (!formData.price || formData.price === "") {
      errors.price = "Price is required";
      fieldErrors.push("Please enter a price");
    } else {
      const priceValue = parseFloat(formData.price);
      if (isNaN(priceValue) || priceValue <= 0) {
        errors.price = "Price must be greater than 0";
        fieldErrors.push("Price must be greater than 0");
      }
    }
  }
  
  // For HOURLY pricing - validate hourly charge
  if (pricingType === "hourly") {
    // Hourly charge validation
    if (!formData.hourlyChargeAmount || formData.hourlyChargeAmount === "") {
      errors.hourlyChargeAmount = "Hourly charge is required";
      fieldErrors.push("Please enter hourly charge amount");
    } else {
      const hourlyValue = parseFloat(formData.hourlyChargeAmount);
      if (isNaN(hourlyValue) || hourlyValue <= 0) {
        errors.hourlyChargeAmount = "Hourly charge must be greater than 0";
        fieldErrors.push("Hourly charge must be greater than 0");
      }
    }

    // Base price validation for hourly (optional, but if provided must be valid)
    if (formData.price && formData.price !== "") {
      const priceValue = parseFloat(formData.price);
      if (isNaN(priceValue) || priceValue < 0) {
        errors.price = "Base price must be 0 or greater";
        fieldErrors.push("Base price must be valid");
      }
    }
  }

  // Deposit validation (common for both)
  if (!formData.deposit || formData.deposit === "") {
    errors.deposit = "Deposit is required";
    fieldErrors.push("Please enter deposit amount");
  } else {
    const depositValue = parseFloat(formData.deposit);
    if (isNaN(depositValue) || depositValue < 0) {
      errors.deposit = "Deposit cannot be negative";
      fieldErrors.push("Deposit cannot be negative");
    }
  }

  // Check duplicates
  if (!editingId && formData.categoryId) {
    const daysToCheck = pricingType === "hourly" ? 0 : parseInt(formData.days);
    const duplicate = data.find(
      (item) =>
        String(item.categoryId) === String(formData.categoryId) &&
        parseInt(item.days) === daysToCheck
    );
    if (duplicate) {
      errors.duplicate = "This combination already exists";
      fieldErrors.push(
        `A price for ${getCategoryName(formData.categoryId)} - ${getDaysDisplay(
          daysToCheck
        )} already exists`
      );
    }
  }

  setValidationErrors(errors);
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    fieldErrors,
  };
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

  // Handle search
  const handleSearch = () => {
  fetchPriceLists(
    0, // Reset to first page on new search
    itemsPerPage,
    filterCategoryName,
    filterMinPrice,
    filterMaxPrice,
    filterDays,
    sortBy,
    sortDir
  );
};

const handleClearFilters = () => {
  setFilterCategoryName("");
  setFilterMinPrice("");
  setFilterMaxPrice("");
  setFilterDays("");
  setSearchQuery("");
  fetchPriceLists(0, itemsPerPage, "", "", "", "", sortBy, sortDir);
};


  // Fetch Price Lists
  const fetchPriceLists = async (
  page = 0,
  size = 10,
  categoryName = "",
  minPrice = "",
  maxPrice = "",
  days = "",
  sortByParam = "id",
  sortDirParam = "desc",
  retryAttempt = 0
) => {
  setLoading(true);
  setError("");

  try {
    // Build params object, only include non-empty values
    const params = {
      page,
      size,
      sortBy: sortByParam,
      sortDir: sortDirParam
    };

    if (categoryName && categoryName.trim() !== "") {
      params.categoryName = categoryName.trim();
    }
    if (minPrice && minPrice !== "") {
      params.minPrice = parseFloat(minPrice);
    }
    if (maxPrice && maxPrice !== "") {
      params.maxPrice = parseFloat(maxPrice);
    }
    if (days && days !== "") {
      params.days = parseInt(days);
    }

    const response = await apiClient.get("/api/prices/all", { params });

    if (response.data && response.data.success) {
      const priceData = response.data.data || [];
      setData(priceData);
      setFilteredData(priceData);
      setRetryCount(0);

      if (response.data.pagination) {
        setCurrentPage(response.data.pagination.currentPage);
        setTotalPages(response.data.pagination.totalPages);
        setTotalElements(response.data.pagination.totalElements);
        setHasNext(response.data.pagination.hasNext);
        setHasPrevious(response.data.pagination.hasPrevious);
      }
    } else {
      setError("Failed to fetch price lists");
      setData([]);
      setFilteredData([]);
    }
  } catch (error) {
    const errorInfo = showErrorNotification(error, "Failed to fetch price lists");
    setData([]);
    setFilteredData([]);

    if (errorInfo.isRetryable && retryAttempt < 2) {
      setRetryCount(retryAttempt + 1);
      setTimeout(
        () => fetchPriceLists(page, size, categoryName, minPrice, maxPrice, days, sortByParam, sortDirParam, retryAttempt + 1),
        3000 * (retryAttempt + 1)
      );
    }
  } finally {
    setLoading(false);
  }
};


  // Fetch Categories
  const fetchCategories = async (retryAttempt = 0) => {
    setCategoriesLoading(true);
    try {
      const response = await apiClient.get("/api/categories/active");

      let categoriesData = [];
      if (response.data?.success && response.data.data) {
        categoriesData = response.data.data;
      } else if (Array.isArray(response.data)) {
        categoriesData = response.data;
      }

      setCategories(categoriesData);

      if (categoriesData.length === 0) {
        setError("No active categories found. Please add categories first.");
      }
    } catch (error) {
      const errorInfo = showErrorNotification(error, "Failed to load categories");

      if (errorInfo.isRetryable && retryAttempt < 2) {
        setTimeout(() => fetchCategories(retryAttempt + 1), 2000 * (retryAttempt + 1));
      }
    } finally {
      setCategoriesLoading(false);
    }
  };

  useEffect(() => {
  const loadData = async () => {
    await Promise.all([
      fetchPriceLists(0, itemsPerPage, "", "", "", "", sortBy, sortDir),
      fetchCategories()
    ]);
  };
  loadData();
}, []); // Keep empty dependency array for initial load only


  // Handle pricing type change
  // Handle pricing type change
const handlePricingTypeChange = (type) => {
  setPricingType(type);
  
  if (type === "hourly") {
    // For hourly: set days to 0, clear price, keep/initialize hourlyChargeAmount
    setFormData((prev) => ({
      ...prev,
      days: "0",  // Set to string "0" for consistency
      price: "",  // Clear price for hourly
      hourlyChargeAmount: prev.hourlyChargeAmount || "", // Keep existing or empty
    }));
  } else {
    // For daily: clear days and hourlyChargeAmount
    setFormData((prev) => ({
      ...prev,
      days: "",  // Clear days for user to enter
      hourlyChargeAmount: "", // Clear hourly charge
      price: prev.price || "", // Keep existing price
    }));
  }
  
  // Clear validation errors when switching types
  setValidationErrors({});
};


  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type } = e.target;

    if (name === "isActive") {
      setFormData(prev => ({ ...prev, [name]: value === "1" ? 1 : 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: type === 'number' ? value : value }));
    }

    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: undefined }));
    }

    if (error) {
      setError("");
    }
  };

  // Add Price List
  // Add Price List
const handleAddPrice = async (e) => {
  e.preventDefault();
  setError("");
  setSuccess("");
  setSubmitting(true);
  setValidationErrors({});

  const validation = validateForm();
  if (!validation.isValid) {
    setError(validation.fieldErrors[0]);
    setSubmitting(false);
    return;
  }

  // Build payload based on pricing type
  const payload = {
    categoryId: parseInt(formData.categoryId),
    days: pricingType === "hourly" ? 0 : parseInt(formData.days),
    deposit: parseFloat(formData.deposit),
    isActive: parseInt(formData.isActive),
  };

  // Add price based on pricing type
  if (pricingType === "hourly") {
    payload.price = parseFloat(formData.hourlyChargeAmount); // Use hourly charge as price
    payload.hourlyChargeAmount = parseFloat(formData.hourlyChargeAmount);
  } else {
    payload.price = parseFloat(formData.price);
    payload.hourlyChargeAmount = null;
  }

  console.log("📤 Sending payload:", payload); // Debug log

  try {
    const response = await apiClient.post("/api/prices/add", payload);

    if (response.data && response.data.success) {
      toast.success("Price list added successfully!");
      resetForm();
      await fetchPriceLists(currentPage, itemsPerPage);
    } else {
      const errorMsg = response.data?.message || "Failed to add price list";
      setError(errorMsg);
      toast.error(errorMsg);
    }
  } catch (error) {
    showErrorNotification(error, "Failed to add price list");
  } finally {
    setSubmitting(false);
  }
};


  // Edit Price List
  // Edit Price List
const handleEditPrice = async (e) => {
  e.preventDefault();
  setError("");
  setSuccess("");
  setSubmitting(true);
  setValidationErrors({});

  const validation = validateForm();
  if (!validation.isValid) {
    setError(validation.fieldErrors[0]);
    setSubmitting(false);
    return;
  }

  // Build payload based on pricing type
  const payload = {
    categoryId: parseInt(formData.categoryId),
    days: pricingType === "hourly" ? 0 : parseInt(formData.days),
    deposit: parseFloat(formData.deposit),
    isActive: parseInt(formData.isActive),
  };

  // Add price based on pricing type
  if (pricingType === "hourly") {
    payload.price = parseFloat(formData.hourlyChargeAmount);
    payload.hourlyChargeAmount = parseFloat(formData.hourlyChargeAmount);
  } else {
    payload.price = parseFloat(formData.price);
    payload.hourlyChargeAmount = null;
  }

  console.log("📤 Updating payload:", payload); // Debug log

  try {
    const response = await apiClient.put(`/api/prices/${editingId}`, payload);

    if (response.data && response.data.success) {
      toast.success("Price list updated successfully!");
      resetForm();
      await fetchPriceLists(currentPage, itemsPerPage);
    } else {
      const errorMsg = response.data?.message || "Failed to update price list";
      setError(errorMsg);
      toast.error(errorMsg);
    }
  } catch (error) {
    showErrorNotification(error, "Failed to update price list");
  } finally {
    setSubmitting(false);
  }
};


  // Delete Price List
  const handleDeletePrice = async (id) => {
    if (!id) {
      setError("Invalid price list ID");
      setConfirmDeleteId(null);
      return;
    }

    try {
      const response = await apiClient.delete(`/api/prices/${id}`);

      if (response.data && response.data.success) {
        toast.success("✅ Price list deleted successfully!");
        setConfirmDeleteId(null);

        if (data.length === 1 && currentPage > 0) {
          await fetchPriceLists(currentPage - 1, itemsPerPage);
        } else {
          await fetchPriceLists(currentPage, itemsPerPage);
        }
      } else {
        const errorMsg = response.data?.message || "Failed to delete price list";
        toast.error(errorMsg);
        setConfirmDeleteId(null);
      }
    } catch (error) {
      showErrorNotification(error, "Failed to delete price list");
      setConfirmDeleteId(null);
    }
  };

  // Toggle Status
  const handleToggleStatus = async (id, currentStatus) => {
    if (!id) return;

    try {
      const newStatus = currentStatus === 1 ? 0 : 1;
      const response = await apiClient.put(`/api/prices/${id}/status`, null, {
        params: { isActive: newStatus }
      });

      if (response.data && response.data.success) {
        toast.success(`✅ Price list ${newStatus === 1 ? 'activated' : 'deactivated'} successfully!`);
        await fetchPriceLists(currentPage, itemsPerPage);
      }
    } catch (error) {
      showErrorNotification(error, "Failed to update status");
    }
  };

  // Edit form prefill
  const handleEditPriceClick = (priceItem) => {
    if (!priceItem || !priceItem.id) {
      setError("Invalid price data");
      return;
    }

    setEditingId(priceItem.id);
    const isHourly = priceItem.days === 0;
    setPricingType(isHourly ? "hourly" : "daily");
    
    setFormData({
      categoryId: priceItem.categoryId || "",
      days: isHourly ? "0" : (priceItem.days || ""),
      price: priceItem.price || "",
      deposit: priceItem.deposit || "",
      hourlyChargeAmount: priceItem.hourlyChargeAmount || "",
      isActive: priceItem.isActive !== 0 ? 1 : 0,
    });
    
    setFormVisible(true);
    setValidationErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset Form
  const resetForm = () => {
    setEditingId(null);
    setPricingType("daily");
    setFormData({
      categoryId: "",
      days: "",
      price: "",
      deposit: "",
      hourlyChargeAmount: "",
      isActive: 1,
    });
    setFormVisible(false);
    setError("");
    setSuccess("");
    setSubmitting(false);
    setValidationErrors({});
  };

  const handleNextPage = () => {
  if (hasNext) {
    fetchPriceLists(
      currentPage + 1,
      itemsPerPage,
      filterCategoryName,
      filterMinPrice,
      filterMaxPrice,
      filterDays,
      sortBy,
      sortDir
    );
  }
};

const handlePrevPage = () => {
  if (hasPrevious) {
    fetchPriceLists(
      currentPage - 1,
      itemsPerPage,
      filterCategoryName,
      filterMinPrice,
      filterMaxPrice,
      filterDays,
      sortBy,
      sortDir
    );
  }
};

const handlePageClick = (pageNumber) => {
  fetchPriceLists(
    pageNumber,
    itemsPerPage,
    filterCategoryName,
    filterMinPrice,
    filterMaxPrice,
    filterDays,
    sortBy,
    sortDir
  );
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

  const getCurrentPageData = () => filteredData;

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === parseInt(categoryId));
    return category ? (category.categoryName || category.name) : `Category ${categoryId}`;
  };

  const getDaysDisplay = (days) => {
    if (days === null || days === undefined) return "Unknown";
    if (days === 0) return "Hourly";
    if (days === 1) return "1 Day";
    if (days === 7) return "1 Week";
    if (days === 14) return "2 Weeks";
    if (days === 30) return "1 Month";
    if (days === 60) return "2 Months";
    if (days === 90) return "3 Months";
    if (days === 180) return "6 Months";
    if (days === 365) return "1 Year";
    return `${days} Day${days > 1 ? 's' : ''}`;
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* Header with Back Button */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/pickup-tariff-plan')}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:shadow-md transition duration-200"
              >
                <FaArrowLeft className="mr-2" />
                Back to Tariff Plans
              </button>
              <div className="h-8 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Price Management</h1>
                <p className="text-sm text-gray-600 mt-1">Manage rental pricing for vehicles</p>
              </div>
            </div>
            {!formVisible && (
              <button
                onClick={() => setFormVisible(true)}
                className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition duration-200 shadow-lg hover:shadow-xl"
              >
                <FaPlus className="mr-2" />
                Add New Price
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-400 rounded-r-lg shadow-sm">
            <div className="flex items-center">
              <FaCheck className="text-green-400 mr-3" />
              <p className="text-sm text-green-700 font-medium">{success}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg shadow-sm">
            <div className="flex items-center">
              <FaExclamationTriangle className="text-red-400 mr-3" />
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        {formVisible ? (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingId ? "✏️ Edit Price List" : "➕ Add New Price List"}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {editingId ? "Update the pricing details below" : "Create a new pricing entry"}
                </p>
              </div>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            <form onSubmit={editingId ? handleEditPrice : handleAddPrice} className="space-y-6">
              {/* Pricing Type Selection */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">
                  Select Pricing Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => handlePricingTypeChange("hourly")}
                    className={`flex items-center justify-center px-6 py-4 border-2 rounded-lg transition duration-200 ${
                      pricingType === "hourly"
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                    }`}
                  >
                    <FaClock className="mr-3 text-2xl" />
                    <div className="text-left">
                      <div className="font-semibold">Hourly Pricing</div>
                      <div className="text-xs opacity-75">Charge per hour</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePricingTypeChange("daily")}
                    className={`flex items-center justify-center px-6 py-4 border-2 rounded-lg transition duration-200 ${
                      pricingType === "daily"
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                    }`}
                  >
                    <FaCalendarAlt className="mr-3 text-2xl" />
                    <div className="text-left">
                      <div className="font-semibold">Day-wise Pricing</div>
                      <div className="text-xs opacity-75">Set rental duration</div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Category Selection */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Vehicle Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="categoryId"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 ${
                      validationErrors.categoryId ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    value={formData.categoryId}
                    onChange={handleInputChange}
                    required
                    disabled={submitting || categoriesLoading}
                  >
                    <option value="">-- Select Category --</option>
                    {categoriesLoading ? (
                      <option value="" disabled>Loading...</option>
                    ) : categories.length > 0 ? (
                      categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.categoryName || category.name}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No categories available</option>
                    )}
                  </select>
                  {validationErrors.categoryId && (
                    <p className="text-xs text-red-600">{validationErrors.categoryId}</p>
                  )}
                </div>

                {/* Days Input (Only for daily pricing) */}
                {pricingType === "daily" && (
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Number of Days <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="days"
                      placeholder="e.g., 1, 7, 30, 365"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 ${
                        validationErrors.days ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      value={formData.days}
                      onChange={handleInputChange}
                      required
                      min="1"
                      max="365"
                      disabled={submitting}
                    />
                    {validationErrors.days && (
                      <p className="text-xs text-red-600">{validationErrors.days}</p>
                    )}
                    <p className="text-xs text-gray-500">Common: 1 (Daily), 7 (Weekly), 30 (Monthly), 365 (Yearly)</p>
                  </div>
                )}

                {/* Hourly Charge (Only for hourly pricing) */}
                {/* Hourly Charge - Only for hourly pricing */}
{pricingType === "hourly" && (
  <div className="space-y-2">
    <label className="block text-sm font-semibold text-gray-700">
      Hourly Charge (₹/hour) <span className="text-red-500">*</span>
    </label>
    <input
      type="number"
      name="hourlyChargeAmount"
      placeholder="Enter charge per hour"
      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 ${
        validationErrors.hourlyChargeAmount ? "border-red-300 bg-red-50" : "border-gray-300"
      }`}
      value={formData.hourlyChargeAmount}
      onChange={handleInputChange}
      min="0.01"
      step="0.01"
      disabled={submitting}
    />
    {validationErrors.hourlyChargeAmount && (
      <p className="text-xs text-red-600">{validationErrors.hourlyChargeAmount}</p>
    )}
  </div>
)}

{/* Days Input - Only for daily pricing */}
{pricingType === "daily" && (
  <div className="space-y-2">
    <label className="block text-sm font-semibold text-gray-700">
      Number of Days <span className="text-red-500">*</span>
    </label>
    <input
      type="number"
      name="days"
      placeholder="e.g., 1, 7, 30, 365"
      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 ${
        validationErrors.days ? "border-red-300 bg-red-50" : "border-gray-300"
      }`}
      value={formData.days}
      onChange={handleInputChange}
      min="1"
      max="365"
      disabled={submitting}
    />
    {validationErrors.days && (
      <p className="text-xs text-red-600">{validationErrors.days}</p>
    )}
    <p className="text-xs text-gray-500">Common: 1 (Daily), 7 (Weekly), 30 (Monthly), 365 (Yearly)</p>
  </div>
)}


                {/* Price */}
                {/* <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    {pricingType === "hourly" ? "Base Price (₹)" : "Price (₹)"} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="price"
                    placeholder="Enter price amount"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 ${
                      validationErrors.price ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    min="0.01"
                    step="0.01"
                    disabled={submitting}
                  />
                  {validationErrors.price && (
                    <p className="text-xs text-red-600">{validationErrors.price}</p>
                  )}
                </div> */}
                {/* Price - Only show for Daily pricing */}
{pricingType === "daily" && (
  <div className="space-y-2">
    <label className="block text-sm font-semibold text-gray-700">
      Price (₹) <span className="text-red-500">*</span>
    </label>
    <input
      type="number"
      name="price"
      placeholder="Enter price amount"
      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 ${
        validationErrors.price ? 'border-red-300 bg-red-50' : 'border-gray-300'
      }`}
      value={formData.price}
      onChange={handleInputChange}
      required
      min="0.01"
      step="0.01"
      disabled={submitting}
    />
    {validationErrors.price && (
      <p className="text-xs text-red-600">{validationErrors.price}</p>
    )}
  </div>
)}


                {/* Deposit */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Deposit Amount (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="deposit"
                    placeholder="Enter deposit amount"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 ${
                      validationErrors.deposit ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    value={formData.deposit}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    disabled={submitting}
                  />
                  {validationErrors.deposit && (
                    <p className="text-xs text-red-600">{validationErrors.deposit}</p>
                  )}
                </div>
              </div>

              {/* Duplicate Warning */}
              {validationErrors.duplicate && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800 flex items-center">
                    <FaExclamationTriangle className="mr-2" />
                    {validationErrors.duplicate}
                  </p>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <button
                  type="button"
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition duration-200"
                  onClick={resetForm}
                  disabled={submitting}
                >
                  <FaTimes className="inline mr-2" />
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-200 shadow-lg disabled:opacity-50"
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
                    <>
                      <FaCheck className="inline mr-2" />
                      {editingId ? "Update Price" : "Create Price"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Search Bar */}
           {/* Enhanced Search and Filter Bar */}
<div className="px-6 py-4 border-b bg-gray-50">
  <div className="space-y-4">
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
      <div className="text-sm text-gray-600">
        Showing <span className="font-semibold text-gray-900">{totalElements}</span> price lists
      </div>
    </div>

   
      {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Category Name
          </label>
          <input
            type="text"
            placeholder="Search category..."
            value={filterCategoryName}
            onChange={(e) => setFilterCategoryName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          />
        </div>

        
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Min Price (₹)
          </label>
          <input
            type="number"
            placeholder="Min price"
            value={filterMinPrice}
            onChange={(e) => setFilterMinPrice(e.target.value)}
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          />
        </div>

        
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Max Price (₹)
          </label>
          <input
            type="number"
            placeholder="Max price"
            value={filterMaxPrice}
            onChange={(e) => setFilterMaxPrice(e.target.value)}
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          />
        </div>

        
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Days
          </label>
          <input
            type="number"
            placeholder="Number of days"
            value={filterDays}
            onChange={(e) => setFilterDays(e.target.value)}
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          />
        </div>

        
        <div className="flex items-end space-x-2">
          <button
            onClick={handleSearch}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-200 flex items-center justify-center text-sm font-medium"
          >
            <FaSearch className="mr-2" />
            Search
          </button>
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition duration-200 text-sm font-medium"
          >
            Clear
          </button>
        </div>
      </div> */}
  </div>
</div>


            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">ID</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Duration</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Price</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Deposit</th>
 <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Hourly Rate</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                          <p className="text-gray-500">Loading price lists...</p>
                        </div>
                      </td>
                    </tr>
                  ) : getCurrentPageData().length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-12 text-center">
                        <div className="text-gray-500">
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No price lists found</h3>
                          <p className="text-sm mb-4">
                            {searchQuery ? `No results for "${searchQuery}"` : "Start by adding your first price list"}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    getCurrentPageData().map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.id}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{getCategoryName(item.categoryId)}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                            item.days === 0 ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {getDaysDisplay(item.days)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-green-600">₹{parseFloat(item.price).toFixed(2)}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">₹{parseFloat(item.deposit || 0).toFixed(2)}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {item.hourlyChargeAmount ? (
                            <span className="text-indigo-600 font-medium">₹{parseFloat(item.hourlyChargeAmount).toFixed(2)}/hr</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleToggleStatus(item.id, item.isActive)}
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              item.isActive === 1
                                ? "bg-green-100 text-green-800 hover:bg-green-200"
                                : "bg-red-100 text-red-800 hover:bg-red-200"
                            }`}
                          >
                            {item.isActive === 1 ? <><FaToggleOn className="mr-1" /> Active</> : <><FaToggleOff className="mr-1" /> Inactive</>}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            className="inline-flex items-center px-3 py-2 text-sm bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200"
                            onClick={() => handleEditPriceClick(item)}
                          >
                            <FaEdit className="mr-1" />
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!loading && data.length > 0 && totalPages > 1 && (
              <div className="px-6 py-4 bg-gray-50 border-t">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Page <span className="font-medium">{currentPage + 1}</span> of <span className="font-medium">{totalPages}</span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50 hover:bg-gray-100"
                      disabled={!hasPrevious}
                      onClick={handlePrevPage}
                    >
                      Previous
                    </button>
                    {getPageNumbers().map((pageNum) => (
                      <button
                        key={pageNum}
                        className={`px-4 py-2 border rounded-lg text-sm ${
                          currentPage === pageNum ? "bg-indigo-600 text-white" : "hover:bg-gray-100"
                        }`}
                        onClick={() => handlePageClick(pageNum)}
                      >
                        {pageNum + 1}
                      </button>
                    ))}
                    <button
                      className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50 hover:bg-gray-100"
                      disabled={!hasNext}
                      onClick={handleNextPage}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center mb-4">
              <FaExclamationTriangle className="text-red-500 text-2xl mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Confirm Delete</h3>
            </div>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this price list? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                onClick={() => setConfirmDeleteId(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                onClick={() => handleDeletePrice(confirmDeleteId)}
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

export default PriceManagement;
