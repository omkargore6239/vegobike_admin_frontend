import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { cityAPI, storeAPI } from "../api/batteryAPI";

const useDropdownData = () => {
  const [cities, setCities] = useState([]);
  const [stores, setStores] = useState([]);
  const [loadingCities, setLoadingCities] = useState(true);
  const [loadingStores, setLoadingStores] = useState(true);

  useEffect(() => {
    fetchCities();
    fetchStores();
  }, []);

  const fetchCities = async () => {
    try {
      setLoadingCities(true);
      const result = await cityAPI.getActive();
      const citiesData = result.data || result;
      setCities(Array.isArray(citiesData) ? citiesData : []);
      console.log("Cities loaded:", citiesData);
    } catch (err) {
      console.error("Error fetching cities:", err);
      toast.error("Failed to load cities");
      setCities([]);
    } finally {
      setLoadingCities(false);
    }
  };

  const fetchStores = async () => {
    try {
      setLoadingStores(true);
      const result = await storeAPI.getActive();
      const storesData = result.data || result;
      setStores(Array.isArray(storesData) ? storesData : []);
      console.log("Stores loaded:", storesData);
    } catch (err) {
      console.error("Error fetching stores:", err);
      toast.error("Failed to load stores");
      setStores([]);
    } finally {
      setLoadingStores(false);
    }
  };

  const fetchStoresByCity = async (cityId) => {
    if (!cityId) {
      setStores([]);
      return;
    }

    try {
      setLoadingStores(true);
      const result = await storeAPI.getByCity(cityId);

      if (result.success || result.data) {
        const storesData = result.data || [];
        setStores(storesData);
        console.log(`Loaded ${storesData.length} stores for city ${cityId}`);

        if (storesData.length === 0) {
          toast.info("No stores found for this city");
        }
      }
    } catch (err) {
      console.error("Error fetching stores by city:", err);
      toast.error("Failed to load stores for selected city");
      setStores([]);
    } finally {
      setLoadingStores(false);
    }
  };

  return {
    cities,
    stores,
    loadingCities,
    loadingStores,
    fetchStoresByCity,
    setStores,
  };
};

export default useDropdownData;
