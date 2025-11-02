// pages/UserBooking/CreateUserBooking.jsx
import React, { useState, useEffect } from "react";
import {
  FaMapMarkerAlt, FaStore, FaCalendar, FaClock, FaMotorcycle,
  FaUser, FaPhone, FaMailBulk, FaHome, FaCheck, FaTimes,
  FaExclamationTriangle, FaSpinner, FaMoneyBillWave, FaCheckCircle,
  FaSearch, FaChevronDown
} from "react-icons/fa";
import { toast } from "react-toastify";
import apiClient from "../../api/apiConfig";

const CreateUserBooking = () => {
  // ═══════════════════════════════════════════════════════════════════════════
  // STATE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  // Master Data
  const [allCities, setAllCities] = useState([]);
  const [allStores, setAllStores] = useState([]);
  const [availableBikes, setAvailableBikes] = useState([]);
  const [filteredStores, setFilteredStores] = useState([]);

  // Selections
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedStore, setSelectedStore] = useState("");
  const [selectedBike, setSelectedBike] = useState("");

  // Dates & Times
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("18:00");
  const [totalHours, setTotalHours] = useState(0);

  // Customer Details
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerData, setCustomerData] = useState({
    name: "",
    phoneNumber: "",
    email: "",
    alternateNumber: "",
    address: ""
  });
  const [isExistingCustomer, setIsExistingCustomer] = useState(false);
  const [customerFetching, setCustomerFetching] = useState(false);

  // Pagination for Bikes
  const [bikesDisplayCount, setBikesDisplayCount] = useState(6);
  const [totalBikesCount, setTotalBikesCount] = useState(0);

  // UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [storesLoading, setStoresLoading] = useState(false);
  const [bikesLoading, setBikesLoading] = useState(false);

  // ═══════════════════════════════════════════════════════════════════════════
  // INITIAL LOAD - FETCH ACTIVE CITIES AND STORES
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    fetchActiveCities();
    fetchActiveStores();
  }, []);

  const fetchActiveCities = async () => {
    setCitiesLoading(true);
    try {
      const response = await apiClient.get("/api/cities/active");
      const cities = response.data?.data || response.data || [];
      setAllCities(Array.isArray(cities) ? cities : []);
      
      if (cities.length === 0) {
        toast.info("No active cities available");
      }
    } catch (error) {
      console.error("Error fetching cities:", error);
      toast.error("Failed to load cities");
      setAllCities([]);
    } finally {
      setCitiesLoading(false);
    }
  };

  const fetchActiveStores = async () => {
    setStoresLoading(true);
    try {
      const response = await apiClient.get("/api/stores/active");
      const stores = response.data?.data || response.data || [];
      setAllStores(Array.isArray(stores) ? stores : []);
      
      if (stores.length === 0) {
        toast.info("No active stores available");
      }
    } catch (error) {
      console.error("Error fetching stores:", error);
      toast.error("Failed to load stores");
      setAllStores([]);
    } finally {
      setStoresLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // FETCH CUSTOMER BY PHONE NUMBER (Backend checks getUserByPhoneNumber)
  // ═══════════════════════════════════════════════════════════════════════════
  const handlePhoneNumberSearch = async () => {
    if (!customerPhone || customerPhone.length !== 10) {
      toast.warning("Please enter a valid 10-digit phone number");
      return;
    }

    setCustomerFetching(true);
    setError("");
    
    try {
      // Try to get user by phone number - same logic as backend
      const response = await apiClient.get(`/api/auth/by-phone/${customerPhone}`);
      const userData = response.data?.data || response.data;
      
      if (userData) {
        // Customer exists - populate form
        setCustomerData({
          name: userData.name || "",
          phoneNumber: userData.phoneNumber || customerPhone,
          email: userData.email || "",
          alternateNumber: userData.alternateNumber || "",
          address: userData.address || ""
        });
        setIsExistingCustomer(true);
        toast.success(`✅ Existing customer: ${userData.name}`);
      }
    } catch (error) {
      // Customer doesn't exist - backend will register them during booking
      if (error.response?.status === 404 || error.response?.status === 400) {
        setCustomerData({
          name: "",
          phoneNumber: customerPhone,
          email: "",
          alternateNumber: "",
          address: ""
        });
        setIsExistingCustomer(false);
        toast.info("📝 New customer - please fill in details below");
      } else {
        console.error("Error fetching customer:", error);
        toast.error("Failed to fetch customer details");
      }
    } finally {
      setCustomerFetching(false);
    }
  };

  // Auto-search when phone number is 10 digits
  useEffect(() => {
    if (customerPhone.length === 10 && /^\d{10}$/.test(customerPhone)) {
      handlePhoneNumberSearch();
    } else if (customerPhone.length < 10) {
      // Reset customer data if phone is incomplete
      setIsExistingCustomer(false);
      setCustomerData({
        name: "",
        phoneNumber: customerPhone,
        email: "",
        alternateNumber: "",
        address: ""
      });
    }
  }, [customerPhone]);

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLE CITY CHANGE - FILTER STORES BY CITY
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (selectedCity && allStores.length > 0) {
      const storesInCity = allStores.filter(
        store => store.cityId === parseInt(selectedCity) || store.city?.id === parseInt(selectedCity)
      );
      setFilteredStores(storesInCity);
      
      if (storesInCity.length === 0) {
        toast.warning("No stores available in this city");
      }
    } else {
      setFilteredStores([]);
    }
  }, [selectedCity, allStores]);

  const handleCityChange = (e) => {
    const cityId = e.target.value;
    setSelectedCity(cityId);
    setSelectedStore("");
    setSelectedBike("");
    setAvailableBikes([]);
    setBikesDisplayCount(6);
    setError("");
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLE DATE/TIME CHANGE - CALCULATE HOURS
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    calculateTotalHours();
  }, [startDate, startTime, endDate, endTime]);

  const handleDateTimeChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "startDate") setStartDate(value);
    if (name === "startTime") setStartTime(value);
    if (name === "endDate") setEndDate(value);
    if (name === "endTime") setEndTime(value);

    // Reset bikes when dates change
    setAvailableBikes([]);
    setSelectedBike("");
    setBikesDisplayCount(6);
    setError("");
  };

  const calculateTotalHours = () => {
    if (!startDate || !endDate || !startTime || !endTime) {
      setTotalHours(0);
      return;
    }

    try {
      const start = new Date(`${startDate}T${startTime}`);
      const end = new Date(`${endDate}T${endTime}`);

      if (start >= end) {
        setError("End date/time must be after start date/time");
        setTotalHours(0);
        return;
      }

      const hours = (end - start) / (1000 * 60 * 60);
      setTotalHours(parseFloat(hours.toFixed(2)));
      setError("");
    } catch (e) {
      setTotalHours(0);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // CHECK AVAILABLE BIKES WITH PAGINATION
  // ═══════════════════════════════════════════════════════════════════════════
  const handleCheckAvailableBikes = async () => {
    // Validation
    if (!customerPhone || customerPhone.length !== 10) {
      toast.error("Please enter customer phone number first");
      return;
    }
    if (!selectedCity) {
      toast.error("Please select a city");
      return;
    }
    if (!selectedStore) {
      toast.error("Please select a store");
      return;
    }
    if (!startDate || !endDate) {
      toast.error("Please select start and end dates");
      return;
    }
    if (!startTime || !endTime) {
      toast.error("Please select start and end times");
      return;
    }
    if (totalHours <= 0) {
      toast.error("Invalid date/time range");
      return;
    }

    setBikesLoading(true);
    setError("");
    setAvailableBikes([]);
    setSelectedBike("");
    setBikesDisplayCount(6);

    try {
      // Format dates as ISO strings
      const startDateTime = new Date(`${startDate}T${startTime}`).toISOString();
      const endDateTime = new Date(`${endDate}T${endTime}`).toISOString();

      const response = await apiClient.get("/api/bikes/available", {
        params: {
          storeId: selectedStore,
          startDate: startDateTime,
          endDate: endDateTime,
          page: 0,
          size: 100 // Fetch all bikes, we'll handle pagination on frontend
        }
      });

      // Handle different response structures
      let bikes = [];
      let total = 0;

      if (response.data?.content) {
        // Paginated response
        bikes = response.data.content;
        total = response.data.totalElements || bikes.length;
      } else if (response.data?.data) {
        bikes = Array.isArray(response.data.data) ? response.data.data : [];
        total = bikes.length;
      } else if (Array.isArray(response.data)) {
        bikes = response.data;
        total = bikes.length;
      }
      
      setAvailableBikes(bikes);
      setTotalBikesCount(total);
      
      if (bikes.length === 0) {
        setError("No bikes available for selected dates and store");
        toast.warning("No bikes available");
      } else {
        toast.success(`Found ${bikes.length} available bike(s)`);
      }
    } catch (error) {
      console.error("Error checking bikes:", error);
      const errorMsg = error.response?.data?.message || "Failed to check bike availability";
      setError(errorMsg);
      toast.error(errorMsg);
      setAvailableBikes([]);
      setTotalBikesCount(0);
    } finally {
      setBikesLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLE VIEW MORE BIKES
  // ═══════════════════════════════════════════════════════════════════════════
  const handleViewMore = () => {
    setBikesDisplayCount(prev => Math.min(prev + 6, availableBikes.length));
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLE CUSTOMER INPUT CHANGE
  // ═══════════════════════════════════════════════════════════════════════════
  const handleCustomerChange = (e) => {
    const { name, value } = e.target;
    setCustomerData(prev => ({ ...prev, [name]: value }));

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: undefined }));
    }
    setError("");
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // CALCULATE CHARGES
  // ═══════════════════════════════════════════════════════════════════════════
  const calculateCharges = () => {
    const selectedBikeData = availableBikes.find(b => b.id === parseInt(selectedBike));
    if (!selectedBikeData || totalHours === 0) {
      return { baseCharges: 0, gst: 0, total: 0 };
    }

    const dailyRate = selectedBikeData.dailyRate || selectedBikeData.price || 500;
    const baseCharge = dailyRate * (totalHours / 24);
    const gstAmount = baseCharge * 0.18; // 18% GST
    const total = baseCharge + gstAmount;

    return {
      baseCharges: parseFloat(baseCharge.toFixed(2)),
      gst: parseFloat(gstAmount.toFixed(2)),
      total: parseFloat(total.toFixed(2))
    };
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // VALIDATION
  // ═══════════════════════════════════════════════════════════════════════════
  const validateForm = () => {
    const errors = {};

    // Customer validations
    if (!customerPhone || customerPhone.length !== 10) {
      errors.phone = "Valid 10-digit phone number is required";
    }
    if (!customerData.name.trim()) {
      errors.name = "Name is required";
    }
    if (!customerData.phoneNumber.trim()) {
      errors.phoneNumber = "Phone number is required";
    } else if (!/^\d{10}$/.test(customerData.phoneNumber.trim())) {
      errors.phoneNumber = "Phone number must be 10 digits";
    }
    if (customerData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerData.email)) {
      errors.email = "Invalid email format";
    }
    if (!customerData.address.trim()) {
      errors.address = "Address is required";
    }

    // Booking validations
    if (!selectedCity) errors.city = "City is required";
    if (!selectedStore) errors.store = "Store is required";
    if (!startDate) errors.startDate = "Start date is required";
    if (!endDate) errors.endDate = "End date is required";
    if (!selectedBike) errors.bike = "Please select a bike";

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // CREATE BOOKING - Matches Backend Controller Flow
  // ═══════════════════════════════════════════════════════════════════════════
  const handleCreateBooking = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateForm()) {
      setError("Please fill all required fields correctly");
      toast.error("Please fix validation errors");
      return;
    }

    setLoading(true);

    try {
      const charges = calculateCharges();
      const startDateTime = new Date(`${startDate}T${startTime}`).toISOString();
      const endDateTime = new Date(`${endDate}T${endTime}`).toISOString();

      // Payload matches AdminRegisterAndBookRequest structure
      const payload = {
        customer: {
          name: customerData.name.trim(),
          phoneNumber: customerData.phoneNumber.trim(),
          email: customerData.email.trim() || null,
          alternateNumber: customerData.alternateNumber.trim() || null
        },
        booking: {
          vehicleId: parseInt(selectedBike),
          storeId: parseInt(selectedStore),
          startDate: startDateTime,
          endDate: endDateTime,
          charges: charges.baseCharges,
          gst: charges.gst,
          finalAmount: charges.total,
          totalHours: totalHours,
          address: customerData.address.trim(),
          addressType: "home",
          paymentType: 1, // COD
          additionalCharges: 0,
          advanceAmount: 0
        }
      };

      console.log("📤 Booking payload:", payload);

      // Backend will:
      // 1. Try getUserByPhoneNumber(phoneNumber)
      // 2. If UserNotFoundException, call adminRegisterUser(customer)
      // 3. Set customerId from user
      // 4. Create booking
      const response = await apiClient.post(
        "/api/booking-bikes/admin/bookings/register-and-book",
        payload
      );

      const bookingId = response.data?.data?.bookingId || response.data?.bookingId || "N/A";
      const message = response.data?.data?.message || response.data?.message || "Booking confirmed!";
      
      setSuccess(bookingId);
      toast.success(`✅ ${message} Booking ID: ${bookingId}`);

      console.log("✅ Booking successful:", response.data);

      // Reset form after successful booking
      setTimeout(() => {
        resetForm();
      }, 3000);

    } catch (error) {
      console.error("❌ Booking error:", error);
      const errorMsg = error.response?.data?.message || 
                      error.response?.data?.error ||
                      "Failed to create booking. Please try again.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RESET FORM
  // ═══════════════════════════════════════════════════════════════════════════
  const resetForm = () => {
    setCustomerPhone("");
    setCustomerData({
      name: "",
      phoneNumber: "",
      email: "",
      alternateNumber: "",
      address: ""
    });
    setIsExistingCustomer(false);
    setSelectedCity("");
    setSelectedStore("");
    setSelectedBike("");
    setStartDate("");
    setEndDate("");
    setStartTime("09:00");
    setEndTime("18:00");
    setAvailableBikes([]);
    setFilteredStores([]);
    setValidationErrors({});
    setError("");
    setSuccess("");
    setTotalHours(0);
    setBikesDisplayCount(6);
    setTotalBikesCount(0);
  };

  const charges = calculateCharges();
  const displayedBikes = availableBikes.slice(0, bikesDisplayCount);
  const hasMoreBikes = bikesDisplayCount < availableBikes.length;

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-[#2B2B80] mb-2">
            🏍️ Admin Booking Panel
          </h1>
          <p className="text-gray-600 text-lg">Create bike bookings for customers</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 rounded-lg animate-bounce">
            <div className="flex items-center">
              <FaCheckCircle className="text-green-500 text-2xl mr-3" />
              <div>
                <p className="font-bold text-green-700">✅ Booking Confirmed!</p>
                <p className="text-green-600">
                  Booking ID: <span className="font-mono font-bold text-lg">{success}</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
            <div className="flex items-start">
              <FaExclamationTriangle className="text-red-500 mt-0.5 mr-3 flex-shrink-0 text-lg" />
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Main Form Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <form onSubmit={handleCreateBooking}>
            <div className="p-6 md:p-8">
              
              {/* ═══════════════════════════════════════════════════════════════ */}
              {/* STEP 1: CUSTOMER PHONE NUMBER (FIRST) */}
              {/* ═══════════════════════════════════════════════════════════════ */}
              <div className="mb-8 pb-8 border-b-2 border-gray-100">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  <span className="bg-[#2B2B80] text-white rounded-full w-8 h-8 flex items-center justify-center mr-3">1</span>
                  Customer Phone Number
                </h3>

                <div className="space-y-2">
                  <label className="flex items-center text-sm font-bold text-gray-800">
                    <FaPhone className="mr-2 text-[#2B2B80] text-lg" />
                    Customer Phone Number <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        if (value.length <= 10) {
                          setCustomerPhone(value);
                        }
                      }}
                      placeholder="Enter 10-digit phone number"
                      className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#2B2B80] focus:ring-2 focus:ring-blue-200 transition text-gray-700 font-medium text-lg"
                      maxLength="10"
                    />
                    <button
                      type="button"
                      onClick={handlePhoneNumberSearch}
                      disabled={customerFetching || customerPhone.length !== 10}
                      className="px-6 py-3 bg-[#2B2B80] text-white rounded-lg hover:bg-[#24246A] transition font-bold disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
                    >
                      {customerFetching ? (
                        <FaSpinner className="animate-spin" />
                      ) : (
                        <>
                          <FaSearch className="mr-2" />
                          Search
                        </>
                      )}
                    </button>
                  </div>
                  {validationErrors.phone && (
                    <p className="text-xs text-red-600 font-semibold">{validationErrors.phone}</p>
                  )}
                  {isExistingCustomer && (
                    <div className="mt-2 p-3 bg-green-50 border border-green-300 rounded-lg">
                      <p className="text-sm text-green-700 font-semibold flex items-center">
                        <FaCheckCircle className="mr-2" />
                        ✅ Existing customer found! Details loaded below.
                      </p>
                    </div>
                  )}
                  {customerPhone.length === 10 && !isExistingCustomer && customerData.phoneNumber && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-300 rounded-lg">
                      <p className="text-sm text-blue-700 font-semibold flex items-center">
                        <FaUser className="mr-2" />
                        📝 New customer - will be registered automatically during booking.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Show remaining form only if phone number is entered */}
              {customerPhone.length === 10 && (
                <>
                  {/* ═══════════════════════════════════════════════════════════════ */}
                  {/* STEP 2: CUSTOMER DETAILS */}
                  {/* ═══════════════════════════════════════════════════════════════ */}
                  <div className="mb-8 pb-8 border-b-2 border-gray-100">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                      <span className="bg-[#2B2B80] text-white rounded-full w-8 h-8 flex items-center justify-center mr-3">2</span>
                      Customer Details
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Name */}
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-800">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="name"
                          placeholder="Customer's full name"
                          value={customerData.name}
                          onChange={handleCustomerChange}
                          className={`w-full px-4 py-3 border-2 rounded-lg transition font-medium ${
                            validationErrors.name
                              ? "border-red-400 bg-red-50 focus:border-red-500"
                              : "border-gray-300 focus:border-[#2B2B80] focus:ring-2 focus:ring-blue-200"
                          }`}
                          disabled={loading}
                        />
                        {validationErrors.name && (
                          <p className="text-xs text-red-600 font-semibold">{validationErrors.name}</p>
                        )}
                      </div>

                      {/* Email */}
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-800 flex items-center">
                          <FaMailBulk className="mr-1 text-[#2B2B80]" />
                          Email Address (Optional)
                        </label>
                        <input
                          type="email"
                          name="email"
                          placeholder="customer@email.com"
                          value={customerData.email}
                          onChange={handleCustomerChange}
                          className={`w-full px-4 py-3 border-2 rounded-lg transition font-medium ${
                            validationErrors.email
                              ? "border-red-400 bg-red-50 focus:border-red-500"
                              : "border-gray-300 focus:border-[#2B2B80] focus:ring-2 focus:ring-blue-200"
                          }`}
                          disabled={loading}
                        />
                        {validationErrors.email && (
                          <p className="text-xs text-red-600 font-semibold">{validationErrors.email}</p>
                        )}
                      </div>

                      {/* Alternate Phone */}
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-800">
                          Alternate Phone (Optional)
                        </label>
                        <input
                          type="tel"
                          name="alternateNumber"
                          placeholder="Alternate contact"
                          value={customerData.alternateNumber}
                          onChange={handleCustomerChange}
                          maxLength="10"
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#2B2B80] focus:ring-2 focus:ring-blue-200 transition font-medium"
                          disabled={loading}
                        />
                      </div>

                      {/* Address */}
                      <div className="space-y-2 md:col-span-2">
                        <label className="block text-sm font-bold text-gray-800 flex items-center">
                          <FaHome className="mr-1 text-[#2B2B80]" />
                          Delivery Address <span className="text-red-500 ml-1">*</span>
                        </label>
                        <textarea
                          name="address"
                          placeholder="Complete address for bike delivery"
                          value={customerData.address}
                          onChange={handleCustomerChange}
                          rows="3"
                          className={`w-full px-4 py-3 border-2 rounded-lg transition font-medium resize-none ${
                            validationErrors.address
                              ? "border-red-400 bg-red-50 focus:border-red-500"
                              : "border-gray-300 focus:border-[#2B2B80] focus:ring-2 focus:ring-blue-200"
                          }`}
                          disabled={loading}
                        />
                        {validationErrors.address && (
                          <p className="text-xs text-red-600 font-semibold">{validationErrors.address}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ═══════════════════════════════════════════════════════════════ */}
                  {/* STEP 3: SELECT CITY & STORE */}
                  {/* ═══════════════════════════════════════════════════════════════ */}
                  <div className="mb-8 pb-8 border-b-2 border-gray-100">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                      <span className="bg-[#2B2B80] text-white rounded-full w-8 h-8 flex items-center justify-center mr-3">3</span>
                      Select Location
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* City */}
                      <div className="space-y-2">
                        <label className="flex items-center text-sm font-bold text-gray-800">
                          <FaMapMarkerAlt className="mr-2 text-[#2B2B80] text-lg" />
                          City <span className="text-red-500 ml-1">*</span>
                        </label>
                        <select
                          value={selectedCity}
                          onChange={handleCityChange}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#2B2B80] focus:ring-2 focus:ring-blue-200 transition text-gray-700 font-medium"
                          disabled={citiesLoading}
                        >
                          <option value="">{citiesLoading ? "Loading cities..." : "Select a city"}</option>
                          {allCities.map(city => (
                            <option key={city.id} value={city.id}>
                              📍 {city.cityName || city.name} {city.state ? `(${city.state})` : ''}
                            </option>
                          ))}
                        </select>
                        {validationErrors.city && (
                          <p className="text-xs text-red-600 font-semibold">{validationErrors.city}</p>
                        )}
                      </div>

                      {/* Store */}
                      <div className="space-y-2">
                        <label className="flex items-center text-sm font-bold text-gray-800">
                          <FaStore className="mr-2 text-[#2B2B80] text-lg" />
                          Store <span className="text-red-500 ml-1">*</span>
                        </label>
                        <select
                          value={selectedStore}
                          onChange={(e) => {
                            setSelectedStore(e.target.value);
                            setAvailableBikes([]);
                            setSelectedBike("");
                            setBikesDisplayCount(6);
                          }}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#2B2B80] focus:ring-2 focus:ring-blue-200 transition text-gray-700 font-medium disabled:bg-gray-100"
                          disabled={!selectedCity || storesLoading || filteredStores.length === 0}
                        >
                          <option value="">
                            {!selectedCity ? "Select city first" : 
                             storesLoading ? "Loading stores..." : 
                             filteredStores.length === 0 ? "No stores in this city" :
                             "Select a store"}
                          </option>
                          {filteredStores.map(store => (
                            <option key={store.id} value={store.id}>
                              🏪 {store.storeName || store.name}
                            </option>
                          ))}
                        </select>
                        {validationErrors.store && (
                          <p className="text-xs text-red-600 font-semibold">{validationErrors.store}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ═══════════════════════════════════════════════════════════════ */}
                  {/* STEP 4: SELECT DATES & TIMES */}
                  {/* ═══════════════════════════════════════════════════════════════ */}
                  <div className="mb-8 pb-8 border-b-2 border-gray-100">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                      <span className="bg-[#2B2B80] text-white rounded-full w-8 h-8 flex items-center justify-center mr-3">4</span>
                      Select Rental Period
                    </h3>

                    {/* Start Date & Time */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="space-y-2">
                        <label className="flex items-center text-sm font-bold text-gray-800">
                          <FaCalendar className="mr-2 text-[#2B2B80] text-lg" />
                          Start Date <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                          type="date"
                          name="startDate"
                          value={startDate}
                          onChange={handleDateTimeChange}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#2B2B80] focus:ring-2 focus:ring-blue-200 transition font-medium"
                          min={new Date().toISOString().split('T')[0]}
                          disabled={!selectedStore}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-center text-sm font-bold text-gray-800">
                          <FaClock className="mr-2 text-[#2B2B80] text-lg" />
                          Start Time <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                          type="time"
                          name="startTime"
                          value={startTime}
                          onChange={handleDateTimeChange}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#2B2B80] focus:ring-2 focus:ring-blue-200 transition font-medium"
                          disabled={!startDate}
                        />
                      </div>
                    </div>

                    {/* End Date & Time */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="flex items-center text-sm font-bold text-gray-800">
                          <FaCalendar className="mr-2 text-[#2B2B80] text-lg" />
                          End Date <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                          type="date"
                          name="endDate"
                          value={endDate}
                          onChange={handleDateTimeChange}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#2B2B80] focus:ring-2 focus:ring-blue-200 transition font-medium"
                          min={startDate || new Date().toISOString().split('T')[0]}
                          disabled={!startDate}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-center text-sm font-bold text-gray-800">
                          <FaClock className="mr-2 text-[#2B2B80] text-lg" />
                          End Time <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                          type="time"
                          name="endTime"
                          value={endTime}
                          onChange={handleDateTimeChange}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#2B2B80] focus:ring-2 focus:ring-blue-200 transition font-medium"
                          disabled={!endDate}
                        />
                      </div>
                    </div>

                    {/* Duration Display */}
                    {totalHours > 0 && (
                      <div className="mt-6">
                        <div className="bg-gradient-to-r from-blue-100 to-indigo-100 border-2 border-blue-300 rounded-lg p-4">
                          <p className="text-center text-blue-900 font-bold text-lg">
                            ⏱️ Rental Duration: <span className="text-2xl text-blue-700">{totalHours}</span> Hours
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Check Availability Button */}
                    {startDate && endDate && selectedStore && totalHours > 0 && (
                      <div className="mt-6">
                        <button
                          type="button"
                          onClick={handleCheckAvailableBikes}
                          disabled={bikesLoading}
                          className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition font-bold text-lg disabled:bg-gray-400 flex items-center justify-center"
                        >
                          {bikesLoading ? (
                            <>
                              <FaSpinner className="animate-spin mr-2" />
                              Checking Available Bikes...
                            </>
                          ) : (
                            <>
                              🔍 Check Available Bikes
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* ═══════════════════════════════════════════════════════════════ */}
                  {/* STEP 5: SELECT BIKE (WITH PAGINATION) */}
                  {/* ═══════════════════════════════════════════════════════════════ */}
                  {availableBikes.length > 0 && (
                    <div className="mb-8 pb-8 border-b-2 border-gray-100">
                      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                        <span className="bg-[#2B2B80] text-white rounded-full w-8 h-8 flex items-center justify-center mr-3">5</span>
                        Choose Your Bike ({totalBikesCount} available)
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {displayedBikes.map(bike => (
                          <div
                            key={bike.id}
                            onClick={() => setSelectedBike(bike.id.toString())}
                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all transform hover:scale-105 ${
                              selectedBike === bike.id.toString()
                                ? "border-[#2B2B80] bg-blue-50 shadow-lg"
                                : "border-gray-300 hover:border-blue-400 hover:shadow-md"
                            }`}
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <p className="font-bold text-lg text-gray-900">{bike.model}</p>
                                <p className="text-sm text-gray-600">{bike.brand}</p>
                              </div>
                              {selectedBike === bike.id.toString() && (
                                <FaCheck className="text-[#2B2B80] text-xl" />
                              )}
                            </div>
                            <div className="space-y-2 text-sm">
                              <p className="text-gray-700">
                                📝 <span className="font-semibold">{bike.registrationNumber}</span>
                              </p>
                              {/* <p className="text-gray-700 font-bold">
                                💰 ₹{bike.dailyRate || bike.price}/day
                              </p> */}
                              {/* {selectedBike === bike.id.toString() && charges.total > 0 && (
                                <p className="text-green-600 font-bold pt-2 border-t border-gray-200">
                                  Total: ₹{charges.total.toFixed(2)}
                                </p>
                              )} */}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* View More Button */}
                      {hasMoreBikes && (
                        <div className="mt-6 flex justify-center">
                          <button
                            type="button"
                            onClick={handleViewMore}
                            className="px-8 py-3 bg-white border-2 border-[#2B2B80] text-[#2B2B80] rounded-lg hover:bg-[#2B2B80] hover:text-white transition font-bold text-lg flex items-center"
                          >
                            View More Bikes ({availableBikes.length - bikesDisplayCount} remaining)
                            <FaChevronDown className="ml-2" />
                          </button>
                        </div>
                      )}

                      {validationErrors.bike && (
                        <p className="text-sm text-red-600 font-semibold mt-2">{validationErrors.bike}</p>
                      )}
                    </div>
                  )}

                  {/* ═══════════════════════════════════════════════════════════════ */}
                  {/* STEP 6: PRICE BREAKDOWN & SUMMARY */}
                  {/* ═══════════════════════════════════════════════════════════════ */}
                  {selectedBike && charges.total > 0 && (
                    <div className="mb-8">
                      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                        <span className="bg-[#2B2B80] text-white rounded-full w-8 h-8 flex items-center justify-center mr-3">6</span>
                        Booking Summary
                      </h3>

                      {/* Price Breakdown Cards */}
                      {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border-2 border-blue-200">
                          <p className="text-sm text-gray-600 font-semibold">Duration</p>
                          <p className="text-2xl font-bold text-[#2B2B80]">{totalHours}h</p>
                        </div>

                        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-4 border-2 border-indigo-200">
                          <p className="text-sm text-gray-600 font-semibold">Base Rate</p>
                          <p className="text-2xl font-bold text-indigo-700">₹{charges.baseCharges.toFixed(2)}</p>
                        </div>

                        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border-2 border-yellow-200">
                          <p className="text-sm text-gray-600 font-semibold">GST (18%)</p>
                          <p className="text-2xl font-bold text-yellow-700">₹{charges.gst.toFixed(2)}</p>
                        </div>

                        <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg p-4 border-3 border-green-400">
                          <p className="text-sm text-gray-600 font-semibold">Total Amount</p>
                          <p className="text-2xl font-bold text-green-700">₹{charges.total.toFixed(2)}</p>
                        </div>
                      </div> */}

                      {/* Booking Details Summary */}
                      <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
                        <p className="text-sm font-bold text-gray-800 mb-3">📋 Complete Booking Details:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
                          <p>👤 Customer: <span className="font-semibold">{customerData.name}</span></p>
                          <p>📞 Phone: <span className="font-semibold">{customerData.phoneNumber}</span></p>
                          <p>📍 City: <span className="font-semibold">{allCities.find(c => c.id === parseInt(selectedCity))?.cityName || allCities.find(c => c.id === parseInt(selectedCity))?.name}</span></p>
                          <p>🏪 Store: <span className="font-semibold">{filteredStores.find(s => s.id === parseInt(selectedStore))?.storeName}</span></p>
                          <p>🚗 Bike: <span className="font-semibold">{availableBikes.find(b => b.id === parseInt(selectedBike))?.model} ({availableBikes.find(b => b.id === parseInt(selectedBike))?.brand})</span></p>
                          <p>📝 Registration: <span className="font-semibold">{availableBikes.find(b => b.id === parseInt(selectedBike))?.registrationNumber}</span></p>
                          <p>📅 Start: <span className="font-semibold">{startDate} at {startTime}</span></p>
                          <p>📅 End: <span className="font-semibold">{endDate} at {endTime}</span></p>
                          <p>⏱️ Duration: <span className="font-semibold">{totalHours} hours</span></p>
                          <p>💳 Payment: <span className="font-semibold text-green-600">COD (Cash on Delivery)</span></p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* FOOTER: ACTION BUTTONS */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {selectedBike && (
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 md:p-8 flex flex-col md:flex-row gap-4 justify-end border-t-2 border-gray-200">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-8 py-3 border-2 border-gray-400 text-gray-700 rounded-lg hover:bg-gray-200 transition font-bold text-lg flex items-center justify-center"
                  disabled={loading}
                >
                  <FaTimes className="mr-2" />
                  Clear Form
                </button>

                <button
                  type="submit"
                  className="px-8 py-3 bg-gradient-to-r from-[#2B2B80] to-blue-600 text-white rounded-lg hover:from-[#24246A] hover:to-blue-700 transition font-bold text-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed min-w-56"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Creating Booking...
                    </>
                  ) : (
                    <>
                      <FaCheck className="mr-2" />
                      Confirm & Create Booking
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default CreateUserBooking;
