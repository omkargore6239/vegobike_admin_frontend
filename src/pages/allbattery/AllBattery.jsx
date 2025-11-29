import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaSearch, FaPlus, FaEdit, FaTrash, FaSync, FaEye, FaTimes, 
  FaExclamationTriangle, FaCheckCircle, FaBatteryFull, FaMapMarkerAlt,
  FaStore, FaInfoCircle, FaTimesCircle, FaBolt
} from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:8081';

const AllBattery = () => {
  const navigate = useNavigate();
  
  const [batteries, setBatteries] = useState([]);
  const [cities, setCities] = useState([]);
  const [stores, setStores] = useState([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState('batteryId');
  const [statusFilter, setStatusFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [storeFilter, setStoreFilter] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  
  const [selectedBattery, setSelectedBattery] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // ✅ Battery Status Configuration matching YOUR EXACT BACKEND ENUM
  const BATTERY_STATUS = {
    0: { label: 'OUT_OF_SERVICE', enumLabel: 'out of service', color: 'from-red-500 to-rose-600', bgColor: '#FEE2E2', textColor: '#DC2626' },
    1: { label: 'IN BIKE', enumLabel: 'in bike', color: 'from-green-500 to-emerald-500', bgColor: '#D1FAE5', textColor: '#059669' },
    2: { label: 'CHARGING', enumLabel: 'charging', color: 'from-yellow-500 to-amber-500', bgColor: '#FEF3C7', textColor: '#D97706' },
    3: { label: 'OPEN', enumLabel: 'open', color: 'from-blue-500 to-cyan-500', bgColor: '#DBEAFE', textColor: '#2563EB' }
  };

  // Get auth token
  const getAuthToken = () => {
    return localStorage.getItem('token') || localStorage.getItem('authToken');
  };

  // Fetch Batteries with proper search functionality
  const fetchBatteries = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = getAuthToken();
      
      if (!token) {
        toast.error('Please login to continue');
        navigate('/login');
        return;
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        size: pageSize.toString(),
        sortBy: 'id',
        direction: 'desc'
      });

      if (searchQuery.trim()) {
        switch (searchField) {
          case 'batteryId':
            params.set('batteryId', searchQuery.trim());
            break;
          case 'company':
            params.set('company', searchQuery.trim());
            break;
          case 'storeName':
            params.set('storeName', searchQuery.trim());
            break;
          case 'cityName':
            params.set('cityName', searchQuery.trim());
            break;
          default:
            params.set('batteryId', searchQuery.trim());
        }
      }

      if (statusFilter !== '') params.set('batteryStatus', statusFilter);
      if (cityFilter !== '') {
        const cityName = getCityName(cityFilter);
        if (cityName !== 'N/A') params.set('cityName', cityName);
      }
      if (storeFilter !== '') {
        const storeName = getStoreName(storeFilter);
        if (storeName !== 'N/A') params.set('storeName', storeName);
      }

      const url = `${BASE_URL}/api/batteries/getall?${params.toString()}`;
      console.log('🔍 Fetching batteries from:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Session expired. Please login again.');
          navigate('/login');
          return;
        }
        throw new Error(`Failed to fetch batteries: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Batteries API response:', result);

      if (result.success) {
        setBatteries(result.data || []);
        
        if (result.pagination) {
          setTotalPages(result.pagination.totalPages || 1);
          setTotalItems(result.pagination.totalElements || 0);
          setCurrentPage(result.pagination.currentPage || 0);
        } else {
          setTotalPages(1);
          setTotalItems(result.data?.length || 0);
        }
        
        if (result.data?.length > 0) {
          toast.success(`📋 Loaded ${result.data.length} batteries`);
        }
      } else {
        throw new Error('Failed to load batteries');
      }
      
    } catch (err) {
      console.error('❌ Error fetching batteries:', err);
      setError(err);
      toast.error('❌ Failed to load batteries');
      setBatteries([]);
      setTotalPages(0);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, statusFilter, cityFilter, storeFilter, searchQuery, searchField]);

  const fetchCities = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${BASE_URL}/api/cities/active`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        const citiesData = result.data || result;
        setCities(Array.isArray(citiesData) ? citiesData : []);
        console.log('✅ Cities loaded:', citiesData);
      }
    } catch (err) {
      console.error('❌ Error fetching cities:', err);
    }
  };

  const fetchStores = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${BASE_URL}/api/stores/active`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        const storesData = result.data || result;
        setStores(Array.isArray(storesData) ? storesData : []);
        console.log('✅ Stores loaded:', storesData);
      }
    } catch (err) {
      console.error('❌ Error fetching stores:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    toast.info('🔄 Refreshing batteries...');
    setSearchQuery('');
    setStatusFilter('');
    setCityFilter('');
    setStoreFilter('');
    setCurrentPage(0);
    await fetchBatteries();
    setRefreshing(false);
  };

  const clearFilters = () => {
    setStatusFilter('');
    setCityFilter('');
    setStoreFilter('');
    setSearchQuery('');
    setCurrentPage(0);
  };

  const handleSearch = () => {
    setCurrentPage(0);
    fetchBatteries();
  };

  const getStatusBadge = (statusCode) => {
    const status = BATTERY_STATUS[statusCode] || BATTERY_STATUS[3]; // Default to OPEN
    return (
      <span 
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r ${status.color} text-white shadow-sm`}
      >
        {status.label}
      </span>
    );
  };

  const getCityName = (cityId) => {
    if (!cityId) return 'N/A';
    const city = cities.find(c => c.id === parseInt(cityId));
    return city ? (city.name || city.cityName) : 'N/A';
  };

  const getStoreName = (storeId) => {
    if (!storeId) return 'N/A';
    const store = stores.find(s => s.id === parseInt(storeId));
    return store ? (store.name || store.storeName) : 'N/A';
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  useEffect(() => {
    fetchCities();
    fetchStores();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchBatteries();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [currentPage, pageSize, statusFilter, cityFilter, storeFilter, searchQuery, searchField]);

  return (
    <div className="min-h-screen bg-gray-100 py-1 px-1">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-3 mb-2">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                Battery Management
              </h1>
              <p className="text-gray-500 text-xs">Manage all batteries and their status</p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/dashboard/Battery/add')}
                className="flex items-center px-4 py-2 rounded-lg shadow-md transition-all bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold hover:shadow-lg"
              >
                <FaPlus className="mr-2" />
                Add Battery
              </button>

              <button
                onClick={handleRefresh}
                disabled={refreshing || loading}
                className={`flex items-center px-3 py-1.5 rounded-lg shadow-md transition-all ${
                  refreshing || loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
                } text-white text-sm`}
              >
                <FaSync className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              
              <div className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white px-3 py-1.5 rounded-lg shadow-lg">
                <div className="text-lg font-bold">{totalItems}</div>
                <div className="text-xs opacity-90">Total Batteries</div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-2">
            <div className="flex items-start">
              <FaExclamationTriangle className="text-red-500 mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-800 mb-1">Error Loading Batteries</h3>
                <p className="text-xs text-red-700 mb-2">{error.message || 'An unexpected error occurred'}</p>
                <button
                  onClick={handleRefresh}
                  className="mt-2 text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search & Filters */}
        <div className="bg-white rounded-xl shadow-lg p-3 mb-2">
          <div className="flex items-center justify-between space-x-4 mb-3">
            <div className="flex-1 flex space-x-2">
              <select
                value={searchField}
                onChange={(e) => setSearchField(e.target.value)}
                className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200"
              >
                <option value="batteryId">Battery ID</option>
                <option value="company">Company</option>
                <option value="storeName">Store</option>
                <option value="cityName">City</option>
              </select>
              
              <div className="flex-1 relative">
                <FaSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="text"
                  placeholder={`Search by ${searchField === 'batteryId' ? 'Battery ID' : searchField === 'company' ? 'Company' : searchField === 'storeName' ? 'Store Name' : 'City Name'}...`}
                  className="w-full pl-8 pr-20 py-1.5 border border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 transition-all text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full p-1 transition-colors"
                  >
                    <FaTimes className="text-xs" />
                  </button>
                )}
              </div>
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-1.5 rounded-lg border-2 ${
                showFilters ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-gray-200 text-gray-700'
              } hover:border-indigo-600 transition-all text-sm font-medium flex items-center`}
            >
              <FaInfoCircle className="mr-2" />
              Filters
              {(statusFilter !== '' || cityFilter !== '' || storeFilter !== '') && (
                <span className="ml-2 bg-red-500 text-white rounded-full w-2 h-2"></span>
              )}
            </button>

            <div className="flex items-center space-x-2">
              <label className="text-xs text-gray-600 whitespace-nowrap">Items per page:</label>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(parseInt(e.target.value));
                  setCurrentPage(0);
                }}
                className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>
          </div>

          {/* Advanced Filters - ✅ CORRECTED STATUS OPTIONS */}
          {showFilters && (
            <div className="border-t pt-3 grid grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:border-indigo-500"
                >
                  <option value="">All Status</option>
                  <option value="0">OUT OF SERVICE</option>
                  <option value="1">IN BIKE</option>
                  <option value="2">CHARGING</option>
                  <option value="3">OPEN</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
                <select
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:border-indigo-500"
                >
                  <option value="">All Cities</option>
                  {cities.map(city => (
                    <option key={city.id} value={city.id}>{city.name || city.cityName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Store</label>
                <select
                  value={storeFilter}
                  onChange={(e) => setStoreFilter(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:border-indigo-500"
                >
                  <option value="">All Stores</option>
                  {stores.map(store => (
                    <option key={store.id} value={store.id}>{store.name || store.storeName}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="w-full px-3 py-1.5 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
                >
                  <FaTimes className="mr-2" />
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Batteries Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
                  <th className="px-3 py-2 text-left text-xs font-semibold">Battery ID</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold">Company</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold">Status</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold">City</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold">Store</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold">Created</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-2"></div>
                        <p className="text-gray-500 text-sm">Loading batteries...</p>
                      </div>
                    </td>
                  </tr>
                ) : batteries.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8">
                      <div className="flex flex-col items-center">
                        <FaBatteryFull className="text-gray-400 text-4xl mb-2" />
                        <h3 className="text-sm font-semibold text-gray-900 mb-1">No batteries found</h3>
                        <p className="text-gray-500 text-xs">
                          {searchQuery ? `No results for "${searchQuery}"` : 'No batteries available'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  batteries.map((battery) => (
                    <tr key={battery.id} className="hover:bg-indigo-50 transition-colors">
                      <td className="px-3 py-2">
                        <div className="flex items-center">
                          <FaBolt className="text-yellow-500 mr-2" />
                          <span className="font-semibold text-indigo-600 text-sm">{battery.batteryId}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-gray-900 text-sm font-medium">{battery.company}</span>
                      </td>
                      <td className="px-3 py-2">{getStatusBadge(battery.batteryStatusCode)}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center text-sm text-gray-700">
                          <FaMapMarkerAlt className="mr-1 text-xs text-gray-400" />
                          {battery.cityName || getCityName(battery.cityId)}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center text-sm text-gray-700">
                          <FaStore className="mr-1 text-xs text-gray-400" />
                          {battery.storeName || getStoreName(battery.storeId)}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-xs text-gray-600">{formatDate(battery.createdAt)}</span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedBattery(battery);
                              setShowDetailsModal(true);
                            }}
                            className="p-1.5 bg-blue-100 hover:bg-blue-600 text-blue-600 hover:text-white rounded transition-colors"
                            title="View Details"
                          >
                            <FaEye className="text-xs" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              navigate(`/dashboard/Battery/add/${battery.id}`);
                            }}
                            className="p-1.5 bg-yellow-100 hover:bg-yellow-600 text-yellow-600 hover:text-white rounded transition-colors"
                            title="Edit"
                          >
                            <FaEdit className="text-xs" />
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
          {!loading && batteries.length > 0 && totalPages > 1 && (
            <div className="border-t border-gray-100 px-3 py-2 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-600">
                  Showing <span className="font-semibold text-gray-900">{currentPage * pageSize + 1}</span> to{' '}
                  <span className="font-semibold text-gray-900">
                    {Math.min((currentPage + 1) * pageSize, totalItems)}
                  </span>{' '}
                  of <span className="font-semibold text-gray-900">{totalItems}</span> batteries
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setCurrentPage(0)}
                    disabled={currentPage === 0}
                    className="px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    First
                  </button>
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 0}
                    className="px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  
                  <span className="px-2 py-1 text-xs font-medium text-gray-700">
                    Page {currentPage + 1} of {totalPages}
                  </span>
                  
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages - 1}
                    className="px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages - 1)}
                    disabled={currentPage === totalPages - 1}
                    className="px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Last
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Details Modal */}
        {showDetailsModal && selectedBattery && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
              <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-4 rounded-t-xl flex items-center justify-between">
                <div className="flex items-center">
                  <FaBatteryFull className="mr-2 text-2xl" />
                  <h3 className="text-lg font-bold">Battery Details</h3>
                </div>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedBattery(null);
                  }}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <FaTimes className="text-xl" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Battery ID</label>
                    <p className="text-sm font-medium text-gray-900">{selectedBattery.batteryId}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Company</label>
                    <p className="text-sm font-medium text-gray-900">{selectedBattery.company}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
                    {getStatusBadge(selectedBattery.batteryStatusCode)}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">City</label>
                    <p className="text-sm font-medium text-gray-900">{selectedBattery.cityName || getCityName(selectedBattery.cityId)}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Store</label>
                    <p className="text-sm font-medium text-gray-900">{selectedBattery.storeName || getStoreName(selectedBattery.storeId)}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Created At</label>
                    <p className="text-sm font-medium text-gray-900">{formatDate(selectedBattery.createdAt)}</p>
                  </div>
                  {selectedBattery.updatedAt && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Updated At</label>
                      <p className="text-sm font-medium text-gray-900">{formatDate(selectedBattery.updatedAt)}</p>
                    </div>
                  )}
                  {selectedBattery.image && (
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-gray-600 mb-2">Battery Image</label>
                      <img
                        src={selectedBattery.image}
                        alt={selectedBattery.batteryId}
                        className="w-full h-48 object-contain bg-gray-50 border rounded-lg"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedBattery(null);
                  }}
                  className="px-5 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors text-sm"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedBattery(null);
                    navigate(`/dashboard/Battery/add/${selectedBattery.id}`);
                  }}
                  className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-lg font-medium transition-all text-sm flex items-center"
                >
                  <FaEdit className="mr-2" />
                  Edit Battery
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllBattery;
