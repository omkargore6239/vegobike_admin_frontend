// pages/AdminLogin.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import apiClient, { BASE_URL } from "../api/apiConfig";


const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState("admin"); // admin or store-manager
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("checking");
  const [retryCount, setRetryCount] = useState(0);
  const [validationErrors, setValidationErrors] = useState({});


  const ErrorTypes = {
    NETWORK: 'NETWORK',
    VALIDATION: 'VALIDATION',
    AUTHENTICATION: 'AUTHENTICATION',
    AUTHORIZATION: 'AUTHORIZATION',
    SERVER: 'SERVER',
    UNKNOWN: 'UNKNOWN'
  };


  const getErrorInfo = (error) => {
    let type = ErrorTypes.UNKNOWN;
    let message = "An unexpected error occurred";
    let isRetryable = false;
    let suggestions = [];

    if (!error) return { type, message, isRetryable, suggestions };

    if (error.code === 'ERR_NETWORK' || error.message?.toLowerCase().includes('network')) {
      type = ErrorTypes.NETWORK;
      message = `Unable to connect to server at ${BASE_URL}`;
      isRetryable = true;
      suggestions = [
        "Check your internet connection",
        "Verify the backend server is running on port 8080",
        "Ensure CORS is properly configured"
      ];
    }
    else if (error.response?.status) {
      const status = error.response.status;
      const serverMessage = error.response.data?.message || error.response.data?.error;

      switch (status) {
        case 400:
          type = ErrorTypes.VALIDATION;
          message = serverMessage || "Invalid request data";
          suggestions = ["Please verify your email and password"];
          break;
        case 401:
          type = ErrorTypes.AUTHENTICATION;
          message = "Invalid email or password. Please check your credentials and try again";
          suggestions = ["Double-check your email and password"];
          break;
        case 403:
          type = ErrorTypes.AUTHORIZATION;
          message = userType === "admin" 
            ? "Admin privileges required. Please contact your administrator for access"
            : "Store manager privileges required. Please contact your administrator for access";
          suggestions = ["Contact your administrator for proper access"];
          break;
        case 500:
        case 502:
        case 503:
          type = ErrorTypes.SERVER;
          message = "Server error occurred. Please try again later";
          isRetryable = true;
          suggestions = ["Try again in a few moments", "Contact support if the problem persists"];
          break;
        default:
          message = serverMessage || `Server error (${status}). Please try again`;
          isRetryable = status >= 500;
      }
    }
    else if (error.code === 'ECONNREFUSED') {
      type = ErrorTypes.NETWORK;
      message = "Connection refused. Please check if the backend server is running";
      isRetryable = true;
      suggestions = ["Ensure backend server is running on port 8080"];
    }
    else if (error.message) {
      message = error.message;
    }

    return { type, message, isRetryable, suggestions };
  };


  const showErrorNotification = (error, context = "") => {
    const errorInfo = getErrorInfo(error);
    const contextMessage = context ? `${context}: ` : "";
    
    console.error(`❌ ${contextMessage}${errorInfo.message}`, error);
    
    toast.error(
      <div>
        <div className="font-medium">{contextMessage}{errorInfo.message}</div>
        {errorInfo.suggestions.length > 0 && (
          <div className="text-sm mt-1 opacity-90">
            {errorInfo.suggestions[0]}
          </div>
        )}
      </div>,
      {
        position: "top-right",
        autoClose: errorInfo.type === ErrorTypes.NETWORK ? 8000 : 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      }
    );

    setError(`${contextMessage}${errorInfo.message}`);
    return errorInfo;
  };


  const validateEmail = (email) => {
    if (!email) return "Email is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    return "";
  };


  const validatePassword = (password) => {
    if (!password) return "Password is required";
    if (password.length < 6) return "Password must be at least 6 characters";
    return "";
  };


  const validateForm = () => {
    const errors = {};
    
    const emailError = validateEmail(email.trim());
    if (emailError) errors.email = emailError;
    
    const passwordError = validatePassword(password);
    if (passwordError) errors.password = passwordError;
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };


  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    
    if (validationErrors.email) {
      setValidationErrors(prev => ({ ...prev, email: undefined }));
    }
    
    if (error) setError("");
  };


  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    
    if (validationErrors.password) {
      setValidationErrors(prev => ({ ...prev, password: undefined }));
    }
    
    if (error) setError("");
  };


  const handleUserTypeChange = (type) => {
    setUserType(type);
    setEmail("");
    setPassword("");
    setError("");
    setValidationErrors({});
  };


  useEffect(() => {
    setIsVisible(true);
    checkBackendConnection();
    checkAuthStatus();
  }, [navigate]);


  const checkAuthStatus = () => {
    const token = localStorage.getItem("token");
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    
    if (isLoggedIn === "true" && token) {
      navigate("/dashboard", { replace: true });
    }
  };


  const checkBackendConnection = async (retryAttempt = 0) => {
    try {
      console.log("🔄 Testing backend connection...");
      const response = await apiClient.get('/api/auth/test');
      setConnectionStatus("connected");
      setRetryCount(0);
      console.log("✅ Backend connection successful:", response.data);
    } catch (error) {
      setConnectionStatus("disconnected");
      console.error("❌ Backend connection failed:", error.message);
      
      if (retryAttempt < 2) {
        console.log(`🔄 Auto-retrying connection (attempt ${retryAttempt + 1}/3)...`);
        setRetryCount(retryAttempt + 1);
        setTimeout(() => checkBackendConnection(retryAttempt + 1), 3000 * (retryAttempt + 1));
      }
    }
  };


  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    const endpoint = userType === "admin" 
      ? '/api/auth/admin/login' 
      : '/api/auth/store-manager/login';

    console.log("🔄 Login attempt started...");
    console.log("Using API URL:", `${BASE_URL}${endpoint}`);
    console.log("User Type:", userType);

    try {
      const response = await apiClient.post(endpoint, {
        email: email.trim(),
        password: password
      });

      console.log("✅ Login successful:", response.data);
      
      localStorage.clear();
      
      const userData = response.data.user;
      const token = response.data.token;
      
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
      
      console.log("✅ Authentication data stored, navigating to dashboard...");
      
      const roleLabel = userType === "admin" ? "Admin" : "Store Manager";
      toast.success(`Login successful! Welcome to the ${roleLabel} dashboard.`);
      
      navigate("/dashboard", { replace: true });
      
    } catch (error) {
      setIsLoading(false);
      console.error("❌ Login error:", error);
      
      const errorInfo = showErrorNotification(error, "Login failed");
      
      if (errorInfo.type === ErrorTypes.NETWORK) {
        setConnectionStatus("disconnected");
      }
      
      const form = document.getElementById("login-form");
      if (form) {
        form.classList.add("animate-shake");
        setTimeout(() => {
          form.classList.remove("animate-shake");
        }, 500);
      }
    }
  };


  const retryConnection = () => {
    setConnectionStatus("checking");
    setError("");
    checkBackendConnection();
  };


  const getStatusColor = () => {
    switch (connectionStatus) {
      case "connected": return "bg-green-100 text-green-700 border-green-500";
      case "disconnected": return "bg-red-100 text-red-700 border-red-500";
      default: return "bg-yellow-100 text-yellow-700 border-yellow-500";
    }
  };


  const getStatusIcon = () => {
    switch (connectionStatus) {
      case "connected":
        return (
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
          </svg>
        );
      case "disconnected":
        return (
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 000 2v4a1 1 0 102 0V7a1 1 0 00-1-1z" clipRule="evenodd"></path>
          </svg>
        );
      default:
        return (
          <svg className="animate-spin w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        );
    }
  };


  const getStatusMessage = () => {
    switch (connectionStatus) {
      case "connected": return `✓ Connected to backend server`;
      case "disconnected": return `✗ Cannot connect to ${BASE_URL}`;
      default: return `Checking connection...`;
    }
  };


  const isFormValid = () => {
    return email.trim() && password.trim() && Object.keys(validationErrors).length === 0;
  };


  const getLoginTitle = () => {
    return userType === "admin" ? "VegoBike Admin Login" : "VegoBike Store Manager Login";
  };


  const getLoginSubtitle = () => {
    return userType === "admin" 
      ? "Enter your admin credentials to access the dashboard"
      : "Enter your store manager credentials to access your store dashboard";
  };


  return (
    <div
      className="flex items-center justify-center min-h-screen bg-cover bg-center"
      style={{
        backgroundImage: "url('/vegobike_admin.jpg')",
        backgroundBlendMode: "overlay",
        backgroundColor: "rgba(0, 0, 0, 0.6)",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/70 to-purple-900/70 z-0"></div>
      <div
        className={`w-full max-w-md p-8 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-2xl rounded-lg transition-all duration-500 transform z-10
          ${isVisible ? "opacity-80 translate-y-0" : "opacity-0 translate-y-8"}`}
      >
        {/* Header */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              ></path>
            </svg>
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-2">
          {getLoginTitle()}
        </h2>

        {/* ✅ USER TYPE SELECTOR - TABS */}
        <div className="flex gap-3 mb-6 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => handleUserTypeChange("admin")}
            className={`flex-1 py-2 px-3 rounded-md font-medium text-sm transition-all ${
              userType === "admin"
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            👨‍💼 Admin
          </button>
          <button
            type="button"
            onClick={() => handleUserTypeChange("store-manager")}
            className={`flex-1 py-2 px-3 rounded-md font-medium text-sm transition-all ${
              userType === "store-manager"
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            🏪 Store Manager
          </button>
        </div>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-4">
          {getLoginSubtitle()}
        </p>
        
        {/* Connection Status */}
        <div className={`mb-4 p-3 rounded-md border-l-4 text-sm ${getStatusColor()}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {getStatusIcon()}
              {getStatusMessage()}
            </div>
            {connectionStatus === "disconnected" && (
              <button
                onClick={retryConnection}
                className="text-xs underline hover:no-underline focus:outline-none"
                type="button"
              >
                Retry
              </button>
            )}
          </div>
          {retryCount > 0 && connectionStatus === "checking" && (
            <p className="text-xs mt-1 opacity-75">
              Retry attempt {retryCount}/3...
            </p>
          )}
        </div>
        
        {/* Loading State */}
        {isLoading && (
          <div className="mb-6 p-4 bg-blue-100 text-blue-700 rounded-md border-l-4 border-blue-500">
            <div className="flex items-center">
              <svg className="animate-spin w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <div>
                <div className="font-medium">Authenticating with server...</div>
                <div className="text-sm opacity-90">Please wait while we verify your credentials</div>
              </div>
            </div>
          </div>
        )}
        
        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md border-l-4 border-red-500 animate-fadeIn">
            <div className="flex">
              <svg
                className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                ></path>
              </svg>
              <div className="flex-1">
                <div className="font-medium">{error}</div>
              </div>
            </div>
          </div>
        )}
        
        {/* Login Form */}
        <form id="login-form" onSubmit={handleLogin} className="space-y-6">
          <div className="transition-all duration-300 transform delay-100">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:text-white transition-all ${
                validationErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Enter your email"
              value={email}
              onChange={handleEmailChange}
              disabled={isLoading || connectionStatus === "disconnected"}
              required
              autoComplete="email"
              autoFocus
            />
            {validationErrors.email && (
              <p className="text-xs text-red-600 mt-1">{validationErrors.email}</p>
            )}
          </div>
          
          <div className="transition-all duration-300 transform delay-200">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:text-white transition-all ${
                validationErrors.password ? 'border-red-300 bg-red-50' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Enter your password"
              value={password}
              onChange={handlePasswordChange}
              disabled={isLoading || connectionStatus === "disconnected"}
              required
              autoComplete="current-password"
            />
            {validationErrors.password && (
              <p className="text-xs text-red-600 mt-1">{validationErrors.password}</p>
            )}
          </div>
          
          <button
            type="submit"
            className={`w-full py-3 px-4 text-white font-medium rounded-lg transition-all duration-300 text-center
              ${
                isLoading || connectionStatus === "disconnected" || !isFormValid()
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg transform hover:-translate-y-1 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              }`}
            disabled={isLoading || !isFormValid() || connectionStatus === "disconnected"}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <svg
                  className="animate-spin h-5 w-5 mr-3"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    fill="none"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Authenticating...
              </div>
            ) : connectionStatus === "disconnected" ? (
              "Server Unavailable"
            ) : !isFormValid() ? (
              "Please fill in all fields"
            ) : (
              "Sign In"
            )}
          </button>
        </form>
        
        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>Enter your credentials to access your dashboard</p>
          <p className="mt-2 text-xs">
            Backend: {BASE_URL}
          </p>
          {connectionStatus === "connected" && (
            <p className="mt-1 text-xs text-green-600">
              🟢 Server connection established
            </p>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default AdminLogin;
