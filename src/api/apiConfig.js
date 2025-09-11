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

// ✅ Updated: Create axios instance with correct backend URL
const apiClient = axios.create({
  baseURL: 'http://localhost:8081/api', // ✅ Direct backend URL with /api
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // ✅ Set to false if backend doesn't require credentials
  timeout: 10000, // ✅ Add timeout
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
    // Log successful responses in development
    if (import.meta.env.DEV) {
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url}:`, response.data);
    }
    return response;
  },
  (error) => {
    // Log errors in development
    if (import.meta.env.DEV) {
      console.error(`❌ ${error.config?.method?.toUpperCase()} ${error.config?.url}:`, error.response?.data || error.message);
    }

    // Handle unauthorized access
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    // Handle other common errors
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

// Category API helper functions
export const categoryAPI = {
  getAll: (params = {}) => {
    return apiClient.get('/categories/all', { params });
  },
  getById: (id) => {
    return apiClient.get(`/categories/${id}`);
  },
  getActive: () => {
    return apiClient.get('/categories/active');
  },
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
  toggleStatus: (id) => {
    return apiClient.get(`/categories/status/${id}`);
  },
  delete: (id) => {
    return apiClient.delete(`/categories/delete/${id}`);
  },
  search: (name, params = {}) => {
    return apiClient.get('/categories/search', { 
      params: { name, ...params } 
    });
  }
};

// ✅ Added: Late Charges API helper functions
export const lateChargesAPI = {
  getAll: () => {
    return apiClient.get('/late-charges/all');
  },
  getById: (id) => {
    return apiClient.get(`/late-charges/${id}`);
  },
  getActive: () => {
    return apiClient.get('/late-charges/active');
  },
  create: (data) => {
    return apiClient.post('/late-charges/add', data);
  },
  update: (id, data) => {
    return apiClient.put(`/late-charges/update/${id}`, data);
  },
  toggleStatus: (id, isActive) => {
    return apiClient.put(`/late-charges/${id}/status?isActive=${isActive}`);
  },
  delete: (id) => {
    return apiClient.delete(`/late-charges/${id}`);
  }
};

// Export as both named and default
export default apiClient;
