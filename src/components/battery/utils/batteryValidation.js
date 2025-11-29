export const validateBatteryForm = (formData, isEditMode) => {
  const errors = {};

  if (!formData.batteryId?.trim()) {
    errors.batteryId = "Battery ID is required";
  }

  if (!formData.company?.trim()) {
    errors.company = "Company name is required";
  }

  if (!formData.cityId) {
    errors.cityId = "City is required";
  }

  if (!formData.storeId) {
    errors.storeId = "Store is required";
  }

  return errors;
};

export const validateImageFile = (file) => {
  if (!file) return null;

  if (!file.type.startsWith("image/")) {
    return "Please select an image file";
  }

  if (file.size > 5 * 1024 * 1024) {
    return "Image size should be less than 5MB";
  }

  return null;
};
