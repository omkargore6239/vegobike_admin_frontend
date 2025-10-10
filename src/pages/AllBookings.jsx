// // AllBookings.jsx - PROFESSIONAL DESIGN WITH COMPLETE BACKEND INTEGRATION

// import React, { useEffect, useState, useMemo, useCallback } from 'react';
// import { 
//   FaEye, FaMapMarkerAlt, FaMotorcycle, FaCreditCard, FaCalendarAlt,
//   FaUser, FaPhone, FaHashtag, FaClock, FaMoneyBillWave, FaShieldAlt,
//   FaSearch, FaArrowLeft, FaCheckCircle, FaTimesCircle
// } from "react-icons/fa";
// import { toast, ToastContainer } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import apiClient, { BASE_URL } from '../api/apiConfig';

// const AllBookings = () => {
//   const [bookings, setBookings] = useState([]);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [currentPage, setCurrentPage] = useState(1);
//   const [loading, setLoading] = useState(true);
//   const [itemsPerPage] = useState(10);
//   const [totalPages, setTotalPages] = useState(1);
//   const [selectedBooking, setSelectedBooking] = useState(null);
//   const [viewMode, setViewMode] = useState(false);

//   // Fetch all bookings
//   const fetchBookings = useCallback(async () => {
//     setLoading(true);
//     try {
//       console.log('📋 Fetching all bookings...');
      
//       const response = await apiClient.get('/api/booking-bikes/allBooking');
//       const bookingsData = Array.isArray(response.data) ? response.data : [];
      
//       console.log('✅ Bookings fetched:', bookingsData.length);
//       console.log('📦 Sample booking:', bookingsData[0]);
      
//       setBookings(bookingsData);
//       setTotalPages(Math.ceil(bookingsData.length / itemsPerPage));
//     } catch (error) {
//       console.error('❌ Error fetching bookings:', error);
//       toast.error('Failed to load bookings');
//       setBookings([]);
//     } finally {
//       setLoading(false);
//     }
//   }, [itemsPerPage]);

//   useEffect(() => {
//     fetchBookings();
//   }, [fetchBookings]);

//   // Filter bookings
//   const filteredBookings = useMemo(() => {
//     return bookings.filter((booking) =>
//       booking.bookingId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       booking.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       booking.customerNumber?.includes(searchQuery) ||
//       booking.bikeDetails?.registrationNumber?.toLowerCase().includes(searchQuery.toLowerCase())
//     );
//   }, [bookings, searchQuery]);

//   // Paginated data
//   const indexOfLastItem = currentPage * itemsPerPage;
//   const indexOfFirstItem = indexOfLastItem - itemsPerPage;
//   const currentBookings = useMemo(
//     () => filteredBookings.slice(indexOfFirstItem, indexOfLastItem),
//     [filteredBookings, indexOfFirstItem, indexOfLastItem]
//   );

//   // Handle view booking details
//   const handleView = async (booking) => {
//     console.log('👁️ Viewing booking:', booking.id);
    
//     try {
//       setLoading(true);
      
//       // Fetch full booking details
//       const response = await apiClient.get(`/api/booking-bikes/getById/${booking.id}`);
//       const fullBooking = response.data;
      
//       console.log('✅ Full booking data:', fullBooking);
      
//       setSelectedBooking(fullBooking);
//       setViewMode(true);
//     } catch (error) {
//       console.error('❌ Error fetching booking details:', error);
//       toast.error('Failed to load booking details');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleBack = () => {
//     setViewMode(false);
//     setSelectedBooking(null);
//   };

//   const getStatusColor = (status) => {
//     const statusMap = {
//       'Confirmed': 'from-blue-500 to-cyan-500',
//       'Booking Accepted': 'from-green-500 to-emerald-500',
//       'Trip Started': 'from-yellow-500 to-amber-500',
//       'End Trip': 'from-orange-500 to-red-500',
//       'Completed': 'from-emerald-500 to-green-600',
//       'Cancelled': 'from-red-500 to-rose-600',
//     };
//     return statusMap[status] || 'from-gray-500 to-slate-500';
//   };

//   const getPaymentMethodIcon = (type) => {
//     return type === 2 ? '💳 Online' : '💵 Cash';
//   };

//   const formatDate = (dateString) => {
//     if (!dateString) return 'N/A';
//     try {
//       return new Date(dateString).toLocaleDateString('en-IN', {
//         day: '2-digit',
//         month: 'short',
//         year: 'numeric',
//         hour: '2-digit',
//         minute: '2-digit'
//       });
//     } catch {
//       return 'N/A';
//     }
//   };

//   const formatCurrency = (amount) => {
//     return new Intl.NumberFormat('en-IN', {
//       style: 'currency',
//       currency: 'INR',
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0
//     }).format(amount || 0);
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 px-4">
//       <ToastContainer position="top-right" />
      
//       <div className="max-w-7xl mx-auto">
//         {viewMode && selectedBooking ? (
//           <BookingDetailView
//             booking={selectedBooking}
//             onBack={handleBack}
//             formatDate={formatDate}
//             formatCurrency={formatCurrency}
//             getStatusColor={getStatusColor}
//             getPaymentMethodIcon={getPaymentMethodIcon}
//           />
//         ) : (
//           <BookingListView
//             bookings={currentBookings}
//             searchQuery={searchQuery}
//             setSearchQuery={setSearchQuery}
//             loading={loading}
//             currentPage={currentPage}
//             setCurrentPage={setCurrentPage}
//             totalPages={totalPages}
//             filteredBookings={filteredBookings}
//             indexOfFirstItem={indexOfFirstItem}
//             indexOfLastItem={indexOfLastItem}
//             handleView={handleView}
//             formatDate={formatDate}
//             formatCurrency={formatCurrency}
//             getStatusColor={getStatusColor}
//             getPaymentMethodIcon={getPaymentMethodIcon}
//           />
//         )}
//       </div>
//     </div>
//   );
// };

