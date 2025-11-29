// src/components/bikes/hooks/useBatteryData.js

import { useState, useEffect } from "react";
import { BASE_URL } from "../../../api/apiConfig";

/**
 * isEditMode        -> true when editing an existing bike
 * electricBatteryId -> current assigned battery id (if any)
 * fuelType          -> "ELECTRIC" or others
 * bikeId            -> current bike id (needed for /bikes/{bikeId}/open-batteries)
 */
const useBatteryData = (isEditMode, electricBatteryId, fuelType, bikeId) => {
  const [openBatteries, setOpenBatteries] = useState([]);
  const [currentBattery, setCurrentBattery] = useState(null);
  const [loadingBatteries, setLoadingBatteries] = useState(false);

  // Fetch OPEN batteries when fuel type is ELECTRIC and bikeId is known
  useEffect(() => {
    if (fuelType === "ELECTRIC" && bikeId) {
      fetchOpenBatteriesByBike(bikeId);
    } else {
      setOpenBatteries([]);
      setCurrentBattery(null);
    }
  }, [fuelType, bikeId]);

  // Fetch current battery in edit mode
  useEffect(() => {
    if (isEditMode && electricBatteryId && fuelType === "ELECTRIC") {
      fetchCurrentBattery(electricBatteryId);
    } else {
      setCurrentBattery(null);
    }
  }, [isEditMode, electricBatteryId, fuelType]);

  // ✅ NEW: use /api/bikes/{bikeId}/open-batteries instead of /api/batteries/status/3
  const fetchOpenBatteriesByBike = async (bikeIdParam) => {
    setLoadingBatteries(true);
    try {
      const token =
        localStorage.getItem("token") || localStorage.getItem("authToken");

      const response = await fetch(
        `${BASE_URL}/api/bikes/${bikeIdParam}/open-batteries`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        // Backend returns List<BatteryDto> (array) or { data: [...] }
        const list = Array.isArray(result) ? result : result.data || [];
        setOpenBatteries(list || []);
        console.log(
          `✅ Loaded ${list?.length || 0} OPEN batteries for bike ${bikeIdParam}`
        );
      } else {
        console.error(
          "Failed to fetch OPEN batteries by bike:",
          response.status
        );
        setOpenBatteries([]);
      }
    } catch (error) {
      console.error("Failed to fetch OPEN batteries by bike:", error);
      setOpenBatteries([]);
    } finally {
      setLoadingBatteries(false);
    }
  };

  const fetchCurrentBattery = async (batteryId) => {
    try {
      const token =
        localStorage.getItem("token") || localStorage.getItem("authToken");

      const response = await fetch(`${BASE_URL}/api/batteries/${batteryId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        const batteryData = result.data || result;

        setCurrentBattery({
          id: batteryData.id,
          batteryId: batteryData.batteryId,
          company: batteryData.company,
          batteryStatusCode: batteryData.batteryStatusCode,
          batteryPercentage: batteryData.batteryPercentage,
          cityName: batteryData.cityName,
          storeName: batteryData.storeName,
        });

        console.log("✅ Current battery loaded:", batteryData);
      }
    } catch (error) {
      console.error("Failed to fetch current battery:", error);
      setCurrentBattery(null);
    }
  };

  return {
    openBatteries,
    currentBattery,
    loadingBatteries,
    // manual refresh, still uses bikeId + new API
    refreshOpenBatteries: () => {
      if (fuelType === "ELECTRIC" && bikeId) {
        fetchOpenBatteriesByBike(bikeId);
      }
    },
  };
};

export default useBatteryData;
