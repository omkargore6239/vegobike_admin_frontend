import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FaEdit, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';

const AllVehicleTypes = () => {
  // State management
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [activevehicleTypes, setActivevehicleTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [togglingIds, setTogglingIds] = useState(new Set());
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingVehicleType, setEditingVehicleType] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  
  // ✅ Backend pagination states
  const [currentPage, setCurrentPage] = useState(0); // Backend uses 0-based indexing
  const [vehicleTypesPerPage, setVehicleTypesPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  
  // ✅ Sorting states
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('DESC');
  
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    isActive: 1
  });

  // Form validation errors
  const [formErrors, setFormErrors] = useState({});

  // API Configuration
  const API_BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:8081';

  const API_ENDPOINTS = useMemo(() => ({
    getAllVehicleTypes: `${API_BASE_URL}/api/vehicle-types/all`,
    getVehicleTypeById: (id) => `${API_BASE_URL}/api/vehicle-types/${id}`,
    createVehicleType: `${API_BASE_URL}/api/vehicle-types/add`,
    updateVehicleType: (id) => `${API_BASE_URL}/api/vehicle-types/update/${id}`,
    getActiveVehicleTypes: `${API_BASE_URL}/api/vehicle-types/active`,
    toggleVehicleTypeStatus: (id) => `${API_BASE_URL}/api/vehicle-types/${id}/toggle-status`
  }), [API_BASE_URL]);

  // ✅ Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(0); // Reset to first page on search
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // API call function
  const makeApiCall = useCallback(async (url, options = {}) => {
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

  // ✅ Fetch all vehicle types with backend pagination
  const fetchAllVehicleTypes = useCallback(async () => {
    if (loading) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        size: vehicleTypesPerPage.toString(),
        sortBy: sortBy,
        direction: sortDirection
      });

      // Add search parameter only if it exists
      if (debouncedSearchTerm && debouncedSearchTerm.trim()) {
        params.append('name', debouncedSearchTerm.trim());
      }

      // Add isActive filter when showing active only
      if (showActiveOnly) {
        params.append('isActive', '1');
      }

      const url = `${API_ENDPOINTS.getAllVehicleTypes}?${params.toString()}`;
      console.log('🔄 Fetching vehicle types from:', url);
      
      const response = await makeApiCall(url);
      
      // ✅ Handle the response structure
      if (response.success && response.data) {
        setVehicleTypes(response.data);
        
        // Update pagination metadata
        if (response.pagination) {
          setCurrentPage(response.pagination.currentPage);
          setTotalPages(response.pagination.totalPages);
          setTotalElements(response.pagination.totalElements);
          setHasNext(response.pagination.hasNext);
          setHasPrevious(response.pagination.hasPrevious);
        }
        
        console.log('✅ Vehicle types data updated:', response.data.length, 'types on page', currentPage + 1);
      } else {
        setVehicleTypes([]);
        setTotalPages(0);
        setTotalElements(0);
      }
      
    } catch (err) {
      setError('Failed to fetch vehicle types: ' + err.message);
      console.error('❌ Error fetching vehicle types:', err);
      setVehicleTypes([]);
    } finally {
      setLoading(false);
    }
  }, [API_ENDPOINTS.getAllVehicleTypes, makeApiCall, currentPage, vehicleTypesPerPage, sortBy, sortDirection, debouncedSearchTerm, showActiveOnly, loading]);

  // Fetch active vehicle types
  const fetchActiveVehicleTypes = useCallback(async () => {
    try {
      console.log('🔄 Fetching active vehicle types from:', API_ENDPOINTS.getActiveVehicleTypes);
      const data = await makeApiCall(API_ENDPOINTS.getActiveVehicleTypes);
      
      const activeVehicleTypesData = Array.isArray(data) ? data : [];
      setActivevehicleTypes(activeVehicleTypesData);
      console.log('✅ Active vehicle types data updated:', activeVehicleTypesData.length, 'types');
      
    } catch (err) {
      console.error('❌ Error fetching active vehicle types:', err);
    }
  }, [API_ENDPOINTS.getActiveVehicleTypes, makeApiCall]);

  // ✅ Fetch vehicle types when pagination/sort/search changes
  useEffect(() => {
    console.log('🚀 Component mounted or dependencies changed');
    fetchAllVehicleTypes();
    if (!showActiveOnly) {
      fetchActiveVehicleTypes();
    }
  }, [currentPage, vehicleTypesPerPage, sortBy, sortDirection, debouncedSearchTerm, showActiveOnly]);

  // ✅ Toggle vehicle type status
  const toggleVehicleTypeStatus = useCallback(async (vehicleTypeId) => {
    setTogglingIds(prev => new Set([...prev, vehicleTypeId]));
    setError(null);

    try {
      const toggleUrl = API_ENDPOINTS.toggleVehicleTypeStatus(vehicleTypeId);
      console.log('🔄 Toggling status for vehicle type:', vehicleTypeId, 'URL:', toggleUrl);
      
      const result = await makeApiCall(toggleUrl, {
        method: 'PATCH'
      });
      
      console.log('✅ Toggle result:', result);
      
      // Update local state immediately
      setVehicleTypes(prevTypes => 
        prevTypes.map(type => 
          type.id === vehicleTypeId ? result : type
        )
      );

      // Update active vehicle types list
      if (result.isActive === 1) {
        setActivevehicleTypes(prev => {
          const filtered = prev.filter(t => t.id !== vehicleTypeId);
          return [...filtered, result];
        });
      } else {
        setActivevehicleTypes(prev => prev.filter(t => t.id !== vehicleTypeId));
      }

      console.log(`✅ Vehicle type ${vehicleTypeId} status changed to:`, result.isActive === 1 ? 'Active' : 'Inactive');

    } catch (err) {
      setError(`Failed to toggle vehicle type status: ${err.message}`);
      console.error('❌ Toggle status error:', err);
      
      // Refresh data on error
      await Promise.all([fetchAllVehicleTypes(), fetchActiveVehicleTypes()]);
    } finally {
      setTogglingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(vehicleTypeId);
        return newSet;
      });
    }
  }, [API_ENDPOINTS, makeApiCall, fetchAllVehicleTypes, fetchActiveVehicleTypes]);

  // Form validation
  const validateForm = useCallback(() => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Vehicle type name is required';
    }
    if (formData.name.trim().length < 2) {
      errors.name = 'Vehicle type name must be at least 2 characters';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData.name]);

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

  // Open modal for adding new vehicle type
  const handleAddVehicleType = useCallback(() => {
    setEditingVehicleType(null);
    setFormData({ name: '', isActive: 1 });
    setFormErrors({});
    setError(null);
    setShowModal(true);
  }, []);

  // Open modal for editing vehicle type
  const handleEditVehicleType = useCallback((vehicleType) => {
    setEditingVehicleType(vehicleType);
    setFormData({
      name: vehicleType.name || '',
      isActive: vehicleType.isActive !== undefined ? vehicleType.isActive : 1
    });
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
      const url = editingVehicleType 
        ? API_ENDPOINTS.updateVehicleType(editingVehicleType.id)
        : API_ENDPOINTS.createVehicleType;
      
      const method = editingVehicleType ? 'PUT' : 'POST';

      const vehicleTypeData = {
        name: formData.name.trim(),
        isActive: formData.isActive
      };

      const result = await makeApiCall(url, {
        method,
        body: JSON.stringify(vehicleTypeData)
      });

      console.log('✅ Vehicle type saved successfully:', result);

      setShowModal(false);
      resetForm();
      
      await Promise.all([fetchAllVehicleTypes(), fetchActiveVehicleTypes()]);

    } catch (err) {
      setError(`Failed to ${editingVehicleType ? 'update' : 'add'} vehicle type: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [formData, validateForm, editingVehicleType, API_ENDPOINTS, makeApiCall, fetchAllVehicleTypes, fetchActiveVehicleTypes]);

  // Reset form data
  const resetForm = useCallback(() => {
    setFormData({ name: '', isActive: 1 });
    setFormErrors({});
  }, []);

  // Handle show active vehicle types toggle
  const handleShowActiveToggle = useCallback(() => {
    setShowActiveOnly(prev => !prev);
    setCurrentPage(0);
  }, []);

  // Handle page size change
  const handlePageSizeChange = useCallback((e) => {
    setVehicleTypesPerPage(Number(e.target.value));
    setCurrentPage(0);
  }, []);

  // Handle sort change
  const handleSortChange = useCallback((field) => {
    if (sortBy === field) {
      setSortDirection(prev => prev === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setSortDirection('DESC');
    }
    setCurrentPage(0);
  }, [sortBy]);

  // Get sort icon
  const getSortIcon = useCallback((field) => {
    if (sortBy !== field) {
      return <FaSort className="inline ml-1 text-gray-400" />;
    }
    return sortDirection === 'ASC' 
      ? <FaSortUp className="inline ml-1 text-blue-600" />
      : <FaSortDown className="inline ml-1 text-blue-600" />;
  }, [sortBy, sortDirection]);

  // Format date helper
  const formatDate = useCallback((timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      return new Date(timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-xl shadow-lg">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Vehicle Types Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            {showActiveOnly ? 'Active Vehicle Types' : 'All Vehicle Types'} - Server-side Pagination
          </p>
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

      {/* Search, Filter, and Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 bg-white p-4 rounded-xl shadow-sm">
        <div className="flex-1 flex gap-3 items-center flex-wrap">
          <input
            type="text"
            placeholder="Search vehicle types by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-[250px] max-w-md px-4 py-2 border-2 border-gray-200 rounded-full text-sm focus:outline-none focus:border-blue-500 transition duration-300"
          />
          
          {!showActiveOnly && (
            <select
              value={vehicleTypesPerPage}
              onChange={handlePageSizeChange}
              className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition duration-300"
              disabled={loading}
            >
              <option value={5}>5 per page</option>
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
            </select>
          )}
        </div>
        
        <div className="flex flex-wrap gap-4">
          <span className="px-4 py-2 bg-gray-100 rounded-full text-sm font-medium">
            Total: {totalElements}
          </span>
          <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            Active: {activevehicleTypes.length}
          </span>
          <span className="px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-medium">
            Inactive: {totalElements - activevehicleTypes.length}
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
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 font-medium">Processing...</p>
          </div>
        </div>
      )}

      {/* Vehicle Types Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  <button
                    onClick={() => handleSortChange('id')}
                    className="flex items-center hover:text-blue-600 transition"
                  >
                    ID
                    {getSortIcon('id')}
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  <button
                    onClick={() => handleSortChange('name')}
                    className="flex items-center hover:text-blue-600 transition"
                  >
                    Vehicle Type Name
                    {getSortIcon('name')}
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  <button
                    onClick={() => handleSortChange('isActive')}
                    className="flex items-center hover:text-blue-600 transition"
                  >
                    Status
                    {getSortIcon('isActive')}
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  <button
                    onClick={() => handleSortChange('createdAt')}
                    className="flex items-center hover:text-blue-600 transition"
                  >
                    Created At
                    {getSortIcon('createdAt')}
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  <button
                    onClick={() => handleSortChange('updatedAt')}
                    className="flex items-center hover:text-blue-600 transition"
                  >
                    Updated At
                    {getSortIcon('updatedAt')}
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {vehicleTypes.length === 0 ? (
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
                vehicleTypes.map((vehicleType) => (
                  <tr key={vehicleType.id} className="hover:bg-blue-50 transition duration-200">
                    <td className="px-6 py-4 text-sm text-gray-600 font-medium">{vehicleType.id}</td>
                    <td className="px-6 py-4 font-semibold text-blue-600">{vehicleType.name || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <button
                        className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full transition duration-200 hover:scale-105 ${
                          vehicleType.isActive === 1 
                            ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        } ${togglingIds.has(vehicleType.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={() => toggleVehicleTypeStatus(vehicleType.id)}
                        disabled={loading || togglingIds.has(vehicleType.id)}
                        title="Click to toggle status"
                      >
                        {togglingIds.has(vehicleType.id) 
                          ? 'Updating...' 
                          : (vehicleType.isActive === 1 ? 'Active' : 'Inactive')
                        }
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(vehicleType.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(vehicleType.updatedAt)}
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        className="inline-flex items-center gap-1 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg text-xs font-medium transition duration-200 disabled:opacity-60"
                        onClick={() => handleEditVehicleType(vehicleType)}
                        disabled={loading || togglingIds.has(vehicleType.id)}
                        title="Edit vehicle type"
                      >
                        <FaEdit />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enhanced Pagination */}
      {totalPages > 0 && (
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm">
          <div className="text-sm text-gray-600">
            Showing <span className="font-semibold text-blue-600">{(currentPage * vehicleTypesPerPage) + 1}</span> to{' '}
            <span className="font-semibold text-blue-600">
              {Math.min((currentPage + 1) * vehicleTypesPerPage, totalElements)}
            </span>{' '}
            of <span className="font-semibold text-blue-600">{totalElements}</span> vehicle types
          </div>
          
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setCurrentPage(0)}
              disabled={!hasPrevious || loading}
              className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
              title="First Page"
            >
              &laquo; First
            </button>
            
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 0))}
              disabled={!hasPrevious || loading}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
            >
              &lsaquo; Prev
            </button>
            
            <span className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg">
              Page {currentPage + 1} of {totalPages}
            </span>
            
            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages - 1))}
              disabled={!hasNext || loading}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
            >
              Next &rsaquo;
            </button>
            
            <button 
              onClick={() => setCurrentPage(totalPages - 1)}
              disabled={!hasNext || loading}
              className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
              title="Last Page"
            >
              Last &raquo;
            </button>
          </div>
          
          {/* Page Jump */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Go to:</span>
            <input
              type="number"
              min="1"
              max={totalPages}
              value={currentPage + 1}
              onChange={(e) => {
                const page = parseInt(e.target.value) - 1;
                if (page >= 0 && page < totalPages) {
                  setCurrentPage(page);
                }
              }}
              className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      )}

      {/* Modal for Add/Edit Vehicle Type */}
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
            <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-blue-600">
              <h2 className="text-xl font-bold text-white">
                {editingVehicleType ? `Edit Vehicle Type (ID: ${editingVehicleType.id})` : 'Add New Vehicle Type'}
              </h2>
              <button 
                className="text-white hover:text-gray-200 text-2xl font-bold w-8 h-8 flex items-center justify-center"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                  Vehicle Type Name <span className="text-red-500">*</span>
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
                  <p className="mt-1 text-xs text-red-600 font-medium">{formErrors.name}</p>
                )}
              </div>

              <div className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive === 1}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Set as Active Vehicle Type
                </label>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-gray-200">
                <button 
                  type="button" 
                  className="flex-1 px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium text-sm transition duration-200 shadow"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition duration-200 disabled:opacity-60 shadow"
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
