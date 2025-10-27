// StoreManagement.jsx - UPDATED WITH CITY INTEGRATION ✅

import React, { useEffect, useState } from 'react';
import {
  FaEdit,
  FaImage,
  FaSearch,
  FaPlus,
  FaToggleOn,
  FaToggleOff,
  FaExclamationTriangle,
  FaRedo,
  FaCheck,
  FaTimes,
  FaCity
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { apiClient, BASE_URL, storeAPI, cityAPI } from '../api/apiConfig';

const StoreManagement = () => {
  // State management
  const [stores, setStores] = useState([]);
  const [filteredStores, setFilteredStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  // Pagination
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
  const [imagePreview, setImagePreview] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  // ✅ City data states
  const [cities, setCities] = useState([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [citiesError, setCitiesError] = useState('');

  // ✅ Form data - UPDATED with cityId
  const [formData, setFormData] = useState({
    storeName: '',
    storeContactNumber: '',
    storeAddress: '',
    storeUrl: '',
    storeGstinNumber: '',
    cityId: '', // Changed from 'city' to 'cityId'
    storeImage: null,
    storeLatitude: '',
    storeLongitude: ''
  });

  // Helper function to get full image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    
    let cleanPath = imagePath.trim();
    cleanPath = cleanPath.replace(/\\/g, '/');
    cleanPath = cleanPath.replace(/uploads\/stores\//g, '');
    cleanPath = cleanPath.replace(/uploads\//g, '');
    cleanPath = cleanPath.replace(/stores\//g, '');
    
    const filename = cleanPath.split('/').pop();
    const finalUrl = `${BASE_URL}/uploads/stores/${filename}`;
    
    return finalUrl;
  };

  // ✅ ENHANCED FORM VALIDATION - Updated with cityId
  const validateForm = () => {
    const errors = {};
    const fieldErrors = [];

    // Store name validation
    if (!formData.storeName.trim()) {
      errors.storeName = 'Store name is required';
      fieldErrors.push('Please enter a store name');
    } else if (formData.storeName.trim().length < 2) {
      errors.storeName = 'Store name must be at least 2 characters';
      fieldErrors.push('Store name must be at least 2 characters');
    } else if (formData.storeName.trim().length > 100) {
      errors.storeName = 'Store name must be less than 100 characters';
      fieldErrors.push('Store name is too long');
    }

    // Contact number validation
    if (!formData.storeContactNumber.trim()) {
      errors.storeContactNumber = 'Contact number is required';
      fieldErrors.push('Please enter a contact number');
    } else if (!/^[0-9]{10,15}$/.test(formData.storeContactNumber.trim())) {
      errors.storeContactNumber = 'Please enter a valid contact number (10-15 digits)';
      fieldErrors.push('Contact number format is invalid');
    }

    // Store address validation
    if (!formData.storeAddress.trim()) {
      errors.storeAddress = 'Address is required';
      fieldErrors.push('Please enter an address');
    } else if (formData.storeAddress.trim().length < 10) {
      errors.storeAddress = 'Address must be at least 10 characters';
      fieldErrors.push('Please provide a complete address');
    } else if (formData.storeAddress.trim().length > 255) {
      errors.storeAddress = 'Address must be less than 255 characters';
      fieldErrors.push('Address is too long');
    }

    // ✅ City validation
    if (!formData.cityId) {
      errors.cityId = 'City is required';
      fieldErrors.push('Please select a city');
    }

    // Store URL validation (optional)
    if (formData.storeUrl.trim() && !/^https?:\/\/.+/.test(formData.storeUrl.trim())) {
      errors.storeUrl = 'Please enter a valid URL';
      fieldErrors.push('Store URL format is invalid');
    }

    setValidationErrors(errors);
    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      fieldErrors
    };
  };

  // Clear messages after 5 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  // Handle search
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = stores.filter(
        (store) =>
          store.storeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          store.storeAddress?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          store.city?.cityName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredStores(filtered);
    } else {
      setFilteredStores(stores);
    }
  }, [searchQuery, stores]);

  // ✅ Fetch cities on component mount
  useEffect(() => {
    fetchCities();
  }, []);

  // ✅ Fetch cities from backend
  const fetchCities = async () => {
    setCitiesLoading(true);
    setCitiesError('');
    try {
      console.log('🏙️ Fetching cities...');
      const response = await cityAPI.getActive(); // Get only active cities
      
      let citiesList = [];
      if (response.data?.content) {
        citiesList = response.data.content;
      } else if (Array.isArray(response.data)) {
        citiesList = response.data;
      } else if (response.data?.data) {
        citiesList = response.data.data;
      }
      
      console.log(`✅ Cities loaded: ${citiesList.length}`);
      setCities(citiesList);
      
      if (citiesList.length === 0) {
        setCitiesError('No active cities available');
        toast.warning('No active cities available. Please add cities first.');
      }
    } catch (error) {
      console.error('❌ Error fetching cities:', error);
      const errorMsg = 'Failed to load cities. Please try again later.';
      setCitiesError(errorMsg);
      toast.error(errorMsg);
      setCities([]);
    } finally {
      setCitiesLoading(false);
    }
  };

  // Fetch stores
  const fetchStores = async (page = 0, size = 10, retryAttempt = 0) => {
    setLoading(true);
    setError('');
    try {
      const response = await storeAPI.getAll({ page, size, sort: 'createdAt,desc' });
      
      if (response.data && response.data.success) {
        const storesData = response.data.data;
        
        // Process each store
        const processedStores = storesData.map((store) => ({
          ...store,
          storeImage: store.storeImage ? getImageUrl(store.storeImage) : null
        }));
        
        setStores(processedStores);
        setFilteredStores(processedStores);
        setRetryCount(0);
        
        if (response.data.pagination) {
          setCurrentPage(response.data.pagination.currentPage);
          setTotalPages(response.data.pagination.totalPages);
          setTotalElements(response.data.pagination.totalElements);
          setHasNext(response.data.pagination.hasNext);
          setHasPrevious(response.data.pagination.hasPrevious);
        }
        
        if (processedStores.length > 0) {
          setSuccess(`Successfully loaded ${processedStores.length} stores`);
          setTimeout(() => setSuccess(''), 3000);
        }
      } else {
        setError('Failed to fetch stores data');
        setStores([]);
        setFilteredStores([]);
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
      setError('Failed to fetch stores. Please check your connection and try again.');
      setStores([]);
      setFilteredStores([]);
      
      // Retry logic
      if (retryAttempt < 2) {
        console.log(`Retrying stores fetch (attempt ${retryAttempt + 1}/3)...`);
        setRetryCount(retryAttempt + 1);
        setTimeout(() => fetchStores(page, size, retryAttempt + 1), 3000 * (retryAttempt + 1));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores(currentPage, itemsPerPage);
    window.scrollTo(0, 0);
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear validation errors for this field
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    
    if (error) setError('');
  };

  // Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setFormData({ ...formData, storeImage: null });
      setImagePreview('');
      return;
    }

    // File validation
    if (!file.type.startsWith('image/')) {
      const errorMsg = 'Please select a valid image file (JPG, PNG, GIF)';
      setError(errorMsg);
      toast.error(errorMsg);
      e.target.value = '';
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      const errorMsg = 'Image size should be less than 5MB';
      setError(errorMsg);
      toast.error(errorMsg);
      e.target.value = '';
      return;
    }

    setFormData({ ...formData, storeImage: file });

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.onerror = () => {
      const errorMsg = 'Failed to read the selected file';
      setError(errorMsg);
      toast.error(errorMsg);
    };
    reader.readAsDataURL(file);
    setError('');

    if (validationErrors.storeImage) {
      setValidationErrors((prev) => ({ ...prev, storeImage: undefined }));
    }
  };

  // ✅ UPDATED: Handle Add Store with cityId
  const handleAddStore = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    setValidationErrors({});

    // Validation
    const validation = validateForm();
    if (!validation.isValid) {
      setError(validation.fieldErrors[0]);
      setSubmitting(false);
      return;
    }

    try {
      console.log('Adding store...');
      
      // ✅ Prepare store data with cityId (as integer)
      const storeData = {
        storeName: formData.storeName.trim(),
        storeContactNumber: formData.storeContactNumber.trim(),
        storeAddress: formData.storeAddress.trim(),
        storeUrl: formData.storeUrl.trim() || null,
        storeGstinNumber: formData.storeGstinNumber.trim() || null,
        cityId: parseInt(formData.cityId), // ✅ Send as integer
        storeLatitude: formData.storeLatitude ? parseFloat(formData.storeLatitude) : null,
        storeLongitude: formData.storeLongitude ? parseFloat(formData.storeLongitude) : null
      };

      const response = await storeAPI.create(storeData, formData.storeImage);

      if (response.data && response.data.success) {
        setSuccess('Store added successfully!');
        toast.success('Store added successfully!');
        resetForm();
        await fetchStores(currentPage, itemsPerPage);
      } else {
        const errorMsg = response.data?.message || 'Failed to add store';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('Error adding store:', error);
      const errorMsg = error.response?.data?.message || 'Failed to add store. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ UPDATED: Handle Edit Store with cityId
  const handleEditStore = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
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
      setError('Invalid store ID');
      setSubmitting(false);
      return;
    }

    try {
      console.log('Updating store:', editingId);
      
      // ✅ Prepare store data with cityId (as integer)
      const storeData = {
        storeName: formData.storeName.trim(),
        storeContactNumber: formData.storeContactNumber.trim(),
        storeAddress: formData.storeAddress.trim(),
        storeUrl: formData.storeUrl.trim() || null,
        storeGstinNumber: formData.storeGstinNumber.trim() || null,
        cityId: parseInt(formData.cityId), // ✅ Send as integer
        storeLatitude: formData.storeLatitude ? parseFloat(formData.storeLatitude) : null,
        storeLongitude: formData.storeLongitude ? parseFloat(formData.storeLongitude) : null
      };

      const response = await storeAPI.update(editingId, storeData, formData.storeImage);

      if (response.data && response.data.success) {
        setSuccess('Store updated successfully!');
        toast.success('Store updated successfully!');
        resetForm();
        await fetchStores(currentPage, itemsPerPage);
      } else {
        const errorMsg = response.data?.message || 'Failed to update store';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('Error updating store:', error);
      const errorMsg = error.response?.data?.message || 'Failed to update store. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle toggle status
  const handleToggleStatus = async (id) => {
    if (!id || id.toString().startsWith('fallback-')) {
      setError('Invalid store ID');
      return;
    }

    setError('');
    setSuccess('');

    try {
      console.log('Toggling store status:', id);
      const response = await storeAPI.toggleStatus(id);

      if (response.data && response.data.success) {
        setSuccess(response.data.message || 'Status updated successfully!');
        toast.success('Store status updated successfully!');
        await fetchStores(currentPage, itemsPerPage);
      } else {
        const errorMsg = response.data?.message || 'Failed to update status';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      const errorMsg = error.response?.data?.message || 'Failed to update store status. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  // Reset Form
  const resetForm = () => {
    setEditingId(null);
    setFormData({
      storeName: '',
      storeContactNumber: '',
      storeAddress: '',
      storeUrl: '',
      storeGstinNumber: '',
      cityId: '',
      storeImage: null,
      storeLatitude: '',
      storeLongitude: ''
    });
    setImagePreview('');
    setFormVisible(false);
    setError('');
    setSuccess('');
    setSubmitting(false);
    setValidationErrors({});
  };

  // ✅ UPDATED: Edit form prefill with cityId
  const handleEditStoreClick = (store) => {
    if (!store || !store.id || store.id.toString().startsWith('fallback-')) {
      setError('Invalid store data or missing ID');
      return;
    }

    setEditingId(store.id);
    setFormData({
      storeName: store.storeName || '',
      storeContactNumber: store.storeContactNumber || '',
      storeAddress: store.storeAddress || '',
      storeUrl: store.storeUrl || '',
      storeGstinNumber: store.storeGstinNumber || '',
      cityId: store.city?.id || store.cityId || '', // ✅ Get cityId from store
      storeImage: null,
      storeLatitude: store.storeLatitude || '',
      storeLongitude: store.storeLongitude || ''
    });

    if (store.storeImage) {
      setImagePreview(store.storeImage);
    } else {
      setImagePreview('');
    }

    setFormVisible(true);
    setError('');
    setSuccess('');
    setValidationErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Manual retry
  const handleRetry = () => {
    setError('');
    setRetryCount(0);
    fetchStores(currentPage, itemsPerPage);
  };

  // Pagination handlers
  const handleNextPage = () => {
    if (hasNext) {
      const nextPage = currentPage + 1;
      fetchStores(nextPage, itemsPerPage);
    }
  };

  const handlePrevPage = () => {
    if (hasPrevious) {
      const prevPage = currentPage - 1;
      fetchStores(prevPage, itemsPerPage);
    }
  };

  const handlePageClick = (pageNumber) => {
    fetchStores(pageNumber, itemsPerPage);
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

  // Get current page data
  const getCurrentPageData = () => {
    return searchQuery.trim() !== '' ? filteredStores : filteredStores;
  };

  // Image error handlers
  const handleImageError = (e, storeName) => {
    console.error('Image failed to load for store:', storeName, e.target.src);
    e.target.style.display = 'none';
    const fallbackDiv = e.target.nextElementSibling;
    if (fallbackDiv) {
      fallbackDiv.style.display = 'flex';
    }
  };

  const handleImageLoad = (e, storeName) => {
    console.log('Image loaded successfully for store:', storeName, e.target.src);
    e.target.style.display = 'block';
    const fallbackDiv = e.target.nextElementSibling;
    if (fallbackDiv) {
      fallbackDiv.style.display = 'none';
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Store Management</h1>
          <p className="text-gray-600 mt-1">
            Manage your store locations ({totalElements} stores)
          </p>
        </div>
        {!formVisible && (
          <button
            onClick={() => setFormVisible(true)}
            className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition duration-200 shadow-lg hover:shadow-xl"
          >
            <FaPlus className="mr-2" />
            Add New Store
          </button>
        )}
      </div>

      {/* Success/Error Messages */}
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
              {error.includes('connect to server') && (
                <div className="mt-3">
                  <p className="text-xs text-red-600">
                    <strong>Troubleshooting tips:</strong>
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

      {/* Add/Edit Store Form */}
      {formVisible ? (
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {editingId ? 'Edit Store' : 'Add New Store'}
            </h2>
            <p className="text-gray-600 mt-1">
              {editingId
                ? 'Update store information below'
                : 'Fill in the details to create a new store'}
            </p>
          </div>

          <form
            onSubmit={editingId ? handleEditStore : handleAddStore}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Store Name */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Store Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="storeName"
                  placeholder="Enter store name"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 ${
                    validationErrors.storeName
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300'
                  }`}
                  value={formData.storeName}
                  onChange={handleInputChange}
                  required
                  maxLength={100}
                  disabled={submitting}
                />
                {validationErrors.storeName && (
                  <p className="text-xs text-red-600 mt-1">
                    {validationErrors.storeName}
                  </p>
                )}
              </div>

              {/* Contact Number */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Contact Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="storeContactNumber"
                  placeholder="Enter contact number"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 ${
                    validationErrors.storeContactNumber
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300'
                  }`}
                  value={formData.storeContactNumber}
                  onChange={handleInputChange}
                  required
                  maxLength={15}
                  disabled={submitting}
                />
                {validationErrors.storeContactNumber && (
                  <p className="text-xs text-red-600 mt-1">
                    {validationErrors.storeContactNumber}
                  </p>
                )}
              </div>

              {/* ✅ City Dropdown - UPDATED */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  City <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="cityId"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 appearance-none ${
                      validationErrors.cityId
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-300'
                    }`}
                    value={formData.cityId}
                    onChange={handleInputChange}
                    required
                    disabled={submitting || citiesLoading}
                  >
                    <option value="">
                      {citiesLoading
                        ? 'Loading cities...'
                        : citiesError
                        ? 'Error loading cities'
                        : cities.length === 0
                        ? 'No cities available'
                        : 'Select a city'}
                    </option>
                    {cities.map((city) => (
                      <option key={city.id} value={city.id}>
                        {city.cityName || city.name}
                      </option>
                    ))}
                  </select>
                  <FaCity className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
                {validationErrors.cityId && (
                  <p className="text-xs text-red-600 mt-1">
                    {validationErrors.cityId}
                  </p>
                )}
                {citiesError && (
                  <p className="text-xs text-amber-600 mt-1">
                    {citiesError}{' '}
                    <button
                      type="button"
                      onClick={fetchCities}
                      className="underline hover:text-amber-800"
                    >
                      Retry
                    </button>
                  </p>
                )}
              </div>

              {/* Address */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="storeAddress"
                  placeholder="Enter store address"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 ${
                    validationErrors.storeAddress
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300'
                  }`}
                  value={formData.storeAddress}
                  onChange={handleInputChange}
                  required
                  maxLength={255}
                  disabled={submitting}
                  rows={3}
                />
                {validationErrors.storeAddress && (
                  <p className="text-xs text-red-600 mt-1">
                    {validationErrors.storeAddress}
                  </p>
                )}
              </div>

              {/* Store URL */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Store URL
                </label>
                <input
                  type="url"
                  name="storeUrl"
                  placeholder="Enter store URL (optional)"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 ${
                    validationErrors.storeUrl
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300'
                  }`}
                  value={formData.storeUrl}
                  onChange={handleInputChange}
                  maxLength={500}
                  disabled={submitting}
                />
                {validationErrors.storeUrl && (
                  <p className="text-xs text-red-600 mt-1">
                    {validationErrors.storeUrl}
                  </p>
                )}
              </div>

              {/* GSTIN Number */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  GSTIN Number
                </label>
                <input
                  type="text"
                  name="storeGstinNumber"
                  placeholder="Enter GSTIN number (optional)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                  value={formData.storeGstinNumber}
                  onChange={handleInputChange}
                  disabled={submitting}
                />
              </div>

              {/* Latitude */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  name="storeLatitude"
                  placeholder="Enter latitude (optional)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                  value={formData.storeLatitude}
                  onChange={handleInputChange}
                  min="-90"
                  max="90"
                  disabled={submitting}
                />
              </div>

              {/* Longitude */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  name="storeLongitude"
                  placeholder="Enter longitude (optional)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                  value={formData.storeLongitude}
                  onChange={handleInputChange}
                  min="-180"
                  max="180"
                  disabled={submitting}
                />
              </div>

              {/* Store Image */}
              <div className="space-y-2 lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Store Image
                </label>
                <div className="space-y-4">
                  <input
                    type="file"
                    name="storeImage"
                    accept="image/jpeg,image/jpg,image/png,image/gif"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    onChange={handleImageChange}
                    disabled={submitting}
                  />
                  <p className="text-xs text-gray-500">
                    Supported formats: JPG, PNG, GIF. Maximum size: 5MB
                  </p>
                </div>
              </div>
            </div>

            {/* Image Preview */}
            {imagePreview && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Image Preview
                </label>
                <div className="relative w-64 h-40 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                  <img
                    src={imagePreview}
                    alt="Store preview"
                    className="w-full h-full object-cover"
                    onError={(e) => handleImageError(e, 'Preview')}
                    onLoad={(e) => handleImageLoad(e, 'Preview')}
                  />
                  <div
                    className="absolute inset-0 flex items-center justify-center bg-gray-100"
                    style={{ display: 'none' }}
                  >
                    <div className="text-center">
                      <FaImage className="h-8 w-8 text-gray-400 mx-auto mb-1" />
                      <p className="text-xs text-gray-500">Preview not available</p>
                    </div>
                  </div>
                </div>
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
                <FaTimes className="mr-2 inline" />
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={submitting || Object.keys(validationErrors).length > 0}
              >
                {submitting ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  <>
                    <FaCheck className="mr-2 inline" />
                    {editingId ? 'Update Store' : 'Create Store'}
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
                All Stores ({totalElements} total)
              </h3>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search stores..."
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
                    #
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Store Image
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Store Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    City
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact Info
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
                        <p className="text-gray-500">Loading stores...</p>
                        {retryCount > 0 && (
                          <p className="text-sm text-gray-400 mt-2">
                            Retry attempt {retryCount}/3
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : getCurrentPageData().length === 0 ? (
                  <tr key="empty-row">
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <FaImage className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          No stores found
                        </h3>
                        <p className="text-gray-500 mb-4">
                          {searchQuery
                            ? `No stores match "${searchQuery}"`
                            : 'Get started by creating your first store'}
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
                  getCurrentPageData().map((store, index) => (
                    <tr
                      key={`store-row-${store.id}-${index}`}
                      className="hover:bg-gray-50 transition duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {searchQuery
                          ? index + 1
                          : currentPage * itemsPerPage + index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex-shrink-0 h-16 w-20 relative">
                          {store.storeImage ? (
                            <>
                              <img
                                src={store.storeImage}
                                alt={store.storeName}
                                className="h-16 w-20 rounded-lg object-cover border border-gray-200 shadow-sm bg-white"
                                onError={(e) => handleImageError(e, store.storeName)}
                                onLoad={(e) => handleImageLoad(e, store.storeName)}
                                style={{ display: 'block' }}
                              />
                              <div
                                className="h-16 w-20 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center absolute top-0 left-0"
                                style={{ display: 'none' }}
                              >
                                <div className="text-center">
                                  <FaImage className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                                  <p className="text-xs text-gray-500">No Image</p>
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="h-16 w-20 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                              <div className="text-center">
                                <FaImage className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                                <p className="text-xs text-gray-500">No Image</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {store.storeName}
                        </div>
                        <div className="text-sm text-gray-500 max-w-xs truncate">
                          {store.storeAddress}
                        </div>
                        {store.storeUrl && (
                          <a
                            href={store.storeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-indigo-600 hover:text-indigo-800"
                          >
                            View Store
                          </a>
                        )}
                      </td>
                      {/* ✅ City Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center">
                          <FaCity className="mr-2 text-indigo-500" />
                          {store.city?.cityName || store.city?.name || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {store.storeContactNumber}
                        </div>
                        <div className="text-sm text-gray-500">ID: {store.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(store.id)}
                          className={`inline-flex items-center px-3 py-2 rounded-full text-xs font-medium transition duration-200 ${
                            store.isActive === 1
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                          title={`Click to ${
                            store.isActive === 1 ? 'deactivate' : 'activate'
                          } store`}
                          disabled={store.id.toString().startsWith('fallback-')}
                        >
                          {store.isActive === 1 ? (
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
                            className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition duration-200 ${
                              store.id.toString().startsWith('fallback-')
                                ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                                : 'text-indigo-700 bg-indigo-100 hover:bg-indigo-200'
                            }`}
                            onClick={() => handleEditStoreClick(store)}
                            title="Edit store"
                            disabled={store.id.toString().startsWith('fallback-')}
                          >
                            <FaEdit className="mr-1" />
                            Edit
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
          {!loading && !searchQuery && stores.length > 0 && totalPages > 1 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                {/* Mobile pagination */}
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

                {/* Desktop pagination */}
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{' '}
                      <span className="font-medium">
                        {currentPage * itemsPerPage + 1}
                      </span>{' '}
                      to{' '}
                      <span className="font-medium">
                        {Math.min((currentPage + 1) * itemsPerPage, totalElements)}
                      </span>{' '}
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
                        <svg
                          className="h-5 w-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>

                      {getPageNumbers().map((pageNumber) => (
                        <button
                          key={`page-btn-${pageNumber}`}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition duration-200 ${
                            currentPage === pageNumber
                              ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
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
                        <svg
                          className="h-5 w-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StoreManagement;
