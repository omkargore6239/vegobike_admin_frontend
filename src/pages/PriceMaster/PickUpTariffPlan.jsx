// import React, { useEffect, useState } from "react";
// import { FaEdit, FaTrash, FaPlus, FaSearch, FaToggleOn, FaToggleOff, FaExclamationTriangle, FaRedo, FaCheck, FaTimes } from "react-icons/fa";
// import { toast } from "react-toastify";
// import apiClient, { BASE_URL } from "../../api/apiConfig"; // Import BASE_URL from apiConfig

// const PriceManagement = () => {
//   const [data, setData] = useState([]);
//   const [filteredData, setFilteredData] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");
//   const [searchQuery, setSearchQuery] = useState("");
  
//   // Pagination from backend
//   const [currentPage, setCurrentPage] = useState(0);
//   const [itemsPerPage] = useState(10);
//   const [totalPages, setTotalPages] = useState(0);
//   const [totalElements, setTotalElements] = useState(0);
//   const [hasNext, setHasNext] = useState(false);
//   const [hasPrevious, setHasPrevious] = useState(false);

//   // Form states
//   const [formVisible, setFormVisible] = useState(false);
//   const [editingId, setEditingId] = useState(null);
//   const [submitting, setSubmitting] = useState(false);
//   const [confirmDeleteId, setConfirmDeleteId] = useState(null);
//   const [retryCount, setRetryCount] = useState(0);
//   const [validationErrors, setValidationErrors] = useState({});

//   const [formData, setFormData] = useState({
//     categoryId: "",
//     days: "",
//     price: "",
//     deposit: "",
//     isActive: true,
//   });

//   const [categories, setCategories] = useState([]);

//   // ✅ PROFESSIONAL ERROR HANDLING UTILITIES
//   const ErrorTypes = {
//     NETWORK: 'NETWORK',
//     VALIDATION: 'VALIDATION',
//     PERMISSION: 'PERMISSION',
//     NOT_FOUND: 'NOT_FOUND',
//     SERVER: 'SERVER',
//     DUPLICATE: 'DUPLICATE',
//     UNKNOWN: 'UNKNOWN'
//   };

//   const getErrorInfo = (error) => {
//     let type = ErrorTypes.UNKNOWN;
//     let message = "An unexpected error occurred";
//     let isRetryable = false;
//     let suggestions = [];

//     if (!error) return { type, message, isRetryable, suggestions };

//     // Network errors
//     if (error.code === 'ERR_NETWORK' || error.message?.toLowerCase().includes('network')) {
//       type = ErrorTypes.NETWORK;
//       message = `Unable to connect to the server at ${BASE_URL}`;
//       isRetryable = true;
//       suggestions = [
//         "Check your internet connection",
//         "Verify the backend server is running",
//         "Ensure CORS is properly configured"
//       ];
//     }
//     // HTTP status errors
//     else if (error.response?.status) {
//       const status = error.response.status;
//       const serverMessage = error.response.data?.message || error.response.data?.error;

//       switch (status) {
//         case 400:
//           type = ErrorTypes.VALIDATION;
//           message = serverMessage || "Invalid request data";
//           suggestions = ["Please check your input and try again"];
//           break;
//         case 401:
//           type = ErrorTypes.PERMISSION;
//           message = "Authentication required";
//           suggestions = ["Please log in and try again"];
//           break;
//         case 403:
//           type = ErrorTypes.PERMISSION;
//           message = "Access denied - insufficient permissions";
//           suggestions = ["Contact your administrator for access"];
//           break;
//         case 404:
//           type = ErrorTypes.NOT_FOUND;
//           message = "Resource not found";
//           suggestions = ["The requested item may have been deleted"];
//           break;
//         case 409:
//           type = ErrorTypes.DUPLICATE;
//           message = serverMessage || "This combination already exists";
//           suggestions = ["Try with different values"];
//           break;
//         case 500:
//         case 502:
//         case 503:
//           type = ErrorTypes.SERVER;
//           message = "Server error occurred";
//           isRetryable = true;
//           suggestions = ["Please try again in a moment", "Contact support if the problem persists"];
//           break;
//         default:
//           message = serverMessage || `Server returned error ${status}`;
//           isRetryable = status >= 500;
//       }
//     }
//     // Custom error messages
//     else if (error.message) {
//       message = error.message;
//       if (error.message.toLowerCase().includes('duplicate')) {
//         type = ErrorTypes.DUPLICATE;
//       }
//     }

//     return { type, message, isRetryable, suggestions };
//   };

//   const showErrorNotification = (error, context = "") => {
//     const errorInfo = getErrorInfo(error);
//     const contextMessage = context ? `${context}: ` : "";
    
//     console.error(`❌ ${contextMessage}${errorInfo.message}`, error);
    
//     toast.error(
//       <div>
//         <div className="font-medium">{contextMessage}{errorInfo.message}</div>
//         {errorInfo.suggestions.length > 0 && (
//           <div className="text-sm mt-1 opacity-90">
//             {errorInfo.suggestions[0]}
//           </div>
//         )}
//       </div>,
//       {
//         position: "top-right",
//         autoClose: errorInfo.type === ErrorTypes.NETWORK ? 8000 : 5000,
//         hideProgressBar: false,
//         closeOnClick: true,
//         pauseOnHover: true,
//         draggable: true
//       }
//     );

//     setError(`${contextMessage}${errorInfo.message}`);
//     return errorInfo;
//   };

//   // ✅ ENHANCED VALIDATION with detailed field-level errors
//   const validateForm = () => {
//     const errors = {};
//     const fieldErrors = [];
    
//     // Category validation
//     if (!formData.categoryId || formData.categoryId === "") {
//       errors.categoryId = "Category is required";
//       fieldErrors.push("Please select a category");
//     }
    
//     // Days validation
//     if (!formData.days || formData.days === "") {
//       errors.days = "Number of days is required";
//       fieldErrors.push("Please enter number of days");
//     } else {
//       const daysValue = parseInt(formData.days);
//       if (isNaN(daysValue)) {
//         errors.days = "Days must be a valid number";
//         fieldErrors.push("Days must be a valid number");
//       } else if (daysValue <= 0) {
//         errors.days = "Days must be greater than 0";
//         fieldErrors.push("Days must be greater than 0");
//       } else if (daysValue > 365) {
//         errors.days = "Days cannot exceed 365";
//         fieldErrors.push("Days cannot exceed 365");
//       }
//     }
    
//     // Price validation
//     if (!formData.price || formData.price === "") {
//       errors.price = "Price is required";
//       fieldErrors.push("Please enter a price");
//     } else {
//       const priceValue = parseFloat(formData.price);
//       if (isNaN(priceValue)) {
//         errors.price = "Price must be a valid number";
//         fieldErrors.push("Price must be a valid number");
//       } else if (priceValue <= 0) {
//         errors.price = "Price must be greater than 0";
//         fieldErrors.push("Price must be greater than 0");
//       } else if (priceValue > 999999.99) {
//         errors.price = "Price is too large";
//         fieldErrors.push("Price must be less than ₹10,00,000");
//       }
//     }

//     // Deposit validation (optional field)
//     if (formData.deposit && formData.deposit !== "") {
//       const depositValue = parseFloat(formData.deposit);
//       if (isNaN(depositValue)) {
//         errors.deposit = "Deposit must be a valid number";
//         fieldErrors.push("Deposit must be a valid number");
//       } else if (depositValue < 0) {
//         errors.deposit = "Deposit cannot be negative";
//         fieldErrors.push("Deposit cannot be negative");
//       } else if (depositValue > 999999.99) {
//         errors.deposit = "Deposit is too large";
//         fieldErrors.push("Deposit must be less than ₹10,00,000");
//       }
//     }

//     // Duplicate validation (when adding)
//     if (!editingId && formData.categoryId && formData.days) {
//       const duplicate = data.find(item => 
//         String(item.categoryId) === String(formData.categoryId) && 
//         parseInt(item.days) === parseInt(formData.days)
//       );
//       if (duplicate) {
//         errors.duplicate = "This combination already exists";
//         fieldErrors.push(`A price for ${getCategoryName(formData.categoryId)} - ${formData.days} days already exists`);
//       }
//     }

//     setValidationErrors(errors);
//     return { isValid: Object.keys(errors).length === 0, errors, fieldErrors };
//   };

//   // Clear messages after 5 seconds
//   useEffect(() => {
//     if (success || error) {
//       const timer = setTimeout(() => {
//         setSuccess("");
//         setError("");
//       }, 5000);
//       return () => clearTimeout(timer);
//     }
//   }, [success, error]);

//   // Handle search
//   useEffect(() => {
//     if (searchQuery.trim() === "") {
//       setFilteredData(data);
//     } else {
//       const filtered = data.filter((item) =>
//         item.categoryName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         item.days?.toString().includes(searchQuery.toLowerCase()) ||
//         item.price?.toString().includes(searchQuery.toLowerCase())
//       );
//       setFilteredData(filtered);
//     }
//   }, [searchQuery, data]);

//   // ✅ ENHANCED API CALLS with professional error handling

//   // Fetch Price Lists with pagination
//   const fetchPriceLists = async (page = 0, size = 10, sortBy = "id", sortDir = "desc", retryAttempt = 0) => {
//     setLoading(true);
//     setError("");
    
//     try {
//       const response = await apiClient.get("/prices", {
//         params: { page, size, sortBy, sortDir }
//       });
      
//       console.log("✅ Fetched price lists:", response.data);
      
//       if (response.data && response.data.success) {
//         const priceData = response.data.data || [];
//         setData(priceData);
//         setFilteredData(priceData);
//         setRetryCount(0); // Reset retry count on success
        
//         if (response.data.pagination) {
//           setCurrentPage(response.data.pagination.currentPage);
//           setTotalPages(response.data.pagination.totalPages);
//           setTotalElements(response.data.pagination.totalElements);
//           setHasNext(response.data.pagination.hasNext);
//           setHasPrevious(response.data.pagination.hasPrevious);
//         }

//         if (priceData.length > 0) {
//           setSuccess(`Successfully loaded ${priceData.length} price lists`);
//           setTimeout(() => setSuccess(""), 3000);
//         }
//       } else {
//         setError("Failed to fetch price lists");
//         setData([]);
//         setFilteredData([]);
//       }
//     } catch (error) {
//       const errorInfo = showErrorNotification(error, "Failed to fetch price lists");
      
//       setData([]);
//       setFilteredData([]);
      
//       // Retry logic for retryable errors
//       if (errorInfo.isRetryable && retryAttempt < 2) {
//         console.log(`🔄 Retrying price lists fetch (attempt ${retryAttempt + 1}/3)...`);
//         setRetryCount(retryAttempt + 1);
//         setTimeout(() => fetchPriceLists(page, size, sortBy, sortDir, retryAttempt + 1), 3000 * (retryAttempt + 1));
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Fetch Categories
//   const fetchCategories = async (retryAttempt = 0) => {
//     try {
//       console.log("🔄 Fetching categories...");
//       const response = await apiClient.get("/categories/active");
//       console.log("✅ Categories response:", response.data);
      
