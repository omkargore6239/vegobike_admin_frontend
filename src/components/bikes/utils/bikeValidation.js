export const validateBikeForm = (bikeData, isEditMode) => {
  const errors = {};

  const isValidId = (value) => {
    if (!value || value === "" || value === "0") return false;
    const numValue = Number(value);
    return !isNaN(numValue) && numValue > 0;
  };

  if (!bikeData.name?.trim()) errors.name = "Bike name is required";
  if (!isValidId(bikeData.vehicleTypeId)) errors.vehicleTypeId = "Select vehicle type";
  if (!isValidId(bikeData.categoryId)) errors.categoryId = "Select category";
  if (!isValidId(bikeData.brandId)) errors.brandId = "Select brand";
  if (!isValidId(bikeData.modelId)) errors.modelId = "Select model";
  if (!bikeData.fuelType) errors.fuelType = "Select fuel type";
  if (!bikeData.registrationNumber?.trim()) errors.registrationNumber = "Registration number required";
  if (!isValidId(bikeData.registrationYear)) errors.registrationYear = "Select registration year";
  if (!isValidId(bikeData.storeId)) errors.storeId = "Select store";

  // ✅ Changed from vehicleImages to images
  if (!isEditMode && (!bikeData.images || bikeData.images.length === 0)) {
    errors.images = "Upload at least 1 vehicle image";
  }

  return errors;
};
