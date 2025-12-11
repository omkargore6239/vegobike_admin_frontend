import { useState, useEffect, useCallback } from "react";
import { gpsTrackingApi } from "../utils/gpsTrackingApi";
import { toast } from "react-toastify";

export default function useLiveTracking(bookingId) {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchLocation = useCallback(async () => {
    try {
      setLoading(true);
      const res = await gpsTrackingApi.getLiveLocation(bookingId);
      setLocation(res.data);
    } catch (err) {
      console.error("Live Location Error:", err);
      toast.error("Failed to fetch live location");
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchLocation, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchLocation]);

  return {
    location,
    loading,
    fetchLocation,
    autoRefresh,
    setAutoRefresh,
  };
}