//       let categoriesData = [];
//       if (response.data?.success && response.data.data) {
//         categoriesData = response.data.data;
//       } else if (Array.isArray(response.data)) {
//         categoriesData = response.data;
//       }
      
//       setCategories(categoriesData);
//       console.log("✅ Categories loaded:", categoriesData.length);
      
//       if (categoriesData.length === 0) {
//         setError("No active categories found. Please add categories first.");
//       }
//     } catch (error) {
//       const errorInfo = showErrorNotification(error, "Failed to load categories");
      
//       // Retry logic for retryable errors
//       if (errorInfo.isRetryable && retryAttempt < 2) {
//         console.log(`🔄 Retrying categories fetch (attempt ${retryAttempt + 1}/3)...`);
//         setTimeout(() => fetchCategories(retryAttempt + 1), 2000 * (retryAttempt + 1));
//       }
//     }
//   };

//   useEffect(() => {
//     const loadData = async () => {
//       await Promise.all([
//         fetchPriceLists(currentPage, itemsPerPage),
//         fetchCategories()
//       ]);
//     };
//     loadData();
//   }, []);

//   // Handle form input changes with validation
//   const handleInputChange = (e) => {
//     const { name, value, type } = e.target;
    
//     // Handle radio button for isActive
//     if (name === "isActive") {
//       setFormData(prev => ({
//         ...prev,
//         [name]: value === "true"
//       }));
//     } else {
//       setFormData(prev => ({
//         ...prev,
//         [name]: type === 'number' ? value : value
//       }));
//     }
    
//     // Clear validation errors for this field
//     if (validationErrors[name]) {
//       setValidationErrors(prev => ({
//         ...prev,
//         [name]: undefined
//       }));
//     }
    
//     // Clear general error when user starts typing
//     if (error) {
//       setError("");
//     }
//   };

//   // Add Price List
//   const handleAddPrice = async (e) => {
//     e.preventDefault();
//     setError("");
//     setSuccess("");
//     setSubmitting(true);
//     setValidationErrors({});

//     // Validation
//     const validation = validateForm();
//     if (!validation.isValid) {
//       setError(validation.fieldErrors[0]);
//       setSubmitting(false);
//       return;
//     }

//     const payload = {
//       categoryId: parseInt(formData.categoryId),
//       days: parseInt(formData.days),
//       price: parseFloat(formData.price),
//       deposit: formData.deposit ? parseFloat(formData.deposit) : 0,
//       isActive: formData.isActive,
//     };

//     try {
//       console.log("🔄 Adding price list:", payload);
//       const response = await apiClient.post("/prices/add", payload);
      
//       if (response.data && response.data.success) {
//         setSuccess("Price list added successfully!");
//         toast.success("Price list added successfully!");
//         resetForm();
//         await fetchPriceLists(currentPage, itemsPerPage);
//       } else {
//         const errorMsg = response.data?.message || "Failed to add price list";
//         setError(errorMsg);
//         toast.error(errorMsg);
//       }
//     } catch (error) {
//       showErrorNotification(error, "Failed to add price list");
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   // Edit Price List
//   const handleEditPrice = async (e) => {
//     e.preventDefault();
//     setError("");
//     setSuccess("");
//     setSubmitting(true);
//     setValidationErrors({});

//     // Validation
//     const validation = validateForm();
//     if (!validation.isValid) {
//       setError(validation.fieldErrors[0]);
//       setSubmitting(false);
//       return;
//     }

//     if (!editingId) {
//       setError("Invalid price list ID");
//       setSubmitting(false);
//       return;
//     }

//     const payload = {
//       categoryId: parseInt(formData.categoryId),
//       days: parseInt(formData.days),
//       price: parseFloat(formData.price),
//       deposit: formData.deposit ? parseFloat(formData.deposit) : 0,
//       isActive: formData.isActive,
//     };

//     try {
//       console.log("🔄 Updating price list:", editingId, payload);
//       const response = await apiClient.put(`/prices/${editingId}`, payload);
      
//       if (response.data && response.data.success) {
//         setSuccess("Price list updated successfully!");
//         toast.success("Price list updated successfully!");
//         resetForm();
//         await fetchPriceLists(currentPage, itemsPerPage);
//       } else {
//         const errorMsg = response.data?.message || "Failed to update price list";
//         setError(errorMsg);
//         toast.error(errorMsg);
//       }
//     } catch (error) {
//       showErrorNotification(error, "Failed to update price list");
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   // Delete Price List
//   const handleDeletePrice = async (id) => {
//     if (!id) {
//       setError("Invalid price list ID");
//       setConfirmDeleteId(null);
//       return;
//     }

//     setError("");
//     setSuccess("");
//     try {
//       console.log("🔄 Deleting price list:", id);
//       const response = await apiClient.delete(`/prices/${id}`);
//       if (response.data && response.data.success) {
//         setSuccess("Price list deleted successfully!");
//         toast.success("Price list deleted successfully!");
//         setConfirmDeleteId(null);
        
//         if (data.length === 1 && currentPage > 0) {
//           await fetchPriceLists(currentPage - 1, itemsPerPage);
//         } else {
//           await fetchPriceLists(currentPage, itemsPerPage);
//         }
//       } else {
//         const errorMsg = response.data?.message || "Failed to delete price list";
//         setError(errorMsg);
//         toast.error(errorMsg);
//         setConfirmDeleteId(null);
//       }
//     } catch (error) {
//       showErrorNotification(error, "Failed to delete price list");
//       setConfirmDeleteId(null);
//     }
//   };

//   // Toggle Status
//   const handleToggleStatus = async (id, currentStatus) => {
//     if (!id) {
//       setError("Invalid price list ID");
//       return;
//     }

//     setError("");
//     setSuccess("");
//     try {
//       console.log("🔄 Toggling status:", id, "from", currentStatus, "to", !currentStatus);
//       const response = await apiClient.put(`/prices/${id}/status`, null, {
//         params: { isActive: !currentStatus }
//       });
      
//       if (response.data && response.data.success) {
//         setSuccess(response.data.message || "Status updated successfully!");
//         toast.success(`Price list ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
//         await fetchPriceLists(currentPage, itemsPerPage);
//       } else {
//         const errorMsg = response.data?.message || "Failed to update status";
//         setError(errorMsg);
//         toast.error(errorMsg);
//       }
//     } catch (error) {
//       showErrorNotification(error, "Failed to update status");
//     }
//   };

//   // Edit form prefill
//   const handleEditPriceClick = (priceItem) => {
//     if (!priceItem || !priceItem.id) {
//       setError("Invalid price data or missing ID");
//       return;
//     }

//     setEditingId(priceItem.id);
//     setFormData({
//       categoryId: priceItem.categoryId || "",
//       days: priceItem.days || "",
//       price: priceItem.price || "",
//       deposit: priceItem.deposit || "",
//       isActive: priceItem.isActive !== false,
//     });
    
//     setFormVisible(true);
//     setError("");
//     setSuccess("");
//     setValidationErrors({});
    
//     window.scrollTo({ top: 0, behavior: 'smooth' });
//   };

//   // Reset Form
//   const resetForm = () => {
//     setEditingId(null);
//     setFormData({
//       categoryId: "",
//       days: "",
//       price: "",
//       deposit: "",
//       isActive: true,
//     });
//     setFormVisible(false);
//     setError("");
//     setSuccess("");
//     setSubmitting(false);
//     setValidationErrors({});
//   };

//   // Manual retry function
//   const handleRetry = () => {
//     setError("");
//     fetchPriceLists(currentPage, itemsPerPage);
//   };

//   // Pagination handlers
//   const handleNextPage = () => {
//     if (hasNext) {
//       const nextPage = currentPage + 1;
//       fetchPriceLists(nextPage, itemsPerPage);
//     }
//   };

//   const handlePrevPage = () => {
//     if (hasPrevious) {
//       const prevPage = currentPage - 1;
//       fetchPriceLists(prevPage, itemsPerPage);
//     }
//   };

//   const handlePageClick = (pageNumber) => {
//     fetchPriceLists(pageNumber, itemsPerPage);
//   };

//   // Generate page numbers for pagination
//   const getPageNumbers = () => {
//     const pages = [];
//     const maxVisible = 5;
//     let start = Math.max(0, currentPage - Math.floor(maxVisible / 2));
//     let end = Math.min(totalPages - 1, start + maxVisible - 1);
    
//     if (end - start + 1 < maxVisible) {
//       start = Math.max(0, end - maxVisible + 1);
//     }
    
//     for (let i = start; i <= end; i++) {
//       pages.push(i);
//     }
//     return pages;
//   };

//   // Get current page data
//   const getCurrentPageData = () => {
//     return searchQuery.trim() !== "" ? filteredData : filteredData;
//   };

//   // Get category name by ID
//   const getCategoryName = (categoryId) => {
//     const category = categories.find(c => c.id === categoryId);
//     return category ? (category.categoryName || category.name) : `Category ${categoryId}`;
//   };

//   return (
//     <div className="bg-gray-50 min-h-screen p-4">
//       {/* Header Section */}
//       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
//         <div>
//           <h1 className="text-3xl font-bold text-gray-900">Price Management</h1>
//           <p className="text-gray-600 mt-1">Manage your pricing structure ({totalElements} price lists)</p>
//         </div>
//         {!formVisible && (
//           <button
//             onClick={() => setFormVisible(true)}
//             className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition duration-200 shadow-lg hover:shadow-xl"
//           >
//             <FaPlus className="mr-2" />
//             Add New Price
//           </button>
//         )}
//       </div>

//       {/* Enhanced Success/Error Messages */}
//       {success && (
//         <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-400 rounded-r-lg animate-fade-in">
//           <div className="flex">
//             <FaCheck className="text-green-400 mt-0.5 mr-3" />
//             <p className="text-sm text-green-700 font-medium">{success}</p>
//           </div>
//         </div>
//       )}
      
//       {error && (
//         <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg animate-fade-in">
//           <div className="flex">
//             <FaExclamationTriangle className="text-red-400 mt-0.5 mr-3 flex-shrink-0" />
//             <div className="flex-1">
//               <p className="text-sm text-red-700 font-medium">{error}</p>
//               {error.includes("connect to the server") && (
//                 <div className="mt-3">
//                   <p className="text-xs text-red-600">
//                     💡 <strong>Troubleshooting tips:</strong>
//                   </p>
//                   <ul className="text-xs text-red-600 mt-1 ml-4 list-disc">
//                     <li>Ensure your backend server is running on {BASE_URL}</li>
//                     <li>Check your network connection</li>
//                     <li>Verify CORS settings in your backend</li>
//                   </ul>
//                   <button
//                     onClick={handleRetry}
//                     className="mt-2 inline-flex items-center px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
//                   >
//                     <FaRedo className="mr-1" />
//                     Retry Connection
//                   </button>
//                 </div>
//               )}
//               {retryCount > 0 && (
//                 <p className="text-xs text-red-600 mt-2">
//                   Retry attempt {retryCount}/3 in progress...
//                 </p>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       {formVisible ? (
//         <div className="bg-white rounded-xl shadow-lg p-8">
//           <div className="mb-6">
//             <h2 className="text-2xl font-bold text-gray-900">
//               {editingId ? "Edit Price List" : "Add New Price List"}
//             </h2>
//             <p className="text-gray-600 mt-1">
//               {editingId ? "Update price information below" : "Fill in the details to create a new price list"}
//             </p>
//           </div>
          
