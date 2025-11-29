import React from "react";
import { FaTimes } from "react-icons/fa";
import { FUEL_TYPE_OPTIONS } from "../constants/bikeFormConstants";

const BasicInformationSection = ({
  bikeData,
  errors,
  handleChange,
  submitLoading,
  vehicleTypes,
  filteredCategories,
  filteredBrands,
  filteredModels,
}) => {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-6 rounded-xl">
      <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-[#2B2B80] flex items-center gap-2">
        <span className="text-2xl">📝</span> Basic Information
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Bike Name */}
        <div className="sm:col-span-2 lg:col-span-1">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Bike Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={bikeData.name}
            onChange={handleChange}
            placeholder="Enter bike name"
            className={`w-full border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B2B80] transition ${
              errors.name ? "border-red-500 bg-red-50" : "border-gray-300"
            }`}
            disabled={submitLoading}
          />
          {errors.name && (
            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
              <FaTimes /> {errors.name}
            </p>
          )}
        </div>

        {/* Vehicle Type */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Vehicle Type <span className="text-red-500">*</span>
          </label>
          <select
            name="vehicleTypeId"
            value={bikeData.vehicleTypeId || ""}
            onChange={handleChange}
            className={`w-full border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B2B80] transition ${
              errors.vehicleTypeId ? "border-red-500 bg-red-50" : "border-gray-300"
            }`}
            disabled={submitLoading}
          >
            <option value="">-- Select Type --</option>
            {vehicleTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.typeName || type.name}
              </option>
            ))}
          </select>
          {errors.vehicleTypeId && (
            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
              <FaTimes /> {errors.vehicleTypeId}
            </p>
          )}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            name="categoryId"
            value={bikeData.categoryId || ""}
            onChange={handleChange}
            className={`w-full border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B2B80] transition ${
              errors.categoryId ? "border-red-500 bg-red-50" : "border-gray-300"
            }`}
            disabled={submitLoading || !bikeData.vehicleTypeId}
          >
            <option value="">
              {!bikeData.vehicleTypeId
                ? "Select Type First"
                : filteredCategories.length === 0
                ? "No Categories"
                : "-- Select Category --"}
            </option>
            {filteredCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.categoryName || cat.name}
              </option>
            ))}
          </select>
          {errors.categoryId && (
            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
              <FaTimes /> {errors.categoryId}
            </p>
          )}
        </div>

        {/* Brand */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Brand <span className="text-red-500">*</span>
          </label>
          <select
            name="brandId"
            value={bikeData.brandId || ""}
            onChange={handleChange}
            className={`w-full border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B2B80] transition ${
              errors.brandId ? "border-red-500 bg-red-50" : "border-gray-300"
            }`}
            disabled={submitLoading || !bikeData.categoryId}
          >
            <option value="">
              {!bikeData.categoryId
                ? "Select Category First"
                : filteredBrands.length === 0
                ? "No Brands"
                : "-- Select Brand --"}
            </option>
            {filteredBrands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.brandName || brand.name}
              </option>
            ))}
          </select>
          {errors.brandId && (
            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
              <FaTimes /> {errors.brandId}
            </p>
          )}
        </div>

        {/* Model */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Model <span className="text-red-500">*</span>
          </label>
          <select
            name="modelId"
            value={bikeData.modelId || ""}
            onChange={handleChange}
            className={`w-full border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B2B80] transition ${
              errors.modelId ? "border-red-500 bg-red-50" : "border-gray-300"
            }`}
            disabled={submitLoading || !bikeData.brandId}
          >
            <option value="">
              {!bikeData.brandId
                ? "Select Brand First"
                : filteredModels.length === 0
                ? "No Models"
                : "-- Select Model --"}
            </option>
            {filteredModels.map((model) => (
              <option key={model.id} value={model.id}>
                {model.modelName || model.name}
              </option>
            ))}
          </select>
          {errors.modelId && (
            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
              <FaTimes /> {errors.modelId}
            </p>
          )}
        </div>

        {/* Fuel Type */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Fuel Type <span className="text-red-500">*</span>
          </label>
          <select
            name="fuelType"
            value={bikeData.fuelType}
            onChange={handleChange}
            className={`w-full border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B2B80] transition ${
              errors.fuelType ? "border-red-500 bg-red-50" : "border-gray-300"
            }`}
            disabled={submitLoading}
          >
            <option value="">-- Select Fuel Type --</option>
            {FUEL_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.fuelType && (
            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
              <FaTimes /> {errors.fuelType}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BasicInformationSection;
