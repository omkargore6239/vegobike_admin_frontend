  // AddBikeForm.jsx - WITH FULL DEBUG LOGGING ✅

  import React, { useState, useEffect } from "react";
  import { useNavigate, useParams, useLocation } from "react-router-dom";
  import { brandAPI, categoryAPI, modelAPI, storeAPI, bikeAPI, BASE_URL } from "../api/apiConfig";
  import { toast } from "react-toastify";
  import { FaSpinner, FaCheck, FaTimes, FaArrowLeft, FaTrash, FaMotorcycle } from "react-icons/fa";

  const AddBikeForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();

    const isEditMode = !!id;
    const initialBikeData = location.state?.bike;

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
      batteryId: "",
      latitude: "",
      longitude: "",
      isPuc: false,
      isInsurance: false,
      isDocuments: false,
      pucImage: null,
      insuranceImage: null,
      documentImage: null,
      vehicleImages: null,
    });

    // Dropdown data states
    const [vehicleTypes, setVehicleTypes] = useState([]);
    const [allCategories, setAllCategories] = useState([]);
    const [filteredCategories, setFilteredCategories] = useState([]);
    const [allBrands, setAllBrands] = useState([]);
    const [filteredBrands, setFilteredBrands] = useState([]);
    const [allModels, setAllModels] = useState([]);
    const [filteredModels, setFilteredModels] = useState([]);
    const [stores, setStores] = useState([]);

    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [pageLoading, setPageLoading] = useState(isEditMode);

    const [previewImages, setPreviewImages] = useState({
      pucImage: null,
      insuranceImage: null,
      documentImage: null,
      vehicleImages: [],
    });

    const fuelTypeOptions = [
      { value: "PETROL", label: "⛽ Petrol" },
      { value: "DIESEL", label: "🛢️ Diesel" },
      { value: "ELECTRIC", label: "⚡ Electric" },
      { value: "HYBRID", label: "🔋 Hybrid" },
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 30 }, (_, i) => currentYear - i);

    const isValidId = (value) => {
      if (!value || value === "" || value === "0") return false;
      const numValue = Number(value);
      return !isNaN(numValue) && numValue > 0;
    };

    // ✅ 1. Fetch ALL dropdown data on mount - FIXED TO USE /all ENDPOINT
  useEffect(() => {
    console.log("%c📡 FETCHING ALL DROPDOWN DATA", "color: blue; font-weight: bold; font-size: 14px");
    const fetchData = async () => {
      try {
        // ✅ FETCH MODELS FROM /all ENDPOINT WITH DEBUG
        let modelsData = [];
        
        try {
          console.log("🔄 Fetching ALL models using modelAPI.getAll()...");
          
          // Use getAll instead of getActive
          const modelResponse = await modelAPI.getAll({ page: 0, size: 1000 });
          
          console.log("📡 Raw modelAPI.getAll() response:", modelResponse);
          console.log("📡 response.data:", modelResponse.data);
          
          // Parse response - handle multiple structures
          if (modelResponse.data?.success && Array.isArray(modelResponse.data.data)) {
            modelsData = modelResponse.data.data;
            console.log("✅ Found models in: response.data.data (with success)");
          } else if (Array.isArray(modelResponse.data?.data)) {
            modelsData = modelResponse.data.data;
            console.log("✅ Found models in: response.data.data");
          } else if (Array.isArray(modelResponse.data)) {
            modelsData = modelResponse.data;
            console.log("✅ Found models in: response.data (array)");
          } else if (modelResponse?.success && Array.isArray(modelResponse.data)) {
            modelsData = modelResponse.data;
            console.log("✅ Found models in: response level");
          }
          
          // ✅ FILTER ONLY ACTIVE MODELS
          const totalModels = modelsData.length;
          modelsData = modelsData.filter(model => model.isActive === 1);
          
          console.log("%c✅ MODELS LOADED", "color: green; font-weight: bold; font-size: 16px");
          console.log(`   Total fetched: ${totalModels}`);
          console.log(`   Active models: ${modelsData.length}`);
          console.log("📋 Sample model:", modelsData[0]);
          
          if (modelsData.length > 0) {
            console.log("📋 Model fields:", Object.keys(modelsData[0]));
          } else {
            console.warn("⚠️ No active models found!");
          }
          
        } catch (modelError) {
          console.error("%c❌ MODELS FETCH FAILED", "color: red; font-weight: bold", modelError);
          console.error("Error response:", modelError.response);
          console.error("Error message:", modelError.message);
        }

        // Fetch other data
        const [vehicleTypeRes, categoryRes, brandRes, storeRes] = await Promise.all([
          fetch(`${BASE_URL}/api/vehicle-types/active`).then(r => r.json()),
          categoryAPI.getActive(),
          brandAPI.getActive(),
          storeAPI.getActive(),
        ]);

        const vehicleTypesData = Array.isArray(vehicleTypeRes) ? vehicleTypeRes : vehicleTypeRes?.data || [];
        const categoriesData = Array.isArray(categoryRes.data) ? categoryRes.data : categoryRes.data?.data || [];
        const brandsData = Array.isArray(brandRes.data) ? brandRes.data : brandRes.data?.data || [];
        const storesData = Array.isArray(storeRes.data) ? storeRes.data : storeRes.data?.data || [];

        console.log("%c✅ ALL DATA LOADED", "color: green; font-weight: bold");
        console.log("📊 Vehicle Types:", vehicleTypesData.length);
        console.log("📊 All Categories:", categoriesData.length);
        console.log("📊 All Brands:", brandsData.length);
        console.log("%c📊 All Models: " + modelsData.length, "color: orange; font-weight: bold");
        console.log("📊 All Stores:", storesData.length);

        setVehicleTypes(vehicleTypesData);
        setAllCategories(categoriesData);
        setAllBrands(brandsData);
        setAllModels(modelsData);
        setStores(storesData);

      } catch (error) {
        console.error("%c❌ ERROR FETCHING DROPDOWN DATA", "color: red; font-weight: bold", error);
        toast.error("Failed to load dropdown data");
      }
    };

    fetchData();
  }, []);



    // ✅ 2. Filter Categories when VehicleType changes
    useEffect(() => {
      console.log("🔍 VehicleType changed:", bikeData.vehicleTypeId);
      
      if (!bikeData.vehicleTypeId) {
        setFilteredCategories([]);
        if (bikeData.categoryId) {
          setBikeData(prev => ({ ...prev, categoryId: null, brandId: null, modelId: null }));
        }
        return;
      }

      const filtered = allCategories.filter(cat => cat.vehicleTypeId == bikeData.vehicleTypeId);
      console.log(`  ✅ Found ${filtered.length} categories for vehicle type ${bikeData.vehicleTypeId}`);
      setFilteredCategories(filtered);

      if (bikeData.categoryId) {
        const stillValid = filtered.some(c => c.id == bikeData.categoryId);
        if (!stillValid) {
          setBikeData(prev => ({ ...prev, categoryId: null, brandId: null, modelId: null }));
        }
      }
    }, [bikeData.vehicleTypeId, allCategories]);

    // ✅ 3. Filter Brands when Category changes
    useEffect(() => {
      console.log("🔍 Category changed:", bikeData.categoryId);
      
      if (!bikeData.categoryId) {
        setFilteredBrands([]);
        if (bikeData.brandId) {
          setBikeData(prev => ({ ...prev, brandId: null, modelId: null }));
        }
        return;
      }

      const filtered = allBrands.filter(brand => brand.categoryId == bikeData.categoryId);
      console.log(`  ✅ Found ${filtered.length} brands for category ${bikeData.categoryId}`);
      setFilteredBrands(filtered);

      if (bikeData.brandId) {
        const stillValid = filtered.some(b => b.id == bikeData.brandId);
        if (!stillValid) {
          setBikeData(prev => ({ ...prev, brandId: null, modelId: null }));
        }
      }
    }, [bikeData.categoryId, allBrands]);

    // ✅ 4. Filter Models when Brand changes - WITH COMPREHENSIVE DEBUG
    useEffect(() => {
      console.log("%c" + "=".repeat(80), "color: blue; font-weight: bold");
      console.log("%c🔍 BRAND CHANGED - FILTERING MODELS", "color: blue; font-weight: bold; font-size: 14px");
      console.log("Selected brandId:", bikeData.brandId, "(type:", typeof bikeData.brandId, ")");
      console.log("Total models available:", allModels.length);
      
      if (!bikeData.brandId) {
        console.log("⚠️ No brand selected, clearing models");
        setFilteredModels([]);
        if (bikeData.modelId) {
          setBikeData(prev => ({ ...prev, modelId: null }));
        }
        return;
      }

      // ✅ CHECK EACH MODEL IN DETAIL
      console.log("%c🔎 CHECKING EACH MODEL:", "color: purple; font-weight: bold");
      allModels.forEach((model, index) => {
        const modelBrandId = model.brandId || model.brand?.id || model.brand_id;
        const matches = modelBrandId == bikeData.brandId;
        
        console.log(`[${index}] "${model.modelName || model.name}"`);
        console.log(`    brandId in model: ${modelBrandId} (type: ${typeof modelBrandId})`);
        console.log(`    selected brandId: ${bikeData.brandId} (type: ${typeof bikeData.brandId})`);
        console.log(`    ✓ Matches: ${matches ? "YES ✅" : "NO ❌"}`);
        
        if (index === 0) {
          console.log("    Full model object:", model);
          console.log("    Model keys:", Object.keys(model));
        }
      });

      // Try multiple field names for compatibility
      const filtered = allModels.filter(model => {
        const modelBrandId = 
          model.brandId ||           // Standard field
          model.brand_id ||          // Snake case
          model.brand?.id ||         // Nested object
          model.brand?.brandId ||    // Nested with different name
          null;
        
        return Number(modelBrandId) === Number(bikeData.brandId);
      });

      console.log("%c✅ FILTER RESULT: Found " + filtered.length + " models for brand " + bikeData.brandId, 
                  filtered.length > 0 ? "color: green; font-weight: bold; font-size: 16px" : "color: red; font-weight: bold; font-size: 16px");
      console.log("📋 Filtered models:", filtered);
      console.log("%c" + "=".repeat(80), "color: blue; font-weight: bold");
      
      setFilteredModels(filtered);

      if (bikeData.modelId) {
        const stillValid = filtered.some(m => m.id == bikeData.modelId);
        if (!stillValid) {
          setBikeData(prev => ({ ...prev, modelId: null }));
        }
      }
    }, [bikeData.brandId, allModels]);

    // Edit mode
    useEffect(() => {
      if (isEditMode) {
        if (initialBikeData) {
          setBikeData({
            name: initialBikeData.name || "",
            vehicleTypeId: initialBikeData.vehicleTypeId || null,
            categoryId: initialBikeData.categoryId || null,
            brandId: initialBikeData.brandId || null,
            modelId: initialBikeData.modelId || null,
            fuelType: initialBikeData.fuelType || "",
            registrationNumber: initialBikeData.registrationNumber || "",
            registrationYear: initialBikeData.registrationYear || null,
            chassisNumber: initialBikeData.chassisNumber || "",
            engineNumber: initialBikeData.engineNumber || "",
            storeId: initialBikeData.storeId || null,
            imeiNumber: initialBikeData.imeiNumber || "",
            batteryId: initialBikeData.batteryId || "",
            latitude: initialBikeData.latitude || "",
            longitude: initialBikeData.longitude || "",
            isPuc: initialBikeData.isPuc || false,
            isInsurance: initialBikeData.isInsurance || false,
            isDocuments: initialBikeData.isDocuments || false,
            pucImage: null,
            insuranceImage: null,
            documentImage: null,
            vehicleImages: null,
          });

          setPreviewImages({
            pucImage: initialBikeData.pucImageUrl ? `${BASE_URL}${initialBikeData.pucImageUrl}` : null,
            insuranceImage: initialBikeData.insuranceImageUrl ? `${BASE_URL}${initialBikeData.insuranceImageUrl}` : null,
            documentImage: initialBikeData.documentImageUrl ? `${BASE_URL}${initialBikeData.documentImageUrl}` : null,
            vehicleImages: initialBikeData.bikeImages?.map((img) => `${BASE_URL}${img}`) || [],
          });
          setPageLoading(false);
        } else {
          fetchBikeData();
        }
      }
    }, [isEditMode, initialBikeData]);

    const fetchBikeData = async () => {
      try {
        const response = await bikeAPI.getById(id);
        const bike = response.data?.data || response.data;

        if (bike) {
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
            batteryId: bike.batteryId || "",
            latitude: bike.latitude || "",
            longitude: bike.longitude || "",
            isPuc: bike.isPuc || false,
            isInsurance: bike.isInsurance || false,
            isDocuments: bike.isDocuments || false,
            pucImage: null,
            insuranceImage: null,
            documentImage: null,
            vehicleImages: null,
          });

          setPreviewImages({
            pucImage: bike.pucImageUrl ? `${BASE_URL}${bike.pucImageUrl}` : null,
            insuranceImage: bike.insuranceImageUrl ? `${BASE_URL}${bike.insuranceImageUrl}` : null,
            documentImage: bike.documentImageUrl ? `${BASE_URL}${bike.documentImageUrl}` : null,
            vehicleImages: bike.bikeImages?.map((img) => `${BASE_URL}${img}`) || [],
          });
        }
      } catch (error) {
        console.error("❌ Error fetching bike:", error);
        toast.error("Failed to load bike data");
      } finally {
        setPageLoading(false);
      }
    };

    const handleChange = (e) => {
      const { name, value, type, checked, files } = e.target;
      
      if (type === 'checkbox') {
        setBikeData(prev => ({...prev, [name]: checked}));
      } else if (type === 'file') {
        if (name === 'vehicleImages') {
          const fileArray = Array.from(files);
          setBikeData(prev => ({...prev, [name]: fileArray}));
          
          const previews = fileArray.map(file => URL.createObjectURL(file));
          setPreviewImages(prev => ({...prev, vehicleImages: previews}));
        } else {
          const file = files[0];
          setBikeData(prev => ({...prev, [name]: file}));
          
          if (file) {
            const preview = URL.createObjectURL(file);
            setPreviewImages(prev => ({...prev, [name]: preview}));
          }
        }
      } else if (['vehicleTypeId', 'categoryId', 'brandId', 'modelId', 'storeId', 'registrationYear'].includes(name)) {
        const numValue = value && value !== '' ? Number(value) : null;
        console.log(`🔄 Changing ${name} to:`, numValue, "(type:", typeof numValue, ")");
        setBikeData(prev => ({...prev, [name]: numValue}));
      } else {
        setBikeData(prev => ({...prev, [name]: value}));
      }
    };

    const validateForm = () => {
      const newErrors = {};

      if (!bikeData.name?.trim()) newErrors.name = "Bike name is required";
      if (!isValidId(bikeData.vehicleTypeId)) newErrors.vehicleTypeId = "Select vehicle type";
      if (!isValidId(bikeData.categoryId)) newErrors.categoryId = "Select category";
      if (!isValidId(bikeData.brandId)) newErrors.brandId = "Select brand";
      if (!isValidId(bikeData.modelId)) newErrors.modelId = "Select model";
      if (!bikeData.fuelType) newErrors.fuelType = "Select fuel type";
      if (!bikeData.registrationNumber?.trim()) newErrors.registrationNumber = "Registration number required";
      if (!isValidId(bikeData.registrationYear)) newErrors.registrationYear = "Select registration year";
      if (!isValidId(bikeData.storeId)) newErrors.storeId = "Select store";
      
      if (!isEditMode && (!bikeData.vehicleImages || bikeData.vehicleImages.length === 0)) {
        newErrors.vehicleImages = "Upload at least 1 vehicle image";
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isLoading) return;
    if (!validateForm()) {
      toast.error('Please fill all required fields');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const formData = new FormData();
      
      // ✅ Basic bike information (matching BikeRequestDTO)
      formData.append('name', bikeData.name?.trim());
      formData.append('vehicleTypeId', bikeData.vehicleTypeId);
      formData.append('categoryId', bikeData.categoryId);
      formData.append('brandId', bikeData.brandId);
      formData.append('modelId', bikeData.modelId);
      formData.append('fuelType', bikeData.fuelType); // Send as string: "ELECTRIC" or "PETROL"
      formData.append('registrationNumber', bikeData.registrationNumber?.trim());
      formData.append('registrationYear', bikeData.registrationYear);
      formData.append('storeId', bikeData.storeId);
      
      // ✅ Optional fields
      formData.append('chassisNumber', bikeData.chassisNumber?.trim() || '');
      formData.append('engineNumber', bikeData.engineNumber?.trim() || '');
      formData.append('imeiNumber', bikeData.imeiNumber?.trim() || '');
      formData.append('batteryId', bikeData.batteryId?.trim() || '');
      formData.append('latitude', bikeData.latitude?.trim() || '');
      formData.append('longitude', bikeData.longitude?.trim() || '');
      
      // ✅ Boolean flags (send as "true" or "false" strings)
      formData.append('isPuc', String(bikeData.isPuc === true));
      formData.append('isInsurance', String(bikeData.isInsurance === true));
      formData.append('isDocuments', String(bikeData.isDocuments === true));
      
      // ✅ Document images (single files)
      if (bikeData.pucImage instanceof File) {
        formData.append('pucImage', bikeData.pucImage);
      }
      if (bikeData.insuranceImage instanceof File) {
        formData.append('insuranceImage', bikeData.insuranceImage);
      }
      if (bikeData.documentImage instanceof File) {
        formData.append('documentImage', bikeData.documentImage);
      }
      
      // ✅ CRITICAL: Vehicle images array (matching backend's "images" field)
      if (Array.isArray(bikeData.vehicleImages) && bikeData.vehicleImages.length > 0) {
        bikeData.vehicleImages.forEach((file) => {
          if (file instanceof File) {
            formData.append('images', file); // Backend expects "images" not "vehicleImages"
          }
        });
      }
      
      // Debug log
      console.log('📤 Submitting form data:');
      for (let pair of formData.entries()) {
        console.log(pair[0] + ':', pair[1]);
      }
      
      let response;
      if (isEditMode) {
        response = await bikeAPI.update(id, formData);
        toast.success('✅ Bike updated successfully!');
      } else {
        response = await bikeAPI.create(formData);
        toast.success('✅ Bike added successfully!');
      }
      
      console.log('✅ Response:', response.data);
      
      // Navigate to bikes list after success
      setTimeout(() => navigate('/dashboard/allBikes'), 1000);
      
    } catch (error) {
      console.error('❌ Error:', error.response?.data || error);
      
      // Handle validation errors
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        Object.keys(errors).forEach(key => {
          toast.error(`${key}: ${errors[key]}`);
        });
      } else {
        toast.error(error.response?.data?.message || 'Failed to submit bike data');
      }
    } finally {
      setIsLoading(false);
    }
  };


    const removeVehicleImagePreview = (index) => {
      setPreviewImages((prev) => ({
        ...prev,
        vehicleImages: prev.vehicleImages.filter((_, i) => i !== index),
      }));
      setBikeData(prev => ({
        ...prev,
        vehicleImages: prev.vehicleImages?.filter((_, i) => i !== index) || null
      }));
    };

    const removeSingleImagePreview = (fieldName) => {
      setPreviewImages((prev) => ({ ...prev, [fieldName]: null }));
      setBikeData((prev) => ({ ...prev, [fieldName]: null }));
    };

    if (pageLoading) {
      return (
        <div className="bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen p-4 sm:p-6 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-[#2B2B80] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 font-medium">Loading bike data...</p>
          </div>
        </div>
      );
    }



    return (
      <div className="bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen p-3 sm:p-4 md:p-6">
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
          
          {/* Header - Mobile Responsive */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {isEditMode && (
                <button
                  onClick={() => navigate("/dashboard/allBikes")}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <FaArrowLeft className="text-[#2B2B80] text-lg sm:text-xl" />
                </button>
              )}
              <div className="flex items-center gap-2">
                <FaMotorcycle className="text-[#2B2B80] text-2xl sm:text-3xl" />
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#2B2B80]">
                  {isEditMode ? `Edit Bike #${id}` : "Add New Bike"}
                </h2>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-6 sm:space-y-8">
            
            {/* Section 1: Basic Information */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-6 rounded-xl">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-[#2B2B80] flex items-center gap-2">
                <span className="text-2xl">📝</span> Basic Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* Bike Name */}
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Bike Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={bikeData.name}
                    onChange={handleChange}
                    placeholder="Enter bike name"
                    className={`w-full border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B2B80] transition ${
                      errors.name ? "border-red-500 bg-red-50" : "border-gray-300"
                    }`}
                    disabled={isLoading}
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><FaTimes /> {errors.name}</p>}
                </div>

                {/* Vehicle Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Vehicle Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="vehicleTypeId"
                    value={bikeData.vehicleTypeId || ""}
                    onChange={handleChange}
                    className={`w-full border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B2B80] transition ${
                      errors.vehicleTypeId ? "border-red-500 bg-red-50" : "border-gray-300"
                    }`}
                    disabled={isLoading}
                  >
                    <option value="">-- Select Type --</option>
                    {vehicleTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.typeName || type.name}
                      </option>
                    ))}
                  </select>
                  {errors.vehicleTypeId && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><FaTimes /> {errors.vehicleTypeId}</p>}
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="categoryId"
                    value={bikeData.categoryId || ""}
                    onChange={handleChange}
                    className={`w-full border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B2B80] transition ${
                      errors.categoryId ? "border-red-500 bg-red-50" : "border-gray-300"
                    }`}
                    disabled={isLoading || !bikeData.vehicleTypeId}
                  >
                    <option value="">
                      {!bikeData.vehicleTypeId ? "Select Type First" : filteredCategories.length === 0 ? "No Categories" : "-- Select Category --"}
                    </option>
                    {filteredCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.categoryName || cat.name}
                      </option>
                    ))}
                  </select>
                  {errors.categoryId && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><FaTimes /> {errors.categoryId}</p>}
                </div>

                {/* Brand */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Brand <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="brandId"
                    value={bikeData.brandId || ""}
                    onChange={handleChange}
                    className={`w-full border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B2B80] transition ${
                      errors.brandId ? "border-red-500 bg-red-50" : "border-gray-300"
                    }`}
                    disabled={isLoading || !bikeData.categoryId}
                  >
                    <option value="">
                      {!bikeData.categoryId ? "Select Category First" : filteredBrands.length === 0 ? "No Brands" : "-- Select Brand --"}
                    </option>
                    {filteredBrands.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.brandName || brand.name}
                      </option>
                    ))}
                  </select>
                  {errors.brandId && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><FaTimes /> {errors.brandId}</p>}
                </div>

                {/* Model */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Model <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="modelId"
                    value={bikeData.modelId || ""}
                    onChange={handleChange}
                    className={`w-full border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B2B80] transition ${
                      errors.modelId ? "border-red-500 bg-red-50" : "border-gray-300"
                    }`}
                    disabled={isLoading || !bikeData.brandId}
                  >
                    <option value="">
                      {!bikeData.brandId ? "Select Brand First" : filteredModels.length === 0 ? "No Models" : "-- Select Model --"}
                    </option>
                    {filteredModels.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.modelName || model.name}
                      </option>
                    ))}
                  </select>
                  {errors.modelId && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><FaTimes /> {errors.modelId}</p>}
                </div>

                {/* Fuel Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Fuel Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="fuelType"
                    value={bikeData.fuelType}
                    onChange={handleChange}
                    className={`w-full border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B2B80] transition ${
                      errors.fuelType ? "border-red-500 bg-red-50" : "border-gray-300"
                    }`}
                    disabled={isLoading}
                  >
                    <option value="">-- Select Fuel Type --</option>
                    {fuelTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.fuelType && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><FaTimes /> {errors.fuelType}</p>}
                </div>
              </div>
            </div>

            {/* Section 2: Registration Details */}
            <div className="bg-gradient-to-r from-green-50 to-teal-50 p-4 sm:p-6 rounded-xl">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-green-600 flex items-center gap-2">
                <span className="text-2xl">📋</span> Registration Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* Registration Number */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Registration Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="registrationNumber"
                    value={bikeData.registrationNumber}
                    onChange={handleChange}
                    placeholder="e.g., MH12AB1234"
                    className={`w-full border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 transition uppercase ${
                      errors.registrationNumber ? "border-red-500 bg-red-50" : "border-gray-300"
                    }`}
                    disabled={isLoading}
                  />
                  {errors.registrationNumber && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><FaTimes /> {errors.registrationNumber}</p>}
                </div>

                {/* Registration Year */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Registration Year <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="registrationYear"
                    value={bikeData.registrationYear || ""}
                    onChange={handleChange}
                    className={`w-full border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 transition ${
                      errors.registrationYear ? "border-red-500 bg-red-50" : "border-gray-300"
                    }`}
                    disabled={isLoading}
                  >
                    <option value="">-- Select Year --</option>
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                  {errors.registrationYear && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><FaTimes /> {errors.registrationYear}</p>}
                </div>

                {/* Chassis Number */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Chassis Number
                  </label>
                  <input
                    type="text"
                    name="chassisNumber"
                    value={bikeData.chassisNumber}
                    onChange={handleChange}
                    placeholder="Enter chassis number"
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 transition uppercase"
                    disabled={isLoading}
                  />
                </div>

                {/* Engine Number */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Engine Number
                  </label>
                  <input
                    type="text"
                    name="engineNumber"
                    value={bikeData.engineNumber}
                    onChange={handleChange}
                    placeholder="Enter engine number"
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 transition uppercase"
                    disabled={isLoading}
                  />
                </div>

                {/* Store */}
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Store Location <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="storeId"
                    value={bikeData.storeId || ""}
                    onChange={handleChange}
                    className={`w-full border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 transition ${
                      errors.storeId ? "border-red-500 bg-red-50" : "border-gray-300"
                    }`}
                    disabled={isLoading}
                  >
                    <option value="">-- Select Store --</option>
                    {stores.map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.storeName || store.name}
                      </option>
                    ))}
                  </select>
                  {errors.storeId && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><FaTimes /> {errors.storeId}</p>}
                </div>
              </div>
            </div>

            {/* Section 3: Additional Details */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 sm:p-6 rounded-xl">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-purple-600 flex items-center gap-2">
                <span className="text-2xl">⚙️</span> Additional Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* IMEI Number */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    IMEI Number
                  </label>
                  <input
                    type="text"
                    name="imeiNumber"
                    value={bikeData.imeiNumber}
                    onChange={handleChange}
                    placeholder="Enter IMEI number"
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 transition"
                    disabled={isLoading}
                  />
                </div>

                {/* Battery ID */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Battery ID
                  </label>
                  <input
                    type="text"
                    name="batteryId"
                    value={bikeData.batteryId}
                    onChange={handleChange}
                    placeholder="Enter battery ID"
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 transition"
                    disabled={isLoading}
                  />
                </div>

                {/* Latitude */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Latitude
                  </label>
                  <input
                    type="text"
                    name="latitude"
                    value={bikeData.latitude}
                    onChange={handleChange}
                    placeholder="e.g., 19.0760"
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 transition"
                    disabled={isLoading}
                  />
                </div>

                {/* Longitude */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Longitude
                  </label>
                  <input
                    type="text"
                    name="longitude"
                    value={bikeData.longitude}
                    onChange={handleChange}
                    placeholder="e.g., 72.8777"
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 transition"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Documents & Compliance */}
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-4 sm:p-6 rounded-xl">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-orange-600 flex items-center gap-2">
                <span className="text-2xl">📄</span> Documents & Compliance
              </h3>
              
              {/* Checkboxes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <label className="flex items-center gap-3 p-3 bg-white rounded-lg border-2 border-gray-200 hover:border-orange-400 transition cursor-pointer">
                  <input
                    type="checkbox"
                    name="isPuc"
                    checked={bikeData.isPuc}
                    onChange={handleChange}
                    className="w-5 h-5 text-orange-600 rounded focus:ring-2 focus:ring-orange-500"
                    disabled={isLoading}
                  />
                  <span className="text-sm font-semibold text-gray-700">PUC Available</span>
                </label>

                <label className="flex items-center gap-3 p-3 bg-white rounded-lg border-2 border-gray-200 hover:border-orange-400 transition cursor-pointer">
                  <input
                    type="checkbox"
                    name="isInsurance"
                    checked={bikeData.isInsurance}
                    onChange={handleChange}
                    className="w-5 h-5 text-orange-600 rounded focus:ring-2 focus:ring-orange-500"
                    disabled={isLoading}
                  />
                  <span className="text-sm font-semibold text-gray-700">Insurance Available</span>
                </label>

                <label className="flex items-center gap-3 p-3 bg-white rounded-lg border-2 border-gray-200 hover:border-orange-400 transition cursor-pointer">
                  <input
                    type="checkbox"
                    name="isDocuments"
                    checked={bikeData.isDocuments}
                    onChange={handleChange}
                    className="w-5 h-5 text-orange-600 rounded focus:ring-2 focus:ring-orange-500"
                    disabled={isLoading}
                  />
                  <span className="text-sm font-semibold text-gray-700">All Documents Available</span>
                </label>
              </div>

              {/* Document Images */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* PUC Image */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    PUC Certificate Image
                  </label>
                  <input
                    type="file"
                    name="pucImage"
                    onChange={handleChange}
                    accept="image/*"
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                    disabled={isLoading}
                  />
                  {previewImages.pucImage && (
                    <div className="mt-3 relative">
                      <img src={previewImages.pucImage} alt="PUC" className="w-full h-32 object-cover rounded-lg border-2 border-orange-200" />
                      <button
                        type="button"
                        onClick={() => removeSingleImagePreview('pucImage')}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition"
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Insurance Image */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Insurance Document Image
                  </label>
                  <input
                    type="file"
                    name="insuranceImage"
                    onChange={handleChange}
                    accept="image/*"
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                    disabled={isLoading}
                  />
                  {previewImages.insuranceImage && (
                    <div className="mt-3 relative">
                      <img src={previewImages.insuranceImage} alt="Insurance" className="w-full h-32 object-cover rounded-lg border-2 border-orange-200" />
                      <button
                        type="button"
                        onClick={() => removeSingleImagePreview('insuranceImage')}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition"
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Other Documents Image */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Other Documents Image
                  </label>
                  <input
                    type="file"
                    name="documentImage"
                    onChange={handleChange}
                    accept="image/*"
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                    disabled={isLoading}
                  />
                  {previewImages.documentImage && (
                    <div className="mt-3 relative">
                      <img src={previewImages.documentImage} alt="Documents" className="w-full h-32 object-cover rounded-lg border-2 border-orange-200" />
                      <button
                        type="button"
                        onClick={() => removeSingleImagePreview('documentImage')}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition"
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section 5: Vehicle Images */}
            <div className="bg-gradient-to-r from-cyan-50 to-blue-50 p-4 sm:p-6 rounded-xl">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-cyan-600 flex items-center gap-2">
                <span className="text-2xl">📸</span> Vehicle Images {!isEditMode && <span className="text-red-500 text-sm">*</span>}
              </h3>
              
              <input
                type="file"
                name="vehicleImages"
                onChange={handleChange}
                accept="image/*"
                multiple
                className={`w-full border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100 ${
                  errors.vehicleImages ? "border-red-500 bg-red-50" : "border-gray-300"
                }`}
                disabled={isLoading}
              />
              {errors.vehicleImages && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><FaTimes /> {errors.vehicleImages}</p>}
              
              {previewImages.vehicleImages.length > 0 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {previewImages.vehicleImages.map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={img}
                        alt={`Vehicle ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border-2 border-cyan-200 group-hover:border-cyan-400 transition"
                      />
                      <button
                        type="button"
                        onClick={() => removeVehicleImagePreview(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition opacity-0 group-hover:opacity-100"
                      >
                        <FaTrash size={12} />
                      </button>
                      <div className="absolute bottom-1 left-1 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                        #{index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 pt-6 border-t-2 border-gray-200">
              <button
                type="button"
                onClick={() => navigate("/dashboard/allBikes")}
                className="w-full sm:w-auto px-6 py-3 bg-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-400 transition shadow-md"
                disabled={isLoading}
              >
                <FaTimes className="inline mr-2" />
                Cancel
              </button>
              <button
                type="submit"
                className="w-full sm:flex-1 px-6 py-3 bg-gradient-to-r from-[#2B2B80] to-indigo-700 text-white font-bold rounded-lg hover:from-[#1f1f5c] hover:to-indigo-800 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FaCheck />
                    {isEditMode ? "Update Bike" : "Add Bike"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  export default AddBikeForm;
