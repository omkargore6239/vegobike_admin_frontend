import { useState } from "react";
import { toast } from "react-toastify";
import { BASE_URL } from "../../../api/apiConfig";
import { validateBikeForm } from "../utils/bikeValidation";

const useBikeForm = (bikeData, isEditMode, id, setGeneralError, navigate) => {
  const [submitLoading, setSubmitLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitLoading) {
      console.log("⏳ Already submitting...");
      return;
    }

    const validationErrors = validateBikeForm(bikeData, isEditMode);
    if (Object.keys(validationErrors).length > 0) {
      toast.error("Please fill all required fields correctly");
      return;
    }

    setSubmitLoading(true);

    try {
      const formDataToSend = new FormData();

      // ✅ Append all fields except images and electricBatteryId (handle separately)
      Object.keys(bikeData).forEach((key) => {
        if (bikeData[key] !== null && bikeData[key] !== undefined && bikeData[key] !== "") {
          if (key === "isPuc" || key === "isInsurance" || key === "isDocuments") {
            formDataToSend.append(key, bikeData[key]);
          } else if (
            key !== "pucImage" &&
            key !== "insuranceImage" &&
            key !== "documentImage" &&
            key !== "images" && // ✅ Changed from vehicleImages
            key !== "electricBatteryId"
          ) {
            formDataToSend.append(key, bikeData[key]);
          }
        }
      });

      // ✅ Append electricBatteryId only if it exists and fuel type is ELECTRIC
      if (bikeData.electricBatteryId && bikeData.fuelType === "ELECTRIC") {
        formDataToSend.append("electricBatteryId", bikeData.electricBatteryId);
        console.log("✅ Added electricBatteryId:", bikeData.electricBatteryId);
      }

      // ✅ Append images - single document images
      if (bikeData.pucImage instanceof File) {
        formDataToSend.append("pucImage", bikeData.pucImage);
        console.log("✅ Added pucImage");
      }
      if (bikeData.insuranceImage instanceof File) {
        formDataToSend.append("insuranceImage", bikeData.insuranceImage);
        console.log("✅ Added insuranceImage");
      }
      if (bikeData.documentImage instanceof File) {
        formDataToSend.append("documentImage", bikeData.documentImage);
        console.log("✅ Added documentImage");
      }

      // ✅ Append vehicle images as "images" (backend expects request.getImages())
      if (bikeData.images && bikeData.images.length > 0) {
        Array.from(bikeData.images).forEach((file, index) => {
          formDataToSend.append("images", file); // ✅ Changed from vehicleImages to images
          console.log(`✅ Added vehicle image ${index + 1}:`, file.name);
        });
      }

      // ✅ Debug: Log all FormData entries
      console.log("📦 FormData contents:");
      for (let [key, value] of formDataToSend.entries()) {
        console.log(`  ${key}:`, value instanceof File ? `File: ${value.name}` : value);
      }

      const url = isEditMode ? `${BASE_URL}/api/bikes/update/${id}` : `${BASE_URL}/api/bikes/add`;

      console.log("🚀 Submitting to:", url);
      console.log("📝 Method:", isEditMode ? "PUT" : "POST");

      const response = await fetch(url, {
        method: isEditMode ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || localStorage.getItem("authToken")}`,
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        let errorMessage = "Failed to save bike";
        try {
          const errorData = await response.json();
          console.error("❌ Error response:", errorData);

          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData.errors) {
            // Handle validation errors
            if (Array.isArray(errorData.errors)) {
              errorMessage = errorData.errors[0];
            } else {
              errorMessage = Object.values(errorData.errors)[0];
            }
          }
        } catch (parseError) {
          console.error("❌ Error parsing response:", parseError);
          errorMessage = `Error ${response.status}: ${response.statusText}`;
        }

        setGeneralError(errorMessage);
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log("✅ Success Response:", result);

      setGeneralError("");
      toast.success(`🎉 Bike ${isEditMode ? "updated" : "added"} successfully!`);

      setTimeout(() => {
        navigate("/dashboard/allBikes");
      }, 1500);
    } catch (err) {
      console.error("❌ Error saving bike:", err);

      if (!err.message || err.message === "Failed to fetch") {
        const networkError = "❌ Network error. Please check your connection.";
        setGeneralError(networkError);
        toast.error(networkError);
      }
    } finally {
      setSubmitLoading(false);
      console.log("🏁 Submit process completed");
    }
  };

  return { handleSubmit, submitLoading };
};

export default useBikeForm;
