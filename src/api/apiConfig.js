

import axios from 'axios';
// ✅ Named exports
export const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:8080';
console.log('🔗 API Configuration Loaded');
console.log('📍 Base URL:', BASE_URL);
console.log('🌍 Environment:', import.meta.env.MODE);
// ✅ Token storage keys
const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  USER: 'auth_user'
};
// ✅ Check if JWT token is valid
const isTokenValid = (token) => {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const isValid = payload.exp * 1000 > Date.now();
    if (!isValid) {
      console.warn('⚠️ Token expired');
    }
    return isValid;
  } catch (error) {
    console.error('❌ Invalid token format:', error);
    return false;
  }
};
// ✅ Get valid token from storage
const getToken = () => {
  let token = localStorage.getItem(STORAGE_KEYS.TOKEN);

  if (!token) {
    token = localStorage.getItem('token');
  }

  if (token && !isTokenValid(token)) {
    console.warn('⚠️ Token found but invalid - clearing storage');
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem('token');
    return null;
  }

  return token;
};
// ✅ Create axios instance WITHOUT /api in baseURL
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
  timeout: 30000,
});
// ✅ Request Interceptor
apiClient.interceptors.request.use(
  (config) => {
    if (import.meta.env.DEV) {
      console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`);
    }
    // Skip auth for public endpoints
    const publicEndpoints = [
      '/admin/login',
      '/auth/login',
      '/auth/register',
      '/auth/send-otp',
      '/auth/verify-otp'
    ];

    if (publicEndpoints.some(endpoint => config.url.includes(endpoint))) {
      delete config.headers.Authorization;
      return config;
    }
    // Handle FormData - let browser set Content-Type with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    // Add JWT token
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      if (import.meta.env.DEV) {
        console.log('🔐 Token attached');
      }
    } else {
      if (import.meta.env.DEV) {
        console.warn('⚠️ No valid token found');
      }
    }

    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);
// ✅ Response Interceptor
apiClient.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url}:`, response.status);
    }
    return response;
  },
  (error) => {
    if (import.meta.env.DEV) {
      console.error(
        `❌ ${error.config?.method?.toUpperCase()} ${error.config?.url}:`,
        error.response?.status,
        error.response?.data
      );
    }
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      console.error('🔐 Unauthorized - Clearing tokens');
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.removeItem('token');

      if (!['/login', '/admin-login'].includes(window.location.pathname)) {
        window.location.href = '/login';
      }
    }
    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.error('🚫 Access forbidden');
    }
    // Handle 500+ Server errors
    if (error.response?.status >= 500) {
      console.error('💥 Server error:', error.response?.status);
    }
    return Promise.reject(error);
  }
);
// ✅ Helper: Create FormData
export const createFormData = (data) => {
  const formData = new FormData();
  Object.keys(data).forEach(key => {
    const value = data[key];

    if (value !== null && value !== undefined) {
      if (value instanceof File) {
        formData.append(key, value);
      } else if (Array.isArray(value)) {
        value.forEach((item) => {
          if (item instanceof File) {
            formData.append(key, item);
          } else {
            formData.append(key, item);
          }
        });
      } else if (typeof value === 'object') {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value);
      }
    }
  });
  return formData;
};
// ✅ BIKE API - Matches BikeController
// export const bikeAPI = {
//   getAll: () => apiClient.get('/api/bikes/all'),
//   getById: (id) => apiClient.get(`/api/bikes/${id}`),
//   getAvailable: (params) => apiClient.get('/api/bikes/available', { params }),
//   create: (bikeData) => {
//     const formData = createFormData(bikeData);
//     return apiClient.post('/api/bikes/add', formData);
//   },
//   update: (id, bikeData) => {
//     const formData = createFormData(bikeData);
//     return apiClient.put(`/api/bikes/update/${id}`, formData);
//   },
//   delete: (id) => apiClient.delete(`/api/bikes/${id}`),
//   toggleStatus: (id) => apiClient.patch(`/api/bikes/${id}/status`),
// };
export const bikeAPI = {
  getAll: () => apiClient.get("/api/bikes/all"),
  getById: (id) => apiClient.get(`/api/bikes/${id}`),
  getAvailable: (params) => apiClient.get("/api/bikes/available", { params }),

  // ✅ FIX: Don't wrap FormData again!
  create: (bikeData) => {
    // If bikeData is already FormData, send it directly
    if (bikeData instanceof FormData) {
      return apiClient.post("/api/bikes/add", bikeData);
    }
    // Otherwise create FormData
    const formData = createFormData(bikeData);
    return apiClient.post("/api/bikes/add", formData);
  },

  // ✅ FIX: Same for update
  update: (id, bikeData) => {
    // If bikeData is already FormData, send it directly
    if (bikeData instanceof FormData) {
      return apiClient.put(`/api/bikes/update/${id}`, bikeData);
    }
    // Otherwise create FormData
    const formData = createFormData(bikeData);
    return apiClient.put(`/api/bikes/update/${id}`, formData);
  },

  delete: (id) => apiClient.delete(`/api/bikes/${id}`),
  toggleStatus: (id) => apiClient.patch(`/api/bikes/${id}/status`),
};
// ✅ BRAND API
export const brandAPI = {
  getAll: (params = {}) => apiClient.get('/api/brands/all', { params }),
  getActive: () => apiClient.get('/api/brands/active'),
  getById: (id) => apiClient.get(`/api/brands/${id}`),
  create: (brandData, image = null) => {
    const formData = new FormData();
    formData.append('brandName', brandData.brandName);
    if (image) formData.append('image', image);
    return apiClient.post('/api/brands/add', formData);
  },
  update: (id, brandData, image = null) => {
    const formData = new FormData();
    formData.append('brandName', brandData.brandName);
    if (image) formData.append('image', image);
    return apiClient.post(`/api/brands/edit/${id}`, formData);
  },
  toggleStatus: (id) => apiClient.patch(`/api/brands/${id}/status`),
  delete: (id) => apiClient.delete(`/api/brands/delete/${id}`),
};
// ✅ MODEL API
export const modelAPI = {
  getAll: (params = {}) => apiClient.get('/api/models/all', { params }),
  getActive: () => apiClient.get('/api/models/active'),
  getById: (id) => apiClient.get(`/api/models/${id}`),
  create: (modelData) => apiClient.post('/api/models/add', modelData),
  update: (id, modelData) => apiClient.post(`/api/models/edit/${id}`, modelData),
  toggleStatus: (id) => apiClient.patch(`/api/models/${id}/status`),
  delete: (id) => apiClient.delete(`/api/models/delete/${id}`),
};
// ✅ STORE API
export const storeAPI = {
  getAll: (params = {}) => apiClient.get('/api/stores/all', { params }),
  getById: (id) => apiClient.get(`/api/stores/${id}`),
  getActive: () => apiClient.get('/api/stores/active'),
  // ✅ UPDATED storeAPI.create() - Add cityId
create: (storeData, image = null) => {
  const formData = new FormData();
  formData.append('storeName', storeData.storeName);
  formData.append('storeContactNumber', storeData.storeContactNumber);
  formData.append('storeAddress', storeData.storeAddress);

  if (storeData.storeUrl) formData.append('storeUrl', storeData.storeUrl);
  if (storeData.storeGstinNumber) formData.append('storeGstinNumber', storeData.storeGstinNumber);
  if (storeData.storeLatitude) formData.append('storeLatitude', storeData.storeLatitude);
  if (storeData.storeLongitude) formData.append('storeLongitude', storeData.storeLongitude);
  if (storeData.cityId) formData.append('cityId', storeData.cityId); // ✅ ADD THIS LINE
  if (storeData.addedBy) formData.append('addedBy', storeData.addedBy);
  if (image) formData.append('storeImage', image);

  return apiClient.post('/api/stores/add', formData);
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

    return apiClient.post(`/api/stores/edit/${id}`, formData);
  },
  toggleStatus: (id) => apiClient.put(`/api/stores/${id}/status`),
  delete: (id) => apiClient.delete(`/api/stores/delete/${id}`),
};
// ✅ CATEGORY API
export const categoryAPI = {
  getAll: (params = {}) => apiClient.get('/api/categories/all', { params }),
  getById: (id) => apiClient.get(`/api/categories/${id}`),
  getActive: () => apiClient.get('/api/categories/active'),
  create: (categoryData, image = null) => {
    const formData = new FormData();
    formData.append('categoryName', categoryData.categoryName);
    if (image) formData.append('image', image);
    return apiClient.post('/api/categories/add', formData);
  },
  update: (id, categoryData, image = null) => {
    const formData = new FormData();
    formData.append('categoryName', categoryData.categoryName);
    if (image) formData.append('image', image);
    return apiClient.post(`/api/categories/edit/${id}`, formData);
  },
  toggleStatus: (id) => apiClient.get(`/api/categories/status/${id}`),
  delete: (id) => apiClient.delete(`/api/categories/delete/${id}`),
  search: (name, params = {}) => apiClient.get('/api/categories/search', { params: { name, ...params } }),
};
// ✅ CITY API - Matches CityController
export const cityAPI = {
  getAll: (params = {}) => apiClient.get('/api/cities', { params }),
  getById: (id) => apiClient.get(`/api/cities/${id}`),
  getActive: () => apiClient.get('/api/cities/active'),
  create: (cityData, image = null) => {
    const formData = new FormData();
    formData.append('cityDto', JSON.stringify(cityData));
    if (image) formData.append('image', image);
    return apiClient.post('/api/cities/add', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  update: (id, cityData, image = null) => {
    const formData = new FormData();
    formData.append('cityDto', JSON.stringify(cityData));
    if (image) formData.append('image', image);
    return apiClient.put(`/api/cities/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  toggleStatus: (id) => apiClient.patch(`/api/cities/${id}/toggle-status`)
};
// ✅ LATE CHARGES API
export const lateChargesAPI = {
  getAll: () => apiClient.get('/api/late-charges/all'),
  getById: (id) => apiClient.get(`/api/late-charges/${id}`),
  getActive: () => apiClient.get('/api/late-charges/active'),
  create: (data) => apiClient.post('/api/late-charges/add', data),
  update: (id, data) => apiClient.put(`/api/late-charges/update/${id}`, data),
  toggleStatus: (id, isActive) => apiClient.put(`/api/late-charges/${id}/status?isActive=${isActive}`),
  delete: (id) => apiClient.delete(`/api/late-charges/${id}`),
};
// ✅ AUTH/USER API
export const authAPI = {
  login: (credentials) => apiClient.post('/api/auth/login', credentials),
  adminLogin: (credentials) => apiClient.post('/api/admin/login', credentials),
  register: (userData) => apiClient.post('/api/auth/register', userData),
  sendOtp: (phoneNumber) => apiClient.post('/api/auth/send-otp', { phoneNumber }),
  verifyOtp: (phoneNumber, otp) => apiClient.post('/api/auth/verify-otp', { phoneNumber, otp }),
  getUsers: (params = {}) => apiClient.get('/api/auth/users', { params }),
  getUserById: (id) => apiClient.get(`/api/auth/users/${id}`),
  updateUser: (id, userData) => apiClient.put(`/api/auth/users/${id}`, userData),
  deleteUser: (id) => apiClient.delete(`/api/auth/users/${id}`),
};
// ✅ DOCUMENT API
// ✅ DOCUMENT API - FIXED TO MATCH BACKEND EXACTLY
export const documentAPI = {
  // Get user documents
  getUserDocuments: (userId) => apiClient.get(`/api/documents/${userId}`),
  
  // Upload documents with files
  uploadFiles: (userId, adhaarFront, adhaarBack, drivingLicense) => {
    const formData = new FormData();
    formData.append('userId', userId);
    if (adhaarFront) formData.append('adhaarFront', adhaarFront);
    if (adhaarBack) formData.append('adhaarBack', adhaarBack);
    if (drivingLicense) formData.append('drivingLicense', drivingLicense);
    
    return apiClient.post('/api/documents/upload-files', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  
  // Verify documents - FIXED: Use VerificationStatus enum values
  verify: (userId, statusUpdates) => {
    // statusUpdates format: { adhaarFrontStatus: 'APPROVED', adhaarBackStatus: 'REJECTED', etc. }
    return apiClient.patch(`/api/documents/verify/${userId}`, null, {
      params: statusUpdates
    });
  },
};

// ✅ BOOKING API
export const bookingAPI = {
  getAll: (params = {}) => apiClient.get('/api/booking-bikes/allBooking', { params }),
  getById: (id) => apiClient.get(`/api/booking-bikes/getById/${id}`),
  getByCustomer: (customerId, params = {}) =>
    apiClient.get('/api/booking-bikes/by-customer', { params: { customerId, ...params } }),
  create: (bookingData) => apiClient.post('/api/booking-bikes/create', bookingData),
  accept: (bookingId) => apiClient.post(`/api/booking-bikes/${bookingId}/accept`),
  cancel: (bookingId, cancelledBy = 'USER') =>
    apiClient.post(`/api/booking-bikes/${bookingId}/cancel`, null, { params: { cancelledBy } }),
  startTrip: (bookingId, images) => {
    const formData = new FormData();
    images.forEach((image) => formData.append('images', image));
    return apiClient.post(`/api/booking-bikes/${bookingId}/start`, formData);
  },
  endTrip: (bookingId, images) => {
    const formData = new FormData();
    images.forEach((image) => formData.append('images', image));
    return apiClient.post(`/api/booking-bikes/${bookingId}/end`, formData);
  },
  // ✅ UPDATED - Add endTripKm parameter
complete: (bookingId, endTripKm = null) => {
  console.log('📤 Completing booking:', { bookingId, endTripKm });
  
  let url = `/api/booking-bikes/${bookingId}/complete`;
  
  // ✅ ONLY send as query parameter, no FormData
  if (endTripKm) {
    url += `?endTripKm=${parseFloat(endTripKm)}`;
    console.log('✅ URL with param:', url);
  }
  
  // ✅ Send ONLY the URL, no body, no FormData
  return apiClient.post(url);
},





  updateCharges: (bookingId, charges) =>
    apiClient.patch(`/api/booking-bikes/${bookingId}/charges`, charges),
  getInvoice: (bookingId) =>
    apiClient.get(`/api/booking-bikes/${bookingId}/invoice`, { responseType: 'blob' }),
};
// ✅ Export apiClient
export { apiClient };
// ✅ Default export
export default apiClient;
