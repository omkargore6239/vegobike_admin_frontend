// hooks/useBookingData.js (or wherever your hook is located)
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { bookingAPI } from '../../../utils/apiClient';

export const useBookingData = (navigate) => {
  const [bookings, setBookings] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(() => {
    const saved = sessionStorage.getItem('bookingsCurrentPage');
    return saved ? parseInt(saved) : 0;
  });
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
  const [statusFilter, setStatusFilter] = useState('all');

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
          setSelectedBooking(response.data);
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
      console.log(`📋 Fetching bookings - Page: ${currentPage}, Size: ${pageSize}, Sort: ${sortBy} ${sortDirection}, Filter: ${statusFilter}`);

      const response = await bookingAPI.getAll(
        currentPage, 
        pageSize, 
        sortBy, 
        sortDirection,
        statusFilter
      );
      
      console.log('✅ Bookings fetched:', response.data?.length || 0);
      console.log('📊 Total items:', response.pagination?.totalItems || 0);

      setBookings(response.data || []);
      setTotalPages(response.pagination?.totalPages || 0);
      setTotalItems(response.pagination?.totalItems || 0);
      
      //alert for allbooking page 
      // if (!refreshing) {
      //   toast.success(`📋 Loaded ${response.data?.length || 0} bookings`);
      // }

    } catch (error) {
      console.error('❌ Error fetching bookings:', error);
      setError(error);
      
      if (error.response?.status === 401) {
        toast.error('🔐 Session expired. Please login again.');
        setTimeout(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('isLoggedIn');
          localStorage.removeItem('userRole');
          navigate('/');
        }, 2000);
      } else if (error.response?.status === 403) {
        toast.error('🚫 Access denied to bookings.');
      } else {
        toast.error('❌ Failed to load bookings.');
      }
      
      setBookings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentPage, pageSize, sortBy, sortDirection, statusFilter, navigate, refreshing]);

  const handleSearchBookings = useCallback(async (query) => {
    if (!query || query.trim() === '') {
      fetchBookings();
      return;
    }

    setIsSearching(true);
    setError(null);
    
    try {
      // Try server-side search first
      const response = await bookingAPI.searchBookings(query.trim());
      setBookings(response.data || []);
      setTotalItems(response.data?.length || 0);
      setTotalPages(1);
      setCurrentPage(0);
      
      toast.success(`🔍 Found ${response.data?.length || 0} booking(s)`);
    } catch (error) {
      console.error('❌ Search API not available, using client-side filter');
      
      // Fallback: client-side filtering
      const filtered = bookings.filter(booking => {
        const searchTerm = query.toLowerCase();
        return (
          (booking.bookingId || '').toLowerCase().includes(searchTerm) ||
          (booking.customerName || '').toLowerCase().includes(searchTerm) ||
          (booking.customerNumber || '').toLowerCase().includes(searchTerm) ||
          (booking.bikeDetails?.registrationNumber || '').toLowerCase().includes(searchTerm)
        );
      });
      
      setBookings(filtered);
      setTotalItems(filtered.length);
      toast.info(`🔍 Found ${filtered.length} booking(s) (local search)`);
    } finally {
      setIsSearching(false);
    }
  }, [bookings, fetchBookings]);

  const handleRefresh = async () => {
    setRefreshing(true);
    toast.info('🔄 Refreshing bookings...');
    setSearchQuery("");
    await fetchBookings();
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

  return {
    bookings,
    setBookings,
    searchQuery,
    setSearchQuery: handleSearchChange,
    currentPage,
    setCurrentPage: handlePageChange,
    loading,
    pageSize,
    setPageSize: handlePageSizeChange,
    totalPages,
    totalItems,
    selectedBooking,
    setSelectedBooking,
    viewMode,
    setViewMode,
    refreshing,
    error,
    isSearching,
    sortBy,
    setSortBy,
    sortDirection,
    setSortDirection,
    statusFilter,
    setStatusFilter,
    fetchBookings,
    handleRefresh,
    handleClearSearch,
    handleView,
    handleBack,
  };
};
