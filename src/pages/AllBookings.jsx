import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { bookingAPI } from '../utils/apiClient';
import {
  BookingListView,
  BookingDetailView,
  useBookingData,
  formatDate,
  formatCurrency,
  getStatusColor,
  getPaymentMethodIcon,
  getCustomerDisplay,
  getCustomerPhone,
  getVehicleNumber,
  getVehicleDetails,
} from '../components/allbookings';

const AllBookings = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isFirstRender = useRef(true);

  // Local state for modals
  const [showEndTripKmModal, setShowEndTripKmModal] = useState(false);
  const [endTripKmValue, setEndTripKmValue] = useState('');
  const [showExtendTripModal, setShowExtendTripModal] = useState(false);
  const [newEndDateTime, setNewEndDateTime] = useState('');
  const [extendLoading, setExtendLoading] = useState(false);

  const {
    bookings,
    setBookings,
    searchQuery,
    currentPage,
    loading,
    pageSize,
    totalPages,
    totalItems,
    selectedBooking,
    viewMode,
    refreshing,
    error,
    isSearching,
    statusFilter,
    setSearchQuery,
    setCurrentPage,
    setLoading,
    setPageSize,
    setTotalPages,
    setTotalItems,
    setSelectedBooking,
    setViewMode,
    setStatusFilter,
    fetchBookings,
    handleRefresh,
    handleClearSearch,
    handleView,
    handleBack,
  } = useBookingData(navigate);

  /**
   * ✅ CRITICAL FIX: Clear sessionStorage and force list view on first mount
   */
  useEffect(() => {
    if (isFirstRender.current) {
      console.log('🔄 [AllBookings] FIRST MOUNT - Clearing view state');
      
      // Clear sessionStorage to prevent auto-restore
      sessionStorage.removeItem('bookingsViewMode');
      sessionStorage.removeItem('selectedBookingId');
      
      // Force list view
      setViewMode(false);
      setSelectedBooking(null);
      
      isFirstRender.current = false;
    }
  }, [setViewMode, setSelectedBooking]);

  /**
   * Handle navigation filters from other pages (e.g., Dashboard)
   */
  useEffect(() => {
    const navFilter = location.state?.statusFilter;
    
    if (navFilter && navFilter !== statusFilter) {
      console.log('📋 [AllBookings] Applying navigation filter:', navFilter);
      
      setStatusFilter(navFilter);
      setCurrentPage(0);
      
      const filterMessages = {
        today: "📅 Showing today's bookings",
        todayendtrips: "🏁 Showing today's end trips",
        ongoing: "🔄 Showing ongoing bookings",
        cancelled: "❌ Showing cancelled bookings",
        all: "📚 Showing all bookings",
      };
      
      toast.info(filterMessages[navFilter] || `Filter: ${navFilter}`, {
        autoClose: 2000,
      });
    }

    // Clean up navigation state
    if (location.state?.statusFilter) {
      window.history.replaceState({}, document.title);
    }
  }, [location.state, statusFilter, setStatusFilter, setCurrentPage]);

  /**
   * Date range filter for end trip bookings
   */
  const fetchEndTripBookings = useCallback(
    async (fromDate, toDate) => {
      if (!fromDate || !toDate) {
        toast.error('Please provide both dates');
        return;
      }

      setLoading(true);

      try {
        console.log(`📅 [AllBookings] Fetching end trips: ${fromDate} to ${toDate}`);

        const response = await bookingAPI.getEndTripBookings(
          fromDate,
          toDate,
          currentPage,
          pageSize
        );

        const fetchedBookings = response.data || [];
        const pagination = response.pagination || {};

        setBookings(fetchedBookings);
        setTotalPages(pagination.totalPages || 0);
        setTotalItems(pagination.totalItems || 0);

        const count = pagination.totalItems || 0;
        toast.success(`🏁 Found ${count} booking${count !== 1 ? 's' : ''}`, {
          autoClose: 2500,
        });
      } catch (err) {
        console.error('❌ [AllBookings] Error:', err);

        setBookings([]);
        setTotalPages(0);
        setTotalItems(0);

        const errorMessage =
          err.response?.data?.message || 'Failed to fetch bookings';
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [currentPage, pageSize, setBookings, setLoading, setTotalPages, setTotalItems]
  );

  // Debug logging
  useEffect(() => {
    console.log('📊 [AllBookings] State:', {
      viewMode,
      hasSelectedBooking: !!selectedBooking,
      bookingsCount: bookings.length,
    });
  }, [viewMode, selectedBooking, bookings.length]);

  return (
    <div className="min-h-screen bg-gray-100 py-1 px-1">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

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
            setSearchQuery={setSearchQuery}
            handleClearSearch={handleClearSearch}
            loading={loading}
            isSearching={isSearching}
            refreshing={refreshing}
            error={error}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            setPageSize={setPageSize}
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
            fetchEndTripBookings={fetchEndTripBookings}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
          />
        )}
      </div>
    </div>
  );
};

export default AllBookings;
