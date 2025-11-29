import { useState, useEffect } from "react";
import { bikeAPI, BASE_URL } from "../../../api/apiConfig";
import { toast } from "react-toastify";

const useBikeData = (isEditMode, id, initialBikeData) => {
  const [pageLoading, setPageLoading] = useState(isEditMode);
  const [generalError, setGeneralError] = useState("");
  const [errors, setErrors] = useState({});

  const [bikeData, setBikeData] = useState({
    name: "",
    vehicleTypeId: null,
    categoryId: null,
    brandId: null,
    modelId: null,
    fuelType: "",
    registrationNumber: "",
    registrationYear: null,
    chassisNumber: "",
    engineNumber: "",
    storeId: null,
    imeiNumber: "",
    electricBatteryId: "",
    latitude: "",
    longitude: "",
    isPuc: false,
    isInsurance: false,
    isDocuments: false,
    pucImage: null,
    insuranceImage: null,
    documentImage: null,
    images: null,
  });

  const [previewImages, setPreviewImages] = useState({
    pucImage: null,
    insuranceImage: null,
    documentImage: null,
    vehicleImages: [],
  });

  // 🟢 Use only currentBattery instead of currentBatteryInfo
  const [currentBattery, setCurrentBattery] = useState(null);

  useEffect(() => {
    if (isEditMode && initialBikeData) {
      loadBikeData(initialBikeData);
    } else if (isEditMode && id && !initialBikeData) {
      fetchBikeData();
    }
  }, [isEditMode, id, initialBikeData]);

  const loadBikeData = async (bike) => {
    setBikeData({
      name: bike.name || "",
      vehicleTypeId: bike.vehicleTypeId || null,
      categoryId: bike.categoryId || null,
      brandId: bike.brandId || null,
      modelId: bike.modelId || null,
      fuelType: bike.fuelType || "",
      registrationNumber: bike.registrationNumber || "",
      registrationYear: bike.registrationYear || null,
      chassisNumber: bike.chassisNumber || "",
      engineNumber: bike.engineNumber || "",
      storeId: bike.storeId || null,
      imeiNumber: bike.imeiNumber || "",
      electricBatteryId:
    bike.electricBatteryId !== undefined && bike.electricBatteryId !== null
      ? String(bike.electricBatteryId)
      : "",
      latitude: bike.latitude || "",
      longitude: bike.longitude || "",
      isPuc: bike.isPuc === true || bike.puc === true,
      isInsurance: bike.isInsurance === true || bike.insurance === true,
      isDocuments: bike.isDocuments === true || bike.documents === true,
      pucImage: null,
      insuranceImage: null,
      documentImage: null,
      images: null,
    });

    // ✅ Fetch current battery details if electricBatteryId exists
    if (bike.electricBatteryId) {
      await fetchCurrentBatteryInfo(bike.electricBatteryId);
    } else {
      setCurrentBattery(null);
    }

    const fixUrl = (url) => {
      if (!url) return null;
      if (url.startsWith("http")) return url;
      return `${BASE_URL}/uploads/${url.replace(/^\/+/, "")}`;
    };

    setPreviewImages({
      pucImage: fixUrl(bike.pucImageUrl || bike.pucImage),
      insuranceImage: fixUrl(bike.insuranceImageUrl || bike.insuranceImage),
      documentImage: fixUrl(bike.documentImageUrl || bike.documentImage),
      vehicleImages: (bike.bikeImages || bike.images || []).map(fixUrl).filter(Boolean),
    });

    setPageLoading(false);
  };

  // 🟢 Use only currentBattery instead of currentBatteryInfo
  const fetchCurrentBatteryInfo = async (batteryId) => {
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");
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
          id: String(batteryData.id),
  batteryId: batteryData.batteryId,
  company: batteryData.company,
          batteryStatusCode: batteryData.batteryStatusCode,
          cityName: batteryData.cityName,
          storeName: batteryData.storeName,
        });

        console.log("✅ Current battery info loaded:", batteryData);
      }
    } catch (error) {
      console.error("Failed to fetch current battery info:", error);
      setCurrentBattery(null);
    }
  };

  const fetchBikeData = async () => {
    try {
      setPageLoading(true);
      const response = await bikeAPI.getById(id);
      const bike = response.data?.data || response.data;

      if (bike) {
        await loadBikeData(bike);
      } else {
        toast.error("Bike not found");
      }
    } catch (error) {
      console.error("Error fetching bike:", error);
      toast.error("Failed to load bike data");
    } finally {
      setPageLoading(false);
    }
  };

  return {
    bikeData,
    setBikeData,
    errors,
    setErrors,
    previewImages,
    setPreviewImages,
    pageLoading,
    generalError,
    setGeneralError,
    currentBattery, // 🟢 Export as currentBattery
  };
};

export default useBikeData;
