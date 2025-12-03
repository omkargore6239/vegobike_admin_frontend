import React, { useState } from 'react';
import {
  FaEye, FaMotorcycle, FaSearch, FaPlus, FaSync, FaTimes,
  FaExclamationTriangle, FaPhone, FaCalendarAlt, FaFilter
} from "react-icons/fa";

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
  navigate,
  fetchEndTripBookings,
  statusFilter,
  setStatusFilter
}) => {
  // Date filter states
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [isFilterActive, setIsFilterActive] = useState(false);

  // Handle date filter apply
  const handleApplyDateFilter = async () => {
    if (!fromDate || !toDate) {
      alert('Please select both from and to dates');
      return;
    }

    if (new Date(fromDate) > new Date(toDate)) {
      alert('From date cannot be after to date');
      return;
    }

    setIsFilterActive(true);

    if (fetchEndTripBookings) {
      await fetchEndTripBookings(fromDate, toDate);
    }
  };

  // Clear date filter
  const handleClearDateFilter = () => {
    setFromDate('');
    setToDate('');
    setIsFilterActive(false);
    setShowDateFilter(false);
    handleRefresh();
  };

  return (
    <div className="space-y-2 px-2 sm:px-0">
      {/* Header - Fully Responsive */}
      <div className="bg-white rounded-xl shadow-lg p-3 sm:p-4">
        <div className="flex flex-col space-y-3 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          <div className="text-center lg:text-left">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
              All Bookings
            </h1>
            <p className="text-gray-500 text-xs sm:text-sm">Manage and track all bike rentals</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <button
              onClick={() => navigate('/dashboard/createBooking')}
              className="flex items-center justify-center px-4 py-2 rounded-lg shadow-md transition-all bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-semibold hover:shadow-lg"
            >
              <FaPlus className="mr-2" />
              Create Booking
            </button>

            <button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className={`flex items-center justify-center px-3 py-2 rounded-lg shadow-md transition-all ${
                refreshing || loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
              } text-white text-xs sm:text-sm`}
            >
              <FaSync className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>

            <div className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white px-3 py-2 rounded-lg shadow-lg text-center sm:text-left">
              <div className="text-base sm:text-lg font-bold">{totalItems}</div>
              <div className="text-xs opacity-90">Total Bookings</div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display - Responsive */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-3 sm:p-4">
          <div className="flex items-start">
            <FaExclamationTriangle className="text-red-500 mt-0.5 mr-2 sm:mr-3 flex-shrink-0 text-sm sm:text-base" />
            <div className="flex-1">
              <h3 className="text-xs sm:text-sm font-semibold text-red-800 mb-1">Error Loading Bookings</h3>
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

      {/* Search & Filter - Fully Responsive */}
      <div className="bg-white rounded-xl shadow-lg p-3 sm:p-4">
        <div className="flex flex-col space-y-3">
          {/* Search Bar - Mobile First */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs sm:text-sm" />
              <input
                type="text"
                placeholder="Search by booking ID, customer name, phone, or vehicle number..."
                className="w-full pl-9 pr-10 py-2 sm:py-2.5 border border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 transition-all text-xs sm:text-sm"
                value={searchQuery}
                onChange={setSearchQuery}
              />
              {isSearching && (
                <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                </div>
              )}
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full p-1.5 transition-colors"
                  title="Clear search"
                >
                  <FaTimes className="text-xs" />
                </button>
              )}
            </div>

            {/* Filter Controls - Stacked on Mobile, Inline on Desktop */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {/* Status Filter Dropdown */}
              <select
                value={statusFilter || 'all'}
                onChange={(e) => {
                  const value = e.target.value;
                  console.log('🔄 Status filter changed to:', value);
                  setStatusFilter(value);
                  setCurrentPage(0);
                }}
                className="w-full sm:w-auto px-3 py-2 border border-indigo-300 rounded-lg text-xs sm:text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 bg-white hover:border-indigo-400 transition-all"
                title="Filter bookings by status"
              >
                <option value="all">📚 All Bookings</option>
                <option value="today">📅 Today's Bookings</option>
                <option value="ongoing">🔄 Ongoing</option>
                <option value="cancelled">❌ Cancelled</option>
                <option value="todayendtrips">🏁 Today's End Trips</option>
              </select>

              {/* Date Range Filter Button */}
              <button
                onClick={() => setShowDateFilter(!showDateFilter)}
                className={`flex items-center justify-center px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  isFilterActive
                    ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-md'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                title="Filter by date range"
              >
                <FaFilter className="mr-1.5" />
                <span className="hidden sm:inline">{isFilterActive ? 'Date Filter Active' : 'Date Range'}</span>
                <span className="sm:hidden">{isFilterActive ? 'Date Active' : 'Date'}</span>
              </button>

              <div className="flex items-center gap-2">
  <label className="text-xs text-gray-600 whitespace-nowrap font-medium hidden sm:inline">Items per page:</label>
  <label className="text-xs text-gray-600 whitespace-nowrap font-medium sm:hidden">Show:</label>
  <select
    value={pageSize}
    onChange={setPageSize} // ✅ Direct handler from hook
    className="px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 bg-white cursor-pointer hover:border-indigo-400 transition-all font-medium shadow-sm"
  >
    <option value={5}>5</option>
    <option value={10}>10</option>
    <option value={20}>20</option>
    <option value={50}>50</option>
    <option value={100}>100</option>
  </select>
</div>


            </div>
          </div>

          {/* Date Filter Panel - Mobile Optimized */}
          {showDateFilter && (
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-3 sm:p-4 animate-fadeIn">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <FaCalendarAlt className="text-purple-600 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold text-gray-700">Filter End Trip Dates:</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <label className="text-xs text-gray-600 whitespace-nowrap">From:</label>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-xs sm:text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-200"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <label className="text-xs text-gray-600 whitespace-nowrap">To:</label>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-xs sm:text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-200"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={handleApplyDateFilter}
                    disabled={!fromDate || !toDate}
                    className="flex-1 sm:flex-initial px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded text-xs sm:text-sm font-medium hover:from-purple-700 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                    Apply Filter
                  </button>

                  {isFilterActive && (
                    <button
                      onClick={handleClearDateFilter}
                      className="flex-1 sm:flex-initial px-4 py-2 bg-red-500 text-white rounded text-xs sm:text-sm font-medium hover:bg-red-600 transition-all shadow-sm"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Active Filter Indicator - Responsive */}
          {(statusFilter && statusFilter !== 'all') && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-indigo-700">Active Filter:</span>
                <span className="text-xs bg-indigo-200 text-indigo-800 px-2 py-1 rounded-full font-medium">
                  {statusFilter === 'todayendtrips' ? "Today's End Trips 🏁" :
                   statusFilter === 'today' ? "Today's Bookings 📅" :
                   statusFilter === 'ongoing' ? "Ongoing 🔄" :
                   statusFilter === 'cancelled' ? "Cancelled ❌" : statusFilter}
                </span>
              </div>
              <button
                onClick={() => {
                  setStatusFilter('all');
                  setCurrentPage(0);
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium self-start sm:self-auto"
              >
                Clear Filter ✕
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bookings Table - Mobile Card View, Desktop Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Desktop Table View - Hidden on Mobile */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
                <th className="px-3 py-2 text-left text-xs font-semibold">Booking ID</th>
                <th className="px-3 py-2 text-left text-xs font-semibold">Customer</th>
                <th className="px-3 py-2 text-left text-xs font-semibold">Vehicle</th>
                <th className="px-3 py-2 text-left text-xs font-semibold">Amount</th>
                <th className="px-3 py-2 text-left text-xs font-semibold">Status</th>
                <th className="px-3 py-2 text-left text-xs font-semibold">Start Date</th>
                <th className="px-3 py-2 text-left text-xs font-semibold">End Date</th>
                <th className="px-3 py-2 text-center text-xs font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading || isSearching ? (
                <tr>
                  <td colSpan="8" className="text-center py-8">
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
                  <td colSpan="8" className="text-center py-8">
                    <div className="flex flex-col items-center">
                      <FaMotorcycle className="text-gray-400 text-4xl mb-2" />
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">No bookings found</h3>
                      <p className="text-gray-500 text-xs">
                        {searchQuery
                          ? `No results for "${searchQuery}"`
                          : isFilterActive
                            ? "No end trips in selected date range"
                            : statusFilter && statusFilter !== 'all'
                              ? `No bookings with filter: ${statusFilter}`
                              : "No bookings available"}
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
                      <div className="text-xs text-gray-900 font-medium">
                        {formatDate(booking.startDate1 || booking.startDate)}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className={`text-xs font-medium ${
                        new Date(booking.endDate).toDateString() === new Date().toDateString()
                          ? 'text-red-600 font-bold'
                          : 'text-gray-900'
                      }`}>
                        {formatDate(booking.endDate)}
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

        {/* 🎯 COMPACT Mobile/Tablet Card View - Ultra Compact Design [web:12][web:15][web:19] */}
        <div className="lg:hidden">
          {loading || isSearching ? (
            <div className="text-center py-12">
              <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-gray-500 text-sm">
                {isSearching ? 'Searching bookings...' : 'Loading bookings...'}
              </p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12 px-4">
              <FaMotorcycle className="text-gray-400 text-5xl mb-3 mx-auto" />
              <h3 className="text-base font-semibold text-gray-900 mb-2">No bookings found</h3>
              <p className="text-gray-500 text-sm">
                {searchQuery
                  ? `No results for "${searchQuery}"`
                  : isFilterActive
                    ? "No end trips in selected date range"
                    : statusFilter && statusFilter !== 'all'
                      ? `No bookings with filter: ${statusFilter}`
                      : "No bookings available"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {bookings.map((booking) => (
                <div 
                  key={booking.id} 
                  className="p-2.5 hover:bg-indigo-50 transition-colors cursor-pointer"
                  onClick={() => handleView(booking)}
                >
                  {/* Compact Header - Single Line */}
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-indigo-600 text-xs truncate">
                        {booking.bookingId || `BK${booking.id}`}
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gradient-to-r ${getStatusColor(booking.status)} text-white ml-2 flex-shrink-0`}>
                      {booking.status || 'Unknown'}
                    </span>
                  </div>

                  {/* Compact 2-Column Grid Layout */}
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                    {/* Customer */}
                    <div className="flex items-start min-w-0">
                      <span className="text-gray-500 mr-1 flex-shrink-0">👤</span>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900 truncate">
                          {getCustomerDisplay(booking)}
                        </div>
                        <div className="text-gray-500 truncate">
                          {getCustomerPhone(booking)}
                        </div>
                      </div>
                    </div>

                    {/* Vehicle */}
                    <div className="flex items-start min-w-0">
                      <span className="text-gray-500 mr-1 flex-shrink-0">🏍️</span>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900 truncate">
                          {getVehicleNumber(booking)}
                        </div>
                        <div className="text-gray-500 truncate">
                          {getVehicleDetails(booking)}
                        </div>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-1">💰</span>
                      <div>
                        <div className="font-bold text-gray-900">
                          {formatCurrency(booking.finalAmount || booking.totalRideFair || 0)}
                        </div>
                        <div className={`text-[10px] ${
                          booking.paymentStatus === 'PAID' ? 'text-green-600' : 'text-yellow-600'
                        }`}>
                          {booking.paymentStatus || 'PENDING'}
                        </div>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-1">📅</span>
                      <div className="min-w-0">
                        <div className="text-gray-700 truncate">
                          {formatDate(booking.startDate1 || booking.startDate)}
                        </div>
                        <div className={`truncate ${
                          new Date(booking.endDate).toDateString() === new Date().toDateString()
                            ? 'text-red-600 font-bold'
                            : 'text-gray-700'
                        }`}>
                          {formatDate(booking.endDate)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Compact View Button */}
                  <div className="mt-1.5 pt-1.5 border-t border-gray-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleView(booking);
                      }}
                      className="w-full flex items-center justify-center px-2 py-1 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded hover:from-indigo-700 hover:to-blue-700 transition-all shadow-sm text-[11px] font-medium"
                    >
                      <FaEye className="mr-1.5 text-[10px]" />
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination - Responsive */}
        {!loading && !isSearching && bookings.length > 0 && totalPages > 1 && !searchQuery && (
          <div className="border-t border-gray-100 px-3 sm:px-4 py-3 bg-gray-50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-xs text-gray-600 text-center sm:text-left">
                Showing <span className="font-semibold text-gray-900">{currentPage * pageSize + 1}</span> to{" "}
                <span className="font-semibold text-gray-900">
                  {Math.min((currentPage + 1) * pageSize, totalItems)}
                </span>{" "}
                of <span className="font-semibold text-gray-900">{totalItems}</span> bookings
              </div>
              <div className="flex items-center justify-center sm:justify-end gap-1">
                <button
                  onClick={() => setCurrentPage(0)}
                  disabled={currentPage === 0}
                  className="px-2 sm:px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <span className="hidden sm:inline">First</span>
                  <span className="sm:hidden">«</span>
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 0}
                  className="px-2 sm:px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <span className="hidden sm:inline">Previous</span>
                  <span className="sm:hidden">‹</span>
                </button>

                <span className="px-2 sm:px-3 py-1.5 text-xs font-medium text-gray-700 bg-indigo-50 border border-indigo-200 rounded">
                  <span className="hidden sm:inline">Page </span>{currentPage + 1}<span className="hidden sm:inline"> of {totalPages}</span>
                  <span className="sm:hidden">/{totalPages}</span>
                </span>

                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages - 1}
                  className="px-2 sm:px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <span className="hidden sm:inline">Next</span>
                  <span className="sm:hidden">›</span>
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages - 1)}
                  disabled={currentPage === totalPages - 1}
                  className="px-2 sm:px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <span className="hidden sm:inline">Last</span>
                  <span className="sm:hidden">»</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingListView;
