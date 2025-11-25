import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import axios from "axios";

const Offers = () => {
  const BASE_URL = import.meta.env.VITE_BASE_URL;
  
  // State
  const [offers, setOffers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");
  
  // Modal states
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showConfirmUpdate, setShowConfirmUpdate] = useState(false);

  const [offerData, setOfferData] = useState({
    offerName: "",
    offerCode: "",
    offerImage: "",
    discountType: "percentage",
    discountValue: "",
    appliesTo: "entire",
    minimumAmount: "",
    startDate: "",
    endDate: "",
    eligibility: "everyone",
    customerIds: "",
    usageLimit: "",
    isActive: 1,
    remainingCoupon: ""
  });

  const [errors, setErrors] = useState({});

  // Get auth token
  const getAuthToken = () => {
    return localStorage.getItem("token") || localStorage.getItem("authToken");
  };

  // ==================== SUCCESS/ERROR HANDLER ====================
  const showSuccessToast = (message) => {
    toast.success(message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      theme: "colored",
    });
  };

  const showErrorToast = (error) => {
    let errorMessage = "An error occurred";
    
    if (error.response) {
      errorMessage = error.response.data?.message ||
                     error.response.data?.error ||
                     error.response.data ||
                     `Error: ${error.response.status}`;
    } else if (error.request) {
      errorMessage = "Network error. Please check your connection.";
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    toast.error(errorMessage, {
      position: "top-right",
      autoClose: 4000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      theme: "colored",
    });
  };




// Fetch all offers on component mount
useEffect(() => {
  fetchAllOffers(currentPage, pageSize, sortBy, sortDir);
}, [currentPage, pageSize, sortBy, sortDir]); // Remove searchQuery from here

  // Fetch customers when eligibility changes
  useEffect(() => {
    if (offerData.eligibility === "specific_customer" && showForm) {
      fetchCustomers();
    }
  }, [offerData.eligibility, showForm]);

  // ==================== PAGINATION COMPONENTS ====================
  const PaginationControls = () => (
    <div className="mb-6 space-y-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="flex flex-wrap gap-4 items-center">
                <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
        >
          <option value="createdAt">Sort: Created Date</option>
          <option value="offerName">Sort: Offer Name</option>
          <option value="offerCode">Sort: Offer Code</option>
          <option value="discountValue">Sort: Discount Value</option>
          <option value="startDate">Sort: Start Date</option>
          <option value="endDate">Sort: End Date</option>
        </select>
        
        <select
          value={sortDir}
          onChange={(e) => setSortDir(e.target.value)}
          className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
        >
          <option value="desc">↓ Descending</option>
          <option value="asc">↑ Ascending</option>
        </select>
        
        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setCurrentPage(0);
          }}
          className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
        >
          <option value="10">10 per page</option>
          <option value="20">20 per page</option>
          <option value="50">50 per page</option>
          <option value="100">100 per page</option>
        </select>
      </div>
      
      <div className="text-sm text-gray-600 font-medium">
        Showing {offers.length > 0 ? (currentPage * pageSize) + 1 : 0} to {Math.min((currentPage + 1) * pageSize, totalElements)} of <span className="font-bold text-indigo-600">{totalElements}</span> offers
      </div>
    </div>
  );

  const PaginationButtons = () => (
    <div className="mt-6 flex flex-wrap justify-between items-center gap-4 px-6 py-4 bg-gray-50 border-t">
      <button
        onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
        disabled={currentPage === 0}
        className={`px-5 py-2.5 rounded-lg font-medium transition-all ${
          currentPage === 0
            ? 'bg-gray-300 cursor-not-allowed text-gray-500'
            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg'
        }`}
      >
        ← Previous
      </button>
      
      <div className="flex gap-2 items-center">
        <span className="text-sm text-gray-600 font-medium">
          Page <span className="font-bold text-indigo-600">{currentPage + 1}</span> of <span className="font-bold">{totalPages}</span>
        </span>
        
        <div className="flex gap-1">
          {[...Array(totalPages)].map((_, index) => {
            if (
              index === 0 ||
              index === totalPages - 1 ||
              (index >= currentPage - 2 && index <= currentPage + 2)
            ) {
              return (
                <button
                  key={index}
                  onClick={() => setCurrentPage(index)}
                  className={`px-3 py-1.5 rounded font-medium transition-all ${
                    currentPage === index
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  {index + 1}
                </button>
              );
            } else if (
              index === currentPage - 3 ||
              index === currentPage + 3
            ) {
              return <span key={index} className="px-2 text-gray-500">...</span>;
            }
            return null;
          })}
        </div>
      </div>
      
      <button
        onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
        disabled={currentPage >= totalPages - 1}
        className={`px-5 py-2.5 rounded-lg font-medium transition-all ${
          currentPage >= totalPages - 1
            ? 'bg-gray-300 cursor-not-allowed text-gray-500'
            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg'
        }`}
      >
        Next →
      </button>
    </div>
  );

  // ==================== API FUNCTIONS ====================
  const fetchAllOffers = async (page = 0, size = 20, sort = "createdAt", dir = "desc") => {
    setIsLoading(true);
    try {
      const params = {
        page: page,
        size: size,
        sortBy: sort,
        sortDir: dir
      };

      const response = await axios.get(`${BASE_URL}/api/offers/all`, {
        params: params,
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });
      
      const pageData = response.data;
      
      setOffers(pageData.content || []);
      setTotalPages(pageData.totalPages || 0);
      setTotalElements(pageData.totalElements || 0);
      setCurrentPage(pageData.number || 0);
      
    } catch (error) {
      console.error("Error fetching offers:", error);
      showErrorToast(error);
      setOffers([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomers = async (search = "") => {
    setLoadingCustomers(true);
    try {
      const response = await axios.get(`${BASE_URL}/api/auth/users/active-customers`, {
        params: {
          page: 0,
          size: 100,
          search: search,
          sortBy: "name",
          sortDirection: "asc"
        },
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });
      setCustomers(response.data.users || []);
    } catch (error) {
      console.error("Error fetching customers:", error);
      showErrorToast(error);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const createOffer = async (data) => {
    try {
      const response = await axios.post(`${BASE_URL}/api/offers/create`, data, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const updateOffer = async (id, data) => {
    try {
      const response = await axios.put(`${BASE_URL}/api/offers/${id}`, data, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const toggleOfferStatus = async (id) => {
    try {
      await axios.put(`${BASE_URL}/api/offers/${id}/toggle-status`, {}, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      throw error;
    }
  };

  // ==================== FORM HANDLERS ====================
  
  // New function to handle actual submission after validation/confirmation
  const executeSubmit = async () => {
    try {
      const payload = {
        offerName: offerData.offerName.trim(),
        offerCode: offerData.offerCode.trim().toUpperCase(),
        offerImage: offerData.offerImage?.trim() || null,
        discountType: offerData.discountType,
        discountValue: parseInt(offerData.discountValue),
        appliesTo: offerData.appliesTo,
        minimumAmount: parseFloat(offerData.minimumAmount),
        startDate: offerData.startDate,
        endDate: offerData.endDate,
        eligibility: offerData.eligibility,
        customerIds: offerData.eligibility === "specific_customer"
          ? selectedCustomers.join(",")
          : null,
        usageLimit: offerData.usageLimit ? parseInt(offerData.usageLimit) : null,
        isActive: offerData.isActive,
        remainingCoupon: offerData.remainingCoupon ? parseInt(offerData.remainingCoupon) : null
      };
      
      if (editingOffer) {
        await updateOffer(editingOffer.id, payload);
        showSuccessToast("✅ Coupon updated successfully!");
      } else {
        await createOffer(payload);
        setShowSuccessModal(true);
        setTimeout(() => {
  setShowSuccessModal(false);
  resetForm();
  setShowForm(false);
  setCurrentPage(0);
  fetchAllOffers(0, pageSize, sortBy, sortDir);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}, 2000);
        showSuccessToast("🎉 Coupon created successfully!");
      }
      
      resetForm();
      setShowForm(false);
      setCurrentPage(0);
      await fetchAllOffers(0, pageSize, sortBy, sortDir);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error("Error saving offer:", error);
      showErrorToast(error);
    } finally {
      setIsSubmitting(false);
      setShowConfirmUpdate(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!offerData.offerName.trim()) newErrors.offerName = "Offer name is required";
    if (!offerData.offerCode.trim()) newErrors.offerCode = "Coupon code is required";
    if (!offerData.discountType) newErrors.discountType = "Discount type is required";
    if (!offerData.discountValue || offerData.discountValue <= 0) newErrors.discountValue = "Discount value must be greater than 0";
    if (offerData.discountType === "percentage" && offerData.discountValue > 100) newErrors.discountValue = "Percentage cannot exceed 100%";
    if (!offerData.appliesTo) newErrors.appliesTo = "Applies to field is required";
    if (!offerData.minimumAmount || offerData.minimumAmount < 0) newErrors.minimumAmount = "Minimum amount is required";
    if (!offerData.startDate) newErrors.startDate = "Start date is required";
    if (!offerData.endDate) newErrors.endDate = "End date is required";
    if (offerData.startDate && offerData.endDate) {
      const start = new Date(offerData.startDate);
      const end = new Date(offerData.endDate);
      if (end < start) newErrors.endDate = "End date must be after start date";
    }
    if (offerData.eligibility === "specific_customer" && selectedCustomers.length === 0) {
      newErrors.customerIds = "Please select at least one customer";
    }
    if (!offerData.usageLimit || offerData.usageLimit <= 0) {
      newErrors.usageLimit = "Usage limit is required and must be greater than 0";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setOfferData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? (checked ? 1 : 0) : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleCustomerSelect = (customerId) => {
    setSelectedCustomers(prev => {
      if (prev.includes(customerId)) {
        return prev.filter(id => id !== customerId);
      } else {
        return [...prev, customerId];
      }
    });
    
    if (errors.customerIds) {
      setErrors(prev => ({ ...prev, customerIds: "" }));
    }
  };

  const handleCustomerSearch = (e) => {
    const searchValue = e.target.value;
    setCustomerSearch(searchValue);
    
    clearTimeout(window.customerSearchTimeout);
    window.customerSearchTimeout = setTimeout(() => {
      fetchCustomers(searchValue);
    }, 500);
  };

  // Modified handleSubmit to show confirmation for updates
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showErrorToast({ message: "Please fix all validation errors" });
      return;
    }
    
    setIsSubmitting(true);
    
    if (editingOffer) {
      // Show confirmation dialog for updates
      setShowConfirmUpdate(true);
    } else {
      // Directly create for new offers
      await executeSubmit();
    }
  };

  const handleEdit = (offer) => {
    setEditingOffer(offer);
    setOfferData({
      offerName: offer.offerName || "",
      offerCode: offer.offerCode || "",
      offerImage: offer.offerImage || "",
      discountType: offer.discountType || "percentage",
      discountValue: offer.discountValue || "",
      appliesTo: offer.appliesTo || "entire",
      minimumAmount: offer.minimumAmount || "",
      startDate: offer.startDate ? formatDateForInput(offer.startDate) : "",
      endDate: offer.endDate ? formatDateForInput(offer.endDate) : "",
      eligibility: offer.eligibility || "everyone",
      customerIds: offer.customerIds || "",
      usageLimit: offer.usageLimit || "",
      isActive: offer.isActive !== undefined ? offer.isActive : 1,
      remainingCoupon: offer.remainingCoupon || ""
    });
    
    if (offer.eligibility === "specific_customer" && offer.customerIds) {
      const customerIdArray = offer.customerIds.split(",").map(id => parseInt(id.trim()));
      setSelectedCustomers(customerIdArray);
    } else {
      setSelectedCustomers([]);
    }
    
    setShowForm(true);
    setErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleToggleStatus = async (offer) => {
    try {
      await toggleOfferStatus(offer.id);
      const statusMessage = offer.isActive === 1
        ? '🔴 Offer deactivated successfully'
        : '✅ Offer activated successfully';
      
      showSuccessToast(statusMessage);
      await fetchAllOffers(currentPage, pageSize, sortBy, sortDir);
    } catch (error) {
      console.error("Error toggling status:", error);
      showErrorToast(error);
    }
  };

  const resetForm = () => {
    setOfferData({
      offerName: "",
      offerCode: "",
      offerImage: "",
      discountType: "percentage",
      discountValue: "",
      appliesTo: "entire",
      minimumAmount: "",
      startDate: "",
      endDate: "",
      eligibility: "everyone",
      customerIds: "",
      usageLimit: "",
      isActive: 1,
      remainingCoupon: ""
    });
    setEditingOffer(null);
    setErrors({});
    setSelectedCustomers([]);
    setCustomerSearch("");
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Manage Offers & Coupons
        </h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Add New Offer
          </button>
        )}
      </div>
      
      {/* ✅ PAGINATION CONTROLS - ONLY SHOW WHEN FORM IS HIDDEN AND OFFERS EXIST */}
      {!showForm && !isLoading && offers.length > 0 && <PaginationControls />}
      
      {/* Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-xl shadow-lg mb-6 border border-gray-200"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800">
              {editingOffer ? "Edit Offer" : "Create New Offer"}
            </h3>
            <button
              type="button"
              onClick={handleCancel}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* REMOVED: PaginationControls from inside form */}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Offer Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Offer Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="offerName"
                value={offerData.offerName}
                onChange={handleChange}
                placeholder="Enter Offer Name"
                className={`w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  errors.offerName ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.offerName && (
                <p className="text-red-600 text-sm mt-1">{errors.offerName}</p>
              )}
            </div>
            
            {/* Coupon Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Coupon Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="offerCode"
                value={offerData.offerCode}
                onChange={handleChange}
                placeholder="e.g., SAVE20"
                className={`w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent uppercase ${
                  errors.offerCode ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.offerCode && (
                <p className="text-red-600 text-sm mt-1">{errors.offerCode}</p>
              )}
            </div>
            
            {/* Discount Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discount Type <span className="text-red-500">*</span>
              </label>
              <select
                name="discountType"
                value={offerData.discountType}
                onChange={handleChange}
                className={`w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  errors.discountType ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="percentage">Percentage (%)</option>
                <option value="amount">Fixed Amount (₹)</option>
              </select>
              {errors.discountType && (
                <p className="text-red-600 text-sm mt-1">{errors.discountType}</p>
              )}
            </div>
            
            {/* Discount Value */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discount Value <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="discountValue"
                value={offerData.discountValue}
                onChange={handleChange}
                placeholder={offerData.discountType === "percentage" ? "e.g., 20" : "e.g., 100"}
                min="0"
                max={offerData.discountType === "percentage" ? "100" : undefined}
                className={`w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  errors.discountValue ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.discountValue && (
                <p className="text-red-600 text-sm mt-1">{errors.discountValue}</p>
              )}
            </div>
            
            {/* Applies To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Applies To <span className="text-red-500">*</span>
              </label>
              <select
                name="appliesTo"
                value={offerData.appliesTo}
                onChange={handleChange}
                className={`w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  errors.appliesTo ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="first">First Order Only</option>
                <option value="entire">All Orders</option>
              </select>
              {errors.appliesTo && (
                <p className="text-red-600 text-sm mt-1">{errors.appliesTo}</p>
              )}
            </div>
            
            {/* Minimum Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Order Amount (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="minimumAmount"
                value={offerData.minimumAmount}
                onChange={handleChange}
                placeholder="e.g., 500"
                min="0"
                step="0.01"
                className={`w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  errors.minimumAmount ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.minimumAmount && (
                <p className="text-red-600 text-sm mt-1">{errors.minimumAmount}</p>
              )}
            </div>
            
            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Offer Start Date & Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                name="startDate"
                value={offerData.startDate}
                onChange={handleChange}
                className={`w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  errors.startDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.startDate && (
                <p className="text-red-600 text-sm mt-1">{errors.startDate}</p>
              )}
            </div>
            
            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Offer End Date & Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                name="endDate"
                value={offerData.endDate}
                onChange={handleChange}
                className={`w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  errors.endDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.endDate && (
                <p className="text-red-600 text-sm mt-1">{errors.endDate}</p>
              )}
            </div>
            
            {/* Usage Limit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Usage Limit (Total)
              </label>
              <input
                type="number"
                name="usageLimit"
                value={offerData.usageLimit}
                onChange={handleChange}
                placeholder="Leave empty for unlimited"
                min="0"
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Total number of times this coupon can be used
              </p>
            </div>
            
            {/* Customer Eligibility */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Eligibility <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-6 mb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="eligibility"
                    value="everyone"
                    checked={offerData.eligibility === "everyone"}
                    onChange={handleChange}
                    className="w-4 h-4 text-indigo-600"
                  />
                  <span>Everyone</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="eligibility"
                    value="specific_customer"
                    checked={offerData.eligibility === "specific_customer"}
                    onChange={handleChange}
                    className="w-4 h-4 text-indigo-600"
                  />
                  <span>Specific Customers</span>
                </label>
              </div>
              
              {offerData.eligibility === "specific_customer" && (
                <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                  {/* Search Box */}
                  <div className="mb-3">
                    <input
                      type="text"
                      value={customerSearch}
                      onChange={handleCustomerSearch}
                      placeholder="Search customers by name..."
                      className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  {/* Selected Customers Count */}
                  {selectedCustomers.length > 0 && (
                    <div className="mb-3 p-2 bg-indigo-50 rounded-lg border border-indigo-200">
                      <p className="text-sm font-medium text-indigo-800">
                        {selectedCustomers.length} customer(s) selected
                      </p>
                    </div>
                  )}
                  {/* Customer List */}
                  <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg bg-white">
                    {loadingCustomers ? (
                      <div className="flex justify-center items-center py-8">
                        <svg className="animate-spin h-6 w-6 text-indigo-600" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" fill="none" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      </div>
                    ) : customers.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p>No customers found</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200">
                        {customers.map((customer) => (
                          <label
                            key={customer.id}
                            className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={selectedCustomers.includes(customer.id)}
                              onChange={() => handleCustomerSelect(customer.id)}
                              className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                            />
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">
                                {customer.name}
                              </div>
                              {customer.email && (
                                <div className="text-xs text-gray-500">
                                  {customer.email}
                                </div>
                              )}
                              {customer.phone && (
                                <div className="text-xs text-gray-500">
                                  {customer.phone}
                                </div>
                              )}
                            </div>
                            <span className="text-xs text-gray-400">
                              ID: {customer.id}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  {errors.customerIds && (
                    <p className="text-red-600 text-sm mt-2">{errors.customerIds}</p>
                  )}
                </div>
              )}
            </div>
            
            {/* Offer Image URL */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Offer Image URL (Optional)
              </label>
              <input
                type="text"
                name="offerImage"
                value={offerData.offerImage}
                onChange={handleChange}
                placeholder="Enter image URL"
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            
            {/* Active Status */}
            <div className="col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={offerData.isActive === 1}
                  onChange={handleChange}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Activate this offer immediately
                </span>
              </label>
            </div>
          </div>
          
          {/* Submit Buttons */}
          <div className="mt-6 flex gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-2.5 text-white rounded-lg transition-colors font-medium ${
                isSubmitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-md'
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" fill="none" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </span>
              ) : (
                editingOffer ? 'Update Offer' : 'Create Offer'
              )}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
      
      {/* Success Animation Modal */}
      {/* Success Modal */}
{showSuccessModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform animate-scaleIn">
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
          <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Success! 🎉</h3>
        <p className="text-gray-600 text-lg">
          Coupon <span className="font-semibold text-indigo-600">{offerData.offerCode}</span> has been created successfully!
        </p>
      </div>
    </div>
  </div>
)}
      
      {/* Update Confirmation Modal */}
      {showConfirmUpdate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full mx-4 transform scale-100">
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
                <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Confirm Update</h3>
              <p className="text-gray-600 text-center mb-6">
                Are you sure you want to update this coupon? This will affect all future orders using this coupon code.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={executeSubmit}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-md"
                >
                  Confirm Update
                </button>
                <button
                  onClick={() => setShowConfirmUpdate(false)}
                  className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Offers Table */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <svg className="animate-spin h-12 w-12 text-indigo-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" fill="none" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : offers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-200">
          <svg className="w-20 h-20 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No Offers Yet</h3>
          <p className="text-gray-600 mb-6">Create your first offer to get started with promotions</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors shadow-md"
          >
            Create Offer
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          {/* Table Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-indigo-700">
            <h3 className="text-lg font-semibold text-white">All Offers ({totalElements})</h3>
          </div>
          
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Offer Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Coupon Code
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Discount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Min. Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Applies To
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Eligibility
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Usage
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Validity
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {offers.map((offer) => (
                  <tr key={offer.id} className="hover:bg-gray-50 transition-colors">
                    {/* Offer Details */}
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {offer.offerImage ? (
                            <img
                              src={offer.offerImage}
                              alt={offer.offerName}
                              className="h-10 w-10 rounded-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div
                            className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center"
                            style={{ display: offer.offerImage ? 'none' : 'flex' }}
                          >
                            <span className="text-indigo-600 font-bold text-sm">
                              {offer.offerName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900">
                            {offer.offerName}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {offer.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    {/* Coupon Code */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-semibold bg-indigo-100 text-indigo-800">
                        {offer.offerCode}
                      </span>
                    </td>
                    
                    {/* Discount */}
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">
                        {offer.discountType === 'percentage'
                          ? `${offer.discountValue}%`
                          : `₹${offer.discountValue}`}
                      </div>
                      <div className="text-xs text-gray-500">
                        {offer.discountType === 'percentage' ? 'Percentage' : 'Fixed Amount'}
                      </div>
                    </td>
                    
                    {/* Min Amount */}
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">
                        ₹{offer.minimumAmount}
                      </div>
                    </td>
                    
                    {/* Applies To */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        offer.appliesTo === 'first'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {offer.appliesTo === 'first' ? 'First Order' : 'All Orders'}
                      </span>
                    </td>
                    
                    {/* Eligibility */}
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className={`font-medium ${
                          offer.eligibility === 'everyone' ? 'text-green-700' : 'text-purple-700'
                        }`}>
                          {offer.eligibility === 'everyone' ? 'Everyone' : 'Specific'}
                        </div>
                        {offer.eligibility === 'specific_customer' && offer.customerIds && (
                          <div className="text-xs text-gray-500 mt-1">
                            {offer.customerIds.split(",").length} customer(s)
                          </div>
                        )}
                      </div>
                    </td>
                    
                    {/* Usage */}
                    <td className="px-6 py-4">
                      {offer.usageLimit ? (
                        <div className="text-sm">
                          <div className="font-semibold text-gray-900">
                            {offer.remainingCoupon || 0} / {offer.usageLimit}
                          </div>
                          <div className="text-xs text-gray-500">Remaining / Total</div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Unlimited</span>
                      )}
                    </td>
                    
                    {/* Validity */}
                    <td className="px-6 py-4">
                      <div className="text-xs text-gray-600">
                        <div className="mb-1">
                          <span className="font-medium">From:</span> {formatDate(offer.startDate)}
                        </div>
                        <div>
                          <span className="font-medium">To:</span> {formatDate(offer.endDate)}
                        </div>
                      </div>
                    </td>
                    
                    {/* Status */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        offer.isActive === 1
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {offer.isActive === 1 ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    
                    {/* Actions */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(offer)}
                          className="inline-flex items-center px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-md hover:bg-indigo-700 transition-colors"
                          title="Edit Offer"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleStatus(offer)}
                          className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                            offer.isActive === 1
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                          title={offer.isActive === 1 ? 'Deactivate' : 'Activate'}
                        >
                          {offer.isActive === 1 ? 'Deactivate' : (
                            <>
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                              Activate
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* ✅ PAGINATION BUTTONS - At the bottom of table */}
          <PaginationButtons />
        </div>
      )}
    </div>
  );
};

export default Offers;
