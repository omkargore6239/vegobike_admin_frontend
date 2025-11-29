// components/Sidebar.jsx
import React, { useState, useEffect, useRef } from "react";
import { IoLayersOutline, IoPricetagsOutline } from "react-icons/io5";
import { LuBox, LuUsers, LuChevronRight, LuCalendarClock } from "react-icons/lu";
import { RiMotorbikeLine, RiServiceLine } from "react-icons/ri";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { MdOutlineLocalGroceryStore, MdSell } from "react-icons/md";
import { TbBrandBooking } from "react-icons/tb";
import { FaWrench, FaCogs, FaMoneyBillWave, FaSignOutAlt, FaPlus, FaBatteryFull  } from "react-icons/fa";
import Header from "./Header";
import fonts from "../styles/fonts";
import colors from "../styles/colors";
import { toast } from "react-toastify";


const Sidebar = () => {
  const [activeLink, setActiveLink] = useState(0);
  const [openSubmenus, setOpenSubmenus] = useState({});
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const sidebarRef = useRef(null);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // ✅ GET USER ROLE
  const userRole = parseInt(localStorage.getItem("userRole"));
  const isStoreManager = userRole === 2;
  const userName = localStorage.getItem("userName");

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth < 640) {
        setIsDesktopCollapsed(true);
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);


  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setIsMenuOpen(false);
        setOpenSubmenus({});
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);


  // Set active link based on current path
  useEffect(() => {
    const currentPath = location.pathname;
    const findActiveLinkIndex = () => {
      for (let i = 0; i < SIDEBAR_LINKS.length; i++) {
        const link = SIDEBAR_LINKS[i];
        if (link.path === currentPath) return i;
        if (link.submenu) {
          const submenuMatch = link.submenu.findIndex((item) => item.path === currentPath);
          if (submenuMatch !== -1) {
            setOpenSubmenus((prev) => ({ ...prev, [i]: true }));
            return i;
          }
        }
      }
      return 0;
    };
    setActiveLink(findActiveLinkIndex());
  }, [location.pathname]);


  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);


  const handleLinkClick = (index, path) => {
    setActiveLink(index);
    if (windowWidth < 768) setIsMenuOpen(false);
    if (path && path === location.pathname) {
      window.location.reload();
    } else if (path) {
      navigate(path);
    }
  };


  const toggleSubmenu = (index) => {
    setOpenSubmenus((prev) => ({ ...prev, [index]: !prev[index] }));
  };


  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleDesktopSidebar = () => setIsDesktopCollapsed(!isDesktopCollapsed);

  // ✅ LOGOUT FUNCTION
  const handleLogout = () => {
    localStorage.clear();
    window.dispatchEvent(new Event('authChange'));
    toast.success("Logged out successfully!");
    navigate("/", { replace: true });
  };


  // ✅ ALL ADMIN LINKS
  const ALL_SIDEBAR_LINKS = [
  { id: 1, path: "/dashboard", name: "Dashboard", icon: LuBox },
  { id: 7, path: "/dashboard/allBookings", name: "All Bookings", icon: TbBrandBooking },
  { id: 2, path: "/dashboard/storeMaster", name: "Store Master", icon: MdOutlineLocalGroceryStore },
  { id: 3, path: "/dashboard/allBikes", name: "All Bikes", icon: RiMotorbikeLine },
  { id: 3.1, path: "/dashboard/allBattery", name: "All Battery", icon: FaBatteryFull },
  {
    id: 4,
    name: "Price Master",
    icon: IoLayersOutline,
    submenu: [
      { id: 41, path: "/dashboard/priceMaster/deliveryAtLocationPrices", name: "Delivery" },
      { id: 42, path: "/dashboard/priceMaster/pickUpTariffPlan", name: "Pick Up" },
      { id: 43, path: "/dashboard/priceMaster/lateCharges", name: "Late Charges" },
    ],
  },
  {
    id: 5,
    name: "Master Records",
    icon: IoLayersOutline,
    submenu: [
      { id: 55, path: "/dashboard/masterRecords/allVehicleTypes", name: "All Vehicle Types" },
      { id: 51, path: "/dashboard/masterRecords/allCategories", name: "All Categories" },
      { id: 52, path: "/dashboard/masterRecords/allBrands", name: "All Brands" },
      { id: 53, path: "/dashboard/masterRecords/allModels", name: "All Models" },
      { id: 54, path: "/dashboard/masterRecords/allCity", name: "All Cities" },
    ],
  },
  { id: 6, path: "/dashboard/allOffers", name: "All Offers", icon: IoPricetagsOutline },
  { id: 9, path: "/dashboard/allRegisterCustomers", name: "All Registered Customers", icon: LuUsers },
  { id: 10, path: "/dashboard/storeManger", name: "All Store Managers", icon: LuUsers },
  { id: 11, path: "/dashboard/timeSlot", name: "Time Slot", icon: LuCalendarClock },
  {
    id: 12,
    name: "Sell Bikes",
    icon: MdSell,
    submenu: [
      { id: 121, path: "/dashboard/sellBikes", name: "Sell Bikes" },
      { id: 122, path: "/dashboard/bikeEnquiries", name: "Bike Enquiries" },
    ],
  },
  { id: 13, path: "/dashboard/bikeServices", name: "Bike Services", icon: RiServiceLine },
  { id: 14, path: "/dashboard/spareParts", name: "Spare Parts", icon: FaCogs },
  { id: 15, path: "/dashboard/serviceOrders", name: "Service Orders", icon: FaWrench },
];


  // ✅ UPDATED STORE MANAGER LINKS - With Add Bike & Create Booking
  const STORE_MANAGER_LINKS = [
    { id: 1, path: "/dashboard", name: "Dashboard", icon: LuBox },
    { id: 7, path: "/dashboard/allBookings", name: "All Bookings", icon: TbBrandBooking },
    { id: 3, path: "/dashboard/allBikes", name: "All Bikes", icon: RiMotorbikeLine },
     // { id: 3.5, path: "/dashboard/addBike", name: "➕ Add Bike", icon: FaPlus },
      // { id: 3.7, path: "/dashboard/createBooking", name: "📅 Create Booking", icon: FaPlus }, 
      { id: 3.1, path: "/dashboard/allBattery", name: "All Battery", icon: FaBatteryFull },
  ];

  // ✅ SELECT LINKS BASED ON ROLE
  const SIDEBAR_LINKS = isStoreManager ? STORE_MANAGER_LINKS : ALL_SIDEBAR_LINKS;

  return (
    <>
      {/* Header */}
      <div className={`fixed h-16 top-0 left-0 z-30 w-full ${colors.headerBg} flex justify-between items-center px-4 py-4`}>
        <div className="flex items-center py-3 px-3">
          <button
            onClick={windowWidth < 768 ? toggleMenu : toggleDesktopSidebar}
            className="text-white p-2 rounded-md hover:bg-indigo-800 transition-colors mr-2"
          >
            <div className="w-6 flex flex-col items-end justify-center gap-1.5">
              <span className={`bg-white h-0.5 rounded-full transition-all duration-300 ${isMenuOpen && windowWidth < 768 ? "w-6 transform rotate-45 translate-y-2" : "w-6"}`}></span>
              <span className={`bg-white h-0.5 rounded-full transition-all duration-300 ${isMenuOpen && windowWidth < 768 ? "opacity-0" : "w-4"}`}></span>
              <span className={`bg-white h-0.5 rounded-full transition-all duration-300 ${isMenuOpen && windowWidth < 768 ? "w-6 transform -rotate-45 -translate-y-2" : "w-5"}`}></span>
            </div>
          </button>
          <img src="/vegologo.png" alt="VegoBike Logo" className="h-10 w-10" />
          <h1 className={fonts.sidebarTitle}>Ve Go</h1>
          
          {/* ✅ SHOW USER ROLE */}
          <span className="ml-4 text-xs bg-indigo-700 px-2 py-1 rounded text-white font-semibold">
            {isStoreManager ? "🏪 Store Manager" : "👨‍💼 Admin"}
          </span>
        </div>
        <Header />
      </div>


      {/* Mobile overlay */}
      <div
        className={`md:hidden fixed inset-0 bg-black bg-opacity-50 z-20 transition-opacity duration-300 ${isMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={toggleMenu}
      />


      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`fixed inset-y-0 left-0 z-20 ${colors.sidebarBg} flex flex-col transition-all duration-300 ease-in-out
                    ${isMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
                    ${isDesktopCollapsed ? "md:w-20" : "md:w-72"}
                    pt-16`}
      >
        {/* ✅ USER INFO SECTION */}
        {((windowWidth >= 768 && !isDesktopCollapsed) || (windowWidth < 768 && isMenuOpen)) && (
          <div className="px-4 py-3 border-b border-indigo-700">
            <p className="text-sm font-semibold text-white">
              {isStoreManager ? "🏪 Store Manager" : "👨‍💼 Admin Dashboard"}
            </p>
            <p className="text-xs text-indigo-200 mt-1">
              {userName}
            </p>
            
          </div>
        )}

        <div className="flex-grow py-5 overflow-y-auto overflow-x-hidden scrollbar-hide">
          <ul className="space-y-1">
            {SIDEBAR_LINKS.map((link, index) => (
              <li key={index}>
                {!link.submenu ? (
                  <Link
                    to={link.path}
                    className={`flex items-center py-3 px-3 rounded-lg ${colors.sidebarHover} ${activeLink === index ? colors.sidebarActive : "text-indigo-100"}`}
                    onClick={(e) => {
                      e.preventDefault();
                      handleLinkClick(index, link.path);
                    }}
                  >
                    <div className={`flex items-center ${isDesktopCollapsed && windowWidth >= 768 ? "justify-center" : ""}`}>
                      {link.icon && React.createElement(link.icon, { size: isDesktopCollapsed && windowWidth >= 768 ? 22 : 18 })}
                      <span className={`ml-3 text-xs font-medium whitespace-nowrap ${isDesktopCollapsed && windowWidth >= 768 ? "hidden" : ""}`}>{link.name}</span>
                    </div>
                  </Link>
                ) : (
                  <div>
                    <button
                      onClick={() => toggleSubmenu(index)}
                      className={`w-full flex items-center justify-between py-3 px-3 rounded-lg ${colors.sidebarHover} ${
                        openSubmenus[index] ? "bg-indigo-600 text-white" : "text-indigo-100"
                      }`}
                    >
                      <div className={`flex items-center ${isDesktopCollapsed && windowWidth >= 768 ? "justify-center" : ""}`}>
                        {link.icon && React.createElement(link.icon, { size: isDesktopCollapsed && windowWidth >= 768 ? 22 : 18 })}
                        <span className={`ml-3 text-xs font-medium whitespace-nowrap ${isDesktopCollapsed && windowWidth >= 768 ? "hidden" : ""}`}>{link.name}</span>
                      </div>
                      {(!isDesktopCollapsed || windowWidth < 768) && <LuChevronRight size={16} className={`transform transition-transform ${openSubmenus[index] ? "rotate-90" : ""}`} />}
                    </button>
                    {openSubmenus[index] && (!isDesktopCollapsed || windowWidth < 768) && (
                      <div className="ml-8 border-l border-indigo-700/50">
                        {link.submenu.map((subitem) => (
                          <Link
                            key={subitem.id}
                            to={subitem.path}
                            className={`${fonts.sidebarSubmenu} ${colors.sidebarSubmenu}`}
                            onClick={(e) => {
                              e.preventDefault();
                              handleLinkClick(index, subitem.path);
                            }}
                          >
                            {subitem.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>


        {/* ✅ LOGOUT & FOOTER */}
        {((windowWidth >= 768 && !isDesktopCollapsed) || (windowWidth < 768 && isMenuOpen)) && (
          <div className="p-4 border-t border-indigo-800 space-y-3">
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all duration-200 text-sm"
            >
              <FaSignOutAlt size={16} />
              Logout
            </button>
            
            {/* Footer */}
            <div className={`${fonts.sidebarFooter} ${colors.sidebarFooter} text-center text-xs`}>
              Ve go © 2025
            </div>
          </div>
        )}

        {/* Mobile Logout Button (Collapsed) */}
        {isDesktopCollapsed && windowWidth >= 768 && (
          <div className="p-2 border-t border-indigo-800">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center px-2 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-200"
              title="Logout"
            >
              <FaSignOutAlt size={18} />
            </button>
          </div>
        )}
      </div>


      {/* Main content area */}
      <div className={`transition-all duration-300 ease-in-out ${isDesktopCollapsed ? "md:ml-20" : "md:ml-72"} pt-16`}>
        {/* Your main content goes here */}
      </div>


      {/* Hide scrollbar */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
};


export default Sidebar;
