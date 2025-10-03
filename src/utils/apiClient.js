// utils/apiClient.js - COMPLETE API CLIENT BASED ON YOUR CONTROLLER
import axios from 'axios';

// Base URL configuration
export const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:8081';

// Storage keys
export const STORAGE_KEYS = {
  TOKEN: 'auth_token',
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
      
      if (window.location.pathname !== '/login') {
        showNotification('Session expired. Please login again.', NOTIFICATION_TYPES.WARNING);
        setTimeout(() => {
          window.location.href = '/login';
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
  getAll: (params = {}) => api.get('/api/categories/all', { params }),
  getById: (id) => api.get(`/api/categories/${id}`),
  getActive: () => api.get('/api/categories/active'),
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

// ✅ Late Charges API helper functions
export const lateChargesAPI = {
  getAll: () => api.get('/api/late-charges/all'),
  getById: (id) => api.get(`/api/late-charges/${id}`),
  getActive: () => api.get('/api/late-charges/active'),
  create: (data) => api.post('/api/late-charges/add', data),
  update: (id, data) => api.put(`/api/late-charges/update/${id}`, data),
  toggleStatus: (id, isActive) => api.put(`/api/late-charges/${id}/status?isActive=${isActive}`),
  delete: (id) => api.delete(`/api/late-charges/${id}`),
};

// ✅ Booking API helper functions
export const bookingAPI = {
  getAll: () => api.get('/api/booking-bikes/allBooking'),
  getById: (id) => api.get(`/api/booking-bikes/getById/${id}`),
  accept: (id) => api.post(`/api/booking-bikes/${id}/accept`),
  cancel: (id) => api.post(`/api/booking-bikes/${id}/cancel`),
  complete: (id) => api.post(`/api/booking-bikes/${id}/complete`),
  updateCharges: (id, charges) => api.put(`/api/booking-bikes/${id}`, charges),
};

// ✅ CORRECTED: User API using YOUR AuthController endpoints
export const userAPI = {
  // Get current logged-in user's profile
  // GET /api/auth/profile
  getProfile: async () => {
    try {
      const response = await api.get('/api/auth/profile');
      // Your response format: { success: true, data: {...}, message: "...", timestamp: "..." }
      return {
        data: response.data.data || response.data // Handle both formats
      };
    } catch (error) {
      console.error('❌ USER_API - Error fetching profile:', error);
      throw error;
    }
  },
  
  // Get user by ID (for AllBookings component)
  // GET /api/auth/profile/{userId}
  getById: async (userId) => {
    try {
      console.log(`📋 USER_API - Fetching user profile for ID: ${userId}`);
      const response = await api.get(`/api/auth/profile/${userId}`);
      
      // Your response format: { success: true, data: {...}, message: "...", timestamp: "..." }
      console.log(`✅ USER_API - User profile fetched for ID: ${userId}`);
      
      return {
        data: response.data.data || response.data
      };
    } catch (error) {
      console.error(`❌ USER_API - Error fetching user ${userId}:`, error);
      
      // Return minimal data if user not found
      if (error.response?.status === 404) {
        return {
          data: {
            id: userId,
            name: 'N/A',
            phoneNumber: 'N/A',
            email: 'N/A',
            adhaarFrontStatus: 'PENDING',
            adhaarBackStatus: 'PENDING',
            drivingLicenseStatus: 'PENDING',
            adhaarFrontUrl: null,
            adhaarBackUrl: null,
            drivingLicenseUrl: null,
          }
        };
      }
      
      throw error;
    }
  },
  
  // Update current user's profile
  // PUT /api/auth/profile
  updateProfile: async (data) => {
    try {
      const response = await api.put('/api/auth/profile', data);
      return {
        data: response.data.data || response.data
      };
    } catch (error) {
      console.error('❌ USER_API - Error updating profile:', error);
      throw error;
    }
  },
  
  // Get all users (if you have this endpoint)
  getAll: (params = {}) => api.get('/api/users/all', { params }),
};

// ✅ Document API helper functions
export const documentAPI = {
  // Get documents by user ID
  getByUserId: (userId) => api.get(`/api/documents/${userId}`),
  
  // Upload documents
  upload: (formData) => api.post('/api/documents/upload-files', formData),
  
  // Verify document
  verify: (userId, documentType, status) => 
    api.put('/api/documents/verify', null, { 
      params: { userId, documentType, status } 
    }),
};

// Export apiClient as default and named export
export { apiClient };
export default api;
