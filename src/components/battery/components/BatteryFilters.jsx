import React from "react";
import { FaSearch, FaTimes, FaInfoCircle } from "react-icons/fa";
import { SEARCH_FIELDS, BATTERY_STATUS, PAGE_SIZE_OPTIONS } from "../utils/batteryConstants";

const BatteryFilters = ({ filters, handleSearch, handleClearFilters, pageSize, handlePageSizeChange, loadingStores }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-3 mb-2">
      {/* Search Bar */}
      <div className="flex items-center justify-between space-x-4 mb-3">
        <div className="flex-1 flex space-x-2">
          <select
            value={filters.searchField}
            onChange={(e) => filters.setSearchField(e.target.value)}
            className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200"
          >
            {SEARCH_FIELDS.map((field) => (
              <option key={field.value} value={field.value}>
                {field.label}
              </option>
            ))}
          </select>

          <div className="flex-1 relative">
            <FaSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder={`Search by ${SEARCH_FIELDS.find((f) => f.value === filters.searchField)?.label || "Battery ID"}...`}
              className="w-full pl-8 pr-20 py-1.5 border border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 transition-all text-sm"
              value={filters.searchQuery}
              onChange={(e) => filters.setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
            {filters.searchQuery && (
              <button
                onClick={() => filters.setSearchQuery("")}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full p-1 transition-colors"
              >
                <FaTimes className="text-xs" />
              </button>
            )}
          </div>
        </div>

        <button
          onClick={() => filters.setShowFilters(!filters.showFilters)}
          className={`px-4 py-1.5 rounded-lg border-2 ${
            filters.showFilters ? "border-indigo-600 bg-indigo-50 text-indigo-600" : "border-gray-200 text-gray-700 hover:border-indigo-600"
          } transition-all text-sm font-medium flex items-center`}
        >
          <FaInfoCircle className="mr-2" />
          Filters
          {filters.hasActiveFilters && <span className="ml-2 bg-red-500 text-white rounded-full w-2 h-2"></span>}
        </button>

        <div className="flex items-center space-x-2">
          <label className="text-xs text-gray-600 whitespace-nowrap">Items per page</label>
          <select
            value={pageSize}
            onChange={(e) => handlePageSizeChange(e.target.value)}
            className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Advanced Filters */}
      {filters.showFilters && (
        <div className="border-t pt-3 grid grid-cols-4 gap-3">
          {/* Status Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.statusFilter}
              onChange={(e) => filters.setStatusFilter(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:border-indigo-500"
            >
              <option value="">All Status</option>
              <option value="0">OUT OF SERVICE</option>
              <option value="1">IN BIKE</option>
              <option value="2">CHARGING</option>
              <option value="3">OPEN</option>
            </select>
          </div>

          {/* City Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
            <select
              value={filters.cityFilter}
              onChange={(e) => filters.setCityFilter(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:border-indigo-500"
            >
              <option value="">All Cities</option>
              {filters.cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name || city.cityName}
                </option>
              ))}
            </select>
          </div>

          {/* Store Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Store</label>
            <select
              value={filters.storeFilter}
              onChange={(e) => filters.setStoreFilter(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:border-indigo-500"
              disabled={loadingStores}
            >
              <option value="">All Stores</option>
              {filters.stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name || store.storeName}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters Button */}
          <div className="flex items-end">
            <button
              onClick={handleClearFilters}
              className="w-full px-3 py-1.5 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
            >
              <FaTimes className="mr-2" />
              Clear Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatteryFilters;
