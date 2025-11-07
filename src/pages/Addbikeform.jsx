import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { brandAPI, categoryAPI, modelAPI, storeAPI, bikeAPI, BASE_URL } from "../api/apiConfig";
import { toast } from "react-toastify";
import { FaSpinner, FaCheck, FaTimes, FaArrowLeft, FaTrash } from "react-icons/fa";

const AddBikeForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  const isEditMode = !!id;
  const initialBikeData = location.state?.bike;

  console.log("🔵 COMPONENT RENDERED - isEditMode:", isEditMode);

  const [bikeData, setBikeData] = useState({
    name: "",
    brandId: null,
    categoryId: "",
    modelId: "",
    registrationNumber: "",
    registrationYear: "",
    chassisNumber: "",
    engineNumber: "",
    storeId: "",
    price: "",
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

  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [models, setModels] = useState([]);
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

  // Helper function
  const isValidId = (value) => {
    console.log(`🔍 isValidId called with:`, value, `Type:`, typeof value);
    if (!value || value === "" || value === "0") {
      console.log(`  ❌ Invalid: empty or "0"`);
      return false;
    }
    const numValue = Number(value);
    const isValid = !isNaN(numValue) && numValue > 0;
    console.log(`  ${isValid ? '✅' : '❌'} Result: ${numValue} (isNaN: ${isNaN(numValue)}, > 0: ${numValue > 0})`);
    return isValid;
  };

  // Fetch data
  useEffect(() => {
    console.log("📡 EFFECT: Fetching dropdown data...");
    const fetchData = async () => {
      try {
        console.log("  🌐 Making API calls...");
        const [brandRes, categoryRes, modelRes, storeRes] = await Promise.all([
          brandAPI.getActive(),
          categoryAPI.getActive(),
          modelAPI.getActive(),
          storeAPI.getActive(),
        ]);

        console.log("  ✅ Brand Response:", brandRes);
        console.log("  ✅ Category Response:", categoryRes);
        console.log("  ✅ Model Response:", modelRes);
        console.log("  ✅ Store Response:", storeRes);

        const brandsData = Array.isArray(brandRes.data) ? brandRes.data : brandRes.data?.data || [];
        const categoriesData = Array.isArray(categoryRes.data) ? categoryRes.data : categoryRes.data?.data || [];
        const modelsData = Array.isArray(modelRes.data) ? modelRes.data : modelRes.data?.data || [];
        const storesData = Array.isArray(storeRes.data) ? storeRes.data : storeRes.data?.data || [];

        console.log("  📦 Processed Brands:", brandsData.length, "items");
        console.log("     First brand:", brandsData[0]);
        console.log("  📦 Processed Categories:", categoriesData.length, "items");
        console.log("  📦 Processed Models:", modelsData.length, "items");
        console.log("  📦 Processed Stores:", storesData.length, "items");

        setBrands(brandsData);
        setCategories(categoriesData);
        setModels(modelsData);
        setStores(storesData);

        console.log("  ✅ State updated successfully");
      } catch (error) {
        console.error("  ❌ Error fetching dropdown data:", error);
        console.error("     Error stack:", error.stack);
        toast.error("Failed to load dropdown data. Please refresh the page.");
      }
    };

    fetchData();
  }, []);

  // Edit mode
  useEffect(() => {
    if (isEditMode) {
      console.log("📝 EFFECT: Edit mode detected");
      if (initialBikeData) {
        console.log("  📦 Initial bike data:", initialBikeData);

        setBikeData({
          name: initialBikeData.name || "",
          brandId: initialBikeData.brandId || "",
          categoryId: initialBikeData.categoryId || "",
          modelId: initialBikeData.modelId || "",
          registrationNumber: initialBikeData.registrationNumber || "",
          registrationYear: initialBikeData.registrationYear || "",
          chassisNumber: initialBikeData.chassisNumber || "",
          engineNumber: initialBikeData.engineNumber || "",
          storeId: initialBikeData.storeId || "",
          price: initialBikeData.price || "",
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

        const previews = {
          pucImage: initialBikeData.pucImageUrl ? `${BASE_URL}${initialBikeData.pucImageUrl}` : null,
          insuranceImage: initialBikeData.insuranceImageUrl ? `${BASE_URL}${initialBikeData.insuranceImageUrl}` : null,
          documentImage: initialBikeData.documentImageUrl ? `${BASE_URL}${initialBikeData.documentImageUrl}` : null,
          vehicleImages: initialBikeData.bikeImages
            ? initialBikeData.bikeImages.map((img) => (typeof img === "string" ? `${BASE_URL}${img}` : img))
            : [],
        };

        setPreviewImages(previews);
        setPageLoading(false);
        console.log("  ✅ Bike data loaded from initial state");
      } else {
        console.log("  🌐 Fetching bike data from API...");
        fetchBikeData();
      }
    }
  }, [isEditMode, initialBikeData]);

  const fetchBikeData = async () => {
    try {
      console.log("  📡 GET /api/bikes/" + id);
      const response = await bikeAPI.getById(id);
      const bike = response.data?.data || response.data;
      console.log("  ✅ Bike fetched:", bike);

      if (bike) {
        setBikeData({
          name: bike.name || "",
          brandId: bike.brandId || "",
          categoryId: bike.categoryId || "",
          modelId: bike.modelId || "",
          registrationNumber: bike.registrationNumber || "",
          registrationYear: bike.registrationYear || "",
          chassisNumber: bike.chassisNumber || "",
          engineNumber: bike.engineNumber || "",
          storeId: bike.storeId || "",
          price: bike.price || "",
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

        const previews = {
          pucImage: bike.pucImageUrl ? `${BASE_URL}${bike.pucImageUrl}` : null,
          insuranceImage: bike.insuranceImageUrl ? `${BASE_URL}${bike.insuranceImageUrl}` : null,
          documentImage: bike.documentImageUrl ? `${BASE_URL}${bike.documentImageUrl}` : null,
          vehicleImages: bike.bikeImages
            ? bike.bikeImages.map((img) => (typeof img === "string" ? `${BASE_URL}${img}` : img))
            : [],
        };

        setPreviewImages(previews);
        console.log("  ✅ State updated with bike data");
      }
    } catch (error) {
      console.error("  ❌ Error fetching bike:", error);
      toast.error("Failed to load bike data");
    } finally {
      setPageLoading(false);
    }
  };

  // Handle change
const handleChange = (e) => {
  const { name, value, type, checked, files } = e.target;
  
  if (type === 'checkbox') {
    setBikeData(prev => ({...prev, [name]: checked}));
  } else if (type === 'file') {
    if (name === 'vehicleImages') {
      setBikeData(prev => ({...prev, [name]: Array.from(files)}));
    } else {
      setBikeData(prev => ({...prev, [name]: files[0]}));
    }
  } else if (['brandId', 'categoryId', 'modelId', 'storeId', 'registrationYear'].includes(name)) {
    // ✅ CONVERT TO NUMBER immediately
    setBikeData(prev => ({
      ...prev,
      [name]: value && value !== '' ? Number(value) : null
    }));
  } else {
    setBikeData(prev => ({...prev, [name]: value}));
  }
};
  // Validation
  const validateForm = () => {
    console.log("\n🔍 ========================================");
    console.log("🔍 ========== VALIDATION START ==========");
    console.log("🔍 ========================================");
    
    const newErrors = {};

    console.log("📋 Current bikeData STATE:");
    console.log("  name:", bikeData.name, "(Length:", bikeData.name?.length, ")");
    console.log("  brandId:", bikeData.brandId, "(Type:", typeof bikeData.brandId, ")");
    console.log("  categoryId:", bikeData.categoryId, "(Type:", typeof bikeData.categoryId, ")");
    console.log("  modelId:", bikeData.modelId, "(Type:", typeof bikeData.modelId, ")");
    console.log("  storeId:", bikeData.storeId, "(Type:", typeof bikeData.storeId, ")");
    console.log("  registrationYear:", bikeData.registrationYear, "(Type:", typeof bikeData.registrationYear, ")");
    console.log("  price:", bikeData.price, "(Type:", typeof bikeData.price, ")");
    console.log("  registrationNumber:", bikeData.registrationNumber);
    console.log("  vehicleImages:", bikeData.vehicleImages?.length || 0, "files");

    console.log("\n📋 Dropdown data availability:");
    console.log("  Brands available:", brands.length);
    console.log("  Categories available:", categories.length);
    console.log("  Models available:", models.length);
    console.log("  Stores available:", stores.length);

    console.log("\n🔍 VALIDATION CHECKS:");

    // Name
    console.log("\n1️⃣ Validating NAME:");
    if (!bikeData.name?.trim()) {
      newErrors.name = "Bike name is required";
      console.log("  ❌ FAILED: Name is empty");
    } else {
      console.log("  ✅ PASSED: Name =", bikeData.name);
    }

    // Brand
    console.log("\n2️⃣ Validating BRAND ID:");
    console.log("  Input value:", bikeData.brandId);
    if (!isValidId(bikeData.brandId)) {
      newErrors.brandId = "Please select a brand";
      console.log("  ❌ FAILED: Brand ID invalid");
    } else {
      console.log("  ✅ PASSED: Brand ID =", bikeData.brandId);
    }

    // Category
    console.log("\n3️⃣ Validating CATEGORY ID:");
    console.log("  Input value:", bikeData.categoryId);
    if (!isValidId(bikeData.categoryId)) {
      newErrors.categoryId = "Please select a category";
      console.log("  ❌ FAILED: Category ID invalid");
    } else {
      console.log("  ✅ PASSED: Category ID =", bikeData.categoryId);
    }

    // Model
    console.log("\n4️⃣ Validating MODEL ID:");
    console.log("  Input value:", bikeData.modelId);
    if (!isValidId(bikeData.modelId)) {
      newErrors.modelId = "Please select a model";
      console.log("  ❌ FAILED: Model ID invalid");
    } else {
      console.log("  ✅ PASSED: Model ID =", bikeData.modelId);
    }

    // Store
    console.log("\n5️⃣ Validating STORE ID:");
    console.log("  Input value:", bikeData.storeId);
    if (!isValidId(bikeData.storeId)) {
      newErrors.storeId = "Please select a store";
      console.log("  ❌ FAILED: Store ID invalid");
    } else {
      console.log("  ✅ PASSED: Store ID =", bikeData.storeId);
    }

    // Registration Year
    console.log("\n6️⃣ Validating REGISTRATION YEAR:");
    console.log("  Input value:", bikeData.registrationYear);
    if (!isValidId(bikeData.registrationYear)) {
      newErrors.registrationYear = "Please select registration year";
      console.log("  ❌ FAILED: Year invalid");
    } else {
      console.log("  ✅ PASSED: Year =", bikeData.registrationYear);
    }

    // Price
    console.log("\n7️⃣ Validating PRICE:");
    console.log("  Input value:", bikeData.price);
    if (!bikeData.price || Number(bikeData.price) <= 0) {
      newErrors.price = "Price must be greater than 0";
      console.log("  ❌ FAILED: Price invalid");
    } else {
      console.log("  ✅ PASSED: Price =", bikeData.price);
    }

    // Registration Number
    console.log("\n8️⃣ Validating REGISTRATION NUMBER:");
    console.log("  Input value:", bikeData.registrationNumber);
    if (!bikeData.registrationNumber?.trim()) {
      newErrors.registrationNumber = "Registration number is required";
      console.log("  ❌ FAILED: Registration number empty");
    } else {
      console.log("  ✅ PASSED: Registration number =", bikeData.registrationNumber);
    }

    // Vehicle Images
   // Vehicle Images
console.log("\n9️⃣ Validating VEHICLE IMAGES:");
console.log("  Edit mode:", isEditMode);
console.log("  Images count:", bikeData.vehicleImages?.length || 0);

// ✅ FIXED: Changed bikeData.images to bikeData.vehicleImages
if (!isEditMode && (!bikeData.vehicleImages || bikeData.vehicleImages.length === 0)) {
  newErrors.vehicleImages = "At least one vehicle image is required";  // ✅ FIXED: Changed from 'images' to 'vehicleImages'
  console.log("  ❌ FAILED: No vehicle images");
} else {
  console.log("  ✅ PASSED");
}


    console.log("\n📊 VALIDATION SUMMARY:");
    console.log("  Total errors:", Object.keys(newErrors).length);
    if (Object.keys(newErrors).length > 0) {
      console.log("  ❌ Validation FAILED with errors:");
      Object.keys(newErrors).forEach(key => {
        console.log("    -", key, ":", newErrors[key]);
      });
    } else {
      console.log("  ✅ ALL VALIDATIONS PASSED!");
    }

    console.log("🔍 ========================================");
    console.log("🔍 ========== VALIDATION END ==========");
    console.log("🔍 ========================================\n");

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const removeVehicleImagePreview = (index) => {
    console.log("🗑️ Removing vehicle image at index:", index);
    setPreviewImages((prev) => ({
      ...prev,
      vehicleImages: prev.vehicleImages.filter((_, i) => i !== index),
    }));
    // ✅ FIXED: Changed from bikeData.images to bikeData.vehicleImages
if (bikeData.vehicleImages && Array.isArray(bikeData.vehicleImages)) {
  console.log("  📁 vehicleImages:", bikeData.vehicleImages.length, "files");
  bikeData.vehicleImages.forEach((image, index) => {
    if (image instanceof File) {
      formData.append("vehicleImages", image);  // ✅ Backend expects 'vehicleImages' or 'images'
      console.log(`    - File ${index + 1}:`, image.name);
    }
  });
}

  };

  const removeSingleImagePreview = (fieldName) => {
    console.log("🗑️ Removing single image:", fieldName);
    setPreviewImages((prev) => ({ ...prev, [fieldName]: null }));
    setBikeData((prev) => ({ ...prev, [fieldName]: null }));
  };

  // Submit

// ✅ CORRECT - handleSubmit (fixed FormData building)
const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (isLoading) return;
  
  // Validate
  if (!validateForm()) {
    toast.error('Please fill all required fields correctly');
    return;
  }
  
  setIsLoading(true);
  
  try {
    const formData = new FormData();
    
    // ✅ DO NOT use .toString() - Append numbers directly
    formData.append('name', bikeData.name?.trim());
    formData.append('brandId', bikeData.brandId);  // ← NO .toString()
    formData.append('categoryId', bikeData.categoryId);  // ← NO .toString()
    formData.append('modelId', bikeData.modelId);  // ← NO .toString()
    formData.append('storeId', bikeData.storeId);  // ← NO .toString()
    formData.append('registrationYear', bikeData.registrationYear);  // ← NO .toString()
    formData.append('price', bikeData.price);  // ← NO .toString()
    formData.append('registrationNumber', bikeData.registrationNumber?.trim());
    formData.append('chassisNumber', bikeData.chassisNumber?.trim());
    formData.append('engineNumber', bikeData.engineNumber?.trim());
    formData.append('latitude', bikeData.latitude?.trim());
    formData.append('longitude', bikeData.longitude?.trim());
    
    // ✅ Booleans as strings
    formData.append('isPuc', String(bikeData.isPuc));
    formData.append('isInsurance', String(bikeData.isInsurance));
    formData.append('isDocuments', String(bikeData.isDocuments));
    
    // ✅ Files
    if (bikeData.pucImage instanceof File) {
      formData.append('pucImage', bikeData.pucImage);
    }
    if (bikeData.insuranceImage instanceof File) {
      formData.append('insuranceImage', bikeData.insuranceImage);
    }
    if (bikeData.documentImage instanceof File) {
      formData.append('documentImage', bikeData.documentImage);
    }
    
    // ✅ Vehicle images with correct field name
    if (Array.isArray(bikeData.vehicleImages) && bikeData.vehicleImages.length > 0) {
      bikeData.vehicleImages.forEach((file) => {
        if (file instanceof File) {
          formData.append('images', file);  // ← Use 'images' not 'vehicleImages'
        }
      });
    }
    
    // ✅ DEBUG LOG
    console.log('🚀 Final FormData entries:');
    for (let [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`  ${key}: File - ${value.name}`);
      } else {
        console.log(`  ${key}: ${value} (${typeof value})`);
      }
    }
    
    // Send request
    let response;
    if (isEditMode) {
      response = await bikeAPI.update(id, formData);
      toast.success('✅ Bike updated successfully!');
    } else {
      response = await bikeAPI.create(formData);
      toast.success('✅ Bike added successfully!');
    }
    
    // Reset and navigate
    setBikeData({
      name: '',
      brandId: null,
      categoryId: null,
      modelId: null,
      registrationNumber: '',
      registrationYear: new Date().getFullYear(),
      chassisNumber: '',
      engineNumber: '',
      storeId: null,
      price: '',
      latitude: '',
      longitude: '',
      isPuc: false,
      isInsurance: false,
      isDocuments: false,
      pucImage: null,
      insuranceImage: null,
      documentImage: null,
      vehicleImages: null,
    });
    
    setTimeout(() => {
      navigate('/dashboard/allBikes');
    }, 1000);
    
  } catch (error) {
    console.error('Error:', error.response?.data);
    toast.error(error.response?.data?.message || 'Failed to submit form');
  } finally {
    setIsLoading(false);
  }
};


  if (pageLoading) {
    return (
      <div className="bg-gray-100 min-h-screen p-6 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-[#2B2B80] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 font-medium">Loading bike data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen p-6">
      <div className="bg-white rounded-lg shadow-md p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {isEditMode && (
              <button
                onClick={() => navigate("/dashboard/allBikes")}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
                title="Go back"
              >
                <FaArrowLeft className="text-[#2B2B80] text-xl" />
              </button>
            )}
            <h2 className="text-2xl font-bold text-[#2B2B80]">
              {isEditMode ? `✏️ Edit Bike (ID: ${id})` : "🏍️ Add New Bike"}
            </h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bike Name */}
          <div>
            <label className="block text-gray-700 mb-1">
              Bike Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={bikeData.name}
              onChange={handleChange}
              placeholder="Enter bike name"
              className={`w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-[#2B2B80] ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
              disabled={isLoading}
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Brand */}
          <div>
            <label className="block text-gray-700 mb-1">
              Brand Name <span className="text-red-500">*</span>
            </label>
            <select
              name="brandId"
              value={bikeData.brandId}
              onChange={handleChange}
              className={`w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-[#2B2B80] ${
                errors.brandId ? "border-red-500" : "border-gray-300"
              }`}
              disabled={isLoading}
            >
              <option value="">-- Select Brand --</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.brandName || brand.name}
                </option>
              ))}
            </select>
            {errors.brandId && <p className="text-red-500 text-sm mt-1">{errors.brandId}</p>}
            <p className="text-xs text-blue-600 mt-1 font-mono">
              Selected ID: {bikeData.brandId || "(none)"} | Type: {typeof bikeData.brandId}
            </p>
          </div>

          {/* Category */}
          <div>
            <label className="block text-gray-700 mb-1">
              Category Name <span className="text-red-500">*</span>
            </label>
            <select
              name="categoryId"
              value={bikeData.categoryId}
              onChange={handleChange}
              className={`w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-[#2B2B80] ${
                errors.categoryId ? "border-red-500" : "border-gray-300"
              }`}
              disabled={isLoading}
            >
              <option value="">-- Select Category --</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.categoryName || cat.name}
                </option>
              ))}
            </select>
            {errors.categoryId && <p className="text-red-500 text-sm mt-1">{errors.categoryId}</p>}
            <p className="text-xs text-blue-600 mt-1 font-mono">
              Selected ID: {bikeData.categoryId || "(none)"} | Type: {typeof bikeData.categoryId}
            </p>
          </div>

          {/* Model */}
          <div>
            <label className="block text-gray-700 mb-1">
              Model Name <span className="text-red-500">*</span>
            </label>
            <select
              name="modelId"
              value={bikeData.modelId}
              onChange={handleChange}
              className={`w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-[#2B2B80] ${
                errors.modelId ? "border-red-500" : "border-gray-300"
              }`}
              disabled={isLoading}
            >
              <option value="">-- Select Model --</option>
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.modelName || model.name}
                </option>
              ))}
            </select>
            {errors.modelId && <p className="text-red-500 text-sm mt-1">{errors.modelId}</p>}
            <p className="text-xs text-blue-600 mt-1 font-mono">
              Selected ID: {bikeData.modelId || "(none)"} | Type: {typeof bikeData.modelId}
            </p>
          </div>

          {/* Registration Number */}
          <div>
            <label className="block text-gray-700 mb-1">
              Vehicle Registration Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="registrationNumber"
              value={bikeData.registrationNumber}
              onChange={handleChange}
              placeholder="Enter Vehicle Registration Number"
              className={`w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-[#2B2B80] ${
                errors.registrationNumber ? "border-red-500" : "border-gray-300"
              }`}
              disabled={isLoading}
            />
            {errors.registrationNumber && (
              <p className="text-red-500 text-sm mt-1">{errors.registrationNumber}</p>
            )}
          </div>

          {/* Registration Year */}
          <div>
            <label className="block text-gray-700 mb-1">
              Registration Year <span className="text-red-500">*</span>
            </label>
            <select
              name="registrationYear"
              value={bikeData.registrationYear}
              onChange={handleChange}
              className={`w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-[#2B2B80] ${
                errors.registrationYear ? "border-red-500" : "border-gray-300"
              }`}
              disabled={isLoading}
            >
              <option value="">-- Select Registration Year --</option>
              {[2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018].map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            {errors.registrationYear && (
              <p className="text-red-500 text-sm mt-1">{errors.registrationYear}</p>
            )}
            <p className="text-xs text-blue-600 mt-1 font-mono">
              Selected: {bikeData.registrationYear || "(none)"} | Type: {typeof bikeData.registrationYear}
            </p>
          </div>

          {/* Price */}
          <div>
            <label className="block text-gray-700 mb-1">
              Price (₹) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="price"
              value={bikeData.price}
              onChange={handleChange}
              placeholder="Enter price"
              min="0"
              step="0.01"
              className={`w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-[#2B2B80] ${
                errors.price ? "border-red-500" : "border-gray-300"
              }`}
              disabled={isLoading}
            />
            {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
          </div>

          {/* Chassis Number */}
          <div>
            <label className="block text-gray-700 mb-1">Vehicle Chassis Number</label>
            <input
              type="text"
              name="chassisNumber"
              value={bikeData.chassisNumber}
              onChange={handleChange}
              placeholder="Enter Vehicle Chassis Number"
              className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-[#2B2B80]"
              disabled={isLoading}
            />
          </div>

          {/* Engine Number */}
          <div>
            <label className="block text-gray-700 mb-1">Vehicle Engine Number</label>
            <input
              type="text"
              name="engineNumber"
              value={bikeData.engineNumber}
              onChange={handleChange}
              placeholder="Enter Vehicle Engine Number"
              className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-[#2B2B80]"
              disabled={isLoading}
            />
          </div>

          {/* Store */}
          <div>
            <label className="block text-gray-700 mb-1">
              Store Name <span className="text-red-500">*</span>
            </label>
            <select
              name="storeId"
              value={bikeData.storeId}
              onChange={handleChange}
              className={`w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-[#2B2B80] ${
                errors.storeId ? "border-red-500" : "border-gray-300"
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
            {errors.storeId && <p className="text-red-500 text-sm mt-1">{errors.storeId}</p>}
            <p className="text-xs text-blue-600 mt-1 font-mono">
              Selected ID: {bikeData.storeId || "(none)"} | Type: {typeof bikeData.storeId}
            </p>
          </div>

          {/* Latitude */}
          <div>
            <label className="block text-gray-700 mb-1">Latitude (Optional)</label>
            <input
              type="text"
              name="latitude"
              value={bikeData.latitude}
              onChange={handleChange}
              placeholder="Enter latitude"
              className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-[#2B2B80]"
              disabled={isLoading}
            />
          </div>

          {/* Longitude */}
          <div>
            <label className="block text-gray-700 mb-1">Longitude (Optional)</label>
            <input
              type="text"
              name="longitude"
              value={bikeData.longitude}
              onChange={handleChange}
              placeholder="Enter longitude"
              className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-[#2B2B80]"
              disabled={isLoading}
            />
          </div>
        </form>

        <hr className="my-6" />

        {/* PUC / Insurance / Documents sections - keep same as before */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* PUC */}
          <div>
            <label className="flex items-center space-x-2 cursor-pointer mb-2">
              <input
                type="checkbox"
                name="isPuc"
                checked={bikeData.isPuc}
                onChange={handleChange}
                disabled={isLoading}
              />
              <span className="font-medium">PUC Available</span>
            </label>
            <input
              type="file"
              name="pucImage"
              onChange={handleChange}
              className="mt-2 w-full"
              disabled={isLoading}
              accept="image/*"
            />
            {previewImages.pucImage && (
              <div className="mt-3 relative inline-block">
                <img
                  src={previewImages.pucImage}
                  alt="PUC Preview"
                  className="h-20 w-24 rounded-lg object-cover ring-2 ring-[#2B2B80]"
                />
                <button
                  type="button"
                  onClick={() => removeSingleImagePreview("pucImage")}
                  className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full hover:bg-red-700 transition"
                  disabled={isLoading}
                >
                  <FaTrash size={10} />
                </button>
              </div>
            )}
          </div>

          {/* Insurance */}
          <div>
            <label className="flex items-center space-x-2 cursor-pointer mb-2">
              <input
                type="checkbox"
                name="isInsurance"
                checked={bikeData.isInsurance}
                onChange={handleChange}
                disabled={isLoading}
              />
              <span className="font-medium">Insurance Available</span>
            </label>
            <input
              type="file"
              name="insuranceImage"
              onChange={handleChange}
              className="mt-2 w-full"
              disabled={isLoading}
              accept="image/*"
            />
            {previewImages.insuranceImage && (
              <div className="mt-3 relative inline-block">
                <img
                  src={previewImages.insuranceImage}
                  alt="Insurance Preview"
                  className="h-20 w-24 rounded-lg object-cover ring-2 ring-[#2B2B80]"
                />
                <button
                  type="button"
                  onClick={() => removeSingleImagePreview("insuranceImage")}
                  className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full hover:bg-red-700 transition"
                  disabled={isLoading}
                >
                  <FaTrash size={10} />
                </button>
              </div>
            )}
          </div>

          {/* Documents */}
          <div>
            <label className="flex items-center space-x-2 cursor-pointer mb-2">
              <input
                type="checkbox"
                name="isDocuments"
                checked={bikeData.isDocuments}
                onChange={handleChange}
                disabled={isLoading}
              />
              <span className="font-medium">Documents Available</span>
            </label>
            <input
              type="file"
              name="documentImage"
              onChange={handleChange}
              className="mt-2 w-full"
              disabled={isLoading}
              accept="image/*"
            />
            {previewImages.documentImage && (
              <div className="mt-3 relative inline-block">
                <img
                  src={previewImages.documentImage}
                  alt="Document Preview"
                  className="h-20 w-24 rounded-lg object-cover ring-2 ring-[#2B2B80]"
                />
                <button
                  type="button"
                  onClick={() => removeSingleImagePreview("documentImage")}
                  className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full hover:bg-red-700 transition"
                  disabled={isLoading}
                >
                  <FaTrash size={10} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Vehicle Images */}
        <div className="mt-6">
            <label className="block text-gray-700 font-medium">
    Upload Vehicle Images {!isEditMode && <span className="text-red-500">*</span>}
  </label>
  <input
    type="file"
    name="vehicleImages"
    onChange={handleChange}
    multiple
    className={`mt-2 w-full border-2 border-dashed rounded p-4 ${
      errors.vehicleImages ? "border-red-500" : "border-gray-300"  // ✅ FIXED: Changed from 'errors.images'
    }`}
    disabled={isLoading}
    accept="image/*"
  />
  {errors.vehicleImages && (  // ✅ FIXED: Changed from 'errors.images'
    <p className="text-red-500 text-sm mt-1">{errors.vehicleImages}</p>
  )}          {previewImages.vehicleImages && previewImages.vehicleImages.length > 0 &&  (
            <div className="mt-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">
                Vehicle Images ({previewImages.vehicleImages.length})
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {previewImages.vehicleImages.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image}
                      alt={`Vehicle ${index + 1}`}
                      className="h-24 w-full rounded-lg object-cover ring-2 ring-[#2B2B80]"
                    />
                    <button
                      type="button"
                      onClick={() => removeVehicleImagePreview(index)}
                      className="absolute top-1 right-1 bg-red-600 text-white p-1.5 rounded-full hover:bg-red-700 transition"
                      disabled={isLoading}
                    >
                      <FaTrash size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="mt-6 flex justify-end gap-4">
          <button
            type="button"
            onClick={() => {
              console.log("❌ Cancel button clicked");
              navigate("/dashboard/allBikes");
            }}
            className="bg-gray-400 text-white px-6 py-2 rounded-lg hover:bg-gray-500 transition flex items-center gap-2 disabled:opacity-50 font-semibold"
            disabled={isLoading}
          >
            <FaTimes size={18} />
            Cancel
          </button>

          <button
            type="button"
            onClick={(e) => {
              console.log("🖱️ Submit button clicked");
              handleSubmit(e);
            }}
            disabled={isLoading}
            className="bg-[#2B2B80] text-white px-6 py-2 rounded-lg hover:bg-[#1f1f60] transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {isLoading ? (
              <>
                <FaSpinner className="animate-spin" size={18} />
                {isEditMode ? "Updating..." : "Saving..."}
              </>
            ) : (
              <>
                <FaCheck size={18} />
                {isEditMode ? "Update Bike" : "Save Bike"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddBikeForm;
