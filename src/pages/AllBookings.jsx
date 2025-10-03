// AllBookings.jsx - PROFESSIONAL DESIGN WITH COMPLETE BACKEND INTEGRATION

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { 
  FaEye, FaMapMarkerAlt, FaMotorcycle, FaCreditCard, FaCalendarAlt,
  FaUser, FaPhone, FaHashtag, FaClock, FaMoneyBillWave, FaShieldAlt,
  FaSearch, FaArrowLeft, FaCheckCircle, FaTimesCircle
} from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import apiClient, { BASE_URL } from '../api/apiConfig';

const AllBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [viewMode, setViewMode] = useState(false);

  // Fetch all bookings
  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      console.log('📋 Fetching all bookings...');
      
      const response = await apiClient.get('/api/booking-bikes/allBooking');
      const bookingsData = Array.isArray(response.data) ? response.data : [];
      
      console.log('✅ Bookings fetched:', bookingsData.length);
      console.log('📦 Sample booking:', bookingsData[0]);
      
      setBookings(bookingsData);
      setTotalPages(Math.ceil(bookingsData.length / itemsPerPage));
    } catch (error) {
      console.error('❌ Error fetching bookings:', error);
      toast.error('Failed to load bookings');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [itemsPerPage]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Filter bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) =>
      booking.bookingId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.customerNumber?.includes(searchQuery) ||
      booking.bikeDetails?.registrationNumber?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [bookings, searchQuery]);

  // Paginated data
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentBookings = useMemo(
    () => filteredBookings.slice(indexOfFirstItem, indexOfLastItem),
    [filteredBookings, indexOfFirstItem, indexOfLastItem]
  );

  // Handle view booking details
  const handleView = async (booking) => {
    console.log('👁️ Viewing booking:', booking.id);
    
    try {
      setLoading(true);
      
      // Fetch full booking details
      const response = await apiClient.get(`/api/booking-bikes/getById/${booking.id}`);
      const fullBooking = response.data;
      
      console.log('✅ Full booking data:', fullBooking);
      
      setSelectedBooking(fullBooking);
      setViewMode(true);
    } catch (error) {
      console.error('❌ Error fetching booking details:', error);
      toast.error('Failed to load booking details');
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
      'Confirmed': 'from-blue-500 to-cyan-500',
      'Booking Accepted': 'from-green-500 to-emerald-500',
      'Trip Started': 'from-yellow-500 to-amber-500',
      'End Trip': 'from-orange-500 to-red-500',
      'Completed': 'from-emerald-500 to-green-600',
      'Cancelled': 'from-red-500 to-rose-600',
    };
    return statusMap[status] || 'from-gray-500 to-slate-500';
  };

  const getPaymentMethodIcon = (type) => {
    return type === 2 ? '💳 Online' : '💵 Cash';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 px-4">
      <ToastContainer position="top-right" />
      
      <div className="max-w-7xl mx-auto">
        {viewMode && selectedBooking ? (
          <BookingDetailView
            booking={selectedBooking}
            onBack={handleBack}
            formatDate={formatDate}
            formatCurrency={formatCurrency}
            getStatusColor={getStatusColor}
            getPaymentMethodIcon={getPaymentMethodIcon}
          />
        ) : (
          <BookingListView
            bookings={currentBookings}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            loading={loading}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalPages={totalPages}
            filteredBookings={filteredBookings}
            indexOfFirstItem={indexOfFirstItem}
            indexOfLastItem={indexOfLastItem}
            handleView={handleView}
            formatDate={formatDate}
            formatCurrency={formatCurrency}
            getStatusColor={getStatusColor}
            getPaymentMethodIcon={getPaymentMethodIcon}
          />
        )}
      </div>
    </div>
  );
};

