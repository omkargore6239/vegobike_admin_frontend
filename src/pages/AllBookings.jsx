import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import {
  FaEye, FaMapMarkerAlt, FaMotorcycle, FaCreditCard, FaCalendarAlt,
  FaUser, FaPhone, FaHashtag, FaClock, FaMoneyBillWave, FaShieldAlt,
  FaSearch, FaArrowLeft, FaCheckCircle, FaTimesCircle, FaEdit, FaSave,
  FaUpload, FaDownload, FaFileAlt, FaPlus, FaTimes, FaSync, FaExclamationTriangle,
  FaImage, FaCamera, FaFileInvoice, FaInfoCircle,FaIdCard 
} from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { bookingAPI, documentAPI, additionalChargeAPI } from '../utils/apiClient';
import apiClient, { BASE_URL } from '../api/apiConfig';

const AllBookings = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [bookings, setBookings] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(() => {
    const saved = sessionStorage.getItem('bookingsCurrentPage');
    return saved ? parseInt(saved) : 0;
  });
  // ✅ ADD THESE NEW STATES
const [showEndTripKmModal, setShowEndTripKmModal] = useState(false);
const [endTripKmValue, setEndTripKmValue] = useState('');

  const [loading, setLoading] = useState(true);
  const [pageSize, setPageSize] = useState(() => {
    const saved = sessionStorage.getItem('bookingsPageSize');
    return saved ? parseInt(saved) : 10;
  });
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [viewMode, setViewMode] = useState(() => {
    const saved = sessionStorage.getItem('bookingsViewMode');
    return saved === 'true';
  });
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [isSearching, setIsSearching] = useState(false);
  // Add these new state variables at the top with other states

