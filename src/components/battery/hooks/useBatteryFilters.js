import { useState } from "react";

const useBatteryFilters = (cities, stores) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchField, setSearchField] = useState("batteryId");
  const [statusFilter, setStatusFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [storeFilter, setStoreFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const clearFilters = () => {
    setStatusFilter("");
    setCityFilter("");
    setStoreFilter("");
    setSearchQuery("");
  };

  const hasActiveFilters = statusFilter !== "" || cityFilter !== "" || storeFilter !== "";

  return {
    searchQuery,
    setSearchQuery,
    searchField,
    setSearchField,
    statusFilter,
    setStatusFilter,
    cityFilter,
    setCityFilter,
    storeFilter,
    setStoreFilter,
    showFilters,
    setShowFilters,
    clearFilters,
    hasActiveFilters,
    cities,
    stores,
  };
};

export default useBatteryFilters;