//           <form onSubmit={editingId ? handleEditPrice : handleAddPrice} className="space-y-6">
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//               {/* Category Selection */}
//               <div className="space-y-2">
//                 <label className="block text-sm font-medium text-gray-700">
//                   Vehicle Category <span className="text-red-500">*</span>
//                 </label>
//                 <select
//                   name="categoryId"
//                   className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 ${
//                     validationErrors.categoryId ? 'border-red-300 bg-red-50' : 'border-gray-300'
//                   }`}
//                   value={formData.categoryId}
//                   onChange={handleInputChange}
//                   required
//                   disabled={submitting}
//                 >
//                   <option value="">Select Category</option>
//                   {categories.map((category) => (
//                     <option key={category.id} value={category.id}>
//                       {category.categoryName || category.name}
//                     </option>
//                   ))}
//                 </select>
//                 {validationErrors.categoryId && (
//                   <p className="text-xs text-red-600 mt-1">{validationErrors.categoryId}</p>
//                 )}
//               </div>

//               {/* Days */}
//               <div className="space-y-2">
//                 <label className="block text-sm font-medium text-gray-700">
//                   Number of Days <span className="text-red-500">*</span>
//                 </label>
//                 <input
//                   type="number"
//                   name="days"
//                   placeholder="Enter number of days"
//                   className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 ${
//                     validationErrors.days ? 'border-red-300 bg-red-50' : 'border-gray-300'
//                   }`}
//                   value={formData.days}
//                   onChange={handleInputChange}
//                   required
//                   min="1"
//                   max="365"
//                   disabled={submitting}
//                 />
//                 {validationErrors.days && (
//                   <p className="text-xs text-red-600 mt-1">{validationErrors.days}</p>
//                 )}
//               </div>

//               {/* Price */}
//               <div className="space-y-2">
//                 <label className="block text-sm font-medium text-gray-700">
//                   Price (₹) <span className="text-red-500">*</span>
//                 </label>
//                 <input
//                   type="number"
//                   name="price"
//                   placeholder="Enter price amount"
//                   className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 ${
//                     validationErrors.price ? 'border-red-300 bg-red-50' : 'border-gray-300'
//                   }`}
//                   value={formData.price}
//                   onChange={handleInputChange}
//                   required
//                   min="0.01"
//                   max="999999.99"
//                   step="0.01"
//                   disabled={submitting}
//                 />
//                 {validationErrors.price && (
//                   <p className="text-xs text-red-600 mt-1">{validationErrors.price}</p>
//                 )}
//               </div>

//               {/* Deposit */}
//               <div className="space-y-2">
//                 <label className="block text-sm font-medium text-gray-700">
//                   Deposit Amount (₹)
//                 </label>
//                 <input
//                   type="number"
//                   name="deposit"
//                   placeholder="Enter deposit amount (optional)"
//                   className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 ${
//                     validationErrors.deposit ? 'border-red-300 bg-red-50' : 'border-gray-300'
//                   }`}
//                   value={formData.deposit}
//                   onChange={handleInputChange}
//                   min="0"
//                   max="999999.99"
//                   step="0.01"
//                   disabled={submitting}
//                 />
//                 {validationErrors.deposit && (
//                   <p className="text-xs text-red-600 mt-1">{validationErrors.deposit}</p>
//                 )}
//               </div>

//               {/* Active Status */}
//               <div className="space-y-2 lg:col-span-2">
//                 <label className="block text-sm font-medium text-gray-700">
//                   Status
//                 </label>
//                 <div className="flex items-center space-x-6">
//                   <label className="flex items-center">
//                     <input
//                       type="radio"
//                       name="isActive"
//                       value="true"
//                       checked={formData.isActive === true}
//                       onChange={handleInputChange}
//                       className="form-radio h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
//                       disabled={submitting}
//                     />
//                     <span className="ml-2 text-sm text-gray-700">Active</span>
//                   </label>
//                   <label className="flex items-center">
//                     <input
//                       type="radio"
//                       name="isActive"
//                       value="false"
//                       checked={formData.isActive === false}
//                       onChange={handleInputChange}
//                       className="form-radio h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
//                       disabled={submitting}
//                     />
//                     <span className="ml-2 text-sm text-gray-700">Inactive</span>
//                   </label>
//                 </div>
//               </div>
//             </div>

//             {/* Validation Summary */}
//             {validationErrors.duplicate && (
//               <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
//                 <p className="text-sm text-yellow-800">
//                   <FaExclamationTriangle className="inline mr-2" />
//                   {validationErrors.duplicate}
//                 </p>
//               </div>
//             )}

//             {/* Form Actions */}
//             <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
//               <button
//                 type="button"
//                 className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
//                 onClick={resetForm}
//                 disabled={submitting}
//               >
//                 <FaTimes className="mr-2" />
//                 Cancel
//               </button>
//               <button
//                 type="submit"
//                 className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
//                 disabled={submitting || Object.keys(validationErrors).length > 0}
//               >
//                 {submitting ? (
//                   <span className="flex items-center">
//                     <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
//                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                     </svg>
//                     Processing...
//                   </span>
//                 ) : (
//                   <>
//                     <FaCheck className="mr-2" />
//                     {editingId ? "Update Price" : "Create Price"}
//                   </>
//                 )}
//               </button>
//             </div>
//           </form>
//         </div>
//       ) : (
//         <div className="bg-white rounded-xl shadow-lg overflow-hidden">
//           {/* Search and Filters */}
//           <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
//             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
//               <h3 className="text-lg font-semibold text-gray-900">
//                 All Price Lists ({totalElements} total)
//               </h3>
//               <div className="relative">
//                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                   <FaSearch className="h-5 w-5 text-gray-400" />
//                 </div>
//                 <input
//                   type="text"
//                   placeholder="Search price lists..."
//                   value={searchQuery}
//                   onChange={(e) => setSearchQuery(e.target.value)}
//                   className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-80"
//                 />
//               </div>
//             </div>
//           </div>
          