const [showExtendTripModal, setShowExtendTripModal] = useState(false);
const [newEndDateTime, setNewEndDateTime] = useState('');
const [extendLoading, setExtendLoading] = useState(false);


  useEffect(() => {
    sessionStorage.setItem('bookingsCurrentPage', currentPage.toString());
  }, [currentPage]);

  useEffect(() => {
    sessionStorage.setItem('bookingsPageSize', pageSize.toString());
  }, [pageSize]);

  useEffect(() => {
    sessionStorage.setItem('bookingsViewMode', viewMode.toString());
  }, [viewMode]);

  useEffect(() => {
    if (selectedBooking) {
      sessionStorage.setItem('selectedBookingId', selectedBooking.id.toString());
    }
  }, [selectedBooking]);

  useEffect(() => {
    const savedViewMode = sessionStorage.getItem('bookingsViewMode') === 'true';
    const savedBookingId = sessionStorage.getItem('selectedBookingId');
    
    if (savedViewMode && savedBookingId && !selectedBooking) {
      const restoreBooking = async () => {
        try {
          const response = await bookingAPI.getById(parseInt(savedBookingId));
          setSelectedBooking(response.data || response.data.data);
        } catch (error) {
          console.error('Failed to restore booking:', error);
          sessionStorage.removeItem('bookingsViewMode');
          sessionStorage.removeItem('selectedBookingId');
          setViewMode(false);
        }
      };
      restoreBooking();
    }
  }, []);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`📋 Fetching bookings - Page: ${currentPage}, Size: ${pageSize}, Sort: ${sortBy} ${sortDirection}`);

      const response = await bookingAPI.getAll(currentPage, pageSize, sortBy, sortDirection);
      
      console.log('✅ Bookings fetched:', response.data?.length || 0);

      setBookings(response.data || []);
      setTotalPages(response.pagination?.totalPages || 0);
      setTotalItems(response.pagination?.totalItems || 0);
      
      toast.success(`📋 Loaded ${response.data?.length || 0} bookings`);

    } catch (error) {
      console.error('❌ Error fetching bookings:', error);
      setError(error);
      
      if (error.response?.status === 401) {
        toast.error('🔐 Session expired. Please login again.');
        setTimeout(() => navigate('/login'), 2000);
      } else if (error.response?.status === 403) {
        toast.error('🚫 Access denied.');
      } else {
        toast.error('❌ Failed to load bookings.');
      }
      
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, sortBy, sortDirection]);

  const handleSearchBookings = useCallback(async (query) => {
    if (!query || query.trim() === '') {
      fetchBookings();
      return;
    }

    setIsSearching(true);
    setError(null);
    
    try {
      const response = await bookingAPI.searchBookings(query.trim());
      setBookings(response.data || []);
      setTotalItems(response.data?.length || 0);
      setTotalPages(1);
      setCurrentPage(0);
      
      toast.success(`🔍 Found ${response.data?.length || 0} booking(s)`);
    } catch (error) {
      console.error('❌ Error searching bookings:', error);
      toast.error('❌ Failed to search bookings.');
      setBookings([]);
    } finally {
      setIsSearching(false);
    }
  }, [fetchBookings]);

  const handleRefresh = async () => {
    setRefreshing(true);
    toast.info('🔄 Refreshing bookings...');
    setSearchQuery("");
    await fetchBookings();
    setRefreshing(false);
  };

  useEffect(() => {
    if (!viewMode) {
      fetchBookings();
    }
  }, [fetchBookings, viewMode]);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (window.searchTimeout) {
      clearTimeout(window.searchTimeout);
    }

    window.searchTimeout = setTimeout(() => {
      if (query.trim() === '') {
        fetchBookings();
      } else {
        handleSearchBookings(query);
      }
    }, 500);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    fetchBookings();
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handlePageSizeChange = (e) => {
    setPageSize(parseInt(e.target.value));
    setCurrentPage(0);
  };




  const handleView = async (booking) => {
    console.log('👁️ Viewing booking:', booking);

    try {
      setLoading(true);
      
      const response = await bookingAPI.getById(booking.id);
      const fullBooking = response.data || booking;
      
      console.log('✅ Full booking data fetched:', fullBooking);

      setSelectedBooking(fullBooking);
      setViewMode(true);
      sessionStorage.setItem('selectedBookingId', fullBooking.id.toString());
      
    } catch (error) {
      console.error('❌ Error fetching booking details:', error);
      toast.error('Failed to load booking details.');
      
      setSelectedBooking(booking);
      setViewMode(true);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setViewMode(false);
    setSelectedBooking(null);
    sessionStorage.removeItem('bookingsViewMode');
    sessionStorage.removeItem('selectedBookingId');
    fetchBookings();
  };

  const getStatusColor = (status) => {
    const statusMap = {
      'Pending': 'from-yellow-500 to-amber-500',
      'Confirmed': 'from-blue-500 to-cyan-500',
      'Accepted': 'from-green-500 to-emerald-500',
      'Trip Started': 'from-purple-500 to-indigo-500',
      'On Going': 'from-teal-500 to-cyan-500',
      'End Trip': 'from-orange-500 to-red-500',
      'Completed': 'from-emerald-500 to-green-600',
      'Cancelled': 'from-red-500 to-rose-600',
      'Rejected': 'from-gray-500 to-slate-500',
    };
    return statusMap[status] || 'from-gray-500 to-slate-500';
  };

  const getPaymentMethodIcon = (type) => {
    return type === 2 ? '💳 Online' : '💵 Cash';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toISOString().slice(0, 16);
    } catch {
      return '';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const getCustomerDisplay = (booking) => {
    return booking.customerName || 
           booking.userName || 
           `Customer #${booking.customerId || 'Unknown'}`;
  };

  const getCustomerPhone = (booking) => {
    return booking.customerNumber || 
           booking.phoneNumber || 
           booking.customerPhone || 
           'N/A';
  };

  const getVehicleNumber = (booking) => {
    return booking.bikeDetails?.registrationNumber || 
           booking.vehicleNumber || 
           booking.registrationNumber || 
           'N/A';
  };

  const getVehicleDetails = (booking) => {
    if (booking.bikeDetails?.brand && booking.bikeDetails?.model) {
      return `${booking.bikeDetails.brand} ${booking.bikeDetails.model}`;
    }
    return `Vehicle ID: ${booking.vehicleId || 'N/A'}`;
  };

  return (
    <div className="min-h-screen bg-gray-100 py-1 px-1">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="max-w-7xl mx-auto">
        {viewMode && selectedBooking ? (
          <BookingDetailView
            booking={selectedBooking}
            onBack={handleBack}
            formatDate={formatDate}
            formatCurrency={formatCurrency}
            getStatusColor={getStatusColor}
            getPaymentMethodIcon={getPaymentMethodIcon}
            refreshBookings={fetchBookings}
            setBookings={setBookings}
            getCustomerDisplay={getCustomerDisplay}
            getCustomerPhone={getCustomerPhone}
            getVehicleNumber={getVehicleNumber}
            getVehicleDetails={getVehicleDetails}
            navigate={navigate}
            showEndTripKmModal={showEndTripKmModal}
    setShowEndTripKmModal={setShowEndTripKmModal}
    endTripKmValue={endTripKmValue}
    setEndTripKmValue={setEndTripKmValue}
     showExtendTripModal={showExtendTripModal}
  setShowExtendTripModal={setShowExtendTripModal}
  newEndDateTime={newEndDateTime}
  setNewEndDateTime={setNewEndDateTime}
  extendLoading={extendLoading}
  setExtendLoading={setExtendLoading}
          />
        ) : (
          <BookingListView
            bookings={bookings}
            searchQuery={searchQuery}
            setSearchQuery={handleSearchChange}
            handleClearSearch={handleClearSearch}
            loading={loading}
            isSearching={isSearching}
            refreshing={refreshing}
            error={error}
            currentPage={currentPage}
            setCurrentPage={handlePageChange}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            setPageSize={handlePageSizeChange}
            handleView={handleView}
            handleRefresh={handleRefresh}
            formatDate={formatDate}
            formatCurrency={formatCurrency}
            getStatusColor={getStatusColor}
            getPaymentMethodIcon={getPaymentMethodIcon}
            getCustomerDisplay={getCustomerDisplay}
            getCustomerPhone={getCustomerPhone}
            getVehicleNumber={getVehicleNumber}
            getVehicleDetails={getVehicleDetails}
            navigate={navigate}
          />
        )}
      </div>
    </div>
  );
};

// Booking List View Component (unchanged)
const BookingListView = ({
  bookings,
  searchQuery,
  setSearchQuery,
  handleClearSearch,
  loading,
  isSearching,
  refreshing,
  error,
  currentPage,
  setCurrentPage,
  totalPages,
  totalItems,
  pageSize,
  setPageSize,
  handleView,
  handleRefresh,
  formatDate,
  formatCurrency,
  getStatusColor,
  getPaymentMethodIcon,
  getCustomerDisplay,
  getCustomerPhone,
  getVehicleNumber,
  getVehicleDetails,
  navigate
}) => {
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
              All Bookings
            </h1>
            <p className="text-gray-500 text-xs">Manage and track all bike rentals</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/dashboard/createBooking')}
              className="flex items-center px-4 py-2 rounded-lg shadow-md transition-all bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold hover:shadow-lg"
            >
              <FaPlus className="mr-2" />
              Create Booking
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
              <div className="text-xs opacity-90">Total Bookings</div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
          <div className="flex items-start">
            <FaExclamationTriangle className="text-red-500 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-800 mb-1">Error Loading Bookings</h3>
              <p className="text-xs text-red-700 mb-2">
                {error.response?.data?.message || error.message || 'An unexpected error occurred'}
              </p>
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

      {/* Search & Page Size */}
      <div className="bg-white rounded-xl shadow-lg p-3">
        <div className="flex items-center justify-between space-x-4">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search by booking ID, customer name, phone, or vehicle number..."
              className="w-full pl-8 pr-20 py-1.5 border border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 transition-all text-sm"
              value={searchQuery}
              onChange={setSearchQuery}
            />
            {isSearching && (
              <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
              </div>
            )}
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full p-1 transition-colors"
                title="Clear search"
              >
                <FaTimes className="text-xs" />
              </button>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-xs text-gray-600 whitespace-nowrap">Items per page:</label>
            <select
              value={pageSize}
              onChange={setPageSize}
              className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200"
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
                <th className="px-3 py-2 text-left text-xs font-semibold">Booking ID</th>
                <th className="px-3 py-2 text-left text-xs font-semibold">Customer</th>
                <th className="px-3 py-2 text-left text-xs font-semibold">Vehicle</th>
                <th className="px-3 py-2 text-left text-xs font-semibold">Amount</th>
                <th className="px-3 py-2 text-left text-xs font-semibold">Status</th>
                <th className="px-3 py-2 text-left text-xs font-semibold">Date</th>
                <th className="px-3 py-2 text-center text-xs font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading || isSearching ? (
                <tr>
                  <td colSpan="7" className="text-center py-8">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-2"></div>
                      <p className="text-gray-500 text-sm">
                        {isSearching ? 'Searching bookings...' : 'Loading bookings...'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8">
                    <div className="flex flex-col items-center">
                      <FaMotorcycle className="text-gray-400 text-4xl mb-2" />
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">No bookings found</h3>
                      <p className="text-gray-500 text-xs">
                        {searchQuery ? `No results for "${searchQuery}"` : "No bookings available"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-indigo-50 transition-colors">
                    <td className="px-3 py-2">
                      <div className="font-semibold text-indigo-600 text-sm">
                        {booking.bookingId || `BK${booking.id}`}
                      </div>
                      <div className="text-xs text-gray-500">ID: {booking.id}</div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-medium text-gray-900 text-sm">
                        {getCustomerDisplay(booking)}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center">
                        <FaPhone className="mr-1 text-xs" />
                        {getCustomerPhone(booking)}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-medium text-gray-900 text-sm">
                        {getVehicleNumber(booking)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {getVehicleDetails(booking)}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-bold text-gray-900 text-sm">
                        {formatCurrency(booking.finalAmount || booking.totalRideFair || 0)}
                      </div>
                      <div className={`text-xs ${
                        booking.paymentStatus === 'PAID' ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {booking.paymentStatus || 'PENDING'}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r ${getStatusColor(booking.status)} text-white shadow-sm`}>
                        {booking.status || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="text-xs text-gray-900">
                        {new Date(booking.createdAt || booking.startDate || Date.now()).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() => handleView(booking)}
                        className="inline-flex items-center px-2 py-1 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded hover:from-indigo-700 hover:to-blue-700 transition-all shadow-sm text-xs"
                      >
                        <FaEye className="mr-1 text-xs" />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && !isSearching && bookings.length > 0 && totalPages > 1 && !searchQuery && (
          <div className="border-t border-gray-100 px-3 py-2 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-600">
                Showing <span className="font-semibold text-gray-900">{currentPage * pageSize + 1}</span> to{" "}
                <span className="font-semibold text-gray-900">
                  {Math.min((currentPage + 1) * pageSize, totalItems)}
                </span>{" "}
                of <span className="font-semibold text-gray-900">{totalItems}</span> bookings
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
    </div>
  );
};

// Booking Detail View Component - UPDATED ADDITIONAL CHARGES SECTION ONLY
const BookingDetailView = ({ 
  booking, onBack, formatDate, formatCurrency, getStatusColor, 
  getPaymentMethodIcon, refreshBookings, setBookings, navigate, 
  showEndTripKmModal, setShowEndTripKmModal, endTripKmValue, setEndTripKmValue,
  showExtendTripModal, setShowExtendTripModal, newEndDateTime, 
  setNewEndDateTime, extendLoading, setExtendLoading 
}) => {
  const [formData, setFormData] = useState({});
  const [additionalCharges, setAdditionalCharges] = useState([]);
  const [newCharge, setNewCharge] = useState({ type: 'Additional Charges', amount: '' });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSavingCharges, setIsSavingCharges] = useState(false);
  const [loadingCharges, setLoadingCharges] = useState(false);
  
  // ✅ DOCUMENT VERIFICATION STATES
  const [userDocuments, setUserDocuments] = useState(null);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [verifyingDocument, setVerifyingDocument] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [documentUpdating, setDocumentUpdating] = useState({});
  const [documentStatus, setDocumentStatus] = useState({
    aadharFrontSide: 'PENDING',
    aadharBackSide: 'PENDING',
    drivingLicense: 'PENDING',
  });
  // ✅ NEW: Fetch additional charges when booking changes
  useEffect(() => {
    if (booking?.id) {
      fetchAdditionalCharges(booking.id);
    }
  }, [booking?.id]);

  // ✅ NEW: Fetch charges from backend
  const fetchAdditionalCharges = async (bookingId) => {
    setLoadingCharges(true);
    try {
      console.log('🔍 Fetching additional charges for booking:', bookingId);
      const response = await additionalChargeAPI.getByBookingId(bookingId);
      const charges = response.data || [];
      
      const mappedCharges = charges.map(charge => ({
        id: charge.id,
        type: charge.chargeType,
        amount: parseFloat(charge.amount),
        savedToBackend: true
      }));
      
      setAdditionalCharges(mappedCharges);
      console.log('✅ Loaded', mappedCharges.length, 'additional charges');
    } catch (error) {
      console.error('❌ Error fetching additional charges:', error);
      if (error.response?.status !== 404) {
        toast.error('Failed to load additional charges');
      }
    } finally {
      setLoadingCharges(false);
    }
  };

  useEffect(() => {
    if (booking) {
      setFormData({
        bookingId: booking.bookingId || '',
        startDate: formatDate(booking.startDate),
        endDate: formatDate(booking.endDate),
        vehicleNumber: booking.bikeDetails?.registrationNumber || booking.vehicleNumber || '',
        customerName: booking.customerName || '',
        customerContact: booking.customerNumber || '',
        address: booking.address || '',
        addressType: booking.addressType || 'Self Pickup',
        rideFee: booking.charges || booking.rideFee || 0,
        lateFeeCharges: booking.lateFeeCharges || 0,
        gstFee: booking.gst || booking.gstFee || 0,
        refundableDeposit: booking.advanceAmount || booking.refundableDeposit || 0,
        totalRideFair: booking.finalAmount || booking.totalRideFair || 0,
        paymentMode: booking.paymentType === 2 ? 'ONLINE' : 'CASH',
        currentBookingStatus: booking.status || 'Confirmed',
        bookingStatus: booking.status || 'Accepted',
        startTripKm: booking.startTripKm || null,
        endTripKm: booking.endTripKm || null
      });

      if (booking.customerId) {
        fetchUserDocuments(booking.customerId);
      }
    }
  }, [booking]);

  const fetchUserDocuments = async (userId) => {
  if (!userId) return;
  
  setLoadingDocuments(true);
  try {
    console.log(`📥 Fetching documents for user ${userId}`);
    const response = await apiClient.get(`/api/documents/userdocuments/${userId}`);
    
    console.log('📄 Document API Response:', response.data);

    if (response.data) {
      const docs = {
        aadharFrontSide: response.data.adhaarFrontImageUrl || null,
        aadharBackSide: response.data.adhaarBackImageUrl || null,
        drivingLicense: response.data.drivingLicenseImageUrl || null,
        adhaarFrontStatus: response.data.adhaarFrontStatus || 'PENDING',
        adhaarBackStatus: response.data.adhaarBackStatus || 'PENDING',
        licenseStatus: response.data.licenseStatus || 'PENDING',
      };
      
      console.log('✅ Mapped documents:', docs);
      setUserDocuments(docs);
    }
  } catch (error) {
    console.error('❌ Error fetching documents:', error);
    console.error('Error response:', error.response?.data);
    
    if (error.response?.status !== 404) {
      toast.warning('Could not load customer documents');
    }
  } finally {
    setLoadingDocuments(false);
  }
};


// ✅ VERIFY/REJECT DOCUMENT HANDLER
// ✅ FIXED DOCUMENT VERIFICATION HANDLER
const handleDocumentAction = async (docType, action) => {
  if (!booking?.customerId) {
    toast.error("Invalid customer selected");
    return;
  }

  setDocumentUpdating(prev => ({ ...prev, [docType]: true }));

  try {
    const fieldMapping = {
      'aadharFrontSide': 'adhaarFrontStatus',
      'aadharBackSide': 'adhaarBackStatus',
      'drivingLicense': 'licenseStatus'
    };
    
    const backendFieldName = fieldMapping[docType];
    if (!backendFieldName) {
      throw new Error(`Invalid document type: ${docType}`);
    }

    const statusUpdates = { [backendFieldName]: action };

    console.log(`📤 Updating ${docType} to ${action} for user ${booking.customerId}`);
    console.log('Request payload:', statusUpdates);

    const response = await documentAPI.verify(booking.customerId, statusUpdates);

    if (response.status === 200) {
      console.log('✅ Backend updated successfully');

      // ✅ Update userDocuments state with new status
      setUserDocuments(prev => ({
        ...prev,
        [backendFieldName]: action  // Update the status field
      }));

      toast.success(`✅ Document ${action === 'VERIFIED' ? 'Verified' : 'Rejected'} successfully`);

      // ✅ Verify backend update after 1 second
      setTimeout(async () => {
        try {
          const verifyResponse = await apiClient.get(`/api/documents/userdocuments/${booking.customerId}`);
          
          if (verifyResponse.data) {
            setUserDocuments({
              aadharFrontSide: verifyResponse.data.adhaarFrontImageUrl || null,
              aadharBackSide: verifyResponse.data.adhaarBackImageUrl || null,
              drivingLicense: verifyResponse.data.drivingLicenseImageUrl || null,
              adhaarFrontStatus: verifyResponse.data.adhaarFrontStatus || 'PENDING',
              adhaarBackStatus: verifyResponse.data.adhaarBackStatus || 'PENDING',
              licenseStatus: verifyResponse.data.licenseStatus || 'PENDING',
            });
            
            console.log('✅ Confirmed status from backend:', verifyResponse.data);
          }
        } catch (err) {
          console.error('⚠️ Failed to verify update:', err);
        }
      }, 1500);

    } else {
      throw new Error("Failed to update document status");
    }
  } catch (error) {
    console.error("❌ Error updating document:", error);
    console.error("Error details:", error.response?.data);
    
    const errorMessage = error.response?.data?.message || error.message || 'Failed to update document verification';
    toast.error(`❌ ${errorMessage}`);
  } finally {
    setDocumentUpdating(prev => ({ ...prev, [docType]: false }));
  }
};


// ✅ IMAGE MODAL HANDLERS
// const openImageModal = (imageUrl, documentName) => {
//   setSelectedImage({ url: imageUrl, name: documentName });
// };

// const closeImageModal = () => {
//   setSelectedImage(null);
// };

// const getImageUrl = (imagePath) => {
//   if (!imagePath) return null;
//   if (imagePath.startsWith('http') || imagePath.startsWith('data:image')) return imagePath;
//   return `${BASE_URL}/${imagePath.replace(/^\/+/, '')}`;
// };


// ✅ COMPLETE - Proper validation and API call
const handleExtendTrip = async () => {
  // Step 1: Validate booking ID
  if (!booking?.id) {
    toast.error('❌ Booking ID not found');
    return;
  }
  
  // Step 2: Validate input is not empty
  if (!newEndDateTime || newEndDateTime.trim() === '') {
    toast.error('❌ Please select a new end date and time');
    return;
  }
  
  // Step 3: Validate date format
  const newDate = new Date(newEndDateTime);
  if (isNaN(newDate.getTime())) {
    toast.error('❌ Invalid date format');
    return;
  }
  
  // Step 4: Validate new date is after current end date
  const currentEndDate = new Date(formData.endDate);
  if (newDate <= currentEndDate) {
    toast.error('❌ New end time must be later than current end time');
    return;
  }
  
  setExtendLoading(true);
  try {
    console.log('⏱️ [Extend Trip] Starting extension process');
    console.log({
      bookingId: booking.id,
      currentEndDate: formData.endDate,
      newEndDateTime: newEndDateTime,
      epochMillis: newDate.getTime()
    });
    
    // ✅ Convert to epoch milliseconds (required by backend)
    const epochMillis = newDate.getTime();
    
    // ✅ Call API
    const response = await bookingAPI.extendTrip(booking.id, epochMillis);
    
    console.log('✅ [Extend Trip] API response:', response.data);
    
    // Update UI with new end date
    setFormData(prev => ({ 
      ...prev, 
      endDate: newEndDateTime 
    }));
    
    // Close modal and clear input
    setShowExtendTripModal(false);
    setNewEndDateTime('');
    
    // Show success message
    toast.success('✅ Trip extended successfully!');
    
    // Refresh bookings list after delay
    if (refreshBookings) {
      console.log('🔄 Refreshing bookings list...');
      setTimeout(() => {
        refreshBookings();
      }, 1000);
    }
    
  } catch (error) {
    console.error('❌ [Extend Trip] Error:', error);
    
    // Handle specific error responses
    if (error.response?.status === 409) { // CONFLICT
      const message = error.response?.data?.message || 'Trip cannot be extended at this time';
      toast.error(`⚠️ ${message}`);
    } else if (error.response?.status === 400) { // BAD REQUEST
      const message = error.response?.data?.message || 'Invalid request. Please try again.';
      toast.error(`❌ ${message}`);
    } else {
      const message = error.response?.data?.message 
        || error.message 
        || 'Failed to extend trip. Please try again.';
      toast.error(`❌ ${message}`);
    }
  } finally {
    setExtendLoading(false);
  }
};



const handleCloseExtendModal = () => {
  setShowExtendTripModal(false);
  setNewEndDateTime('');
};

  const handleDocumentVerification = async (documentType, status) => {
    if (!booking?.customerId) {
      toast.error('❌ User ID not found');
      return;
    }

    setVerifyingDocument(documentType);
    try {
      let adhaarFrontStatus = null;
      let adhaarBackStatus = null;
      let licenseStatus = null;

      if (documentType === 'adhaarFront') adhaarFrontStatus = status;
      if (documentType === 'adhaarBack') adhaarBackStatus = status;
      if (documentType === 'license') licenseStatus = status;

      await documentAPI.updateVerification(
        booking.customerId,
        adhaarFrontStatus,
        adhaarBackStatus,
        licenseStatus
      );

      setUserDocuments(prevDocs => ({
        ...prevDocs,
        [`${documentType}Status`]: status
      }));

      toast.success(`✅ Document ${status.toLowerCase()} successfully`);
      setTimeout(() => fetchUserDocuments(booking.customerId), 500);
    } catch (error) {
      console.error('❌ Error verifying document:', error);
      toast.error('❌ Failed to update verification status');
    } finally {
      setVerifyingDocument(null);
    }
  };

  const openImageModal = (imageUrl, documentName) => {
    setSelectedImage({ url: imageUrl, name: documentName });
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  const getVerificationBadge = (status) => {
    const badges = {
      'VERIFIED': { color: 'bg-green-500', text: '✅ Verified', icon: FaCheckCircle },
      'REJECTED': { color: 'bg-red-500', text: '❌ Rejected', icon: FaTimesCircle },
      'PENDING': { color: 'bg-orange-500', text: '⏳ Pending', icon: FaClock }
    };

    const badge = badges[status] || badges['PENDING'];
    const Icon = badge.icon;

    return (
      <div className={`${badge.color} text-white px-2 py-1 rounded text-xs font-medium flex items-center`}>
        <Icon className="mr-1" />
        {badge.text}
      </div>
    );
  };

  const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http') || imagePath.startsWith('data:image')) return imagePath;
  
  // ✅ Remove leading slashes and construct full URL
  const cleanPath = imagePath.replace(/^\/+/, '');
  return `${BASE_URL}/${cleanPath}`;
};
  // ✅ DOCUMENT CARD COMPONENT
const DocumentCard = ({ label, docType, imageData, status, updating }) => {
  const imageUrl = getImageUrl(imageData);
  const hasImage = imageUrl && imageUrl.trim() !== '';

    console.log(`[DocumentCard] ${label}:`, { imageData, imageUrl, hasImage });

  return (
    <div className="bg-white rounded-lg shadow-md border p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold text-gray-900">{label}</h3>
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
          status === 'VERIFIED' ? 'bg-green-100 text-green-700' :
          status === 'REJECTED' ? 'bg-red-100 text-red-700' :
          'bg-yellow-100 text-yellow-700'
        }`}>
          {status}
        </span>
      </div>

       <div 
        className={`w-full h-40 bg-gray-100 border-2 ${
          hasImage ? 'border-indigo-200 cursor-pointer' : 'border-gray-200'
        } flex items-center justify-center rounded-lg overflow-hidden`}
        onClick={() => hasImage && openImageModal(imageUrl, label)}
      >
        {hasImage ? (
          <img 
            src={imageUrl} 
            alt={label} 
            className="w-full h-full object-cover"
            crossOrigin="anonymous"
            onError={(e) => {
              console.error(`❌ Failed to load ${label}:`, imageUrl);
              e.target.style.display = 'none';
              e.target.parentNode.innerHTML = '<div class="text-center p-4"><FaExclamationTriangle class="text-red-500 text-3xl mx-auto mb-2" /><p class="text-red-500 text-xs">Failed to load</p></div>';
            }}
          />
        ) : (
          <div className="text-center">
            <FaFileAlt className="text-gray-300 text-3xl mx-auto mb-2" />
            <p className="text-gray-400 text-xs">No Document</p>
          </div>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={() => handleDocumentAction(docType, 'VERIFIED')}
          disabled={status === 'VERIFIED' || updating || !hasImage}
          className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold ${
            status === 'VERIFIED' || updating || !hasImage
              ? 'bg-green-200 text-green-600 cursor-not-allowed'
              : 'bg-green-500 text-white hover:bg-green-600'
          } flex items-center justify-center`}
        >
          {updating ? <div className="animate-spin h-3 w-3 border-2 border-white rounded-full border-t-transparent"></div> : <><FaCheckCircle className="mr-1" /> Verify</>}
        </button>

        <button
          onClick={() => handleDocumentAction(docType, 'REJECTED')}
          disabled={status === 'REJECTED' || updating || !hasImage}
          className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold ${
            status === 'REJECTED' || updating || !hasImage
              ? 'bg-red-200 text-red-600 cursor-not-allowed'
              : 'bg-red-500 text-white hover:bg-red-600'
          } flex items-center justify-center`}
        >
          {updating ? <div className="animate-spin h-3 w-3 border-2 border-white rounded-full border-t-transparent"></div> : <><FaTimesCircle className="mr-1" /> Reject</>}
        </button>
      </div>
    </div>
  );
};


  const TripImageCard = ({ imageUrl, index, label }) => {
    const hasImage = imageUrl && imageUrl.trim() !== '';

    return (
      <div className="text-center">
        <div 
          className={`w-full h-32 rounded-lg mb-2 flex items-center justify-center relative border-2 transition-all cursor-pointer ${
            hasImage 
              ? 'border-purple-400 hover:border-purple-600 bg-gray-50' 
              : 'border-dashed border-gray-300 bg-gray-100'
          }`}
          onClick={() => hasImage && openImageModal(imageUrl, `${label} - Image ${index + 1}`)}
        >
          {hasImage ? (
            <>
              <img 
                src={imageUrl} 
                alt={`${label} ${index + 1}`}
                className="max-h-full max-w-full object-contain rounded-lg"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23ddd"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999">No Image</text></svg>';
                }}
              />
              <div className="absolute top-2 right-2 bg-purple-500 text-white px-2 py-1 rounded text-xs font-medium">
                #{index + 1}
              </div>
              <div className="absolute bottom-2 left-2 bg-white bg-opacity-90 text-gray-800 px-2 py-1 rounded text-xs font-medium shadow">
                <FaEye className="inline mr-1" />
                Click to view
              </div>
            </>
          ) : (
            <div className="text-center">
              <FaCamera className="mx-auto text-gray-400 text-3xl mb-2" />
              <p className="text-gray-500 text-xs">No image</p>
            </div>
          )}
        </div>
        <p className="text-xs font-semibold text-gray-700">{label} - Image {index + 1}</p>
      </div>
    );
  };

  const handleInputChange = (field, value) => {
    if (field === 'bookingStatus') {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  // ✅ UPDATED: Add charge to local state with unsaved flag
  const handleAddMore = () => {
    if (newCharge.type !== 'Additional Charges' && newCharge.amount && !isNaN(parseFloat(newCharge.amount))) {
      const charge = {
        id: Date.now(),
        type: newCharge.type,
        amount: parseFloat(newCharge.amount),
        savedToBackend: false // Mark as unsaved
      };
      
      setAdditionalCharges(prev => [...prev, charge]);
      setNewCharge({ type: 'Additional Charges', amount: '' });
      
      toast.success(`✅ Added ${charge.type}: ₹${charge.amount}`);
    } else {
      if (newCharge.type === 'Additional Charges') {
        toast.error('❌ Please select a specific charge type');
      } else if (!newCharge.amount) {
        toast.error('❌ Please enter amount');
      } else {
        toast.error('❌ Please enter a valid amount');
      }
    }
  };

  // ✅ UPDATED: Remove charge (from backend if saved, or just from state)
  const handleRemoveCharge = async (chargeId, savedToBackend) => {
    const chargeToRemove = additionalCharges.find(charge => charge.id === chargeId);
    
    if (savedToBackend) {
      try {
        console.log('🗑️ Removing charge from backend:', chargeId);
        await additionalChargeAPI.remove(chargeId);
        toast.success(`🗑️ Removed ${chargeToRemove.type}: ₹${chargeToRemove.amount}`);
        
        await fetchAdditionalCharges(booking.id);
        
        if (refreshBookings) {
          refreshBookings();
        }
      } catch (error) {
        console.error('❌ Error removing charge:', error);
        toast.error('Failed to remove charge');
      }
    } else {
      setAdditionalCharges(prev => prev.filter(charge => charge.id !== chargeId));
      if (chargeToRemove) {
        toast.success(`🗑️ Removed ${chargeToRemove.type}: ₹${chargeToRemove.amount}`);
      }
    }
  };

  // ✅ UPDATED: Save charges to backend API
  const handleSaveCharges = async () => {
    const unsavedCharges = additionalCharges.filter(charge => !charge.savedToBackend);
    
    if (unsavedCharges.length === 0) {
      toast.info('ℹ️ All charges are already saved');
      return;
    }

    setIsSavingCharges(true);
    try {
      console.log('💾 Saving additional charges to backend:', unsavedCharges);
      
      const chargesType = unsavedCharges.map(charge => charge.type);
      const chargesAmount = unsavedCharges.map(charge => charge.amount);

      const response = await additionalChargeAPI.save(
        booking.id,
        chargesType,
        chargesAmount
      );

      console.log('✅ Backend response:', response.data);
      toast.success(`💾 Saved ${unsavedCharges.length} additional charge(s) successfully!`);
      
      await fetchAdditionalCharges(booking.id);
      
      if (refreshBookings) {
        setTimeout(() => {
          refreshBookings();
        }, 500);
      }

    } catch (error) {
      console.error('❌ Error saving additional charges:', error);
      
      if (error.response?.data?.message) {
        toast.error(`❌ ${error.response.data.message}`);
      } else {
        toast.error('❌ Failed to save additional charges');
      }
    } finally {
      setIsSavingCharges(false);
    }
  };

  const handleUpdateBookingDetails = async () => {
  if (!booking?.id) {
    toast.error('Booking ID not found');
    return;
  }

  if (formData.bookingStatus === formData.currentBookingStatus) {
    toast.info('Status is already up to date');
    return;
  }

  // ✅ Check if completing trip without endTripKm
  if (formData.bookingStatus === 'Completed' && !formData.endTripKm) {
    setShowEndTripKmModal(true);
    return;
  }

  setIsUpdating(true);
  
  try {
    console.log('Updating booking status', {
      bookingId: booking.id,
      newStatus: formData.bookingStatus,
      previousStatus: formData.currentBookingStatus,
      endTripKm: formData.endTripKm
    });

    let response;

    if (formData.bookingStatus === 'Accepted') {
      response = await bookingAPI.accept(booking.id);
    } else if (formData.bookingStatus === 'Cancelled') {
      response = await bookingAPI.cancel(booking.id);
    } else if (formData.bookingStatus === 'Completed') {
      // ✅ Pass endTripKm when completing
      response = await bookingAPI.complete(booking.id, formData.endTripKm);
    } else {
      toast.warning('Status update not implemented for this status');
      return;
    }

    setFormData(prev => ({ ...prev, currentBookingStatus: formData.bookingStatus }));
    
    toast.success(`Status changed from ${formData.currentBookingStatus} to ${formData.bookingStatus}`, {
      autoClose: 4000
    });

    if (refreshBookings) {
      setTimeout(() => { refreshBookings(); }, 1500);
    }

  } catch (error) {
    console.error('❌ Error updating booking status:', error);
    
    // ✅ Check if backend requires endTripKm
    if (error.response?.data?.requireEndTripKm === true) {
      toast.warning(error.response.data.message || 'End Trip KM is required');
      setShowEndTripKmModal(true);
      return;
    }
    
    if (error.response?.data?.message) {
      toast.error(error.response.data.message);
    } else {
      toast.error('Failed to update booking status');
    }
    
    setFormData(prev => ({ ...prev, bookingStatus: prev.currentBookingStatus }));
  } finally {
    setIsUpdating(false);
  }
};

// Add this new function after handleUpdateBookingDetails
const handleSubmitEndTripKm = async () => {
  console.log('🔴 handleSubmitEndTripKm called');
  console.log('📌 endTripKmValue from state:', endTripKmValue);
  
  const bookingId = booking?.id;
  
  if (!bookingId) {
    toast.error('Booking ID not found');
    return;
  }

  const kmValue = parseFloat(endTripKmValue);
  
  if (!kmValue || isNaN(kmValue) || kmValue <= 0) {
    toast.error('Please enter a valid End Trip KM value');
    return;
  }

  const startKm = formData?.startTripKm || 0;
  if (kmValue <= startKm) {
    toast.error(`End Trip KM must be greater than Start Trip KM (${startKm} km)`);
    return;
  }

  console.log('✅ Submitting with:');
  console.log('   - bookingId:', bookingId);
  console.log('   - kmValue:', kmValue);

  setIsUpdating(true);
  
  try {
    console.log('🚀 [DIRECT] Making direct API call with endTripKm:', kmValue);
    
    // ✅ Hardcoded URL - no import needed
   const baseUrl = import.meta.env.VITE_BASE_URL;
const url = `${baseUrl}/api/booking-bikes/${bookingId}/complete?endTripKm=${kmValue}`;
console.log('🚀 [ENV] URL:', url);

    
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
    });
    
    console.log('📥 [DIRECT] Response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ [DIRECT] Error:', errorData);
      throw new Error(errorData.message || 'Failed to complete trip');
    }
    
    const data = await response.json();
    console.log('✅ [DIRECT] Success:', data);
    
    setFormData(prev => ({
      ...prev,
      currentBookingStatus: 'Completed',
      bookingStatus: 'Completed',
      endTripKm: kmValue
    }));
    
    setShowEndTripKmModal(false);
    setEndTripKmValue('');
    
    toast.success('✅ Trip completed successfully!', { autoClose: 4000 });
    
    if (refreshBookings) {
      setTimeout(() => refreshBookings(), 1500);
    }
    
  } catch (error) {
    console.error('❌ [DIRECT] Error completing trip:', error);
    toast.error(error.message || 'Failed to complete trip');
  } finally {
    setIsUpdating(false);
  }
};



  const handleViewInvoice = () => {
    console.log('📄 Opening invoice for booking:', booking.id);
    
    navigate(`/dashboard/invoice/${booking.id}`, { 
      state: { 
        from: '/dashboard/allBookings',
        booking: booking 
      }
    });
  };

  const totalAdditionalCharges = additionalCharges.reduce((sum, charge) => sum + charge.amount, 0);
  const unsavedChargesCount = additionalCharges.filter(c => !c.savedToBackend).length;

  return (
  
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border">
        {/* Header with Back and Invoice buttons */}
        <div className="bg-white border-b px-3 py-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={onBack}
                className="flex items-center px-3 py-1.5 text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors text-sm font-medium"
              >
                <FaArrowLeft className="mr-2" />
                Back to List
              </button>
              <h1 className="text-base font-medium text-gray-900">View Booking Details</h1>
            </div>

            {(booking.status === 'Completed' || booking.bookingStatus === 5) && (
              <button
                onClick={handleViewInvoice}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-all shadow-md text-sm font-semibold"
              >
                <FaFileInvoice className="mr-2" />
                View Invoice
              </button>
            )}
          </div>
        </div>

        <div className="p-2">
          {/* Vehicle Image */}
          <div className="mb-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Vehicle Image</label>
            <div className="w-full h-16 bg-gray-50 border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
              <div className="text-center">
                <FaMotorcycle className="mx-auto text-gray-400 text-sm mb-0.5" />
                <p className="text-gray-500 text-xs">📷</p>
              </div>
            </div>
          </div>

          {/* Form Grid */}
          <div className="grid grid-cols-4 gap-2 mb-2">
            {/* Row 1 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Booking ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.bookingId}
                readOnly
                className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded bg-gray-50 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={formData.startDate}
                readOnly
                className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded bg-gray-50 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={formData.endDate}
                readOnly
                className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded bg-gray-50 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Vehicle Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.vehicleNumber}
                readOnly
                className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded bg-gray-50 cursor-not-allowed"
              />
            </div>

            {/* Row 2 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.customerName}
                readOnly
                className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded bg-gray-50 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Customer Contact <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.customerContact}
                readOnly
                className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded bg-gray-50 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Address</label>
              <input
                type="text"
                value={formData.address}
                readOnly
                className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded bg-gray-50 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Address Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.addressType}
                disabled
                className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded bg-gray-50 cursor-not-allowed"
              >
                <option value="Self Pickup">Self Pickup</option>
                <option value="Home Delivery">Home Delivery</option>
                <option value="Office Delivery">Office Delivery</option>
              </select>
            </div>

            {/* Row 3 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Ride Fee <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.rideFee}
                readOnly
                className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded bg-gray-50 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Late Fee Charges</label>
              <input
                type="number"
                value={formData.lateFeeCharges}
                readOnly
                className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded bg-gray-50 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                GST 5% <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.gstFee}
                readOnly
                className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded bg-gray-50 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Refundable Deposit <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.refundableDeposit}
                readOnly
                className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded bg-gray-50 cursor-not-allowed"
              />
            </div>

            {/* Row 4 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Total Ride Fair <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.totalRideFair}
                readOnly
                className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded bg-gray-50 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Payment Mode</label>
              <select
                value={formData.paymentMode}
                disabled
                className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded bg-gray-50 cursor-not-allowed"
              >
                <option value="CASH">CASH</option>
                <option value="ONLINE">ONLINE</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Current Status</label>
              <div className="px-1.5 py-1 bg-gray-100 border border-gray-300 rounded text-gray-900 text-xs">
                {formData.currentBookingStatus}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Booking Status <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.bookingStatus}
                onChange={(e) => handleInputChange('bookingStatus', e.target.value)}
                className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Confirmed">Confirmed</option>
                <option value="Accepted">Accepted</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          {/* EXTEND TRIP BUTTON - ADMIN ONLY */}
          {/* <div className="mb-3">
            {booking.status === 'On Going' || booking.status === 'Start Trip' ? (
              <button
                onClick={() => setShowExtendTripModal(true)}
                className="w-1/4 py-2 px-4 rounded-md text-sm font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center"
              >
                <FaClock className="mr-2" />
                Extend Trip
              </button>
            ) : (
              <div className="p-3 bg-gray-100 rounded-md border border-gray-300">
                <p className="text-xs text-gray-600 flex items-center">
                  <FaInfoCircle className="mr-1" />
                  Trip extension only available for ongoing or started trips
                </p>
              </div>
            )}
          </div>

          <div className="mb-3">
            <button
              onClick={handleUpdateBookingDetails}
              disabled={isUpdating || formData.bookingStatus === formData.currentBookingStatus}
              className={`w-1/4 py-2 px-4 rounded-md text-sm font-semibold transition-colors flex items-center justify-center ${
                formData.bookingStatus === formData.currentBookingStatus
                  ? 'bg-gray-400 cursor-not-allowed text-white'
                  : isUpdating
                  ? 'bg-blue-400 cursor-not-allowed text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
              }`}
            >
              {isUpdating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating Status...
                </>
              ) : formData.bookingStatus === formData.currentBookingStatus ? (
                <>
                  <FaCheckCircle className="mr-2" />
                  Status Up to Date
                </>
              ) : (
                <>
                  <FaEdit className="mr-2" />
                  Update Booking Status
                </>
              )}
            </button>
            
            {formData.bookingStatus !== formData.currentBookingStatus && !isUpdating && (
              <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded-md">
                <p className="text-xs text-orange-600 font-medium flex items-center">
                  <FaEdit className="mr-1" />
                  Status will change from "{formData.currentBookingStatus}" to "{formData.bookingStatus}"
                </p>
              </div>
            )}
          </div> */}

          {/* EXTEND TRIP & UPDATE STATUS - REDUCED WIDTH */}
<div className="mb-3 flex gap-3 items-stretch w-1/2">
  {/* EXTEND TRIP BUTTON */}
  {booking.status === 'On Going' || booking.status === 'Start Trip' ? (
    <button
      onClick={() => setShowExtendTripModal(true)}
      className="flex-1 py-2 px-4 rounded-md text-sm font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center"
    >
      <FaClock className="mr-2" />
      Extend Trip
    </button>
  ) : (
    <div className="flex-1 p-3 bg-gray-100 rounded-md border border-gray-300 flex items-center justify-center">
      <p className="text-xs text-gray-600 flex items-center">
        <FaInfoCircle className="mr-1" />
        Trip extension only available for ongoing or started trips
      </p>
    </div>
  )}

  {/* UPDATE BOOKING STATUS BUTTON */}
  <button
    onClick={handleUpdateBookingDetails}
    disabled={isUpdating || formData.bookingStatus === formData.currentBookingStatus}
    className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-colors flex items-center justify-center ${
      formData.bookingStatus === formData.currentBookingStatus
        ? 'bg-gray-400 cursor-not-allowed text-white'
        : isUpdating
        ? 'bg-blue-400 cursor-not-allowed text-white'
        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
    }`}
  >
    {isUpdating ? (
      <>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
        Updating Status...
      </>
    ) : formData.bookingStatus === formData.currentBookingStatus ? (
      <>
        <FaCheckCircle className="mr-2" />
        Status Up to Date
      </>
    ) : (
      <>
        <FaEdit className="mr-2" />
        Update Booking Status
      </>
    )}
  </button>
</div>

{/* STATUS CHANGE WARNING */}
{formData.bookingStatus !== formData.currentBookingStatus && !isUpdating && (
  <div className="p-2 bg-orange-50 border border-orange-200 rounded-md w-1/2">
    <p className="text-xs text-orange-600 font-medium flex items-center">
      <FaEdit className="mr-1" />
      Status will change from "{formData.currentBookingStatus}" to "{formData.bookingStatus}"
    </p>
  </div>
)}


          {/* ✅ UPDATED ADDITIONAL CHARGES SECTION */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-gray-700">
                Additional Charges
                {totalAdditionalCharges > 0 && (
                  <span className="ml-2 text-green-600 font-bold">
                    (Total: ₹{totalAdditionalCharges})
                  </span>
                )}
                {loadingCharges && (
                  <span className="ml-2 text-blue-600 text-xs">
                    <div className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                  </span>
                )}
              </label>
            </div>
            
            <div className="border border-gray-300 rounded-lg p-3 bg-gray-50">
              <div className="flex space-x-2 mb-3">
                <select 
                  value={newCharge.type}
                  onChange={(e) => setNewCharge(prev => ({ ...prev, type: e.target.value }))}
                  className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="Additional Charges">Select Charge Type</option>
                  <option value="Extra Charges">Extra Charges</option>
                  <option value="Damage Charges">Damage Charges</option>
                  <option value="challan">Challan</option>
                </select>
                <input 
                  type="number"
                  placeholder="Enter Amount" 
                  value={newCharge.amount}
                  onChange={(e) => setNewCharge(prev => ({ ...prev, amount: e.target.value }))}
                  className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  min="0"
                  step="0.01"
                />
                <button 
                  onClick={() => setNewCharge({ type: 'Additional Charges', amount: '' })}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center"
                  title="Clear fields"
                >
                  <FaTimes className="mr-1" />
                  Clear
                </button>
              </div>
              
              <div className="flex space-x-2 mb-3">
                <button
                  onClick={handleAddMore}
                  disabled={!newCharge.type || newCharge.type === 'Additional Charges' || !newCharge.amount}
                  className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center"
                >
                  <FaPlus className="mr-1" />
                  Add More
                </button>
                <button
                  onClick={handleSaveCharges}
                  disabled={unsavedChargesCount === 0 || isSavingCharges}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center"
                >
                  {isSavingCharges ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaSave className="mr-1" />
                      Save {unsavedChargesCount > 0 && `(${unsavedChargesCount})`}
                    </>
                  )}
                </button>
              </div>
              
              {additionalCharges.length > 0 && (
                <div className="space-y-2 border-t pt-3 mt-3">
                  <div className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
                    <FaFileAlt className="mr-1" />
                    Added Charges ({additionalCharges.length}):
                  </div>
                  {additionalCharges.map((charge, index) => (
                    <div 
                      key={charge.id} 
                      className={`flex justify-between items-center py-2 px-3 rounded-md border text-xs ${
                        charge.savedToBackend 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-yellow-50 border-yellow-200'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full font-medium text-xs ${
                          charge.savedToBackend
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          #{index + 1} {charge.savedToBackend ? '✅' : '⏳'}
                        </span>
                        <span className="font-medium text-gray-700">{charge.type}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="font-bold text-green-600">₹{charge.amount}</span>
                        <button 
                          onClick={() => handleRemoveCharge(charge.id, charge.savedToBackend)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-100 p-1 rounded-full font-bold transition-colors"
                          title="Remove charge"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="flex justify-between items-center py-2 px-3 bg-green-50 border border-green-200 rounded-md font-semibold text-sm">
                    <span className="text-green-700 flex items-center">
                      <FaMoneyBillWave className="mr-1" />
                      Total Additional Charges:
                    </span>
                    <span className="text-green-800 font-bold text-base">₹{totalAdditionalCharges}</span>
                  </div>
                </div>
              )}
              
              {additionalCharges.length === 0 && !loadingCharges && (
                <div className="text-center py-6 text-gray-500 text-xs bg-white rounded-md border-2 border-dashed border-gray-200">
                  <FaFileAlt className="mx-auto text-2xl mb-2 text-gray-400" />
                  No additional charges added yet
                </div>
              )}
              
              {loadingCharges && (
                <div className="text-center py-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-xs text-gray-600">Loading charges...</p>
                </div>
              )}
            </div>
          </div>

          {/* REST OF THE SECTIONS - UNCHANGED */}
          {/* START TRIP IMAGES SECTION */}
          {booking.startTripImages && booking.startTripImages.length > 0 && (
            <div className="border-t pt-3 mt-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-900 flex items-center">
                  <FaCamera className="mr-2 text-purple-600" />
                  Start Trip Images
                  <span className="ml-2 bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full text-xs font-medium">
                    {booking.startTripImages.length} Images
                  </span>
                </h2>
                {formData.startTripKm !== null && (
                  <div className="bg-purple-50 border border-purple-200 px-3 py-1 rounded-md">
                    <span className="text-xs text-purple-700 font-medium">
                      Start KM: <span className="font-bold">{formData.startTripKm} km</span>
                    </span>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-4 gap-4">
                {booking.startTripImages.map((imageUrl, index) => (
                  <TripImageCard
                    key={`start-${index}`}
                    imageUrl={imageUrl}
                    index={index}
                    label="Start Trip"
                  />
                ))}
              </div>
            </div>
          )}

          {/* END TRIP IMAGES SECTION */}
          {booking.endTripImages && booking.endTripImages.length > 0 && (
            <div className="border-t pt-3 mt-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-900 flex items-center">
                  <FaCamera className="mr-2 text-orange-600" />
                  End Trip Images
                  <span className="ml-2 bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full text-xs font-medium">
                    {booking.endTripImages.length} Images
                  </span>
                </h2>
                {formData.endTripKm !== null && (
                  <div className="bg-orange-50 border border-orange-200 px-3 py-1 rounded-md">
                    <span className="text-xs text-orange-700 font-medium">
                      End KM: <span className="font-bold">{formData.endTripKm} km</span>
                    </span>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-4 gap-4">
                {booking.endTripImages.map((imageUrl, index) => (
                  <TripImageCard
                    key={`end-${index}`}
                    imageUrl={imageUrl}
                    index={index}
                    label="End Trip"
                  />
                ))}
              </div>
            </div>
          )}

          {/* KM Details Summary */}
          {formData.startTripKm !== null && formData.endTripKm !== null && (
            <div className="border-t pt-3 mt-4">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center">
                  <FaMotorcycle className="mr-2" />
                  Trip Distance Summary
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-3 border border-blue-100">
                    <p className="text-xs text-gray-600 mb-1">Start KM</p>
                    <p className="text-lg font-bold text-purple-600">{formData.startTripKm} km</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-blue-100">
                    <p className="text-xs text-gray-600 mb-1">End KM</p>
                    <p className="text-lg font-bold text-orange-600">{formData.endTripKm} km</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-blue-100">
                    <p className="text-xs text-gray-600 mb-1">Total Distance</p>
                    <p className="text-lg font-bold text-green-600">
                      {(formData.endTripKm - formData.startTripKm).toFixed(2)} km
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* View Customer Documents Section */}
          {/* ✅ CUSTOMER DOCUMENT VERIFICATION SECTION */}
{/* ✅ CUSTOMER DOCUMENT VERIFICATION SECTION */}
<div className="border-t pt-3 mt-4">
  <div className="flex items-center space-x-3 mb-4">
    <div className="bg-indigo-100 p-3 rounded-xl">
      <FaIdCard className="text-indigo-600 text-xl" />
    </div>
    <div>
      <h2 className="text-sm font-bold text-gray-900">Customer Document Verification</h2>
      <p className="text-gray-500 text-xs">Review and verify customer documents</p>
    </div>
  </div>

  {loadingDocuments ? (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
      <p className="text-gray-600 text-sm">Loading documents...</p>
    </div>
  ) : userDocuments ? (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <DocumentCard
        label="Aadhar Front Side"
        docType="aadharFrontSide"
        imageData={userDocuments.aadharFrontSide}
        status={userDocuments.adhaarFrontStatus}
        updating={documentUpdating.aadharFrontSide}
      />
      <DocumentCard
        label="Aadhar Back Side"
        docType="aadharBackSide"
        imageData={userDocuments.aadharBackSide}
        status={userDocuments.adhaarBackStatus}
        updating={documentUpdating.aadharBackSide}
      />
      <DocumentCard
        label="Driving License"
        docType="drivingLicense"
        imageData={userDocuments.drivingLicense}
        status={userDocuments.licenseStatus}
        updating={documentUpdating.drivingLicense}
      />
    </div>
  ) : (
    <div className="text-center py-12">
      <FaExclamationTriangle className="text-yellow-500 text-4xl mx-auto mb-3" />
      <p className="text-gray-600">No documents available for this customer</p>
    </div>
  )}
</div>

{/* ✅ IMAGE PREVIEW MODAL */}
{selectedImage && (
  <div 
    className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
    onClick={closeImageModal}
  >
    <div 
      className="bg-white rounded-2xl max-w-5xl w-full" 
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-indigo-600 px-6 py-4 flex items-center justify-between rounded-t-2xl">
        <h3 className="text-lg font-semibold text-white">{selectedImage.name}</h3>
        <button 
          onClick={closeImageModal} 
          className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
        >
          <FaTimes size={20} />
        </button>
      </div>
      <div className="p-6 flex justify-center bg-gray-50">
        <img 
          src={selectedImage.url} 
          alt={selectedImage.name} 
          className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-lg"
          onError={(e) => {
            e.target.style.display = 'none';
            toast.error('Failed to load image');
          }}
        />
      </div>
    </div>
  </div>
)}


      {/* ✅ END TRIP KM MODAL */}
{showEndTripKmModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-4 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FaExclamationTriangle className="mr-2 text-2xl" />
            <h3 className="text-lg font-bold">End Trip KM Required</h3>
          </div>
          <button 
            onClick={() => {
              setShowEndTripKmModal(false);
              setEndTripKmValue('');
            }}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-6">
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-orange-800 flex items-center">
            <FaExclamationTriangle className="mr-2 text-orange-600" />
            Please enter the End Trip KM to complete this booking
          </p>
        </div>

        {formData.startTripKm && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700 font-medium">Start Trip KM:</span>
              <span className="text-lg font-bold text-blue-900">{formData.startTripKm} km</span>
            </div>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            End Trip KM <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            placeholder="Enter End Trip KM"
            value={endTripKmValue}
            onChange={(e) => setEndTripKmValue(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
            min={formData.startTripKm || 0}
            step="0.01"
            autoFocus
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSubmitEndTripKm();
              }
            }}
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.startTripKm 
              ? `Must be greater than ${formData.startTripKm} km`
              : 'Enter the odometer reading at trip end'}
          </p>
        </div>

        {endTripKmValue && formData.startTripKm && parseFloat(endTripKmValue) > parseFloat(formData.startTripKm) && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-green-700 font-medium">Total Distance:</span>
              <span className="text-lg font-bold text-green-900">
                {(parseFloat(endTripKmValue) - parseFloat(formData.startTripKm)).toFixed(2)} km
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex justify-end space-x-3">
        <button
          onClick={() => {
            setShowEndTripKmModal(false);
            setEndTripKmValue('');
            setFormData(prev => ({ ...prev, bookingStatus: prev.currentBookingStatus }));
          }}
          className="px-5 py-2.5 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors text-sm"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmitEndTripKm}
          disabled={!endTripKmValue || isNaN(parseFloat(endTripKmValue)) || parseFloat(endTripKmValue) <= 0}
          className="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all text-sm flex items-center shadow-md"
        >
          <FaCheckCircle className="mr-2" />
          Complete Trip
        </button>
      </div>
    </div>
  </div>
)}

{/* ✅ EXTEND TRIP MODAL */}
{showExtendTripModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FaClock className="mr-2 text-2xl" />
            <h3 className="text-lg font-bold">Extend Trip</h3>
          </div>
          {/*<button 
            onClick={() => {
              setShowExtendTripModal(false);
              setNewEndDateTime('');
            }}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <FaTimes className="text-xl" />
          </button>*/}
          <button 
  onClick={handleCloseExtendModal}
  className="text-white hover:text-gray-200 transition-colors"
>
  <FaTimes className="text-xl" />
</button>

        </div>
      </div>

      {/* Body */}
      <div className="p-6">
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-purple-800 flex items-center">
            <FaClock className="mr-2 text-purple-600" />
            Select a new end date and time to extend this trip
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Current End Time
          </label>
          <input
            type="datetime-local"
            value={formData.endDate}
            disabled
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed text-sm"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            New End Time <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            value={newEndDateTime}
            onChange={(e) => setNewEndDateTime(e.target.value)}
            min={formData.endDate}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
            autoFocus
          />
          <p className="text-xs text-gray-500 mt-1">
            Must be later than current end time
          </p>
        </div>

        {newEndDateTime && formData.endDate && (() => {
          const currentEnd = new Date(formData.endDate);
          const newEnd = new Date(newEndDateTime);
          const diffMinutes = Math.round((newEnd - currentEnd) / 60000);
          const hours = Math.floor(diffMinutes / 60);
          const mins = diffMinutes % 60;
          
          return (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-700 font-medium">Extension Duration:</span>
                <span className="text-lg font-bold text-green-900">
                  {hours}h {mins}m
                </span>
              </div>
            </div>
          );
        })()}
      </div>

    {/* Footer */}{/* Extend Trip Modal Footer */}
      <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex justify-end space-x-3">
        <button
          onClick={handleCloseExtendModal}
          className="px-5 py-2.5 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors text-sm"
        >
          Cancel
        </button>
        <button
          onClick={handleExtendTrip}
          disabled={!newEndDateTime || extendLoading}
          className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all text-sm flex items-center shadow-md"
        >
          {extendLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Extending...
            </>
          ) : (
            <>
              <FaClock className="mr-2" />
              Extend Trip
            </>
          )}
        </button>
           </div>
    </div>
  </div>
)}

      </div>  
    </div>   
    </div>
  );
};

export default AllBookings;

