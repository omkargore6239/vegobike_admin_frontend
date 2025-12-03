import React, { useState } from "react";
import { FaTimes, FaTrash, FaImages, FaEye, FaUpload, FaSpinner } from "react-icons/fa";
import imageCompression from "browser-image-compression";
import { toast } from "react-toastify";

const VehicleImagesSection = ({
  bikeData,
  errors,
  previewImages,
  handleChange,
  submitLoading,
  isEditMode,
  removeVehicleImagePreview,
}) => {
  const [viewImage, setViewImage] = useState(null);
  const [compressing, setCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);

  const openImageModal = (imageUrl, index) => {
    setViewImage({ url: imageUrl, index });
  };

  const closeImageModal = () => {
    setViewImage(null);
  };

  const compressImage = async (file) => {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      initialQuality: 0.8,
      onProgress: (progress) => {
        setCompressionProgress(progress);
      },
    };
    try {
      console.log(`📷 Original file size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
      const compressedFile = await imageCompression(file, options);
      console.log(`✅ Compressed file size: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
      return new File([compressedFile], file.name, { type: compressedFile.type });
    } catch (error) {
      console.error("❌ Compression error:", error);
      toast.error("Failed to compress image. Using original.");
      return file;
    }
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setCompressing(true);
    setCompressionProgress(0);
    try {
      toast.info(`🔄 Compressing ${files.length} image(s)...`);
      const compressedFiles = [];
      for (const file of files) {
        if (!file.type.startsWith("image/")) {
          toast.warning(`⚠️ ${file.name} is not an image file`);
          continue;
        }
        const compressed = await compressImage(file);
        compressedFiles.push(compressed);
      }
      const syntheticEvent = {
        target: {
          name: "images",
          type: "file",
          files: compressedFiles,
        },
      };
      handleChange(syntheticEvent);
      toast.success(`✅ ${compressedFiles.length} image(s) compressed and ready to upload!`);
    } catch (error) {
      console.error("❌ Error processing images:", error);
      toast.error("Failed to process images");
    } finally {
      setCompressing(false);
      setCompressionProgress(0);
    }
  };

  return (
    <>
      <div className="bg-gradient-to-r from-red-50 to-orange-50 p-4 sm:p-6 rounded-xl border border-red-100">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-red-600">
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
            <span className="text-2xl">📄</span> Vehicle Images
            {!isEditMode && <span className="text-red-500 text-sm">*</span>}
          </h3>
          <div className="flex items-center gap-2">
            {compressing && (
              <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold animate-pulse">
                Uploading... {compressionProgress}%
              </span>
            )}
            {previewImages.vehicleImages.length > 0 && !compressing && (
              <span className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full font-semibold">
                {previewImages.vehicleImages.length}{" "}
                {previewImages.vehicleImages.length === 1 ? "Image" : "Images"}
              </span>
            )}
          </div>
        </div>
        {/* Upload area */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {isEditMode ? "Upload New Images (Optional)" : "Upload Vehicle Images"}
            {!isEditMode && <span className="text-red-500 ml-1">*</span>}
          </label>
          <div className="relative">
            <input
              type="file"
              name="images"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
              disabled={submitLoading || compressing}
              id="vehicleImagesInput"
            />
            <label
              htmlFor="vehicleImagesInput"
              className={`flex items-center justify-center gap-2 w-full border-2 border-dashed rounded-lg p-3 transition-all ${
                errors.vehicleImages
                  ? "border-red-500 bg-red-50 hover:bg-red-100"
                  : "border-gray-300 hover:border-yellow-500 hover:bg-yellow-50"
              } ${
                submitLoading || compressing
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer"
              }`}
            >
              {compressing ? (
                <>
                  <FaSpinner className="text-blue-500 animate-spin" />
                  <span className="text-xs text-blue-700 font-medium">Uploading...</span>
                </>
              ) : (
                <>
                  <FaUpload className="text-gray-400 text-sm" />
                  <span className="text-xs text-gray-600 font-medium">
                    {previewImages.vehicleImages.length > 0 ? 'Change File' : 'Choose File'}
                  </span>
                </>
              )}
            </label>
          </div>
          {/* Error Message */}
          {errors.images && (
            <div className="mt-2 flex items-center gap-1 text-red-600 text-sm bg-red-50 px-3 py-2 rounded border border-red-200">
              <FaTimes size={12} />
              <span>{errors.images}</span>
            </div>
          )}
          {/* Preview Grid – same pattern as DocumentImagesSection */}
          {previewImages.vehicleImages.length > 0 && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {previewImages.vehicleImages.map((img, idx) => (
                <div key={idx} className="bg-white rounded-lg p-4 border-2 border-gray-200 hover:border-yellow-400 transition group">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Vehicle Image {idx + 1}
                  </label>
                  <div className="relative">
                    <img
                      src={img}
                      alt={`Vehicle ${idx + 1}`}
                      className="w-full h-40 object-cover rounded-lg border-2 border-gray-200 cursor-pointer"
                      onClick={() => openImageModal(img, idx)}
                    />
                    <div className="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded shadow-md z-10">
                      ✓ Optimized
                    </div>
                    {/* Mobile buttons */}
                    <div className="sm:hidden absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 flex items-center justify-center gap-2 rounded-b-lg">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openImageModal(img, idx);
                        }}
                        className="bg-blue-500 text-white rounded px-2 py-1 hover:bg-blue-600 transition shadow-lg flex items-center gap-1 text-xs font-medium"
                        title="View"
                      >
                        <FaEye size={12} />
                        View
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeVehicleImagePreview(idx);
                        }}
                        className="bg-red-500 text-white rounded px-2 py-1 hover:bg-red-600 transition shadow-lg flex items-center gap-1 text-xs font-medium"
                        title="Remove"
                      >
                        <FaTrash size={10} />
                        Remove
                      </button>
                    </div>
                    {/* Desktop hover overlay */}
                    <div className="hidden sm:flex absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 rounded-lg transition-opacity duration-200 items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openImageModal(img, idx);
                        }}
                        className="bg-blue-500 text-white rounded-lg px-3 py-2 hover:bg-blue-600 transition shadow-lg flex items-center gap-1.5 text-sm font-medium"
                        title="View full size"
                      >
                        <FaEye size={14} />
                        View
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeVehicleImagePreview(idx);
                        }}
                        className="bg-red-500 text-white rounded-lg px-3 py-2 hover:bg-red-600 transition shadow-lg flex items-center gap-1.5 text-sm font-medium"
                        title="Remove"
                      >
                        <FaTrash size={12} />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* Empty state */}
          {previewImages.vehicleImages.length === 0 && !isEditMode && !compressing && (
            <div className="mt-4 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-white">
              <FaImages className="mx-auto text-gray-300 text-5xl mb-3" />
              <p className="text-gray-600 text-sm font-semibold">No images uploaded yet</p>
            </div>
          )}
          {/* Edit mode notice */}
          {isEditMode && previewImages.vehicleImages.length === 0 && !compressing && (
            <div className="mt-4 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r">
              <div className="flex items-start">
                <svg
                  className="h-5 w-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="text-sm text-blue-800 font-medium">Edit mode</p>
                  <p className="text-xs text-blue-700 mt-1">
                    Existing vehicle images will be kept. Upload new images only if you want to replace them.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Image Preview Modal */}
      {viewImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-0 sm:p-4"
          onClick={closeImageModal}
        >
          <div
            className="relative bg-white w-full h-full sm:rounded-xl sm:max-w-4xl sm:w-auto sm:max-h-[90vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-bold">Vehicle Image {viewImage.index + 1}</h3>
              <button
                onClick={closeImageModal}
                className="hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition"
                title="Close"
              >
                <FaTimes size={20} />
              </button>
            </div>
            {/* Modal Body */}
            <div className="bg-gray-900 sm:bg-gray-50 p-2 sm:p-6 overflow-auto h-[calc(100vh-60px)] sm:max-h-[calc(90vh-80px)] flex items-center justify-center">
              <img
                src={viewImage.url}
                alt={`Vehicle ${viewImage.index + 1}`}
                className="max-w-full max-h-full object-contain rounded-lg sm:shadow-lg"
              />
            </div>
            {/* Mobile hint */}
            {previewImages.vehicleImages.length > 1 && (
              <div className="sm:hidden absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm text-gray-800 text-xs px-3 py-1.5 rounded-full shadow-lg">
                Pinch to zoom • Tap outside to close
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default VehicleImagesSection;
