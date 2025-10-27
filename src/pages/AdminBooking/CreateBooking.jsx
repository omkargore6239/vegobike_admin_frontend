// CreateBooking.jsx - WITH CITY → STORE → DATES → AVAILABLE BIKES FLOW ✅

import React, { useState, useEffect } from 'react';
import {
  FaUser, FaPhone, FaMotorcycle, FaCalendarAlt,
  FaMapMarkerAlt, FaArrowLeft, FaSave, FaTimes, 
  FaCheckCircle, FaExclamationTriangle, FaSearch,
  FaUserCheck, FaUserPlus, FaDatabase, FaFileAlt,
  FaClock, FaRoute, FaShoppingCart, FaStore, FaCity
} from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { bookingAPI, storeAPI, userAPI, cityAPI } from '../../utils/apiClient';
import { useNavigate } from 'react-router-dom';

const CreateBooking = () => {
  const navigate = useNavigate();
  
  // Form States
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState([]);
  const [stores, setStores] = useState([]);
  const [allStores, setAllStores] = useState([]); // Keep all stores for filtering
  const [availableBikes, setAvailableBikes] = useState([]);
  const [filteredBikes, setFilteredBikes] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingStores, setLoadingStores] = useState(false);
  const [loadingBikes, setLoadingBikes] = useState(false);
  const [fetchingUser, setFetchingUser] = useState(false);
  const [bikeSearchQuery, setBikeSearchQuery] = useState('');
  const [userExists, setUserExists] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);

  // Customer Information
  const [customerData, setCustomerData] = useState({
    phoneNumber: '',
    name: '',
    alternativeNumber: ''
  });

  // Booking Information - WITH CITY
  const [bookingData, setBookingData] = useState({
    cityId: '',
    storeId: '', // Combined pickup/drop (same store for now)
    pickupLocationId: '',
    dropLocationId: '',
    startDate: '',
    endDate: '',
    vehicleId: ''
  });

  // Validation Errors
  const [errors, setErrors] = useState({});

  // Booking Flow Steps - UPDATED
  const bookingFlowSteps = [
    { step: 1, label: 'Customer Info', icon: FaUser, description: 'Enter phone & name' },
    { step: 2, label: 'Select City', icon: FaCity, description: 'Choose city' },
    { step: 3, label: 'Select Store', icon: FaStore, description: 'Choose store' },
    { step: 4, label: 'Select Dates', icon: FaClock, description: 'Booking period' },
    { step: 5, label: 'Choose Bike', icon: FaMotorcycle, description: 'Available bikes' },
    { step: 6, label: 'Confirm', icon: FaFileAlt, description: 'Review & submit' }
  ];

  // ✅ Fetch Cities on mount
  useEffect(() => {
    fetchCities();
    fetchAllStores(); // Fetch all stores initially
  }, []);

  // ✅ Filter stores when city changes
  useEffect(() => {
    if (bookingData.cityId) {
      filterStoresByCity(bookingData.cityId);
    } else {
      setStores([]);
    }
  }, [bookingData.cityId, allStores]);

  // ✅ Fetch available bikes when store and dates are selected
  useEffect(() => {
    if (bookingData.storeId && bookingData.startDate && bookingData.endDate) {
      fetchAvailableBikes();
    } else {
      setAvailableBikes([]);
      setFilteredBikes([]);
    }
  }, [bookingData.storeId, bookingData.startDate, bookingData.endDate]);

  // ✅ Search filter on available bikes
  useEffect(() => {
    if (bikeSearchQuery.trim() === '') {
      setFilteredBikes(availableBikes);
    } else {
      const query = bikeSearchQuery.toLowerCase();
      const filtered = availableBikes.filter(bike => 
        bike.brand?.toLowerCase().includes(query) ||
        bike.model?.toLowerCase().includes(query) ||
        bike.registrationNumber?.toLowerCase().includes(query) ||
        bike.category?.toLowerCase().includes(query)
      );
      setFilteredBikes(filtered);
    }
  }, [bikeSearchQuery, availableBikes]);

  // ✅ Fetch cities from backend
  const fetchCities = async () => {
    setLoadingCities(true);
    try {
      console.log('🏙️ Fetching cities from backend...');
      const response = await cityAPI.getActive(); // Get only active cities
      
      let citiesList = [];
      if (response.data?.content) {
        citiesList = response.data.content;
      } else if (Array.isArray(response.data)) {
        citiesList = response.data;
      }
      
      console.log(`✅ Active cities loaded: ${citiesList.length}`);
      setCities(citiesList);
      
      if (citiesList.length === 0) {
        toast.warning('No active cities available');
      }
    } catch (error) {
      console.error('❌ Error fetching cities:', error);
      toast.error('Failed to load cities');
      setCities([]);
    } finally {
      setLoadingCities(false);
    }
  };

  // ✅ Fetch ALL stores (will filter by city later)
  // ✅ ENHANCED: Fetch ALL stores with city information
