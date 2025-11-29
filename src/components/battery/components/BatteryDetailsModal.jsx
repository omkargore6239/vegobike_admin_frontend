import React from "react";
import { FaTimes, FaBatteryFull, FaEdit } from "react-icons/fa";
import BatteryStatusBadge from "./BatteryStatusBadge";
import { getCityName, getStoreName, formatDate } from "../utils/batteryHelpers";

const BatteryDetailsModal = ({ battery, cities, stores, onClose, onEdit }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-4 rounded-t-xl flex items-center justify-between">
          <div className="flex items-center">
            <FaBatteryFull className="mr-2 text-2xl" />
            <h3 className="text-lg font-bold">Battery Details</h3>
          </div>
          <button onClick={onClose} className="text-white hover:text-gray-200 transition-colors">
            <FaTimes className="text-xl" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Battery ID</label>
              <p className="text-sm font-medium text-gray-900">{battery.batteryId}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Company</label>
              <p className="text-sm font-medium text-gray-900">{battery.company}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
              <BatteryStatusBadge statusCode={battery.batteryStatusCode} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">City</label>
              <p className="text-sm font-medium text-gray-900">{battery.cityName || getCityName(battery.cityId, cities)}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Store</label>
              <p className="text-sm font-medium text-gray-900">{battery.storeName || getStoreName(battery.storeId, stores)}</p>
            </div>

            {battery.bikeRegistrationNumber && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Assigned to Bike</label>
                <p className="text-sm font-medium text-green-600">{battery.bikeRegistrationNumber}</p>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Created At</label>
              <p className="text-sm font-medium text-gray-900">{formatDate(battery.createdAt)}</p>
            </div>

            {battery.updatedAt && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Updated At</label>
                <p className="text-sm font-medium text-gray-900">{formatDate(battery.updatedAt)}</p>
              </div>
            )}

            {battery.image && (
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-2">Battery Image</label>
                <img
                  src={battery.image}
                  alt={battery.batteryId}
                  className="w-full h-48 object-contain bg-gray-50 border rounded-lg"
                  onError={(e) => (e.target.style.display = "none")}
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors text-sm"
          >
            Close
          </button>
          <button
            onClick={onEdit}
            className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-lg font-medium transition-all text-sm flex items-center"
          >
            <FaEdit className="mr-2" />
            Edit Battery
          </button>
        </div>
      </div>
    </div>
  );
};

export default BatteryDetailsModal;
