import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  FaSave, FaTimes, FaBatteryFull, FaBuilding, 
  FaMapMarkerAlt, FaStore, FaUpload, FaInfoCircle 
} from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:8081';

const AddBattery = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    batteryId: '',
    company: '',
    cityId: '',
    storeId: '',
    batteryStatusCode: 3  // Default to OPEN (code 3)
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [existingImage, setExistingImage] = useState(null);

  const [cities, setCities] = useState([]);
  const [stores, setStores] = useState([]);
  const [loadingStores, setLoadingStores] = useState(false);

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [errors, setErrors] = useState({});

  // ✅ Battery Status Options matching your exact enum - Excluding "IN BIKE" (code 1)
  const BATTERY_STATUS_OPTIONS = [
    { 
      code: 0, 
      label: 'OUT OF SERVICE', 
      enumLabel: 'out of service',
      color: 'text-red-600', 
      bgColor: 'bg-red-50', 
      description: 'Battery is not operational' 
    },
    // IN_BIKE (code 1) - Excluded from manual selection
    { 
      code: 2, 
      label: 'CHARGING', 
      enumLabel: 'charging',
      color: 'text-yellow-600', 
      bgColor: 'bg-yellow-50', 
      description: 'Battery is being charged' 
    },
    { 
      code: 3, 
      label: 'OPEN', 
      enumLabel: 'open',
      color: 'text-blue-600', 
      bgColor: 'bg-blue-50', 
      description: 'Battery is available and ready' 
    }
  ];

  // Get auth token
  const getAuthToken = () => {
    return localStorage.getItem('token') || localStorage.getItem('authToken');
  };

  // Fetch Cities on mount
  useEffect(() => {
    fetchCities();
  }, []);

  // Fetch cities
  const fetchCities = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${BASE_URL}/api/cities/active`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch cities');
      
      const result = await response.json();
      const citiesData = result.data || result;
      setCities(Array.isArray(citiesData) ? citiesData : []);
      
      console.log('✅ Cities loaded:', citiesData);
    } catch (err) {
      console.error('❌ Error fetching cities:', err);
      toast.error('Failed to load cities');
    }
  };

  // Fetch Stores when cityId changes
  useEffect(() => {
    if (formData.cityId) {
      fetchStoresByCity(formData.cityId);
    } else {
      setStores([]);
    }
  }, [formData.cityId]);

  // Fetch stores by city ID
  const fetchStoresByCity = async (cityId) => {
    if (!cityId) return;
    
    setLoadingStores(true);
    setStores([]);
    
    try {
      const token = getAuthToken();
      const response = await fetch(`${BASE_URL}/api/stores/active/by-city?cityId=${cityId}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error(`Failed to fetch stores`);
      
      const result = await response.json();
      
      if (result.success && result.data) {
        setStores(result.data);
        console.log(`✅ Loaded ${result.data.length} stores for city ${cityId}`);
        
        if (result.data.length === 0) {
          toast.info('No stores found for this city');
        }
      } else {
        setStores([]);
      }
      
    } catch (err) {
      console.error('❌ Error fetching stores:', err);
      toast.error('Failed to load stores for selected city');
      setStores([]);
    } finally {
      setLoadingStores(false);
    }
  };

  // Fetch Battery Data for Edit Mode
  useEffect(() => {
    if (isEditMode) {
      fetchBatteryData();
    }
  }, [isEditMode, id]);

  const fetchBatteryData = async () => {
    setLoadingData(true);
    try {
      const token = getAuthToken();
      
      console.log(`🔍 Fetching battery data for ID: ${id}`);
      
      const response = await fetch(`${BASE_URL}/api/batteries/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to fetch battery:', errorText);
        throw new Error('Failed to fetch battery data');
      }

      const data = await response.json();
      
      console.log('📋 Battery data loaded:', data);
      
      // ✅ Map backend response to form data
      setFormData({
        batteryId: data.batteryId || '',
        company: data.company || '',
        cityId: data.cityId?.toString() || '',
        storeId: data.storeId?.toString() || '',
        batteryStatusCode: data.batteryStatusCode ?? 3
      });

      // ✅ Set existing image if available
      if (data.image) {
        console.log('✅ Existing image found:', data.image);
        setExistingImage(data.image);
      } else {
        console.log('⚠️ No image found for this battery');
      }

      toast.success('Battery data loaded successfully');
    } catch (err) {
      console.error('❌ Error fetching battery:', err);
      toast.error('Failed to load battery data');
      navigate('/dashboard/allBattery');
    } finally {
      setLoadingData(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'cityId') {
      setFormData(prev => ({
        ...prev,
        cityId: value,
        storeId: ''
      }));
    } else if (name === 'batteryStatusCode') {
      setFormData(prev => ({
        ...prev,
        batteryStatusCode: parseInt(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      setImageFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      
      console.log('✅ New image selected:', file.name);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    const input = document.getElementById('imageInput');
    if (input) input.value = '';
    
    console.log('🗑️ Image removed');
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.batteryId.trim()) {
      newErrors.batteryId = 'Battery ID is required';
    }

    if (!formData.company.trim()) {
      newErrors.company = 'Company name is required';
    }

    if (!formData.cityId) {
      newErrors.cityId = 'City is required';
    }

    if (!formData.storeId) {
      newErrors.storeId = 'Store is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);

    try {
      const token = getAuthToken();
      
      if (!token) {
        toast.error('Authentication required. Please login again.');
        navigate('/login');
        return;
      }

      if (isEditMode) {
        // ✅ EDIT MODE - Send CORRECT structure matching backend expectations
        const updateData = {
          batteryId: formData.batteryId.trim(),
          company: formData.company.trim(),
          cityId: parseInt(formData.cityId),
          storeId: parseInt(formData.storeId),
          batteryStatusCode: formData.batteryStatusCode
        };

        console.log('📤 Updating battery with data:', updateData);

        const response = await fetch(`${BASE_URL}/api/batteries/update/${id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updateData)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Update failed:', errorText);
          
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { message: errorText };
          }
          
          throw new Error(errorData.message || `Server returned ${response.status}`);
        }

        const result = await response.json();
        console.log('✅ Battery updated successfully:', result);

        toast.success('Battery updated successfully! 🎉');
        
        setTimeout(() => {
          navigate('/dashboard/allBattery');
        }, 1500);

      } else {
        // ✅ CREATE MODE - Send FormData for new battery with image
        const formDataToSend = new FormData();
        
        formDataToSend.append('batteryId', formData.batteryId.trim());
        formDataToSend.append('company', formData.company.trim());
        formDataToSend.append('cityId', formData.cityId);
        formDataToSend.append('storeId', formData.storeId);

        if (imageFile) {
          formDataToSend.append('imageFile', imageFile);
        }

        console.log('📤 Creating new battery');

        const response = await fetch(`${BASE_URL}/api/batteries/add/battery`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formDataToSend
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Create failed:', errorText);
          
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { message: errorText };
          }
          
          throw new Error(errorData.message || `Server returned ${response.status}`);
        }

        const result = await response.json();
        console.log('✅ Battery created successfully:', result);

        toast.success('Battery created successfully! 🎉');
        
        setTimeout(() => {
          navigate('/dashboard/allBattery');
        }, 1500);
      }

    } catch (err) {
      console.error('❌ Error saving battery:', err);
      
      let errorMessage = 'Failed to save battery';
      
      if (err.message.includes('401')) {
        errorMessage = 'Session expired. Please login again.';
        setTimeout(() => navigate('/login'), 2000);
      } else if (err.message.includes('403')) {
        errorMessage = 'You do not have permission to perform this action';
      } else if (err.message.includes('Duplicate') || err.message.includes('already exists')) {
        errorMessage = 'Battery ID already exists';
      } else if (err.message.includes('not found')) {
        errorMessage = 'Selected city or store not found';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/dashboard/allBattery');
  };

  // Get status info for display
  const getStatusInfo = (code) => {
    const allStatuses = [
      { code: 0, label: 'OUT OF SERVICE', enumLabel: 'out of service', color: 'text-red-600', bgColor: 'bg-red-50' },
      { code: 1, label: 'IN BIKE', enumLabel: 'in bike', color: 'text-green-600', bgColor: 'bg-green-50' },
      { code: 2, label: 'CHARGING', enumLabel: 'charging', color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
      { code: 3, label: 'OPEN', enumLabel: 'open', color: 'text-blue-600', bgColor: 'bg-blue-50' }
    ];
    return allStatuses.find(s => s.code === code) || allStatuses[3];
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Loading battery data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-4 px-4">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FaBatteryFull className="text-3xl text-indigo-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                  {isEditMode ? 'Edit Battery' : 'Add New Battery'}
                </h1>
                <p className="text-gray-500 text-sm">
                  {isEditMode ? `Update battery information (Database ID: ${id})` : 'Fill in the details to add a new battery'}
                </p>
              </div>
            </div>
            <button
              onClick={handleCancel}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Close"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ✅ Battery ID - NOW EDITABLE */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Battery ID <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaBatteryFull className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="batteryId"
                    value={formData.batteryId}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                      errors.batteryId ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter battery ID (e.g., BAT-001)"
                  />
                </div>
                {errors.batteryId && (
                  <p className="text-red-500 text-xs mt-1">{errors.batteryId}</p>
                )}
                {isEditMode && (
                  <p className="text-blue-600 text-xs mt-1">
                    ℹ️ Battery ID can be changed. Make sure it's unique!
                  </p>
                )}
              </div>

              {/* Company */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Company <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaBuilding className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                      errors.company ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter company name"
                  />
                </div>
                {errors.company && (
                  <p className="text-red-500 text-xs mt-1">{errors.company}</p>
                )}
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  City <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaMapMarkerAlt className="text-gray-400" />
                  </div>
                  <select
                    name="cityId"
                    value={formData.cityId}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none ${
                      errors.cityId ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select City</option>
                    {cities.map(city => (
                      <option key={city.id} value={city.id}>
                        {city.name || city.cityName}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.cityId && (
                  <p className="text-red-500 text-xs mt-1">{errors.cityId}</p>
                )}
              </div>

              {/* Store */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Store <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaStore className="text-gray-400" />
                  </div>
                  <select
                    name="storeId"
                    value={formData.storeId}
                    onChange={handleInputChange}
                    disabled={!formData.cityId || loadingStores}
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none ${
                      errors.storeId ? 'border-red-500' : 'border-gray-300'
                    } disabled:bg-gray-100 disabled:cursor-not-allowed`}
                  >
                    <option value="">
                      {loadingStores ? 'Loading stores...' : 'Select Store'}
                    </option>
                    {stores.map(store => (
                      <option key={store.id} value={store.id}>
                        {store.storeName || store.name}
                      </option>
                    ))}
                  </select>
                  {loadingStores && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <div className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                {errors.storeId && (
                  <p className="text-red-500 text-xs mt-1">{errors.storeId}</p>
                )}
                {!formData.cityId && (
                  <p className="text-gray-500 text-xs mt-1">Please select a city first</p>
                )}
              </div>

              {/* Battery Status Dropdown */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Battery Status <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaInfoCircle className="text-gray-400" />
                  </div>
                  <select
                    name="batteryStatusCode"
                    value={formData.batteryStatusCode}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
                  >
                    {BATTERY_STATUS_OPTIONS.map(status => (
                      <option key={status.code} value={status.code}>
                        {status.label} (Code: {status.code})
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Status Preview with Description */}
                <div className="mt-2 flex items-start space-x-2">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusInfo(formData.batteryStatusCode).bgColor} ${getStatusInfo(formData.batteryStatusCode).color}`}>
                    <FaBatteryFull className="mr-1" />
                    {getStatusInfo(formData.batteryStatusCode).label}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {BATTERY_STATUS_OPTIONS.find(s => s.code === formData.batteryStatusCode)?.description}
                  </p>
                </div>
              </div>

              {/* Image Upload with Existing Image Display */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Battery Image {!isEditMode && <span className="text-gray-500 text-xs">(Optional)</span>}
                </label>
                
                <div className="mt-2">
                  <input
                    id="imageInput"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  
                  {(imagePreview || existingImage) ? (
                    <div className="space-y-2">
                      <div className="relative inline-block">
                        <img
                          src={imagePreview || existingImage}
                          alt="Battery preview"
                          className="w-64 h-64 object-cover rounded-lg border-2 border-gray-300 shadow-lg"
                          onError={(e) => {
                            console.error('❌ Image failed to load:', e.target.src);
                            e.target.src = 'https://via.placeholder.com/256?text=No+Image';
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors shadow-lg"
                          title="Remove image"
                        >
                          <FaTimes />
                        </button>
                      </div>
                      
                      {imagePreview && (
                        <div className="bg-green-50 border border-green-200 rounded px-3 py-2 inline-block">
                          <p className="text-xs text-green-700">✓ New image selected</p>
                        </div>
                      )}
                      {existingImage && !imagePreview && (
                        <div className="bg-blue-50 border border-blue-200 rounded px-3 py-2 inline-block">
                          <p className="text-xs text-blue-700">📷 Current battery image</p>
                        </div>
                      )}
                      
                      <div>
                        <label
                          htmlFor="imageInput"
                          className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg cursor-pointer transition-colors text-sm"
                        >
                          <FaUpload className="mr-2" />
                          {imagePreview ? 'Change Image' : 'Upload New Image'}
                        </label>
                      </div>
                    </div>
                  ) : (
                    <label
                      htmlFor="imageInput"
                      className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <FaUpload className="w-12 h-12 mb-3 text-gray-400" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG, JPEG (MAX. 5MB)</p>
                        {isEditMode && (
                          <p className="text-xs text-yellow-600 mt-2">⚠️ No existing image found</p>
                        )}
                      </div>
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t">
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="px-6 py-2.5 border-2 border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-6 py-2.5 rounded-lg text-white font-semibold transition-all flex items-center ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-lg hover:shadow-xl'
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    {isEditMode ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <FaSave className="mr-2" />
                    {isEditMode ? 'Update Battery' : 'Create Battery'}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Info Box */}
        <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 mt-4">
          <div className="flex items-start">
            <FaBatteryFull className="text-blue-500 mt-0.5 mr-3 flex-shrink-0 text-xl" />
            <div>
              <h4 className="text-sm font-semibold text-blue-800 mb-2">Battery Status Guide (Enum Codes)</h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li><strong>🟢 OPEN (Code: 3):</strong> Battery is available and ready to be assigned</li>
                <li><strong>🟡 CHARGING (Code: 2):</strong> Battery is currently being charged</li>
                <li><strong>🔴 OUT OF SERVICE (Code: 0):</strong> Battery is not operational</li>
                <li className="text-gray-600 italic mt-2 pt-2 border-t border-blue-200">
                  ℹ️ <strong>IN BIKE (Code: 1)</strong> is automatically set by the system when a battery is assigned to a bike
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddBattery;
