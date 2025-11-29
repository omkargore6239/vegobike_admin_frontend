import React from "react";
import { FaTrash } from "react-icons/fa";

const DocumentImagesSection = ({
  bikeData,
  previewImages,
  handleChange,
  submitLoading,
  removeSingleImagePreview,
}) => {
  return (
    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 sm:p-6 rounded-xl">
      <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-yellow-600 flex items-center gap-2">
        <span className="text-2xl">📄</span> Document Images
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* PUC Image */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            PUC Certificate
          </label>
          <input
            type="file"
            name="pucImage"
            accept="image/*"
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-600 transition"
            disabled={submitLoading}
          />
          {previewImages.pucImage && (
            <div className="mt-2 relative group">
              <img
                src={previewImages.pucImage}
                alt="PUC Preview"
                className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
              />
              <button
                type="button"
                onClick={() => removeSingleImagePreview("pucImage")}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition opacity-0 group-hover:opacity-100"
                title="Remove image"
              >
                <FaTrash size={12} />
              </button>
            </div>
          )}
        </div>

        {/* Insurance Image */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Insurance Document
          </label>
          <input
            type="file"
            name="insuranceImage"
            accept="image/*"
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-600 transition"
            disabled={submitLoading}
          />
          {previewImages.insuranceImage && (
            <div className="mt-2 relative group">
              <img
                src={previewImages.insuranceImage}
                alt="Insurance Preview"
                className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
              />
              <button
                type="button"
                onClick={() => removeSingleImagePreview("insuranceImage")}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition opacity-0 group-hover:opacity-100"
                title="Remove image"
              >
                <FaTrash size={12} />
              </button>
            </div>
          )}
        </div>

        {/* Other Documents */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Other Documents
          </label>
          <input
            type="file"
            name="documentImage"
            accept="image/*"
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-600 transition"
            disabled={submitLoading}
          />
          {previewImages.documentImage && (
            <div className="mt-2 relative group">
              <img
                src={previewImages.documentImage}
                alt="Document Preview"
                className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
              />
              <button
                type="button"
                onClick={() => removeSingleImagePreview("documentImage")}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition opacity-0 group-hover:opacity-100"
                title="Remove image"
              >
                <FaTrash size={12} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Info Text */}
      <div className="mt-4 bg-yellow-100 border-l-4 border-yellow-500 p-3 rounded">
        <p className="text-xs text-gray-700">
          💡 <span className="font-semibold">Tip:</span> Upload clear, readable images of your documents. 
          Accepted formats: JPG, PNG, WEBP. Maximum file size: 5MB per image.
        </p>
      </div>
    </div>
  );
};

export default DocumentImagesSection;
