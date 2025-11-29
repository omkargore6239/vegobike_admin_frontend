import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { batteryAPI } from "../api/batteryAPI";
import { buildSearchParams } from "../utils/batteryHelpers";

const useBatteryData = (filters, pagination) => {
  const navigate = useNavigate();
  const [batteries, setBatteries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  const fetchBatteries = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = buildSearchParams(filters, pagination);
      console.log("Fetching batteries with params:", params.toString());

      const result = await batteryAPI.getAll(params);
      console.log("Batteries API response:", result);

      if (result.success) {
        setBatteries(result.data || []);

        if (result.pagination) {
          setTotalPages(result.pagination.totalPages || 1);
          setTotalItems(result.pagination.totalElements || 0);
        } else {
          setTotalPages(1);
          setTotalItems(result.data?.length || 0);
        }

        if (result.data?.length > 0) {
          toast.success(`Loaded ${result.data.length} batteries`);
        }
      } else {
        throw new Error("Failed to load batteries");
      }
    } catch (err) {
      console.error("Error fetching batteries:", err);

      if (err.message === "UNAUTHORIZED") {
        toast.error("Session expired. Please login again.");
        navigate("/login");
      } else {
        setError(err.message);
        toast.error("Failed to load batteries");
      }

      setBatteries([]);
      setTotalPages(0);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination, navigate]);

  const handleRefresh = async () => {
    setRefreshing(true);
    toast.info("Refreshing batteries...");
    await fetchBatteries();
    setRefreshing(false);
  };

  return {
    batteries,
    loading,
    refreshing,
    error,
    totalPages,
    totalItems,
    fetchBatteries,
    handleRefresh,
  };
};

export default useBatteryData;
