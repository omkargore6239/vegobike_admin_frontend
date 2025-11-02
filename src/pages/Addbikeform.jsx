import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom"; // ✅ Added useParams, useLocation
import { brandAPI, categoryAPI, modelAPI, storeAPI, bikeAPI, BASE_URL } from "../api/apiConfig";
import { toast } from "react-toastify";
import { FaSpinner, FaCheck, FaTimes, FaArrowLeft, FaTrash } from "react-icons/fa"; // ✅ Added FaArrowLeft, FaTrash

const AddBikeForm = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // ✅ Get bike ID from URL
  const location = useLocation(); // ✅ Get bike data from navigation state
  
  // ✅ Check if editing or adding
  const isEditMode = !!id;
  const initialBikeData = location.state?.bike;

  const [bikeData, setBikeData] = useState({
    brandId: "",
    categoryId: "",
    modelId: "",
    registrationNumber: "",
    registrationYear: "",
    chassisNumber: "",
    engineNumber: "",
    storeId: "",
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

  // ✅ NEW: Loading and submission states
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const [pageLoading, setPageLoading] = useState(isEditMode); // ✅ Loading state for edit mode

  // ✅ Preview images
  const [previewImages, setPreviewImages] = useState({
    pucImage: null,
    insuranceImage: null,
    documentImage: null,
    vehicleImages: [],
  });

  // ✅ Fetch dynamic data from database
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [brandRes, categoryRes, modelRes, storeRes] = await Promise.all([
          brandAPI.getAll(),
          categoryAPI.getAll(),
          modelAPI.getAll(),
          storeAPI.getAll(),
        ]);

        console.log("✅ Brand API Response:", brandRes.data);

        // Handle array or wrapped response
        setBrands(
          Array.isArray(brandRes.data)
            ? brandRes.data
            : brandRes.data.content ||
                brandRes.data.data ||
                brandRes.data.brands ||
                []
        );

        setCategories(
          Array.isArray(categoryRes.data)
            ? categoryRes.data
            : categoryRes.data.content ||
                categoryRes.data.data ||
                categoryRes.data.categories ||
                []
        );

        setModels(
          Array.isArray(modelRes.data)
            ? modelRes.data
            : modelRes.data.content ||
                modelRes.data.data ||
                modelRes.data.models ||
                []
        );

        setStores(
          Array.isArray(storeRes.data)
            ? storeRes.data
            : storeRes.data.content ||
                storeRes.data.data ||
                storeRes.data.stores ||
                []
        );
      } catch (error) {
        console.error("❌ Error fetching dropdown data:", error);
        toast.error("Failed to load dropdown data. Please refresh the page.");
      }
    };

    fetchData();
  }, []);

  // ✅ Populate form with bike data when editing
  useEffect(() => {
    if (isEditMode) {
      if (initialBikeData) {
        console.log("📝 Loading bike data:", initialBikeData);

        setBikeData({
          brandId: initialBikeData.brandId || "",
          categoryId: initialBikeData.categoryId || "",
          modelId: initialBikeData.modelId || "",
          registrationNumber: initialBikeData.registrationNumber || "",
          registrationYear: initialBikeData.registrationYear || "",
          chassisNumber: initialBikeData.chassisNumber || "",
          engineNumber: initialBikeData.engineNumber || "",
          storeId: initialBikeData.storeId || "",
          isPuc: initialBikeData.isPuc || false,
          isInsurance: initialBikeData.isInsurance || false,
          isDocuments: initialBikeData.isDocuments || false,
          pucImage: null,
          insuranceImage: null,
          documentImage: null,
          vehicleImages: null,
        });

        // ✅ Set preview images from existing data
        const previews = {
          pucImage: initialBikeData.pucImageUrl
            ? `${BASE_URL}${initialBikeData.pucImageUrl}`
            : null,
          insuranceImage: initialBikeData.insuranceImageUrl
            ? `${BASE_URL}${initialBikeData.insuranceImageUrl}`
            : null,
          documentImage: initialBikeData.documentImageUrl
            ? `${BASE_URL}${initialBikeData.documentImageUrl}`
            : null,
          vehicleImages: initialBikeData.bikeImages
            ? initialBikeData.bikeImages.map((img) =>
                typeof img === "string" ? `${BASE_URL}${img}` : img
              )
            : [],
        };

        setPreviewImages(previews);
        setPageLoading(false);
      } else {
        // ✅ Fetch bike data by ID if not passed via state
        fetchBikeData();
      }
    }
  }, [isEditMode, initialBikeData]);

  // ✅ Fetch bike data by ID if not passed via state
  const fetchBikeData = async () => {
    try {
      const response = await bikeAPI.getById(id);
      const bike = response.data?.data || response.data;

      if (bike) {
        setBikeData({
          brandId: bike.brandId || "",
          categoryId: bike.categoryId || "",
          modelId: bike.modelId || "",
          registrationNumber: bike.registrationNumber || "",
          registrationYear: bike.registrationYear || "",
          chassisNumber: bike.chassisNumber || "",
          engineNumber: bike.engineNumber || "",
          storeId: bike.storeId || "",
          isPuc: bike.isPuc || false,
          isInsurance: bike.isInsurance || false,
          isDocuments: bike.isDocuments || false,
          pucImage: null,
          insuranceImage: null,
          documentImage: null,
          vehicleImages: null,
        });

        const previews = {
          pucImage: bike.pucImageUrl
            ? `${BASE_URL}${bike.pucImageUrl}`
            : null,
          insuranceImage: bike.insuranceImageUrl
            ? `${BASE_URL}${bike.insuranceImageUrl}`
            : null,
          documentImage: bike.documentImageUrl
            ? `${BASE_URL}${bike.documentImageUrl}`
            : null,
          vehicleImages: bike.bikeImages
            ? bike.bikeImages.map((img) =>
                typeof img === "string" ? `${BASE_URL}${img}` : img
              )
            : [],
        };

        setPreviewImages(previews);
      }
    } catch (error) {
      console.error("❌ Error fetching bike:", error);
      toast.error("Failed to load bike data");
    } finally {
      setPageLoading(false);
    }
  };

  // ✅ Handle input & file changes
  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === "checkbox") {
      setBikeData({ ...bikeData, [name]: checked });
    } else if (type === "file") {
      if (name === "vehicleImages") {
        const newImages = Array.from(files);
        setBikeData({ ...bikeData, [name]: newImages });

        // ✅ Preview vehicle images
        const previews = newImages.map((file) => URL.createObjectURL(file));
        setPreviewImages((prev) => ({
          ...prev,
          vehicleImages: previews,
        }));
      } else {
        setBikeData({ ...bikeData, [name]: files[0] });

        // ✅ Preview single image
        if (files[0]) {
          const preview = URL.createObjectURL(files[0]);
          setPreviewImages((prev) => ({
            ...prev,
            [name]: preview,
          }));
        }
      }
    } else {
      setBikeData({ ...bikeData, [name]: value });
    }
    // Clear errors for this field when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  // ✅ Validate form before submission
  const validateForm = () => {
    const newErrors = {};

    if (!bikeData.brandId) newErrors.brandId = "Brand is required";
    if (!bikeData.categoryId) newErrors.categoryId = "Category is required";
    if (!bikeData.modelId) newErrors.modelId = "Model is required";
    if (!bikeData.registrationNumber)
      newErrors.registrationNumber = "Registration number is required";
    if (!bikeData.registrationYear)
      newErrors.registrationYear = "Registration year is required";
    if (!bikeData.storeId) newErrors.storeId = "Store is required";
    // ✅ Vehicle images required only for new bikes
    if (!isEditMode && (!bikeData.vehicleImages || bikeData.vehicleImages.length === 0))
      newErrors.vehicleImages = "At least one vehicle image is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ Remove vehicle image preview
  const removeVehicleImagePreview = (index) => {
    setPreviewImages((prev) => ({
      ...prev,
      vehicleImages: prev.vehicleImages.filter((_, i) => i !== index),
    }));

    // Also remove from bikeData if it's a new file
    if (bikeData.vehicleImages) {
      setBikeData((prev) => ({
        ...prev,
        vehicleImages: prev.vehicleImages.filter((_, i) => i !== index),
      }));
    }
  };

  // ✅ Remove single image preview
  const removeSingleImagePreview = (fieldName) => {
    setPreviewImages((prev) => ({
      ...prev,
      [fieldName]: null,
    }));
    setBikeData((prev) => ({
      ...prev,
      [fieldName]: null,
    }));
  };

  // ✅ Submit bike data to backend (Add or Edit)
  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ Prevent double submission
    if (isLoading || isSubmitted) {
      console.warn("⚠️ Form already submitted or loading");
      return;
    }

    // ✅ Validate form
    if (!validateForm()) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsLoading(true);
    setIsSubmitted(true); // ✅ Set flag immediately to prevent double clicks

    try {
      console.log("🚀 Submitting Bike Data:", bikeData);

      // ✅ Create FormData for multipart submission
      const formData = new FormData();

      // Add all text fields
      formData.append("brandId", bikeData.brandId);
      formData.append("categoryId", bikeData.categoryId);
      formData.append("modelId", bikeData.modelId);
      formData.append("registrationNumber", bikeData.registrationNumber);
      formData.append("registrationYear", bikeData.registrationYear);
      formData.append("chassisNumber", bikeData.chassisNumber);
      formData.append("engineNumber", bikeData.engineNumber);
      formData.append("storeId", bikeData.storeId);

      // Add checkboxes
      formData.append("isPuc", bikeData.isPuc);
      formData.append("isInsurance", bikeData.isInsurance);
      formData.append("isDocuments", bikeData.isDocuments);

      // Add files only if new ones are selected
      if (bikeData.pucImage) {
        formData.append("pucImage", bikeData.pucImage);
      }

      if (bikeData.insuranceImage) {
        formData.append("insuranceImage", bikeData.insuranceImage);
      }

      if (bikeData.documentImage) {
        formData.append("documentImage", bikeData.documentImage);
      }

      if (bikeData.vehicleImages && bikeData.vehicleImages.length > 0) {
        bikeData.vehicleImages.forEach((image) => {
          // Only append if it's a File object (new upload)
          if (image instanceof File) {
            formData.append("vehicleImages", image);
          }
        });
      }

      let response;

      if (isEditMode) {
        // ✅ UPDATE existing bike
        response = await bikeAPI.update(id, formData);
        console.log("✅ Bike updated:", response.data);
        toast.success("✅ Bike updated successfully!");
      } else {
        // ✅ CREATE new bike
        response = await bikeAPI.create(formData);
        console.log("✅ Bike added successfully:", response.data);
        toast.success("✅ Bike added successfully! Redirecting...");

        // ✅ Reset form for new bikes only
        setBikeData({
          brandId: "",
          categoryId: "",
          modelId: "",
          registrationNumber: "",
          registrationYear: "",
          chassisNumber: "",
          engineNumber: "",
          storeId: "",
          isPuc: false,
          isInsurance: false,
          isDocuments: false,
          pucImage: null,
          insuranceImage: null,
          documentImage: null,
          vehicleImages: null,
        });

        setPreviewImages({
          pucImage: null,
          insuranceImage: null,
          documentImage: null,
          vehicleImages: [],
        });

        // ✅ Redirect to all bikes page after 1.5 seconds
        setTimeout(() => {
          navigate("/dashboard/allBikes");
        }, 1500);
      }

      // ✅ Reset submitted state after 2 seconds (for edit mode)
      setTimeout(() => {
        setIsSubmitted(false);
      }, 2000);
    } catch (error) {
      console.error("❌ Error:", error);
      setIsSubmitted(false); // ✅ Allow retry on error
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        `Error ${isEditMode ? "updating" : "adding"} bike. Check console for details.`;
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Loading page for edit mode
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
        {/* Header with back button for edit mode */}
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

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              required
              disabled={isLoading}
            >
              <option value="">Select Brand</option>
              {Array.isArray(brands) &&
                brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.brandName || brand.name}
                  </option>
                ))}
            </select>
            {errors.brandId && (
              <p className="text-red-500 text-sm mt-1">{errors.brandId}</p>
            )}
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
              required
              disabled={isLoading}
            >
              <option value="">Select Category</option>
              {Array.isArray(categories) &&
                categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.categoryName || cat.name}
                  </option>
                ))}
            </select>
            {errors.categoryId && (
              <p className="text-red-500 text-sm mt-1">{errors.categoryId}</p>
            )}
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
              required
              disabled={isLoading}
            >
              <option value="">Select Model</option>
              {Array.isArray(models) &&
                models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.modelName || model.name}
                  </option>
                ))}
            </select>
            {errors.modelId && (
              <p className="text-red-500 text-sm mt-1">{errors.modelId}</p>
            )}
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
              required
              disabled={isLoading}
            />
            {errors.registrationNumber && (
              <p className="text-red-500 text-sm mt-1">
                {errors.registrationNumber}
              </p>
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
              required
              disabled={isLoading}
            >
              <option value="">Select Registration Year</option>
              {[2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018].map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            {errors.registrationYear && (
              <p className="text-red-500 text-sm mt-1">
                {errors.registrationYear}
              </p>
            )}
          </div>

          {/* Chassis Number */}
          <div>
            <label className="block text-gray-700 mb-1">
              Vehicle Chassis Number
            </label>
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
            <label className="block text-gray-700 mb-1">
              Vehicle Engine Number
            </label>
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

          {/* Store Name */}
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
              required
              disabled={isLoading}
            >
              <option value="">Select Store</option>
              {Array.isArray(stores) &&
                stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.storeName || store.name}
                  </option>
                ))}
            </select>
            {errors.storeId && (
              <p className="text-red-500 text-sm mt-1">{errors.storeId}</p>
            )}
          </div>
        </form>

        {/* Divider */}
        <hr className="my-6" />

        {/* PUC / Insurance / Documents */}
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
              errors.vehicleImages ? "border-red-500" : "border-gray-300"
            }`}
            disabled={isLoading}
            accept="image/*"
          />
          {errors.vehicleImages && (
            <p className="text-red-500 text-sm mt-1">{errors.vehicleImages}</p>
          )}
          {previewImages.vehicleImages && previewImages.vehicleImages.length > 0 && (
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
          {bikeData.vehicleImages && bikeData.vehicleImages.length > 0 && (
            <p className="text-green-600 text-sm mt-2">
              ✅ {bikeData.vehicleImages.length} image(s) selected
            </p>
          )}
        </div>

        {/* Submit */}
        <div className="mt-6 flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate("/dashboard/allBikes")}
            className="bg-gray-400 text-white px-6 py-2 rounded-lg hover:bg-gray-500 transition flex items-center gap-2 disabled:opacity-50 font-semibold"
            disabled={isLoading}
          >
            <FaTimes size={18} />
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={isLoading || isSubmitted}
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
