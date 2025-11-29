import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { batteryAPI } from "../api/batteryAPI";
import { validateBatteryForm, validateImageFile } from "../utils/batteryValidation";

const useBatteryForm = (isEditMode, id) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = async (formData, imageFile) => {
    // Validate form
    const validationErrors = validateBatteryForm(formData, isEditMode);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error("Please fill all required fields");
      return false;
    }

    // Validate image if provided
    if (imageFile) {
      const imageError = validateImageFile(imageFile);
      if (imageError) {
        toast.error(imageError);
        return false;
      }
    }

    setLoading(true);

    try {
      if (isEditMode) {
        // Edit mode: Send JSON data (no image update in edit)
        const updateData = {
          batteryId: formData.batteryId.trim(),
          company: formData.company.trim(),
          cityId: parseInt(formData.cityId),
          storeId: parseInt(formData.storeId),
          batteryStatusCode: formData.batteryStatusCode,
        };

        console.log("Updating battery with data:", updateData);
        const result = await batteryAPI.update(id, updateData);
        console.log("Battery updated successfully:", result);

        toast.success("Battery updated successfully!");
        setTimeout(() => navigate("/dashboard/allBattery"), 1500);
        return true;
      } else {
        // Create mode: Send FormData with image
        const formDataToSend = new FormData();
        formDataToSend.append("batteryId", formData.batteryId.trim());
        formDataToSend.append("company", formData.company.trim());
        formDataToSend.append("cityId", formData.cityId);
        formDataToSend.append("storeId", formData.storeId);

        if (imageFile) {
          formDataToSend.append("imageFile", imageFile);
        }

        console.log("Creating new battery");
        const result = await batteryAPI.create(formDataToSend);
        console.log("Battery created successfully:", result);

        toast.success("Battery created successfully!");
        setTimeout(() => navigate("/dashboard/allBattery"), 1500);
        return true;
      }
    } catch (err) {
      console.error("Error saving battery:", err);

      let errorMessage = "Failed to save battery";

      if (err.message.includes("401")) {
        errorMessage = "Session expired. Please login again.";
        setTimeout(() => navigate("/login"), 2000);
      } else if (err.message.includes("403")) {
        errorMessage = "You do not have permission to perform this action";
      } else if (err.message.includes("Duplicate") || err.message.includes("already exists")) {
        errorMessage = "Battery ID already exists";
      } else if (err.message.includes("not found")) {
        errorMessage = "Selected city or store not found";
      } else if (err.message) {
        errorMessage = err.message;
      }

      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    errors,
    setErrors,
    handleSubmit,
  };
};

export default useBatteryForm;
