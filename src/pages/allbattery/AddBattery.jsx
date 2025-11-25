// F:\Eptiq Technologies\webapps\vegobike\vegobike_admin_frontend\src\pages\allbattery\AddBattery.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  FaSave, FaTimes, FaBatteryFull, FaBuilding, 
  FaMapMarkerAlt, FaStore, FaUpload 
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
    city: '',
    store: '',
    batteryStatus: 'open',
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [existingImage, setExistingImage] = useState(null);

  const [cities, setCities] = useState([]);
  const [stores, setStores] = useState([]);
  const [filteredStores, setFilteredStores] = useState([]);

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [errors, setErrors] = useState({});

  // Fetch Cities
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/cities`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.ok) {
          const data = await response.json();
          setCities(data);
        }
      } catch (err) {
        console.error('Error fetching cities:', err);
        toast.error('Failed to load cities');
      }
    };
    fetchCities();
  }, []);

  // Fetch Stores
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/stores`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.ok) {
          const data = await response.json();
          setStores(data);
        }
      } catch (err) {
        console.error('Error fetching stores:', err);
        toast.error('Failed to load stores');
      }
    };
    fetchStores();
  }, []);

  // Filter stores based on selected city
  useEffect(() => {
    if (formData.city) {
      const filtered = stores.filter(store => store.cityId === parseInt(formData.city));
      setFilteredStores(filtered);
      
      if (formData.store && !filtered.find(s => s.id === parseInt(formData.store))) {
        setFormData(prev => ({ ...prev, store: '' }));
      }
    } else {
      setFilteredStores([]);
      setFormData(prev => ({ ...prev, store: '' }));
    }
  }, [formData.city, stores, formData.store]);

  // Fetch Battery Data for Edit Mode
  useEffect(() => {
    if (isEditMode) {
      fetchBatteryData();
    }
  }, [isEditMode, id]);

  const fetchBatteryData = async () => {
    setLoadingData(true);
    try {
      const response = await fetch(`${BASE_URL}/api/batteries/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch battery data');

      const data = await response.json();
      
      setFormData({
        batteryId: data.batteryId || '',
        company: data.company || '',
        city: data.cityId?.toString() || '',
        store: data.storeId?.toString() || '',
        batteryStatus: data.batteryStatus?.toLowerCase() || 'open'
      });

      if (data.image) {
        setExistingImage(data.image);
      }

      toast.success('Battery data loaded');
    } catch (err) {
      console.error('Error fetching battery:', err);
      toast.error('Failed to load battery data');
    } finally {
      setLoadingData(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
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
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    document.getElementById('imageInput').value = '';
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.batteryId.trim()) {
      newErrors.batteryId = 'Battery ID is required';
    }

    if (!formData.company.trim()) {
      newErrors.company = 'Company name is required';
    }

    if (!formData.city) {
      newErrors.city = 'City is required';
    }

    if (!formData.store) {
      newErrors.store = 'Store is required';
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
      const formDataToSend = new FormData();
      
      formDataToSend.append('batteryId', formData.batteryId);
      formDataToSend.append('company', formData.company);
      formDataToSend.append('city', formData.city);
      formDataToSend.append('store', formData.store);
      formDataToSend.append('batteryStatus', formData.batteryStatus);

      if (imageFile) {
        formDataToSend.append('imageFile', imageFile);
      }

      const url = isEditMode 
        ? `${BASE_URL}/api/batteries/update/${id}`
        : `${BASE_URL}/api/add/battery`;

      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formDataToSend
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save battery');
      }

      toast.success(`Battery ${isEditMode ? 'updated' : 'created'} successfully! 🎉`);
      
      setTimeout(() => {
        navigate('/dashboard/allBattery');
      }, 1500);

    } catch (err) {
      console.error('Error saving battery:', err);
      toast.error(err.message || 'Failed to save battery');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/dashboard/allBattery');
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
                  {isEditMode ? 'Update battery information' : 'Fill in the details to add a new battery'}
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
              {/* Battery ID */}
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
                    placeholder="Enter battery ID"
                    disabled={isEditMode}
                  />
                </div>
                {errors.batteryId && (
                  <p className="text-red-500 text-xs mt-1">{errors.batteryId}</p>
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
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                      errors.city ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select City</option>
                    {cities.map(city => (
                      <option key={city.id} value={city.id}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.city && (
                  <p className="text-red-500 text-xs mt-1">{errors.city}</p>
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
                    name="store"
                    value={formData.store}
                    onChange={handleInputChange}
                    disabled={!formData.city}
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                      errors.store ? 'border-red-500' : 'border-gray-300'
                    } disabled:bg-gray-100 disabled:cursor-not-allowed`}
                  >
                    <option value="">Select Store</option>
                    {filteredStores.map(store => (
                      <option key={store.id} value={store.id}>
                        {store.name}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.store && (
                  <p className="text-red-500 text-xs mt-1">{errors.store}</p>
                )}
                {!formData.city && (
                  <p className="text-gray-500 text-xs mt-1">Please select a city first</p>
                )}
              </div>

              {/* Battery Status (Hidden) */}
              <input type="hidden" name="batteryStatus" value={formData.batteryStatus} />

              {/* Image Upload */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Battery Image
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
                    <div className="relative inline-block">
                      <img
                        src={imagePreview || existingImage}
                        alt="Battery preview"
                        className="w-48 h-48 object-cover rounded-lg border-2 border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ) : (
                    <label
                      htmlFor="imageInput"
                      className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <FaUpload className="w-10 h-10 mb-3 text-gray-400" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG, JPEG (MAX. 5MB)</p>
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
                className="px-6 py-2.5 border-2 border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all"
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
            <FaBatteryFull className="text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-blue-800 mb-1">Battery Status Info</h4>
              <p className="text-xs text-blue-700">
                New batteries are automatically set to <strong>"OPEN"</strong> status upon creation, 
                regardless of any status input. You can update the status later from the battery list.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddBattery;