// ✅ Booking Detail View Component
const BookingDetailView = ({ booking, onBack, formatDate, formatCurrency, getStatusColor, getPaymentMethodIcon }) => {
  const InfoCard = ({ icon, label, value, colorClass = "text-indigo-600" }) => (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-4 shadow-sm hover:shadow-md transition-all border border-gray-100">
      <div className="flex items-start space-x-3">
        <div className={`${colorClass} mt-1`}>{icon}</div>
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="text-sm font-semibold text-gray-900 mt-1 break-words">{value || 'N/A'}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl shadow-2xl p-8 text-white">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-all backdrop-blur-sm"
          >
            <FaArrowLeft />
            <span>Back to List</span>
          </button>
          
          <div className={`px-4 py-2 rounded-full bg-gradient-to-r ${getStatusColor(booking.status)} text-white font-semibold shadow-lg`}>
            {booking.status}
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Booking Details</h1>
            <p className="text-white/80 text-lg">ID: {booking.bookingId}</p>
          </div>
          <div className="text-right">
            <p className="text-white/80 text-sm mb-1">Total Amount</p>
            <p className="text-4xl font-bold">{formatCurrency(booking.finalAmount)}</p>
          </div>
        </div>
      </div>

      {/* Customer & Bike Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Info Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-indigo-100 p-3 rounded-xl">
              <FaUser className="text-indigo-600 text-2xl" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Customer Details</h2>
              <p className="text-gray-500 text-sm">Contact & Location</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoCard 
              icon={<FaUser size={18} />}
              label="Name"
              value={booking.customerName || `Customer #${booking.customerId}`}
              colorClass="text-indigo-600"
            />
            <InfoCard 
              icon={<FaPhone size={18} />}
              label="Phone"
              value={booking.customerNumber}
              colorClass="text-green-600"
            />
            <InfoCard 
              icon={<FaMapMarkerAlt size={18} />}
              label="Address Type"
              value={booking.addressType}
              colorClass="text-red-600"
            />
            <InfoCard 
              icon={<FaMapMarkerAlt size={18} />}
              label="Delivery Location"
              value={booking.address}
              colorClass="text-purple-600"
            />
          </div>
        </div>

        {/* Bike Details Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-blue-100 p-3 rounded-xl">
              <FaMotorcycle className="text-blue-600 text-2xl" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Vehicle Details</h2>
              <p className="text-gray-500 text-sm">Bike Information</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoCard 
              icon={<FaHashtag size={18} />}
              label="Registration Number"
              value={booking.bikeDetails?.registrationNumber}
              colorClass="text-blue-600"
            />
            <InfoCard 
              icon={<FaMotorcycle size={18} />}
              label="Chassis Number"
              value={booking.bikeDetails?.chassisNumber}
              colorClass="text-cyan-600"
            />
            <InfoCard 
              icon={<FaHashtag size={18} />}
              label="Engine Number"
              value={booking.bikeDetails?.engineNumber}
              colorClass="text-indigo-600"
            />
            <InfoCard 
              icon={<FaMoneyBillWave size={18} />}
              label="Bike Price"
              value={formatCurrency(booking.bikeDetails?.price)}
              colorClass="text-green-600"
            />
          </div>

          {/* Document Status */}
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Document Status</p>
            <div className="flex flex-wrap gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                booking.bikeDetails?.insurance ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {booking.bikeDetails?.insurance ? <FaCheckCircle className="inline mr-1" /> : <FaTimesCircle className="inline mr-1" />}
                Insurance
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                booking.bikeDetails?.puc ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {booking.bikeDetails?.puc ? <FaCheckCircle className="inline mr-1" /> : <FaTimesCircle className="inline mr-1" />}
                PUC
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                booking.bikeDetails?.documents ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {booking.bikeDetails?.documents ? <FaCheckCircle className="inline mr-1" /> : <FaTimesCircle className="inline mr-1" />}
                Documents
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Timeline */}
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-purple-100 p-3 rounded-xl">
            <FaCalendarAlt className="text-purple-600 text-2xl" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Booking Timeline</h2>
            <p className="text-gray-500 text-sm">Rental Period & Duration</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InfoCard 
            icon={<FaCalendarAlt size={18} />}
            label="Start Date"
            value={formatDate(booking.startDate)}
            colorClass="text-green-600"
          />
          <InfoCard 
            icon={<FaCalendarAlt size={18} />}
            label="End Date"
            value={formatDate(booking.endDate)}
            colorClass="text-red-600"
          />
          <InfoCard 
            icon={<FaClock size={18} />}
            label="Total Hours"
            value={`${booking.totalHours || 0} hours`}
            colorClass="text-blue-600"
          />
        </div>
      </div>

      {/* Payment & Charges */}
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-green-100 p-3 rounded-xl">
            <FaMoneyBillWave className="text-green-600 text-2xl" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Payment Details</h2>
            <p className="text-gray-500 text-sm">Charges & Breakdown</p>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center py-3 border-b">
            <span className="text-gray-600">Base Charges</span>
            <span className="font-semibold text-gray-900">{formatCurrency(booking.charges)}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b">
            <span className="text-gray-600">Advance Amount</span>
            <span className="font-semibold text-gray-900">{formatCurrency(booking.advanceAmount)}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b">
            <span className="text-gray-600">GST</span>
            <span className="font-semibold text-gray-900">{formatCurrency(booking.gst)}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b">
            <span className="text-gray-600">Delivery Charges</span>
            <span className="font-semibold text-gray-900">{formatCurrency(booking.deliveryCharges)}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b">
            <span className="text-gray-600">Additional Charges</span>
            <span className="font-semibold text-gray-900">{formatCurrency(booking.additionalCharges)}</span>
          </div>
          {booking.couponAmount > 0 && (
            <div className="flex justify-between items-center py-3 border-b">
              <span className="text-green-600">Coupon Discount ({booking.couponCode})</span>
              <span className="font-semibold text-green-600">-{formatCurrency(booking.couponAmount)}</span>
            </div>
          )}
          <div className="flex justify-between items-center py-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl px-4 mt-4">
            <span className="text-lg font-bold text-gray-900">Final Amount</span>
            <span className="text-2xl font-bold text-indigo-600">{formatCurrency(booking.finalAmount)}</span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`p-4 rounded-xl ${
            booking.paymentStatus === 'PAID' ? 'bg-green-50 border-2 border-green-200' : 'bg-yellow-50 border-2 border-yellow-200'
          }`}>
            <p className="text-sm text-gray-600 mb-1">Payment Status</p>
            <p className={`text-lg font-bold ${
              booking.paymentStatus === 'PAID' ? 'text-green-700' : 'text-yellow-700'
            }`}>
              {booking.paymentStatus}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-blue-50 border-2 border-blue-200">
            <p className="text-sm text-gray-600 mb-1">Payment Method</p>
            <p className="text-lg font-bold text-blue-700">
              {getPaymentMethodIcon(booking.paymentType)}
            </p>
          </div>
        </div>
      </div>

      {/* Metadata */}
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Additional Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InfoCard 
            icon={<FaCalendarAlt size={18} />}
            label="Created At"
            value={formatDate(booking.createdAt)}
            colorClass="text-gray-600"
          />
          <InfoCard 
            icon={<FaCalendarAlt size={18} />}
            label="Updated At"
            value={formatDate(booking.updatedAt)}
            colorClass="text-gray-600"
          />
          <InfoCard 
            icon={<FaHashtag size={18} />}
            label="Booking ID"
            value={`#${booking.id}`}
            colorClass="text-indigo-600"
          />
        </div>
      </div>
    </div>
  );
};

