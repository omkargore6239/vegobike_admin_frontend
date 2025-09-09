import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../api/apiConfig";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("checking");

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

  const checkBackendConnection = async () => {
    try {
      console.log("Testing backend connection...");
      const response = await apiClient.get('/auth/test');
      setConnectionStatus("connected");
      console.log("Backend connection successful:", response.data);
    } catch (error) {
      setConnectionStatus("disconnected");
      console.error("Backend connection failed:", error.message);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    console.log("Login attempt started...");
    console.log("Using API URL:", `${import.meta.env.VITE_BASE_URL}/api/auth/admin/login`);

    try {
      const response = await apiClient.post('/auth/admin/login', {
        email: email.trim(),
        password: password
      });

      console.log("Login successful:", response.data);
      
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
      
      console.log("Authentication data stored, navigating to dashboard...");
      
      // Navigate to dashboard
      navigate("/dashboard", { replace: true });
      
    } catch (error) {
      console.error("Login error:", error);
      setIsLoading(false);
      
      // Handle different error types based on backend responses
      if (error.response) {
        const { status, data } = error.response;
        
        console.log("Error response:", { status, data });
        
        switch (status) {
          case 400:
            if (data.error === "VALIDATION_FAILED") {
              if (data.details && typeof data.details === 'object') {
                const validationErrors = Object.values(data.details).join(", ");
                setError(`Please fix the following: ${validationErrors}`);
              } else {
                setError(data.message || "Please check your input and try again.");
              }
            } else {
              setError(data.message || "Bad request. Please check your input.");
            }
            break;
            
          case 401:
            if (data.error === "INVALID_CREDENTIALS") {
              setError("Invalid email or password. Please check your credentials and try again.");
            } else {
              setError("Authentication failed. Please verify your login details.");
            }
            break;
            
          case 403:
            if (data.error === "ACCESS_DENIED") {
              setError("Admin privileges required. Please contact your administrator for access.");
            } else {
              setError("Access denied. You don't have permission to access this resource.");
            }
            break;
            
          case 500:
            setError("Server error occurred. Please try again later or contact support if the problem persists.");
            break;
            
          default:
            setError(data.message || `Server error (${status}). Please try again.`);
        }
      } else if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
        setError(`Cannot connect to server at ${import.meta.env.VITE_BASE_URL}. Please ensure the backend server is running on port 8081.`);
        setConnectionStatus("disconnected");
      } else if (error.code === 'ECONNREFUSED') {
        setError("Connection refused. Please check if the backend server is running.");
        setConnectionStatus("disconnected");
      } else {
        setError("An unexpected error occurred. Please try again.");
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
      case "disconnected": return `✗ Cannot connect to ${import.meta.env.VITE_BASE_URL}`;
      default: return `Checking connection...`;
    }
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
                className="text-xs underline hover:no-underline"
                type="button"
              >
                Retry
              </button>
            )}
          </div>
        </div>
        
        {/* Loading State */}
        {isLoading && (
          <div className="mb-6 p-4 bg-blue-100 text-blue-700 rounded-md border-l-4 border-blue-500">
            <div className="flex">
              <svg className="animate-spin w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Authenticating with server... Please wait
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
              <div>{error}</div>
            </div>
          </div>
        )}
        
        {/* Login Form */}
        <form id="login-form" onSubmit={handleLogin} className="space-y-6">
          <div className="transition-all duration-300 transform delay-100">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                className="w-full pl-4 px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:text-white transition-all"
                placeholder="Enter your admin email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading || connectionStatus === "disconnected"}
                required
                autoComplete="email"
                autoFocus
              />
            </div>
          </div>
          
          <div className="transition-all duration-300 transform delay-200">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                className="w-full pl-4 px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:text-white transition-all"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading || connectionStatus === "disconnected"}
                required
                autoComplete="current-password"
              />
            </div>
          </div>
          
          <button
            type="submit"
            className={`w-full py-3 px-4 text-white font-medium rounded-lg transition-all duration-300 text-center
              ${
                isLoading || connectionStatus === "disconnected"
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg transform hover:-translate-y-1 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              }`}
            disabled={isLoading || !email.trim() || !password.trim() || connectionStatus === "disconnected"}
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
            ) : (
              "Sign In"
            )}
          </button>
        </form>
        
        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>Enter your admin credentials to access the dashboard</p>
          <p className="mt-2 text-xs">
            Backend: {import.meta.env.VITE_BASE_URL || 'http://localhost:8081'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
