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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const cardsSpringRef = useSpringRef();
  const tableSpringRef = useSpringRef();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get("/users/all", {
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

    const fetchBookings = async () => {
      try {
        const response = await apiClient.get("/booking/all");
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
        const response = await apiClient.get("/store/all");
        setStores(response.data.content);
      } catch (error) {
        console.error("Error fetching stores data:", error);
      }
    };

    const fetchBikes = async () => {
      try {
        const response = await apiClient.get("/vehicle/all");
        setBikes(response.data.content);
      } catch (error) {
        console.error("Error fetching bikes data:", error);
      }
    };

    fetchUsers();
    fetchBookings();
    fetchStores();
    fetchBikes();
  }, [currentPage]);

  // Navigation Handlers
  const handleViewAllBookings = () => {
    navigate("/dashboard/allBookings");
  };

  const handleViewAllBikes = () => {
    navigate("/dashboard/allBikes");
  };

  const handleViewAllStores = () => {
    navigate("/dashboard/storeMaster");
  };

  const handleViewAllUsers = () => {
    navigate("/dashboard/allUsers");
  };

  const handleViewTodaysBookings = () => {
    navigate("/dashboard/allBookings");
  };

  const handleViewOngoingBookings = () => {
    navigate("/dashboard/allBookings");
  };

  const handleViewVerifiedUsers = () => {
    navigate("/dashboard/allUsers");
  };

  const handleViewUnverifiedUsers = () => {
    navigate("/dashboard/allUsers");
  };

  const stats = [
  {
    title: "Today's Bookings",
    count: todaysBookings.length,
    gradient: "bg-gradient-to-br from-indigo-700 to-blue-600",
    icon: "📅",
    hasButton: true,
    onClick: handleViewTodaysBookings,
  },
  {
    title: "Ongoing Bookings",
    count: ongoingBookings.length,
    gradient: "bg-gradient-to-br from-yellow-400 to-yellow-300",
    icon: "🔄",
    hasButton: true,
    onClick: () => navigate("/dashboard/allBookings"),
  },
  {
    title: "Cancelled Bookings",
    count: bookings.filter(b => b.status === 'CANCELLED').length,
    gradient: "bg-gradient-to-br from-red-500 to-red-400",
    icon: "❌",
    hasButton: true, // Updated to true
    onClick: () => navigate("/dashboard/allBookings"), // Added navigation
  },
  {
    title: "Total Users",
    count: users.length,
    gradient: "bg-gradient-to-br from-cyan-500 to-cyan-400",
    icon: "👥",
    hasButton: true,
    onClick: handleViewAllUsers,
  },
  {
    title: "Total Verified Users",
    count: verifiedUsers.length,
    gradient: "bg-gradient-to-br from-green-500 to-green-400",
    icon: "✅",
    hasButton: true,
    onClick: () => navigate("/dashboard/verifiedUsers"),
  },
  {
    title: "Total Unverified Users",
    count: unverifiedUsers.length,
    gradient: "bg-gradient-to-br from-yellow-400 to-yellow-300",
    icon: "⚠️",
    hasButton: true,
    onClick: () => navigate("/dashboard/unverifiedUsers"),
  },
  {
    title: "Users With 0 Bookings",
    count: users.filter(user => user.bookingCount === 0).length,
    gradient: "bg-gradient-to-br from-red-500 to-red-400",
    icon: "❗",
    hasButton: true, // Updated to true
    onClick: () => navigate("/dashboard/allBookings"), // Added navigation
  },
  {
    title: "Total Service Orders",
    count: 62,
    gradient: "bg-gradient-to-br from-indigo-700 to-blue-600",
    icon: "⚙️",
    hasButton: true, // Updated to true
    onClick: () => navigate("/dashboard/serviceOrders"), // Added navigation
  },
  {
    title: "Total Bike Sales",
    count: 72,
    gradient: "bg-gradient-to-br from-blue-700 to-indigo-600",
    icon: "🛒",
    hasButton: true,
    onClick: handleViewAllBikes,
  },
  {
    title: "Total Bookings",
    count: bookings.length,
    gradient: "bg-gradient-to-br from-teal-500 to-teal-400",
    icon: "📚",
    hasButton: true,
    onClick: handleViewAllBookings,
  },
  {
    title: "Total Stores",
    count: stores.length,
    gradient: "bg-gradient-to-br from-red-600 to-red-500",
    icon: "🏪",
    hasButton: true,
    onClick: handleViewAllStores,
  },
  {
    title: "Total Bikes",
    count: bikes.length,
    gradient: "bg-gradient-to-br from-red-700 to-red-600",
    icon: "🏍️",
    hasButton: true,
    onClick: handleViewAllBikes,
  },
];


  const useCounter = (end, duration = 2000) => {
    const { number } = useSpring({
      from: { number: 0 },
      number: end,
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
        <table {...getTableProps()} className="w-full text-sm text-left text-gray-700">
          <thead className="text-xs text-white uppercase bg-indigo-900">
            {headerGroups.map(headerGroup => (
              <tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map(column => (
                  <th {...column.getHeaderProps()} className="px-4 py-3">{column.render('Header')}</th>
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
                    <td {...cell.getCellProps()} className="px-4 py-3">{cell.render('Cell')}</td>
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
    <div className="p-6 bg-gradient-to-br from-gray-100 to-gray-200 min-h-screen mt-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {trail.map((style, index) => {
          const stat = stats[index];
          const countValue = counters[index];
          return (
            <animated.div
              key={index}
              style={style}
              className={`p-6 shadow-lg text-white relative flex flex-col justify-between transition-all duration-300 hover:shadow-2xl ${stat.gradient}`}
            >
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-4xl font-extrabold select-none">
                  <animated.span>
                    {countValue.to(n => Math.floor(n))}
                  </animated.span>
                </h2>
                <span className="text-4xl select-none">{stat.icon}</span>
              </div>
              <p className="mt-2 text-lg font-medium select-none">{stat.title}</p>
              {stat.hasButton && (
                <button
                  onClick={stat.onClick}
                  className="self-end mt-2 text-xs px-2 py-1 bg-white text-blue-600 rounded hover:bg-gray-100"
                >
                  View All
                </button>
              )}
            </animated.div>
          );
        })}
      </div>

      {showUsers && (
        <div id="users-section" className="mt-8">
          <animated.h2 style={sectionHeaderAnimation} className="text-xl font-bold mb-4 text-gray-800 border-l-4 border-indigo-900 pl-3">
            All Users
          </animated.h2>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <animated.div
                style={spinnerAnimation}
                className="rounded-full h-12 w-12 border-4 border-indigo-900 border-t-transparent"
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
              <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-gray-500">
                  Showing {currentPage * 10 + 1} to {Math.min((currentPage + 1) * 10, displayedUsers.length)} of {displayedUsers.length} entries
                </p>
                <div className="flex space-x-2">
                  <button
                    className="px-3 py-1 text-sm text-white bg-indigo-900 rounded disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-150"
                    disabled={currentPage === 0}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                  >
                    Previous
                  </button>
                  {[...Array(totalPages)].map((_, index) => (
                    <button
                      key={index}
                      className={`px-3 py-1 rounded transition-colors duration-150 ${currentPage === index ? "bg-indigo-900 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
                      onClick={() => setCurrentPage(index)}
                    >
                      {index + 1}
                    </button>
                  ))}
                  <button
                    disabled={currentPage === totalPages - 1}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    className={`px-3 py-1 rounded transition-colors duration-150 ${currentPage === totalPages - 1 ? "bg-gray-300 text-gray-500" : "bg-indigo-900 text-white hover:bg-indigo-600"}`}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {showBookings && (
        <div id="bookings-section" className="mt-8">
          <animated.h2 style={sectionHeaderAnimation} className="text-xl font-bold mb-4 text-gray-800 border-l-4 border-teal-400 pl-3">
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
          <div className="flex justify-between items-center mt-4">
            <p className="text-sm text-gray-500">
              Showing {currentPage * 10 + 1} to {Math.min((currentPage + 1) * 10, bookings.length)} of {bookings.length} entries
            </p>
            <div className="flex space-x-2">
              <button
                className="px-3 py-1 text-sm text-white bg-indigo-900 rounded disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-150"
                disabled={currentPage === 0}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                Previous
              </button>
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index}
                  className={`px-3 py-1 rounded transition-colors duration-150 ${currentPage === index ? "bg-indigo-900 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
                  onClick={() => setCurrentPage(index)}
                >
                  {index + 1}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages - 1}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className={`px-3 py-1 rounded transition-colors duration-150 ${currentPage === totalPages - 1 ? "bg-gray-300 text-gray-500" : "bg-indigo-900 text-white hover:bg-indigo-600"}`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {showStores && (
        <div id="stores-section" className="mt-8">
          <animated.h2 style={sectionHeaderAnimation} className="text-xl font-bold mb-4 text-gray-800 border-l-4 border-red-400 pl-3">
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
          <div className="flex justify-between items-center mt-4">
            <p className="text-sm text-gray-500">
              Showing {currentPage * 10 + 1} to {Math.min((currentPage + 1) * 10, stores.length)} of {stores.length} entries
            </p>
            <div className="flex space-x-2">
              <button
                className="px-3 py-1 text-sm text-white bg-indigo-900 rounded disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-150"
                disabled={currentPage === 0}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                Previous
              </button>
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index}
                  className={`px-3 py-1 rounded transition-colors duration-150 ${currentPage === index ? "bg-indigo-900 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
                  onClick={() => setCurrentPage(index)}
                >
                  {index + 1}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages - 1}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className={`px-3 py-1 rounded transition-colors duration-150 ${currentPage === totalPages - 1 ? "bg-gray-300 text-gray-500" : "bg-indigo-900 text-white hover:bg-indigo-600"}`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {showBikes && (
        <div id="bikes-section" className="mt-8">
          <animated.h2 style={sectionHeaderAnimation} className="text-xl font-bold mb-4 text-gray-800 border-l-4 border-red-500 pl-3">
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
          <div className="flex justify-between items-center mt-4">
            <p className="text-sm text-gray-500">
              Showing {currentPage * 10 + 1} to {Math.min((currentPage + 1) * 10, bikes.length)} of {bikes.length} entries
            </p>
            <div className="flex space-x-2">
              <button
                className="px-3 py-1 text-sm text-white bg-indigo-900 rounded disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-150"
                disabled={currentPage === 0}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                Previous
              </button>
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index}
                  className={`px-3 py-1 rounded transition-colors duration-150 ${currentPage === index ? "bg-indigo-900 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
                  onClick={() => setCurrentPage(index)}
                >
                  {index + 1}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages - 1}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className={`px-3 py-1 rounded transition-colors duration-150 ${currentPage === totalPages - 1 ? "bg-gray-300 text-gray-500" : "bg-indigo-900 text-white hover:bg-indigo-600"}`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {showTodaysBookings && (
        <div id="todays-bookings-section" className="mt-8">
          <animated.h2 style={sectionHeaderAnimation} className="text-xl font-bold mb-4 text-gray-800 border-l-4 border-indigo-900 pl-3">
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
          <div className="flex justify-between items-center mt-4">
            <p className="text-sm text-gray-500">
              Showing {currentPage * 10 + 1} to {Math.min((currentPage + 1) * 10, todaysBookings.length)} of {todaysBookings.length} entries
            </p>
            <div className="flex space-x-2">
              <button
                className="px-3 py-1 text-sm text-white bg-indigo-900 rounded disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-150"
                disabled={currentPage === 0}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                Previous
              </button>
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index}
                  className={`px-3 py-1 rounded transition-colors duration-150 ${currentPage === index ? "bg-indigo-900 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
                  onClick={() => setCurrentPage(index)}
                >
                  {index + 1}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages - 1}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className={`px-3 py-1 rounded transition-colors duration-150 ${currentPage === totalPages - 1 ? "bg-gray-300 text-gray-500" : "bg-indigo-900 text-white hover:bg-indigo-600"}`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {showOngoingBookings && (
        <div id="ongoing-bookings-section" className="mt-8">
          <animated.h2 style={sectionHeaderAnimation} className="text-xl font-bold mb-4 text-gray-800 border-l-4 border-yellow-400 pl-3">
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
          <div className="flex justify-between items-center mt-4">
            <p className="text-sm text-gray-500">
              Showing {currentPage * 10 + 1} to {Math.min((currentPage + 1) * 10, ongoingBookings.length)} of {ongoingBookings.length} entries
            </p>
            <div className="flex space-x-2">
              <button
                className="px-3 py-1 text-sm text-white bg-indigo-900 rounded disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-150"
                disabled={currentPage === 0}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                Previous
              </button>
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index}
                  className={`px-3 py-1 rounded transition-colors duration-150 ${currentPage === index ? "bg-indigo-900 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
                  onClick={() => setCurrentPage(index)}
                >
                  {index + 1}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages - 1}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className={`px-3 py-1 rounded transition-colors duration-150 ${currentPage === totalPages - 1 ? "bg-gray-300 text-gray-500" : "bg-indigo-900 text-white hover:bg-indigo-600"}`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      <animated.button
        onClick={scrollToTop}
        style={pulseAnimation}
        className="fixed bottom-4 right-4 bg-indigo-900 text-white p-3 rounded-full shadow-lg hover:bg-indigo-600 transition-all duration-200 z-50 flex items-center justify-center"
      >
        <span className="text-xl">↑</span>
      </animated.button>
    </div>
  );
};

export default Home;
