import React, { useState, useEffect, useRef } from "react";
import { FaEdit, FaTrash, FaSort, FaSortUp, FaSortDown, FaUpload, FaTimes, FaArrowLeft, FaLock, FaPlus } from "react-icons/fa";
import AddNewSellEntry from "../pages/SellBikes/AddNewSellEntry";

// Get the base URL from environment variables
const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:8080";

// SVG Placeholder for Images
const svgPlaceholder = `data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22482%22%20height%3D%22482%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20482%20482%22%3E%3Crect%20width%3D%22482%22%20height%3D%22482%22%20fill%3D%22%23e5e7eb%22%3E%3C%2Frect%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22%236b7280%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E`;

// ✅ Get JWT token from localStorage or sessionStorage
const getAuthToken = () => {
  const token = 
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("jwt") ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("authToken") ||
    sessionStorage.getItem("jwt") ||
    sessionStorage.getItem("accessToken");

  if (!token) {
    console.error("❌ No authentication token found!");
  }

  return token;
};

// ✅ Authenticated fetch wrapper
const authenticatedFetch = async (url, options = {}) => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error("Authentication token not found. Please login again.");
  }

  const headers = {
    ...options.headers,
    "Authorization": `Bearer ${token}`,
  };

  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  console.log(`🚀 ${options.method || 'GET'} ${url}`);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    console.log(`📥 Response status: ${response.status}`);

    if (response.status === 401) {
      console.error("🔒 Unauthorized - Token expired");
      localStorage.clear();
      sessionStorage.clear();
      alert("Your session has expired. Please login again.");
      window.location.href = "/login";
      throw new Error("Unauthorized");
    }

    if (response.status === 403) {
      console.error("🚫 Access forbidden");
      alert("Access denied. You don't have permission.");
      throw new Error("Access forbidden");
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error: ${response.status}`, errorText);
      throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
    }

    return response;
  } catch (error) {
    console.error(`❌ Request failed:`, error);
    throw error;
  }
};

// ✅ Helper function to get status display information
const getStatusDisplay = (status) => {
  const statusMap = {
    "INQUIRY_SUBMITTED": { emoji: "📝", label: "Inquiry Submitted", color: "blue" },
    "INSPECTION": { emoji: "🔍", label: "Inspection", color: "purple" },
    "CALL_TO_OWNER": { emoji: "📞", label: "Call to Owner", color: "indigo" },
    "LISTED": { emoji: "📋", label: "Listed", color: "cyan" },
    "AVAILABLE": { emoji: "✅", label: "Available", color: "green" },
    "REJECTED": { emoji: "❌", label: "Rejected", color: "red" },
    "SOLD": { emoji: "💰", label: "Sold", color: "emerald" },
    "PENDING": { emoji: "⏳", label: "Pending", color: "yellow" },
  };
  
  return statusMap[status] || { emoji: "❓", label: status, color: "gray" };
};

// ✅ Helper function to get status badge classes
const getStatusBadgeClasses = (status) => {
  const colorMap = {
    "blue": "bg-blue-100 text-blue-800 border-blue-200",
    "purple": "bg-purple-100 text-purple-800 border-purple-200",
    "indigo": "bg-indigo-100 text-indigo-800 border-indigo-200",
    "cyan": "bg-cyan-100 text-cyan-800 border-cyan-200",
    "green": "bg-green-100 text-green-800 border-green-200",
    "red": "bg-red-100 text-red-800 border-red-200",
    "emerald": "bg-emerald-100 text-emerald-800 border-emerald-200",
    "yellow": "bg-yellow-100 text-yellow-800 border-yellow-200",
    "gray": "bg-gray-100 text-gray-800 border-gray-200",
  };
  
  const statusInfo = getStatusDisplay(status);
  return colorMap[statusInfo.color] || colorMap["gray"];
};

// ✅ EditBikeDetails Component (FIRST COMPONENT - Separate)
const EditBikeDetails = ({ bikeData, onClose, onSave }) => {
  const fetchingRef = useRef(false);
  const mountedRef = useRef(false);

  const [formData, setFormData] = useState({
    listingStatus: bikeData?.bikeSale?.listingStatus || bikeData?.listingStatus || "PENDING",
    isRepairRequired: bikeData?.bikeSale?.isRepairRequired ?? bikeData?.isRepairRequired ?? false,
    sellingPrice: bikeData?.bikeSale?.sellingPrice || bikeData?.sellingPrice || 0,
    sellingClosingPrice: bikeData?.bikeSale?.sellingClosingPrice || bikeData?.sellingClosingPrice || 0,
    customerSellingClosingPrice: bikeData?.bikeSale?.customerSellingClosingPrice || bikeData?.customerSellingClosingPrice || 0,
    bikeCondition: bikeData?.bikeSale?.bikeCondition || bikeData?.bikeCondition || "Good",
    supervisorName: bikeData?.bikeSale?.supervisorName || bikeData?.supervisorName || "",
    additionalNotes: bikeData?.bikeSale?.additionalNotes || bikeData?.additionalNotes || "",
    pucFile: null,
    documentFile: null,
    frontImage: null,
    backImage: null,
    leftImage: null,
    rightImage: null,
    id: bikeData?.bikeSale?.id || bikeData?.id,
    categoryId: bikeData?.bikeSale?.categoryId || bikeData?.categoryId,
    brandId: bikeData?.bikeSale?.brandId || bikeData?.brandId,
    modelId: bikeData?.bikeSale?.modelId || bikeData?.modelId,
    yearId: bikeData?.bikeSale?.yearId || bikeData?.yearId,
    color: bikeData?.bikeSale?.color || bikeData?.color,
    registrationNumber: bikeData?.bikeSale?.registrationNumber || bikeData?.registrationNumber,
    numberOfOwner: bikeData?.bikeSale?.numberOfOwner || bikeData?.numberOfOwner,
    kmsDriven: bikeData?.bikeSale?.kmsDriven || bikeData?.kmsDriven,
    price: bikeData?.bikeSale?.price || bikeData?.price || 0,
    isPuc: bikeData?.bikeSale?.isPuc || bikeData?.isPuc || false,
    isInsurance: bikeData?.bikeSale?.isInsurance || bikeData?.isInsurance || false,
    isDocument: bikeData?.bikeSale?.isDocument || bikeData?.isDocument || false,
    pucImage: bikeData?.bikeSale?.pucImage || bikeData?.pucImage,
    documentImage: bikeData?.bikeSale?.documentImage || bikeData?.documentImage,
    name: bikeData?.bikeSale?.name || bikeData?.name,
    email: bikeData?.bikeSale?.email || bikeData?.email,
    contactNumber: bikeData?.bikeSale?.contactNumber || bikeData?.contactNumber,
    alternateContactNumber: bikeData?.bikeSale?.alternateContactNumber || bikeData?.alternateContactNumber,
    city: bikeData?.bikeSale?.city || bikeData?.city,
    pincode: bikeData?.bikeSale?.pincode || bikeData?.pincode,
    address: bikeData?.bikeSale?.address || bikeData?.address,
  });

  const [existingImages, setExistingImages] = useState({
    frontImages: bikeData?.bikeImages?.frontImages || bikeData?.frontImages || null,
    backImages: bikeData?.bikeImages?.backImages || bikeData?.backImages || null,
    leftImages: bikeData?.bikeImages?.leftImages || bikeData?.leftImages || null,
    rightImages: bikeData?.bikeImages?.rightImages || bikeData?.rightImages || null,
  });

  const [modalLoading, setModalLoading] = useState(false);
  const [isRefreshingImages, setIsRefreshingImages] = useState(false);
  const [availableStatuses, setAvailableStatuses] = useState([]);
  const [loadingStatuses, setLoadingStatuses] = useState(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // ✅ Fetch available listing statuses from backend
  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        setLoadingStatuses(true);
        const response = await authenticatedFetch(
          `${BASE_URL}/api/listing-statuses`,
          { method: "GET" }
        );
        
        const result = await response.json();
        
        if (result.success && Array.isArray(result.data)) {
          setAvailableStatuses(result.data);
        } else {
          // Fallback to default statuses if API fails
          setAvailableStatuses([
            "INQUIRY_SUBMITTED",
            "INSPECTION",
            "CALL_TO_OWNER",
            "LISTED",
            "AVAILABLE",
            "REJECTED",
            "SOLD",
            "PENDING"
          ]);
        }
      } catch (error) {
        console.error("Error fetching statuses:", error);
        // Fallback to default statuses
        setAvailableStatuses([
          "INQUIRY_SUBMITTED",
          "INSPECTION",
          "CALL_TO_OWNER",
          "LISTED",
          "AVAILABLE",
          "REJECTED",
          "SOLD",
          "PENDING"
        ]);
      } finally {
        setLoadingStatuses(false);
      }
    };

    fetchStatuses();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : (type === "number" ? parseFloat(value) || 0 : value)
    }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    }
  };

  const handleBikeImageChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    }
  };

  const handleBikeImageUpload = async () => {
    const hasImages = formData.frontImage || formData.backImage || formData.leftImage || formData.rightImage;
    
    if (!hasImages) {
      alert("Please select at least one bike image to upload");
      return;
    }

    try {
      setModalLoading(true);
      const imageFormData = new FormData();
      
      if (formData.frontImage) imageFormData.append("frontImage", formData.frontImage);
      if (formData.backImage) imageFormData.append("backImage", formData.backImage);
      if (formData.leftImage) imageFormData.append("leftImage", formData.leftImage);
      if (formData.rightImage) imageFormData.append("rightImage", formData.rightImage);

      const response = await authenticatedFetch(
        `${BASE_URL}/api/bike-sales/${formData.id}/images`,
        {
          method: "POST",
          body: imageFormData,
        }
      );

      const result = await response.json();
      
      if (result.success) {
        alert("Bike images uploaded successfully!");
        
        setFormData(prev => ({
          ...prev,
          frontImage: null,
          backImage: null,
          leftImage: null,
          rightImage: null,
        }));

        ["front", "back", "left", "right"].forEach(type => {
          const input = document.getElementById(`${type}-image-upload`);
          if (input) input.value = "";
        });

        if (result.data?.bikeImages) {
          setExistingImages({
            frontImages: result.data.bikeImages.frontImages || null,
            backImages: result.data.bikeImages.backImages || null,
            leftImages: result.data.bikeImages.leftImages || null,
            rightImages: result.data.bikeImages.rightImages || null,
          });
        }
      }
    } catch (error) {
      console.error("Error uploading bike images:", error);
      alert(`Failed to upload: ${error.message}`);
    } finally {
      setModalLoading(false);
    }
  };

  const refreshExistingBikeImages = async (bikeId) => {
    if (fetchingRef.current || !mountedRef.current || !bikeId) return;

    try {
      fetchingRef.current = true;
      setIsRefreshingImages(true);

      const response = await authenticatedFetch(
        `${BASE_URL}/api/bike-sales/adminuser/${bikeId}`,
        { method: "GET" }
      );

      if (response.ok && mountedRef.current) {
        const result = await response.json();

        if (result.success && result.data?.bikeImages) {
          setExistingImages({
            frontImages: result.data.bikeImages.frontImages || null,
            backImages: result.data.bikeImages.backImages || null,
            leftImages: result.data.bikeImages.leftImages || null,
            rightImages: result.data.bikeImages.rightImages || null,
          });
        }
      }
    } catch (error) {
      console.error("Error refreshing images:", error);
    } finally {
      if (mountedRef.current) {
        setIsRefreshingImages(false);
        fetchingRef.current = false;
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const formDataToSend = new FormData();
      
      const bikeSaleDTO = {
        categoryId: parseInt(formData.categoryId),
        brandId: parseInt(formData.brandId),
        modelId: parseInt(formData.modelId),
        yearId: formData.yearId,
        color: formData.color,
        registrationNumber: formData.registrationNumber,
        numberOfOwner: parseInt(formData.numberOfOwner),
        kmsDriven: parseInt(formData.kmsDriven),
        price: parseFloat(formData.price),
        bikeCondition: formData.bikeCondition,
        isPuc: formData.isPuc,
        isInsurance: formData.isInsurance,
        isDocument: formData.isDocument,
        customerSellingClosingPrice: parseFloat(formData.customerSellingClosingPrice),
        supervisorName: formData.supervisorName,
        additionalNotes: formData.additionalNotes,
        listingStatus: formData.listingStatus,
        isRepairRequired: formData.isRepairRequired,
        sellingPrice: parseFloat(formData.sellingPrice),
        sellingClosingPrice: parseFloat(formData.sellingClosingPrice),
      };

      formDataToSend.append("bikeSaleDTO", new Blob([JSON.stringify(bikeSaleDTO)], { type: "application/json" }));

      if (formData.pucFile) formDataToSend.append("pucimage", formData.pucFile);
      if (formData.documentFile) formDataToSend.append("documentimage", formData.documentFile);

      const response = await authenticatedFetch(
        `${BASE_URL}/api/bike-sales/${formData.id}/admin-update`,
        {
          method: "PUT",
          body: formDataToSend,
        }
      );

      const result = await response.json();
      
      if (result.success) {
        alert("Bike details updated successfully!");
        onSave(result.data);
        onClose();
      }
    } catch (error) {
      console.error("Error updating:", error);
      alert(`Failed to update: ${error.message}`);
    }
  };

  // ✅ EditBikeDetails JSX - Complete modal
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-white shadow-sm border-b sticky top-0 z-10">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button onClick={onClose} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  <FaArrowLeft size={16} />
                </button>
                <h1 className="text-2xl font-semibold text-gray-900">Edit Bike Details</h1>
                <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full border border-amber-200">
                  <FaLock className="inline mr-1" size={10} />
                  Admin View - Limited Edit Access
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusBadgeClasses(formData.listingStatus)}`}>
                  {(() => {
                    const statusInfo = getStatusDisplay(formData.listingStatus);
                    return `${statusInfo.emoji} ${statusInfo.label}`;
                  })()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Form content */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Admin Editable Fields Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Admin Editable Fields</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Listing Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Listing Status <span className="text-red-500">*</span>
                </label>
                <select
                  name="listingStatus"
                  value={formData.listingStatus}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={loadingStatuses}
                >
                  {loadingStatuses ? (
                    <option value="">Loading statuses...</option>
                  ) : (
                    availableStatuses.map((status) => {
                      const statusInfo = getStatusDisplay(status);
                      return (
                        <option key={status} value={status}>
                          {statusInfo.emoji} {statusInfo.label}
                        </option>
                      );
                    })
                  )}
                </select>
                {loadingStatuses && (
                  <p className="mt-1 text-xs text-gray-500">Fetching available statuses...</p>
                )}
              </div>

              {/* Bike Condition */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bike Condition <span className="text-red-500">*</span>
                </label>
                <select
                  name="bikeCondition"
                  value={formData.bikeCondition}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
                </select>
              </div>

              {/* Repair Required */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isRepairRequired"
                  checked={formData.isRepairRequired}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  Repair Required
                </label>
              </div>

              {/* Selling Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selling Price <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="sellingPrice"
                  value={formData.sellingPrice}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  min="0"
                />
              </div>

              {/* Selling Closing Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selling Closing Price
                </label>
                <input
                  type="number"
                  name="sellingClosingPrice"
                  value={formData.sellingClosingPrice}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                />
              </div>

              {/* Customer Selling Closing Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Selling Closing Price
                </label>
                <input
                  type="number"
                  name="customerSellingClosingPrice"
                  value={formData.customerSellingClosingPrice}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                />
              </div>

              {/* Supervisor Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supervisor Name
                </label>
                <input
                  type="text"
                  name="supervisorName"
                  value={formData.supervisorName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter supervisor name"
                />
              </div>

              {/* Additional Notes */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  name="additionalNotes"
                  value={formData.additionalNotes}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter any additional notes..."
                />
              </div>
            </div>
          </div>

          {/* Read-Only Customer Information */}
          <div className="mb-8 bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Customer Information (Read-Only)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium">{formData.name || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{formData.email || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Contact Number</p>
                <p className="font-medium">{formData.contactNumber || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Alternate Contact</p>
                <p className="font-medium">{formData.alternateContactNumber || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">City</p>
                <p className="font-medium">{formData.city || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Pincode</p>
                <p className="font-medium">{formData.pincode || "N/A"}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600">Address</p>
                <p className="font-medium">{formData.address || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Read-Only Bike Information */}
          <div className="mb-8 bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Bike Information (Read-Only)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Registration Number</p>
                <p className="font-medium">{formData.registrationNumber || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Color</p>
                <p className="font-medium">{formData.color || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Number of Owners</p>
                <p className="font-medium">{formData.numberOfOwner || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">KMs Driven</p>
                <p className="font-medium">{formData.kmsDriven || "N/A"} km</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Customer Price</p>
                <p className="font-medium">₹{formData.price || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">PUC Available</p>
                <p className="font-medium">{formData.isPuc ? "Yes" : "No"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Insurance Available</p>
                <p className="font-medium">{formData.isInsurance ? "Yes" : "No"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Documents Available</p>
                <p className="font-medium">{formData.isDocument ? "Yes" : "No"}</p>
              </div>
            </div>
          </div>

          {/* Bike Images Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Bike Images</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {["frontImages", "backImages", "leftImages", "rightImages"].map((imageType) => (
                <div key={imageType} className="border rounded-lg p-2">
                  <p className="text-sm font-medium text-gray-600 mb-2 capitalize">
                    {imageType.replace("Images", "")}
                  </p>
                  {existingImages[imageType] ? (
                    <img
                      src={`${BASE_URL}/${existingImages[imageType]}`}
                      alt={imageType}
                      className="w-full h-32 object-cover rounded"
                    />
                  ) : (
                    <div className="w-full h-32 bg-gray-200 rounded flex items-center justify-center">
                      <p className="text-gray-400 text-xs">No image</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="mt-8 pt-6 border-t border-gray-200 flex space-x-4">
            <button 
              type="submit" 
              disabled={modalLoading}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaUpload className="mr-2" size={14} />
              {modalLoading ? "Updating..." : "Update Details"}
            </button>
            <button 
              type="button" 
              onClick={onClose} 
              className="px-8 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; // ← EditBikeDetails ENDS HERE

// ✅ SellBikes Component (SECOND COMPONENT - Separate)
const SellBikes = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBike, setEditingBike] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  const fetchBikeData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await authenticatedFetch(
        `${BASE_URL}/api/bike-sales/AdminGetAll`,
        { method: "GET" }
      );

      const result = await response.json();

      const transformedData = Array.isArray(result.data)
        ? result.data.map((item) => ({
            id: item.id,
            orderId: `SB${String(item.id).padStart(3, "0")}`,
            name: item.name || "Customer Name",
            registrationNumber: item.registrationNumber,
            brandName: item.brandId === 1 ? "HONDA" : "Other Brand",
            manufacturingYear: item.yearId,
            status: item.listingStatus,
            image: item.bikeImages?.frontImages
              ? `${BASE_URL}/${item.bikeImages.frontImages}`
              : svgPlaceholder,
          }))
        : [];

      setData(transformedData);
    } catch (err) {
      console.error("Error fetching bike data:", err);
      setError(err.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBikeDetails = async (id) => {
    try {
      setModalLoading(true);

      const response = await authenticatedFetch(
        `${BASE_URL}/api/bike-sales/adminuser/${id}`,
        { method: "GET" }
      );

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error("Invalid response");
      }

      return result.data;
    } catch (err) {
      console.error("Error fetching details:", err);
      alert(`Error: ${err.message}`);
      return null;
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (item) => {
    const confirmDelete = window.confirm(
      `Delete ${item.name}'s bike (${item.brandName} - ${item.orderId})?`
    );

    if (confirmDelete) {
      try {
        await authenticatedFetch(
          `${BASE_URL}/api/bike-sales/Admin/${item.id}`,
          {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
          }
        );

        setData((prevData) => prevData.filter((bike) => bike.id !== item.id));
        alert(`Bike ${item.orderId} deleted successfully!`);
      } catch (error) {
        console.error("Error deleting:", error);
        alert(`Failed to delete: ${error.message}`);
      }
    }
  };

  const handleEdit = async (item) => {
    const bikeDetails = await fetchBikeDetails(item.id);
    if (bikeDetails) {
      setEditingBike(bikeDetails);
      setShowEditModal(true);
    }
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingBike(null);
  };

  const handleSaveEdit = (updatedData) => {
    setData(prevData =>
      prevData.map(bike =>
        bike.id === updatedData.id ? { ...bike, ...updatedData } : bike
      )
    );
    fetchBikeData();
  };

  useEffect(() => {
    fetchBikeData();
  }, []);

  // Filter and sort data
  const filteredData = data.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.orderId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    
    if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const paginatedData = sortedData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const totalPages = Math.ceil(sortedData.length / rowsPerPage);

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Sell Bikes Management</h1>
        <p className="text-gray-600 mt-2">Manage and monitor all bike listings</p>
      </div>

      {/* Search and Actions */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <input
            type="text"
            placeholder="Search by name, registration, or order ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FaPlus className="mr-2" size={14} />
            Add New
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600">Loading bikes...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600">Error: {error}</p>
        </div>
      )}

      {/* Data Table */}
      {!loading && !error && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <img src={item.image} alt={item.name} className="h-12 w-12 rounded object-cover" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{item.orderId}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{item.name}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{item.registrationNumber}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{item.brandName}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClasses(item.status)}`}>
                        {(() => {
                          const statusInfo = getStatusDisplay(item.status);
                          return `${statusInfo.emoji} ${statusInfo.label}`;
                        })()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                      >
                        <FaEdit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <FaTrash size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t">
            <div className="text-sm text-gray-700">
              Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, sortedData.length)} of {sortedData.length} results
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingBike && (
        <EditBikeDetails
          bikeData={editingBike}
          onClose={handleCloseEditModal}
          onSave={handleSaveEdit}
        />
      )}

      {/* Add Form Modal */}
      {showAddForm && (
        <AddNewSellEntry onClose={() => setShowAddForm(false)} />
      )}
    </div>
  );
};

export default SellBikes;
