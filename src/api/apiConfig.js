import axios from 'axios';

// Named exports
export const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:8081';

const isTokenValid = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch (error) {
    return false;
  }
};

// ✅ Updated: Create axios instance with dynamic backend URL from BASE_URL env
const apiClient = axios.create({
  baseURL: `${BASE_URL}/api`, // Use BASE_URL env variable for backend prefix + /api
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
  timeout: 10000,
});

// Configure interceptors
apiClient.interceptors.request.use((config) => {
  // Skip auth for login endpoints
  if (config.url.includes('/admin/login') || config.url.includes('/auth/login')) {
    delete config.headers.Authorization;
    return config;
  }

  // Handle multipart form data for file uploads
  if (config.data instanceof FormData) {
    config.headers['Content-Type'] = 'multipart/form-data';
  }

  // Add authorization token
  const token = localStorage.getItem('token');
  if (token && isTokenValid(token)) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    localStorage.removeItem('token');
  }
  
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url}:`, response.data);
    }
    return response;
  },
  (error) => {
    if (import.meta.env.DEV) {
      console.error(`❌ ${error.config?.method?.toUpperCase()} ${error.config?.url}:`, error.response?.data || error.message);
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    if (error.response?.status === 403) {
      console.error('Access forbidden - Check backend security configuration');
    }

    if (error.response?.status >= 500) {
      console.error('Server error occurred');
    }

    return Promise.reject(error);
  }
);

// Helper function to create FormData for file uploads
export const createFormData = (data) => {
  const formData = new FormData();

  Object.keys(data).forEach(key => {
    if (data[key] !== null && data[key] !== undefined) {
      if (data[key] instanceof File) {
        formData.append(key, data[key]);
      } else if (typeof data[key] === 'object') {
        formData.append(key, JSON.stringify(data[key]));
      } else {
        formData.append(key, data[key]);
      }
    }
  });

  return formData;
};

// Store API helper functions (NEW)
export const storeAPI = {
  getAll: (params = {}) => apiClient.get('/stores/all', { params }),
  getById: (id) => apiClient.get(`/stores/${id}`),
  getActive: () => apiClient.get('/stores/active'),
  create: (storeData, image = null) => {
    const formData = new FormData();
    
    // Add all store fields
    formData.append('storeName', storeData.storeName);
    formData.append('storeContactNumber', storeData.storeContactNumber);
    formData.append('storeAddress', storeData.storeAddress);
    
    if (storeData.storeUrl) formData.append('storeUrl', storeData.storeUrl);
    if (storeData.storeGstinNumber) formData.append('storeGstinNumber', storeData.storeGstinNumber);
    if (storeData.storeLatitude) formData.append('storeLatitude', storeData.storeLatitude);
    if (storeData.storeLongitude) formData.append('storeLongitude', storeData.storeLongitude);
    if (storeData.addedBy) formData.append('addedBy', storeData.addedBy);
    if (image) formData.append('storeImage', image);
    
    return apiClient.post('/stores/add', formData);
  },
  update: (id, storeData, image = null) => {
    const formData = new FormData();
    
    // Add all store fields
    if (storeData.storeName) formData.append('storeName', storeData.storeName);
    if (storeData.storeContactNumber) formData.append('storeContactNumber', storeData.storeContactNumber);
    if (storeData.storeAddress) formData.append('storeAddress', storeData.storeAddress);
    if (storeData.storeUrl) formData.append('storeUrl', storeData.storeUrl);
    if (storeData.storeGstinNumber) formData.append('storeGstinNumber', storeData.storeGstinNumber);
    if (storeData.storeLatitude) formData.append('storeLatitude', storeData.storeLatitude);
    if (storeData.storeLongitude) formData.append('storeLongitude', storeData.storeLongitude);
    if (storeData.addedBy) formData.append('addedBy', storeData.addedBy);
    if (image) formData.append('storeImage', image);
    
    return apiClient.post(`/stores/edit/${id}`, formData);
  },
  toggleStatus: (id) => apiClient.put(`/stores/${id}/status`),
  delete: (id) => apiClient.delete(`/stores/delete/${id}`),
};

// Category API helper functions
export const categoryAPI = {
  getAll: (params = {}) => apiClient.get('/categories/all', { params }),
  getById: (id) => apiClient.get(`/categories/${id}`),
  getActive: () => apiClient.get('/categories/active'),
  create: (categoryData, image = null) => {
    const formData = new FormData();
    formData.append('categoryName', categoryData.categoryName);
    if (image) {
      formData.append('image', image);
    }
    return apiClient.post('/categories/add', formData);
  },
  update: (id, categoryData, image = null) => {
    const formData = new FormData();
    formData.append('categoryName', categoryData.categoryName);
    if (image) {
      formData.append('image', image);
    }
    return apiClient.post(`/categories/edit/${id}`, formData);
  },
  toggleStatus: (id) => apiClient.get(`/categories/status/${id}`),
  delete: (id) => apiClient.delete(`/categories/delete/${id}`),
  search: (name, params = {}) => apiClient.get('/categories/search', { params: { name, ...params } }),
};

// Late Charges API helper functions
export const lateChargesAPI = {
  getAll: () => apiClient.get('/late-charges/all'),
  getById: (id) => apiClient.get(`/late-charges/${id}`),
  getActive: () => apiClient.get('/late-charges/active'),
  create: (data) => apiClient.post('/late-charges/add', data),
  update: (id, data) => apiClient.put(`/late-charges/update/${id}`, data),
  toggleStatus: (id, isActive) => apiClient.put(`/late-charges/${id}/status?isActive=${isActive}`),
  delete: (id) => apiClient.delete(`/late-charges/${id}`),
};

// ✅ FIXED: Export apiClient as named export
export { apiClient };

// Keep default export for backwards compatibility
export default apiClient;
