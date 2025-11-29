import React, { useState, useRef, useEffect } from "react";
import { FaUserCircle } from "react-icons/fa";
import Logout from "../pages/AdminLogout";

const Header = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Get user role and user info from localStorage
  const userRole = parseInt(localStorage.getItem("userRole"));
  const userName = localStorage.getItem("userName");
  const userEmail = localStorage.getItem("userEmail"); // assuming userEmail is saved in localStorage

  const isStoreManager = userRole === 2;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-gradient-to-r from-indigo-900 to-indigo-900 text-white sticky top-0 z-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center px-4 py-3">
          {/* Right Side Icons */}
          <div className="flex items-center space-x-4">
            {/* User Profile */}
            <div className="relative" ref={dropdownRef}>
              <div
                className="flex items-center gap-2 cursor-pointer hover:text-indigo-200 transition-colors group"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <span className="hidden md:block font-medium">{userName || (isStoreManager ? "Store Manager" : "Admin")}</span>
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-indigo-700 flex items-center justify-center hover:bg-indigo-600 transition-colors">
                    <FaUserCircle className="text-xl" />
                  </div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-indigo-800"></div>
                </div>
              </div>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg overflow-hidden z-50 animate-slideDown">
                  <div className="bg-indigo-50 p-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="bg-indigo-700 text-white p-3 rounded-full">
                        <FaUserCircle className="text-xl" />
                      </div>
                      <div>
                        <p className="text-gray-800 font-medium">{userName || (isStoreManager ? "Store Manager" : "Admin")}</p>
                        <p className="text-gray-500 text-sm">{userEmail || (isStoreManager ? "storemanager@example.com" : "admin@gmail.com")}</p>
                      </div>
                    </div>
                  </div>

                  <ul className="text-gray-700 py-2">
                    <li className="border-t border-gray-100 mt-2">
                      <div className="px-4 py-3">
                        <Logout />
                      </div>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
