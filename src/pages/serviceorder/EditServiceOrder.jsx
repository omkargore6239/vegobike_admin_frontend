
/////////////////pages/servieorder/EditServiceOrder

import { useState, useEffect } from "react";
import { FaTimes, FaTrash } from "react-icons/fa";
import axios from "axios";

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

// Add Master Service Modal
const AddMasterServiceModal = ({ isOpen, onClose, onAdd }) => {
  const [masterData, setMasterData] = useState({
    serviceName: "",
    serviceImage: "",
    price: "",
  });
  if (!isOpen) return null;
  const handleImageChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setMasterData({ ...masterData, serviceImage: url });
    }
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(masterData);
    setMasterData({
      serviceName: "",
      serviceImage: "",
      price: "",
    });
    onClose();
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Add Master Service</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FaTimes size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Service Name *</label>
              <input
                type="text"
                value={masterData.serviceName}
                onChange={(e) => setMasterData({ ...masterData, serviceName: e.target.value })}
                placeholder="e.g., Oil Change"
                className="w-full border border-gray-300 px-3 py-2 rounded text-sm focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Price *</label>
              <input
                type="number"
                value={masterData.price}
                onChange={(e) => setMasterData({ ...masterData, price: e.target.value })}
                placeholder="e.g., 500"
                className="w-full border border-gray-300 px-3 py-2 rounded text-sm focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Service Image</label>
              <input
                type="file"
                onChange={handleImageChange}
                accept="image/*"
                className="w-full border border-gray-300 px-3 py-2 rounded text-sm"
              />
              {masterData.serviceImage && (
                <div className="mt-3">
                  <img
                    src={masterData.serviceImage}
                    alt="Preview"
                    className="w-32 h-32 object-cover border border-gray-300 rounded"
                  />
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-900 text-white rounded hover:bg-blue-800 text-sm font-medium"
            >
              Add Service
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Add Service Modal (Quick)
const AddServiceModal = ({ isOpen, onClose, onAdd }) => {
  const [serviceData, setServiceData] = useState({
    service: "",
    price: "",
  });
  if (!isOpen) return null;
  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(serviceData);
    setServiceData({ service: "", price: "" });
    onClose();
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Add Service</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FaTimes size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-1 text-gray-700 text-sm font-medium">Service Name *</label>
            <input
              type="text"
              value={serviceData.service}
              onChange={(e) => setServiceData({ ...serviceData, service: e.target.value })}
              placeholder="e.g., Air Filter"
              className="w-full border border-gray-300 px-3 py-2 rounded text-sm"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1 text-gray-700 text-sm font-medium">Price *</label>
            <input
              type="number"
              value={serviceData.price}
              onChange={(e) => setServiceData({ ...serviceData, price: e.target.value })}
              placeholder="e.g., 500"
              className="w-full border border-gray-300 px-3 py-2 rounded text-sm"
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-900 text-white rounded hover:bg-blue-800 text-sm"
            >
              Add Service
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EditServiceOrder = ({ order, onBack, onOrderUpdated }) => {
  // Status options for select dropdown
  const statusOptions = [
    { value: "1", label: "Pending" },
    { value: "2", label: "Accepted" },
    { value: "3", label: "Rejected" },
    { value: "4", label: "In Progress" },
    { value: "5", label: "Completed" },
    { value: "6", label: "Cancelled" },
  ];

  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showMasterServiceModal, setShowMasterServiceModal] = useState(false);
  const [orderItems, setOrderItems] = useState([]);
  const [vehicleInfo, setVehicleInfo] = useState({ brand: "", model: "" });
  const [formData, setFormData] = useState({
    orderId: "",
    customerName: "",
    customerEmail: "",
    serviceDate: "",
    serviceTime: "",
    vehicleNumber: "",
    kilometer: "",
    engineNumber: "",
    chasisNumber: "",
    orderStatus: "",
    paymentMethod: "",
    paymentStatus: "",
    nextServiceDate: "",
    nextComment: "",
  });
  const [additionalDiscount, setAdditionalDiscount] = useState({
    type: "percent",
    value: 0,
  });

  // Set form data and order items from the order prop
  useEffect(() => {
    if (order) {
      setFormData({
        orderId: order.orderId || order.id || "",
        customerName: order.customerName || order.customer || "",
        customerEmail: order.customerEmail || "",
        serviceDate: order.serviceDate || "",
        serviceTime: order.slotTime || order.serviceTime || "",
        vehicleNumber: order.vehicleNumber || "",
        kilometer: order.kilometer || "",
        engineNumber: order.engineNumber || "",
        chasisNumber: order.chasisNumber || "",
        orderStatus: order.orderStatus ? order.orderStatus.toString() : "1", // Convert to string for select
        paymentMethod: order.paymentMethod || "",
        paymentStatus: order.paymentStatus || "",
        nextServiceDate: order.nextServiceDate || "",
        nextComment: order.serviceComments || order.nextComment || "",
      });
      setOrderItems(order.orderItems || []);
      setVehicleInfo(order.vehicleInfo || { brand: "", model: "" });
    }
  }, [order]);

  const calculateItemTotal = (item) => {
    const baseAmount = item.price * item.qty;
    let discountAmount = 0;
    if (item.discountType === "percent") {
      discountAmount = (baseAmount * item.discountValue) / 100;
    } else {
      discountAmount = item.discountValue;
    }
    return {
      baseAmount,
      discountAmount,
      finalAmount: baseAmount - discountAmount,
    };
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let totalServiceDiscount = 0;
    orderItems.forEach((item) => {
      const itemCalc = calculateItemTotal(item);
      subtotal += itemCalc.baseAmount;
      totalServiceDiscount += itemCalc.discountAmount;
    });
    const afterServiceDiscount = subtotal - totalServiceDiscount;
    let additionalDiscountAmount = 0;
    if (additionalDiscount.type === "percent") {
      additionalDiscountAmount = (afterServiceDiscount * additionalDiscount.value) / 100;
    } else {
      additionalDiscountAmount = additionalDiscount.value;
    }
    const finalAmount = afterServiceDiscount - additionalDiscountAmount;
    return {
      subtotal,
      totalServiceDiscount,
      afterServiceDiscount,
      additionalDiscountAmount,
      finalAmount,
    };
  };

  const totals = calculateTotals();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAdditionalDiscountChange = (field, value) => {
    setAdditionalDiscount((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddMasterService = (masterData) => {
    const newItem = {
      id: orderItems.length + 1,
      serviceName: masterData.serviceName,
      price: parseFloat(masterData.price) || 0,
      qty: 1,
      discountType: "percent",
      discountValue: 0,
    };
    setOrderItems([...orderItems, newItem]);
    alert(`Service "${masterData.serviceName}" added!`);
  };

  const handleAddServiceToOrder = (serviceData) => {
    const newItem = {
      id: orderItems.length + 1,
      serviceName: serviceData.service,
      price: parseFloat(serviceData.price) || 500,
      qty: 1,
      discountType: "percent",
      discountValue: 0,
    };
    setOrderItems([...orderItems, newItem]);
  };

  const handleDeleteOrderItem = (id) => {
    if (window.confirm("Are you sure?")) {
      setOrderItems(orderItems.filter((item) => item.id !== id));
    }
  };

  const handleUpdateOrderItem = (id, field, value) => {
    setOrderItems(
      orderItems.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const updatedOrder = {
      id: order.id,
      customerId: order.customerId,
      customerName: formData.customerName,
      customerEmail: formData.customerEmail,
      storeId: order.storeId,
      serviceAddressType: order.serviceAddressType,
      vehicleNumber: formData.vehicleNumber,
      chasisNumber: formData.chasisNumber,
      engineNumber: formData.engineNumber,
      orderAmount: totals.subtotal,
      finalAmount: totals.finalAmount,
      discountType: 0,
      percent: 0,
      orderStatus: parseInt(formData.orderStatus), // Convert string to int for backend
      paymentMethod: formData.paymentMethod,
      paymentStatus: formData.paymentStatus,
      slotTime: formData.serviceTime,
      serviceComments: formData.nextComment,
      nextServiceDate: formData.nextServiceDate,
      orderItems: orderItems,
    };
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_BASE_URL}/api/service-orders/update/${order.id}`,
        updatedOrder
      );
      onOrderUpdated(response.data);
      alert("Order updated successfully!");
    } catch (error) {
      console.error("Error updating order:", error.response?.data || error.message);
      alert(`Failed to update order: ${error.response?.data?.message || error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AddMasterServiceModal
        isOpen={showMasterServiceModal}
        onClose={() => setShowMasterServiceModal(false)}
        onAdd={handleAddMasterService}
      />
      <AddServiceModal
        isOpen={showServiceModal}
        onClose={() => setShowServiceModal(false)}
        onAdd={handleAddServiceToOrder}
      />
      <div className="p-2 sm:p-4 w-full">
        <div className="flex flex-col xl:flex-row gap-3 w-full max-w-[1400px] mx-auto">
          <div className="flex-1 bg-white p-3 rounded-lg shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <button
                onClick={onBack}
                className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-xs"
              >
                ← Back
              </button>
              <h2 className="text-base font-semibold text-gray-800">Edit Order Details</h2>
            </div>
            <form onSubmit={handleSubmit}>
              {/* Basic Info Grid */}
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1.5 mb-3">
                <div className="col-span-2">
                  <label className="block mb-0.5 text-gray-700 text-[9px] font-medium">Order ID</label>
                  <input
                    type="text"
                    value={formData.orderId}
                    className="w-full border border-gray-300 px-1.5 py-0.5 rounded text-[10px] bg-gray-50"
                    disabled
                  />
                </div>
                <div className="col-span-2">
                  <label className="block mb-0.5 text-gray-700 text-[9px] font-medium">Customer</label>
                  <input
                    type="text"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 px-1.5 py-0.5 rounded text-[10px]"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block mb-0.5 text-gray-700 text-[9px] font-medium">Service Date</label>
                  <input
                    type="date"
                    name="serviceDate"
                    value={formData.serviceDate}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 px-1.5 py-0.5 rounded text-[10px]"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block mb-0.5 text-gray-700 text-[9px] font-medium">Time Slot</label>
                  <input
                    type="text"
                    name="serviceTime"
                    value={formData.serviceTime}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 px-1.5 py-0.5 rounded text-[10px]"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block mb-0.5 text-gray-700 text-[9px] font-medium">Vehicle</label>
                  <input
                    type="text"
                    name="vehicleNumber"
                    value={formData.vehicleNumber}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 px-1.5 py-0.5 rounded text-[10px]"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block mb-0.5 text-gray-700 text-[9px] font-medium">KM</label>
                  <input
                    type="text"
                    name="kilometer"
                    value={formData.kilometer}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 px-1.5 py-0.5 rounded text-[10px]"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block mb-0.5 text-gray-700 text-[9px] font-medium">Engine</label>
                  <input
                    type="text"
                    name="engineNumber"
                    value={formData.engineNumber}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 px-1.5 py-0.5 rounded text-[10px]"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block mb-0.5 text-gray-700 text-[9px] font-medium">Chassis</label>
                  <input
                    type="text"
                    name="chasisNumber"
                    value={formData.chasisNumber}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 px-1.5 py-0.5 rounded text-[10px]"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block mb-0.5 text-gray-700 text-[9px] font-medium">Order Status</label>
                  <select
                    name="orderStatus"
                    value={formData.orderStatus}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 px-1.5 py-0.5 rounded text-[10px]"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block mb-0.5 text-gray-700 text-[9px] font-medium">Payment Method</label>
                  <select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 px-1.5 py-0.5 rounded text-[10px]"
                  >
                    <option value="Cash on Delivery">COD</option>
                    <option value="Online">Online</option>
                    <option value="Card">Card</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block mb-0.5 text-gray-700 text-[9px] font-medium">Payment Status</label>
                  <select
                    name="paymentStatus"
                    value={formData.paymentStatus}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 px-1.5 py-0.5 rounded text-[10px]"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Unpaid">Unpaid</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block mb-0.5 text-gray-700 text-[9px] font-medium">Next Service</label>
                  <input
                    type="date"
                    name="nextServiceDate"
                    value={formData.nextServiceDate}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 px-1.5 py-0.5 rounded text-[10px]"
                  />
                </div>
                <div className="col-span-4 sm:col-span-6 md:col-span-8">
                  <label className="block mb-0.5 text-gray-700 text-[9px] font-medium">Next Servicing Comment</label>
                  <textarea
                    name="nextComment"
                    value={formData.nextComment}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 px-1.5 py-0.5 rounded text-[10px] h-10 resize-none"
                  />
                </div>
              </div>
              {/* Vehicle Info - READ ONLY */}
              <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-gray-800">Vehicle:</span>
                  <span className="text-[10px] text-blue-900 font-bold">{vehicleInfo.brand} {vehicleInfo.model}</span>
                  <span className="text-[8px] text-gray-500">(from customer order)</span>
                </div>
              </div>
              {/* Order Items Table - WITH PER-SERVICE DISCOUNT */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xs font-semibold text-gray-800">Order Items</h3>
                  <button
                    type="button"
                    onClick={() => setShowMasterServiceModal(true)}
                    className="px-2 py-1 bg-blue-900 text-white rounded hover:bg-blue-800 text-[10px]"
                  >
                    + Add Master Service
                  </button>
                </div>
                <div className="w-full border border-gray-200 rounded overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-[9px]">
                      <thead className="bg-blue-900 text-white">
                        <tr>
                          <th className="px-1 py-1 text-left">ID</th>
                          <th className="px-2 py-1 text-left">Service Name</th>
                          <th className="px-1 py-1 text-left">Price</th>
                          <th className="px-1 py-1 text-left">Qty</th>
                          <th className="px-1 py-1 text-left">Subtotal</th>
                          <th className="px-1 py-1 text-left">Disc Type</th>
                          <th className="px-1 py-1 text-left">Disc Val</th>
                          <th className="px-1 py-1 text-left">Disc Amt</th>
                          <th className="px-2 py-1 text-left">Final</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        {orderItems.length === 0 ? (
                          <tr>
                            <td colSpan="10" className="text-center py-3 text-gray-500 text-[10px]">
                              No items
                            </td>
                          </tr>
                        ) : (
                          orderItems.map((item) => {
                            const itemCalc = calculateItemTotal(item);
                            return (
                              <tr key={item.id} className="border-b hover:bg-gray-50">
                                <td className="px-1 py-1">{item.id}</td>
                                <td className="px-2 py-1">{item.serviceName}</td>
                                <td className="px-1 py-1">₹{item.price.toFixed(0)}</td>
                                <td className="px-1 py-1">{item.qty}</td>
                                <td className="px-1 py-1">₹{itemCalc.baseAmount.toFixed(0)}</td>
                                <td className="px-1 py-1">
                                  <select
                                    value={item.discountType}
                                    onChange={(e) => handleUpdateOrderItem(item.id, "discountType", e.target.value)}
                                    className="border px-1 py-0.5 rounded text-[9px] w-10"
                                  >
                                    <option value="percent">%</option>
                                    <option value="amount">₹</option>
                                  </select>
                                </td>
                                <td className="px-1 py-1">
                                  <input
                                    type="number"
                                    value={item.discountValue}
                                    onChange={(e) => handleUpdateOrderItem(item.id, "discountValue", parseFloat(e.target.value) || 0)}
                                    className="w-10 border px-1 py-0.5 rounded text-[9px]"
                                    placeholder="0"
                                  />
                                </td>
                                <td className="px-1 py-1 text-red-600">-₹{itemCalc.discountAmount.toFixed(0)}</td>
                                <td className="px-2 py-1 font-bold text-green-600">₹{itemCalc.finalAmount.toFixed(0)}</td>
                                <td className="px-1 py-1">
                                  <button type="button" onClick={() => handleDeleteOrderItem(item.id)} className="text-red-600">
                                    <FaTrash size={9} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => setShowServiceModal(true)}
                    className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-[10px]"
                  >
                    + Add Service
                  </button>
                </div>
              </div>
              {/* Order Summary - AFTER TABLE */}
              <div className="mt-4 p-3 bg-gray-50 border border-gray-300 rounded">
                <h4 className="text-xs font-semibold text-gray-800 mb-2">Order Summary</h4>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-gray-700">Subtotal (all services):</span>
                    <span className="text-gray-900 font-semibold">₹{totals.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-red-600">
                    <span>Service Discounts:</span>
                    <span className="font-semibold">-₹{totals.totalServiceDiscount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] border-t pt-1">
                    <span className="text-gray-800 font-medium">After Service Discounts:</span>
                    <span className="text-gray-900 font-bold">₹{totals.afterServiceDiscount.toFixed(2)}</span>
                  </div>
                  {/* Additional Admin Discount */}
                  <div className="border-t pt-2 mt-2">
                    <p className="text-[9px] text-gray-600 mb-1">Additional Admin Discount (on top)</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <select
                          value={additionalDiscount.type}
                          onChange={(e) => handleAdditionalDiscountChange("type", e.target.value)}
                          className="w-full border border-gray-300 px-1.5 py-0.5 rounded text-[10px]"
                        >
                          <option value="percent">% Percent</option>
                          <option value="amount">₹ Amount</option>
                        </select>
                      </div>
                      <div>
                        <input
                          type="number"
                          value={additionalDiscount.value}
                          onChange={(e) => handleAdditionalDiscountChange("value", parseFloat(e.target.value) || 0)}
                          className="w-full border border-gray-300 px-1.5 py-0.5 rounded text-[10px]"
                          placeholder="0"
                        />
                      </div>
                      <div className="flex items-center text-[10px] text-red-600 font-medium">
                        -₹{totals.additionalDiscountAmount.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm border-t pt-2 mt-2">
                    <span className="text-gray-900 font-bold">Final Amount:</span>
                    <span className="text-blue-900 font-bold text-lg">₹{totals.finalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button type="submit" className="px-4 py-2 bg-blue-900 text-white rounded hover:bg-blue-800 text-sm font-medium">
                  Update Order
                </button>
              </div>
            </form>
          </div>
          {/* Sidebar */}
          <div className="w-full xl:w-56 flex-shrink-0 space-y-2">
            <div className="bg-white p-2 rounded-lg shadow-sm text-center">
              <div className="w-10 h-10 bg-blue-900 rounded-full flex items-center justify-center text-white text-sm font-bold mx-auto mb-1">
                {formData.customerName ? formData.customerName.charAt(0).toUpperCase() : "C"}
              </div>
              <span className="inline-block px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded-full text-[8px] mb-1">
                CUSTOMER
              </span>
              <h3 className="text-[10px] font-semibold text-gray-800 truncate">{formData.customerName}</h3>
              <p className="text-[9px] text-gray-500 truncate">customer@email.com</p>
              <p className="text-[9px] text-gray-500 mb-1">9325411183</p>
              <button className="w-full px-2 py-1 bg-blue-900 text-white rounded text-[9px]">View Details</button>
            </div>
            <div className="bg-white p-2 rounded-lg shadow-sm">
              <h3 className="text-[10px] font-semibold text-gray-800 mb-1">Store Details</h3>
              <div className="space-y-1 text-[9px]">
                <div>
                  <span className="font-medium text-gray-600">Store:</span>
                  <p className="text-gray-800">VEGO Bike Pvt.Ltd</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Address:</span>
                  <p className="text-gray-800">Tathwade - 411033</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Contact:</span>
                  <p className="text-gray-800">9561191348</p>
                </div>
              </div>
              <button className="w-full mt-1.5 px-2 py-1 bg-blue-900 text-white rounded text-[9px]">View on Map</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditServiceOrder;