// // ✅ Booking Detail View Component
// const BookingDetailView = ({ booking, onBack, formatDate, formatCurrency, getStatusColor, getPaymentMethodIcon }) => {
//   const InfoCard = ({ icon, label, value, colorClass = "text-indigo-600" }) => (
//     <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-4 shadow-sm hover:shadow-md transition-all border border-gray-100">
//       <div className="flex items-start space-x-3">
//         <div className={`${colorClass} mt-1`}>{icon}</div>
//         <div className="flex-1">
//           <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
//           <p className="text-sm font-semibold text-gray-900 mt-1 break-words">{value || 'N/A'}</p>
//         </div>
//       </div>
//     </div>
//   );

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl shadow-2xl p-8 text-white">
//         <div className="flex items-center justify-between mb-6">
//           <button
//             onClick={onBack}
//             className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-all backdrop-blur-sm"
//           >
//             <FaArrowLeft />
//             <span>Back to List</span>
//           </button>
          
//           <div className={`px-4 py-2 rounded-full bg-gradient-to-r ${getStatusColor(booking.status)} text-white font-semibold shadow-lg`}>
//             {booking.status}
//           </div>
//         </div>
        
//         <div className="flex items-center justify-between">
//           <div>
//             <h1 className="text-3xl font-bold mb-2">Booking Details</h1>
//             <p className="text-white/80 text-lg">ID: {booking.bookingId}</p>
//           </div>
//           <div className="text-right">
//             <p className="text-white/80 text-sm mb-1">Total Amount</p>
//             <p className="text-4xl font-bold">{formatCurrency(booking.finalAmount)}</p>
//           </div>
//         </div>
//       </div>

//       {/* Customer & Bike Details */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         {/* Customer Info Card */}
//         <div className="bg-white rounded-2xl shadow-xl p-6">
//           <div className="flex items-center space-x-3 mb-6">
//             <div className="bg-indigo-100 p-3 rounded-xl">
//               <FaUser className="text-indigo-600 text-2xl" />
//             </div>
//             <div>
//               <h2 className="text-xl font-bold text-gray-900">Customer Details</h2>
//               <p className="text-gray-500 text-sm">Contact & Location</p>
//             </div>
//           </div>
          
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <InfoCard 
//               icon={<FaUser size={18} />}
//               label="Name"
//               value={booking.customerName || `Customer #${booking.customerId}`}
//               colorClass="text-indigo-600"
//             />
//             <InfoCard 
//               icon={<FaPhone size={18} />}
//               label="Phone"
//               value={booking.customerNumber}
//               colorClass="text-green-600"
//             />
//             <InfoCard 
//               icon={<FaMapMarkerAlt size={18} />}
//               label="Address Type"
//               value={booking.addressType}
//               colorClass="text-red-600"
//             />
//             <InfoCard 
//               icon={<FaMapMarkerAlt size={18} />}
//               label="Delivery Location"
//               value={booking.address}
//               colorClass="text-purple-600"
//             />
//           </div>
//         </div>

//         {/* Bike Details Card */}
//         <div className="bg-white rounded-2xl shadow-xl p-6">
//           <div className="flex items-center space-x-3 mb-6">
//             <div className="bg-blue-100 p-3 rounded-xl">
//               <FaMotorcycle className="text-blue-600 text-2xl" />
//             </div>
//             <div>
//               <h2 className="text-xl font-bold text-gray-900">Vehicle Details</h2>
//               <p className="text-gray-500 text-sm">Bike Information</p>
//             </div>
//           </div>
          
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <InfoCard 
//               icon={<FaHashtag size={18} />}
//               label="Registration Number"
//               value={booking.bikeDetails?.registrationNumber}
//               colorClass="text-blue-600"
//             />
//             <InfoCard 
//               icon={<FaMotorcycle size={18} />}
//               label="Chassis Number"
//               value={booking.bikeDetails?.chassisNumber}
//               colorClass="text-cyan-600"
//             />
//             <InfoCard 
//               icon={<FaHashtag size={18} />}
//               label="Engine Number"
//               value={booking.bikeDetails?.engineNumber}
//               colorClass="text-indigo-600"
//             />
//             <InfoCard 
//               icon={<FaMoneyBillWave size={18} />}
//               label="Bike Price"
//               value={formatCurrency(booking.bikeDetails?.price)}
//               colorClass="text-green-600"
//             />
//           </div>

