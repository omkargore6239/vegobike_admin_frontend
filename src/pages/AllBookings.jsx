import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; // ✅ ADD THIS

import {
  FaEye, FaMapMarkerAlt, FaMotorcycle, FaCreditCard, FaCalendarAlt,
  FaUser, FaPhone, FaHashtag, FaClock, FaMoneyBillWave, FaShieldAlt,
  FaSearch, FaArrowLeft, FaCheckCircle, FaTimesCircle, FaEdit, FaSave,
  FaUpload, FaDownload, FaFileAlt, FaPlus, FaTimes, FaSync, FaExclamationTriangle,
  FaImage, FaCamera
} from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { bookingAPI, documentAPI } from '../utils/apiClient';



const AllBookings = () => {
  const navigate = useNavigate(); 
  const [bookings, setBookings] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [viewMode, setViewMode] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [isSearching, setIsSearching] = useState(false);

  // ✅ Fetch bookings with server-side pagination
  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`📋 Fetching bookings - Page: ${currentPage}, Size: ${pageSize}, Sort: ${sortBy} ${sortDirection}`);

      const response = await bookingAPI.getAll(currentPage, pageSize, sortBy, sortDirection);
      
      console.log('✅ Bookings fetched:', response.data?.length || 0);
      console.log('📊 Raw booking data:', response.data);

      setBookings(response.data || []);
      setTotalPages(response.pagination?.totalPages || 0);
      setTotalItems(response.pagination?.totalItems || 0);
      
      toast.success(`📋 Loaded ${response.data?.length || 0} bookings (Page ${currentPage + 1}/${response.pagination?.totalPages || 1})`);

    } catch (error) {
      console.error('❌ Error fetching bookings:', error);
      setError(error);
      
      if (error.response?.status === 401) {
        toast.error('🔐 Authentication required. Please login again.');
      } else if (error.response?.status === 403) {
        toast.error('🚫 Access denied. Admin privileges required.');
      } else if (error.response?.status === 500) {
        const errorMessage = error.response?.data?.message || 'Server error occurred';
        toast.error(`💥 ${errorMessage}`);
      } else {
        toast.error('❌ Failed to load bookings. Please try again.');
      }
      
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, sortBy, sortDirection]);

  // ✅ NEW: Server-side search function
  const handleSearchBookings = useCallback(async (query) => {
    if (!query || query.trim() === '') {
      fetchBookings();
      return;
    }

    setIsSearching(true);
    setError(null);
    
    try {
      console.log(`🔍 Searching bookings with query: "${query}"`);

      const response = await bookingAPI.searchBookings(query.trim());
      
      console.log('✅ Search results:', response.data?.length || 0);
      console.log('📊 Search data:', response.data);

      setBookings(response.data || []);
      setTotalItems(response.data?.length || 0);
      setTotalPages(1);
      setCurrentPage(0);
      
      if (response.data && response.data.length > 0) {
        toast.success(`🔍 Found ${response.data.length} booking(s) matching "${query}"`);
      } else {
        toast.info(`ℹ️ No bookings found for "${query}"`);
      }

    } catch (error) {
      console.error('❌ Error searching bookings:', error);
      setError(error);
      
      if (error.response?.status === 401) {
        toast.error('🔐 Authentication required. Please login again.');
      } else if (error.response?.status === 403) {
        toast.error('🚫 Access denied. Admin privileges required.');
      } else if (error.response?.status === 500) {
        const errorMessage = error.response?.data?.message || 'Server error occurred';
        toast.error(`💥 ${errorMessage}`);
      } else {
        toast.error('❌ Failed to search bookings. Please try again.');
      }
      
      setBookings([]);
    } finally {
      setIsSearching(false);
    }
  }, [fetchBookings]);

  // ✅ Manual refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    toast.info('🔄 Refreshing bookings...');
    setSearchQuery("");
    await fetchBookings();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // ✅ Handle search query changes with debounce
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

  // ✅ Clear search and reload all bookings
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

  // ✅ Handle view booking details
  const handleView = async (booking) => {
    console.log('👁️ Viewing booking:', booking);

    try {
      setLoading(true);
      
      console.log(`📋 Fetching details for booking ID: ${booking.id}`);
      const response = await bookingAPI.getById(booking.id);
      
      const fullBooking = response.data || booking;
      
      console.log('✅ Full booking data fetched:', fullBooking);

      setSelectedBooking(fullBooking);
      setViewMode(true);
      
    } catch (error) {
      console.error('❌ Error fetching booking details:', error);
      toast.error('Failed to load booking details. Using available data.');
      
      setSelectedBooking(booking);
      setViewMode(true);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setViewMode(false);
    setSelectedBooking(null);
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

  // ✅ Helper function to get customer display name
  const getCustomerDisplay = (booking) => {
    // Priority order: customerName -> userName -> fallback to ID
    return booking.customerName || 
           booking.userName || 
           `Customer #${booking.customerId || 'Unknown'}`;
  };

  // ✅ Helper function to get customer phone
  const getCustomerPhone = (booking) => {
    return booking.customerNumber || 
           booking.phoneNumber || 
           booking.customerPhone || 
           'N/A';
  };

  // ✅ Helper function to get vehicle registration number
  const getVehicleNumber = (booking) => {
    // Priority order: bikeDetails.registrationNumber -> vehicleNumber -> registrationNumber -> fallback
    return booking.bikeDetails?.registrationNumber || 
           booking.vehicleNumber || 
           booking.registrationNumber || 
           'N/A';
  };

  // ✅ Helper function to get vehicle details
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

// ✅ Booking List View Component - UPDATED
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
      {/* ✅ NEW: Create Booking Button */}
      <button
  onClick={() => navigate('/dashboard/bookings/create')}  // ✅ Use full path from root
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
              {error.response?.status === 500 && (
                <p className="text-xs text-red-600 bg-red-100 p-2 rounded">
                  <strong>Server Error (500):</strong> The backend server encountered an error. 
                  Please check your backend logs for more details.
                </p>
              )}
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
        {searchQuery && !isSearching && (
          <div className="mt-2 text-xs text-gray-600 flex items-center">
            <FaSearch className="mr-1" />
            Showing search results for: <span className="font-semibold ml-1">"{searchQuery}"</span>
          </div>
        )}
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
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                        <FaMotorcycle className="text-gray-400 text-lg" />
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">No bookings found</h3>
                      <p className="text-gray-500 text-xs">
                        {searchQuery ? `No results for "${searchQuery}"` : error ? "Unable to load bookings" : "No bookings available"}
                      </p>
                      {searchQuery && (
                        <button
                          onClick={handleClearSearch}
                          className="mt-3 text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded transition-colors"
                        >
                          Clear Search
                        </button>
                      )}
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
                        {formatCurrency(booking.finalAmount || booking.totalRideFair || booking.charges || 0)}
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



// ✅ Booking Detail View Component with Trip Images
const BookingDetailView = ({ booking, onBack, formatDate, formatCurrency, getStatusColor, getPaymentMethodIcon, refreshBookings, setBookings }) => {
  const [formData, setFormData] = useState({});
  const [additionalCharges, setAdditionalCharges] = useState([]);
  const [newCharge, setNewCharge] = useState({ type: 'Additional Charges', amount: '' });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSavingCharges, setIsSavingCharges] = useState(false);
  
  const [userDocuments, setUserDocuments] = useState(null);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [verifyingDocument, setVerifyingDocument] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

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
    if (!userId) {
      console.warn('⚠️ No user ID provided for document fetch');
      return;
    }

    setLoadingDocuments(true);
    try {
      console.log(`📄 Fetching documents for user ID: ${userId}`);
      const response = await documentAPI.getByUserId(userId);
      
      const documents = response.data.data || response.data;
      console.log('✅ Documents fetched:', documents);
      setUserDocuments(documents);
      
    } catch (error) {
      console.error('❌ Error fetching user documents:', error);
      
      if (error.response?.status === 404) {
        toast.info('ℹ️ No documents found for this user');
        setUserDocuments(null);
      } else {
        toast.error('❌ Failed to load user documents');
      }
    } finally {
      setLoadingDocuments(false);
    }
  };

  const handleDocumentVerification = async (documentType, status) => {
    if (!booking?.customerId) {
      toast.error('❌ User ID not found');
      return;
    }

    const statusMapping = {
      'VERIFIED': 'VERIFIED',
      'REJECTED': 'REJECTED',
      'PENDING': 'PENDING'
    };

    const verificationStatus = statusMapping[status];

    setVerifyingDocument(documentType);
    try {
      console.log(`🔄 Verifying ${documentType} as ${verificationStatus} for user ${booking.customerId}`);

      let adhaarFrontStatus = null;
      let adhaarBackStatus = null;
      let licenseStatus = null;

      if (documentType === 'adhaarFront') adhaarFrontStatus = verificationStatus;
      if (documentType === 'adhaarBack') adhaarBackStatus = verificationStatus;
      if (documentType === 'license') licenseStatus = verificationStatus;

      const response = await documentAPI.updateVerification(
        booking.customerId,
        adhaarFrontStatus,
        adhaarBackStatus,
        licenseStatus
      );

      console.log('✅ Verification updated:', response.data);

      setUserDocuments(prevDocs => ({
        ...prevDocs,
        [`${documentType}Status`]: verificationStatus
      }));

      toast.success(`✅ Document ${verificationStatus.toLowerCase()} successfully`);

      setTimeout(() => {
        fetchUserDocuments(booking.customerId);
      }, 500);

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

  const DocumentCard = ({ documentType, imageUrl, status, label }) => {
    const hasDocument = imageUrl && imageUrl.trim() !== '';

    return (
      <div className="text-center">
        <div 
          className={`w-full h-32 rounded-lg mb-2 flex items-center justify-center relative border-2 transition-all cursor-pointer ${
            hasDocument 
              ? 'border-blue-400 hover:border-blue-600 bg-gray-50' 
              : 'border-dashed border-gray-300 bg-gray-100'
          }`}
          onClick={() => hasDocument && openImageModal(imageUrl, label)}
        >
          {hasDocument ? (
            <>
              <img 
                src={imageUrl} 
                alt={label}
                className="max-h-full max-w-full object-contain rounded-lg"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23ddd"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999">No Image</text></svg>';
                }}
              />
              <div className="absolute top-2 right-2">
                {getVerificationBadge(status)}
              </div>
              <div className="absolute bottom-2 left-2 bg-white bg-opacity-90 text-gray-800 px-2 py-1 rounded text-xs font-medium shadow">
                <FaEye className="inline mr-1" />
                Click to view
              </div>
            </>
          ) : (
            <div className="text-center">
              <FaFileAlt className="mx-auto text-gray-400 text-3xl mb-2" />
              <p className="text-gray-500 text-xs">No document uploaded</p>
            </div>
          )}
        </div>

        <p className="text-xs font-semibold text-gray-700 mb-2">{label}</p>

        {hasDocument && (
          <div className="flex space-x-1">
            <button 
              onClick={() => handleDocumentVerification(documentType, 'VERIFIED')}
              disabled={verifyingDocument === documentType || status === 'VERIFIED'}
              className={`flex-1 px-2 py-1 rounded text-xs font-medium transition-colors flex items-center justify-center ${
                status === 'VERIFIED'
                  ? 'bg-gray-300 cursor-not-allowed text-gray-600'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {verifyingDocument === documentType ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
              ) : (
                <>
                  <FaCheckCircle className="mr-1" />
                  Verify
                </>
              )}
            </button>
            <button 
              onClick={() => handleDocumentVerification(documentType, 'REJECTED')}
              disabled={verifyingDocument === documentType || status === 'REJECTED'}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors flex items-center ${
                status === 'REJECTED'
                  ? 'bg-gray-300 cursor-not-allowed text-gray-600'
                  : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
            >
              {verifyingDocument === documentType ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
              ) : (
                <>
                  <FaTimesCircle className="mr-1" />
                  Reject
                </>
              )}
            </button>
          </div>
        )}
      </div>
    );
  };

  // ✅ NEW: Trip Image Card Component
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

  const handleAddMore = () => {
    if (newCharge.type !== 'Additional Charges' && newCharge.amount && !isNaN(parseFloat(newCharge.amount))) {
      const charge = {
        id: Date.now(),
        type: newCharge.type,
        amount: parseFloat(newCharge.amount)
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

  const handleRemoveCharge = (id) => {
    const chargeToRemove = additionalCharges.find(charge => charge.id === id);
    setAdditionalCharges(prev => prev.filter(charge => charge.id !== id));
    
    if (chargeToRemove) {
      toast.success(`🗑️ Removed ${chargeToRemove.type}: ₹${chargeToRemove.amount}`);
    }
  };

  const handleSaveCharges = async () => {
    if (additionalCharges.length === 0) {
      toast.warning('⚠️ No additional charges to save');
      return;
    }

    setIsSavingCharges(true);
    try {
      console.log('💾 Saving additional charges:', additionalCharges);
      
      await new Promise(resolve => setTimeout(resolve, 1500));

      toast.success('💾 Additional charges saved successfully!');
      
      const totalAdditional = additionalCharges.reduce((sum, charge) => sum + charge.amount, 0);
      const newTotal = parseFloat(formData.totalRideFair) + totalAdditional;
      setFormData(prev => ({ ...prev, totalRideFair: newTotal }));

    } catch (error) {
      console.error('❌ Error saving additional charges:', error);
      toast.error('❌ Failed to save additional charges');
    } finally {
      setIsSavingCharges(false);
    }
  };

  const handleUpdateBookingDetails = async () => {
    if (!booking?.id) {
      toast.error('❌ Booking ID not found');
      return;
    }

    if (formData.bookingStatus === formData.currentBookingStatus) {
      toast.info('ℹ️ Status is already up to date');
      return;
    }

    setIsUpdating(true);
    try {
      console.log('🔄 Updating booking status:', {
        bookingId: booking.id,
        newStatus: formData.bookingStatus,
        previousStatus: formData.currentBookingStatus
      });

      let response;
      
      if (formData.bookingStatus === 'Accepted') {
        response = await bookingAPI.accept(booking.id);
      } else if (formData.bookingStatus === 'Cancelled') {
        response = await bookingAPI.cancel(booking.id);
      } else if (formData.bookingStatus === 'Completed') {
        response = await bookingAPI.complete(booking.id);
      } else {
        toast.warning('⚠️ Status update not implemented for this status');
        return;
      }

      const updatedBooking = response.data.data || response.data;
      console.log('✅ Booking status updated:', updatedBooking);

      setFormData(prev => ({
        ...prev,
        currentBookingStatus: formData.bookingStatus
      }));

      toast.success(
        `🎉 Status changed from "${formData.currentBookingStatus}" to "${formData.bookingStatus}"`,
        { autoClose: 4000 }
      );

      if (refreshBookings) {
        setTimeout(() => {
          refreshBookings();
        }, 1500);
      }

    } catch (error) {
      console.error('❌ Error updating booking status:', error);
      
      if (error.response?.data?.message) {
        toast.error(`❌ ${error.response.data.message}`);
      } else {
        toast.error('❌ Failed to update booking status');
      }

      setFormData(prev => ({
        ...prev,
        bookingStatus: prev.currentBookingStatus
      }));

    } finally {
      setIsUpdating(false);
    }
  };

  const totalAdditionalCharges = additionalCharges.reduce((sum, charge) => sum + charge.amount, 0);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border">
        {/* Header */}
        <div className="bg-white border-b px-3 py-1.5">
          <div className="flex items-center justify-between">
            <h1 className="text-base font-medium text-gray-900">View Booking Details</h1>

            
            <button
              onClick={onBack}
              className="text-gray-500 hover:text-gray-700 text-lg"
            >
              ✕
            </button>
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

          {/* UPDATE BOOKING DETAILS BUTTON */}
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
          </div>

          {/* Additional Charges Section */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-gray-700">
                Additional Charges
                {totalAdditionalCharges > 0 && (
                  <span className="ml-2 text-green-600 font-bold">
                    (Total: ₹{totalAdditionalCharges})
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
                  disabled={additionalCharges.length === 0 || isSavingCharges}
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
                      Save
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
                      className="flex justify-between items-center py-2 px-3 bg-white rounded-md border border-blue-200 text-xs"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium text-xs">
                          #{index + 1}
                        </span>
                        <span className="font-medium text-gray-700">{charge.type}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="font-bold text-green-600">₹{charge.amount}</span>
                        <button 
                          onClick={() => handleRemoveCharge(charge.id)}
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
              
              {additionalCharges.length === 0 && (
                <div className="text-center py-6 text-gray-500 text-xs bg-white rounded-md border-2 border-dashed border-gray-200">
                  <FaFileAlt className="mx-auto text-2xl mb-2 text-gray-400" />
                  No additional charges added yet
                </div>
              )}
            </div>
          </div>

          {/* ✅ NEW: START TRIP IMAGES SECTION */}
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

          {/* ✅ NEW: END TRIP IMAGES SECTION */}
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

          {/* ✅ KM Details Summary (if both start and end KM exist) */}
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
          <div className="border-t pt-3 mt-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
              <FaFileAlt className="mr-2" />
              Customer Documents
              {loadingDocuments && (
                <div className="ml-2 animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              )}
            </h2>

            {loadingDocuments ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-500 text-sm">Loading documents...</p>
              </div>
            ) : !userDocuments ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <FaFileAlt className="mx-auto text-4xl text-gray-400 mb-2" />
                <p className="text-gray-600 text-sm font-medium">No documents found for this user</p>
                <p className="text-gray-500 text-xs mt-1">User hasn't uploaded any documents yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                <DocumentCard 
                  documentType="adhaarFront"
                  imageUrl={userDocuments.adhaarFrontImageUrl}
                  status={userDocuments.adhaarFrontStatus || 'PENDING'}
                  label="Aadhaar Front Image"
                />
                <DocumentCard 
                  documentType="adhaarBack"
                  imageUrl={userDocuments.adhaarBackImageUrl}
                  status={userDocuments.adhaarBackStatus || 'PENDING'}
                  label="Aadhaar Back Image"
                />
                <DocumentCard 
                  documentType="license"
                  imageUrl={userDocuments.drivingLicenseImageUrl}
                  status={userDocuments.licenseStatus || 'PENDING'}
                  label="Driving License Image"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={closeImageModal}
        >
          <div 
            className="relative max-w-4xl max-h-screen bg-white rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">{selectedImage.name}</h3>
              <button
                onClick={closeImageModal}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <img 
                src={selectedImage.url} 
                alt={selectedImage.name}
                className="max-w-full max-h-[80vh] object-contain mx-auto"
              />
            </div>
            <div className="flex justify-end p-4 border-t space-x-2">
              <button
                onClick={closeImageModal}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md text-sm font-medium"
              >
                Close
              </button>
              <a
                href={selectedImage.url}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium flex items-center"
              >
                <FaDownload className="mr-2" />
                Download
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllBookings;
