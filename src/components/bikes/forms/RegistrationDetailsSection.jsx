import React from "react";
import { FaTimes } from "react-icons/fa";
import { getCurrentYears } from "../constants/bikeFormConstants";

const RegistrationDetailsSection = ({
  bikeData,
  errors,
  handleChange,
  submitLoading,
  stores,
}) => {
  const years = getCurrentYears();

  return (
    <div className="bg-gradient-to-r from-green-50 to-teal-50 p-4 sm:p-6 rounded-xl">
      <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-green-600 flex items-center gap-2">
        <span className="text-2xl">📋</span> Registration Details
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* Registration Number */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Registration Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="registrationNumber"
            value={bikeData.registrationNumber}
            onChange={handleChange}
            placeholder="e.g., MH12AB1234"
            className={`w-full border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 transition uppercase ${
              errors.registrationNumber ? "border-red-500 bg-red-50" : "border-gray-300"
            }`}
            disabled={submitLoading}
          />
          {errors.registrationNumber && (
            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
              <FaTimes /> {errors.registrationNumber}
            </p>
          )}
        </div>

        {/* Registration Year */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Registration Year <span className="text-red-500">*</span>
          </label>
          <select
            name="registrationYear"
            value={bikeData.registrationYear || ""}
            onChange={handleChange}
            className={`w-full border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 transition ${
              errors.registrationYear ? "border-red-500 bg-red-50" : "border-gray-300"
            }`}
            disabled={submitLoading}
          >
            <option value="">-- Select Year --</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          {errors.registrationYear && (
            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
              <FaTimes /> {errors.registrationYear}
            </p>
          )}
        </div>

        {/* Chassis Number */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Chassis Number
          </label>
          <input
            type="text"
            name="chassisNumber"
            value={bikeData.chassisNumber}
            onChange={handleChange}
            placeholder="Enter chassis number"
            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 transition uppercase"
            disabled={submitLoading}
          />
        </div>

        {/* Engine Number */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Engine Number
          </label>
          <input
            type="text"
            name="engineNumber"
            value={bikeData.engineNumber}
            onChange={handleChange}
            placeholder="Enter engine number"
            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 transition uppercase"
            disabled={submitLoading}
          />
        </div>

        {/* Store */}
        <div className="sm:col-span-2 lg:col-span-1">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Store Location <span className="text-red-500">*</span>
          </label>
          <select
            name="storeId"
            value={bikeData.storeId || ""}
            onChange={handleChange}
            className={`w-full border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 transition ${
              errors.storeId ? "border-red-500 bg-red-50" : "border-gray-300"
            }`}
            disabled={submitLoading}
          >
            <option value="">-- Select Store --</option>
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.storeName || store.name}
              </option>
            ))}
          </select>
          {errors.storeId && (
            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
              <FaTimes /> {errors.storeId}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegistrationDetailsSection;
    