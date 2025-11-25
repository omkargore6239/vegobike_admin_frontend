// src/pages/AdminBooking/hooks/useBikeAvailability.js
import { useState } from "react";
import { toast } from "react-toastify";
import apiClient from "../../../api/apiConfig";

export const useBikeAvailability = () => {
  const [availableBikes, setAvailableBikes] = useState([]);
  const [bikesLoading, setBikesLoading] = useState(false);

  const checkAvailability = async (storeId, startDate, endDate) => {
    setBikesLoading(true);
    
    try {
      const response = await apiClient.get("/api/bikes/available", {
        params: {
          storeId,
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
          page: 0,
          size: 100
        }
      });

      const bikes = response.data?.content || response.data?.data || response.data || [];
      
      // ✅ Ensure each bike has deposit info
      const bikesWithDeposit = bikes.map(bike => ({
        ...bike,
        depositAmount: bike.depositAmount || bike.advanceAmount || 1000,
      }));
      
      setAvailableBikes(bikesWithDeposit);
      
      if (bikesWithDeposit.length === 0) {
        toast.warning("No bikes available for selected dates");
      } else {
        toast.success(`✅ Found ${bikesWithDeposit.length} available bike(s)`);
      }
    } catch (error) {
      console.error("Error checking bikes:", error);
      toast.error("Failed to check bike availability");
      setAvailableBikes([]);
    } finally {
      setBikesLoading(false);
    }
  };

  return {
    availableBikes,
    bikesLoading,
    checkAvailability
  };
};
