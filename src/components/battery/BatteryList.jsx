import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlus, FaSync } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Hooks
import useBatteryData from "./hooks/useBatteryData";
import useBatteryFilters from "./hooks/useBatteryFilters";
import useDropdownData from "./hooks/useDropdownData";

// Components
import BatteryFilters from "./components/BatteryFilters";
import BatteryTable from "./components/BatteryTable";
import BatteryDetailsModal from "./components/BatteryDetailsModal";
import { FaExclamationTriangle } from "react-icons/fa";

const BatteryList = () => {
  const navigate = useNavigate();

  // Dropdown data
  const { cities, stores, loadingStores, fetchStoresByCity, setStores } = useDropdownData();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Filters
  const filters = useBatteryFilters(cities, stores);

  // Battery data
  const { batteries, loading, refreshing, error, totalPages, totalItems, fetchBatteries, handleRefresh } =
    useBatteryData(
      {
        searchQuery: filters.searchQuery,
        searchField: filters.searchField,
        statusFilter: filters.statusFilter,
        cityFilter: filters.cityFilter,
        storeFilter: filters.storeFilter,
        cities,
        stores,
      },
      { currentPage, pageSize }
    );

  // Modal state
  const [selectedBattery, setSelectedBattery] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Fetch batteries on filter/pagination change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchBatteries();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [currentPage, pageSize, filters.statusFilter, filters.cityFilter, filters.storeFilter, filters.searchQuery, filters.searchField]);

  // Handle city change - fetch stores
  useEffect(() => {
    if (filters.cityFilter) {
      fetchStoresByCity(filters.cityFilter);
    } else {
      setStores([]);
    }
  }, [filters.cityFilter]);

  const handleSearch = () => {
    setCurrentPage(0);
    fetchBatteries();
  };

  const handleClearFilters = () => {
    filters.clearFilters();
    setCurrentPage(0);
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(parseInt(newSize));
    setCurrentPage(0);
  };

  const handleViewDetails = (battery) => {
    setSelectedBattery(battery);
    setShowDetailsModal(true);
  };

  const handleEdit = (battery) => {
    navigate(`/dashboard/Battery/add/${battery.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-1 px-1">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-3 mb-2">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                Battery Management
              </h1>
              <p className="text-gray-500 text-xs">Manage all batteries and their status</p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate("/dashboard/Battery/add")}
                className="flex items-center px-4 py-2 rounded-lg shadow-md transition-all bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold hover:shadow-lg"
              >
                <FaPlus className="mr-2" />
                Add Battery
              </button>

              <button
                onClick={handleRefresh}
                disabled={refreshing || loading}
                className={`flex items-center px-3 py-1.5 rounded-lg shadow-md transition-all ${
                  refreshing || loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                } text-white text-sm`}
              >
                <FaSync className={`mr-2 ${refreshing ? "animate-spin" : ""}`} />
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>

              <div className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white px-3 py-1.5 rounded-lg shadow-lg">
                <div className="text-lg font-bold">{totalItems}</div>
                <div className="text-xs opacity-90">Total Batteries</div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-2">
            <div className="flex items-start">
              <FaExclamationTriangle className="text-red-500 mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-800 mb-1">Error Loading Batteries</h3>
                <p className="text-xs text-red-700 mb-2">{error || "An unexpected error occurred"}</p>
                <button
                  onClick={handleRefresh}
                  className="mt-2 text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search & Filters */}
        <BatteryFilters
          filters={filters}
          handleSearch={handleSearch}
          handleClearFilters={handleClearFilters}
          pageSize={pageSize}
          handlePageSizeChange={handlePageSizeChange}
          loadingStores={loadingStores}
        />

        {/* Batteries Table */}
        <BatteryTable
          batteries={batteries}
          loading={loading}
          cities={cities}
          stores={stores}
          handleViewDetails={handleViewDetails}
          handleEdit={handleEdit}
          searchQuery={filters.searchQuery}
        />

        {/* Pagination */}
        {!loading && batteries.length > 0 && totalPages > 1 && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden mt-2">
            <div className="border-t border-gray-100 px-3 py-2 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-600">
                  Showing <span className="font-semibold text-gray-900">{currentPage * pageSize + 1}</span> to{" "}
                  <span className="font-semibold text-gray-900">{Math.min((currentPage + 1) * pageSize, totalItems)}</span> of{" "}
                  <span className="font-semibold text-gray-900">{totalItems}</span> batteries
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setCurrentPage(0)}
                    disabled={currentPage === 0}
                    className="px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    First
                  </button>
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 0}
                    className="px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <span className="px-2 py-1 text-xs font-medium text-gray-700">
                    Page {currentPage + 1} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage >= totalPages - 1}
                    className="px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages - 1)}
                    disabled={currentPage >= totalPages - 1}
                    className="px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Last
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Details Modal */}
        {showDetailsModal && selectedBattery && (
          <BatteryDetailsModal
            battery={selectedBattery}
            cities={cities}
            stores={stores}
            onClose={() => {
              setShowDetailsModal(false);
              setSelectedBattery(null);
            }}
            onEdit={() => {
              setShowDetailsModal(false);
              handleEdit(selectedBattery);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default BatteryList;
