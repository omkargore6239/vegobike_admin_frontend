import React from 'react';
import {
  FaEye, FaMotorcycle, FaSearch, FaPlus, FaSync, FaTimes,
  FaExclamationTriangle, FaPhone
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
                      <div className="text-xs text-gray-900 font-medium">
                        {formatDate(booking.createdAt)}
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

export default BookingListView;
