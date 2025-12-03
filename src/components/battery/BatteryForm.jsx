import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaSave, FaTimes, FaBatteryFull, FaBuilding, FaMapMarkerAlt, FaStore, FaUpload, FaInfoCircle } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Hooks
import useBatteryForm from "./hooks/useBatteryForm";
import useDropdownData from "./hooks/useDropdownData";

// Utils
import { BATTERY_STATUS_OPTIONS } from "./utils/batteryConstants";
import { batteryAPI } from "./api/batteryAPI";
import { getStatusBadge } from "./utils/batteryHelpers";

const BatteryForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    batteryId: "",
    company: "",
    cityId: "",
    storeId: "",
    batteryStatusCode: 3, // Default to OPEN
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [existingImage, setExistingImage] = useState(null);
  const [loadingData, setLoadingData] = useState(false);

  // Hooks
  const { loading, errors, setErrors, handleSubmit } = useBatteryForm(isEditMode, id);
  const { cities, stores, loadingStores, fetchStoresByCity, setStores } = useDropdownData();

  // Fetch battery data for edit mode
  useEffect(() => {
    if (isEditMode) {
      fetchBatteryData();
    }
  }, [isEditMode, id]);

  // Fetch stores when city changes
  useEffect(() => {
    if (formData.cityId) {
      fetchStoresByCity(formData.cityId);
    } else {
      setStores([]);
    }
  }, [formData.cityId]);

  const fetchBatteryData = async () => {
    setLoadingData(true);
    try {
      console.log("Fetching battery data for ID:", id);
      const data = await batteryAPI.getById(id);
      console.log("Battery data loaded:", data);

      setFormData({
        batteryId: data.batteryId || "",
        company: data.company || "",
        cityId: data.cityId?.toString() || "",
        storeId: data.storeId?.toString() || "",
        batteryStatusCode: data.batteryStatusCode ?? 3,
      });

      if (data.image) {
        console.log("Existing image found:", data.image);
        setExistingImage(data.image);
      }

      toast.success("Battery data loaded successfully");
    } catch (err) {
      console.error("Error fetching battery:", err);
      toast.error("Failed to load battery data");
      navigate("/dashboard/allBattery");
    } finally {
      setLoadingData(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "cityId") {
      setFormData((prev) => ({ ...prev, cityId: value, storeId: "" }));
    } else if (name === "batteryStatusCode") {
      setFormData((prev) => ({ ...prev, batteryStatusCode: parseInt(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      // console.log("New image selected:", file.name);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    const input = document.getElementById("imageInput");
    if (input) input.value = "";
    console.log("Image removed");
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const success = await handleSubmit(formData, imageFile);
    if (success) {
      // Navigation handled in hook
    }
  };

  const handleCancel = () => {
    navigate("/dashboard/allBattery");
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Loading battery data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-4 px-4">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FaBatteryFull className="text-3xl text-indigo-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                  {isEditMode ? "Edit Battery" : "Add New Battery"}
                </h1>
                <p className="text-gray-500 text-sm">
                  {isEditMode ? `Update battery information` : "Fill in the details to add a new battery"}
                </p>
              </div>
            </div>
            <button onClick={handleCancel} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" title="Close">
              <FaTimes className="text-xl" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit}>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Battery ID */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Battery ID <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaBatteryFull className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="batteryId"
                    value={formData.batteryId}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                      errors.batteryId ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Enter battery ID (e.g., BAT-001)"
                  />
                </div>
                {errors.batteryId && <p className="text-red-500 text-xs mt-1">{errors.batteryId}</p>}
                {isEditMode && <p className="text-blue-600 text-xs mt-1">✓ Battery ID can be changed. Make sure it's unique!</p>}
              </div>

              {/* Company */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Company <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaBuilding className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                      errors.company ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Enter company name"
                  />
                </div>
                {errors.company && <p className="text-red-500 text-xs mt-1">{errors.company}</p>}
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  City <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaMapMarkerAlt className="text-gray-400" />
                  </div>
                  <select
                    name="cityId"
                    value={formData.cityId}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none ${
                      errors.cityId ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <option value="">Select City</option>
                    {cities.map((city) => (
                      <option key={city.id} value={city.id}>
                        {city.name || city.cityName}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.cityId && <p className="text-red-500 text-xs mt-1">{errors.cityId}</p>}
              </div>

              {/* Store */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Store <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaStore className="text-gray-400" />
                  </div>
                  <select
                    name="storeId"
                    value={formData.storeId}
                    onChange={handleInputChange}
                    disabled={!formData.cityId || loadingStores}
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none ${
                      errors.storeId ? "border-red-500" : "border-gray-300"
                    } ${!formData.cityId || loadingStores ? "bg-gray-100 cursor-not-allowed" : ""}`}
                  >
                    <option value="">{loadingStores ? "Loading stores..." : "Select Store"}</option>
                    {stores.map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.storeName || store.name}
                      </option>
                    ))}
                  </select>
                  {loadingStores && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <div className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                {errors.storeId && <p className="text-red-500 text-xs mt-1">{errors.storeId}</p>}
                {!formData.cityId && <p className="text-gray-500 text-xs mt-1">Please select a city first</p>}
              </div>

              {/* Battery Status */}
              {/* Battery Status */}
<div className="md:col-span-2">
  <label className="block text-sm font-semibold text-gray-700 mb-2">
    Battery Status <span className="text-red-500">*</span>
  </label>
  <div className="relative">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <FaInfoCircle className="text-gray-400" />
    </div>
    <select
      name="batteryStatusCode"
      value={formData.batteryStatusCode}
      onChange={handleInputChange}
      disabled={formData.batteryStatusCode === 1}  // 🔒 lock when IN BIKE
      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none ${
        formData.batteryStatusCode === 1
          ? "bg-gray-100 cursor-not-allowed"
          : "border-gray-300"
      }`}
    >
      {BATTERY_STATUS_OPTIONS.map((status) => (
        <option key={status.code} value={status.code}>
          {status.label} 
        </option>
      ))}
    </select>
  </div>

  {/* Status Preview */}
  <div className="mt-2 flex items-start space-x-2">
    <div
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
        getStatusBadge(formData.batteryStatusCode).bgColor
      } ${getStatusBadge(formData.batteryStatusCode).textColor}`}
    >
      <FaBatteryFull className="mr-1" />
      {getStatusBadge(formData.batteryStatusCode).label}
    </div>
    <div className="flex-1">
      <p className="text-xs text-gray-600 mt-1">
        {
          BATTERY_STATUS_OPTIONS.find(
            (s) => s.code === formData.batteryStatusCode
          )?.description
        }
      </p>
      {formData.batteryStatusCode === 1 && (
        <p className="text-xs text-orange-600 mt-1">
          This battery is <strong>IN BIKE</strong>. if you want to change the status go to the ALLBIKE page.
        </p>
      )}
    </div>
  </div>
</div>


              {/* Image Upload */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Battery Image {!isEditMode && <span className="text-gray-500 text-xs">(Optional)</span>}
                </label>

                <div className="mt-2">
                  <input id="imageInput" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />

                  {imagePreview || existingImage ? (
                    <div className="space-y-2">
                      <div className="relative inline-block">
                        <img
                          src={imagePreview || existingImage}
                          alt="Battery preview"
                          className="w-64 h-64 object-cover rounded-lg border-2 border-gray-300 shadow-lg"
                          onError={(e) => {
                            console.error("Image failed to load:", e.target.src);
                            e.target.src = "https://via.placeholder.com/256?text=No+Image";
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors shadow-lg"
                          title="Remove image"
                        >
                          <FaTimes />
                        </button>
                      </div>

                      

                      {existingImage && !imagePreview && (
                        <div className="bg-blue-50 border border-blue-200 rounded px-3 py-2 inline-block">
                          <p className="text-xs text-blue-700">✓ Current battery image</p>
                        </div>
                      )}

                      <label
                        htmlFor="imageInput"
                        className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg cursor-pointer transition-colors text-sm"
                      >
                        <FaUpload className="mr-2" />
                        {imagePreview ? "Change Image" : "Upload New Image"}
                      </label>
                    </div>
                  ) : (
                    <label
                      htmlFor="imageInput"
                      className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <FaUpload className="w-12 h-12 mb-3 text-gray-400" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG, JPEG (MAX. 5MB)</p>
                        {isEditMode && <p className="text-xs text-yellow-600 mt-2">⚠ No existing image found</p>}
                      </div>
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t">
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="px-6 py-2.5 border-2 border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-6 py-2.5 rounded-lg text-white font-semibold transition-all flex items-center ${
                  loading ? "bg-gray-400 cursor-not-allowed" : "bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-lg hover:shadow-xl"
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    {isEditMode ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>
                    <FaSave className="mr-2" />
                    {isEditMode ? "Update Battery" : "Create Battery"}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

       
      </div>
    </div>
  );
};

export default BatteryForm;
    