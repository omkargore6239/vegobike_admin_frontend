import React, { useEffect, useState } from "react";
import { useSpring, animated, useTrail, useChain, useSpringRef } from 'react-spring';
import { useTable } from 'react-table';
import { useNavigate } from 'react-router-dom';
import apiClient from "../api/apiConfig";

const Home = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [stores, setStores] = useState([]);
  const [bikes, setBikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [showUsers, setShowUsers] = useState(false);
  const [showBookings, setShowBookings] = useState(false);
  const [showStores, setShowStores] = useState(false);
  const [showBikes, setShowBikes] = useState(false);
  const [showTodaysBookings, setShowTodaysBookings] = useState(false);
  const [todaysBookings, setTodaysBookings] = useState([]);
  const [verifiedUsers, setVerifiedUsers] = useState([]);
  const [unverifiedUsers, setUnverifiedUsers] = useState([]);
  const [ongoingBookings, setOngoingBookings] = useState([]);
  const [showOngoingBookings, setShowOngoingBookings] = useState(false);
  const [displayedUsers, setDisplayedUsers] = useState([]);
  const [activeStoreCount, setActiveStoreCount] = useState(0);
  const [activeBikesCount, setActiveBikesCount] = useState(0);
  const [dashboardSummary, setDashboardSummary] = useState({});
  const [userCountSummary, setUserCountSummary] = useState({});
  const [storeStats, setStoreStats] = useState({});
  const [currentStore, setCurrentStore] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const cardsSpringRef = useSpringRef();
  const tableSpringRef = useSpringRef();

  // ✅ Get user role and store info
  const getUserRoleAndStore = () => {
    try {
      const role = parseInt(localStorage.getItem('userRole'));
      const storeId = localStorage.getItem('storeId');
      const storeName = localStorage.getItem('storeName');
      
      return {
        role: role === 2 ? 'STORE_MANAGER' : 'ADMIN',
        storeId: storeId ? parseInt(storeId) : null,
        storeName: storeName || null
      };
    } catch {
      return { role: 'ADMIN', storeId: null, storeName: null };
    }
  };

  const { role: userRole, storeId: currentStoreId, storeName: storeName } = getUserRoleAndStore();
  console.log('👤 User Role:', userRole, 'Store:', storeName || 'All Stores');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get("api/auth/users/count", {
          params: { page: currentPage, size: 10, sortBy: 'id', sortDirection: 'asc' }
        });
        let usersData = response.data.content;
        if (currentPage === 0) {
          usersData = usersData.slice(1);
        }
        setUsers(usersData);
        setTotalPages(response.data.totalPages);
        const verified = usersData.filter(user =>
          user.aadharFrontStatus === 'APPROVED' &&
          user.aadharBackStatus === 'APPROVED' &&
          user.drivingLicenseStatus === 'APPROVED'
        );
        const unverified = usersData.filter(user =>
          !(user.aadharFrontStatus === 'APPROVED' &&
            user.aadharBackStatus === 'APPROVED' &&
            user.drivingLicenseStatus === 'APPROVED')
        );
        setVerifiedUsers(verified);
        setUnverifiedUsers(unverified);
      } catch (error) {
        console.error("Error fetching users data:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchActiveBikes = async () => {
      try {
        const response = await apiClient.get("/api/bikes/count/active");
        if (response.data && typeof response.data.activeBikes === 'number') {
          setActiveBikesCount(response.data.activeBikes);
        } else {
          setActiveBikesCount(0);
        }
      } catch (error) {
        console.error("Error fetching active bikes count:", error);
        setActiveBikesCount(0);
      }
    };

    const fetchBookings = async () => {
      try {
        const response = await apiClient.get("api/booking-bikes/dashboard/summary");
        const sortedBookings = response.data.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
        const bookingWithUsernames = await Promise.all(
          sortedBookings.map(async (booking) => {
            try {
              const userResponse = await apiClient.get(`/users/${booking.userId}`);
              return { ...booking, userName: userResponse.data.name };
            } catch (userError) {
              console.error(`Error fetching username for booking ID ${booking.id}:`, userError);
              return { ...booking, userName: 'Unknown' };
            }
          })
        );
        setBookings(bookingWithUsernames);
        const today = new Date().toISOString().split('T')[0];
        const todaysBookings = bookingWithUsernames.filter(booking => booking.startDate.includes(today));
        setTodaysBookings(todaysBookings);
        const ongoing = bookingWithUsernames.filter(booking => booking.status === 'START_TRIP');
        setOngoingBookings(ongoing);
      } catch (error) {
        console.error("Error fetching bookings data:", error);
      }
    };

    const fetchStores = async () => {
      try {
        if (userRole === 'STORE_MANAGER') {
          setStores([{ id: currentStoreId, name: storeName, address: 'Current Store' }]);
          setActiveStoreCount(1);
          return;
        }
        
        const response = await apiClient.get("api/stores/count/active");
        if (response.data && response.data.content) {
          setStores(response.data.content);
        } else if (response.data && Array.isArray(response.data)) {
          setStores(response.data);
        } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          setStores(response.data.data);
        } else {
          setStores([]);
        }
      } catch (error) {
        console.error("Error fetching stores data:", error);
        setStores([]);
      }
    };

    const fetchBikes = async () => {
      try {
        const response = await apiClient.get("api/bikes/count/active");
        if (response.data && response.data.content) {
          setBikes(response.data.content);
        } else if (response.data && Array.isArray(response.data)) {
          setBikes(response.data);
        } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          setBikes(response.data.data);
        } else {
          setBikes([]);
        }
      } catch (error) {
        console.error("Error fetching bikes data:", error);
        setBikes([]);
      }
    };

    const fetchDashboardSummary = async () => {
  try {
    // ✅ Add storeId param for Store Managers
    const params = userRole === 'STORE_MANAGER' && currentStoreId 
      ? { storeId: currentStoreId } 
      : {};
    
    console.log('📊 Fetching dashboard summary with params:', params);
    
    const response = await apiClient.get("/api/booking-bikes/dashboard/summary", { params });
    
    console.log('📊 Dashboard summary response:', response.data);
    
    if (response.data && (response.data.success || typeof response.data === 'object')) {
      setDashboardSummary(response.data);
      if (response.data.storeId) {
        setCurrentStore({
          id: response.data.storeId,
          name: storeName || `Store ${response.data.storeId}`
        });
      }
    } else {
      setDashboardSummary({});
    }
  } catch (error) {
    console.error("Error fetching dashboard summary:", error);
    setDashboardSummary({});
  }
};


    const fetchActiveStoreCount = async () => {
      try {
        if (userRole === 'STORE_MANAGER') {
          setActiveStoreCount(1);
          return;
        }
        const response = await apiClient.get("/api/stores/count/active");
        if (response.data && response.data.success) {
          setActiveStoreCount(response.data.count);
        } else {
          setActiveStoreCount(0);
        }
      } catch (error) {
        console.error("Error fetching active store count:", error);
        setActiveStoreCount(0);
      }
    };

    const fetchUserCountSummary = async () => {
      try {
        const response = await apiClient.get("api/auth/users/count");
        if (response.data && response.data.totalUsers !== undefined) {
          setUserCountSummary(response.data);
        } else {
          setUserCountSummary({});
        }
      } catch (error) {
        console.error("Error fetching user count summary:", error);
        setUserCountSummary({});
      }
    };

    fetchUsers();
    fetchBookings();
    fetchStores();
    fetchBikes();
    fetchDashboardSummary();
    fetchActiveStoreCount();
    fetchActiveBikes();
    fetchUserCountSummary();
  }, [currentPage, userRole, currentStoreId, storeName]);

  // ✅ ALL HANDLERS WITH STATUS FILTERS
  const handleViewTodaysBookings = () => {
    navigate("/dashboard/allBookings", { 
      state: { statusFilter: 'today' } 
    });
  };

  const handleViewOngoingBookings = () => {
    navigate("/dashboard/allBookings", { 
      state: { statusFilter: 'ongoing' } 
    });
  };

  const handleViewCancelledBookings = () => {
    navigate("/dashboard/allBookings", { 
      state: { statusFilter: 'cancelled' } 
    });
  };

  const handleViewTodaysEndTrips = () => {
    navigate("/dashboard/allBookings", { 
      state: { statusFilter: 'todayendtrips' } 
    });
  };

  const handleViewAllBookings = () => {
    navigate("/dashboard/allBookings", { 
      state: { statusFilter: 'all' } 
    });
  };

  const handleViewAllBikes = () => {
  navigate('/dashboard/allbikes', {
    state: {
      showActiveOnly: true  // ✅ Explicitly set to show active only
    }
  });
};
  // In Home.jsx - Update the handleViewAllStores function