//           {/* Document Status */}
//           <div className="mt-4 pt-4 border-t">
//             <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Document Status</p>
//             <div className="flex flex-wrap gap-2">
//               <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
//                 booking.bikeDetails?.insurance ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
//               }`}>
//                 {booking.bikeDetails?.insurance ? <FaCheckCircle className="inline mr-1" /> : <FaTimesCircle className="inline mr-1" />}
//                 Insurance
//               </span>
//               <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
//                 booking.bikeDetails?.puc ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
//               }`}>
//                 {booking.bikeDetails?.puc ? <FaCheckCircle className="inline mr-1" /> : <FaTimesCircle className="inline mr-1" />}
//                 PUC
//               </span>
//               <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
//                 booking.bikeDetails?.documents ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
//               }`}>
//                 {booking.bikeDetails?.documents ? <FaCheckCircle className="inline mr-1" /> : <FaTimesCircle className="inline mr-1" />}
//                 Documents
//               </span>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Booking Timeline */}
//       <div className="bg-white rounded-2xl shadow-xl p-6">
//         <div className="flex items-center space-x-3 mb-6">
//           <div className="bg-purple-100 p-3 rounded-xl">
//             <FaCalendarAlt className="text-purple-600 text-2xl" />
//           </div>
//           <div>
//             <h2 className="text-xl font-bold text-gray-900">Booking Timeline</h2>
//             <p className="text-gray-500 text-sm">Rental Period & Duration</p>
//           </div>
//         </div>
        
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//           <InfoCard 
//             icon={<FaCalendarAlt size={18} />}
//             label="Start Date"
//             value={formatDate(booking.startDate)}
//             colorClass="text-green-600"
//           />
//           <InfoCard 
//             icon={<FaCalendarAlt size={18} />}
//             label="End Date"
//             value={formatDate(booking.endDate)}
//             colorClass="text-red-600"
//           />
//           <InfoCard 
//             icon={<FaClock size={18} />}
//             label="Total Hours"
//             value={`${booking.totalHours || 0} hours`}
//             colorClass="text-blue-600"
//           />
//         </div>
//       </div>

//       {/* Payment & Charges */}
//       <div className="bg-white rounded-2xl shadow-xl p-6">
//         <div className="flex items-center space-x-3 mb-6">
//           <div className="bg-green-100 p-3 rounded-xl">
//             <FaMoneyBillWave className="text-green-600 text-2xl" />
//           </div>
//           <div>
//             <h2 className="text-xl font-bold text-gray-900">Payment Details</h2>
//             <p className="text-gray-500 text-sm">Charges & Breakdown</p>
//           </div>
//         </div>
        
//         <div className="space-y-3">
//           <div className="flex justify-between items-center py-3 border-b">
//             <span className="text-gray-600">Base Charges</span>
//             <span className="font-semibold text-gray-900">{formatCurrency(booking.charges)}</span>
//           </div>
//           <div className="flex justify-between items-center py-3 border-b">
//             <span className="text-gray-600">Advance Amount</span>
//             <span className="font-semibold text-gray-900">{formatCurrency(booking.advanceAmount)}</span>
//           </div>
//           <div className="flex justify-between items-center py-3 border-b">
//             <span className="text-gray-600">GST</span>
//             <span className="font-semibold text-gray-900">{formatCurrency(booking.gst)}</span>
//           </div>
//           <div className="flex justify-between items-center py-3 border-b">
//             <span className="text-gray-600">Delivery Charges</span>
//             <span className="font-semibold text-gray-900">{formatCurrency(booking.deliveryCharges)}</span>
//           </div>
//           <div className="flex justify-between items-center py-3 border-b">
//             <span className="text-gray-600">Additional Charges</span>
//             <span className="font-semibold text-gray-900">{formatCurrency(booking.additionalCharges)}</span>
//           </div>
//           {booking.couponAmount > 0 && (
//             <div className="flex justify-between items-center py-3 border-b">
//               <span className="text-green-600">Coupon Discount ({booking.couponCode})</span>
//               <span className="font-semibold text-green-600">-{formatCurrency(booking.couponAmount)}</span>
//             </div>
//           )}
//           <div className="flex justify-between items-center py-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl px-4 mt-4">
//             <span className="text-lg font-bold text-gray-900">Final Amount</span>
//             <span className="text-2xl font-bold text-indigo-600">{formatCurrency(booking.finalAmount)}</span>
//           </div>
//         </div>

//         <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
//           <div className={`p-4 rounded-xl ${
//             booking.paymentStatus === 'PAID' ? 'bg-green-50 border-2 border-green-200' : 'bg-yellow-50 border-2 border-yellow-200'
//           }`}>
//             <p className="text-sm text-gray-600 mb-1">Payment Status</p>
//             <p className={`text-lg font-bold ${
//               booking.paymentStatus === 'PAID' ? 'text-green-700' : 'text-yellow-700'
//             }`}>
//               {booking.paymentStatus}
//             </p>
//           </div>
//           <div className="p-4 rounded-xl bg-blue-50 border-2 border-blue-200">
//             <p className="text-sm text-gray-600 mb-1">Payment Method</p>
//             <p className="text-lg font-bold text-blue-700">
//               {getPaymentMethodIcon(booking.paymentType)}
//             </p>
//           </div>
//         </div>
//       </div>

//       {/* Metadata */}
//       <div className="bg-white rounded-2xl shadow-xl p-6">
//         <h2 className="text-xl font-bold text-gray-900 mb-4">Additional Information</h2>
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//           <InfoCard 
//             icon={<FaCalendarAlt size={18} />}
//             label="Created At"
//             value={formatDate(booking.createdAt)}
//             colorClass="text-gray-600"
//           />
//           <InfoCard 
//             icon={<FaCalendarAlt size={18} />}
//             label="Updated At"
//             value={formatDate(booking.updatedAt)}
//             colorClass="text-gray-600"
//           />
//           <InfoCard 
//             icon={<FaHashtag size={18} />}
//             label="Booking ID"
//             value={`#${booking.id}`}
//             colorClass="text-indigo-600"
//           />
//         </div>
//       </div>
//     </div>
//   );
// };