// ✅ Booking List View Component
const BookingListView = ({
  bookings,
  searchQuery,
  setSearchQuery,
  loading,
  currentPage,
  setCurrentPage,
  totalPages,
  filteredBookings,
  indexOfFirstItem,
  indexOfLastItem,
  handleView,
  formatDate,
  formatCurrency,
  getStatusColor,
  getPaymentMethodIcon
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
              All Bookings
            </h1>
            <p className="text-gray-500 mt-1">Manage and track all bike rentals</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white px-6 py-3 rounded-xl shadow-lg">
              <div className="text-2xl font-bold">{filteredBookings.length}</div>
              <div className="text-xs opacity-90">Total Bookings</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="relative">
          <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by booking ID, customer name, phone, or vehicle number..."
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
                <th className="px-6 py-4 text-left text-sm font-semibold">Booking ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Customer</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Vehicle</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Amount</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Date</th>
                <th className="px-6 py-4 text-center text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-16">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                      <p className="text-gray-500 font-medium">Loading bookings...</p>
                    </div>
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-16">
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <FaMotorcycle className="text-gray-400 text-3xl" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings found</h3>
                      <p className="text-gray-500">
                        {searchQuery ? `No results for "${searchQuery}"` : "No bookings available"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-indigo-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-indigo-600">{booking.bookingId}</div>
                      <div className="text-xs text-gray-500">ID: {booking.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {booking.customerName || `Customer #${booking.customerId}`}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <FaPhone className="mr-1 text-xs" />
                        {booking.customerNumber || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {booking.bikeDetails?.registrationNumber || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500">
                        ID: {booking.vehicleId}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{formatCurrency(booking.finalAmount)}</div>
                      <div className={`text-xs ${
                        booking.paymentStatus === 'PAID' ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {booking.paymentStatus}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r ${getStatusColor(booking.status)} text-white shadow-sm`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{formatDate(booking.createdAt)}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleView(booking)}
                        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:from-indigo-700 hover:to-blue-700 transition-all shadow-sm hover:shadow-md"
                      >
                        <FaEye className="mr-2" />
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
        {!loading && bookings.length > 0 && totalPages > 1 && (
          <div className="border-t border-gray-100 px-6 py-4 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing <span className="font-semibold text-gray-900">{indexOfFirstItem + 1}</span> to{" "}
                <span className="font-semibold text-gray-900">
                  {Math.min(indexOfLastItem, filteredBookings.length)}
                </span>{" "}
                of <span className="font-semibold text-gray-900">{filteredBookings.length}</span> bookings
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                
                <span className="px-4 py-2 text-sm font-medium text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllBookings;