const handleViewAllStores = () => {
  navigate("/dashboard/storeMaster", {
    state: {
      showActiveOnly: true  // ✅ Pass flag to show active stores only
    }
  });
};

const handleViewAllUsers = () => {
  navigate("/dashboard/allRegisterCustomers", {
    state: { userFilter: "all" },
  });
};

const handleViewVerifiedUsers = () => {
  navigate("/dashboard/allRegisterCustomers", {
    state: { userFilter: "verified" },
  });
};

const handleViewUnverifiedUsers = () => {
  navigate("/dashboard/allRegisterCustomers", {
    state: { userFilter: "unverified" },
  });
};


  // ✅ Stats with correct handlers
  const baseStats = [
    {
      title: "Today's Bookings",
      count: dashboardSummary.today || 0,
      gradient: "bg-gradient-to-br from-indigo-700 to-blue-600",
      icon: "📅",
      hasButton: true,
      onClick: handleViewTodaysBookings, // ✅ Fixed
    },
    {
      title: "Ongoing Bookings",
      count: dashboardSummary.ongoing || 0,
      gradient: "bg-gradient-to-br from-yellow-400 to-yellow-300",
      icon: "🔄",
      hasButton: true,
      onClick: handleViewOngoingBookings, // ✅ Fixed
    },
    {
      title: "Cancelled Bookings",
      count: dashboardSummary.cancelled || 0,
      gradient: "bg-gradient-to-br from-red-500 to-red-400",
      icon: "❌",
      hasButton: true,
      onClick: handleViewCancelledBookings, // ✅ Fixed
    },
    {
      title: "Total Bookings",
      count: dashboardSummary.total || 0,
      gradient: "bg-gradient-to-br from-teal-500 to-teal-400",
      icon: "📚",
      hasButton: true,
      onClick: handleViewAllBookings, // ✅ Fixed
    },
    {
      title: "Today's End Trips",
      count: dashboardSummary.todayEndTrips || 0,
      gradient: "bg-gradient-to-br from-purple-600 to-purple-500",
      icon: "🏁",
      hasButton: true,
      onClick: handleViewTodaysEndTrips, // ✅ Fixed
    },
    {
      title: "Active Bikes",
      count: activeBikesCount,
      gradient: "bg-gradient-to-br from-red-700 to-red-600",
      icon: "🏍️",
      hasButton: true,
      onClick: handleViewAllBikes,
    },
  ];

  const stats = userRole === 'STORE_MANAGER' 
    ? baseStats
    : [
        ...baseStats,
        {
          title: "Active Stores",
          count: activeStoreCount,
          gradient: "bg-gradient-to-br from-red-600 to-red-500",
          icon: "🏪",
          hasButton: true,
          onClick: handleViewAllStores,
        },
        {
          title: "Total Users",
          count: userCountSummary.totalUsers || 0,
          gradient: "bg-gradient-to-br from-green-600 to-green-500",
          icon: "👥",
          hasButton: true,
          onClick: handleViewAllUsers,
        },
        {
          title: "Verified Users",
          count: userCountSummary.verifiedUsers || 0,
          gradient: "bg-gradient-to-br from-blue-600 to-blue-500",
          icon: "✅",
          hasButton: true,
          onClick: handleViewVerifiedUsers,
        },
        {
          title: "Unverified Users",
          count: userCountSummary.unverifiedUsers || 0,
          gradient: "bg-gradient-to-br from-orange-500 to-orange-400",
          icon: "🔍",
          hasButton: true,
          onClick: handleViewUnverifiedUsers,
        },
      ];

  const useCounter = (end, duration = 2000) => {
    const { number } = useSpring({ 
      from: { number: 0 }, 
      number: end || 0, 
      delay: 300, 
      config: { duration } 
    });
    return number;
  };

  const counters = stats.map(stat => useCounter(stat.count));
  const trail = useTrail(stats.length, {
    ref: cardsSpringRef,
    from: { opacity: 0, y: 40, scale: 0.9 },
    to: { opacity: 1, y: 0, scale: 1 },
    config: { mass: 1, tension: 280, friction: 20 }
  });

  const tableAnimation = useSpring({
    ref: tableSpringRef,
    from: { opacity: 0, transform: 'translateY(30px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
    config: { tension: 280, friction: 24 },
  });

  useChain([cardsSpringRef, tableSpringRef], [0, 0.5]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const pulseAnimation = useSpring({
    loop: true,
    from: { scale: 1 },
    to: async (next) => {
      while (true) {
        await next({ scale: 1.1, config: { duration: 1000 } });
        await next({ scale: 1, config: { duration: 1000 } });
      }
    },
  });

  const sectionHeaderAnimation = useSpring({
    from: { opacity: 0, transform: 'translateX(-20px)' },
    to: { opacity: 1, transform: 'translateX(0)' },
    config: { tension: 300, friction: 20 },
  });

  const Table = ({ columns, data }) => {
    const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable({ columns, data });
    const rowAnimations = useTrail(rows.length, {
      from: { opacity: 0, transform: 'translateX(-10px)' },
      to: { opacity: 1, transform: 'translateX(0)' },
      config: { tension: 280, friction: 20 },
      delay: 200,
    });

    return (
      <animated.div style={tableAnimation} className="overflow-x-auto rounded-lg shadow-lg border border-gray-200 bg-white">
        <table {...getTableProps()} className="w-full text-xs sm:text-sm text-left text-gray-700">
          <thead className="text-xs text-white uppercase bg-indigo-900">
            {headerGroups.map(headerGroup => (
              <tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map(column => (
                  <th {...column.getHeaderProps()} className="px-2 sm:px-4 py-2 sm:py-3">{column.render('Header')}</th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody {...getTableBodyProps()} className="divide-y divide-gray-200">
            {rows.map((row, rowIndex) => {
              prepareRow(row);
              return (
                <animated.tr
                  {...row.getRowProps()}
                  style={rowAnimations[rowIndex]}
                  className={`${rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-indigo-50 transition-colors duration-150`}
                >
                  {row.cells.map(cell => (
                    <td {...cell.getCellProps()} className="px-2 sm:px-4 py-2 sm:py-3">{cell.render('Cell')}</td>
                  ))}
                </animated.tr>
              );
            })}
          </tbody>
        </table>
      </animated.div>
    );
  };

  const spinnerAnimation = useSpring({
    from: { rotate: 0 },
    to: { rotate: 360 },
    loop: true,
    config: { duration: 1000 },
  });

  return (
    <div className="p-3 sm:p-4 md:p-6 bg-gradient-to-br from-gray-100 to-gray-200 min-h-screen mt-3 sm:mt-5">
      {/* KPI CARDS GRID */}
      <div className={`grid gap-2 sm:gap-4 md:gap-6 ${
        userRole === 'STORE_MANAGER' 
          ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6' 
          : 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
      }`}>
        {trail.map((style, index) => {
          const stat = stats[index];
          const countValue = counters[index];
          
          if (!stat || countValue === undefined) return null;
          
          return (
            <animated.div
              key={index}
              style={style}
              className={`p-3 sm:p-4 md:p-6 rounded-lg shadow-lg text-white relative flex flex-col justify-between transition-all duration-300 hover:shadow-2xl ${stat.gradient}`}
            >
              <div className="flex justify-between items-center mb-1 sm:mb-2">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold select-none">
                  <animated.span>
                    {countValue.to(n => Math.floor(n))}
                  </animated.span>
                </h2>
                <span className="text-2xl sm:text-3xl md:text-4xl select-none">{stat.icon}</span>
              </div>
              <p className="mt-1 sm:mt-2 text-xs sm:text-sm md:text-lg font-medium select-none">{stat.title}</p>
              {stat.hasButton && (
                <button
                  onClick={stat.onClick}
                  className="self-end mt-1 sm:mt-2 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 bg-white text-blue-600 rounded hover:bg-gray-100 transition-colors"
                >
                  View All
                </button>
              )}
            </animated.div>
          );
        })}
      </div>



      {/* Users Section */}
      {showUsers && (
        <div id="users-section" className="mt-4 sm:mt-6 md:mt-8">
          <animated.h2 style={sectionHeaderAnimation} className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-800 border-l-4 border-indigo-900 pl-2 sm:pl-3">
            All Users
          </animated.h2>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <animated.div
                style={spinnerAnimation}
                className="rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-indigo-900 border-t-transparent"
              ></animated.div>
            </div>
          ) : (
            <>
              <Table
                columns={[
                  { Header: 'Sr. No.', accessor: (row, i) => i + 1 },
                  { Header: 'Name', accessor: 'name' },
                  { Header: 'Contact Number', accessor: 'phoneNumber' },
                ]}
                data={displayedUsers}
              />
              <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-3">
                <p className="text-xs sm:text-sm text-gray-500">
                  Showing {currentPage * 10 + 1} to {Math.min((currentPage + 1) * 10, displayedUsers.length)} of {displayedUsers.length} entries
                </p>
                <div className="flex flex-wrap justify-center gap-1 sm:gap-2">
                  <button
                    className="px-2 sm:px-3 py-1 text-xs sm:text-sm text-white bg-indigo-900 rounded disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-150"
                    disabled={currentPage === 0}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                  >
                    Previous
                  </button>
                  {[...Array(totalPages)].map((_, index) => (
                    <button
                      key={index}
                      className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded transition-colors duration-150 ${currentPage === index ? "bg-indigo-900 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
                      onClick={() => setCurrentPage(index)}
                    >
                      {index + 1}
                    </button>
                  ))}
                  <button
                    disabled={currentPage === totalPages - 1}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded transition-colors duration-150 ${currentPage === totalPages - 1 ? "bg-gray-300 text-gray-500" : "bg-indigo-900 text-white hover:bg-indigo-600"}`}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Bookings Section */}
      {showBookings && (
        <div id="bookings-section" className="mt-4 sm:mt-6 md:mt-8">
          <animated.h2 style={sectionHeaderAnimation} className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-800 border-l-4 border-teal-400 pl-2 sm:pl-3">
            All Bookings
          </animated.h2>
          <Table
            columns={[
              { Header: 'Sr. No.', accessor: (row, i) => i + 1 },
              { Header: 'Booking ID', accessor: 'bookingId' },
              { Header: 'User', accessor: 'userName' },
              { Header: 'Vehicle', accessor: 'vehicle' },
              { Header: 'Start Date', accessor: 'startDate' },
              { Header: 'End Date', accessor: 'endDate' },
              {
                Header: 'Total Amount',
                accessor: 'totalAmount',
                Cell: ({ value }) => `₹${Number(value).toFixed(2)}`
              },
            ]}
            data={bookings}
          />
          <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-3">
            <p className="text-xs sm:text-sm text-gray-500">
              Showing {currentPage * 10 + 1} to {Math.min((currentPage + 1) * 10, bookings.length)} of {bookings.length} entries
            </p>
            <div className="flex flex-wrap justify-center gap-1 sm:gap-2">
              <button
                className="px-2 sm:px-3 py-1 text-xs sm:text-sm text-white bg-indigo-900 rounded disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-150"
                disabled={currentPage === 0}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                Previous
              </button>
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index}
                  className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded transition-colors duration-150 ${currentPage === index ? "bg-indigo-900 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
                  onClick={() => setCurrentPage(index)}
                >
                  {index + 1}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages - 1}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded transition-colors duration-150 ${currentPage === totalPages - 1 ? "bg-gray-300 text-gray-500" : "bg-indigo-900 text-white hover:bg-indigo-600"}`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stores Section */}
      {showStores && (
        <div id="stores-section" className="mt-4 sm:mt-6 md:mt-8">
          <animated.h2 style={sectionHeaderAnimation} className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-800 border-l-4 border-red-400 pl-2 sm:pl-3">
            All Stores
          </animated.h2>
          <Table
            columns={[
              { Header: 'Sr. No.', accessor: (row, i) => i + 1 },
              { Header: 'Store Name', accessor: 'name' },
              { Header: 'Location', accessor: 'address' },
            ]}
            data={stores}
          />
          <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-3">
            <p className="text-xs sm:text-sm text-gray-500">
              Showing {currentPage * 10 + 1} to {Math.min((currentPage + 1) * 10, stores.length)} of {stores.length} entries
            </p>
            <div className="flex flex-wrap justify-center gap-1 sm:gap-2">
              <button
                className="px-2 sm:px-3 py-1 text-xs sm:text-sm text-white bg-indigo-900 rounded disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-150"
                disabled={currentPage === 0}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                Previous
              </button>
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index}
                  className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded transition-colors duration-150 ${currentPage === index ? "bg-indigo-900 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
                  onClick={() => setCurrentPage(index)}
                >
                  {index + 1}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages - 1}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded transition-colors duration-150 ${currentPage === totalPages - 1 ? "bg-gray-300 text-gray-500" : "bg-indigo-900 text-white hover:bg-indigo-600"}`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bikes Section */}
      {showBikes && (
        <div id="bikes-section" className="mt-4 sm:mt-6 md:mt-8">
          <animated.h2 style={sectionHeaderAnimation} className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-800 border-l-4 border-red-500 pl-2 sm:pl-3">
            All Bikes
          </animated.h2>
          <Table
            columns={[
              { Header: 'Sr. No.', accessor: (row, i) => i + 1 },
              { Header: 'ID', accessor: 'id' },
              { Header: 'Vehicle Number', accessor: 'vehicleRegistrationNumber' },
              { Header: 'Model', accessor: 'model' },
            ]}
            data={bikes}
          />
          <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-3">
            <p className="text-xs sm:text-sm text-gray-500">
              Showing {currentPage * 10 + 1} to {Math.min((currentPage + 1) * 10, bikes.length)} of {bikes.length} entries
            </p>
            <div className="flex flex-wrap justify-center gap-1 sm:gap-2">
              <button
                className="px-2 sm:px-3 py-1 text-xs sm:text-sm text-white bg-indigo-900 rounded disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-150"
                disabled={currentPage === 0}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                Previous
              </button>
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index}
                  className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded transition-colors duration-150 ${currentPage === index ? "bg-indigo-900 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
                  onClick={() => setCurrentPage(index)}
                >
                  {index + 1}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages - 1}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded transition-colors duration-150 ${currentPage === totalPages - 1 ? "bg-gray-300 text-gray-500" : "bg-indigo-900 text-white hover:bg-indigo-600"}`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Today's Bookings Section */}
      {showTodaysBookings && (
        <div id="todays-bookings-section" className="mt-4 sm:mt-6 md:mt-8">
          <animated.h2 style={sectionHeaderAnimation} className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-800 border-l-4 border-indigo-900 pl-2 sm:pl-3">
            Today's Bookings
          </animated.h2>
          <Table
            columns={[
              { Header: 'Sr. No.', accessor: (row, i) => i + 1 },
              { Header: 'Booking ID', accessor: 'bookingId' },
              { Header: 'User', accessor: 'userName' },
              { Header: 'Vehicle', accessor: 'vehicle' },
              { Header: 'Start Date', accessor: 'startDate' },
              { Header: 'End Date', accessor: 'endDate' },
              {
                Header: 'Total Amount',
                accessor: 'totalAmount',
                Cell: ({ value }) => `₹${Number(value).toFixed(2)}`
              },
            ]}
            data={todaysBookings}
          />
          <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-3">
            <p className="text-xs sm:text-sm text-gray-500">
              Showing {currentPage * 10 + 1} to {Math.min((currentPage + 1) * 10, todaysBookings.length)} of {todaysBookings.length} entries
            </p>
            <div className="flex flex-wrap justify-center gap-1 sm:gap-2">
              <button
                className="px-2 sm:px-3 py-1 text-xs sm:text-sm text-white bg-indigo-900 rounded disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-150"
                disabled={currentPage === 0}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                Previous
              </button>
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index}
                  className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded transition-colors duration-150 ${currentPage === index ? "bg-indigo-900 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
                  onClick={() => setCurrentPage(index)}
                >
                  {index + 1}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages - 1}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded transition-colors duration-150 ${currentPage === totalPages - 1 ? "bg-gray-300 text-gray-500" : "bg-indigo-900 text-white hover:bg-indigo-600"}`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ongoing Bookings Section */}
      {showOngoingBookings && (
        <div id="ongoing-bookings-section" className="mt-4 sm:mt-6 md:mt-8">
          <animated.h2 style={sectionHeaderAnimation} className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-800 border-l-4 border-yellow-400 pl-2 sm:pl-3">
            Ongoing Bookings
          </animated.h2>
          <Table
            columns={[
              { Header: 'Sr. No.', accessor: (row, i) => i + 1 },
              { Header: 'Booking ID', accessor: 'bookingId' },
              { Header: 'User', accessor: 'userName' },
              { Header: 'Vehicle', accessor: 'vehicle' },
              { Header: 'Start Date', accessor: 'startDate' },
              { Header: 'End Date', accessor: 'endDate' },
              {
                Header: 'Total Amount',
                accessor: 'totalAmount',
                Cell: ({ value }) => `₹${Number(value).toFixed(2)}`
              },
            ]}
            data={ongoingBookings}
          />
          <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-3">
            <p className="text-xs sm:text-sm text-gray-500">
              Showing {currentPage * 10 + 1} to {Math.min((currentPage + 1) * 10, ongoingBookings.length)} of {ongoingBookings.length} entries
            </p>
            <div className="flex flex-wrap justify-center gap-1 sm:gap-2">
              <button
                className="px-2 sm:px-3 py-1 text-xs sm:text-sm text-white bg-indigo-900 rounded disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-150"
                disabled={currentPage === 0}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                Previous
              </button>
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index}
                  className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded transition-colors duration-150 ${currentPage === index ? "bg-indigo-900 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
                  onClick={() => setCurrentPage(index)}
                >
                  {index + 1}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages - 1}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded transition-colors duration-150 ${currentPage === totalPages - 1 ? "bg-gray-300 text-gray-500" : "bg-indigo-900 text-white hover:bg-indigo-600"}`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scroll to Top Button */}
      <animated.button
        onClick={scrollToTop}
        style={pulseAnimation}
        className="fixed bottom-3 right-3 sm:bottom-4 sm:right-4 bg-indigo-900 text-white p-2 sm:p-3 rounded-full shadow-lg hover:bg-indigo-600 transition-all duration-200 z-50 flex items-center justify-center"
      >
        <span className="text-lg sm:text-xl">↑</span>
      </animated.button>
    </div>
  );
};

export default Home;
