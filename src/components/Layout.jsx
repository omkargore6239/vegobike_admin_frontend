// components/Layout.jsx
import React, { useEffect } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { Navigate, Outlet } from "react-router-dom";


const Layout = () => {
  const isLoggedIn = localStorage.getItem("isLoggedIn");
  const userRole = parseInt(localStorage.getItem("userRole"));

  if (isLoggedIn !== "true") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Main Content Area */}
      <div className="flex flex-col md:flex-row flex-1 md:mt-0">
        {/* Sidebar */}
        <Sidebar className="md:w-56 w-72 md:static fixed bottom-0 z-10 md:h-full md:overflow-y-auto overflow-x-hidden" />

        {/* Main Content */}
        <div className="w-full p-4 md:p-6 flex-grow transition-transform duration-300 ease-in-out mt-14">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;
