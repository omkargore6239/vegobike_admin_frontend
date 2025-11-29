import React from "react";
import { FaTimes, FaTrash, FaImages } from "react-icons/fa";

const VehicleImagesSection = ({
  bikeData,
  errors,
  previewImages,
  handleChange,
  submitLoading,
  isEditMode,
  removeVehicleImagePreview,
}) => {
  return (
    <div className="bg-gradient-to-r from-pink-50 to-red-50 p-4 sm:p-6 rounded-xl">
      <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-pink-600 flex items-center gap-2">
        <span className="text-2xl">🖼️</span> Vehicle Images
        {!isEditMode && <span className="text-red-500 text-sm ml-2">*</span>}
      </h3>

      <div>
        {/* File Input */}
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Upload Vehicle Images {!isEditMode && <span className="text-red-500">(Required)</span>}
        </label>
        <div className="relative">
          <input
            type="file"
            name="images"
            accept="image/*"
            multiple
            onChange={handleChange}
            className={`w-full border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-600 transition ${
              errors.vehicleImages ? "border-red-500 bg-red-50" : "border-gray-300"
            }`}
            disabled={submitLoading}
            id="vehicleImagesInput"
          />
          <label
            htmlFor="vehicleImagesInput"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400"
          >
            <FaImages size={20} />
          </label>
        </div>

        {/* Error Message */}
        {errors.images && (
          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
            <FaTimes /> {errors.images}
          </p>
        )}

        {/* Info Text */}
        <p className="text-xs text-gray-600 mt-2">
          📸 Upload multiple images from different angles for better visibility. You can select multiple files at once.
        </p>

        {/* Image Preview Grid */}
        {previewImages.vehicleImages.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">
              Preview ({previewImages.vehicleImages.length} image{previewImages.vehicleImages.length !== 1 ? "s" : ""})
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {previewImages.vehicleImages.map((img, idx) => (
                <div key={idx} className="relative group">
                  <img
                    src={img}
                    alt={`Vehicle ${idx + 1}`}
                    className="w-full h-32 object-cover rounded-lg border-2 border-gray-200 group-hover:border-pink-500 transition"
                  />
                  
                  {/* Image Number Badge */}
                  <div className="absolute top-2 left-2 bg-pink-600 text-white text-xs font-bold px-2 py-1 rounded">
                    #{idx + 1}
                  </div>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => removeVehicleImagePreview(idx)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition opacity-0 group-hover:opacity-100 shadow-lg"
                    title="Remove image"
                  >
                    <FaTrash size={12} />
                  </button>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-lg transition pointer-events-none"></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {previewImages.vehicleImages.length === 0 && !isEditMode && (
          <div className="mt-4 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
            <FaImages className="mx-auto text-gray-400 text-4xl mb-3" />
            <p className="text-gray-600 text-sm font-medium">No images selected</p>
            <p className="text-gray-400 text-xs mt-1">Click above to upload vehicle images</p>
          </div>
        )}

        {/* Edit Mode Info */}
        {isEditMode && previewImages.vehicleImages.length === 0 && (
          <div className="mt-4 bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
            <p className="text-xs text-blue-700">
              ℹ️ <span className="font-semibold">Edit Mode:</span> Upload new images only if you want to replace the existing ones. 
              If no new images are uploaded, the existing images will be retained.
            </p>
          </div>
        )}

        {/* Image Guidelines */}
        {/* <div className="mt-4 bg-pink-50 border border-pink-200 rounded-lg p-3">
          <p className="text-xs font-semibold text-pink-800 mb-2">📝 Image Guidelines:</p>
          <ul className="text-xs text-pink-700 space-y-1 ml-4 list-disc">
            <li>Upload clear, well-lit photos</li>
            <li>Include front, back, side, and interior views</li>
            <li>Show registration plate clearly (if applicable)</li>
            <li>Recommended: 4-8 images for complete representation</li>
            <li>Supported formats: JPG, PNG, WEBP (Max 5MB each)</li>
          </ul>
        </div> */}
      </div>
    </div>
  );
};

export default VehicleImagesSection;
