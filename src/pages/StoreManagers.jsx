import React, { useEffect, useState } from "react";
import { FaEdit, FaTrash, FaPlus, FaSearch, FaUser, FaExclamationTriangle, FaRedo, FaCheck, FaTimes } from "react-icons/fa";
import { toast } from "react-toastify";
import apiClient, { BASE_URL } from "../api/apiConfig"; // Import BASE_URL from apiConfig

const StoreManagers = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0); // Backend uses 0-based indexing
  const [formVisible, setFormVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  
  // Pagination states from backend response
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    storeId: "",
    password: "",
  });

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
      message = `Unable to connect to server at ${BASE_URL}`;
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
          suggestions = ["The requested data may have been deleted"];
          break;
        case 409:
          type = ErrorTypes.DUPLICATE;
          message = serverMessage || "This manager already exists";
          suggestions = ["Try with different email or phone number"];
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

  // ✅ Enhanced Helper function to get full image URL using BASE_URL
  const getImageUrl = (imagePath, type = 'stores') => {
    if (!imagePath) return null;
    
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    let cleanPath = imagePath.trim();
    cleanPath = cleanPath.replace(/^\/+/, '');
    
    // Handle different image types
    if (type === 'profile') {
      cleanPath = cleanPath.replace(/^uploads\/profile\/+/, '');
      cleanPath = cleanPath.replace(/^uploads\/+/, '');
      cleanPath = cleanPath.replace(/^profile\/+/, '');
      const filename = cleanPath.split('/').pop();
      return `${BASE_URL}/uploads/profile/${filename}`;
    } else {
      // Default to stores
      cleanPath = cleanPath.replace(/^uploads\/stores\/+/, '');
      cleanPath = cleanPath.replace(/^uploads\/+/, '');
      cleanPath = cleanPath.replace(/^stores\/+/, '');
      const filename = cleanPath.split('/').pop();
      return `${BASE_URL}/uploads/stores/${filename}`;
    }
  };

  // ✅ ENHANCED FORM VALIDATION
  const validateForm = () => {
    const errors = {};
    const fieldErrors = [];
    
    // Name validation
    if (!formData.name.trim()) {
      errors.name = "Name is required";
      fieldErrors.push("Please enter a name");
    } else if (formData.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters";
      fieldErrors.push("Name must be at least 2 characters");
    } else if (formData.name.trim().length > 50) {
      errors.name = "Name must be less than 50 characters";
      fieldErrors.push("Name is too long");
    }
    
    // Email validation
    if (!formData.email.trim()) {
      errors.email = "Email is required";
      fieldErrors.push("Please enter an email address");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = "Please enter a valid email address";
      fieldErrors.push("Email format is invalid");
    }
    
    // Phone number validation
    if (!formData.phoneNumber.trim()) {
      errors.phoneNumber = "Phone number is required";
      fieldErrors.push("Please enter a phone number");
    } else if (!/^\+?[\d\s\-\(\)]{10,15}$/.test(formData.phoneNumber.trim())) {
      errors.phoneNumber = "Please enter a valid phone number";
      fieldErrors.push("Phone number format is invalid");
    }
    
    // Store selection validation
    if (!formData.storeId) {
      errors.storeId = "Store selection is required";
      fieldErrors.push("Please select a store");
    }
    
    // Password validation (required for new managers, optional for updates)
    if (!editingId && !formData.password.trim()) {
      errors.password = "Password is required";
      fieldErrors.push("Please enter a password");
    } else if (formData.password.trim() && formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
      fieldErrors.push("Password must be at least 6 characters");
    }

    setValidationErrors(errors);
    return { isValid: Object.keys(errors).length === 0, errors, fieldErrors };
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
      const filtered = data.filter((manager) =>
        manager.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        manager.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredData(filtered);
    }
  }, [searchQuery, data]);

  // Handle form input changes with validation
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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

  // ✅ Enhanced Fetch Store Managers with retry logic
  const fetchStoreManagers = async (page = 0, size = 10, retryAttempt = 0) => {
    setLoading(true);
    setError("");
    
    try {
      console.log(`🔄 Fetching store managers: page=${page}, size=${size}`);
      
      // Use the correct endpoint from your backend: /api/auth/store-managers
      const response = await apiClient.get("/auth/store-managers", {
        params: { page, size }
      });
      
      console.log("✅ Store managers response:", response.data);
      
      if (response.data) {
        const managers = response.data.storeManagers || [];
        
        // Process managers to include proper image URLs
        const processedManagers = managers.map(manager => ({
          ...manager,
          profileImage: manager.profileImage ? getImageUrl(manager.profileImage, 'profile') : null
        }));
        
        setData(processedManagers);
        setFilteredData(processedManagers);
        setTotalPages(response.data.totalPages || 0);
        setTotalElements(response.data.count || 0);
        setCurrentPage(response.data.currentPage || 0);
        setRetryCount(0); // Reset retry count on success

        if (processedManagers.length > 0) {
          setSuccess(`Successfully loaded ${processedManagers.length} store managers`);
          setTimeout(() => setSuccess(""), 3000);
        }
      } else {
        setError("Failed to fetch store managers");
        setData([]);
        setFilteredData([]);
      }
    } catch (error) {
      console.error("❌ Error fetching store managers:", error);
      const errorInfo = showErrorNotification(error, "Failed to fetch store managers");
      
      setData([]);
      setFilteredData([]);
      
      // Retry logic for retryable errors
      if (errorInfo.isRetryable && retryAttempt < 2) {
        console.log(`🔄 Retrying store managers fetch (attempt ${retryAttempt + 1}/3)...`);
        setRetryCount(retryAttempt + 1);
        setTimeout(() => fetchStoreManagers(page, size, retryAttempt + 1), 3000 * (retryAttempt + 1));
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ Enhanced Fetch Stores for dropdown with proper image handling and retry logic
  const fetchStores = async (retryAttempt = 0) => {
    try {
      console.log("🔄 Fetching stores for dropdown...");
      
      const response = await apiClient.get("/stores/active");
      if (response.data && response.data.success) {
        const processedStores = (response.data.data || []).map(store => ({
          ...store,
          storeImage: store.storeImage ? getImageUrl(store.storeImage, 'stores') : null
        }));
        setStores(processedStores);
        console.log("✅ Stores loaded:", processedStores.length);
      } else {
        // Fallback endpoint
        const fallbackResponse = await apiClient.get("/stores/all");
        if (fallbackResponse.data && fallbackResponse.data.success) {
          const processedStores = (fallbackResponse.data.data || []).map(store => ({
            ...store,
            storeImage: store.storeImage ? getImageUrl(store.storeImage, 'stores') : null
          }));
          setStores(processedStores);
          console.log("✅ Stores loaded from fallback:", processedStores.length);
        }
      }
    } catch (error) {
      console.error("❌ Error fetching stores:", error);
      const errorInfo = getErrorInfo(error);
      
      // Retry logic for retryable errors
      if (errorInfo.isRetryable && retryAttempt < 2) {
        console.log(`🔄 Retrying stores fetch (attempt ${retryAttempt + 1}/3)...`);
        setTimeout(() => fetchStores(retryAttempt + 1), 2000 * (retryAttempt + 1));
      }
    }
  };

  // Initial data fetch
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchStoreManagers(currentPage, itemsPerPage),
        fetchStores()
      ]);
    };
    
    loadData();
    window.scrollTo(0, 0);
  }, []);

  // Get store name by ID
  const getStoreName = (storeId) => {
    const store = stores.find((s) => s.id === storeId);
    return store ? store.storeName || store.name : "Unknown Store";
  };

  // ✅ Enhanced Add Store Manager with better validation and error handling
  const handleAddStoreManager = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);
    setValidationErrors({});

    // Validation
    const validation = validateForm();
    if (!validation.isValid) {
      setError(validation.fieldErrors[0]);
      setIsSubmitting(false);
      return;
    }

    try {
      console.log("🔄 Adding store manager...");
      // Use the same auth prefix for create endpoint
      const response = await apiClient.post("/auth/admin/createStoreManager", formData);
      
      if (response.data) {
        setSuccess("Store Manager added successfully!");
        toast.success("Store Manager added successfully!");
        resetForm();
        await fetchStoreManagers(currentPage, itemsPerPage);
      } else {
        const errorMsg = "Failed to add store manager";
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error("❌ Error adding store manager:", error);
      showErrorNotification(error, "Failed to add store manager");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ Enhanced Edit Store Manager with better validation and error handling
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);
    setValidationErrors({});

    // Validation
    const validation = validateForm();
    if (!validation.isValid) {
      setError(validation.fieldErrors[0]);
      setIsSubmitting(false);
      return;
    }

    if (!editingId) {
      setError("Invalid manager ID");
      setIsSubmitting(false);
      return;
    }

    try {
      console.log("🔄 Updating store manager:", editingId);
      const response = await apiClient.put(`/auth/admin/storeManagers/${editingId}`, formData);
      
      if (response.data) {
        setSuccess("Store Manager updated successfully!");
        toast.success("Store Manager updated successfully!");
        resetForm();
        await fetchStoreManagers(currentPage, itemsPerPage);
      } else {
        const errorMsg = "Failed to update store manager";
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error("❌ Error updating store manager:", error);
      showErrorNotification(error, "Failed to update store manager");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ Enhanced Delete Store Manager with better error handling
  const handleDeleteStoreManager = async (id) => {
    if (!id) {
      setError("Invalid manager ID");
      setConfirmDeleteId(null);
      return;
    }

    setError("");
    setSuccess("");
    try {
      console.log("🔄 Deleting store manager:", id);
      await apiClient.delete(`/auth/admin/storeManagers/${id}`);
      setSuccess("Store Manager deleted successfully!");
      toast.success("Store Manager deleted successfully!");
      setConfirmDeleteId(null);
      
      // Refresh data
      if (data.length === 1 && currentPage > 0) {
        await fetchStoreManagers(currentPage - 1, itemsPerPage);
      } else {
        await fetchStoreManagers(currentPage, itemsPerPage);
      }
    } catch (error) {
      console.error("❌ Error deleting store manager:", error);
      showErrorNotification(error, "Failed to delete store manager");
      setConfirmDeleteId(null);
    }
  };

  // Edit form prefill
  const handleEditStoreManager = (manager) => {
    if (!manager || !manager.id) {
      setError("Invalid manager data or missing ID");
      return;
    }

    setEditingId(manager.id);
    setFormData({
      name: manager.name || "",
      email: manager.email || "",
      phoneNumber: manager.phoneNumber || "",
      storeId: manager.storeId || "",
      password: "", // Always empty for security
    });
    setFormVisible(true);
    setError("");
    setSuccess("");
    setValidationErrors({});
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset Form
  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: "",
      email: "",
      phoneNumber: "",
      storeId: "",
      password: "",
    });
    setFormVisible(false);
    setError("");
    setSuccess("");
    setIsSubmitting(false);
    setValidationErrors({});
  };

  // Manual retry function
  const handleRetry = () => {
    setError("");
    setRetryCount(0);
    const loadData = async () => {
      setLoading(true);
      await fetchStoreManagers(currentPage, itemsPerPage);
    };
    loadData();
  };

  // Pagination handlers
  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
      fetchStoreManagers(newPage, itemsPerPage);
    }
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

  // Get current page data for display
  const getCurrentPageData = () => {
    return searchQuery.trim() !== "" ? filteredData : filteredData;
  };

  // ✅ Enhanced image error handlers
  const handleImageError = (e, managerName) => {
    console.error(`Profile image failed to load for manager "${managerName}":`, e.target.src);
    e.target.style.display = 'none';
    const fallbackDiv = e.target.nextElementSibling;
    if (fallbackDiv) {
      fallbackDiv.style.display = 'flex';
    }
  };

  const handleImageLoad = (e, managerName) => {
    console.log(`Profile image loaded successfully for manager "${managerName}":`, e.target.src);
    e.target.style.display = 'block';
    const fallbackDiv = e.target.nextElementSibling;
    if (fallbackDiv) {
      fallbackDiv.style.display = 'none';
    }
  };

  return (
    <div className="p-6">
      <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#2B2B80]">Store Managers</h1>
            <p className="text-gray-600 mt-1">Manage store manager accounts ({totalElements} managers)</p>
          </div>
          {!formVisible && (
            <button
              onClick={() => setFormVisible(true)}
              className="inline-flex items-center px-6 py-3 bg-[#2B2B80] text-white font-medium rounded-lg hover:bg-[#24246A] transition duration-200"
            >
              <FaPlus className="mr-2" />
              Add Store Manager
            </button>
          )}
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
                {error.includes("connect to server") && (
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

        {formVisible ? (
          <div className="bg-gray-50 rounded-lg border p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? "Edit Store Manager" : "Add New Store Manager"}
              </h2>
              <p className="text-gray-600 mt-1">
                {editingId ? "Update manager information below" : "Fill in the details to create a new manager"}
              </p>
            </div>
            
            <form onSubmit={editingId ? handleSaveEdit : handleAddStoreManager} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Name */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter full name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#2B2B80] focus:border-[#2B2B80] transition duration-200 ${
                      validationErrors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    required
                    maxLength={50}
                    disabled={isSubmitting}
                  />
                  {validationErrors.name && (
                    <p className="text-xs text-red-600 mt-1">{validationErrors.name}</p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter email address"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#2B2B80] focus:border-[#2B2B80] transition duration-200 ${
                      validationErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    required
                    disabled={isSubmitting}
                  />
                  {validationErrors.email && (
                    <p className="text-xs text-red-600 mt-1">{validationErrors.email}</p>
                  )}
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Contact Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    placeholder="Enter contact number"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#2B2B80] focus:border-[#2B2B80] transition duration-200 ${
                      validationErrors.phoneNumber ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    required
                    maxLength={15}
                    disabled={isSubmitting}
                  />
                  {validationErrors.phoneNumber && (
                    <p className="text-xs text-red-600 mt-1">{validationErrors.phoneNumber}</p>
                  )}
                </div>

                {/* Store Selection */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Store Name <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="storeId"
                    value={formData.storeId}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#2B2B80] focus:border-[#2B2B80] transition duration-200 ${
                      validationErrors.storeId ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    required
                    disabled={isSubmitting}
                  >
                    <option value="">Select Store</option>
                    {stores.map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.storeName || store.name}
                      </option>
                    ))}
                  </select>
                  {validationErrors.storeId && (
                    <p className="text-xs text-red-600 mt-1">{validationErrors.storeId}</p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Password {!editingId && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="password"
                    name="password"
                    placeholder={editingId ? "Enter new password (optional)" : "Enter password"}
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#2B2B80] focus:border-[#2B2B80] transition duration-200 ${
                      validationErrors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    required={!editingId}
                    minLength={6}
                    disabled={isSubmitting}
                  />
                  {validationErrors.password && (
                    <p className="text-xs text-red-600 mt-1">{validationErrors.password}</p>
                  )}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  onClick={resetForm}
                  disabled={isSubmitting}
                >
                  <FaTimes className="mr-2" />
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-[#2B2B80] text-white rounded-lg hover:bg-[#24246A] transition duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting || Object.keys(validationErrors).length > 0}
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    <>
                      <FaCheck className="mr-2" />
                      {editingId ? "Save Changes" : "Add Manager"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <>
            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <h3 className="text-lg font-semibold text-gray-900">
                All Store Managers ({totalElements} total)
              </h3>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2B2B80] focus:border-[#2B2B80] w-80"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#2B2B80] text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider rounded-tl-lg">
                      Sr. No.
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">
                      Profile
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">
                      Store
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider rounded-tr-lg">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2B2B80] mb-4"></div>
                          <p className="text-gray-500">Loading store managers...</p>
                          {retryCount > 0 && (
                            <p className="text-sm text-gray-400 mt-2">Retry attempt {retryCount}/3</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : getCurrentPageData().length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center">
                        <div className="text-gray-500">
                          <FaUser className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No store managers found</h3>
                          <p className="text-gray-500 mb-4">
                            {searchQuery ? `No managers match "${searchQuery}"` : "Get started by creating your first store manager"}
                          </p>
                          {error && !searchQuery && (
                            <button
                              onClick={handleRetry}
                              className="inline-flex items-center px-4 py-2 bg-[#2B2B80] text-white rounded-lg hover:bg-[#24246A] transition-colors"
                            >
                              <FaRedo className="mr-2" />
                              Try Again
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    getCurrentPageData().map((manager, index) => (
                      <tr key={manager.id} className="hover:bg-gray-50 transition duration-150">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {searchQuery ? index + 1 : (currentPage * itemsPerPage + index + 1)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex-shrink-0 h-12 w-12 relative">
                            {manager.profileImage ? (
                              <>
                                <img
                                  src={manager.profileImage}
                                  alt={manager.name}
                                  className="h-12 w-12 rounded-full object-cover border border-gray-200 shadow-sm bg-white"
                                  onError={(e) => handleImageError(e, manager.name)}
                                  onLoad={(e) => handleImageLoad(e, manager.name)}
                                  style={{ display: 'block' }}
                                />
                                <div 
                                  className="h-12 w-12 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center absolute top-0 left-0"
                                  style={{ display: 'none' }}
                                >
                                  <FaUser className="h-6 w-6 text-gray-400" />
                                </div>
                              </>
                            ) : (
                              <div className="h-12 w-12 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center">
                                <FaUser className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{manager.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{manager.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{manager.phoneNumber}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{getStoreName(manager.storeId)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-3">
                            <button
                              className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition duration-200 text-green-700 bg-green-100 hover:bg-green-200"
                              onClick={() => handleEditStoreManager(manager)}
                              title="Edit manager"
                            >
                              <FaEdit className="mr-1" />
                              Edit
                            </button>
                            <button
                              className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition duration-200 text-red-700 bg-red-100 hover:bg-red-200"
                              onClick={() => setConfirmDeleteId(manager.id)}
                              title="Delete manager"
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
              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
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
                <div className="flex space-x-1">
                  <button
                    className="px-3 py-1.5 text-sm text-white bg-[#2B2B80] rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    disabled={currentPage === 0}
                    onClick={() => handlePageChange(currentPage - 1)}
                  >
                    Previous
                  </button>
                  
                  {getPageNumbers().map((pageNum) => (
                    <button
                      key={pageNum}
                      className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                        currentPage === pageNum
                          ? "bg-[#2B2B80] text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum + 1}
                    </button>
                  ))}
                  
                  <button
                    className="px-3 py-1.5 text-sm rounded-md bg-[#2B2B80] text-white hover:bg-[#24246A] disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
                    disabled={currentPage >= totalPages - 1}
                    onClick={() => handlePageChange(currentPage + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-10 h-10 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <FaTrash className="w-5 h-5 text-red-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Delete Store Manager</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to delete this Store Manager? This will permanently remove their account and access.
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
                onClick={() => handleDeleteStoreManager(confirmDeleteId)}
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

export default StoreManagers;
