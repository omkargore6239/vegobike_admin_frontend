import React, { useState, useEffect } from 'react';

const AllVehicleTypes = () => {
  // State management
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [activeVehicleTypes, setActiveVehicleTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingVehicleType, setEditingVehicleType] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [vehicleTypesPerPage] = useState(10);
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  // ✅ UPDATED: Form state to match VehicleType model
  const [formData, setFormData] = useState({
    name: '',           // ✅ Changed from vehicleTypeName to name
    isActive: 1
  });

  // Form validation errors
  const [formErrors, setFormErrors] = useState({});

  // API Configuration
  const API_BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:8081';

  const API_ENDPOINTS = {
    getAllVehicleTypes: `${API_BASE_URL}/api/vehicle-types/all`,
    getVehicleTypeById: (id) => `${API_BASE_URL}/api/vehicle-types/${id}`,
    createVehicleType: `${API_BASE_URL}/api/vehicle-types/add`,
    updateVehicleType: (id) => `${API_BASE_URL}/api/vehicle-types/update/${id}`,
    getActiveVehicleTypes: `${API_BASE_URL}/api/vehicle-types/active`,
    toggleVehicleTypeStatus: (id) => `${API_BASE_URL}/api/vehicle-types/${id}/toggle-status`
  };

  // Enhanced fetch function
  const makeApiCall = async (url, options = {}) => {
    const token = localStorage.getItem('adminToken');
    
    const defaultHeaders = {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    };

    const defaultOptions = {
      headers: {
        ...defaultHeaders,
        ...options.headers
      },
      ...options
    };

    try {
      console.log('🔄 Making API call to:', url);
      console.log('📤 Request method:', defaultOptions.method || 'GET');
      console.log('📤 Request body:', defaultOptions.body);

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
          errorMessage = response.statusText || ` ${response.status}`;
        }
        
        console.error('Type is Already Exist', {
          url,
          status: response.status,
          statusText: response.statusText,
          errorMessage,
          responseData
        });
        
        throw new Error(`   ${response.status}: ${errorMessage}`);
      }
      
      console.log('✅ API Response data:', responseData);
      return responseData;
      
    } catch (error) {
      console.error('Type is Already Exist');
      console.error('Type is Already Exist', {
        name: error.name,
        message: error.message,
        url: url
      });
      throw error;
    }
  };

  // Fetch all vehicle types
  const fetchAllVehicleTypes = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Fetching all vehicle types from:', API_ENDPOINTS.getAllVehicleTypes);
      const data = await makeApiCall(API_ENDPOINTS.getAllVehicleTypes);
      setVehicleTypes(Array.isArray(data) ? data : []);
      console.log('✅ Vehicle types fetched successfully:', data?.length || 0, 'types');
    } catch (err) {
      setError('Failed to fetch vehicle types: ' + err.message);
      console.error('❌ Error fetching vehicle types:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch active vehicle types
  const fetchActiveVehicleTypes = async () => {
    try {
      console.log('🔄 Fetching active vehicle types from:', API_ENDPOINTS.getActiveVehicleTypes);
      const data = await makeApiCall(API_ENDPOINTS.getActiveVehicleTypes);
      setActiveVehicleTypes(Array.isArray(data) ? data : []);
      console.log('✅ Active vehicle types fetched successfully:', data?.length || 0, 'types');
    } catch (err) {
      console.error('❌ Error fetching active vehicle types:', err);
    }
  };

  // Load data on component mount
  useEffect(() => {
    console.log('🚀 Vehicle Types component mounted, API Base URL:', API_BASE_URL);
    fetchAllVehicleTypes();
    fetchActiveVehicleTypes();
  }, []);

  // ✅ UPDATED: Form validation for name field only
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Vehicle type name is required';
    }
    if (formData.name.trim().length < 2) {
      errors.name = 'Vehicle type name must be at least 2 characters';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    let finalValue = value;
    
    if (name === 'isActive') {
      finalValue = checked ? 1 : 0;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }));
    
    // Clear validation error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // ✅ UPDATED: Reset form with correct fields
  const handleAddVehicleType = () => {
    setEditingVehicleType(null);
    setFormData({ name: '', isActive: 1 });
    setFormErrors({});
    setError(null);
    setShowModal(true);
  };

  // ✅ UPDATED: Open modal for editing with correct field names
  const handleEditVehicleType = (vehicleType) => {
    setEditingVehicleType(vehicleType);
    setFormData({
      name: vehicleType.name || '',
      isActive: vehicleType.isActive !== undefined ? vehicleType.isActive : 1
    });
    setFormErrors({});
    setError(null);
    setShowModal(true);
  };

  // ✅ UPDATED: Submit form with correct field structure
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      const url = editingVehicleType 
        ? API_ENDPOINTS.updateVehicleType(editingVehicleType.id)
        : API_ENDPOINTS.createVehicleType;
      
      const method = editingVehicleType ? 'PUT' : 'POST';

      // ✅ UPDATED: Send only the fields that exist in VehicleType model
      const vehicleTypeData = {
        name: formData.name.trim(),
        isActive: formData.isActive
      };

      console.log(`🔄 ${editingVehicleType ? 'Updating' : 'Creating'} vehicle type with URL:`, url);
      console.log('📤 Submitting vehicle type data:', vehicleTypeData);

      const result = await makeApiCall(url, {
        method,
        body: JSON.stringify(vehicleTypeData)
      });

      console.log('✅ Submit result:', result);

      // Update local state
      if (editingVehicleType) {
        setVehicleTypes(prev => prev.map(vt => 
          vt.id === editingVehicleType.id ? result : vt
        ));
        console.log('✅ Vehicle type updated successfully');
      } else {
        setVehicleTypes(prev => [...prev, result]);
        console.log('✅ Vehicle type created successfully');
      }

      // Close modal and reset form
      setShowModal(false);
      resetForm();
      
      // Refresh data
      await fetchAllVehicleTypes();
      await fetchActiveVehicleTypes();

    } catch (err) {
      setError(`Failed to ${editingVehicleType ? 'update' : 'add'} vehicle type: ${err.message}`);
      console.error('❌ Submit error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ UPDATED: Reset form with correct fields
  const resetForm = () => {
    setFormData({ name: '', isActive: 1 });
    setFormErrors({});
  };

  // Toggle vehicle type status
  const toggleVehicleTypeStatus = async (vehicleType) => {
    if (loading) return;
    
    setLoading(true);
    setError(null);

    try {
      const toggleUrl = API_ENDPOINTS.toggleVehicleTypeStatus(vehicleType.id);
      console.log('🔄 Toggling status for vehicle type:', vehicleType.id, 'URL:', toggleUrl);
      
      const result = await makeApiCall(toggleUrl, {
        method: 'PATCH'
      });
      
      console.log('✅ Toggle result:', result);
      
      // Update vehicle types list
      setVehicleTypes(prev => prev.map(vt => 
        vt.id === vehicleType.id ? result : vt
      ));

      // Update active vehicle types list
      if (result.isActive === 1) {
        setActiveVehicleTypes(prev => {
          const exists = prev.some(vt => vt.id === result.id);
          if (exists) {
            return prev.map(vt => vt.id === result.id ? result : vt);
          } else {
            return [...prev, result];
          }
        });
      } else {
        setActiveVehicleTypes(prev => prev.filter(vt => vt.id !== result.id));
      }

    } catch (err) {
      setError('Failed to update vehicle type status: ' + err.message);
      console.error('❌ Toggle status error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter and pagination logic
  const handleShowActiveToggle = () => {
    setShowActiveOnly(!showActiveOnly);
    setCurrentPage(1);
  };

  const getDisplayVehicleTypes = () => {
    return showActiveOnly ? activeVehicleTypes : vehicleTypes;
  };

  // ✅ UPDATED: Search by name field
  const filteredVehicleTypes = getDisplayVehicleTypes().filter(vehicleType =>
    (vehicleType.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastVehicleType = currentPage * vehicleTypesPerPage;
  const indexOfFirstVehicleType = indexOfLastVehicleType - vehicleTypesPerPage;
  const currentVehicleTypes = filteredVehicleTypes.slice(indexOfFirstVehicleType, indexOfLastVehicleType);
  const totalPages = Math.ceil(filteredVehicleTypes.length / vehicleTypesPerPage);

  // Reset pagination when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, showActiveOnly]);

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-xl shadow-lg">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Vehicle Types Management</h1>
         
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
            {showActiveOnly ? 'Show All Types' : 'Show Active Only'}
          </button>
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold text-sm transition duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={handleAddVehicleType}
            disabled={loading}
          >
            + Add New Vehicle Type
          </button>
        </div>
      </div>

      {/* Search and Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 bg-white p-4 rounded-xl shadow-sm">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search vehicle types by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md px-4 py-2 border-2 border-gray-200 rounded-full text-sm focus:outline-none focus:border-blue-500 transition duration-300"
          />
        </div>
        <div className="flex flex-wrap gap-4">
          <span className="px-4 py-2 bg-gray-100 rounded-full text-sm font-medium">
            Total: {vehicleTypes.length}
          </span>
          <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            Active: {activeVehicleTypes.length}
          </span>
          <span className="px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-medium">
            Inactive: {vehicleTypes.length - activeVehicleTypes.length}
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

      {/* ✅ UPDATED: Vehicle Types Table - removed description column */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Vehicle Type Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Created At</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Updated At</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentVehicleTypes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500 italic">
                    {loading 
                      ? 'Loading vehicle types...' 
                      : searchTerm 
                        ? 'No vehicle types found matching your search' 
                        : showActiveOnly 
                          ? 'No active vehicle types available' 
                          : 'No vehicle types available'
                    }
                  </td>
                </tr>
              ) : (
                currentVehicleTypes.map((vehicleType) => (
                  <tr key={vehicleType.id} className="hover:bg-gray-50 transition duration-200">
                    <td className="px-6 py-4 text-sm text-gray-600 font-medium">{vehicleType.id}</td>
                    <td className="px-6 py-4 font-semibold text-blue-600">{vehicleType.name || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <button
                        className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full transition duration-200 hover:scale-105 ${
                          vehicleType.isActive === 1 
                            ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                        onClick={() => toggleVehicleTypeStatus(vehicleType)}
                        disabled={loading}
                        title="Click to toggle status"
                      >
                        {vehicleType.isActive === 1 ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {vehicleType.createdAt ? new Date(vehicleType.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      }) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {vehicleType.updatedAt ? new Date(vehicleType.updatedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      }) : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button 
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-xs font-medium transition duration-200 disabled:opacity-60"
                          onClick={() => handleEditVehicleType(vehicleType)}
                          disabled={loading}
                          title="Edit vehicle type"
                        >
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
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-4 bg-white p-4 rounded-xl shadow-sm">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1 || loading}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
          >
            Previous
          </button>
          
          <span className="px-4 py-2 text-sm font-medium text-gray-700">
            Page {currentPage} of {totalPages} ({filteredVehicleTypes.length} vehicle types)
          </span>
          
          <button 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages || loading}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
          >
            Next
          </button>
        </div>
      )}

      {/* ✅ UPDATED: Modal with only name field */}
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
                {editingVehicleType ? `Edit Vehicle Type (ID: ${editingVehicleType.id})` : 'Add New Vehicle Type'}
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
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                  Vehicle Type Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 transition duration-200 ${
                    formErrors.name 
                      ? 'border-red-500 focus:ring-red-200' 
                      : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
                  }`}
                  placeholder="Enter vehicle type name (e.g., Bike, Car, Scooter)"
                  maxLength={100}
                />
                {formErrors.name && (
                  <p className="mt-1 text-xs text-red-600">{formErrors.name}</p>
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
                  Active Vehicle Type
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
                  {loading ? 'Saving...' : (editingVehicleType ? 'Update Type' : 'Add Type')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllVehicleTypes;
