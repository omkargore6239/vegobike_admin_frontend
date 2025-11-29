import { BATTERY_STATUS } from "./batteryConstants";

export const getAuthToken = () => {
  return localStorage.getItem("token") || localStorage.getItem("authToken");
};

export const getStatusBadge = (statusCode) => {
  return BATTERY_STATUS[statusCode] || BATTERY_STATUS[3]; // Default to OPEN
};

export const formatDate = (timestamp) => {
  if (!timestamp) return "N/A";
  return new Date(timestamp).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const getCityName = (cityId, cities) => {
  if (!cityId || !cities) return "N/A";
  const city = cities.find((c) => c.id === parseInt(cityId));
  return city ? city.name || city.cityName : "N/A";
};

export const getStoreName = (storeId, stores) => {
  if (!storeId || !stores) return "N/A";
  const store = stores.find((s) => s.id === parseInt(storeId));
  return store ? store.name || store.storeName : "N/A";
};

export const buildSearchParams = (filters, pagination) => {
  const params = new URLSearchParams({
    page: pagination.currentPage.toString(),
    size: pagination.pageSize.toString(),
    sortBy: "id",
    direction: "desc",
  });

  // Add search query based on field
  if (filters.searchQuery?.trim()) {
    params.set(filters.searchField, filters.searchQuery.trim());
  }

  // Add filters
  if (filters.statusFilter !== "") {
    params.set("batteryStatus", filters.statusFilter);
  }

  if (filters.cityFilter !== "") {
    const cityName = getCityName(filters.cityFilter, filters.cities);
    if (cityName && cityName !== "N/A") {
      params.set("cityName", cityName);
    }
  }

  if (filters.storeFilter !== "") {
    const storeName = getStoreName(filters.storeFilter, filters.stores);
    if (storeName && storeName !== "N/A") {
      params.set("storeName", storeName);
    }
  }

  return params;
};
