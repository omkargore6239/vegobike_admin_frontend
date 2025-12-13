
//************************************************** */

import { useState } from "react";

const CreateServiceOrder = ({ onBack, onOrderCreated, nextOrderId }) => {
  const [formData, setFormData] = useState({
    orderId: nextOrderId,
    customerContact: "",
    customerName: "",
    customerAlternate: "",
    serviceDate: "",
    serviceTime: "",
    vehicleNumber: "",
    kilometer: "",
    chassisNumber: "",
    engineNumber: "",
    selectStore: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // TODO: API call to create order
    // const response = await fetch('/api/service-orders', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(formData)
    // });
    // const newOrder = await response.json();

    const newOrder = {
      id: Date.now(),
      orderId: formData.orderId,
      customer: formData.customerName,
      orderAmount: 0,
      orderStatus: "Pending",
      paymentMethod: "cod",
      paymentStatus: "unpaid",
      orderDate: new Date().toLocaleString(),
      ...formData,
    };

    onOrderCreated(newOrder);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="bg-white rounded-lg shadow-sm max-w-5xl mx-auto">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-800">Create New Order</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Order ID */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Order ID</label>
              <input
                type="text"
                value={formData.orderId}
                className="w-full border border-gray-300 px-3 py-2 rounded text-sm bg-gray-100"
                disabled
              />
            </div>

            {/* Customer Contact */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Customer Contact Number *
              </label>
              <input
                type="text"
                name="customerContact"
                value={formData.customerContact}
                onChange={handleInputChange}
                placeholder="e.g., 9876543210"
                className="w-full border border-gray-300 px-3 py-2 rounded text-sm"
                required
              />
            </div>

            {/* Customer Name */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Customer Name *</label>
              <input
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleInputChange}
                placeholder="Customer Name"
                className="w-full border border-gray-300 px-3 py-2 rounded text-sm"
                required
              />
            </div>

            {/* Alternate Number */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Customer Alternate Number
              </label>
              <input
                type="text"
                name="customerAlternate"
                value={formData.customerAlternate}
                onChange={handleInputChange}
                placeholder="e.g., 9876543210"
                className="w-full border border-gray-300 px-3 py-2 rounded text-sm"
              />
            </div>

            {/* Service Date */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Service Date *</label>
              <input
                type="date"
                name="serviceDate"
                value={formData.serviceDate}
                onChange={handleInputChange}
                className="w-full border border-gray-300 px-3 py-2 rounded text-sm"
                required
              />
            </div>

            {/* Service Time */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Service Time Slot *</label>
              <select
                name="serviceTime"
                value={formData.serviceTime}
                onChange={handleInputChange}
                className="w-full border border-gray-300 px-3 py-2 rounded text-sm"
                required
              >
                <option value="">Select a time slot</option>
                <option value="09:00-10:00">09:00 AM - 10:00 AM</option>
                <option value="10:00-11:00">10:00 AM - 11:00 AM</option>
                <option value="11:00-12:00">11:00 AM - 12:00 PM</option>
                <option value="14:00-15:00">02:00 PM - 03:00 PM</option>
              </select>
            </div>

            {/* Vehicle Number */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Vehicle Number *</label>
              <input
                type="text"
                name="vehicleNumber"
                value={formData.vehicleNumber}
                onChange={handleInputChange}
                placeholder="e.g., MH12QW2345"
                className="w-full border border-gray-300 px-3 py-2 rounded text-sm"
                required
              />
            </div>

            {/* Kilometer */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Kilometer</label>
              <input
                type="number"
                name="kilometer"
                value={formData.kilometer}
                onChange={handleInputChange}
                placeholder="e.g., 1000"
                className="w-full border border-gray-300 px-3 py-2 rounded text-sm"
              />
            </div>

            {/* Chassis Number */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Chassis Number</label>
              <input
                type="text"
                name="chassisNumber"
                value={formData.chassisNumber}
                onChange={handleInputChange}
                placeholder="Chassis Number"
                className="w-full border border-gray-300 px-3 py-2 rounded text-sm"
              />
            </div>

            {/* Engine Number */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Engine Number</label>
              <input
                type="text"
                name="engineNumber"
                value={formData.engineNumber}
                onChange={handleInputChange}
                placeholder="Engine Number"
                className="w-full border border-gray-300 px-3 py-2 rounded text-sm"
              />
            </div>

            {/* Select Store */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Select Store *</label>
              <select
                name="selectStore"
                value={formData.selectStore}
                onChange={handleInputChange}
                className="w-full border border-gray-300 px-3 py-2 rounded text-sm"
                required
              >
                <option value="">Select store</option>
                <option value="store1">Hinjawadi Vego Bikes</option>
                <option value="store2">Tathwade Store</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-900 text-white rounded hover:bg-blue-800 text-sm font-medium"
            >
              Create Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateServiceOrder;
