// hooks/useBookingData.js
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { bookingAPI } from '../../../utils/apiClient';

export const useBookingData = (navigate) => {
  const [bookings, setBookings] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(() => {
    const saved = sessionStorage.getItem('bookingsCurrentPage');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [loading, setLoading] = useState(true);
  const [pageSize, setPageSize] = useState(() => {
    const saved = sessionStorage.getItem('bookingsPageSize');
    return saved ? parseInt(saved, 10) : 10;
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
  const [statusFilter, setStatusFilter] = useState(() => {
    const saved = sessionStorage.getItem('bookingsStatusFilter');
    return saved || 'all';
  });

  // ✅ Save state to sessionStorage
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
    sessionStorage.setItem('bookingsStatusFilter', statusFilter);
  }, [statusFilter]);

  useEffect(() => {
    if (selectedBooking) {
      sessionStorage.setItem('selectedBookingId', selectedBooking.id.toString());
    }
  }, [selectedBooking]);

  // ✅ Restore booking on page refresh
useEffect(() => {
  const savedViewMode = sessionStorage.getItem('bookingsViewMode') === 'true';
  const savedBookingId = sessionStorage.getItem('selectedBookingId');
  
  if (savedViewMode && savedBookingId && !selectedBooking) {
    const restoreBooking = async () => {
      // This is RESTORING the detail view when you click sidebar!
      setSelectedBooking(response.data);
      setViewMode(true);
    };
    restoreBooking();
  }
}, []);


  // ✅ MAIN FETCH FUNCTION - Properly handles all filters and pagination
  const fetchBookings = useCallback(async () => {
    if (searchQuery.trim()) {
      console.log('⏭️ [useBookingData] Skipping fetch - search query active');
      return; // Don't fetch if actively searching
    }

    setLoading(true);
    setError(null);
    setIsSearching(false);

    try {
      console.log('📋 [useBookingData] Fetching bookings:', {
        page: currentPage,
        size: pageSize,
        sortBy,
        sortDirection,
        statusFilter
      });

      const response = await bookingAPI.getAll(
        currentPage,
        pageSize,
        sortBy,
        sortDirection,
        statusFilter || 'all'
      );

      console.log('✅ [useBookingData] API Response:', {
        bookingsCount: response.data?.length || 0,
        totalItems: response.pagination?.totalItems || 0,
        totalPages: response.pagination?.totalPages || 0,
        currentPage: response.pagination?.currentPage
      });

      setBookings(response.data || []);
      setTotalPages(response.pagination?.totalPages || 0);
      setTotalItems(response.pagination?.totalItems || 0);

    } catch (error) {
      console.error('❌ [useBookingData] Error fetching bookings:', error);
      console.error('❌ Error details:', error.response?.data);
      setError(error);
      setBookings([]);
      setTotalPages(0);
      setTotalItems(0);

      // Handle authentication errors
      if (error.response?.status === 401) {
        toast.error('🔐 Session expired. Please login again.');
        setTimeout(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('authtoken');
          localStorage.removeItem('isLoggedIn');
          localStorage.removeItem('userRole');
          navigate('/');
        }, 2000);
      } else if (error.response?.status === 403) {
        toast.error('🚫 Access denied to bookings.');
      } else {
        toast.error(`❌ Failed to load bookings: ${error.response?.data?.message || error.message}`);
      }

    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [
    currentPage,
    pageSize,
    sortBy,
    sortDirection,
    statusFilter,
    searchQuery,
    navigate,
  ]);

  // ✅ Fetch on mount and when dependencies change (but NOT in view mode)
  useEffect(() => {
    if (!viewMode) {
      console.log('🔄 [useBookingData] Effect triggered - fetching bookings');
      fetchBookings();
    }
  }, [fetchBookings, viewMode]);

  // ✅ Search bookings with backend API
  const handleSearchBookings = useCallback(async (query) => {
    if (!query || query.trim() === '') {
      console.log('🔄 [useBookingData] Empty search - fetching all bookings');
      setCurrentPage(0);
      fetchBookings();
      return;
    }

    setIsSearching(true);
    setError(null);
    
    try {
      console.log(`🔍 [useBookingData] Searching for: "${query}"`);
      const response = await bookingAPI.searchBookings(query.trim());
      
      console.log('✅ [useBookingData] Search results:', response.data?.length || 0);
      
      setBookings(response.data || []);
      setTotalItems(response.data?.length || 0);
      setTotalPages(1);
      setCurrentPage(0);
      
      if (response.data && response.data.length > 0) {
        toast.success(`🔍 Found ${response.data.length} booking(s)`);
      } else {
        toast.info('🔍 No bookings found matching your search');
      }
    } catch (error) {
      console.error('❌ [useBookingData] Search error:', error);
      
      // Fallback: client-side filtering if backend search fails
      console.log('⚠️ [useBookingData] Using client-side search fallback');
      const filtered = bookings.filter(booking => {
        const searchTerm = query.toLowerCase();
        return (
          (booking.bookingId || '').toLowerCase().includes(searchTerm) ||
          (booking.customerName || '').toLowerCase().includes(searchTerm) ||
          (booking.customerNumber || '').toLowerCase().includes(searchTerm) ||
          (booking.bikeDetails?.registrationNumber || '').toLowerCase().includes(searchTerm) ||
          (booking.id || '').toString().includes(searchTerm)
        );
      });
      
      setBookings(filtered);
      setTotalItems(filtered.length);
      setTotalPages(1);
      toast.info(`🔍 Found ${filtered.length} booking(s) (local search)`);
    } finally {
      setIsSearching(false);
    }
  }, [bookings, fetchBookings]);

  // ✅ Refresh bookings - clears all filters and search
  const handleRefresh = async () => {
    console.log('🔄 [useBookingData] Manual refresh triggered');
    setRefreshing(true);
    toast.info('🔄 Refreshing bookings...');
    
    setSearchQuery("");
    setStatusFilter('all');
    setCurrentPage(0);
    
    await fetchBookings();
    
    toast.success('✅ Bookings refreshed!');
  };

  // ✅ Handle search with debounce (500ms delay)
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Clear previous timeout
    if (window.bookingSearchTimeout) {
      clearTimeout(window.bookingSearchTimeout);
    }

    // Set new timeout
    window.bookingSearchTimeout = setTimeout(() => {
      if (query.trim() === '') {
        console.log('🔄 [useBookingData] Search cleared - fetching all');
        setCurrentPage(0);
        fetchBookings();
      } else {
        handleSearchBookings(query);
      }
    }, 500);
  };

  // ✅ Clear search and restore bookings
  const handleClearSearch = () => {
    console.log('🗑️ [useBookingData] Clearing search');
    
    if (window.bookingSearchTimeout) {
      clearTimeout(window.bookingSearchTimeout);
    }
    
    setSearchQuery("");
    setIsSearching(false);
    setCurrentPage(0);
    fetchBookings();
  };

  // ✅ Page change handler with validation
  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      console.log(`📄 [useBookingData] Page changed: ${currentPage} → ${newPage}`);
      setCurrentPage(newPage);
    } else {
      console.warn(`⚠️ [useBookingData] Invalid page: ${newPage} (total: ${totalPages})`);
    }
  };

  // ✅ Page size change handler - resets to first page
  const handlePageSizeChange = (e) => {
    const newSize = parseInt(e.target.value, 10);
    console.log(`📏 [useBookingData] Page size changed: ${pageSize} → ${newSize}`);
    
    setPageSize(newSize);
    setCurrentPage(0); // Always reset to first page when changing size
  };

  // ✅ Status filter change handler
  const handleStatusFilterChange = (newFilter) => {
    console.log(`🔧 [useBookingData] Status filter changed: ${statusFilter} → ${newFilter}`);
    
    setStatusFilter(newFilter);
    setCurrentPage(0); // Reset to first page when changing filter
  };

  // ✅ View booking details
  const handleView = async (booking) => {
    console.log('👁️ [useBookingData] Viewing booking:', booking.id);

    try {
      setLoading(true);
      
      const response = await bookingAPI.getById(booking.id);
      const fullBooking = response.data || booking;
      
      console.log('✅ [useBookingData] Full booking data fetched');

      setSelectedBooking(fullBooking);
      setViewMode(true);
      sessionStorage.setItem('selectedBookingId', fullBooking.id.toString());
      
    } catch (error) {
      console.error('❌ [useBookingData] Error fetching booking details:', error);
      toast.error('Failed to load booking details. Showing available data.');
      
      // Fallback to partial booking data
      setSelectedBooking(booking);
      setViewMode(true);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Back to list view
  const handleBack = () => {
    console.log('🔙 [useBookingData] Returning to list view');
    
    setViewMode(false);
    setSelectedBooking(null);
    sessionStorage.removeItem('bookingsViewMode');
    sessionStorage.removeItem('selectedBookingId');
    
    // Refresh bookings when returning to list
    if (!searchQuery.trim()) {
      fetchBookings();
    }
  };

  return {
    // State
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
    sortBy,
    sortDirection,
    statusFilter,
    
    // Setters
    setSearchQuery: handleSearchChange,
    setCurrentPage: handlePageChange,
    setLoading,
    setPageSize: handlePageSizeChange,
    setTotalPages,
    setTotalItems,
    setSelectedBooking,
    setViewMode,
    setSortBy,
    setSortDirection,
    setStatusFilter: handleStatusFilterChange, // ✅ Use wrapper function
    
    // Actions
    fetchBookings,
    handleRefresh,
    handleClearSearch,
    handleView,
    handleBack,
  };
};
