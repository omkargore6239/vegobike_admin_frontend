// components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const [isAuthorized, setIsAuthorized] = useState(null);

  useEffect(() => {
    const checkAuthorization = () => {
      const token = localStorage.getItem("token");
      const isLoggedIn = localStorage.getItem("isLoggedIn");
      const userRole = parseInt(localStorage.getItem("userRole"));

      if (!token || !isLoggedIn) {
        setIsAuthorized(false);
        return;
      }

      if (requiredRoles.length > 0 && !requiredRoles.includes(userRole)) {
        setIsAuthorized(false);
        return;
      }

      setIsAuthorized(true);
    };

    checkAuthorization();

    // Listen for auth changes
    const handleAuthChange = () => {
      checkAuthorization();
    };

    window.addEventListener("authChange", handleAuthChange);
    return () => window.removeEventListener("authChange", handleAuthChange);
  }, [requiredRoles]);

  if (isAuthorized === null) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAuthorized) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
