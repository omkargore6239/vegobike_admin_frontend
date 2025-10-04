import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import apiClient, { BASE_URL } from "../api/apiConfig"; // Import BASE_URL from apiConfig

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("checking");
  const [retryCount, setRetryCount] = useState(0);
  const [validationErrors, setValidationErrors] = useState({});

  // ✅ PROFESSIONAL ERROR HANDLING UTILITIES
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

    // Network errors
    if (error.code === 'ERR_NETWORK' || error.message?.toLowerCase().includes('network')) {
      type = ErrorTypes.NETWORK;
      message = `Unable to connect to server at ${BASE_URL}`;
      isRetryable = true;
      suggestions = [
        "Check your internet connection",
        "Verify the backend server is running on port 8081",
        "Ensure CORS is properly configured"
      ];
    }
    // HTTP status errors
    else if (error.response?.status) {
      const status = error.response.status;
      const serverMessage = error.response.data?.message || error.response.data?.error;

      switch (status) {
        case 400:
          type = ErrorTypes.VALIDATION;
          if (error.response.data?.error === "VALIDATION_FAILED") {
            if (error.response.data?.details && typeof error.response.data.details === 'object') {
              const validationErrors = Object.values(error.response.data.details).join(", ");
              message = `Please fix the following: ${validationErrors}`;
            } else {
              message = serverMessage || "Please check your input and try again";
            }
          } else {
            message = serverMessage || "Invalid request data";
          }
          suggestions = ["Please verify your email and password"];
          break;
        case 401:
          type = ErrorTypes.AUTHENTICATION;
          if (error.response.data?.error === "INVALID_CREDENTIALS") {
            message = "Invalid email or password. Please check your credentials and try again";
          } else {
            message = "Authentication failed. Please verify your login details";
          }
          suggestions = ["Double-check your email and password", "Contact administrator if you forgot credentials"];
          break;
        case 403:
          type = ErrorTypes.AUTHORIZATION;
          if (error.response.data?.error === "ACCESS_DENIED") {
            message = "Admin privileges required. Please contact your administrator for access";
          } else {
            message = "Access denied. You don't have permission to access this resource";
          }
          suggestions = ["Contact your administrator for admin access"];
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
      suggestions = ["Ensure backend server is running on port 8081"];
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

  // ✅ ENHANCED FORM VALIDATION
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

  // Handle input changes with validation
  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    
    // Clear validation error for this field
    if (validationErrors.email) {
      setValidationErrors(prev => ({ ...prev, email: undefined }));
    }
    
    // Clear general error
    if (error) setError("");
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    
    // Clear validation error for this field
    if (validationErrors.password) {
      setValidationErrors(prev => ({ ...prev, password: undefined }));
    }
    
    // Clear general error
    if (error) setError("");
  };

  useEffect(() => {
    setIsVisible(true);
    
    // Check backend connection and authentication status
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
      
      // Auto-retry logic
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

    // Client-side validation
    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    console.log("🔄 Login attempt started...");
    console.log("Using API URL:", `${BASE_URL}/api/auth/admin/login`);

    try {
      const response = await apiClient.post('/api/auth/admin/login', {
        email: email.trim(),
        password: password
      });

      console.log("✅ Login successful:", response.data);
      
      // Clear any existing auth data first
      localStorage.clear();
      
      // Set authentication data from backend response
      const userData = response.data.user;
      const token = response.data.token;
      
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("token", token);
      localStorage.setItem("authToken", token); // Keep for compatibility
      localStorage.setItem("userEmail", userData.email);
      localStorage.setItem("userName", userData.name);
      localStorage.setItem("userId", userData.id.toString());
      localStorage.setItem("userRole", userData.roleId.toString());
      localStorage.setItem("loginTime", Date.now().toString());
      
      // Dispatch auth change event
      window.dispatchEvent(new Event('authChange'));
      
      console.log("✅ Authentication data stored, navigating to dashboard...");
      
      // Show success message
      toast.success("Login successful! Welcome to the admin dashboard.");
      
      // Navigate to dashboard
      navigate("/dashboard", { replace: true });
      
    } catch (error) {
      setIsLoading(false);
      console.error("❌ Login error:", error);
      
      const errorInfo = showErrorNotification(error, "Login failed");
      
      // Update connection status if network error
      if (errorInfo.type === ErrorTypes.NETWORK) {
        setConnectionStatus("disconnected");
      }
      
      // Add shake animation to form
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
        <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-6">
          VegoBike Admin Login
        </h2>
        
        {/* Enhanced Connection Status */}
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
        
        {/* Enhanced Error State */}
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
                {error.includes("connect to server") && (
                  <div className="mt-2">
                    <p className="text-xs">
                      💡 <strong>Troubleshooting tips:</strong>
                    </p>
                    <ul className="text-xs mt-1 ml-4 list-disc">
                      <li>Ensure your backend server is running on {BASE_URL}</li>
                      <li>Check your network connection</li>
                      <li>Verify CORS settings in your backend</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Enhanced Login Form */}
        <form id="login-form" onSubmit={handleLogin} className="space-y-6">
          <div className="transition-all duration-300 transform delay-100">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="email"
                className={`w-full pl-4 px-4 py-3 bg-gray-50 dark:bg-gray-700 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:text-white transition-all ${
                  validationErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Enter your admin email"
                value={email}
                onChange={handleEmailChange}
                disabled={isLoading || connectionStatus === "disconnected"}
                required
                autoComplete="email"
                autoFocus
                aria-describedby={validationErrors.email ? "email-error" : undefined}
              />
            </div>
            {validationErrors.email && (
              <p id="email-error" className="text-xs text-red-600 mt-1" role="alert">
                {validationErrors.email}
              </p>
            )}
          </div>
          
          <div className="transition-all duration-300 transform delay-200">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="password"
                className={`w-full pl-4 px-4 py-3 bg-gray-50 dark:bg-gray-700 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:text-white transition-all ${
                  validationErrors.password ? 'border-red-300 bg-red-50' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Enter your password"
                value={password}
                onChange={handlePasswordChange}
                disabled={isLoading || connectionStatus === "disconnected"}
                required
                autoComplete="current-password"
                aria-describedby={validationErrors.password ? "password-error" : undefined}
              />
            </div>
            {validationErrors.password && (
              <p id="password-error" className="text-xs text-red-600 mt-1" role="alert">
                {validationErrors.password}
              </p>
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
              "Please fill in all fields correctly"
            ) : (
              "Sign In"
            )}
          </button>
        </form>
        
        {/* Enhanced Footer */}
        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>Enter your admin credentials to access the dashboard</p>
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

      {/* Add custom styles for shake animation */}
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