//           {/* Table */}
//           <div className="overflow-x-auto">
//             <table className="w-full">
//               <thead className="bg-gray-100 border-b border-gray-200">
//                 <tr>
//                   <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     ID
//                   </th>
//                   <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Category
//                   </th>
//                   <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Days
//                   </th>
//                   <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Price
//                   </th>
//                   <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Deposit
//                   </th>
//                   <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Status
//                   </th>
//                   <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Actions
//                   </th>
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {loading ? (
//                   <tr key="loading-row">
//                     <td colSpan="7" className="px-6 py-12 text-center">
//                       <div className="flex flex-col items-center justify-center">
//                         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
//                         <p className="text-gray-500">Loading price lists...</p>
//                         {retryCount > 0 && (
//                           <p className="text-sm text-gray-400 mt-2">Retry attempt {retryCount}/3</p>
//                         )}
//                       </div>
//                     </td>
//                   </tr>
//                 ) : getCurrentPageData().length === 0 ? (
//                   <tr key="empty-row">
//                     <td colSpan="7" className="px-6 py-12 text-center">
//                       <div className="text-gray-500">
//                         <h3 className="text-lg font-medium text-gray-900 mb-2">No price lists found</h3>
//                         <p className="text-gray-500 mb-4">
//                           {searchQuery ? `No price lists match "${searchQuery}"` : "Get started by creating your first price list"}
//                         </p>
//                         {error && !searchQuery && (
//                           <button
//                             onClick={handleRetry}
//                             className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
//                           >
//                             <FaRedo className="mr-2" />
//                             Try Again
//                           </button>
//                         )}
//                       </div>
//                     </td>
//                   </tr>
//                 ) : (
//                   getCurrentPageData().map((priceItem, index) => (
//                     <tr 
//                       key={`price-row-${priceItem.id}-${index}`} 
//                       className="hover:bg-gray-50 transition duration-150"
//                     >
//                       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
//                         {priceItem.id}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="text-sm font-medium text-gray-900">{getCategoryName(priceItem.categoryId)}</div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="text-sm text-gray-900">
//                           <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
//                             {priceItem.days} days
//                           </span>
//                         </div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="text-sm font-medium text-gray-900">
//                           <span className="text-lg font-semibold text-green-600">₹{parseFloat(priceItem.price).toFixed(2)}</span>
//                         </div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="text-sm text-gray-900">
//                           <span className="font-medium">₹{parseFloat(priceItem.deposit || 0).toFixed(2)}</span>
//                         </div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <button
//                           onClick={() => handleToggleStatus(priceItem.id, priceItem.isActive)}
//                           className={`inline-flex items-center px-3 py-2 rounded-full text-xs font-medium transition duration-200 ${
//                             priceItem.isActive
//                               ? "bg-green-100 text-green-800 hover:bg-green-200"
//                               : "bg-red-100 text-red-800 hover:bg-red-200"
//                           }`}
//                           title={`Click to ${priceItem.isActive ? 'deactivate' : 'activate'} price list`}
//                         >
//                           {priceItem.isActive ? (
//                             <>
//                               <FaToggleOn className="mr-1" />
//                               Active
//                             </>
//                           ) : (
//                             <>
//                               <FaToggleOff className="mr-1" />
//                               Inactive
//                             </>
//                           )}
//                         </button>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
//                         <div className="flex items-center space-x-3">
//                           <button
//                             className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition duration-200 text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
//                             onClick={() => handleEditPriceClick(priceItem)}
//                             title="Edit price list"
//                           >
//                             <FaEdit className="mr-1" />
//                             Edit
//                           </button>
//                           <button
//                             className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition duration-200 text-red-700 bg-red-100 hover:bg-red-200"
//                             onClick={() => setConfirmDeleteId(priceItem.id)}
//                             title="Delete price list"
//                           >
//                             <FaTrash className="mr-1" />
//                             Delete
//                           </button>
//                         </div>
//                       </td>
//                     </tr>
//                   ))
//                 )}
//               </tbody>
//             </table>
//           </div>

//           {/* Pagination */}
//           {!loading && !searchQuery && data.length > 0 && totalPages > 1 && (
//             <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
//               <div className="flex items-center justify-between">
//                 <div className="flex-1 flex justify-between sm:hidden">
//                   <button
//                     className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
//                     disabled={!hasPrevious}
//                     onClick={handlePrevPage}
//                   >
//                     Previous
//                   </button>
//                   <button
//                     className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
//                     disabled={!hasNext}
//                     onClick={handleNextPage}
//                   >
//                     Next
//                   </button>
//                 </div>
//                 <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
//                   <div>
//                     <p className="text-sm text-gray-700">
//                       Showing{" "}
//                       <span className="font-medium">{currentPage * itemsPerPage + 1}</span> to{" "}
//                       <span className="font-medium">
//                         {Math.min((currentPage + 1) * itemsPerPage, totalElements)}
//                       </span>{" "}
//                       of <span className="font-medium">{totalElements}</span> results
//                     </p>
//                   </div>
//                   <div>
//                     <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
//                       <button
//                         className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
//                         disabled={!hasPrevious}
//                         onClick={handlePrevPage}
//                         title="Previous page"
//                       >
//                         <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
//                           <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
//                         </svg>
//                       </button>
                      
//                       {getPageNumbers().map((pageNumber) => (
//                         <button
//                           key={`page-btn-${pageNumber}`}
//                           className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition duration-200 ${
//                             currentPage === pageNumber
//                               ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
//                               : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
//                           }`}
//                           onClick={() => handlePageClick(pageNumber)}
//                           title={`Go to page ${pageNumber + 1}`}
//                         >
//                           {pageNumber + 1}
//                         </button>
//                       ))}
                      
//                       <button
//                         className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
//                         disabled={!hasNext}
//                         onClick={handleNextPage}
//                         title="Next page"
//                       >
//                         <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
//                           <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
//                         </svg>
//                       </button>
//                     </nav>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Delete Confirmation Modal */}
//           {confirmDeleteId && (
//             <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
//               <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
//                 <div className="flex items-center mb-4">
//                   <div className="flex-shrink-0 w-10 h-10 mx-auto bg-red-100 rounded-full flex items-center justify-center">
//                     <FaTrash className="w-5 h-5 text-red-600" />
//                   </div>
//                   <div className="ml-4">
//                     <h3 className="text-lg font-medium text-gray-900">Delete Price List</h3>
//                     <p className="text-sm text-gray-500">This action cannot be undone</p>
//                   </div>
//                 </div>
//                 <p className="text-sm text-gray-500 mb-6">
//                   Are you sure you want to delete this price list? This will permanently remove the pricing information.
//                 </p>
//                 <div className="flex justify-end space-x-4">
//                   <button
//                     className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition duration-200"
//                     onClick={() => setConfirmDeleteId(null)}
//                   >
//                     Cancel
//                   </button>
//                   <button
//                     className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200"
//                     onClick={() => handleDeletePrice(confirmDeleteId)}
//                   >
//                     Delete
//                   </button>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// };

// export default PriceManagement;


// import React, { useEffect, useState } from "react";
// import { FaEdit, FaTrash, FaPlus, FaSearch, FaToggleOn, FaToggleOff, FaExclamationTriangle, FaRedo, FaCheck, FaTimes } from "react-icons/fa";
// import { toast } from "react-toastify";
// import apiClient, { BASE_URL } from "../../api/apiConfig"; // Import BASE_URL from apiConfig

// const PriceManagement = () => {
//   const [data, setData] = useState([]);
//   const [filteredData, setFilteredData] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");
//   const [searchQuery, setSearchQuery] = useState("");

//   // Pagination from backend
//   const [currentPage, setCurrentPage] = useState(0);
//   const [itemsPerPage] = useState(10);
//   const [totalPages, setTotalPages] = useState(0);
//   const [totalElements, setTotalElements] = useState(0);
//   const [hasNext, setHasNext] = useState(false);
//   const [hasPrevious, setHasPrevious] = useState(false);
//   // Form states
//   const [formVisible, setFormVisible] = useState(false);
//   const [editingId, setEditingId] = useState(null);
//   const [submitting, setSubmitting] = useState(false);
//   const [confirmDeleteId, setConfirmDeleteId] = useState(null);
//   const [retryCount, setRetryCount] = useState(0);
//   const [validationErrors, setValidationErrors] = useState({});
//   const [formData, setFormData] = useState({
//     categoryId: "",
//     days: "",
//     price: "",
//     deposit: "",
//     isActive: true,
//   });
//   const [categories, setCategories] = useState([]);

//   // Static days options for dropdown
//   const daysOptions = [
//     { value: 1, label: '1 day' },
//     { value: 5, label: '5 days' },
//     { value: 7, label: '1 week' },
//     { value: 14, label: '2 weeks' },
//     { value: 30, label: '1 month' },
//     { value: 60, label: '2 months' },
//     { value: 90, label: '3 months' },
//     { value: 180, label: '6 months' },
//     { value: 365, label: '1 year' }
//   ];

//   // ✅ PROFESSIONAL ERROR HANDLING UTILITIES
//   const ErrorTypes = {
//     NETWORK: 'NETWORK',
//     VALIDATION: 'VALIDATION',
//     PERMISSION: 'PERMISSION',
//     NOT_FOUND: 'NOT_FOUND',
//     SERVER: 'SERVER',
//     DUPLICATE: 'DUPLICATE',
//     UNKNOWN: 'UNKNOWN'
//   };

//   const getErrorInfo = (error) => {
//     let type = ErrorTypes.UNKNOWN;
//     let message = "An unexpected error occurred";
//     let isRetryable = false;
//     let suggestions = [];
//     if (!error) return { type, message, isRetryable, suggestions };
//     // Network errors
//     if (error.code === 'ERR_NETWORK' || error.message?.toLowerCase().includes('network')) {
//       type = ErrorTypes.NETWORK;
//       message = `Unable to connect to the server at ${BASE_URL}`;
//       isRetryable = true;
//       suggestions = [
//         "Check your internet connection",
//         "Verify the backend server is running",
//         "Ensure CORS is properly configured"
//       ];
//     }
//     // HTTP status errors
//     else if (error.response?.status) {
//       const status = error.response.status;
//       const serverMessage = error.response.data?.message || error.response.data?.error;
//       switch (status) {
//         case 400:
//           type = ErrorTypes.VALIDATION;
//           message = serverMessage || "Invalid request data";
//           suggestions = ["Please check your input and try again"];
//           break;
//         case 401:
//           type = ErrorTypes.PERMISSION;
//           message = "Authentication required";
//           suggestions = ["Please log in and try again"];
//           break;
//         case 403:
//           type = ErrorTypes.PERMISSION;
//           message = "Access denied - insufficient permissions";
//           suggestions = ["Contact your administrator for access"];
//           break;
//         case 404:
//           type = ErrorTypes.NOT_FOUND;
//           message = "Resource not found";
//           suggestions = ["The requested item may have been deleted"];
//           break;
//         case 409:
//           type = ErrorTypes.DUPLICATE;
//           message = serverMessage || "This combination already exists";
//           suggestions = ["Try with different values"];
//           break;
//         case 500:
//         case 502:
//         case 503:
//           type = ErrorTypes.SERVER;
//           message = "Server error occurred";
//           isRetryable = true;
//           suggestions = ["Please try again in a moment", "Contact support if the problem persists"];
//           break;
//         default:
//           message = serverMessage || `Server returned error ${status}`;
//           isRetryable = status >= 500;
//       }
//     }
//     // Custom error messages
//     else if (error.message) {
//       message = error.message;
//       if (error.message.toLowerCase().includes('duplicate')) {
//         type = ErrorTypes.DUPLICATE;
//       }
//     }
//     return { type, message, isRetryable, suggestions };
//   };

//   const showErrorNotification = (error, context = "") => {
//     const errorInfo = getErrorInfo(error);
//     const contextMessage = context ? `${context}: ` : "";

//     console.error(`❌ ${contextMessage}${errorInfo.message}`, error);

//     toast.error(
//       <div>
//         <div className="font-medium">{contextMessage}{errorInfo.message}</div>
//         {errorInfo.suggestions.length > 0 && (
//           <div className="text-sm mt-1 opacity-90">
//             {errorInfo.suggestions[0]}
//           </div>
//         )}
//       </div>,
//       {
//         position: "top-right",
//         autoClose: errorInfo.type === ErrorTypes.NETWORK ? 8000 : 5000,
//         hideProgressBar: false,
//         closeOnClick: true,
//         pauseOnHover: true,
//         draggable: true
//       }
//     );
//     setError(`${contextMessage}${errorInfo.message}`);
//     return errorInfo;
//   };

//   // ✅ ENHANCED VALIDATION with detailed field-level errors
//   const validateForm = () => {
//     const errors = {};
//     const fieldErrors = [];

//     // Category validation
//     if (!formData.categoryId || formData.categoryId === "") {
//       errors.categoryId = "Category is required";
//       fieldErrors.push("Please select a category");
//     }

//     // Days validation
//     if (!formData.days || formData.days === "") {
//       errors.days = "Number of days is required";
//       fieldErrors.push("Please select number of days");
//     } else {
//       const daysValue = parseInt(formData.days);
//       if (isNaN(daysValue)) {
//         errors.days = "Days must be a valid number";
//         fieldErrors.push("Days must be a valid number");
//       } else if (daysValue <= 0) {
//         errors.days = "Days must be greater than 0";
//         fieldErrors.push("Days must be greater than 0");
//       } else if (daysValue > 365) {
//         errors.days = "Days cannot exceed 365";
//         fieldErrors.push("Days cannot exceed 365");
//       }
//     }

//     // Price validation
//     if (!formData.price || formData.price === "") {
//       errors.price = "Price is required";
//       fieldErrors.push("Please enter a price");
//     } else {
//       const priceValue = parseFloat(formData.price);
//       if (isNaN(priceValue)) {
//         errors.price = "Price must be a valid number";
//         fieldErrors.push("Price must be a valid number");
//       } else if (priceValue <= 0) {
//         errors.price = "Price must be greater than 0";
//         fieldErrors.push("Price must be greater than 0");
//       } else if (priceValue > 999999.99) {
//         errors.price = "Price is too large";
//         fieldErrors.push("Price must be less than ₹10,00,000");
//       }
//     }
//     // Deposit validation (optional field)
//     if (formData.deposit && formData.deposit !== "") {
//       const depositValue = parseFloat(formData.deposit);
//       if (isNaN(depositValue)) {
//         errors.deposit = "Deposit must be a valid number";
//         fieldErrors.push("Deposit must be a valid number");
//       } else if (depositValue < 0) {
//         errors.deposit = "Deposit cannot be negative";
//         fieldErrors.push("Deposit cannot be negative");
//       } else if (depositValue > 999999.99) {
//         errors.deposit = "Deposit is too large";
//         fieldErrors.push("Deposit must be less than ₹10,00,000");
//       }
//     }
//     // Duplicate validation (when adding)
//     if (!editingId && formData.categoryId && formData.days) {
//       const duplicate = data.find(item =>
//         String(item.categoryId) === String(formData.categoryId) &&
//         parseInt(item.days) === parseInt(formData.days)
//       );
//       if (duplicate) {
//         errors.duplicate = "This combination already exists";
//         fieldErrors.push(`A price for ${getCategoryName(formData.categoryId)} - ${formData.days} days already exists`);
//       }
//     }
//     setValidationErrors(errors);
//     return { isValid: Object.keys(errors).length === 0, errors, fieldErrors };
//   };

//   // Clear messages after 5 seconds
//   useEffect(() => {
//     if (success || error) {
//       const timer = setTimeout(() => {
//         setSuccess("");
//         setError("");
//       }, 5000);
//       return () => clearTimeout(timer);
//     }
//   }, [success, error]);

//   // Handle search
//   useEffect(() => {
//     if (searchQuery.trim() === "") {
//       setFilteredData(data);
//     } else {
//       const filtered = data.filter((item) =>
//         item.categoryName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         item.days?.toString().includes(searchQuery.toLowerCase()) ||
//         item.price?.toString().includes(searchQuery.toLowerCase())
//       );
//       setFilteredData(filtered);
//     }
//   }, [searchQuery, data]);

//   // ✅ ENHANCED API CALLS with professional error handling
//   // Fetch Price Lists with pagination
//   const fetchPriceLists = async (page = 0, size = 10, sortBy = "id", sortDir = "desc", retryAttempt = 0) => {
//     setLoading(true);
//     setError("");

//     try {
//       const response = await apiClient.get("/prices", {
//         params: { page, size, sortBy, sortDir }
//       });

//       console.log("✅ Fetched price lists:", response.data);

//       if (response.data && response.data.success) {
//         const priceData = response.data.data || [];
//         setData(priceData);
//         setFilteredData(priceData);
//         setRetryCount(0); // Reset retry count on success

//         if (response.data.pagination) {
//           setCurrentPage(response.data.pagination.currentPage);
//           setTotalPages(response.data.pagination.totalPages);
//           setTotalElements(response.data.pagination.totalElements);
//           setHasNext(response.data.pagination.hasNext);
//           setHasPrevious(response.data.pagination.hasPrevious);
//         }
//         if (priceData.length > 0) {
//           setSuccess(`Successfully loaded ${priceData.length} price lists`);
//           setTimeout(() => setSuccess(""), 3000);
//         }
//       } else {
//         setError("Failed to fetch price lists");
//         setData([]);
//         setFilteredData([]);
//       }
//     } catch (error) {
//       const errorInfo = showErrorNotification(error, "Failed to fetch price lists");

//       setData([]);
//       setFilteredData([]);

//       // Retry logic for retryable errors
//       if (errorInfo.isRetryable && retryAttempt < 2) {
//         console.log(`🔄 Retrying price lists fetch (attempt ${retryAttempt + 1}/3)...`);
//         setRetryCount(retryAttempt + 1);
//         setTimeout(() => fetchPriceLists(page, size, sortBy, sortDir, retryAttempt + 1), 3000 * (retryAttempt + 1));
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Fetch Categories
//   const fetchCategories = async (retryAttempt = 0) => {
//     try {
//       console.log("🔄 Fetching categories...");
//       const response = await apiClient.get("/categories/active");
//       console.log("✅ Categories response:", response.data);

//       let categoriesData = [];
//       if (response.data?.success && response.data.data) {
//         categoriesData = response.data.data;
//       } else if (Array.isArray(response.data)) {
//         categoriesData = response.data;
//       }

//       setCategories(categoriesData);
//       console.log("✅ Categories loaded:", categoriesData.length);

//       if (categoriesData.length === 0) {
//         setError("No active categories found. Please add categories first.");
//       }
//     } catch (error) {
//       const errorInfo = showErrorNotification(error, "Failed to load categories");

//       // Retry logic for retryable errors
//       if (errorInfo.isRetryable && retryAttempt < 2) {
//         console.log(`🔄 Retrying categories fetch (attempt ${retryAttempt + 1}/3)...`);
//         setTimeout(() => fetchCategories(retryAttempt + 1), 2000 * (retryAttempt + 1));
//       }
//     }
//   };

//   useEffect(() => {
//     const loadData = async () => {
//       await Promise.all([
//         fetchPriceLists(currentPage, itemsPerPage),
//         fetchCategories()
//       ]);
//     };
//     loadData();
//   }, []);

//   // Handle form input changes with validation
//   const handleInputChange = (e) => {
//     const { name, value, type } = e.target;

//     // Handle radio button for isActive
//     if (name === "isActive") {
//       setFormData(prev => ({
//         ...prev,
//         [name]: value === "true"
//       }));
//     } else {
//       setFormData(prev => ({
//         ...prev,
//         [name]: type === 'number' ? value : value
//       }));
//     }

//     // Clear validation errors for this field
//     if (validationErrors[name]) {
//       setValidationErrors(prev => ({
//         ...prev,
//         [name]: undefined
//       }));
//     }

//     // Clear general error when user starts typing
//     if (error) {
//       setError("");
//     }
//   };

//   // Add Price List
//   const handleAddPrice = async (e) => {
//     e.preventDefault();
//     setError("");
//     setSuccess("");
//     setSubmitting(true);
//     setValidationErrors({});
//     // Validation
//     const validation = validateForm();
//     if (!validation.isValid) {
//       setError(validation.fieldErrors[0]);
//       setSubmitting(false);
//       return;
//     }
//     const payload = {
//       categoryId: parseInt(formData.categoryId),
//       days: parseInt(formData.days),
//       price: parseFloat(formData.price),
//       deposit: formData.deposit ? parseFloat(formData.deposit) : 0,
//       isActive: formData.isActive,
//     };
//     try {
//       console.log("🔄 Adding price list:", payload);
//       const response = await apiClient.post("/prices/add", payload);

//       if (response.data && response.data.success) {
//         setSuccess("Price list added successfully!");
//         toast.success("Price list added successfully!");
//         resetForm();
//         await fetchPriceLists(currentPage, itemsPerPage);
//       } else {
//         const errorMsg = response.data?.message || "Failed to add price list";
//         setError(errorMsg);
//         toast.error(errorMsg);
//       }
//     } catch (error) {
//       showErrorNotification(error, "Failed to add price list");
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   // Edit Price List
//   const handleEditPrice = async (e) => {
//     e.preventDefault();
//     setError("");
//     setSuccess("");
//     setSubmitting(true);
//     setValidationErrors({});
//     // Validation
//     const validation = validateForm();
//     if (!validation.isValid) {
//       setError(validation.fieldErrors[0]);
//       setSubmitting(false);
//       return;
//     }
//     if (!editingId) {
//       setError("Invalid price list ID");
//       setSubmitting(false);
//       return;
//     }
//     const payload = {
//       categoryId: parseInt(formData.categoryId),
//       days: parseInt(formData.days),
//       price: parseFloat(formData.price),
//       deposit: formData.deposit ? parseFloat(formData.deposit) : 0,
//       isActive: formData.isActive,
//     };
//     try {
//       console.log("🔄 Updating price list:", editingId, payload);
//       const response = await apiClient.put(`/prices/${editingId}`, payload);

//       if (response.data && response.data.success) {
//         setSuccess("Price list updated successfully!");
//         toast.success("Price list updated successfully!");
//         resetForm();
//         await fetchPriceLists(currentPage, itemsPerPage);
//       } else {
//         const errorMsg = response.data?.message || "Failed to update price list";
//         setError(errorMsg);
//         toast.error(errorMsg);
//       }
//     } catch (error) {
//       showErrorNotification(error, "Failed to update price list");
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   // Delete Price List
//   const handleDeletePrice = async (id) => {
//     if (!id) {
//       setError("Invalid price list ID");
//       setConfirmDeleteId(null);
//       return;
//     }
//     setError("");
//     setSuccess("");
//     try {
//       console.log("🔄 Deleting price list:", id);
//       const response = await apiClient.delete(`/prices/${id}`);
//       if (response.data && response.data.success) {
//         setSuccess("Price list deleted successfully!");
//         toast.success("Price list deleted successfully!");
//         setConfirmDeleteId(null);

//         if (data.length === 1 && currentPage > 0) {
//           await fetchPriceLists(currentPage - 1, itemsPerPage);
//         } else {
//           await fetchPriceLists(currentPage, itemsPerPage);
//         }
//       } else {
//         const errorMsg = response.data?.message || "Failed to delete price list";
//         setError(errorMsg);
//         toast.error(errorMsg);
//         setConfirmDeleteId(null);
//       }
//     } catch (error) {
//       showErrorNotification(error, "Failed to delete price list");
//       setConfirmDeleteId(null);
//     }
//   };

//   // Toggle Status
//   const handleToggleStatus = async (id, currentStatus) => {
//     if (!id) {
//       setError("Invalid price list ID");
//       return;
//     }
//     setError("");
//     setSuccess("");
//     try {
//       console.log("🔄 Toggling status:", id, "from", currentStatus, "to", !currentStatus);
//       const response = await apiClient.put(`/prices/${id}/status`, null, {
//         params: { isActive: !currentStatus }
//       });

//       if (response.data && response.data.success) {
//         setSuccess(response.data.message || "Status updated successfully!");
//         toast.success(`Price list ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
//         await fetchPriceLists(currentPage, itemsPerPage);
//       } else {
//         const errorMsg = response.data?.message || "Failed to update status";
//         setError(errorMsg);
//         toast.error(errorMsg);
//       }
//     } catch (error) {
//       showErrorNotification(error, "Failed to update status");
//     }
//   };

//   // Edit form prefill
//   const handleEditPriceClick = (priceItem) => {
//     if (!priceItem || !priceItem.id) {
//       setError("Invalid price data or missing ID");
//       return;
//     }
//     setEditingId(priceItem.id);
//     setFormData({
//       categoryId: priceItem.categoryId || "",
//       days: priceItem.days || "",
//       price: priceItem.price || "",
//       deposit: priceItem.deposit || "",
//       isActive: priceItem.isActive !== false,
//     });

//     setFormVisible(true);
//     setError("");
//     setSuccess("");
//     setValidationErrors({});

//     window.scrollTo({ top: 0, behavior: 'smooth' });
//   };

//   // Reset Form
//   const resetForm = () => {
//     setEditingId(null);
//     setFormData({
//       categoryId: "",
//       days: "",
//       price: "",
//       deposit: "",
//       isActive: true,
//     });
//     setFormVisible(false);
//     setError("");
//     setSuccess("");
//     setSubmitting(false);
//     setValidationErrors({});
//   };

//   // Manual retry function
//   const handleRetry = () => {
//     setError("");
//     fetchPriceLists(currentPage, itemsPerPage);
//   };

//   // Pagination handlers
//   const handleNextPage = () => {
//     if (hasNext) {
//       const nextPage = currentPage + 1;
//       fetchPriceLists(nextPage, itemsPerPage);
//     }
//   };

//   const handlePrevPage = () => {
//     if (hasPrevious) {
//       const prevPage = currentPage - 1;
//       fetchPriceLists(prevPage, itemsPerPage);
//     }
//   };

//   const handlePageClick = (pageNumber) => {
//     fetchPriceLists(pageNumber, itemsPerPage);
//   };

//   // Generate page numbers for pagination
//   const getPageNumbers = () => {
//     const pages = [];
//     const maxVisible = 5;
//     let start = Math.max(0, currentPage - Math.floor(maxVisible / 2));
//     let end = Math.min(totalPages - 1, start + maxVisible - 1);

//     if (end - start + 1 < maxVisible) {
//       start = Math.max(0, end - maxVisible + 1);
//     }

//     for (let i = start; i <= end; i++) {
//       pages.push(i);
//     }
//     return pages;
//   };

//   // Get current page data
//   const getCurrentPageData = () => {
//     return searchQuery.trim() !== "" ? filteredData : filteredData;
//   };

//   // Get category name by ID
//   const getCategoryName = (categoryId) => {
//     const category = categories.find(c => c.id === categoryId);
//     return category ? (category.categoryName || category.name) : `Category ${categoryId}`;
//   };

//   return (
//     <div className="bg-gray-50 min-h-screen p-4">
//       {/* Header Section */}
//       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
//         <div>
//           <h1 className="text-3xl font-bold text-gray-900">Price Management</h1>
//           <p className="text-gray-600 mt-1">Manage your pricing structure ({totalElements} price lists)</p>
//         </div>
//         {!formVisible && (
//           <button
//             onClick={() => setFormVisible(true)}
//             className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition duration-200 shadow-lg hover:shadow-xl"
//           >
//             <FaPlus className="mr-2" />
//             Add New Price
//           </button>
//         )}
//       </div>
//       {/* Enhanced Success/Error Messages */}
//       {success && (
//         <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-400 rounded-r-lg animate-fade-in">
//           <div className="flex">
//             <FaCheck className="text-green-400 mt-0.5 mr-3" />
//             <p className="text-sm text-green-700 font-medium">{success}</p>
//           </div>
//         </div>
//       )}

//       {error && (
//         <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg animate-fade-in">
//           <div className="flex">
//             <FaExclamationTriangle className="text-red-400 mt-0.5 mr-3 flex-shrink-0" />
//             <div className="flex-1">
//               <p className="text-sm text-red-700 font-medium">{error}</p>
//               {error.includes("connect to the server") && (
//                 <div className="mt-3">
//                   <p className="text-xs text-red-600">
//                     💡 <strong>Troubleshooting tips:</strong>
//                   </p>
//                   <ul className="text-xs text-red-600 mt-1 ml-4 list-disc">
//                     <li>Ensure your backend server is running on {BASE_URL}</li>
//                     <li>Check your network connection</li>
//                     <li>Verify CORS settings in your backend</li>
//                   </ul>
//                   <button
//                     onClick={handleRetry}
//                     className="mt-2 inline-flex items-center px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
//                   >
//                     <FaRedo className="mr-1" />
//                     Retry Connection
//                   </button>
//                 </div>
//               )}
//               {retryCount > 0 && (
//                 <p className="text-xs text-red-600 mt-2">
//                   Retry attempt {retryCount}/3 in progress...
//                 </p>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       {formVisible ? (
//         <div className="bg-white rounded-xl shadow-lg p-8">
//           <div className="mb-6">
//             <h2 className="text-2xl font-bold text-gray-900">
//               {editingId ? "Edit Price List" : "Add New Price List"}
//             </h2>
//             <p className="text-gray-600 mt-1">
//               {editingId ? "Update price information below" : "Fill in the details to create a new price list"}
//             </p>
//           </div>

//           <form onSubmit={editingId ? handleEditPrice : handleAddPrice} className="space-y-6">
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//               {/* Category Selection */}
//               <div className="space-y-2">
//                 <label className="block text-sm font-medium text-gray-700">
//                   Vehicle Category <span className="text-red-500">*</span>
//                 </label>
//                 <select
//                   name="categoryId"
//                   className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 ${
//                     validationErrors.categoryId ? 'border-red-300 bg-red-50' : 'border-gray-300'
//                   }`}
//                   value={formData.categoryId}
//                   onChange={handleInputChange}
//                   required
//                   disabled={submitting}
//                 >
//                   <option value="">Select Category</option>
//                   {categories.map((category) => (
//                     <option key={category.id} value={category.id}>
//                       {category.categoryName || category.name}
//                     </option>
//                   ))}
//                 </select>
//                 {validationErrors.categoryId && (
//                   <p className="text-xs text-red-600 mt-1">{validationErrors.categoryId}</p>
//                 )}
//               </div>

//               {/* Days Dropdown */}
//               <div className="space-y-2">
//                 <label className="block text-sm font-medium text-gray-700">
//                   Number of Days <span className="text-red-500">*</span>
//                 </label>
//                 <select
//                   name="days"
//                   className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 ${
//                     validationErrors.days ? 'border-red-300 bg-red-50' : 'border-gray-300'
//                   }`}
//                   value={formData.days}
//                   onChange={handleInputChange}
//                   required
//                   disabled={submitting}
//                 >
//                   <option value="">Select days</option>
//                   {daysOptions.map((option) => (
//                     <option key={option.value} value={option.value}>
//                       {option.label}
//                     </option>
//                   ))}
//                 </select>
//                 {validationErrors.days && (
//                   <p className="text-xs text-red-600 mt-1">{validationErrors.days}</p>
//                 )}
//               </div>

//               {/* Price */}
//               <div className="space-y-2">
//                 <label className="block text-sm font-medium text-gray-700">
//                   Price (₹) <span className="text-red-500">*</span>
//                 </label>
//                 <input
//                   type="number"
//                   name="price"
//                   placeholder="Enter price amount"
//                   className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 ${
//                     validationErrors.price ? 'border-red-300 bg-red-50' : 'border-gray-300'
//                   }`}
//                   value={formData.price}
//                   onChange={handleInputChange}
//                   required
//                   min="0.01"
//                   max="999999.99"
//                   step="0.01"
//                   disabled={submitting}
//                 />
//                 {validationErrors.price && (
//                   <p className="text-xs text-red-600 mt-1">{validationErrors.price}</p>
//                 )}
//               </div>

//               {/* Deposit */}
//               <div className="space-y-2">
//                 <label className="block text-sm font-medium text-gray-700">
//                   Deposit Amount (₹)
//                 </label>
//                 <input
//                   type="number"
//                   name="deposit"
//                   placeholder="Enter deposit amount (optional)"
//                   className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 ${
//                     validationErrors.deposit ? 'border-red-300 bg-red-50' : 'border-gray-300'
//                   }`}
//                   value={formData.deposit}
//                   onChange={handleInputChange}
//                   min="0"
//                   max="999999.99"
//                   step="0.01"
//                   disabled={submitting}
//                 />
//                 {validationErrors.deposit && (
//                   <p className="text-xs text-red-600 mt-1">{validationErrors.deposit}</p>
//                 )}
//               </div>

//               {/* Active Status */}
//               {/* <div className="space-y-2 lg:col-span-2">
//                 <label className="block text-sm font-medium text-gray-700">
//                   Status
//                 </label>
//                 <div className="flex items-center space-x-6">
//                   <label className="flex items-center">
//                     <input
//                       type="radio"
//                       name="isActive"
//                       value="true"
//                       checked={formData.isActive === true}
//                       onChange={handleInputChange}
//                       className="form-radio h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
//                       disabled={submitting}
//                     />
//                     <span className="ml-2 text-sm text-gray-700">Active</span>
//                   </label>
//                   <label className="flex items-center">
//                     <input
//                       type="radio"
//                       name="isActive"
//                       value="false"
//                       checked={formData.isActive === false}
//                       onChange={handleInputChange}
//                       className="form-radio h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
//                       disabled={submitting}
//                     />
//                     <span className="ml-2 text-sm text-gray-700">Inactive</span>
//                   </label>
//                 </div>
//               </div> */}
//             </div>

//             {/* Validation Summary */}
//             {validationErrors.duplicate && (
//               <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
//                 <p className="text-sm text-yellow-800">
//                   <FaExclamationTriangle className="inline mr-2" />
//                   {validationErrors.duplicate}
//                 </p>
//               </div>
//             )}

//             {/* Form Actions */}
//             <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
//               <button
//                 type="button"
//                 className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
//                 onClick={resetForm}
//                 disabled={submitting}
//               >
//                 <FaTimes className="mr-2" />
//                 Cancel
//               </button>
//               <button
//                 type="submit"
//                 className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
//                 disabled={submitting || Object.keys(validationErrors).length > 0}
//               >
//                 {submitting ? (
//                   <span className="flex items-center">
//                     <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
//                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                     </svg>
//                     Processing...
//                   </span>
//                 ) : (
//                   <>
//                     <FaCheck className="mr-2" />
//                     {editingId ? "Update Price" : "Create Price"}
//                   </>
//                 )}
//               </button>
//             </div>
//           </form>
//         </div>
//       ) : (
//         <div className="bg-white rounded-xl shadow-lg overflow-hidden">
//           {/* Search and Filters */}
//           <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
//             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
//               <h3 className="text-lg font-semibold text-gray-900">
//                 All Price Lists ({totalElements} total)
//               </h3>
//               <div className="relative">
//                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                   <FaSearch className="h-5 w-5 text-gray-400" />
//                 </div>
//                 <input
//                   type="text"
//                   placeholder="Search price lists..."
//                   value={searchQuery}
//                   onChange={(e) => setSearchQuery(e.target.value)}
//                   className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-80"
//                 />
//               </div>
//             </div>
//           </div>

//           {/* Table */}
//           <div className="overflow-x-auto">
//             <table className="w-full">
//               <thead className="bg-gray-100 border-b border-gray-200">
//                 <tr>
//                   <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     ID
//                   </th>
//                   <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Category
//                   </th>
//                   <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Days
//                   </th>
//                   <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Price
//                   </th>
//                   <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Deposit
//                   </th>
//                   <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Status
//                   </th>
//                   <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Actions
//                   </th>
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {loading ? (
//                   <tr key="loading-row">
//                     <td colSpan="7" className="px-6 py-12 text-center">
//                       <div className="flex flex-col items-center justify-center">
//                         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
//                         <p className="text-gray-500">Loading price lists...</p>
//                         {retryCount > 0 && (
//                           <p className="text-sm text-gray-400 mt-2">Retry attempt {retryCount}/3</p>
//                         )}
//                       </div>
//                     </td>
//                   </tr>
//                 ) : getCurrentPageData().length === 0 ? (
//                   <tr key="empty-row">
//                     <td colSpan="7" className="px-6 py-12 text-center">
//                       <div className="text-gray-500">
//                         <h3 className="text-lg font-medium text-gray-900 mb-2">No price lists found</h3>
//                         <p className="text-gray-500 mb-4">
//                           {searchQuery ? `No price lists match "${searchQuery}"` : "Get started by creating your first price list"}
//                         </p>
//                         {error && !searchQuery && (
//                           <button
//                             onClick={handleRetry}
//                             className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
//                           >
//                             <FaRedo className="mr-2" />
//                             Try Again
//                           </button>
//                         )}
//                       </div>
//                     </td>
//                   </tr>
//                 ) : (
//                   getCurrentPageData().map((priceItem, index) => (
//                     <tr
//                       key={`price-row-${priceItem.id}-${index}`}
//                       className="hover:bg-gray-50 transition duration-150"
//                     >
//                       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
//                         {priceItem.id}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="text-sm font-medium text-gray-900">{getCategoryName(priceItem.categoryId)}</div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="text-sm text-gray-900">
//                           <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
//                             {priceItem.days} days
//                           </span>
//                         </div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="text-sm font-medium text-gray-900">
//                           <span className="text-lg font-semibold text-green-600">₹{parseFloat(priceItem.price).toFixed(2)}</span>
//                         </div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="text-sm text-gray-900">
//                           <span className="font-medium">₹{parseFloat(priceItem.deposit || 0).toFixed(2)}</span>
//                         </div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <button
//                           onClick={() => handleToggleStatus(priceItem.id, priceItem.isActive)}
//                           className={`inline-flex items-center px-3 py-2 rounded-full text-xs font-medium transition duration-200 ${
//                             priceItem.isActive
//                               ? "bg-green-100 text-green-800 hover:bg-green-200"
//                               : "bg-red-100 text-red-800 hover:bg-red-200"
//                           }`}
//                           title={`Click to ${priceItem.isActive ? 'deactivate' : 'activate'} price list`}
//                         >
//                           {priceItem.isActive ? (
//                             <>
//                               <FaToggleOn className="mr-1" />
//                               Active
//                             </>
//                           ) : (
//                             <>
//                               <FaToggleOff className="mr-1" />
//                               Inactive
//                             </>
//                           )}
//                         </button>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
//                         <div className="flex items-center space-x-3">
//                           <button
//                             className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition duration-200 text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
//                             onClick={() => handleEditPriceClick(priceItem)}
//                             title="Edit price list"
//                           >
//                             <FaEdit className="mr-1" />
//                             Edit
//                           </button>
//                           <button
//                             className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition duration-200 text-red-700 bg-red-100 hover:bg-red-200"
//                             onClick={() => setConfirmDeleteId(priceItem.id)}
//                             title="Delete price list"
//                           >
//                             <FaTrash className="mr-1" />
//                             Delete
//                           </button>
//                         </div>
//                       </td>
//                     </tr>
//                   ))
//                 )}
//               </tbody>
//             </table>
//           </div>

//           {/* Pagination */}
//           {!loading && !searchQuery && data.length > 0 && totalPages > 1 && (
//             <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
//               <div className="flex items-center justify-between">
//                 <div className="flex-1 flex justify-between sm:hidden">
//                   <button
//                     className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
//                     disabled={!hasPrevious}
//                     onClick={handlePrevPage}
//                   >
//                     Previous
//                   </button>
//                   <button
//                     className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
//                     disabled={!hasNext}
//                     onClick={handleNextPage}
//                   >
//                     Next
//                   </button>
//                 </div>
//                 <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
//                   <div>
//                     <p className="text-sm text-gray-700">
//                       Showing{" "}
//                       <span className="font-medium">{currentPage * itemsPerPage + 1}</span> to{" "}
//                       <span className="font-medium">
//                         {Math.min((currentPage + 1) * itemsPerPage, totalElements)}
//                       </span>{" "}
//                       of <span className="font-medium">{totalElements}</span> results
//                     </p>
//                   </div>
//                   <div>
//                     <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
//                       <button
//                         className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
//                         disabled={!hasPrevious}
//                         onClick={handlePrevPage}
//                         title="Previous page"
//                       >
//                         <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
//                           <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
//                         </svg>
//                       </button>

//                       {getPageNumbers().map((pageNumber) => (
//                         <button
//                           key={`page-btn-${pageNumber}`}
//                           className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition duration-200 ${
//                             currentPage === pageNumber
//                               ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
//                               : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
//                           }`}
//                           onClick={() => handlePageClick(pageNumber)}
//                           title={`Go to page ${pageNumber + 1}`}
//                         >
//                           {pageNumber + 1}
//                         </button>
//                       ))}

//                       <button
//                         className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
//                         disabled={!hasNext}
//                         onClick={handleNextPage}
//                         title="Next page"
//                       >
//                         <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
//                           <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
//                         </svg>
//                       </button>
//                     </nav>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Delete Confirmation Modal */}
//           {confirmDeleteId && (
//             <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
//               <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
//                 <div className="flex items-center mb-4">
//                   <div className="flex-shrink-0 w-10 h-10 mx-auto bg-red-100 rounded-full flex items-center justify-center">
//                     <FaTrash className="w-5 h-5 text-red-600" />
//                   </div>
//                   <div className="ml-4">
//                     <h3 className="text-lg font-medium text-gray-900">Delete Price List</h3>
//                     <p className="text-sm text-gray-500">This action cannot be undone</p>
//                   </div>
//                 </div>
//                 <p className="text-sm text-gray-500 mb-6">
//                   Are you sure you want to delete this price list? This will permanently remove the pricing information.
//                 </p>
//                 <div className="flex justify-end space-x-4">
//                   <button
//                     className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition duration-200"
//                     onClick={() => setConfirmDeleteId(null)}
//                   >
//                     Cancel
//                   </button>
//                   <button
//                     className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200"
//                     onClick={() => handleDeletePrice(confirmDeleteId)}
//                   >
//                     Delete
//                   </button>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// };

// export default PriceManagement;

import React, { useEffect, useState } from "react";
import { FaEdit, FaTrash, FaPlus, FaSearch, FaToggleOn, FaToggleOff, FaExclamationTriangle, FaRedo, FaCheck, FaTimes } from "react-icons/fa";
import { toast } from "react-toastify";
import apiClient, { BASE_URL } from "../../api/apiConfig";

const PriceManagement = () => {
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
  const [formData, setFormData] = useState({
    categoryId: "",
    days: "",
    price: "",
    deposit: "",
    isActive: 1, // Changed from true to 1
  });
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  // Static days options for dropdown
  // const daysOptions = [
  //   { value: 1, label: '1 day' },
  //   { value: 5, label: '1 week' },
  //   { value: , label: '2 weeks' },
  //   { value: 30, label: '1 month' },
  //   { value: 60, label: '2 months' },
  //   { value: 90, label: '3 months' },
  //   { value: 180, label: '6 months' },
  //   { value: 365, label: '1 year' }
  // ];
  const daysOptions = [
  { value: 1, label: '1 hour' },
  { value: 24, label: '1 day' },
  { value: 120, label: '5 days' },
  { value: 168, label: '7 days' },
  { value: 360, label: '15 days' },
  { value: 720, label: '30 days' }
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
    // Days validation
    if (!formData.days || formData.days === "") {
      errors.days = "Number of days is required";
      fieldErrors.push("Please select number of days");
    } else {
      const daysValue = parseInt(formData.days);
      if (isNaN(daysValue)) {
        errors.days = "Days must be a valid number";
        fieldErrors.push("Days must be a valid number");
      } else if (daysValue <= 0) {
        errors.days = "Days must be greater than 0";
        fieldErrors.push("Days must be greater than 0");
      } else if (daysValue > 365) {
        errors.days = "Days cannot exceed 365";
        fieldErrors.push("Days cannot exceed 365");
      }
    }
    // Price validation
    if (!formData.price || formData.price === "") {
      errors.price = "Price is required";
      fieldErrors.push("Please enter a price");
    } else {
      const priceValue = parseFloat(formData.price);
      if (isNaN(priceValue)) {
        errors.price = "Price must be a valid number";
        fieldErrors.push("Price must be a valid number");
      } else if (priceValue <= 0) {
        errors.price = "Price must be greater than 0";
        fieldErrors.push("Price must be greater than 0");
      } else if (priceValue > 999999.99) {
        errors.price = "Price is too large";
        fieldErrors.push("Price must be less than ₹10,00,000");
      }
    }
    // Deposit validation (optional field)
    if (formData.deposit && formData.deposit !== "") {
      const depositValue = parseFloat(formData.deposit);
      if (isNaN(depositValue)) {
        errors.deposit = "Deposit must be a valid number";
        fieldErrors.push("Deposit must be a valid number");
      } else if (depositValue < 0) {
        errors.deposit = "Deposit cannot be negative";
        fieldErrors.push("Deposit cannot be negative");
      } else if (depositValue > 999999.99) {
        errors.deposit = "Deposit is too large";
        fieldErrors.push("Deposit must be less than ₹10,00,000");
      }
    }
    // Duplicate validation (when adding)
    if (!editingId && formData.categoryId && formData.days) {
      const duplicate = data.find(item =>
        String(item.categoryId) === String(formData.categoryId) &&
        parseInt(item.days) === parseInt(formData.days)
      );
      if (duplicate) {
        errors.duplicate = "This combination already exists";
        fieldErrors.push(`A price for ${getCategoryName(formData.categoryId)} - ${formData.days} days already exists`);
      }
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
      const filtered = data.filter((item) =>
        item.categoryName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.days?.toString().includes(searchQuery.toLowerCase()) ||
        item.price?.toString().includes(searchQuery.toLowerCase())
      );
      setFilteredData(filtered);
    }
  }, [searchQuery, data]);
  // ✅ ENHANCED API CALLS with professional error handling
  // Fetch Price Lists with pagination
  const fetchPriceLists = async (page = 0, size = 10, sortBy = "id", sortDir = "desc", retryAttempt = 0) => {
    setLoading(true);
    setError("");
    try {
      const response = await apiClient.get("/api/prices", {
        params: { page, size, sortBy, sortDir }
      });
      console.log("✅ Fetched price lists:", response.data);
      if (response.data && response.data.success) {
        const priceData = response.data.data || [];
        setData(priceData);
        setFilteredData(priceData);
        setRetryCount(0); // Reset retry count on success
        if (response.data.pagination) {
          setCurrentPage(response.data.pagination.currentPage);
          setTotalPages(response.data.pagination.totalPages);
          setTotalElements(response.data.pagination.totalElements);
          setHasNext(response.data.pagination.hasNext);
          setHasPrevious(response.data.pagination.hasPrevious);
        }
        if (priceData.length > 0) {
          setSuccess(`Successfully loaded ${priceData.length} price lists`);
          setTimeout(() => setSuccess(""), 3000);
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
      // Retry logic for retryable errors
      if (errorInfo.isRetryable && retryAttempt < 2) {
        console.log(`🔄 Retrying price lists fetch (attempt ${retryAttempt + 1}/3)...`);
        setRetryCount(retryAttempt + 1);
        setTimeout(() => fetchPriceLists(page, size, sortBy, sortDir, retryAttempt + 1), 3000 * (retryAttempt + 1));
      }
    } finally {
      setLoading(false);
    }
  };
  // Fetch Categories
  const fetchCategories = async (retryAttempt = 0) => {
    setCategoriesLoading(true);
    try {
      console.log("🔄 Fetching categories...");
      const response = await apiClient.get("/api/categories/active");
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
    } finally {
      setCategoriesLoading(false);
    }
  };
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchPriceLists(currentPage, itemsPerPage),
        fetchCategories()
      ]);
    };
    loadData();
  }, []);
  // Handle form input changes with validation
  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    // Handle radio button for isActive
    if (name === "isActive") {
      setFormData(prev => ({
        ...prev,
        [name]: value === "1" ? 1 : 0 // Changed to use 1 or 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? value : value
      }));
    }
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
  // Add Price List
  const handleAddPrice = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    setValidationErrors({});
    // Validation
    const validation = validateForm();
    if (!validation.isValid) {
      setError(validation.fieldErrors[0]);
      setSubmitting(false);
      return;
    }
    const payload = {
      categoryId: parseInt(formData.categoryId),
      days: parseInt(formData.days),
      price: parseFloat(formData.price),
      deposit: formData.deposit ? parseFloat(formData.deposit) : 0,
      isActive: parseInt(formData.isActive), // Ensure it's sent as integer
    };
    try {
      console.log("🔄 Adding price list:", payload);
      const response = await apiClient.post("/api/prices/add", payload);
      if (response.data && response.data.success) {
        setSuccess("Price list added successfully!");
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
  const handleEditPrice = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    setValidationErrors({});
    // Validation
    const validation = validateForm();
    if (!validation.isValid) {
      setError(validation.fieldErrors[0]);
      setSubmitting(false);
      return;
    }
    if (!editingId) {
      setError("Invalid price list ID");
      setSubmitting(false);
      return;
    }
    const payload = {
      categoryId: parseInt(formData.categoryId),
      days: parseInt(formData.days),
      price: parseFloat(formData.price),
      deposit: formData.deposit ? parseFloat(formData.deposit) : 0,
      isActive: parseInt(formData.isActive), // Ensure it's sent as integer
    };
    try {
      console.log("🔄 Updating price list:", editingId, payload);
      const response = await apiClient.put(`/api/prices/${editingId}`, payload);
      if (response.data && response.data.success) {
        setSuccess("Price list updated successfully!");
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
    setError("");
    setSuccess("");
    try {
      console.log("🔄 Deleting price list:", id);
      const response = await apiClient.delete(`/api/prices/${id}`);
      if (response.data && response.data.success) {
        setSuccess("Price list deleted successfully!");
        toast.success("Price list deleted successfully!");
        setConfirmDeleteId(null);
        if (data.length === 1 && currentPage > 0) {
          await fetchPriceLists(currentPage - 1, itemsPerPage);
        } else {
          await fetchPriceLists(currentPage, itemsPerPage);
        }
      } else {
        const errorMsg = response.data?.message || "Failed to delete price list";
        setError(errorMsg);
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
    if (!id) {
      setError("Invalid price list ID");
      return;
    }
    setError("");
    setSuccess("");
    try {
      const newStatus = currentStatus === 1 ? 0 : 1; // Toggle between 1 and 0
      console.log("🔄 Toggling status:", id, "from", currentStatus, "to", newStatus);
      const response = await apiClient.put(`/api/prices/${id}/status`, null, {
        params: { isActive: newStatus }
      });
      if (response.data && response.data.success) {
        setSuccess(response.data.message || "Status updated successfully!");
        toast.success(`Price list ${newStatus === 1 ? 'activated' : 'deactivated'} successfully!`);
        await fetchPriceLists(currentPage, itemsPerPage);
      } else {
        const errorMsg = response.data?.message || "Failed to update status";
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      showErrorNotification(error, "Failed to update status");
    }
  };
  // Edit form prefill
  const handleEditPriceClick = (priceItem) => {
    if (!priceItem || !priceItem.id) {
      setError("Invalid price data or missing ID");
      return;
    }
    setEditingId(priceItem.id);
    setFormData({
      categoryId: priceItem.categoryId || "",
      days: priceItem.days || "",
      price: priceItem.price || "",
      deposit: priceItem.deposit || "",
      isActive: priceItem.isActive !== 0 ? 1 : 0, // Convert to 1 or 0
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
      categoryId: "",
      days: "",
      price: "",
      deposit: "",
      isActive: 1, // Reset to 1 (active)
    });
    setFormVisible(false);
    setError("");
    setSuccess("");
    setSubmitting(false);
    setValidationErrors({});
  };
  // Manual retry function
  const handleRetry = () => {
    setError("");
    fetchPriceLists(currentPage, itemsPerPage);
  };
  // Pagination handlers
  const handleNextPage = () => {
    if (hasNext) {
      const nextPage = currentPage + 1;
      fetchPriceLists(nextPage, itemsPerPage);
    }
  };
  const handlePrevPage = () => {
    if (hasPrevious) {
      const prevPage = currentPage - 1;
      fetchPriceLists(prevPage, itemsPerPage);
    }
  };
  const handlePageClick = (pageNumber) => {
    fetchPriceLists(pageNumber, itemsPerPage);
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
  // Get category name by ID
  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === parseInt(categoryId));
    return category ? (category.categoryName || category.name) : `Category ${categoryId}`;
  };
  return (
    <div className="bg-gray-50 min-h-screen p-4">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Price Management</h1>
          <p className="text-gray-600 mt-1">Manage your pricing structure ({totalElements} price lists)</p>
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
      {/* Enhanced Success/Error Messages */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-400 rounded-r-lg animate-fade-in">
          <div className="flex">
            <FaCheck className="text-green-400 mt-0.5 mr-3" />
            <p className="text-sm text-green-700 font-medium">{success}</p>
          </div>
        </div>
      )}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg animate-fade-in">
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
      {formVisible ? (
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {editingId ? "Edit Price List" : "Add New Price List"}
            </h2>
            <p className="text-gray-600 mt-1">
              {editingId ? "Update price information below" : "Fill in the details to create a new price list"}
            </p>
          </div>
          <form onSubmit={editingId ? handleEditPrice : handleAddPrice} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Category Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
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
                  <option value="">Select Category</option>
                  {categoriesLoading ? (
                    <option value="" disabled>Loading categories...</option>
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
                  <p className="text-xs text-red-600 mt-1">{validationErrors.categoryId}</p>
                )}
              </div>
              {/* Days Dropdown */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Number of Days <span className="text-red-500">*</span>
                </label>
                <select
                  name="days"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 ${
                    validationErrors.days ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  value={formData.days}
                  onChange={handleInputChange}
                  required
                  disabled={submitting}
                >
                  <option value="">Select days</option>
                  {daysOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {validationErrors.days && (
                  <p className="text-xs text-red-600 mt-1">{validationErrors.days}</p>
                )}
              </div>
              {/* Price */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
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
                  max="999999.99"
                  step="0.01"
                  disabled={submitting}
                />
                {validationErrors.price && (
                  <p className="text-xs text-red-600 mt-1">{validationErrors.price}</p>
                )}
              </div>
              {/* Deposit */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Deposit Amount (₹)
                </label>
                <input
                  type="number"
                  name="deposit"
                  placeholder="Enter deposit amount (optional)"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 ${
                    validationErrors.deposit ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  value={formData.deposit}
                  onChange={handleInputChange}
                  min="0"
                  max="999999.99"
                  step="0.01"
                  disabled={submitting}
                />
                {validationErrors.deposit && (
                  <p className="text-xs text-red-600 mt-1">{validationErrors.deposit}</p>
                )}
              </div>
              {/* Status */}
              {/* <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <div className="flex items-center space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="isActive"
                      value="1"
                      checked={formData.isActive === 1}
                      onChange={handleInputChange}
                      className="form-radio h-4 w-4 text-indigo-600 transition duration-150 ease-in-out"
                      disabled={submitting}
                    />
                    <span className="ml-2">Active</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="isActive"
                      value="0"
                      checked={formData.isActive === 0}
                      onChange={handleInputChange}
                      className="form-radio h-4 w-4 text-indigo-600 transition duration-150 ease-in-out"
                      disabled={submitting}
                    />
                    <span className="ml-2">Inactive</span>
                  </label>
                </div>
              </div> */}
            </div>
            {/* Validation Summary */}
            {validationErrors.duplicate && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <FaExclamationTriangle className="inline mr-2" />
                  {validationErrors.duplicate}
                </p>
              </div>
            )}
            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                onClick={resetForm}
                disabled={submitting}
              >
                <FaTimes className="mr-2" />
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={submitting || Object.keys(validationErrors).length > 0}
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
                    <FaCheck className="mr-2" />
                    {editingId ? "Update Price" : "Create Price"}
                  </>
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
                All Price Lists ({totalElements} total)
              </h3>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search price lists..."
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
                    ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Days
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deposit
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
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                        <p className="text-gray-500">Loading price lists...</p>
                        {retryCount > 0 && (
                          <p className="text-sm text-gray-400 mt-2">Retry attempt {retryCount}/3</p>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : getCurrentPageData().length === 0 ? (
                  <tr key="empty-row">
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No price lists found</h3>
                        <p className="text-gray-500 mb-4">
                          {searchQuery ? `No price lists match "${searchQuery}"` : "Get started by creating your first price list"}
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
                  getCurrentPageData().map((priceItem, index) => (
                    <tr
                      key={`price-row-${priceItem.id}-${index}`}
                      className="hover:bg-gray-50 transition duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {priceItem.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{getCategoryName(priceItem.categoryId)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {priceItem.days} days
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          <span className="text-lg font-semibold text-green-600">₹{parseFloat(priceItem.price).toFixed(2)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <span className="font-medium">₹{parseFloat(priceItem.deposit || 0).toFixed(2)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(priceItem.id, priceItem.isActive)}
                          className={`inline-flex items-center px-3 py-2 rounded-full text-xs font-medium transition duration-200 ${
                            priceItem.isActive === 1
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : "bg-red-100 text-red-800 hover:bg-red-200"
                          }`}
                          title={`Click to ${priceItem.isActive === 1 ? 'deactivate' : 'activate'} price list`}
                        >
                          {priceItem.isActive === 1 ? (
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
                            className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition duration-200 text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                            onClick={() => handleEditPriceClick(priceItem)}
                            title="Edit price list"
                          >
                            <FaEdit className="mr-1" />
                            Edit
                          </button>
                          <button
                            className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition duration-200 text-red-700 bg-red-100 hover:bg-red-200"
                            onClick={() => setConfirmDeleteId(priceItem.id)}
                            title="Delete price list"
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
                    <h3 className="text-lg font-medium text-gray-900">Delete Price List</h3>
                    <p className="text-sm text-gray-500">This action cannot be undone</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-6">
                  Are you sure you want to delete this price list? This will permanently remove the pricing information.
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
                    onClick={() => handleDeletePrice(confirmDeleteId)}
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

export default PriceManagement;
