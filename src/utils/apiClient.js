// utils/apiClient.js - COMPLETE API CLIENT WITH ALL UPDATES
import axios from 'axios';

// Base URL configuration
export const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:8080';

// Storage keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
};

// Notification types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
};

// Token validation helper
const isTokenValid = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch (error) {
    return false;
  }
};

// ✅ Create axios instance
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
  timeout: 30000,
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Skip auth for public endpoints
    const publicEndpoints = [
      '/api/auth/send-login-otp',
      '/api/auth/verify-login-otp',
      '/api/auth/send-registration-otp',
      '/api/auth/verify-registration-otp',
      '/api/auth/admin/login',
      '/api/auth/store-manager/login',
      '/api/auth/health',
      '/api/auth/test',
    ];

    const isPublicEndpoint = publicEndpoints.some(endpoint => 
      config.url?.includes(endpoint)
    );

    if (isPublicEndpoint) {
      delete config.headers.Authorization;
      return config;
    }

    // Handle multipart form data
    if (config.data instanceof FormData) {
      config.headers['Content-Type'] = 'multipart/form-data';
    }

    // Add authorization token
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token && isTokenValid(token)) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (token) {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
    }

    if (import.meta.env.DEV) {
      console.log(`🔹 ${config.method?.toUpperCase()} ${config.url}`);
    }

    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url}:`, response.data);
    }
    return response;
  },
  (error) => {
    if (import.meta.env.DEV) {
      console.error(
        `❌ ${error.config?.method?.toUpperCase()} ${error.config?.url}:`,
        error.response?.data || error.message
      );
    }

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      console.warn('⚠️ Unauthorized - Clearing auth data');
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      
      if (window.location.pathname !== '/login' && window.location.pathname !== '/admin/login') {
        showNotification('Session expired. Please login again.', NOTIFICATION_TYPES.WARNING);
        setTimeout(() => {
          window.location.href = '/admin/login';
        }, 1500);
      }
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.error('🚫 Access forbidden');
      showNotification('Access denied. You do not have permission.', NOTIFICATION_TYPES.ERROR);
    }

    // Handle 404 Not Found
    if (error.response?.status === 404) {
      console.warn('⚠️ Resource not found');
    }

    // Handle 500 Server Error
    if (error.response?.status >= 500) {
      console.error('💥 Server error occurred');
      showNotification('Server error. Please try again later.', NOTIFICATION_TYPES.ERROR);
    }

    return Promise.reject(error);
  }
);

// ✅ Notification function
export const showNotification = (message, type = NOTIFICATION_TYPES.INFO) => {
  console.log(`🔔 [${type.toUpperCase()}] ${message}`);
  
  if (typeof window !== 'undefined' && window.toast) {
    window.toast[type](message);
  } else {
    if (type === NOTIFICATION_TYPES.ERROR) {
      console.error(message);
    } else if (type === NOTIFICATION_TYPES.WARNING) {
      console.warn(message);
    } else {
      console.info(message);
    }
  }
};

// ✅ Clear authentication data helper
export const clearAuthData = () => {
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
  console.log('🗑️ Auth data cleared');
};

// ✅ API wrapper with better error handling
export const api = {
  get: async (url, config = {}) => {
    try {
      return await apiClient.get(url, config);
    } catch (error) {
      console.error('❌ GET Error:', error);
      throw error;
    }
  },

  post: async (url, data, config = {}) => {
    try {
      return await apiClient.post(url, data, config);
    } catch (error) {
      console.error('❌ POST Error:', error);
      throw error;
    }
  },

  put: async (url, data, config = {}) => {
    try {
      return await apiClient.put(url, data, config);
    } catch (error) {
      console.error('❌ PUT Error:', error);
      throw error;
    }
  },

  delete: async (url, config = {}) => {
    try {
      return await apiClient.delete(url, config);
    } catch (error) {
      console.error('❌ DELETE Error:', error);
      throw error;
    }
  },

  patch: async (url, data, config = {}) => {
    try {
      return await apiClient.patch(url, data, config);
    } catch (error) {
      console.error('❌ PATCH Error:', error);
      throw error;
    }
  },
};

// Helper function to create FormData for file uploads
export const createFormData = (data) => {
  const formData = new FormData();

  Object.keys(data).forEach((key) => {
    if (data[key] !== null && data[key] !== undefined) {
      if (data[key] instanceof File) {
        formData.append(key, data[key]);
      } else if (typeof data[key] === 'object' && !(data[key] instanceof File)) {
        formData.append(key, JSON.stringify(data[key]));
      } else {
        formData.append(key, data[key]);
      }
    }
  });

  return formData;
};
// ✅ BIKE API - UPDATED WITH PROPER TOKEN HANDLING
export const bikeAPI = {
  getAll: async (params = {}) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('🚲 Fetching bikes with params:', params);
      
      const response = await axios.get(`${BASE_URL}/api/bikes/all`, {
        params: {
          page: params.page || 0,
          size: params.size || 10,
          sortBy: params.sortBy || 'createdAt',
          sortDirection: params.sortDirection || 'desc',
          ...(params.search && { search: params.search })
        },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Bikes response:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Error fetching bikes:', error);
      throw error;
    }
  },

  getById: (id) => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    return axios.get(`${BASE_URL}/api/bikes/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },

  getActive: () => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    return axios.get(`${BASE_URL}/api/bikes/active`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },

  getAvailable: () => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    return axios.get(`${BASE_URL}/api/bikes/available`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },

  create: (data) => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    return axios.post(`${BASE_URL}/api/bikes`, data, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },

  update: (id, data) => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    return axios.put(`${BASE_URL}/api/bikes/${id}`, data, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },

  toggleActive: async (id) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      
      console.log(`🔄 Toggling bike ${id} active status`);
      
      const response = await axios.put(
        `${BASE_URL}/api/bikes/${id}/toggle-active`,
        null,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Toggle response:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Error toggling bike:', error);
      throw error;
    }
  },

  delete: (id) => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    return axios.delete(`${BASE_URL}/api/bikes/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },
};


// ✅ Store API helper functions
export const storeAPI = {
  getAll: (params = {}) => api.get('/api/stores/all', { params }),
  getById: (id) => api.get(`/api/stores/${id}`),
  getActive: () => api.get('/api/stores/active'),
  create: (storeData, image = null) => {
    const formData = new FormData();
    formData.append('storeName', storeData.storeName);
    formData.append('storeContactNumber', storeData.storeContactNumber);
    formData.append('storeAddress', storeData.storeAddress);
    if (storeData.storeUrl) formData.append('storeUrl', storeData.storeUrl);
    if (storeData.storeGstinNumber) formData.append('storeGstinNumber', storeData.storeGstinNumber);
    if (storeData.storeLatitude) formData.append('storeLatitude', storeData.storeLatitude);
    if (storeData.storeLongitude) formData.append('storeLongitude', storeData.storeLongitude);
    if (storeData.addedBy) formData.append('addedBy', storeData.addedBy);
    if (image) formData.append('storeImage', image);
    return api.post('/api/stores/add', formData);
  },
  update: (id, storeData, image = null) => {
    const formData = new FormData();
    if (storeData.storeName) formData.append('storeName', storeData.storeName);
    if (storeData.storeContactNumber) formData.append('storeContactNumber', storeData.storeContactNumber);
    if (storeData.storeAddress) formData.append('storeAddress', storeData.storeAddress);
    if (storeData.storeUrl) formData.append('storeUrl', storeData.storeUrl);
    if (storeData.storeGstinNumber) formData.append('storeGstinNumber', storeData.storeGstinNumber);
    if (storeData.storeLatitude) formData.append('storeLatitude', storeData.storeLatitude);
    if (storeData.storeLongitude) formData.append('storeLongitude', storeData.storeLongitude);
    if (storeData.addedBy) formData.append('addedBy', storeData.addedBy);
    if (image) formData.append('storeImage', image);
    return api.post(`/api/stores/edit/${id}`, formData);
  },
  toggleStatus: (id) => api.put(`/api/stores/${id}/status`),
  delete: (id) => api.delete(`/api/stores/delete/${id}`),
};

// ✅ Category API helper functions
export const categoryAPI = {
  getAll: (params = {}) => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    return axios.get(`${BASE_URL}/api/categories/all`, {
      params,
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },
  getById: (id) => api.get(`/api/categories/${id}`),
  
    getActive: () => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    return axios.get(`${BASE_URL}/api/categories/active`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },
  create: (categoryData, image = null) => {
    const formData = new FormData();
    formData.append('categoryName', categoryData.categoryName);
    if (image) formData.append('image', image);
    return api.post('/api/categories/add', formData);
  },
  update: (id, categoryData, image = null) => {
    const formData = new FormData();
    formData.append('categoryName', categoryData.categoryName);
    if (image) formData.append('image', image);
    return api.post(`/api/categories/edit/${id}`, formData);
  },
  toggleStatus: (id) => api.get(`/api/categories/status/${id}`),
  delete: (id) => api.delete(`/api/categories/delete/${id}`),
  search: (name, params = {}) => api.get('/api/categories/search', { params: { name, ...params } }),
};

// ✅ Brand API
export const brandAPI = {
  getAll: (params = {}) => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    return axios.get(`${BASE_URL}/api/brands/all`, {
      params,
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },
  
  getActive: () => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    return axios.get(`${BASE_URL}/api/brands/active`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },
  getById: (id) => api.get(`/api/brands/${id}`),
  create: (data) => api.post('/api/brands', data),
  update: (id, data) => api.put(`/api/brands/${id}`, data),
  delete: (id) => api.delete(`/api/brands/${id}`),
};

// ✅ Model API
export const modelAPI = {
    getAll: (params = {}) => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    return axios.get(`${BASE_URL}/api/models/all`, {
      params,
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },
  
  getActive: () => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    return axios.get(`${BASE_URL}/api/models/active`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },
  getById: (id) => api.get(`/api/models/${id}`),
  create: (data) => api.post('/api/models', data),
  update: (id, data) => api.put(`/api/models/${id}`, data),
  delete: (id) => api.delete(`/api/models/${id}`),
};

// ✅ CITY API
export const cityAPI = {
  getAll: (params = {}) => apiClient.get('/api/cities', { params }),
  getById: (id) => apiClient.get(`/api/cities/${id}`),
  getActive: () => apiClient.get('/api/cities/active'),
  create: (cityData, image = null) => {
    const formData = new FormData();
    formData.append('cityDto', JSON.stringify(cityData));
    if (image) formData.append('image', image);
    return apiClient.post('/api/cities/add', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  update: (id, cityData, image = null) => {
    const formData = new FormData();
    formData.append('cityDto', JSON.stringify(cityData));
    if (image) formData.append('image', image);
    return apiClient.put(`/api/cities/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  toggleStatus: (id) => apiClient.patch(`/api/cities/${id}/toggle-status`)
};

