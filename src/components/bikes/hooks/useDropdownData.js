import { useState, useEffect } from "react";
import { brandAPI, categoryAPI, modelAPI, storeAPI, BASE_URL } from "../../../api/apiConfig";
import { toast } from "react-toastify";

const useDropdownData = (bikeData) => {
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [allBrands, setAllBrands] = useState([]);
  const [allModels, setAllModels] = useState([]);
  const [stores, setStores] = useState([]);

  const [filteredCategories, setFilteredCategories] = useState([]);
  const [filteredBrands, setFilteredBrands] = useState([]);
  const [filteredModels, setFilteredModels] = useState([]);

  // Fetch all dropdown data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        let modelsData = [];

        try {
          const modelResponse = await modelAPI.getAll({ page: 0, size: 1000 });
          
          if (modelResponse.data?.success && Array.isArray(modelResponse.data.data)) {
            modelsData = modelResponse.data.data;
          } else if (Array.isArray(modelResponse.data?.data)) {
            modelsData = modelResponse.data.data;
          } else if (Array.isArray(modelResponse.data)) {
            modelsData = modelResponse.data;
          }

          modelsData = modelsData.filter((model) => model.isActive === 1);
        } catch (modelError) {
          console.error("Models fetch failed:", modelError);
        }

        const [vehicleTypeRes, categoryRes, brandRes, storeRes] = await Promise.all([
          fetch(`${BASE_URL}/api/vehicle-types/active`).then((r) => r.json()),
          categoryAPI.getActive(),
          brandAPI.getActive(),
          storeAPI.getActive(),
        ]);

        const vehicleTypesData = Array.isArray(vehicleTypeRes) ? vehicleTypeRes : vehicleTypeRes?.data || [];
        const categoriesData = Array.isArray(categoryRes.data) ? categoryRes.data : categoryRes.data?.data || [];
        const brandsData = Array.isArray(brandRes.data) ? brandRes.data : brandRes.data?.data || [];
        const storesData = Array.isArray(storeRes.data) ? storeRes.data : storeRes.data?.data || [];

        setVehicleTypes(vehicleTypesData);
        setAllCategories(categoriesData);
        setAllBrands(brandsData);
        setAllModels(modelsData);
        setStores(storesData);
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
        toast.error("Failed to load dropdown data");
      }
    };

    fetchData();
  }, []);

  // Filter categories when vehicle type changes
  useEffect(() => {
    if (!bikeData.vehicleTypeId) {
      setFilteredCategories([]);
      return;
    }

    const filtered = allCategories.filter((cat) => cat.vehicleTypeId === bikeData.vehicleTypeId);
    setFilteredCategories(filtered);
  }, [bikeData.vehicleTypeId, allCategories]);

  // Filter brands when category changes
  useEffect(() => {
    if (!bikeData.categoryId) {
      setFilteredBrands([]);
      return;
    }

    const filtered = allBrands.filter((brand) => brand.categoryId === bikeData.categoryId);
    setFilteredBrands(filtered);
  }, [bikeData.categoryId, allBrands]);

  // Filter models when brand changes
  useEffect(() => {
    if (!bikeData.brandId) {
      setFilteredModels([]);
      return;
    }

    const filtered = allModels.filter((model) => {
      const modelBrandId = model.brandId || model.brandid || model.brand?.id || null;
      return Number(modelBrandId) === Number(bikeData.brandId);
    });

    setFilteredModels(filtered);
  }, [bikeData.brandId, allModels]);

  return {
    vehicleTypes,
    allCategories,
    allBrands,
    allModels,
    stores,
    filteredCategories,
    filteredBrands,
    filteredModels,
  };
};

export default useDropdownData;
