// src/components/bikes/AddBikeForm.jsx

import React from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { FaArrowLeft, FaMotorcycle, FaTimes, FaCheck, FaSpinner } from "react-icons/fa";
import { toast } from "react-toastify";

// Hooks
import useBikeData from "./hooks/useBikeData";
import useBatteryData from "./hooks/useBatteryData";
import useDropdownData from "./hooks/useDropdownData";
import useBikeForm from "./hooks/useBikeForm";

// Form Sections
import BasicInformationSection from "./forms/BasicInformationSection";
import RegistrationDetailsSection from "./forms/RegistrationDetailsSection";
import AdditionalDetailsSection from "./forms/AdditionalDetailsSection";
import DocumentImagesSection from "./forms/DocumentImagesSection";
import VehicleImagesSection from "./forms/VehicleImagesSection";

const AddBikeForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const isEditMode = !!id;
  const initialBikeData = location.state?.bike;

  // Custom hooks for state management
  const {
    bikeData,
    setBikeData,
    errors,
    setErrors,
    previewImages,
    setPreviewImages,
    pageLoading,
    generalError,
    setGeneralError,
    currentBattery: currentBatteryFromBikeHook, // ✅ FIX: Get currentBattery (not currentBatteryInfo)
  } = useBikeData(isEditMode, id, initialBikeData);

  // Pass fuelType to battery hook
  const { openBatteries, currentBattery: currentBatteryFromBatteryHook, loadingBatteries } = useBatteryData(
    isEditMode,
    bikeData.electricBatteryId,
    bikeData.fuelType,
    id || initialBikeData?.id || bikeData.id
  );

  // ✅ Use the battery from bike hook (it's already fetched when bike loads)
  const currentBattery = currentBatteryFromBikeHook || currentBatteryFromBatteryHook;

  const {
    vehicleTypes,
    allCategories,
    allBrands,
    allModels,
    stores,
    filteredCategories,
    filteredBrands,
    filteredModels,
  } = useDropdownData(bikeData);

  const { handleSubmit, submitLoading } = useBikeForm(bikeData, isEditMode, id, setGeneralError, navigate);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === "checkbox") {
      setBikeData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === "file") {
      if (name === "images") {
        const fileArray = Array.from(files);
        setBikeData((prev) => ({ ...prev, [name]: fileArray }));
        const previews = fileArray.map((file) => URL.createObjectURL(file));
        setPreviewImages((prev) => ({ ...prev, vehicleImages: previews }));
      } else {
        const file = files[0];
        setBikeData((prev) => ({ ...prev, [name]: file }));
        if (file) {
          const preview = URL.createObjectURL(file);
          setPreviewImages((prev) => ({ ...prev, [name]: preview }));
        }
      }
    } else if (
      ["vehicleTypeId", "categoryId", "brandId", "modelId", "storeId", "registrationYear", "electricBatteryId"].includes(name)
    ) {
      const numValue = value && value !== "" ? Number(value) : null;
      setBikeData((prev) => ({ ...prev, [name]: numValue }));
    } else {
      setBikeData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const removeVehicleImagePreview = (index) => {
    setPreviewImages((prev) => ({
      ...prev,
      vehicleImages: prev.vehicleImages.filter((_, i) => i !== index),
    }));
    setBikeData((prev) => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index) || null,
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {isEditMode && (
              <button onClick={() => navigate("/dashboard/allBikes")} className="p-2 hover:bg-gray-100 rounded-lg transition">
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

        {/* Error Alert */}
        {generalError && (
          <div className="mb-6">
            <div className="flex items-center bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
              <FaTimes className="mr-2 text-lg" />
              <div>
                <span className="font-semibold">Error:</span> {generalError}
              </div>
              <button onClick={() => setGeneralError("")} className="ml-auto text-red-600 hover:text-red-800 font-bold px-2 py-1">
                ×
              </button>
            </div>
          </div>
        )}

        {/* ✅ Show Current Battery Info in Edit Mode */}
        {isEditMode && currentBattery && bikeData.fuelType === "ELECTRIC" && (
          <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                {/* <h3 className="text-sm font-medium text-blue-800">Currently Assigned Battery</h3> */}
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    <span className="font-semibold">Battery ID:</span> {currentBattery.batteryId}
                  </p>
                  <p>
                    <span className="font-semibold">Company:</span> {currentBattery.company}
                  </p>
                  <p>
                    <span className="font-semibold">Status:</span>{" "}
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                        currentBattery.batteryStatusCode === 1 ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {currentBattery.batteryStatusCode === 1 ? "IN BIKE" : "UNKNOWN"}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-6 sm:space-y-8">
          <BasicInformationSection
            bikeData={bikeData}
            errors={errors}
            handleChange={handleChange}
            submitLoading={submitLoading}
            vehicleTypes={vehicleTypes}
            filteredCategories={filteredCategories}
            filteredBrands={filteredBrands}
            filteredModels={filteredModels}
          />

          <RegistrationDetailsSection
            bikeData={bikeData}
            errors={errors}
            handleChange={handleChange}
            submitLoading={submitLoading}
            stores={stores}
          />

          <AdditionalDetailsSection
  bikeData={bikeData}
  errors={errors}
  handleChange={handleChange}
  submitLoading={submitLoading}
  isEditMode={isEditMode}
  openBatteries={openBatteries}
  currentBattery={currentBattery}
  loadingBatteries={loadingBatteries}
/>


          <DocumentImagesSection
            bikeData={bikeData}
            previewImages={previewImages}
            handleChange={handleChange}
            submitLoading={submitLoading}
            removeSingleImagePreview={removeSingleImagePreview}
          />

          <VehicleImagesSection
            bikeData={bikeData}
            errors={errors}
            previewImages={previewImages}
            handleChange={handleChange}
            submitLoading={submitLoading}
            isEditMode={isEditMode}
            removeVehicleImagePreview={removeVehicleImagePreview}
          />

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-end">
            <button
              type="button"
              onClick={() => navigate("/dashboard/allBikes")}
              className="w-full sm:w-auto px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-semibold"
              disabled={submitLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 bg-[#2B2B80] text-white rounded-lg hover:bg-[#1f1f5c] transition font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              disabled={submitLoading}
            >
              {submitLoading ? (
                <>
                  <FaSpinner className="animate-spin" />
                  {isEditMode ? "Updating..." : "Adding..."}
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
