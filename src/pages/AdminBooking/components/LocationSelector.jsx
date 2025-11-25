// src/pages/AdminBooking/components/LocationSelector.jsx
import React, { useState, useEffect } from "react";
import { FaCity, FaStore, FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { toast } from "react-toastify";
import apiClient from "../../../api/apiConfig";

const LocationSelector = ({ initialData, onNext, onBack }) => {
  const [cities, setCities] = useState([]);
  const [stores, setStores] = useState([]);
  const [selectedCity, setSelectedCity] = useState(initialData.cityId || "");
  const [selectedStore, setSelectedStore] = useState(initialData.storeId || "");
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingStores, setLoadingStores] = useState(false);

  // Fetch cities on mount
  useEffect(() => {
    const fetchCities = async () => {
      setLoadingCities(true);
      try {
        const response = await apiClient.get("/api/cities/active");
        const citiesData = response.data?.data || response.data || [];
        setCities(citiesData);
        console.log("✅ Cities loaded:", citiesData);
      } catch (error) {
        console.error("❌ Error fetching cities:", error);
        toast.error("Failed to load cities");
      } finally {
        setLoadingCities(false);
      }
    };
    fetchCities();
  }, []);

  // ✅ CORRECTED: Fetch stores when city changes (matches your backend)
  useEffect(() => {
    if (!selectedCity) {
      setStores([]);
      setSelectedStore("");
      return;
    }

    const fetchStores = async () => {
      setLoadingStores(true);
      try {
        // ✅ YOUR BACKEND ENDPOINT: /api/stores/active/by-city?cityId={cityId}
        const response = await apiClient.get("/api/stores/active/by-city", {
          params: { cityId: selectedCity }
        });

        console.log("📦 Store API response:", response.data);

        // ✅ Extract stores from your backend response structure
        const storesData = response.data?.data || [];
        
        setStores(storesData);
        
        console.log(`✅ Stores loaded for city ${selectedCity}:`, storesData);
        
        if (storesData.length === 0) {
          toast.warning("No active stores available in this city");
        } else {
          toast.success(`Found ${storesData.length} store(s)`);
        }
      } catch (error) {
        console.error("❌ Error fetching stores:", error);
        
        const errorMsg = error.response?.data?.message || 
                         error.response?.data?.error ||
                         "Failed to load stores";
        toast.error(errorMsg);
        
        setStores([]);
      } finally {
        setLoadingStores(false);
      }
    };

    fetchStores();
  }, [selectedCity]);

  const handleNext = () => {
    if (!selectedCity || !selectedStore) {
      toast.error("Please select both city and store");
      return;
    }

    const selectedStoreData = stores.find(s => s.id === parseInt(selectedStore));

    onNext({
      cityId: parseInt(selectedCity),
      storeId: parseInt(selectedStore),
      storeName: selectedStoreData?.storeName || "",
      storeAddress: selectedStoreData?.storeAddress || ""
    });
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        <FaCity className="inline mr-2 text-[#2B2B80]" />
        Step 2: Select Location
      </h2>

      <div className="space-y-6">
        {/* City Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FaCity className="inline mr-2" />
            Select City *
          </label>
          {loadingCities ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-10 h-10 border-4 border-[#2B2B80] border-t-transparent rounded-full"></div>
              <span className="ml-3 text-gray-600">Loading cities...</span>
            </div>
          ) : (
            <select
              value={selectedCity}
              onChange={(e) => {
                setSelectedCity(e.target.value);
                setSelectedStore(""); // Reset store when city changes
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2B2B80] focus:border-transparent"
            >
              <option value="">-- Select City --</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.cityName}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Store Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FaStore className="inline mr-2" />
            Select Store *
          </label>
          
          {!selectedCity ? (
            <div className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-500 text-center">
              Please select a city first
            </div>
          ) : loadingStores ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-10 h-10 border-4 border-[#2B2B80] border-t-transparent rounded-full"></div>
              <span className="ml-3 text-gray-600">Loading stores...</span>
            </div>
          ) : stores.length === 0 ? (
            <div className="w-full px-4 py-3 bg-yellow-50 border border-yellow-300 rounded-lg text-yellow-800 text-center">
              ⚠️ No active stores available in this city
            </div>
          ) : (
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2B2B80] focus:border-transparent"
            >
              <option value="">-- Select Store --</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.storeName}
                  {store.storeAddress && ` - ${store.storeAddress}`}
                  {store.cityName && ` (${store.cityName})`}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Selected Store Info (Preview) */}
        {selectedStore && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">📍 Selected Store</h4>
            {stores.find(s => s.id === parseInt(selectedStore)) && (
              <div className="text-sm text-blue-800">
                <p><strong>Name:</strong> {stores.find(s => s.id === parseInt(selectedStore)).storeName}</p>
                <p><strong>Address:</strong> {stores.find(s => s.id === parseInt(selectedStore)).storeAddress || "N/A"}</p>
                <p><strong>Contact:</strong> {stores.find(s => s.id === parseInt(selectedStore)).storeContactNumber || "N/A"}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="mt-8 flex justify-between">
        <button
          onClick={onBack}
          className="px-8 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2 font-semibold"
        >
          <FaArrowLeft />
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={!selectedCity || !selectedStore}
          className="px-8 py-3 bg-[#2B2B80] text-white rounded-lg hover:bg-[#1a1a4d] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-semibold"
        >
          Next: Select Dates
          <FaArrowRight />
        </button>
      </div>
    </div>
  );
};

export default LocationSelector;