// // ✅ Booking List View Component
// const BookingListView = ({
//   bookings,
//   searchQuery,
//   setSearchQuery,
//   loading,
//   currentPage,
//   setCurrentPage,
//   totalPages,
//   filteredBookings,
//   indexOfFirstItem,
//   indexOfLastItem,
//   handleView,
//   formatDate,
//   formatCurrency,
//   getStatusColor,
//   getPaymentMethodIcon
// }) => {
//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="bg-white rounded-2xl shadow-xl p-6">
//         <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
//           <div>
//             <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
//               All Bookings
//             </h1>
//             <p className="text-gray-500 mt-1">Manage and track all bike rentals</p>
//           </div>
          
//           <div className="flex items-center space-x-4">
//             <div className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white px-6 py-3 rounded-xl shadow-lg">
//               <div className="text-2xl font-bold">{filteredBookings.length}</div>
//               <div className="text-xs opacity-90">Total Bookings</div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Search */}
//       <div className="bg-white rounded-2xl shadow-lg p-6">
//         <div className="relative">
//           <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
//           <input
//             type="text"
//             placeholder="Search by booking ID, customer name, phone, or vehicle number..."
//             className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//           />
//         </div>
//       </div>

//       {/* Bookings Table */}
//       <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="w-full">
//             <thead>
//               <tr className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
//                 <th className="px-6 py-4 text-left text-sm font-semibold">Booking ID</th>
//                 <th className="px-6 py-4 text-left text-sm font-semibold">Customer</th>
//                 <th className="px-6 py-4 text-left text-sm font-semibold">Vehicle</th>
//                 <th className="px-6 py-4 text-left text-sm font-semibold">Amount</th>
//                 <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
//                 <th className="px-6 py-4 text-left text-sm font-semibold">Date</th>
//                 <th className="px-6 py-4 text-center text-sm font-semibold">Actions</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-gray-100">
//               {loading ? (
//                 <tr>
//                   <td colSpan="7" className="text-center py-16">
//                     <div className="flex flex-col items-center">
//                       <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
//                       <p className="text-gray-500 font-medium">Loading bookings...</p>
//                     </div>
//                   </td>
//                 </tr>
//               ) : bookings.length === 0 ? (
//                 <tr>
//                   <td colSpan="7" className="text-center py-16">
//                     <div className="flex flex-col items-center">
//                       <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
//                         <FaMotorcycle className="text-gray-400 text-3xl" />
//                       </div>
//                       <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings found</h3>
//                       <p className="text-gray-500">
//                         {searchQuery ? `No results for "${searchQuery}"` : "No bookings available"}
//                       </p>
//                     </div>
//                   </td>
//                 </tr>
//               ) : (
//                 bookings.map((booking) => (
//                   <tr key={booking.id} className="hover:bg-indigo-50 transition-colors">
//                     <td className="px-6 py-4">
//                       <div className="font-semibold text-indigo-600">{booking.bookingId}</div>
//                       <div className="text-xs text-gray-500">ID: {booking.id}</div>
//                     </td>
//                     <td className="px-6 py-4">
//                       <div className="font-medium text-gray-900">
//                         {booking.customerName || `Customer #${booking.customerId}`}
//                       </div>
//                       <div className="text-sm text-gray-500 flex items-center">
//                         <FaPhone className="mr-1 text-xs" />
//                         {booking.customerNumber || 'N/A'}
//                       </div>
//                     </td>
//                     <td className="px-6 py-4">
//                       <div className="font-medium text-gray-900">
//                         {booking.bikeDetails?.registrationNumber || 'N/A'}
//                       </div>
//                       <div className="text-xs text-gray-500">
//                         ID: {booking.vehicleId}
//                       </div>
//                     </td>
//                     <td className="px-6 py-4">
//                       <div className="font-bold text-gray-900">{formatCurrency(booking.finalAmount)}</div>
//                       <div className={`text-xs ${
//                         booking.paymentStatus === 'PAID' ? 'text-green-600' : 'text-yellow-600'
//                       }`}>
//                         {booking.paymentStatus}
//                       </div>
//                     </td>
//                     <td className="px-6 py-4">
//                       <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r ${getStatusColor(booking.status)} text-white shadow-sm`}>
//                         {booking.status}
//                       </span>
//                     </td>
//                     <td className="px-6 py-4">
//                       <div className="text-sm text-gray-900">{formatDate(booking.createdAt)}</div>
//                     </td>
//                     <td className="px-6 py-4 text-center">
//                       <button
//                         onClick={() => handleView(booking)}
//                         className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:from-indigo-700 hover:to-blue-700 transition-all shadow-sm hover:shadow-md"
//                       >
//                         <FaEye className="mr-2" />
//                         View
//                       </button>
//                     </td>
//                   </tr>
//                 ))
//               )}
//             </tbody>
//           </table>
//         </div>

//         {/* Pagination */}
//         {!loading && bookings.length > 0 && totalPages > 1 && (
//           <div className="border-t border-gray-100 px-6 py-4 bg-gray-50">
//             <div className="flex items-center justify-between">
//               <div className="text-sm text-gray-600">
//                 Showing <span className="font-semibold text-gray-900">{indexOfFirstItem + 1}</span> to{" "}
//                 <span className="font-semibold text-gray-900">
//                   {Math.min(indexOfLastItem, filteredBookings.length)}
//                 </span>{" "}
//                 of <span className="font-semibold text-gray-900">{filteredBookings.length}</span> bookings
//               </div>
//               <div className="flex items-center space-x-2">
//                 <button
//                   onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
//                   disabled={currentPage === 1}
//                   className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//                 >
//                   Previous
//                 </button>
                
