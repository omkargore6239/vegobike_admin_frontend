import React, { useEffect, useState } from "react";
import { FaEdit, FaTrash, FaSearch, FaPlus, FaToggleOn, FaToggleOff, FaSave, FaTimes, FaCheck, FaExclamationTriangle, FaRedo } from "react-icons/fa";
import { toast } from "react-toastify";
import { lateChargesAPI, categoryAPI, BASE_URL } from "../../api/apiConfig"; // Import BASE_URL

const LateCharges = () => {
  // State management
  const [lateCharges, setLateCharges] = useState([]);
  const [filteredCharges, setFilteredCharges] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Search and pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Inline editing state
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [validationErrors, setValidationErrors] = useState({});
  
  const [formData, setFormData] = useState({
    categoryId: "",
    chargeType: "HOURS",
    charge: ""
  });

  // ✅ Charge types matching your ChargeType enum exactly
  const CHARGE_TYPES = [
    { value: "HOURS", label: "Hours", unit: "hour" },
    { value: "KM", label: "Kilometers", unit: "km" }
  ];

  // ✅ PROFESSIONAL ERROR HANDLING UTILITIES
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

    // Network errors
    if (error.code === 'ERR_NETWORK' || error.message?.toLowerCase().includes('network')) {
      type = ErrorTypes.NETWORK;
      message = `Unable to connect to the server at ${BASE_URL}`;
      isRetryable = true;
      suggestions = [
        "Check your internet connection",
        "Verify the backend server is running",
        "Ensure CORS is properly configured"
      ];
    }
    // HTTP status errors
    else if (error.response?.status) {
      const status = error.response.status;
      const serverMessage = error.response.data?.message || error.response.data?.error;

      switch (status) {
        case 400:
          type = ErrorTypes.VALIDATION;
          message = serverMessage || "Invalid request data";
          suggestions = ["Please check your input and try again"];
          break;
        case 401:
          type = ErrorTypes.PERMISSION;
          message = "Authentication required";
          suggestions = ["Please log in and try again"];
          break;
        case 403:
          type = ErrorTypes.PERMISSION;
          message = "Access denied - insufficient permissions";
          suggestions = ["Contact your administrator for access"];
          break;
        case 404:
          type = ErrorTypes.NOT_FOUND;
          message = "Resource not found";
          suggestions = ["The requested item may have been deleted"];
          break;
        case 409:
          type = ErrorTypes.DUPLICATE;
          message = serverMessage || "This combination already exists";
          suggestions = ["Try with different values"];
          break;
        case 500:
        case 502:
        case 503:
          type = ErrorTypes.SERVER;
          message = "Server error occurred";
          isRetryable = true;
          suggestions = ["Please try again in a moment", "Contact support if the problem persists"];
          break;
        default:
          message = serverMessage || `Server returned error ${status}`;
          isRetryable = status >= 500;
      }
    }
    // Custom error messages
    else if (error.message) {
      message = error.message;
      if (error.message.toLowerCase().includes('duplicate')) {
        type = ErrorTypes.DUPLICATE;
      }
    }

    return { type, message, isRetryable, suggestions };
  };

  const showErrorNotification = (error, context = "") => {
    const errorInfo = getErrorInfo(error);
    const contextMessage = context ? `${context}: ` : "";
    
    console.error(`❌ ${contextMessage}${errorInfo.message}`, error);
    
    toast.error(
      <div>
        <div className="font-medium">{contextMessage}{errorInfo.message}</div>
        {errorInfo.suggestions.length > 0 && (
          <div className="text-sm mt-1 opacity-90">
            {errorInfo.suggestions[0]}
          </div>
        )}
      </div>,
      {
        position: "top-right",
        autoClose: errorInfo.type === ErrorTypes.NETWORK ? 8000 : 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      }
    );

    setError(`${contextMessage}${errorInfo.message}`);
    return errorInfo;
  };

  // ✅ ENHANCED VALIDATION with detailed field-level errors
  const validateForm = () => {
    const errors = {};
    const fieldErrors = [];
    
    // Category validation
    if (!formData.categoryId || formData.categoryId === "") {
      errors.categoryId = "Category is required";
      fieldErrors.push("Please select a category");
    }
    
    // Charge type validation
    if (!formData.chargeType || formData.chargeType === "") {
      errors.chargeType = "Charge type is required";
      fieldErrors.push("Please select a charge type");
    }
    
    // Charge amount validation
    if (!formData.charge || formData.charge === "") {
      errors.charge = "Charge amount is required";
      fieldErrors.push("Please enter a charge amount");
    } else {
      const chargeValue = parseFloat(formData.charge);
      if (isNaN(chargeValue)) {
        errors.charge = "Charge amount must be a valid number";
        fieldErrors.push("Charge amount must be a valid number");
      } else if (chargeValue <= 0) {
        errors.charge = "Charge amount must be greater than 0";
        fieldErrors.push("Charge amount must be greater than 0");
      } else if (chargeValue > 999999.99) {
        errors.charge = "Charge amount is too large";
        fieldErrors.push("Charge amount must be less than ₹10,00,000");
      }
    }

    // Duplicate validation (when adding)
    if (!editingId && formData.categoryId && formData.chargeType) {
      const duplicate = lateCharges.find(charge => 
        String(charge.categoryId) === String(formData.categoryId) && 
        charge.chargeType === formData.chargeType
      );
      if (duplicate) {
        errors.duplicate = "This combination already exists";
        fieldErrors.push(`A late charge for ${getCategoryName(formData.categoryId)} - ${getChargeTypeLabel(formData.chargeType)} already exists`);
      }
    }

    setValidationErrors(errors);
    return { isValid: Object.keys(errors).length === 0, errors, fieldErrors };
  };

  // Helper function to get charge type label
  const getChargeTypeLabel = (chargeType) => {
    const type = CHARGE_TYPES.find(t => t.value === chargeType);
    return type ? type.label : chargeType;
  };

  // Helper function to get charge type unit
  const getChargeTypeUnit = (chargeType) => {
    const type = CHARGE_TYPES.find(t => t.value === chargeType);
    return type ? type.unit : 'unit';
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
      setFilteredCharges(lateCharges);
    } else {
      const filtered = lateCharges.filter((charge) => {
        const searchTerm = searchQuery.toLowerCase();
        const categoryName = getCategoryName(charge.categoryId).toLowerCase();
        return (
          categoryName.includes(searchTerm) ||
          charge.chargeType?.toLowerCase().includes(searchTerm) ||
          getChargeTypeLabel(charge.chargeType).toLowerCase().includes(searchTerm) ||
          charge.charge?.toString().includes(searchTerm)
        );
      });
      setFilteredCharges(filtered);
    }
    setCurrentPage(1);
  }, [searchQuery, lateCharges]);

  // Get category name by ID
  const getCategoryName = (categoryId) => {
    if (!categoryId || !categories.length) return "Unknown Category";
    const category = categories.find(c => String(c.id) === String(categoryId));
    return category ? (category.categoryName || "Unknown Category") : "Unknown Category";
  };

  // ✅ ENHANCED API CALLS with professional error handling

  // Fetch categories for dropdown
  const fetchCategories = async (retryAttempt = 0) => {
    try {
      console.log("🔄 Fetching categories...");
      const response = await categoryAPI.getActive();
      console.log("✅ Categories response:", response.data);
      
      let categoriesData = [];
      if (response.data?.success && response.data.data) {
        categoriesData = response.data.data;
      } else if (Array.isArray(response.data)) {
        categoriesData = response.data;
      }
      
      setCategories(categoriesData);
      console.log("✅ Categories loaded:", categoriesData.length);
      
      if (categoriesData.length === 0) {
        setError("No active categories found. Please add categories first.");
      }
      
    } catch (error) {
      const errorInfo = showErrorNotification(error, "Failed to load categories");
      
      // Retry logic for retryable errors
      if (errorInfo.isRetryable && retryAttempt < 2) {
        console.log(`🔄 Retrying categories fetch (attempt ${retryAttempt + 1}/3)...`);
        setTimeout(() => fetchCategories(retryAttempt + 1), 2000 * (retryAttempt + 1));
      }
    }
  };

  // ✅ Fetch late charges using helper function
  const fetchLateCharges = async (retryAttempt = 0) => {
    setLoading(true);
    setError("");
    
    try {
      console.log("🔄 Fetching late charges...");
      const response = await lateChargesAPI.getAll();
      console.log("✅ Late charges response:", response.data);
      
      // Handle response structure
      let chargesData = [];
      if (Array.isArray(response.data)) {
        chargesData = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        chargesData = response.data.data;
      } else if (response.data?.success && Array.isArray(response.data.data)) {
        chargesData = response.data.data;
      }
      
      console.log("✅ Processed late charges:", chargesData);
      
      setLateCharges(chargesData);
      setFilteredCharges(chargesData);
      setRetryCount(0); // Reset retry count on success
      
      if (chargesData.length > 0) {
        setSuccess(`Successfully loaded ${chargesData.length} late charges`);
        setTimeout(() => setSuccess(""), 3000);
      }
      
    } catch (error) {
      const errorInfo = showErrorNotification(error, "Failed to fetch late charges");
      
      setLateCharges([]);
      setFilteredCharges([]);
      
      // Retry logic for retryable errors
      if (errorInfo.isRetryable && retryAttempt < 2) {
        console.log(`🔄 Retrying late charges fetch (attempt ${retryAttempt + 1}/3)...`);
        setRetryCount(retryAttempt + 1);
        setTimeout(() => fetchLateCharges(retryAttempt + 1), 3000 * (retryAttempt + 1));
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ Add late charge using helper function
  const addLateCharge = async (data) => {
    setSubmitting(true);
    setValidationErrors({});
    
    try {
      console.log("🔄 Adding late charge:", data);
      const response = await lateChargesAPI.create(data);
      console.log("✅ Add response:", response.data);
      
      setSuccess("Late charge added successfully");
      toast.success("Late charge added successfully");
      await fetchLateCharges();
      return response.data;
    } catch (error) {
      showErrorNotification(error, "Failed to add late charge");
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ Update late charge using helper function
  const updateLateCharge = async (id, data) => {
    setSubmitting(true);
    setValidationErrors({});
    
    try {
      console.log("🔄 Updating late charge:", id, data);
      const response = await lateChargesAPI.update(id, data);
      console.log("✅ Update response:", response.data);
      
      setSuccess("Late charge updated successfully");
      toast.success("Late charge updated successfully");
      await fetchLateCharges();
      return response.data;
    } catch (error) {
      showErrorNotification(error, "Failed to update late charge");
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ Toggle status using helper function
  const toggleStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 1 ? 0 : 1;
      console.log("🔄 Toggling status:", id, "from", currentStatus, "to", newStatus);
      
      const response = await lateChargesAPI.toggleStatus(id, newStatus);
      console.log("✅ Toggle status response:", response.data);
      
      setSuccess("Status updated successfully");
      toast.success(`Late charge ${newStatus === 1 ? 'activated' : 'deactivated'} successfully`);
      await fetchLateCharges();
      return response.data;
    } catch (error) {
      showErrorNotification(error, "Failed to update status");
    }
  };

  // ✅ Delete late charge using helper function
  const deleteLateCharge = async (id) => {
    try {
      console.log("🔄 Deleting late charge:", id);
      await lateChargesAPI.delete(id);
      console.log("✅ Delete successful");
      
      setSuccess("Late charge deleted successfully");
      toast.success("Late charge deleted successfully");
      setConfirmDeleteId(null);
      await fetchLateCharges();
    } catch (error) {
      showErrorNotification(error, "Failed to delete late charge");
      setConfirmDeleteId(null);
    }
  };

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchCategories(),
        fetchLateCharges()
      ]);
    };
    loadData();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? value : value
    }));
    
    // Clear validation errors for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
    
    // Clear general error when user starts typing
    if (error) {
      setError("");
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      categoryId: "",
      chargeType: "HOURS",
      charge: ""
    });
    setEditingId(null);
    setShowAddForm(false);
    setError("");
    setValidationErrors({});
  };

  // Handle add new charge
  const handleAdd = () => {
    resetForm();
    setShowAddForm(true);
  };

  // Handle edit charge
  const handleEdit = (charge) => {
    setFormData({
      categoryId: String(charge.categoryId),
      chargeType: charge.chargeType,
      charge: String(charge.charge)
    });
    setEditingId(charge.id);
    setShowAddForm(false);
    setError("");
    setValidationErrors({});
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    const validation = validateForm();
    if (!validation.isValid) {
      setError(validation.fieldErrors[0]);
      return;
    }

    // ✅ Prepare data matching LateChargeRequestDTO exactly
    const submitData = {
      categoryId: parseInt(formData.categoryId),
      chargeType: formData.chargeType, // Enum value: HOURS or KM
      charge: parseFloat(formData.charge)
    };

    console.log("📤 Submitting data:", submitData);

    try {
      if (editingId) {
        await updateLateCharge(editingId, submitData);
      } else {
        await addLateCharge(submitData);
      }
      resetForm();
    } catch (error) {
      // Error handling is done in the API functions
      console.error("Form submit error:", error);
    }
  };

  // Get status display
  const getStatusDisplay = (isActive) => {
    return isActive === 1 
      ? { text: 'Active', class: 'bg-green-100 text-green-800' }
      : { text: 'Inactive', class: 'bg-red-100 text-red-800' };
  };

  // Manual retry function
  const handleRetry = () => {
    setError("");
    fetchLateCharges();
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredCharges.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCharges = filteredCharges.slice(startIndex, endIndex);

  // Pagination handlers
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Late Charges Management</h1>
          <p className="text-gray-600 mt-1">
            Manage late charge rates by category ({filteredCharges.length} charges{searchQuery && `, filtered from ${lateCharges.length} total`})
          </p>
        </div>
        <button
          onClick={handleAdd}
          disabled={showAddForm || submitting}
          className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition duration-200 shadow-lg hover:shadow-xl disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <FaPlus className="mr-2" />
          Add Late Charge
        </button>
      </div>

      {/* Enhanced Success/Error Messages */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-400 rounded-r-lg">
          <div className="flex">
            <FaCheck className="text-green-400 mt-0.5 mr-3" />
            <p className="text-sm text-green-700 font-medium">{success}</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
          <div className="flex">
            <FaExclamationTriangle className="text-red-400 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-red-700 font-medium">{error}</p>
              {error.includes("connect to the server") && (
                <div className="mt-3">
                  <p className="text-xs text-red-600">
                    💡 <strong>Troubleshooting tips:</strong>
                  </p>
                  <ul className="text-xs text-red-600 mt-1 ml-4 list-disc">
                    <li>Ensure your backend server is running on {BASE_URL}</li>
                    <li>Check your network connection</li>
                    <li>Verify CORS settings in your backend</li>
                  </ul>
                  <button
                    onClick={handleRetry}
                    className="mt-2 inline-flex items-center px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                  >
                    <FaRedo className="mr-1" />
                    Retry Connection
                  </button>
                </div>
              )}
              {retryCount > 0 && (
                <p className="text-xs text-red-600 mt-2">
                  Retry attempt {retryCount}/3 in progress...
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Search and Filters */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <h3 className="text-lg font-semibold text-gray-900">
              Late Charges ({filteredCharges.length} total)
            </h3>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by category, charge type, or amount..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-96"
              />
            </div>
          </div>
        </div>

        {/* ✅ ENHANCED INLINE ADD FORM with validation errors */}
        {showAddForm && (
          <div className="px-6 py-4 bg-blue-50 border-b border-blue-200">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Add New Late Charge</h4>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                    validationErrors.categoryId ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.categoryName}
                    </option>
                  ))}
                </select>
                {validationErrors.categoryId && (
                  <p className="text-xs text-red-600 mt-1">{validationErrors.categoryId}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Charge Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="chargeType"
                  value={formData.chargeType}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                    validationErrors.chargeType ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                >
                  {CHARGE_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {validationErrors.chargeType && (
                  <p className="text-xs text-red-600 mt-1">{validationErrors.chargeType}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Charge Amount (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="charge"
                  value={formData.charge}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0.01"
                  max="999999.99"
                  required
                  placeholder="0.00"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                    validationErrors.charge ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {validationErrors.charge && (
                  <p className="text-xs text-red-600 mt-1">{validationErrors.charge}</p>
                )}
              </div>

              <div className="flex items-end space-x-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                      Saving...
                    </div>
                  ) : (
                    <>
                      <FaCheck className="mr-1" />
                      Save
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={submitting}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition duration-200 disabled:bg-gray-400"
                >
                  <FaTimes className="mr-1" />
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* ✅ TABLE remains mostly the same but with enhanced error states */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-indigo-900 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider rounded-tl-lg">
                  S.No.
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">
                  Charge Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">
                  Charge Amount
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
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                      <p className="text-gray-500">Loading late charges...</p>
                      {retryCount > 0 && (
                        <p className="text-sm text-gray-400 mt-2">Retry attempt {retryCount}/3</p>
                      )}
                    </div>
                  </td>
                </tr>
              ) : currentCharges.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No late charges found</h3>
                      <p className="text-gray-500 mb-4">
                        {searchQuery ? `No charges match "${searchQuery}"` : "Get started by adding your first late charge"}
                      </p>
                      {error && !searchQuery && (
                        <button
                          onClick={handleRetry}
                          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          <FaRedo className="mr-2" />
                          Try Again
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                currentCharges.map((charge, index) => {
                  const statusInfo = getStatusDisplay(charge.isActive);
                  const isEditing = editingId === charge.id;
                  
                  return (
                    <tr 
                      key={`charge-row-${charge.id || index}`} 
                      className={`transition duration-150 ${isEditing ? 'bg-yellow-50' : 'hover:bg-gray-50'}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {startIndex + index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <div>
                            <select
                              name="categoryId"
                              value={formData.categoryId}
                              onChange={handleInputChange}
                              className={`w-full px-2 py-1 border rounded text-sm focus:ring-2 focus:ring-indigo-500 ${
                                validationErrors.categoryId ? 'border-red-300 bg-red-50' : 'border-gray-300'
                              }`}
                            >
                              <option value="">Select Category</option>
                              {categories.map(category => (
                                <option key={category.id} value={category.id}>
                                  {category.categoryName}
                                </option>
                              ))}
                            </select>
                            {validationErrors.categoryId && (
                              <p className="text-xs text-red-600 mt-1">{validationErrors.categoryId}</p>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm font-medium text-gray-900">
                            {getCategoryName(charge.categoryId)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <div>
                            <select
                              name="chargeType"
                              value={formData.chargeType}
                              onChange={handleInputChange}
                              className={`w-full px-2 py-1 border rounded text-sm focus:ring-2 focus:ring-indigo-500 ${
                                validationErrors.chargeType ? 'border-red-300 bg-red-50' : 'border-gray-300'
                              }`}
                            >
                              {CHARGE_TYPES.map(type => (
                                <option key={type.value} value={type.value}>
                                  {type.label}
                                </option>
                              ))}
                            </select>
                            {validationErrors.chargeType && (
                              <p className="text-xs text-red-600 mt-1">{validationErrors.chargeType}</p>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-900">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {getChargeTypeLabel(charge.chargeType)}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <div>
                            <input
                              type="number"
                              name="charge"
                              value={formData.charge}
                              onChange={handleInputChange}
                              step="0.01"
                              min="0.01"
                              max="999999.99"
                              className={`w-full px-2 py-1 border rounded text-sm focus:ring-2 focus:ring-indigo-500 ${
                                validationErrors.charge ? 'border-red-300 bg-red-50' : 'border-gray-300'
                              }`}
                            />
                            {validationErrors.charge && (
                              <p className="text-xs text-red-600 mt-1">{validationErrors.charge}</p>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm font-medium text-gray-900">
                            <span className="text-lg font-semibold text-green-600">₹{parseFloat(charge.charge).toFixed(2)}</span>
                            <span className="text-gray-500 ml-1 text-xs">
                              per {getChargeTypeUnit(charge.chargeType)}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusInfo.class}`}>
                          {statusInfo.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {isEditing ? (
                          <div className="flex items-center space-x-2">
                            <button
                              className="inline-flex items-center px-2 py-1 text-sm font-medium rounded-lg transition duration-200 text-green-700 bg-green-100 hover:bg-green-200 disabled:bg-gray-100 disabled:text-gray-400"
                              onClick={handleSubmit}
                              disabled={submitting}
                              title="Save changes"
                            >
                              {submitting ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-600 mr-1"></div>
                              ) : (
                                <FaSave className="mr-1" />
                              )}
                              Save
                            </button>
                            <button
                              className="inline-flex items-center px-2 py-1 text-sm font-medium rounded-lg transition duration-200 text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-100"
                              onClick={resetForm}
                              disabled={submitting}
                              title="Cancel editing"
                            >
                              <FaTimes className="mr-1" />
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <button
                              className="inline-flex items-center px-2 py-1 text-sm font-medium rounded-lg transition duration-200 text-indigo-700 bg-indigo-100 hover:bg-indigo-200 disabled:bg-gray-100 disabled:text-gray-400"
                              onClick={() => handleEdit(charge)}
                              disabled={showAddForm || editingId}
                              title="Edit charge"
                            >
                              <FaEdit className="mr-1" />
                              Edit
                            </button>
                            <button
                              className={`inline-flex items-center px-2 py-1 text-sm font-medium rounded-lg transition duration-200 ${
                                charge.isActive === 1 
                                  ? 'text-orange-700 bg-orange-100 hover:bg-orange-200' 
                                  : 'text-green-700 bg-green-100 hover:bg-green-200'
                              }`}
                              onClick={() => toggleStatus(charge.id, charge.isActive)}
                              title={charge.isActive === 1 ? "Deactivate" : "Activate"}
                            >
                              {charge.isActive === 1 ? <FaToggleOn className="mr-1" /> : <FaToggleOff className="mr-1" />}
                              {charge.isActive === 1 ? "Deactivate" : "Activate"}
                            </button>
                            <button
                              className="inline-flex items-center px-2 py-1 text-sm font-medium rounded-lg transition duration-200 text-red-700 bg-red-100 hover:bg-red-200"
                              onClick={() => setConfirmDeleteId(charge.id)}
                              title="Delete charge"
                            >
                              <FaTrash className="mr-1" />
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination (same as before) */}
        {!loading && filteredCharges.length > 0 && totalPages > 1 && (
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
                      {Math.min(endIndex, filteredCharges.length)}
                    </span>{" "}
                    of <span className="font-medium">{filteredCharges.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                      disabled={currentPage === 1}
                      onClick={() => handlePageChange(currentPage - 1)}
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNumber = currentPage - 2 + i;
                      if (pageNumber < 1 || pageNumber > totalPages) return null;
                      
                      return (
                        <button
                          key={pageNumber}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition duration-200 ${
                            currentPage === pageNumber
                              ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                              : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                          }`}
                          onClick={() => handlePageChange(pageNumber)}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                    
                    <button
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                      disabled={currentPage === totalPages}
                      onClick={() => handlePageChange(currentPage + 1)}
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
                <h3 className="text-lg font-medium text-gray-900">Delete Late Charge</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to delete this late charge? This will permanently remove it from the system.
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
                onClick={() => deleteLateCharge(confirmDeleteId)}
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

export default LateCharges;