const fetchAllStores = async () => {
  setLoadingStores(true);
  try {
    console.log('🏪 Fetching all stores from backend...');
    const response = await storeAPI.getAll();
    
    let storesList = [];
    if (response.data?.content) {
      storesList = response.data.content;
    } else if (Array.isArray(response.data)) {
      storesList = response.data;
    } else if (response.data?.data) {
      storesList = response.data.data;
    }
    
    // Log store data to debug city relationships
    console.log('📦 Raw stores data:', storesList);
    storesList.forEach(store => {
      console.log(`Store: ${store.storeName}, cityId: ${store.cityId}, city object:`, store.city);
    });
    
    const activeStores = storesList.filter(store => store.isActive === true);
    console.log(`✅ Active stores loaded: ${activeStores.length}`);
    setAllStores(activeStores);
    
    if (activeStores.length === 0) {
      toast.warning('No active stores found');
    }
  } catch (error) {
    console.error('❌ Error fetching stores:', error);
    toast.error('Failed to load stores');
    setAllStores([]);
  } finally {
    setLoadingStores(false);
  }
};


  // ✅ Filter stores by selected city
  // ✅ FIXED: Filter stores by selected city
const filterStoresByCity = (cityId) => {
  console.log('🔍 Filtering stores for city:', cityId);
  console.log('📊 All stores:', allStores);
  
  // Filter stores that belong to selected city
  const cityStores = allStores.filter(store => {
    // Try multiple ways to match cityId
    const storeCityId = store.cityId || store.city?.id || store.city?.cityId;
    const isMatch = storeCityId === parseInt(cityId) || storeCityId === cityId;
    
    console.log(`Store: ${store.storeName}, StoreCityId: ${storeCityId}, Looking for: ${cityId}, Match: ${isMatch}`);
    
    return isMatch;
  });
  
  console.log(`✅ Found ${cityStores.length} stores in city ${cityId}`);
  console.log('🏪 Filtered stores:', cityStores);
  
  setStores(cityStores);
  
  if (cityStores.length === 0) {
    toast.info(`No stores available in this city. Please select another city or add stores for this location.`, { 
      autoClose: 4000 
    });
  } else {
    toast.success(`Found ${cityStores.length} store(s) in this city`, { 
      autoClose: 2000 
    });
  }
};


  // ✅ Fetch available bikes from backend based on store and dates
  const fetchAvailableBikes = async () => {
    setLoadingBikes(true);
    try {
      console.log('🚲 Fetching available bikes from backend...');
      console.log('Store:', bookingData.storeId);
      console.log('Dates:', bookingData.startDate, 'to', bookingData.endDate);
      
      // Call backend API - POST /api/booking-bikes/admin/available-bikes
      const response = await bookingAPI.getAvailableBikes(
        parseInt(bookingData.storeId),
        bookingData.startDate,
        bookingData.endDate
      );
      
      const bikes = response.data || [];
      console.log(`✅ Available bikes loaded: ${bikes.length}`);
      
      setAvailableBikes(bikes);
      setFilteredBikes(bikes);
      
      if (bikes.length === 0) {
        toast.info('No bikes available for selected store and dates', { autoClose: 3000 });
      }
    } catch (error) {
      console.error('❌ Error fetching available bikes:', error);
      toast.error('Failed to check bike availability');
      setAvailableBikes([]);
      setFilteredBikes([]);
    } finally {
      setLoadingBikes(false);
    }
  };

  // ✅ Auto-fetch user details when phone number is entered
  useEffect(() => {
    if (customerData.phoneNumber.length === 10) {
      fetchUserByPhone(customerData.phoneNumber);
    } else {
      setUserExists(null);
      if (customerData.phoneNumber.length < 10) {
        setCustomerData(prev => ({
          ...prev,
          name: '',
          alternativeNumber: ''
        }));
      }
    }
  }, [customerData.phoneNumber]);

  const fetchUserByPhone = async (phoneNumber) => {
    setFetchingUser(true);
    try {
      console.log(`🔍 Fetching user from backend: ${phoneNumber}`);
      const response = await userAPI.getByPhoneNumber(phoneNumber);
      
      if (response.data) {
        console.log('✅ User found:', response.data);
        setUserExists(true);
        
        setCustomerData(prev => ({
          ...prev,
          name: response.data.name || '',
          alternativeNumber: response.data.alternatePhoneNumber || ''
        }));
        
        toast.success('Existing customer found!', { autoClose: 2000 });
      }
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('ℹ️ User not found - will register');
        setUserExists(false);
        toast.info('New customer - please enter details', { autoClose: 2000 });
      } else {
        console.error('❌ Error fetching user:', error);
      }
    } finally {
      setFetchingUser(false);
    }
  };

  // ✅ Handle Customer Input Change
  const handleCustomerChange = (field, value) => {
    setCustomerData(prev => ({ ...prev, [field]: value }));
    if (errors[`customer_${field}`]) {
      setErrors(prev => ({ ...prev, [`customer_${field}`]: '' }));
    }
  };

  // ✅ Handle Booking Input Change with step progression
  const handleBookingChange = (field, value) => {
    setBookingData(prev => ({ ...prev, [field]: value }));
    if (errors[`booking_${field}`]) {
      setErrors(prev => ({ ...prev, [`booking_${field}`]: '' }));
    }
    
    // Update step based on filled fields
    if (field === 'cityId' && value) {
      setCurrentStep(2);
      // Reset dependent fields when city changes
      setBookingData(prev => ({
        ...prev,
        storeId: '',
        pickupLocationId: '',
        dropLocationId: '',
        startDate: '',
        endDate: '',
        vehicleId: ''
      }));
    }
    if (field === 'storeId' && value) {
      setCurrentStep(3);
      // Auto-set pickup and drop to same store
      setBookingData(prev => ({
        ...prev,
        pickupLocationId: value,
        dropLocationId: value
      }));
    }
    if ((field === 'startDate' || field === 'endDate') && value) {
      if (bookingData.storeId) {
        setCurrentStep(4);
      }
    }
    if (field === 'vehicleId' && value) {
      setCurrentStep(5);
    }
  };

  // ✅ Validate Form
  const validateForm = () => {
    const newErrors = {};

    // Customer Validation
    if (!customerData.phoneNumber.trim()) {
      newErrors.customer_phoneNumber = 'Phone number is required';
    } else if (!/^[6-9]\d{9}$/.test(customerData.phoneNumber)) {
      newErrors.customer_phoneNumber = 'Invalid phone number';
    }
    
    if (!customerData.name.trim()) {
      newErrors.customer_name = 'Customer name is required';
    }

    // City Validation
    if (!bookingData.cityId) {
      newErrors.booking_cityId = 'City is required';
    }

    // Store Validation
    if (!bookingData.storeId) {
      newErrors.booking_storeId = 'Store is required';
    }

    // Date Validation
    if (!bookingData.startDate) {
      newErrors.booking_startDate = 'Start date is required';
    }
    if (!bookingData.endDate) {
      newErrors.booking_endDate = 'End date is required';
    }
    if (bookingData.startDate && bookingData.endDate) {
      if (new Date(bookingData.endDate) <= new Date(bookingData.startDate)) {
        newErrors.booking_endDate = 'End date must be after start date';
      }
    }

    // Bike Validation
    if (!bookingData.vehicleId) {
      newErrors.booking_vehicleId = 'Please select a vehicle';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ Handle Submit - Send to backend
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fill all required fields');
      return;
    }

    setCurrentStep(6);
    setLoading(true);
    
    try {
      console.log('📤 Preparing booking data for backend...');
      
      // Prepare request matching backend AdminRegisterAndBookRequest
      const requestData = {
        customer: {
          name: customerData.name.trim(),
          phoneNumber: customerData.phoneNumber.trim(),
          alternatePhoneNumber: customerData.alternativeNumber.trim() || null,
          address: null,
          email: null
        },
        booking: {
          vehicleId: parseInt(bookingData.vehicleId),
          cityId: parseInt(bookingData.cityId),
          storeId: parseInt(bookingData.storeId),
          startDate: bookingData.startDate,
          endDate: bookingData.endDate,
          pickupLocationId: parseInt(bookingData.pickupLocationId),
          dropLocationId: parseInt(bookingData.dropLocationId),
          addressType: 'Self Pickup',
          address: null,
          deliveryType: 'Self Pickup',
          paymentType: 1 // COD
        }
      };

      console.log('📤 Sending to backend:', requestData);

      const response = await bookingAPI.adminRegisterAndBook(requestData);
      
      console.log('✅ Booking created:', response.data);

      const bookingId = response.data?.bookingId || response.data?.booking?.bookingId;
      
      toast.success(
        <div>
          <div className="font-bold">🎉 Booking Created Successfully!</div>
          {bookingId && <div className="text-sm mt-1">Booking ID: {bookingId}</div>}
          {userExists === false && (
            <div className="text-sm mt-1">✅ New customer registered</div>
          )}
        </div>,
        { position: 'top-center', autoClose: 4000 }
      );

      setTimeout(() => navigate('/dashboard/bookings'), 2000);

    } catch (error) {
      console.error('❌ Error creating booking:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message ||
                          'Failed to create booking';
      
      toast.error(`❌ ${errorMessage}`, { autoClose: 5000 });
      setCurrentStep(5);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure? All data will be lost.')) {
      navigate('/dashboard/bookings');
    }
  };

  // Get selected items for summary
  const selectedCity = cities.find(city => city.id === parseInt(bookingData.cityId));
  const selectedStore = stores.find(store => store.id === parseInt(bookingData.storeId));
  const selectedBike = availableBikes.find(bike => bike.id === parseInt(bookingData.vehicleId));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-4 px-4">
      <ToastContainer />
      
      <div className="max-w-7xl mx-auto">
        {/* Header with Flow Progress */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <button onClick={() => navigate('/dashboard/bookings')} className="text-gray-600 hover:text-gray-800">
                <FaArrowLeft className="text-xl" />
              </button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                  Create New Booking
                </h1>
                <p className="text-gray-500 text-sm">Smart booking: City → Store → Dates → Available Bikes</p>
              </div>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="mt-4 overflow-x-auto">
            <div className="flex items-center justify-between min-w-max">
              {bookingFlowSteps.map((flowStep, index) => {
                const Icon = flowStep.icon;
                const isActive = currentStep >= flowStep.step;
                const isCompleted = currentStep > flowStep.step;
                
                return (
                  <React.Fragment key={flowStep.step}>
                    <div className="flex flex-col items-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                        isCompleted 
                          ? 'bg-green-500 text-white' 
                          : isActive 
                            ? 'bg-indigo-600 text-white animate-pulse' 
                            : 'bg-gray-200 text-gray-400'
                      }`}>
                        {isCompleted ? <FaCheckCircle className="text-xl" /> : <Icon className="text-xl" />}
                      </div>
                      <p className={`text-xs mt-2 text-center font-semibold whitespace-nowrap ${isActive ? 'text-indigo-600' : 'text-gray-400'}`}>
                        {flowStep.label}
                      </p>
                      <p className="text-xs text-gray-400 text-center whitespace-nowrap">{flowStep.description}</p>
                    </div>
                    
                    {index < bookingFlowSteps.length - 1 && (
                      <div className={`h-1 w-16 mx-2 transition-all ${
                        currentStep > flowStep.step ? 'bg-green-500' : currentStep === flowStep.step ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}></div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-4">
              {/* Step 1: Customer Information */}
              <div className={`bg-white rounded-xl shadow-lg p-4 transition-all ${currentStep === 1 ? 'ring-2 ring-indigo-500' : ''}`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
                      currentStep > 1 ? 'bg-green-500 text-white' : 'bg-indigo-600 text-white'
                    }`}>
                      {currentStep > 1 ? <FaCheckCircle /> : '1'}
                    </div>
                    Customer Information
                  </h2>
                  
                  {userExists !== null && (
                    <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold ${
                      userExists ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {userExists ? <><FaUserCheck /><span>Existing</span></> : <><FaUserPlus /><span>New</span></>}
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="tel"
                        value={customerData.phoneNumber}
                        onChange={(e) => handleCustomerChange('phoneNumber', e.target.value.replace(/\D/g, '').slice(0, 10))}
                        className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          errors.customer_phoneNumber ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="10-digit mobile"
                        maxLength="10"
                      />
                      {fetchingUser && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                        </div>
                      )}
                      {userExists !== null && !fetchingUser && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          {userExists ? <FaUserCheck className="text-green-500" /> : <FaUserPlus className="text-blue-500" />}
                        </div>
                      )}
                    </div>
                    {errors.customer_phoneNumber && (
                      <p className="text-red-500 text-xs mt-1">{errors.customer_phoneNumber}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Customer Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={customerData.name}
                      onChange={(e) => handleCustomerChange('name', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        errors.customer_name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter name"
                      disabled={fetchingUser || userExists === true}
                    />
                    {errors.customer_name && <p className="text-red-500 text-xs mt-1">{errors.customer_name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Alternative Number (Optional)
                    </label>
                    <div className="relative">
                      <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="tel"
                        value={customerData.alternativeNumber}
                        onChange={(e) => handleCustomerChange('alternativeNumber', e.target.value.replace(/\D/g, '').slice(0, 10))}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Alternative contact"
                        maxLength="10"
                        disabled={fetchingUser || userExists === true}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: City Selection */}
              <div className={`bg-white rounded-xl shadow-lg p-4 transition-all ${currentStep === 2 ? 'ring-2 ring-indigo-500' : ''}`}>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
                    currentStep > 2 ? 'bg-green-500 text-white' : currentStep === 2 ? 'bg-indigo-600 text-white' : 'bg-gray-300 text-gray-600'
                  }`}>
                    {currentStep > 2 ? <FaCheckCircle /> : '2'}
                  </div>
                  Select City
                </h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={bookingData.cityId}
                    onChange={(e) => handleBookingChange('cityId', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.booking_cityId ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={loadingCities}
                  >
                    <option value="">{loadingCities ? 'Loading cities...' : cities.length === 0 ? 'No cities available' : 'Select a city'}</option>
                    {cities.map(city => (
                      <option key={city.id} value={city.id}>
                        {city.cityName || city.name}
                      </option>
                    ))}
                  </select>
                  {errors.booking_cityId && (
                    <p className="text-red-500 text-xs mt-1">{errors.booking_cityId}</p>
                  )}
                </div>
              </div>

              {/* Step 3: Store Selection */}
              <div className={`bg-white rounded-xl shadow-lg p-4 transition-all ${currentStep === 3 ? 'ring-2 ring-indigo-500' : ''}`}>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
                    currentStep > 3 ? 'bg-green-500 text-white' : currentStep === 3 ? 'bg-indigo-600 text-white' : 'bg-gray-300 text-gray-600'
                  }`}>
                    {currentStep > 3 ? <FaCheckCircle /> : '3'}
                  </div>
                  Select Store
                </h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Store (Pickup & Drop) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={bookingData.storeId}
                    onChange={(e) => handleBookingChange('storeId', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.booking_storeId ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={!bookingData.cityId || loadingStores}
                  >
                    <option value="">
                      {!bookingData.cityId 
                        ? 'Select city first' 
                        : loadingStores 
                          ? 'Loading stores...' 
                          : stores.length === 0 
                            ? 'No stores in this city' 
                            : 'Select a store'}
                    </option>
                    {stores.map(store => (
                      <option key={store.id} value={store.id}>
                        {store.storeName} - {store.storeAddress}
                      </option>
                    ))}
                  </select>
                  {errors.booking_storeId && (
                    <p className="text-red-500 text-xs mt-1">{errors.booking_storeId}</p>
                  )}
                  {!bookingData.cityId && (
                    <p className="text-sm text-amber-600 mt-1">ⓘ Please select city first</p>
                  )}
                </div>
              </div>

              {/* Step 4: Date Selection */}
              <div className={`bg-white rounded-xl shadow-lg p-4 transition-all ${currentStep === 4 ? 'ring-2 ring-indigo-500' : ''}`}>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
                    currentStep > 4 ? 'bg-green-500 text-white' : currentStep === 4 ? 'bg-indigo-600 text-white' : 'bg-gray-300 text-gray-600'
                  }`}>
                    {currentStep > 4 ? <FaCheckCircle /> : '4'}
                  </div>
                  Select Booking Period
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date & Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={bookingData.startDate}
                      onChange={(e) => handleBookingChange('startDate', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        errors.booking_startDate ? 'border-red-500' : 'border-gray-300'
                      }`}
                      min={new Date().toISOString().slice(0, 16)}
                      disabled={!bookingData.storeId}
                    />
                    {errors.booking_startDate && (
                      <p className="text-red-500 text-xs mt-1">{errors.booking_startDate}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date & Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={bookingData.endDate}
                      onChange={(e) => handleBookingChange('endDate', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        errors.booking_endDate ? 'border-red-500' : 'border-gray-300'
                      }`}
                      min={bookingData.startDate || new Date().toISOString().slice(0, 16)}
                      disabled={!bookingData.storeId}
                    />
                    {errors.booking_endDate && (
                      <p className="text-red-500 text-xs mt-1">{errors.booking_endDate}</p>
                    )}
                  </div>
                </div>
                
                {!bookingData.storeId && (
                  <p className="text-sm text-amber-600 mt-2">ⓘ Please select store first to enable date selection</p>
                )}
              </div>

              {/* Step 5: Bike Selection */}
              <div className={`bg-white rounded-xl shadow-lg p-4 transition-all ${currentStep === 5 ? 'ring-2 ring-indigo-500' : ''}`}>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
                    currentStep > 5 ? 'bg-green-500 text-white' : currentStep === 5 ? 'bg-indigo-600 text-white' : 'bg-gray-300 text-gray-600'
                  }`}>
                    {currentStep > 5 ? <FaCheckCircle /> : '5'}
                  </div>
                  Choose Available Bike
                </h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Vehicle <span className="text-red-500">*</span>
                  </label>
                  
                  {bookingData.storeId && bookingData.startDate && bookingData.endDate ? (
                    <>
                      <div className="relative mb-2">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={bikeSearchQuery}
                          onChange={(e) => setBikeSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Search available bikes..."
                          disabled={loadingBikes || filteredBikes.length === 0}
                        />
                      </div>

                      <select
                        value={bookingData.vehicleId}
                        onChange={(e) => handleBookingChange('vehicleId', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          errors.booking_vehicleId ? 'border-red-500' : 'border-gray-300'
                        }`}
                        disabled={loadingBikes || filteredBikes.length === 0}
                      >
                        <option value="">
                          {loadingBikes 
                            ? 'Checking availability...' 
                            : filteredBikes.length === 0 
                              ? 'No bikes available for selected dates' 
                              : 'Select a bike'}
                        </option>
                        {filteredBikes.map(bike => (
                          <option key={bike.id} value={bike.id}>
                            {bike.brand} {bike.model} - {bike.registrationNumber} ({bike.category || 'N/A'})
                          </option>
                        ))}
                      </select>
                      {errors.booking_vehicleId && (
                        <p className="text-red-500 text-xs mt-1">{errors.booking_vehicleId}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {loadingBikes 
                          ? 'Checking availability...' 
                          : `${filteredBikes.length} bikes available`}
                      </p>
                    </>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                      <FaClock className="mx-auto text-amber-500 text-2xl mb-2" />
                      <p className="text-sm text-amber-700 font-medium">
                        Please select store and dates first to see available bikes
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg p-4 sticky top-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
                    currentStep === 6 ? 'bg-indigo-600 text-white' : 'bg-gray-300 text-gray-600'
                  }`}>
                    6
                  </div>
                  Booking Summary
                </h2>

                {/* Customer Info */}
                <div className={`mb-4 p-3 rounded-lg border ${
                  userExists === true ? 'bg-green-50 border-green-200' : userExists === false ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-gray-900">Customer</h3>
                    {userExists !== null && (
                      <span className={`text-xs font-semibold ${userExists ? 'text-green-600' : 'text-blue-600'}`}>
                        {userExists ? 'Existing' : 'New'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-700 font-semibold">{customerData.name || 'Not entered'}</p>
                  <p className="text-xs text-gray-600">{customerData.phoneNumber || 'Not entered'}</p>
                </div>

                {/* Location Info */}
                {(selectedCity || selectedStore) && (
                  <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <h3 className="text-sm font-semibold text-purple-900 mb-2">Location</h3>
                    {selectedCity && (
                      <p className="text-xs text-gray-700">
                        <span className="font-semibold">City:</span> {selectedCity.cityName || selectedCity.name}
                      </p>
                    )}
                    {selectedStore && (
                      <p className="text-xs text-gray-700">
                        <span className="font-semibold">Store:</span> {selectedStore.storeName}
                      </p>
                    )}
                  </div>
                )}

                {/* Selected Bike Info */}
                {selectedBike && (
                  <div className="mb-4 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                    <h3 className="text-sm font-semibold text-indigo-900 mb-2">Selected Vehicle</h3>
                    <p className="text-xs text-gray-700 font-semibold">{selectedBike.brand} {selectedBike.model}</p>
                    <p className="text-xs text-gray-600">{selectedBike.registrationNumber}</p>
                    <p className="text-xs text-indigo-600 font-semibold mt-1">{selectedBike.category || 'N/A'}</p>
                  </div>
                )}

                {/* Payment Method */}
                <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <h3 className="text-sm font-semibold text-green-900 mb-2">Payment Method</h3>
                  <p className="text-sm text-green-700 font-semibold">💵 Cash on Delivery (COD)</p>
                  <p className="text-xs text-gray-600 mt-1">Payment at pickup</p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <button
                    type="submit"
                    disabled={loading || fetchingUser}
                    className={`w-full flex items-center justify-center px-4 py-3 rounded-lg font-semibold transition-all ${
                      loading || fetchingUser ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg'
                    } text-white`}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <FaSave className="mr-2" />
                        Create Booking
                      </>
                    )}
                  </button>

                  <button type="button" onClick={handleCancel} disabled={loading} className="w-full flex items-center justify-center px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-all">
                    <FaTimes className="mr-2" />
                    Cancel
                  </button>
                </div>

                {/* Info Box */}
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start">
                    <FaDatabase className="text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-blue-800 font-semibold mb-1">Smart Flow</p>
                      <ul className="text-xs text-blue-700 space-y-1">
                        <li>✓ City → Filters stores</li>
                        <li>✓ Store + Dates → Checks availability</li>
                        <li>✓ Only available bikes shown</li>
                        <li>✓ Auto-registers new customers</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBooking;
