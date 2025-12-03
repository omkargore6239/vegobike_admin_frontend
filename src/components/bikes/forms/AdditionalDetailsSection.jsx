import React from "react";
import { FaTimes, FaBatteryFull } from "react-icons/fa";

const AdditionalDetailsSection = ({
  bikeData,
  errors,
  handleChange,
  submitLoading,
  isEditMode,
  openBatteries,
  currentBattery,
  loadingBatteries,
}) => {
  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 sm:p-6 rounded-xl">
      <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-purple-600 flex items-center gap-2">
        <span className="text-2xl">⚙️</span> Additional Details
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* IMEI Number */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">IMEI Number</label>
          <input
            type="text"
            name="imeiNumber"
            value={bikeData.imeiNumber}
            onChange={handleChange}
            placeholder="Enter IMEI number"
            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 transition"
            disabled={submitLoading}
          />
        </div>

        {/* Battery Dropdown (fully robust) */}
        {bikeData.fuelType === "ELECTRIC" && (
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Electric Battery <span className="text-red-500">*</span>
            </label>
            {loadingBatteries ? (
              <div className="flex items-center justify-center p-3 border border-gray-300 rounded-lg">
                <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                <span className="text-sm text-gray-600">Loading batteries...</span>
              </div>
            ) : (
              <>
                <select
                  name="electricBatteryId"
                  value={
                    bikeData.electricBatteryId !== undefined &&
                    bikeData.electricBatteryId !== null
                      ? String(bikeData.electricBatteryId)
                      : ""
                  }
                  onChange={handleChange}
                  className={`w-full border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 transition ${
                    errors.electricBatteryId ? "border-red-500 bg-red-50" : "border-gray-300"
                  }`}
                  disabled={submitLoading}
                >
                  <option value="">-- Select Battery --</option>
                  {/* Always include the current battery option if in edit mode and present */}
                  {isEditMode && currentBattery && (
                    <option value={String(currentBattery.id)}>
                      {currentBattery.batteryId} - {currentBattery.company}
                    </option>
                  )}
                  {/* All available open batteries, except the current assigned one */}
                  {openBatteries
                    .filter(
                      (batt) =>
                        !currentBattery ||
                        String(batt.id) !== String(currentBattery.id)
                    )
                    .map((batt) => (
                      <option key={String(batt.id)} value={String(batt.id)}>
                        {batt.batteryId} - {batt.company} (OPEN)
                      </option>
                    ))}
                </select>

                {errors.electricBatteryId && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <FaTimes /> {errors.electricBatteryId}
                  </p>
                )}

                {/* <div className="mt-2 bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <p className="text-xs text-purple-800 flex items-start gap-2">
                    <FaBatteryFull className="mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Battery Assignment Rules:</strong>
                      <br />• Only batteries with <span className="font-semibold">OPEN</span> status can be newly assigned
                      <br />• Changing battery will set the old battery to <span className="font-semibold">CHARGING</span>
                      <br />• New battery will be set to <span className="font-semibold">IN BIKE</span> automatically
                    </span>
                  </p>
                </div> */}
              </>
            )}
          </div>
        )}

        {/* Latitude */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Latitude</label>
          <input
            type="text"
            name="latitude"
            value={bikeData.latitude}
            onChange={handleChange}
            placeholder="e.g., 19.0760"
            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 transition"
            disabled={submitLoading}
          />
        </div>
        {/* Longitude */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Longitude</label>
          <input
            type="text"
            name="longitude"
            value={bikeData.longitude}
            onChange={handleChange}
            placeholder="e.g., 72.8777"
            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 transition"
            disabled={submitLoading}
          />
        </div>
      </div>
      {/* Checkboxes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            name="isPuc"
            checked={bikeData.isPuc}
            onChange={handleChange}
            className="w-4 h-4 text-purple-600 focus:ring-purple-500"
            disabled={submitLoading}
          />
          <span className="text-sm font-medium text-gray-700">Has PUC</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            name="isInsurance"
            checked={bikeData.isInsurance}
            onChange={handleChange}
            className="w-4 h-4 text-purple-600 focus:ring-purple-500"
            disabled={submitLoading}
          />
          <span className="text-sm font-medium text-gray-700">Has Insurance</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            name="isDocuments"
            checked={bikeData.isDocuments}
            onChange={handleChange}
            className="w-4 h-4 text-purple-600 focus:ring-purple-500"
            disabled={submitLoading}
          />
          <span className="text-sm font-medium text-gray-700">Has Documents</span>
        </label>
      </div>
    </div>
  );
};

export default AdditionalDetailsSection;
