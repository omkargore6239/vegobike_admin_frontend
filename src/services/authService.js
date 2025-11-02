// services/authService.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/auth'; // Adjust to your backend URL

const authService = {
  
  // Store Manager Registration
  registerStoreManager: async (data) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/store-manager/register`,
        {
          name: data.name,
          email: data.email,
          phoneNumber: data.phoneNumber,
          password: data.password,
          passwordConfirmation: data.passwordConfirmation,
          storeId: data.storeId
        }
      );
      
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Registration failed' };
    }
  },

  // Store Manager Login
  storeManagerLogin: async (email, password) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/store-manager/login`,
        {
          email: email.trim(),
          password: password
        }
      );
      
      if (response.data.token && response.data.user) {
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Login failed' };
    }
  },

  // Get stored user
  getUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Get token
  getToken: () => {
    return localStorage.getItem('authToken');
  },

  // Logout
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }
};

export default authService;
