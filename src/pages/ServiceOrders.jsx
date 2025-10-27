//////////////////////paes/ServiceOrders

import { useState, useEffect } from "react";
import { FaEdit } from "react-icons/fa";
import axios from "axios";
// import CreateServiceOrder from "../pages/ServiceOrder/CreateServiceOrder";
// import EditServiceOrder from "../pages/ServiceOrder/EditServiceOrder";

// Helper function to get status badge
const getStatusBadge = (statusId) => {
  const statusMap = {
    1: { name: "Pending", color: "bg-yellow-500" },
    2: { name: "Accepted", color: "bg-green-500" },
    3: { name: "Rejected", color: "bg-red-500" },
    4: { name: "In Progress", color: "bg-blue-500" },
    5: { name: "Completed", color: "bg-teal-500" },
    6: { name: "Cancelled", color: "bg-gray-500" },
  };

  const status = statusMap[statusId] || { name: "Unknown", color: "bg-gray-500" };
  return (
    <span className={`${status.color} text-white px-3 py-1 rounded text-xs font-medium`}>
      {status.name}
    </span>
  );
};

const ServiceOrdersList = () => {
  const [orders, setOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [viewMode, setViewMode] = useState("list"); // "list", "create", "edit"
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/service-orders`);
      if (Array.isArray(response.data)) {
        setOrders(response.data);
      } else if (response.data && response.data.content && Array.isArray(response.data.content)) {
        setOrders(response.data.content);
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        setOrders(response.data.data);
      } else {
        console.error("Unexpected data structure:", response.data);
        setOrders([]);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      setError("Failed to fetch orders. Please try again.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = orders.filter((item) => {
    if (!item) return false;
    const customerName = item.customer || item.customerName || '';
    const matchesSearch = customerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "" || item.orderStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentData = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));

  const goToPage = (page) => {
    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;
    setCurrentPage(page);
  };

  const handleCreateNew = () => {
    setViewMode("create");
  };

  const handleEditOrder = async (order) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/service-orders/${order.id}`);
      setSelectedOrder(response.data);
      setViewMode("edit");
    } catch (error) {
      console.error("Error fetching order details:", error);
      setError("Failed to fetch order details. Please try again.");
    }
  };

  const handleBackToList = () => {
    setViewMode("list");
    setSelectedOrder(null);
    fetchOrders();
  };

  const handleOrderCreated = async (newOrder) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/service-orders`, newOrder);
      setOrders([...orders, response.data]);
      setViewMode("list");
    } catch (error) {
      console.error("Error creating order:", error);
      setError("Failed to create order. Please try again.");
    }
  };

  const handleOrderUpdated = async (updatedOrder) => {
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_BASE_URL}/api/service-orders/update/${updatedOrder.id}`,
        updatedOrder
      );
      setOrders(orders.map((o) => (o.id === response.data.id ? response.data : o)));
      setViewMode("list");
      setSelectedOrder(null);
    } catch (error) {
      console.error("Error updating order:", error);
      setError("Failed to update order. Please try again.");
    }
  };

  // // Show Create Form
  // if (viewMode === "create") {
  //   return (
  //     <CreateServiceOrder
  //       onBack={handleBackToList}
  //       onOrderCreated={handleOrderCreated}
  //       nextOrderId={`#Order${String(orders.length + 1).padStart(6, "0")}`}
  //     />
  //   );
  // }

  // Show Edit Form
  if (viewMode === "edit" && selectedOrder) {
    return (
      <EditServiceOrder
        order={selectedOrder}
        onBack={handleBackToList}
        onOrderUpdated={handleOrderUpdated}
      />
    );
  }

  // Show List View
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="bg-white rounded-lg shadow-sm">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800">
            Service Orders ({orders.length} total)
          </h3>
          <button
            onClick={handleCreateNew}
            className="px-4 py-2 bg-blue-900 text-white rounded hover:bg-blue-800 text-sm font-medium flex items-center gap-2"
          >
            <span className="text-lg">+</span> Add Service Order
          </button>
        </div>
        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-4 text-red-900 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}
        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 px-6 py-4 bg-gray-50">
          <input
            type="text"
            placeholder="Type in to Search"
            className="border border-gray-300 px-4 py-2 rounded text-sm w-full sm:w-64 focus:ring-2 focus:ring-blue-500"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="border border-gray-300 px-4 py-2 rounded text-sm w-full sm:w-48"
          >
            <option value="">Select Order Status</option>
            <option value="Pending">Pending</option>
            <option value="Accepted">Accepted</option>
            <option value="Rejected">Rejected</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
            <p className="mt-2 text-gray-600">Loading orders...</p>
          </div>
        )}
        {/* Table */}
        {!loading && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-blue-900 text-white">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">ID</th>
                  <th className="px-4 py-3 text-left font-medium">Order ID</th>
                  <th className="px-4 py-3 text-left font-medium">Customer</th>
                  <th className="px-4 py-3 text-left font-medium">Order Amount</th>
                  <th className="px-4 py-3 text-left font-medium">Order Status</th>
                  <th className="px-4 py-3 text-left font-medium">Payment Method</th>
                  <th className="px-4 py-3 text-left font-medium">Payment Status</th>
                  <th className="px-4 py-3 text-left font-medium">Order Date</th>
                  <th className="px-4 py-3 text-left font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentData.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-gray-500">
                      {loading ? "Loading..." : "No data found"}
                    </td>
                  </tr>
                ) : (
                  currentData.map((order, index) => (
                    <tr
                      key={order.id || index}
                      className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50 transition-colors`}
                    >
                      <td className="px-4 py-3 text-gray-700">{indexOfFirstItem + index + 1}</td>
                      <td className="px-4 py-3 text-blue-600 font-medium">
                        {order.orderId || order.orderNumber || `#${order.id}`}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {order.customer || order.customerName || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {order.orderAmount || order.amount || 0}
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(order.orderStatus || 1)}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {order.paymentMethod || order.payment || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {order.paymentStatus || order.payStatus || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {order.orderDate || order.createdAt || order.date || 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleEditOrder(order)}
                          className="p-2 bg-blue-900 text-white rounded hover:bg-blue-800"
                          title="Edit"
                        >
                          <FaEdit size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        {/* Pagination */}
        {!loading && filteredData.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredData.length)} of {filteredData.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => goToPage(currentPage - 1)}
                className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded disabled:opacity-50 hover:bg-gray-300"
              >
                Previous
              </button>
              {[...Array(Math.min(5, totalPages))].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => goToPage(i + 1)}
                  className={`px-3 py-1.5 text-sm rounded ${
                    currentPage === i + 1 ? "bg-blue-900 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => goToPage(currentPage + 1)}
                className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded disabled:opacity-50 hover:bg-gray-300"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceOrdersList;
