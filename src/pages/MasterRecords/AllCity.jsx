import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FaEdit, FaEye } from 'react-icons/fa';

const AllCity = () => {
  // State management
  const [cities, setCities] = useState([]);
  const [activeCities, setActiveCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [togglingIds, setTogglingIds] = useState(new Set()); // Track which cities are being toggled
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCity, setEditingCity] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [citiesPerPage] = useState(10);
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    cityName: '',
    isActive: 1
  });

  // Image upload state
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  // API Configuration
  const API_BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:8081';
  
  const API_ENDPOINTS = useMemo(() => ({
    getAllCities: `${API_BASE_URL}/api/cities`,
    getCityById: (id) => `${API_BASE_URL}/api/cities/${id}`,
    createCity: `${API_BASE_URL}/api/cities/add`,
    updateCity: (id) => `${API_BASE_URL}/api/cities/${id}`,
    getActiveCities: `${API_BASE_URL}/api/cities/active`,
    toggleCityStatus: (id) => `${API_BASE_URL}/api/cities/${id}/toggle-status`
  }), [API_BASE_URL]);

  // Image URL helper function
  const fixImageUrl = useCallback((imagePath) => {
    if (!imagePath || imagePath.trim() === '') return null;
    
    const path = imagePath.trim();
    
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    
    if (path.startsWith('cities/')) {
      return `${API_BASE_URL}/uploads/${path}`;
    }
    
    if (path.startsWith('/')) {
      return API_BASE_URL + path;
    }
    
    return `${API_BASE_URL}/uploads/${path}`;
  }, [API_BASE_URL]);

  // ✅ **NEW**: Simple Toggle Switch Component
  const ToggleSwitch = React.memo(({ cityId, isActive, onToggle, disabled }) => {
    const isToggling = togglingIds.has(cityId);
    
    return (
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onToggle(cityId)}
          disabled={disabled || isToggling}
          className={`
            relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            ${isActive === 1 ? 'bg-green-500' : 'bg-gray-300'}
            ${(disabled || isToggling) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          title={`Click to ${isActive === 1 ? 'deactivate' : 'activate'}`}
        >
          <span
            className={`
              inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-in-out
              ${isActive === 1 ? 'translate-x-6' : 'translate-x-1'}
              ${isToggling ? 'animate-pulse' : ''}
            `}
          />
        </button>
        <span className={`text-xs font-medium ${isActive === 1 ? 'text-green-700' : 'text-gray-500'}`}>
          {isToggling ? 'Updating...' : (isActive === 1 ? 'Active' : 'Inactive')}
        </span>
      </div>
    );
  });

  ToggleSwitch.displayName = 'ToggleSwitch';

  // CityImage component
  const CityImage = React.memo(({ city, className = "w-12 h-12 rounded-full object-cover border border-gray-200" }) => {
    const [hasError, setHasError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    
    const imageUrl = useMemo(() => {
      return city.cityImage ? fixImageUrl(city.cityImage) : null;
    }, [city.cityImage, fixImageUrl]);

    const handleImageError = useCallback(() => {
      setHasError(true);
      setIsLoading(false);
    }, []);

    const handleImageLoad = useCallback(() => {
      setHasError(false);
      setIsLoading(false);
    }, []);

    useEffect(() => {
      if (imageUrl) {
        setHasError(false);
        setIsLoading(true);
      }
    }, [imageUrl]);

    if (!imageUrl || hasError) {
      return (
        <div className={`${className} bg-gray-200 flex items-center justify-center text-xs text-gray-500`}>
          No Image
        </div>
      );
    }

    return (
      <div className="relative">
        {isLoading && (
          <div className={`${className} bg-gray-100 flex items-center justify-center text-xs text-gray-400 animate-pulse absolute inset-0`}>
            Loading...
          </div>
        )}
        <img 
          src={imageUrl}
          alt={city.cityName}
          className={className}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="lazy"
        />
      </div>
    );
  });

  CityImage.displayName = 'CityImage';

  // API call function
  const makeApiCall = useCallback(async (url, options = {}) => {
    const token = localStorage.getItem('adminToken');
    
    const defaultHeaders = {
      'Authorization': token ? `Bearer ${token}` : '',
    };

    if (!(options.body instanceof FormData)) {
      defaultHeaders['Content-Type'] = 'application/json';
    }

    const defaultOptions = {
      headers: {
        ...defaultHeaders,
        ...options.headers
      },
      ...options
    };

    try {
      console.log('🔄 Making API call to:', url);
      const response = await fetch(url, defaultOptions);
      console.log('📥 Response status:', response.status);
      
      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      
      let responseData;
      try {
        if (isJson) {
          responseData = await response.json();
        } else {
          responseData = await response.text();
        }
      } catch (parseError) {
        console.warn('⚠️ Failed to parse response:', parseError);
        responseData = null;
      }
      
      if (!response.ok) {
        let errorMessage;
        if (responseData) {
          if (typeof responseData === 'object') {
            errorMessage = responseData.message || responseData.error || JSON.stringify(responseData);
          } else {
            errorMessage = responseData;
          }
        } else {
          errorMessage = response.statusText || `HTTP ${response.status}`;
        }
        
        throw new Error(`HTTP ${response.status}: ${errorMessage}`);
      }
      
      console.log('✅ API Response data:', responseData);
      return responseData;
      
    } catch (error) {
      console.error('💥 API Call Error:', error);
      throw error;
    }
  }, []);

  // Fetch all cities
  const fetchAllCities = useCallback(async () => {
    if (loading) return; // Prevent multiple simultaneous calls
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Fetching all cities from:', API_ENDPOINTS.getAllCities);
      const data = await makeApiCall(API_ENDPOINTS.getAllCities);
      
      const citiesData = Array.isArray(data) ? data : [];
      setCities(citiesData);
      console.log('✅ Cities data updated:', citiesData.length, 'cities');
      
    } catch (err) {
      setError('Failed to fetch cities: ' + err.message);
      console.error('❌ Error fetching cities:', err);
    } finally {
      setLoading(false);
    }
  }, [API_ENDPOINTS.getAllCities, makeApiCall, loading]);

  // Fetch active cities
  const fetchActiveCities = useCallback(async () => {
    try {
      console.log('🔄 Fetching active cities from:', API_ENDPOINTS.getActiveCities);
      const data = await makeApiCall(API_ENDPOINTS.getActiveCities);
      
      const activeCitiesData = Array.isArray(data) ? data : [];
      setActiveCities(activeCitiesData);
      console.log('✅ Active cities data updated:', activeCitiesData.length, 'cities');
      
    } catch (err) {
      console.error('❌ Error fetching active cities:', err);
    }
  }, [API_ENDPOINTS.getActiveCities, makeApiCall]);

  // Load cities on component mount
  useEffect(() => {
    console.log('🚀 Component mounted, API Base URL:', API_BASE_URL);
    fetchAllCities();
    fetchActiveCities();
  }, []);

  // ✅ **FIXED**: Simple toggle status function without confirmation
  const toggleCityStatus = useCallback(async (cityId) => {
    // Add city to toggling set
    setTogglingIds(prev => new Set([...prev, cityId]));
    setError(null);

    try {
      const toggleUrl = API_ENDPOINTS.toggleCityStatus(cityId);
      console.log('🔄 Toggling status for city:', cityId, 'URL:', toggleUrl);
      
      const result = await makeApiCall(toggleUrl, {
        method: 'PATCH'
      });
      
      console.log('✅ Toggle result:', result);
      
      // ✅ **FIXED**: Update local state immediately for better UX
      setCities(prevCities => 
        prevCities.map(city => 
          city.id === cityId ? { ...city, isActive: result.isActive } : city
        )
      );

      // Update active cities list
      if (result.isActive === 1) {
        setActiveCities(prev => {
          const filtered = prev.filter(c => c.id !== cityId);
          return [...filtered, result];
        });
      } else {
        setActiveCities(prev => prev.filter(c => c.id !== cityId));
      }

      console.log(`✅ City ${cityId} status changed to:`, result.isActive === 1 ? 'Active' : 'Inactive');

    } catch (err) {
      setError(`Failed to toggle city status: ${err.message}`);
      console.error('❌ Toggle status error:', err);
      
      // Refresh data on error to ensure consistency
      await Promise.all([fetchAllCities(), fetchActiveCities()]);
    } finally {
      // Remove city from toggling set
      setTogglingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(cityId);
        return newSet;
      });
    }
  }, [API_ENDPOINTS, makeApiCall, fetchAllCities, fetchActiveCities]);

  // Form validation
  const validateForm = useCallback(() => {
    const errors = {};
    if (!formData.cityName.trim()) {
      errors.cityName = 'City name is required';
    }
    if (formData.cityName.trim().length < 2) {
      errors.cityName = 'City name must be at least 2 characters';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData.cityName]);

  // Handle form input changes
  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    let finalValue = value;
    
    if (name === 'isActive') {
      finalValue = checked ? 1 : 0;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }));
    
    setFormErrors(prev => {
      if (prev[name]) {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      }
      return prev;
    });
  }, []);

  // Handle image selection
  const handleImageChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file (JPG, PNG, GIF, etc.)');
        e.target.value = '';
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        e.target.value = '';
        return;
      }

      setSelectedImage(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      
      setError(null);
    }
  }, []);

  // Clear image selection
  const clearImage = useCallback(() => {
    setSelectedImage(null);
    setImagePreview(null);
    const fileInput = document.getElementById('image');
    if (fileInput) fileInput.value = '';
  }, []);

  // Open modal for adding new city
  const handleAddCity = useCallback(() => {
    setEditingCity(null);
    setFormData({ cityName: '', isActive: 1 });
    setSelectedImage(null);
    setImagePreview(null);
    setFormErrors({});
    setError(null);
    setShowModal(true);
  }, []);

  // Open modal for editing city
  const handleEditCity = useCallback((city) => {
    setEditingCity(city);
    setFormData({
      cityName: city.cityName || '',
      isActive: city.isActive !== undefined ? city.isActive : 1
    });
    setSelectedImage(null);
    setImagePreview(city.cityImage || null);
    setFormErrors({});
    setError(null);
    setShowModal(true);
  }, []);

  // Submit form
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      const url = editingCity 
        ? API_ENDPOINTS.updateCity(editingCity.id)
        : API_ENDPOINTS.createCity;
      
      const method = editingCity ? 'PUT' : 'POST';

      const formDataObj = new FormData();
      
      const cityData = {
        cityName: formData.cityName.trim(),
        isActive: formData.isActive
      };
      
      formDataObj.append('cityDto', new Blob([JSON.stringify(cityData)], {
        type: 'application/json'
      }));

      if (selectedImage) {
        formDataObj.append('image', selectedImage);
      }

      const result = await makeApiCall(url, {
        method,
        body: formDataObj
      });

      setShowModal(false);
      resetForm();
      
      await Promise.all([fetchAllCities(), fetchActiveCities()]);

    } catch (err) {
      setError(`Failed to ${editingCity ? 'update' : 'add'} city: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [formData, validateForm, editingCity, selectedImage, API_ENDPOINTS, makeApiCall, fetchAllCities, fetchActiveCities]);

  // Reset form data
  const resetForm = useCallback(() => {
    setFormData({ cityName: '', isActive: 1 });
    setSelectedImage(null);
    setImagePreview(null);
    setFormErrors({});
    const fileInput = document.getElementById('image');
    if (fileInput) fileInput.value = '';
  }, []);

  // Handle show active cities toggle
  const handleShowActiveToggle = useCallback(() => {
    setShowActiveOnly(prev => !prev);
    setCurrentPage(1);
  }, []);

  // Filtered cities
  const filteredCities = useMemo(() => {
    const displayCities = showActiveOnly ? activeCities : cities;
    return displayCities.filter(city =>
      (city.cityName || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [cities, activeCities, showActiveOnly, searchTerm]);

  // Pagination data
  const paginationData = useMemo(() => {
    const indexOfLastCity = currentPage * citiesPerPage;
    const indexOfFirstCity = indexOfLastCity - citiesPerPage;
    const currentCities = filteredCities.slice(indexOfFirstCity, indexOfLastCity);
    const totalPages = Math.ceil(filteredCities.length / citiesPerPage);

    return { currentCities, totalPages };
  }, [filteredCities, currentPage, citiesPerPage]);

  // Reset pagination when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, showActiveOnly]);

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-xl shadow-lg">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">City Management</h1>
        </div>
        <div className="flex gap-3">
          <button 
            className={`px-4 py-2 rounded-lg font-medium text-sm transition duration-300 ${
              showActiveOnly 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
            onClick={handleShowActiveToggle}
            disabled={loading}
          >
            {showActiveOnly ? 'Show All Cities' : 'Show Active Only'}
          </button>
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold text-sm transition duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={handleAddCity}
            disabled={loading}
          >
            + Add New City
          </button>
        </div>
      </div>

      {/* Search and Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 bg-white p-4 rounded-xl shadow-sm">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search cities by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md px-4 py-2 border-2 border-gray-200 rounded-full text-sm focus:outline-none focus:border-blue-500 transition duration-300"
          />
        </div>
        <div className="flex flex-wrap gap-4">
          <span className="px-4 py-2 bg-gray-100 rounded-full text-sm font-medium">
            Total Cities: {cities.length}
          </span>
          <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            Active: {activeCities.length}
          </span>
          <span className="px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-medium">
            Inactive: {cities.length - activeCities.length}
          </span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex justify-between items-center">
          <div>
            <p className="font-medium">Error occurred:</p>
            <p className="text-sm">{error}</p>
          </div>
          <button 
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700 text-xl font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Processing...</p>
          </div>
        </div>
      )}

      {/* Cities Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Image</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">City Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Created At</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginationData.currentCities.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500 italic">
                    {loading 
                      ? 'Loading cities...' 
                      : searchTerm 
                        ? 'No cities found matching your search' 
                        : showActiveOnly 
                          ? 'No active cities available' 
                          : 'No cities available'
                    }
                  </td>
                </tr>
              ) : (
                paginationData.currentCities.map((city) => (
                  <tr key={city.id} className="hover:bg-gray-50 transition duration-200">
                    <td className="px-6 py-4 text-sm text-gray-600 font-medium">{city.id}</td>
                    <td className="px-6 py-4">
                      <CityImage city={city} />
                    </td>
                    <td className="px-6 py-4 font-semibold text-blue-600">{city.cityName || 'N/A'}</td>
                    <td className="px-6 py-4">
                      {/* ✅ **NEW**: Simple Small Toggle Switch */}
                      <ToggleSwitch 
                        cityId={city.id}
                        isActive={city.isActive}
                        onToggle={toggleCityStatus}
                        disabled={loading}
                      />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {city.createdAt ? new Date(city.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      }) : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button 
                          className="inline-flex items-center gap-1 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg text-xs font-medium transition duration-200 disabled:opacity-60"
                          onClick={() => handleEditCity(city)}
                          disabled={loading || togglingIds.has(city.id)}
                          title="Edit city"
                        >
                          <FaEdit />
                          Edit
                        </button>
                        {city.cityImage && (
                          <button 
                            className="inline-flex items-center gap-1 bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-xs font-medium transition duration-200"
                            onClick={() => window.open(fixImageUrl(city.cityImage), '_blank')}
                            title="View full image"
                          >
                            <FaEye />
                            View
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {paginationData.totalPages > 1 && (
        <div className="flex justify-center items-center space-x-4 bg-white p-4 rounded-xl shadow-sm">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1 || loading}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
          >
            Previous
          </button>
          
          <span className="px-4 py-2 text-sm font-medium text-gray-700">
            Page {currentPage} of {paginationData.totalPages} ({filteredCities.length} cities)
          </span>
          
          <button 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, paginationData.totalPages))}
            disabled={currentPage === paginationData.totalPages || loading}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
          >
            Next
          </button>
        </div>
      )}

      {/* Modal for Add/Edit City */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowModal(false);
            }
          }}
        >
          <div 
            className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">
                {editingCity ? `Edit City (ID: ${editingCity.id})` : 'Add New City'}
              </h2>
              <button 
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-8 h-8 flex items-center justify-center"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label htmlFor="image" className="block text-sm font-semibold text-gray-700 mb-2">
                  City Image
                </label>
                <input
                  type="file"
                  id="image"
                  name="image"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supported: JPG, PNG, GIF. Max size: 5MB
                </p>
                
                {imagePreview && (
                  <div className="mt-3 relative">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-24 h-24 rounded-lg object-cover border border-gray-200"
                      onError={(e) => {
                        console.warn("Preview image error:", e);
                        e.currentTarget.style.display = "none";
                      }}
                    />
                    <button
                      type="button"
                      onClick={clearImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="cityName" className="block text-sm font-semibold text-gray-700 mb-2">
                  City Name *
                </label>
                <input
                  type="text"
                  id="cityName"
                  name="cityName"
                  value={formData.cityName}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 transition duration-200 ${
                    formErrors.cityName 
                      ? 'border-red-500 focus:ring-red-200' 
                      : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
                  }`}
                  placeholder="Enter city name"
                  maxLength={100}
                />
                {formErrors.cityName && (
                  <p className="mt-1 text-xs text-red-600">{formErrors.cityName}</p>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive === 1}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Active City
                </label>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-gray-200">
                <button 
                  type="button" 
                  className="flex-1 px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium text-sm transition duration-200"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition duration-200 disabled:opacity-60"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : (editingCity ? 'Update City' : 'Add City')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllCity;