//                 <span className="px-4 py-2 text-sm font-medium text-gray-700">
//                   Page {currentPage} of {totalPages}
//                 </span>
                
//                 <button
//                   onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
//                   disabled={currentPage === totalPages}
//                   className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//                 >
//                   Next
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default AllBookings;



// AllBookings.jsx - PROFESSIONAL DESIGN WITH COMPLETE BACKEND INTEGRATION

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  FaEye, FaMapMarkerAlt, FaMotorcycle, FaCreditCard, FaCalendarAlt,
  FaUser, FaPhone, FaHashtag, FaClock, FaMoneyBillWave, FaShieldAlt,
  FaSearch, FaArrowLeft, FaCheckCircle, FaTimesCircle, FaEdit, FaSave,
  FaUpload, FaDownload, FaFileAlt, FaPlus, FaTimes
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
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);

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

  // New function to fetch customer suggestions
  const fetchCustomerSuggestions = useCallback(async (query) => {
    if (query.length < 2) {
      setCustomerSuggestions([]);
      return;
    }

    try {
      const response = await apiClient.get(`/api/customers/search?query=${query}`);
      setCustomerSuggestions(response.data || []);
    } catch (error) {
      console.error('❌ Error fetching customer suggestions:', error);
      setCustomerSuggestions([]);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Handle search query changes
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Fetch customer suggestions when query is at least 2 characters
    if (query.length >= 2) {
      fetchCustomerSuggestions(query);
      setShowCustomerSuggestions(true);
    } else {
      setShowCustomerSuggestions(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-gray-100 py-1 px-1">
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
            refreshBookings={fetchBookings}
          />
        ) : (
          <BookingListView
            bookings={currentBookings}
            searchQuery={searchQuery}
            setSearchQuery={handleSearchChange}
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
            customerSuggestions={customerSuggestions}
            showCustomerSuggestions={showCustomerSuggestions}
            setShowCustomerSuggestions={setShowCustomerSuggestions}
          />
        )}
      </div>
    </div>
  );
};

// ✅ Booking Detail View Component - Booking Status beside Current Status
const BookingDetailView = ({ booking, onBack, formatDate, formatCurrency, getStatusColor, getPaymentMethodIcon, refreshBookings }) => {
  const [formData, setFormData] = useState({});
  const [additionalCharges, setAdditionalCharges] = useState([]);
  const [newCharge, setNewCharge] = useState({ type: 'Additional Charges', amount: '' });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSavingCharges, setIsSavingCharges] = useState(false);

  useEffect(() => {
    if (booking) {
      setFormData({
        bookingId: booking.bookingId || '',
        startDate: formatDate(booking.startDate),
        endDate: formatDate(booking.endDate),
        vehicleNumber: booking.bikeDetails?.registrationNumber || '',
        customerName: booking.customerName || '',
        customerContact: booking.customerNumber || '',
        address: booking.address || '',
        addressType: booking.addressType || 'Self Pickup',
        rideFee: booking.charges || 0,
        lateFeeCharges: booking.lateFeeCharges || 0,
        gstFee: booking.gst || 0,
        refundableDeposit: booking.advanceAmount || 0,
        totalRideFair: booking.finalAmount || 0,
        paymentMode: booking.paymentType === 2 ? 'ONLINE' : 'CASH',
        currentBookingStatus: booking.status || 'Confirmed',
        bookingStatus: booking.status || 'Accepted'
      });
    }
  }, [booking]);

  // Only allow booking status to be changed
  const handleInputChange = (field, value) => {
    if (field === 'bookingStatus') {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  // ✅ Enhanced Add More functionality with validation
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
      console.log('Added charge:', charge);
    } else {
      if (newCharge.type === 'Additional Charges') {
        toast.error('❌ Please select a specific charge type');
      } else if (!newCharge.amount) {
        toast.error('❌ Please enter amount');
      } else if (isNaN(parseFloat(newCharge.amount))) {
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

  // ✅ Enhanced Save functionality with API call
  const handleSaveCharges = async () => {
    if (additionalCharges.length === 0) {
      toast.warning('⚠️ No additional charges to save');
      return;
    }
    setIsSavingCharges(true);
    try {
      console.log('💾 Saving additional charges:', additionalCharges);

      // API call to save additional charges
      const payload = {
        bookingId: booking.id,
        additionalCharges: additionalCharges.map(charge => ({
          type: charge.type,
          amount: charge.amount,
          description: `${charge.type} - ₹${charge.amount}`
        })),
        totalAdditionalAmount: additionalCharges.reduce((sum, charge) => sum + charge.amount, 0)
      };

      // Try multiple endpoints for saving additional charges
      try {
        const response = await apiClient.post(`/api/booking-bikes/${booking.id}/additional-charges`, payload);
        console.log('✅ Charges saved via additional-charges endpoint:', response.data);
      } catch (error1) {
        try {
          const response = await apiClient.put(`/api/booking-bikes/updateCharges/${booking.id}`, payload);
          console.log('✅ Charges saved via updateCharges endpoint:', response.data);
        } catch (error2) {
          try {
            const response = await apiClient.patch(`/api/booking-bikes/${booking.id}`, { additionalCharges: payload.additionalCharges });
            console.log('✅ Charges saved via PATCH endpoint:', response.data);
          } catch (error3) {
            throw error3;
          }
        }
      }
      toast.success('💾 Additional charges saved successfully!');

      // Update total amount if needed
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

  // ✅ Enhanced Update booking status with multiple API endpoints
  const handleUpdateBookingDetails = async () => {
    if (!booking?.id) {
      toast.error('❌ Booking ID not found');
      return;
    }

    // Check if status actually changed
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

      // Prepare update payload
      const updatePayload = {
        status: formData.bookingStatus,
        updatedAt: new Date().toISOString(),
        updatedBy: 'admin'
      };

      // Try multiple API endpoints for updating booking status
      let response = null;
      let updateSuccess = false;
      const endpoints = [
        { url: `/api/booking-bikes/updateStatus/${booking.id}`, method: 'PUT' },
        { url: `/api/booking-bikes/${booking.id}/status`, method: 'PATCH' },
        { url: `/api/booking-bikes/${booking.id}`, method: 'PUT' },
        { url: `/api/booking-bikes/update/${booking.id}`, method: 'POST' },
        { url: `/api/booking-bikes/${booking.id}/update-status`, method: 'PUT' },
        // Adding the accept/cancel specific endpoints
        ...(formData.bookingStatus === 'Accepted' ? [{ url: `/api/booking-bikes/${booking.id}/accept`, method: 'POST' }] : []),
        ...(formData.bookingStatus === 'Cancelled' ? [{ url: `/api/booking-bikes/${booking.id}/cancel`, method: 'POST' }] : []),
        ...(formData.bookingStatus === 'Completed' ? [{ url: `/api/booking-bikes/${booking.id}/complete`, method: 'POST' }] : [])
      ];

      for (const endpoint of endpoints) {
        try {
          console.log(`🔄 Trying endpoint: ${endpoint.method} ${endpoint.url}`);

          if (endpoint.method === 'PUT') {
            response = await apiClient.put(endpoint.url, updatePayload);
          } else if (endpoint.method === 'PATCH') {
            response = await apiClient.patch(endpoint.url, updatePayload);
          } else if (endpoint.method === 'POST') {
            // For specific action endpoints, send minimal data
            if (endpoint.url.includes('/accept') || endpoint.url.includes('/cancel') || endpoint.url.includes('/complete')) {
              response = await apiClient.post(endpoint.url, {});
            } else {
              response = await apiClient.post(endpoint.url, updatePayload);
            }
          }

          updateSuccess = true;
          console.log(`✅ Status updated via ${endpoint.url}:`, response.data);
          toast.success(`✅ Booking status updated to "${formData.bookingStatus}" successfully!`);
          break;
        } catch (error) {
          console.log(`❌ ${endpoint.url} failed:`, error.response?.status, error.response?.data);
          continue;
        }
      }

      if (updateSuccess && response) {
        // Update the current status to reflect the change
        setFormData(prev => ({
          ...prev,
          currentBookingStatus: formData.bookingStatus
        }));

        // Show success notification with status change details
        toast.success(
          `🎉 Status changed from "${formData.currentBookingStatus}" to "${formData.bookingStatus}"`,
          { duration: 4000 }
        );

        // Refresh the bookings list after a short delay
        if (refreshBookings) {
          setTimeout(() => {
            refreshBookings();
            console.log('🔄 Bookings list refreshed');
          }, 1500);
        }

        // Log the successful update
        console.log('✅ Booking status update completed:', {
          bookingId: booking.id,
          oldStatus: formData.currentBookingStatus,
          newStatus: formData.bookingStatus,
          timestamp: new Date().toISOString()
        });
      } else {
        throw new Error('All endpoints failed');
      }
    } catch (error) {
      console.error('❌ Error updating booking status:', error);

      // Enhanced error handling with specific messages
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || error.response.data?.error || 'Unknown error';

        switch (status) {
          case 404:
            toast.error('❌ Booking not found. Please refresh and try again.');
            break;
          case 400:
            toast.error(`❌ Invalid request: ${message}`);
            break;
          case 401:
            toast.error('❌ Unauthorized. Please login again.');
            setTimeout(() => {
              window.location.href = '/login';
            }, 2000);
            break;
          case 403:
            toast.error('❌ You don\'t have permission to update this booking.');
            break;
          case 422:
            toast.error(`❌ Validation error: ${message}`);
            break;
          case 409:
            toast.error('❌ Booking status conflict. Please refresh and try again.');
            break;
          case 500:
            toast.error('❌ Server error. Please try again later.');
            break;
          default:
            toast.error(`❌ Update failed: ${message}`);
        }
      } else if (error.request) {
        toast.error('❌ Network error. Please check your internet connection.');
      } else {
        toast.error('❌ Something went wrong. Please try again.');
      }

      // Reset the status on error
      setFormData(prev => ({
        ...prev,
        bookingStatus: prev.currentBookingStatus
      }));
    } finally {
      setIsUpdating(false);
    }
  };

  // ✅ Enhanced status validation function
  const canUpdateStatus = (currentStatus, newStatus) => {
    const statusFlow = {
      'Pending': ['Accepted', 'Cancelled'],
      'Confirmed': ['Accepted', 'Cancelled'],
      'Accepted': ['Trip Started', 'Cancelled'],
      'Trip Started': ['On Going', 'End Trip'],
      'On Going': ['End Trip'],
      'End Trip': ['Completed'],
      'Completed': [], // Terminal state
      'Cancelled': [], // Terminal state
      'Rejected': [] // Terminal state
    };
    return statusFlow[currentStatus]?.includes(newStatus) || false;
  };

  // ✅ Enhanced booking status dropdown with validation
  const renderBookingStatusField = () => {
    const availableStatuses = ['Confirmed', 'Accepted', 'Trip Started', 'On Going', 'End Trip', 'Completed', 'Cancelled', 'Rejected'];

    return (
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-0.5">
          Booking Status <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.bookingStatus}
          onChange={(e) => {
            const newStatus = e.target.value;
            // Check if status change is valid
            if (canUpdateStatus(formData.currentBookingStatus, newStatus) || newStatus === formData.currentBookingStatus) {
              handleInputChange('bookingStatus', newStatus);
            } else {
              toast.warning(`⚠️ Cannot change status from "${formData.currentBookingStatus}" to "${newStatus}"`);
            }
          }}
          className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        >
          {availableStatuses.map(status => (
            <option
              key={status}
              value={status}
              disabled={!canUpdateStatus(formData.currentBookingStatus, status) && status !== formData.currentBookingStatus}
            >
              {status}
              {status === formData.currentBookingStatus ? ' (Current)' : ''}
            </option>
          ))}
        </select>

        {/* Status change hint */}
        {formData.bookingStatus !== formData.currentBookingStatus && (
          <div className="mt-1 text-xs text-blue-600 font-medium">
            ✨ Ready to change to "{formData.bookingStatus}"
          </div>
        )}
      </div>
    );
  };

  // ✅ Enhanced Update Button with better UX
  const renderUpdateButton = () => {
    const hasStatusChanged = formData.bookingStatus !== formData.currentBookingStatus;
    const isValidChange = canUpdateStatus(formData.currentBookingStatus, formData.bookingStatus);

    return (
      <div className="mb-3">
        <button
          onClick={handleUpdateBookingDetails}
          disabled={isUpdating || !hasStatusChanged || !isValidChange}
          className={`w-1/4 py-2 px-4 rounded-md text-sm font-semibold transition-all duration-200 flex items-center justify-center ${
            !hasStatusChanged
              ? 'bg-gray-400 cursor-not-allowed text-white'
              : !isValidChange
              ? 'bg-red-400 cursor-not-allowed text-white'
              : isUpdating
              ? 'bg-blue-400 cursor-not-allowed text-white'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
          }`}
        >
          {isUpdating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Updating Status...
            </>
          ) : !hasStatusChanged ? (
            <>
              <FaCheckCircle className="mr-2" />
              Status Up to Date
            </>
          ) : !isValidChange ? (
            <>
              <FaTimesCircle className="mr-2" />
              Invalid Status Change
            </>
          ) : (
            <>
              <FaEdit className="mr-2" />
              Update Booking Status
            </>
          )}
        </button>

        {/* Enhanced status change preview */}
        {hasStatusChanged && !isUpdating && (
          <div className={`mt-2 p-3 rounded-lg border-l-4 ${
            isValidChange
              ? 'bg-green-50 border-green-400 border-l-green-500'
              : 'bg-red-50 border-red-400 border-l-red-500'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {isValidChange ? (
                  <FaCheckCircle className="h-4 w-4 text-green-400 mt-0.5" />
                ) : (
                  <FaTimesCircle className="h-4 w-4 text-red-400 mt-0.5" />
                )}
              </div>
              <div className="ml-3">
                <p className={`text-xs font-medium ${
                  isValidChange ? 'text-green-800' : 'text-red-800'
                }`}>
                  {isValidChange ? 'Ready to Update' : 'Invalid Status Change'}
                </p>
                <p className={`text-xs ${
                  isValidChange ? 'text-green-700' : 'text-red-700'
                }`}>
                  Status will change from <span className="font-semibold">"{formData.currentBookingStatus}"</span> to <span className="font-semibold">"{formData.bookingStatus}"</span>
                </p>
                {!isValidChange && (
                  <p className="text-xs text-red-600 mt-1">
                    Please select a valid status transition.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Calculate total additional charges
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
          {/* Form Grid - 4 fields per row */}
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
            {/* Row 4 - All 4 fields including both status fields */}
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
          {/* ✅ UPDATE BOOKING DETAILS BUTTON - Full width below the grid */}
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

            {/* Status change preview */}
            {formData.bookingStatus !== formData.currentBookingStatus && !isUpdating && (
              <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded-md">
                <p className="text-xs text-orange-600 font-medium flex items-center">
                  <FaEdit className="mr-1" />
                  Status will change from "{formData.currentBookingStatus}" to "{formData.bookingStatus}"
                </p>
              </div>
            )}
          </div>
          {/* ✅ ENHANCED Additional Charges Section with properly positioned buttons */}
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
              {/* Input Row */}
              <div className="flex space-x-2 mb-3">
                <select
                  value={newCharge.type}
                  onChange={(e) => setNewCharge(prev => ({ ...prev, type: e.target.value }))}
                  className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="Additional Charges">Select Charge Type</option>
                  <option value="Extra Charges">Extra Charges</option>
                  <option value="Damage Charges">Damage Charges</option>
                  <option value="challan">challan</option>
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

              {/* Action Buttons - Positioned below input */}
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

              {/* Display Added Charges */}
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

                  {/* Total Row */}
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
          {/* View Customer Documents Section */}
          <div className="border-t pt-3">
            <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
              <FaFileAlt className="mr-2" />
              Customer Documents
            </h2>

            <div className="grid grid-cols-3 gap-3">
              {/* Aadhar Front Image */}
              <div className="text-center">
                <div className="w-full h-24 bg-gray-100 rounded-lg mb-2 flex items-center justify-center relative border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-1">
                      <div className="w-8 h-6 bg-blue-300 rounded-md"></div>
                    </div>
                  </div>
                  <div className="absolute bottom-1 left-1 bg-orange-500 text-white px-2 py-1 rounded text-xs font-medium">
                    📄 Document
                  </div>
                </div>
                <p className="text-xs font-semibold text-gray-700 mb-2">Aadhar Front Image</p>
                <div className="flex space-x-1">
                  <button
                    onClick={() => toast.success('✅ Document verified successfully')}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
                  >
                    Verify
                  </button>
                  <button
                    onClick={() => toast.error('❌ Document rejected')}
                    className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>
              {/* Aadhar Back Image */}
              <div className="text-center">
                <div className="w-full h-24 bg-gray-100 rounded-lg mb-2 flex items-center justify-center relative border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-1">
                      <div className="w-8 h-6 bg-blue-300 rounded-md"></div>
                    </div>
                  </div>
                  <div className="absolute bottom-1 left-1 bg-orange-500 text-white px-2 py-1 rounded text-xs font-medium">
                    📄 Document
                  </div>
                </div>
                <p className="text-xs font-semibold text-gray-700 mb-2">Aadhar Back Image</p>
                <div className="flex space-x-1">
                  <button
                    onClick={() => toast.success('✅ Document verified successfully')}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
                  >
                    Verify
                  </button>
                  <button
                    onClick={() => toast.error('❌ Document rejected')}
                    className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>
              {/* Driving License Image */}
              <div className="text-center">
                <div className="w-full h-24 bg-gray-100 rounded-lg mb-2 flex items-center justify-center relative border-2 border-dashed border-green-300 hover:border-green-400 transition-colors">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-1">
                      <div className="w-8 h-6 bg-green-300 rounded-md"></div>
                    </div>
                  </div>
                  <div className="absolute bottom-1 left-1 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                    ✅ Verified
                  </div>
                </div>
                <p className="text-xs font-semibold text-gray-700 mb-2">Driving License Image</p>
                <div className="flex space-x-1">
                  <button
                    onClick={() => toast.success('✅ Document verified successfully')}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
                  >
                    View
                  </button>
                  <button
                    onClick={() => toast.info('ℹ️ Document already verified')}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ✅ Booking List View Component (updated with customer suggestions)
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
  getPaymentMethodIcon,
  customerSuggestions,
  showCustomerSuggestions,
  setShowCustomerSuggestions
}) => {
  // Handle customer suggestion selection
  const handleSuggestionClick = (customer) => {
    setSearchQuery(customer.name);
    setShowCustomerSuggestions(false);
    // You could also filter bookings by this customer here if needed
  };

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

          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white px-3 py-1.5 rounded-lg shadow-lg">
              <div className="text-lg font-bold">{filteredBookings.length}</div>
              <div className="text-xs opacity-90">Total Bookings</div>
            </div>
          </div>
        </div>
      </div>
      {/* Search */}
      <div className="bg-white rounded-xl shadow-lg p-3">
        <div className="relative">
          <FaSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            placeholder="Search by booking ID, customer name, phone, or vehicle number..."
            className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 transition-all text-sm"
            value={searchQuery}
            onChange={setSearchQuery}
          />
          {/* Customer Suggestions Dropdown */}
          {showCustomerSuggestions && customerSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200">
              {customerSuggestions.map((customer) => (
                <div
                  key={customer.id}
                  className="px-4 py-2 text-sm text-gray-800 hover:bg-indigo-50 cursor-pointer flex items-center"
                  onClick={() => handleSuggestionClick(customer)}
                >
                  <FaUser className="text-indigo-500 mr-2" />
                  <div>
                    <div className="font-medium">{customer.name}</div>
                    <div className="text-xs text-gray-500">{customer.phone}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-8">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-2"></div>
                      <p className="text-gray-500 text-sm">Loading bookings...</p>
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
                        {searchQuery ? `No results for "${searchQuery}"` : "No bookings available"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-indigo-50 transition-colors">
                    <td className="px-3 py-2">
                      <div className="font-semibold text-indigo-600 text-sm">{booking.bookingId}</div>
                      <div className="text-xs text-gray-500">ID: {booking.id}</div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-medium text-gray-900 text-sm">
                        {booking.customerName || `Customer #${booking.customerId}`}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center">
                        <FaPhone className="mr-1 text-xs" />
                        {booking.customerNumber || 'N/A'}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-medium text-gray-900 text-sm">
                        {booking.bikeDetails?.registrationNumber || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500">
                        ID: {booking.vehicleId}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-bold text-gray-900 text-sm">{formatCurrency(booking.finalAmount)}</div>
                      <div className={`text-xs ${
                        booking.paymentStatus === 'PAID' ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {booking.paymentStatus}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r ${getStatusColor(booking.status)} text-white shadow-sm`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="text-xs text-gray-900">{new Date(booking.createdAt).toLocaleDateString()}</div>
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
        {!loading && bookings.length > 0 && totalPages > 1 && (
          <div className="border-t border-gray-100 px-3 py-2 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-600">
                Showing <span className="font-semibold text-gray-900">{indexOfFirstItem + 1}</span> to{" "}
                <span className="font-semibold text-gray-900">
                  {Math.min(indexOfLastItem, filteredBookings.length)}
                </span>{" "}
                of <span className="font-semibold text-gray-900">{filteredBookings.length}</span> bookings
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>

                <span className="px-2 py-1 text-xs font-medium text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