// ✅ Late Charges API
export const lateChargesAPI = {
  getAll: () => api.get('/api/late-charges/all'),
  getById: (id) => api.get(`/api/late-charges/${id}`),
  getActive: () => api.get('/api/late-charges/active'),
  create: (data) => api.post('/api/late-charges/add', data),
  update: (id, data) => api.put(`/api/late-charges/update/${id}`, data),
  toggleStatus: (id, isActive) => api.put(`/api/late-charges/${id}/status?isActive=${isActive}`),
  delete: (id) => api.delete(`/api/late-charges/${id}`),
};

// ✅ BOOKING API - FULLY UPDATED
export const bookingAPI = {
  // Get all bikes
  getAllBikes: (params = {}) => api.get('/api/bikes/all', { params }),
  
  // Admin register and book
  adminRegisterAndBook: (data) => api.post('/api/booking-bikes/admin/bookings/register-and-book', data),
  
  // Get all bookings with pagination - GET /api/booking-bikes/allBooking
  // Get all bookings with pagination - GET /api/booking-bikes/allBooking
getAll: async (page = 0, size = 10, sortBy = 'createdAt', sortDirection = 'desc', statusFilter = 'all') => {
  try {
    console.log(`📋 [Booking API] Fetching bookings - Page: ${page}, Size: ${size}, Filter: ${statusFilter}`);
    const response = await api.get('/api/booking-bikes/allBooking', {
      params: { 
        page, 
        size, 
        sortBy, 
        sortDirection,
        statusFilter,           // ✅ ADD THIS LINE
        zoneId: 'Asia/Kolkata'  // ✅ ADD THIS LINE
      }
    });

      console.log('✅ [Booking API] Response:', response.data);
      
      return {
        data: response.data.bookings || [],
        pagination: {
          currentPage: response.data.currentPage,
          totalItems: response.data.totalItems,
          totalPages: response.data.totalPages,
          pageSize: response.data.pageSize,
          hasNext: response.data.hasNext,
          hasPrevious: response.data.hasPrevious
        }
      };
    } catch (error) {
      console.error('❌ [Booking API] Error fetching bookings:', error);
      throw error;
    }
  },

  // Get all bookings without pagination
  getAllNoPagination: async () => {
    try {
      console.log('📋 [Booking API] Fetching all bookings without pagination');
      const response = await api.get('/api/booking-bikes/allBooking');
      console.log('✅ [Booking API] Response:', response.data);
      return { data: Array.isArray(response.data) ? response.data : [] };
    } catch (error) {
      console.error('❌ [Booking API] Error fetching bookings:', error);
      throw error;
    }
  },

  // ✅ Search bookings - GET /api/booking-bikes/searchBookings
  searchBookings: async (query) => {
    try {
      console.log(`🔍 [Booking API] Searching bookings with query: "${query}"`);
      const response = await api.get('/api/booking-bikes/searchBookings', {
        params: { query: query.trim() }
      });
      console.log('✅ [Booking API] Search results:', response.data);
      
      return {
        data: Array.isArray(response.data) ? response.data : []
      };
    } catch (error) {
      console.error('❌ [Booking API] Error searching bookings:', error);
      throw error;
    }
  },

  // Get booking by ID
  getById: async (id) => {
    try {
      console.log(`📋 [Booking API] Fetching booking ID: ${id}`);
      const response = await api.get(`/api/booking-bikes/getById/${id}`);
      console.log(`✅ [Booking API] Booking ${id}:`, response.data);
      return { data: response.data };
    } catch (error) {
      console.error(`❌ [Booking API] Error fetching booking ${id}:`, error);
      throw error;
    }
  },
  
  // Accept booking
  accept: async (bookingId) => {
    try {
      console.log(`📋 [Booking API] Accepting booking: ${bookingId}`);
      const response = await api.post(`/api/booking-bikes/${bookingId}/accept`);
      console.log(`✅ [Booking API] Booking accepted:`, response.data);
      return { data: response.data };
    } catch (error) {
      console.error(`❌ [Booking API] Error accepting booking:`, error);
      throw error;
    }
  },
  
  // Cancel booking
  cancel: async (bookingId) => {
    try {
      console.log(`📋 [Booking API] Cancelling booking: ${bookingId}`);
      const response = await api.post(`/api/booking-bikes/${bookingId}/cancel`);
      console.log(`✅ [Booking API] Booking cancelled:`, response.data);
      return { data: response.data };
    } catch (error) {
      console.error(`❌ [Booking API] Error cancelling booking:`, error);
      throw error;
    }
  },
  
  // Complete booking
  complete: async (bookingId) => {
    try {
      console.log(`📋 [Booking API] Completing booking: ${bookingId}`);
      const response = await api.post(`/api/booking-bikes/${bookingId}/complete`);
      console.log(`✅ [Booking API] Booking completed:`, response.data);
      return { data: response.data };
    } catch (error) {
      console.error(`❌ [Booking API] Error completing booking:`, error);
      throw error;
    }
  },

  
  
  // Start trip
  startTrip: async (bookingId, images, startTripKm) => {
    try {
      const formData = new FormData();
      if (images && images.length === 4) {
        Array.from(images).forEach((image) => {
          formData.append('images', image);
        });
      }
      formData.append('startTripKm', startTripKm);
      
      console.log(`📋 [Booking API] Starting trip: ${bookingId}`);
      const response = await api.post(`/api/booking-bikes/${bookingId}/start`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      console.log(`✅ [Booking API] Trip started:`, response.data);
      return { data: response.data };
    } catch (error) {
      console.error(`❌ [Booking API] Error starting trip:`, error);
      throw error;
    }
  },
  
  // End trip
  endTrip: async (bookingId, images, endTripKm) => {
    try {
      const formData = new FormData();
      if (images && images.length === 4) {
        Array.from(images).forEach((image) => {
          formData.append('images', image);
        });
      }
      formData.append('endTripKm', endTripKm);
      
      console.log(`📋 [Booking API] Ending trip: ${bookingId}`);
      const response = await api.post(`/api/booking-bikes/${bookingId}/end`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      console.log(`✅ [Booking API] Trip ended:`, response.data);
      return { data: response.data };
    } catch (error) {
      console.error(`❌ [Booking API] Error ending trip:`, error);
      throw error;
    }
  },
  
  // Get bookings by customer
  getByCustomer: async (customerId, page = 0, size = 10, sortBy = 'latest') => {
    try {
      console.log(`📋 [Booking API] Fetching customer bookings: ${customerId}`);
      const response = await api.get('/api/booking-bikes/by-customer', { 
        params: { customerId, page, size, sortBy } 
      });
      console.log(`✅ [Booking API] Customer bookings:`, response.data);
      return { data: Array.isArray(response.data) ? response.data : [] };
    } catch (error) {
      console.error(`❌ [Booking API] Error fetching customer bookings:`, error);
      throw error;
    }
  },
  // ✅ CORRECT - send as query parameter in URL
// ✅ CORRECT - Matches backend exactly
// Backend: POST /api/booking-bikes/admin/bookings/{bookingId}/extend?newEndDateTime={epochMillis}
extendTrip: async (bookingId, epochMillis) => {
  try {
    console.log(`⏱️ [Booking API] Extending trip`);
    console.log(`  - Booking ID: ${bookingId}`);
    console.log(`  - New End DateTime (ms): ${epochMillis}`);
    console.log(`  - New End DateTime (ISO): ${new Date(epochMillis).toISOString()}`);
    
    // ✅ POST request with query parameter
    const response = await api.post(
      `/api/booking-bikes/admin/bookings/${bookingId}/extend?newEndDateTime=${epochMillis}`
    );
    
    console.log(`✅ [Booking API] Trip extended successfully:`, response.data);
    return { data: response.data };
  } catch (error) {
    console.error(`❌ [Booking API] Error extending trip:`, error);
    throw error;
  }
},


  // Confirm Razorpay payment
  confirmRazorpayPayment: async (orderId, paymentId, signature) => {
    try {
      console.log('📋 [Booking API] Confirming payment:', { orderId, paymentId });
      const response = await api.post('/api/booking-bikes/payment/razorpay/confirm', null, {
        params: { orderId, paymentId, signature }
      });
      console.log('✅ [Booking API] Payment confirmed:', response.data);
      return { data: response.data };
    } catch (error) {
      console.error('❌ [Booking API] Error confirming payment:', error);
      throw error;
    }
  },
  
  // Update charges
  updateCharges: (id, charges) => api.put(`/api/booking-bikes/${id}`, charges),
};

getAvailableBikes: async (storeId, startDate, endDate) => {
    try {
      console.log(`🚲 [Booking API] Fetching available bikes for store: ${storeId}, dates: ${startDate} to ${endDate}`);
      const response = await api.post('/api/booking-bikes/admin/available-bikes', {
        storeId: storeId,
        startDate: startDate,
        endDate: endDate
      });
      console.log('✅ [Booking API] Available bikes:', response.data);
      return { data: Array.isArray(response.data) ? response.data : [] };
    } catch (error) {
      console.error('❌ [Booking API] Error fetching available bikes:', error);
      throw error;
    }
  }
// ✅ User API - UPDATED WITH NEW ENDPOINT
export const userAPI = {
  // ✅ NEW: Get user by phone number using path parameter
  getByPhoneNumber: (phoneNumber) => api.get(`/api/auth/by-phone/${phoneNumber}`),
  
  // Get user profile
  getProfile: async () => {
    try {
      const response = await api.get('/api/auth/profile');
      return { data: response.data.data || response.data };
    } catch (error) {
      console.error('❌ [User API] Error fetching profile:', error);
      throw error;
    }
  },
  
  // Get user by ID
  getById: async (userId) => {
    try {
      console.log(`📋 [User API] Fetching user: ${userId}`);
      const response = await api.get(`/api/auth/profile/${userId}`);
      console.log(`✅ [User API] User fetched:`, response.data);
      return { data: response.data.data || response.data };
    } catch (error) {
      console.error(`❌ [User API] Error fetching user ${userId}:`, error);
      if (error.response?.status === 404) {
        return {
          data: {
            id: userId,
            name: 'N/A',
            phoneNumber: 'N/A',
            email: 'N/A'
          }
        };
      }
      throw error;
    }
  },
  
  // Update profile
  updateProfile: async (data) => {
    try {
      const response = await api.put('/api/auth/profile', data);
      return { data: response.data.data || response.data };
    } catch (error) {
      console.error('❌ [User API] Error updating profile:', error);
      throw error;
    }
  },
  
  // Get all users
  getAll: (params = {}) => api.get('/api/auth/users', { params }),
  
  // ✅ Search users
  search: (searchText) => api.get('/api/auth/search', { 
    params: { searchText } 
  }),

  complete: async (bookingId, endTripKm = null) => {
    const params = endTripKm ? `?endTripKm=${endTripKm}` : '';
    const response = await api.post(`/api/v1/admin/bookings/${bookingId}/complete${params}`);
    return response.data;
  },
  
  // Get invoice for completed booking
  getInvoice: async (bookingId) => {
    const response = await api.get(`/api/v1/admin/bookings/${bookingId}/invoice`);
    return response.data;
  }
};

export const invoiceAPI = {
  // Get invoice by booking ID
  getByBookingId: async (bookingId) => {
    try {
      console.log(`📄 [Invoice API] Fetching invoice for booking: ${bookingId}`);
      const response = await api.get(`/api/invoices/${bookingId}`);
      console.log(`✅ [Invoice API] Invoice fetched:`, response.data);
      return { data: response.data };
    } catch (error) {
      console.error(`❌ [Invoice API] Error fetching invoice:`, error);
      throw error;
    }
  }
};

// ✅ DOCUMENT API - FULLY UPDATED
export const documentAPI = {
  // Get user documents by userId - FIXED ENDPOINT
  getByUserId: async (userId) => {
    try {
      console.log(`📄 [Document API] Fetching documents for user: ${userId}`);
      const response = await api.get(`/api/documents/userdocuments/${userId}`);  // ✅ FIXED
      console.log('📄 [Document API] Response:', response.data);
      return response;
    } catch (error) {
      console.error('❌ [Document API] Error fetching documents:', error);
      throw error;
    }
  },

  // Upload documents with files
  uploadFiles: async (userId, adhaarFront, adhaarBack, drivingLicense) => {
    const formData = new FormData();
    formData.append('userId', userId);
    if (adhaarFront) formData.append('adhaarFront', adhaarFront);
    if (adhaarBack) formData.append('adhaarBack', adhaarBack);
    if (drivingLicense) formData.append('drivingLicense', drivingLicense);
    
    return api.post('/api/documents/upload-files', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  
  // Verify documents - use query params for @RequestParam
  verify: (userId, statusUpdates) => {
    return api.patch(`/api/documents/verify/${userId}`, null, {
      params: statusUpdates
    });
  },
};

// ✅ CORRECTED - Add /api prefix to match your backend
export const additionalChargeAPI = {
  save: (bookingId, chargesType, chargesAmount) => 
    api.post('/api/additional-charges/save', {
      bookingId,
      chargesType,
      chargesAmount
    }),
  
  remove: (chargeId) => 
    api.post(`/api/additional-charges/remove?id=${chargeId}`),
  
  getByBookingId: (bookingId) => 
    api.get(`/api/additional-charges/booking/${bookingId}`)
};


// Export apiClient as default and named export
export { apiClient };
export default api;
