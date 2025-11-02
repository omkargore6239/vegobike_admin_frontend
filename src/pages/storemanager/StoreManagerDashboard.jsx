// pages/StoreManagerDashboard.jsx
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const StoreManagerDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = {
      name: localStorage.getItem("userName"),
      email: localStorage.getItem("userEmail"),
      storeId: localStorage.getItem("storeId"),
      role: parseInt(localStorage.getItem("userRole"))
    };
    setUser(userData);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.dispatchEvent(new Event('authChange'));
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-indigo-600 text-white p-4 shadow-lg">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold">Store Manager Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Welcome, {user?.name}!
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg">
              <p className="text-sm opacity-75">Total Sales</p>
              <p className="text-3xl font-bold mt-2">$0.00</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg">
              <p className="text-sm opacity-75">Total Orders</p>
              <p className="text-3xl font-bold mt-2">0</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg">
              <p className="text-sm opacity-75">Store ID</p>
              <p className="text-2xl font-bold mt-2">{user?.storeId}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StoreManagerDashboard;
