import axios from 'axios';

// Named exports
export const BASE_URL = import.meta.env.VITE_BASE_URL;

const isTokenValid = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch (error) {
    return false;
  }
};

// Create axios instance
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL + '/api', // Added /api to match your backend
  headers: {
    'Content-Type': 'application/json',
  },
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
      // Redirect to login page instead of reload if you have routing
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    // Handle other common errors
    if (error.response?.status === 403) {
      console.error('Access forbidden');
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
  // Get all categories with pagination
  getAll: (params = {}) => {
    return apiClient.get('/categories/all', { params });
  },

  // Get category by ID
  getById: (id) => {
    return apiClient.get(`/categories/${id}`);
  },

  // Get active categories
  getActive: () => {
    return apiClient.get('/categories/active');
  },

  // Create new category
  create: (categoryData, image = null) => {
    const formData = new FormData();
    formData.append('categoryName', categoryData.categoryName);
    if (image) {
      formData.append('image', image);
    }
    return apiClient.post('/categories/add', formData);
  },

  // Update category
  update: (id, categoryData, image = null) => {
    const formData = new FormData();
    formData.append('categoryName', categoryData.categoryName);
    if (image) {
      formData.append('image', image);
    }
    return apiClient.post(`/categories/edit/${id}`, formData);
  },

  // Toggle category status
  toggleStatus: (id) => {
    return apiClient.get(`/categories/status/${id}`);
  },

  // Delete category
  delete: (id) => {
    return apiClient.delete(`/categories/delete/${id}`);
  },

  // Search categories
  search: (name, params = {}) => {
    return apiClient.get('/categories/search', { 
      params: { name, ...params } 
    });
  }
};

// Export as both named and default
export default apiClient;
