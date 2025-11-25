// pages/AdminLogin.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import apiClient from "../api/apiConfig";

const AdminLogin = () => {
  const navigate = useNavigate();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    general: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    const token = localStorage.getItem("token");
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    
    if (isLoggedIn === "true" && token) {
      navigate("/dashboard", { replace: true });
    }
  };

  const validateEmail = (email) => {
    if (!email.trim()) {
      return "Email is required";
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return "Please enter a valid email address (e.g., user@example.com)";
    }
    
    return "";
  };

  const validatePassword = (password) => {
    if (!password) {
      return "Password is required";
    }
    
    if (password.length < 6) {
      return "Password must be at least 6 characters long";
    }
    
    if (password.length > 50) {
      return "Password must not exceed 50 characters";
    }
    
    return "";
  };

  const validateForm = () => {
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    
    setErrors({
      email: emailError,
      password: passwordError,
      general: ""
    });
    
    return !emailError && !passwordError;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Clear all errors
    setErrors({ email: "", password: "", general: "" });

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    // Try admin login first, then store manager
    try {
      const adminResponse = await attemptLogin('/api/auth/admin/login');
      if (adminResponse.success) {
        handleLoginSuccess(adminResponse.data, 'admin');
        return;
      }
    } catch (adminError) {
      // If admin login fails, try store manager
      try {
        const managerResponse = await attemptLogin('/api/auth/store-manager/login');
        if (managerResponse.success) {
          handleLoginSuccess(managerResponse.data, 'store-manager');
          return;
        }
      } catch (managerError) {
        // Both failed - show detailed error
        handleLoginError(managerError);
      }
    }
  };

  const attemptLogin = async (endpoint) => {
    const response = await apiClient.post(endpoint, {
      email: email.trim(),
      password: password
    });
    return { success: true, data: response.data };
  };

  const handleLoginSuccess = (data, userType) => {
    localStorage.clear();
    
    const userData = data.user;
    const token = data.token;
    
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("token", token);
    localStorage.setItem("authToken", token);
    localStorage.setItem("userEmail", userData.email);
    localStorage.setItem("userName", userData.name);
    localStorage.setItem("userId", userData.id.toString());
    localStorage.setItem("userRole", userData.roleId.toString());
    localStorage.setItem("userType", userType);
    
    if (userData.storeId) {
      localStorage.setItem("storeId", userData.storeId.toString());
    }
    
    localStorage.setItem("loginTime", Date.now().toString());
    
    window.dispatchEvent(new Event('authChange'));
    
    toast.success("Login successful! Welcome back.", {
      position: "top-right",
      autoClose: 2000
    });
    
    setTimeout(() => {
      navigate("/dashboard", { replace: true });
    }, 500);
  };

  const handleLoginError = (error) => {
    setIsLoading(false);
    
    let generalError = "";
    let emailError = "";
    let passwordError = "";
    
    // Network errors
    if (error.code === 'ERR_NETWORK' || !error.response) {
      generalError = "Unable to connect to server. Please check your internet connection and try again.";
    }
    // Server errors
    else if (error.response?.status >= 500) {
      generalError = "Server error occurred. Please try again later or contact support.";
    }
    // Authentication errors (401 - Wrong credentials)
    else if (error.response?.status === 401) {
      // ✅ Show "Please check email or password" error
      generalError = "Invalid credentials. Please check your email or password and try again.";
      emailError = "Please check your email";
      passwordError = "Please check your password";
    }
    // Authorization errors (403 - No permission)
    else if (error.response?.status === 403) {
      generalError = "Access denied. You don't have permission to access this system.";
    }
    // Validation errors from server (400)
    else if (error.response?.status === 400) {
      const serverMessage = error.response.data?.message || "";
      const serverErrors = error.response.data?.errors || {};
      
      if (serverErrors.email) {
        emailError = serverErrors.email;
      }
      if (serverErrors.password) {
        passwordError = serverErrors.password;
      }
      
      if (!emailError && !passwordError) {
        generalError = serverMessage || "Invalid request. Please check your input.";
      }
    }
    // Other errors
    else if (error.response?.data?.message) {
      generalError = error.response.data.message;
    }
    // Default error for wrong credentials
    else {
      generalError = "Login failed. Please check your email or password and try again.";
      emailError = "Please verify your email";
      passwordError = "Please verify your password";
    }
    
    setErrors({
      email: emailError,
      password: passwordError,
      general: generalError
    });
    
    // Show toast notification
    if (generalError) {
      toast.error(generalError, {
        position: "top-right",
        autoClose: 5000
      });
    }
    
    // Shake animation
    const form = document.getElementById("login-form");
    if (form) {
      form.classList.add("animate-shake");
      setTimeout(() => form.classList.remove("animate-shake"), 500);
    }
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    
    // Clear email error on change
    if (errors.email || errors.general) {
      setErrors(prev => ({ ...prev, email: "", general: "" }));
    }
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    
    // Clear password error on change
    if (errors.password || errors.general) {
      setErrors(prev => ({ ...prev, password: "", general: "" }));
    }
  };

  const handleEmailBlur = () => {
    if (email.trim()) {
      const emailError = validateEmail(email);
      if (emailError) {
        setErrors(prev => ({ ...prev, email: emailError }));
      }
    }
  };

  const handlePasswordBlur = () => {
    if (password) {
      const passwordError = validatePassword(password);
      if (passwordError) {
        setErrors(prev => ({ ...prev, password: passwordError }));
      }
    }
  };

  const isFormValid = email.trim() && password.trim() && !errors.email && !errors.password;

  return (
    <div
      className="flex items-center justify-center min-h-screen bg-cover bg-center"
      style={{
        backgroundImage: "url('/vegobike_admin.jpg')",
        backgroundBlendMode: "overlay",
        backgroundColor: "rgba(0, 0, 0, 0.6)",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/70 via-purple-900/70 to-pink-900/70 z-0" />
      
      <div
        className={`w-full max-w-md p-8 bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg shadow-2xl rounded-2xl transition-all duration-700 transform z-10
          ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
      >
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-xl transform hover:scale-105 transition-transform">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-white" />
          </div>
        </div>
        
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Sign in to access your dashboard
          </p>
        </div>
        
        {/* General Error Message */}
        {errors.general && !isLoading && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl animate-fadeIn">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 text-red-600 dark:text-red-400 mr-3 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm text-red-800 dark:text-red-200 font-medium">{errors.general}</p>
            </div>
          </div>
        )}
        
        {/* Loading State */}
        {isLoading && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl animate-fadeIn">
            <div className="flex items-center">
              <svg className="animate-spin w-5 h-5 text-blue-600 dark:text-blue-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                Signing you in...
              </p>
            </div>
          </div>
        )}
        
        {/* Login Form */}
        <form id="login-form" onSubmit={handleLogin} className="space-y-5">
          {/* Email Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className={`w-5 h-5 ${errors.email ? 'text-red-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
              <input
                type="email"
                className={`w-full pl-12 pr-12 py-3.5 bg-gray-50 dark:bg-gray-700/50 border rounded-xl focus:ring-2 focus:border-transparent dark:text-white transition-all text-base ${
                  errors.email 
                    ? 'border-red-500 focus:ring-red-500 bg-red-50 dark:bg-red-900/20' 
                    : 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500'
                }`}
                placeholder="Enter your email"
                value={email}
                onChange={handleEmailChange}
                onBlur={handleEmailBlur}
                disabled={isLoading}
                required
                autoComplete="email"
                autoFocus
              />
              {errors.email && (
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            {errors.email && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center animate-fadeIn">
                <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.email}
              </p>
            )}
          </div>
          
          {/* Password Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className={`w-5 h-5 ${errors.password ? 'text-red-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                type="password"
                className={`w-full pl-12 pr-12 py-3.5 bg-gray-50 dark:bg-gray-700/50 border rounded-xl focus:ring-2 focus:border-transparent dark:text-white transition-all text-base ${
                  errors.password 
                    ? 'border-red-500 focus:ring-red-500 bg-red-50 dark:bg-red-900/20' 
                    : 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500'
                }`}
                placeholder="Enter your password"
                value={password}
                onChange={handlePasswordChange}
                onBlur={handlePasswordBlur}
                disabled={isLoading}
                required
                autoComplete="current-password"
              />
              {errors.password && (
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            {errors.password && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center animate-fadeIn">
                <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.password}
              </p>
            )}
          </div>
          
          {/* Submit Button */}
          <button
            type="submit"
            className={`w-full py-3.5 px-4 text-white font-semibold rounded-xl transition-all duration-300 text-base shadow-lg mt-6
              ${
                isLoading || !isFormValid
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
              }`}
            disabled={isLoading || !isFormValid}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    fill="none"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Signing In...
              </div>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
        
        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Secure access for authorized personnel
          </p>
        </div>
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
          20%, 40%, 60%, 80% { transform: translateX(10px); }
        }
        
        .animate-shake {
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97);
        }

        @keyframes fadeIn {
          from { 
            opacity: 0; 
            transform: translateY(-10px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default AdminLogin;
