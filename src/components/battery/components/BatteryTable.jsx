import React from "react";
import { FaEye, FaEdit, FaBatteryFull, FaBolt, FaMapMarkerAlt, FaStore } from "react-icons/fa";
import BatteryStatusBadge from "./BatteryStatusBadge";
import { getCityName, getStoreName, formatDate } from "../utils/batteryHelpers";

const BatteryTable = ({ batteries, loading, cities, stores, handleViewDetails, handleEdit, searchQuery }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
              <th className="px-3 py-2 text-left text-xs font-semibold">Battery ID</th>
              <th className="px-3 py-2 text-left text-xs font-semibold">Company</th>
              <th className="px-3 py-2 text-left text-xs font-semibold">Status</th>
              <th className="px-3 py-2 text-left text-xs font-semibold">City</th>
              <th className="px-3 py-2 text-left text-xs font-semibold">Store</th>
              <th className="px-3 py-2 text-left text-xs font-semibold">Bike Reg No</th>
              <th className="px-3 py-2 text-left text-xs font-semibold">Created</th>
              <th className="px-3 py-2 text-center text-xs font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan="8" className="text-center py-8">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-2"></div>
                    <p className="text-gray-500 text-sm">Loading batteries...</p>
                  </div>
                </td>
              </tr>
            ) : batteries.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-8">
                  <div className="flex flex-col items-center">
                    <FaBatteryFull className="text-gray-400 text-4xl mb-2" />
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">No batteries found</h3>
                    <p className="text-gray-500 text-xs">
                      {searchQuery ? `No results for "${searchQuery}"` : "No batteries available"}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              batteries.map((battery) => (
                <tr key={battery.id} className="hover:bg-indigo-50 transition-colors">
                  <td className="px-3 py-2">
                    <div className="flex items-center">
                      <FaBolt className="text-yellow-500 mr-2" />
                      <span className="font-semibold text-indigo-600 text-sm">{battery.batteryId}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <span className="text-gray-900 text-sm font-medium">{battery.company}</span>
                  </td>
                  <td className="px-3 py-2">
                    <BatteryStatusBadge statusCode={battery.batteryStatusCode} />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center text-sm text-gray-700">
                      <FaMapMarkerAlt className="mr-1 text-xs text-gray-400" />
                      {battery.cityName || getCityName(battery.cityId, cities)}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center text-sm text-gray-700">
                      <FaStore className="mr-1 text-xs text-gray-400" />
                      {battery.storeName || getStoreName(battery.storeId, stores)}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    {battery.bikeRegistrationNumber ? (
                      <span className="text-sm font-medium text-green-600">{battery.bikeRegistrationNumber}</span>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Not assigned</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <span className="text-xs text-gray-600">{formatDate(battery.createdAt)}</span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => handleViewDetails(battery)}
                        className="p-1.5 bg-blue-100 hover:bg-blue-600 text-blue-600 hover:text-white rounded transition-colors"
                        title="View Details"
                      >
                        <FaEye className="text-xs" />
                      </button>
                      <button
                        onClick={() => handleEdit(battery)}
                        className="p-1.5 bg-yellow-100 hover:bg-yellow-600 text-yellow-600 hover:text-white rounded transition-colors"
                        title="Edit"
                      >
                        <FaEdit className="text-xs" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BatteryTable;
