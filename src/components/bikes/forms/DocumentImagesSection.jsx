import React, { useState } from "react";
import { FaTrash, FaEye, FaTimes, FaUpload, FaSpinner } from "react-icons/fa";
import imageCompression from 'browser-image-compression';
import { toast } from 'react-toastify';

const DocumentImagesSection = ({
  bikeData,
  previewImages,
  handleChange,
  submitLoading,
  removeSingleImagePreview,
}) => {
  const [viewImage, setViewImage] = useState(null);
  const [compressing, setCompressing] = useState({});

  const openImageModal = (imageUrl, title) => {
    setViewImage({ url: imageUrl, title });
  };

  const closeImageModal = () => {
    setViewImage(null);
  };

  // ✅ Image Compression Function for Documents
  const compressDocumentImage = async (file) => {
    const options = {
      maxSizeMB: 0.5, // Max 500KB for documents
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      initialQuality: 0.85,
      onProgress: (progress) => {
        console.log(`Compression progress: ${progress}%`);
      }
    };

    try {
      console.log(`📄 Original document size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
      const compressedFile = await imageCompression(file, options);
      console.log(`✅ Compressed document size: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
      
      // Create new File with original name
      const compressedWithName = new File(
        [compressedFile], 
        file.name, 
        { type: compressedFile.type }
      );
      
      return compressedWithName;
    } catch (error) {
      console.error('❌ Document compression error:', error);
      toast.error('Failed to compress document. Using original.');
      return file;
    }
  };

  // ✅ Handle Document File Change with Compression
  const handleDocumentChange = async (e, fieldName) => {
    const file = e.target.files[0];
    
    if (!file) return;

    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setCompressing(prev => ({ ...prev, [fieldName]: true }));

    try {
      toast.info('🔄 Compressing document...');

      // Compress the image
      const compressed = await compressDocumentImage(file);

      // Create synthetic event for handleChange
      const syntheticEvent = {
        target: {
          name: fieldName,
          type: 'file',
          files: [compressed]
        }
      };

      // Call original handleChange
      handleChange(syntheticEvent);

      toast.success('✅ Document compressed and ready!');
      
    } catch (error) {
      console.error('❌ Error processing document:', error);
      toast.error('Failed to process document');
    } finally {
      setCompressing(prev => ({ ...prev, [fieldName]: false }));
    }
  };

  const DocumentImageCard = ({ label, fieldName, previewUrl }) => (
    <div className="bg-white rounded-lg p-4 border-2 border-gray-200 hover:border-yellow-400 transition">
      <label className="block text-sm font-semibold text-gray-700 mb-3">
        {label}
      </label>

      {/* Custom File Input */}
      <div className="relative">
        <input
          type="file"
          name={fieldName}
          accept="image/*"
          onChange={(e) => handleDocumentChange(e, fieldName)}
          className="hidden"
          disabled={submitLoading || compressing[fieldName]}
          id={`doc-${fieldName}`}
        />
        <label
          htmlFor={`doc-${fieldName}`}
          className={`flex items-center justify-center gap-2 w-full border-2 border-dashed rounded-lg p-3 transition-all ${
            compressing[fieldName]
              ? 'border-blue-400 bg-blue-50 cursor-wait'
              : 'border-gray-300 hover:border-yellow-500 hover:bg-yellow-50 cursor-pointer'
          } ${submitLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {compressing[fieldName] ? (
            <>
              <FaSpinner className="text-blue-500 animate-spin" />
              <span className="text-xs text-blue-700 font-medium">Uploading...</span>
            </>
          ) : (
            <>
              <FaUpload className="text-gray-400 text-sm" />
              <span className="text-xs text-gray-600 font-medium">
                {previewUrl ? 'Change File' : 'Choose File'}
              </span>
            </>
          )}
        </label>
      </div>

      {/* Preview with Actions */}
      {previewUrl && !compressing[fieldName] && (
        <div className="mt-3 relative group">
          <img
            src={previewUrl}
            alt={`${label} Preview`}
            className="w-full h-40 object-cover rounded-lg border-2 border-gray-200 cursor-pointer"
            onClick={() => openImageModal(previewUrl, label)}
          />
          
          {/* Optimized Badge */}
          <div className="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded shadow-md z-10">
            ✓ Optimized
          </div>

          {/* ✅ MOBILE: Always visible buttons */}
          <div className="sm:hidden absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 flex items-center justify-center gap-2 rounded-b-lg">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openImageModal(previewUrl, label);
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
                removeSingleImagePreview(fieldName);
              }}
              className="bg-red-500 text-white rounded px-2 py-1 hover:bg-red-600 transition shadow-lg flex items-center gap-1 text-xs font-medium"
              title="Remove"
            >
              <FaTrash size={10} />
              Remove
            </button>
          </div>

          {/* ✅ DESKTOP: Hover overlay */}
          <div className="hidden sm:flex absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 rounded-lg transition-opacity duration-200 items-center justify-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openImageModal(previewUrl, label);
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
                removeSingleImagePreview(fieldName);
              }}
              className="bg-red-500 text-white rounded-lg px-3 py-2 hover:bg-red-600 transition shadow-lg flex items-center gap-1.5 text-sm font-medium"
              title="Remove"
            >
              <FaTrash size={12} />
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 sm:p-6 rounded-xl border border-yellow-100">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-yellow-600">
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
            <span className="text-2xl">📄</span> Document Images
          </h3>
          {Object.values(compressing).some(val => val) && (
            <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold animate-pulse">
              Uploading...
            </span>
          )}
        </div>

        {/* Document Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* PUC Image */}
          <DocumentImageCard
            label="PUC Certificate"
            fieldName="pucImage"
            previewUrl={previewImages.pucImage}
          />

          {/* Insurance Image */}
          <DocumentImageCard
            label="Insurance Document"
            fieldName="insuranceImage"
            previewUrl={previewImages.insuranceImage}
          />

          {/* Other Documents */}
          <DocumentImageCard
            label="Other Documents"
            fieldName="documentImage"
            previewUrl={previewImages.documentImage}
          />
        </div>

        
      </div>

      {/* ✅ Enhanced Mobile-Friendly Modal */}
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
              <h3 className="text-base sm:text-lg font-bold">{viewImage.title}</h3>
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
                alt={viewImage.title}
                className="max-w-full max-h-full object-contain rounded-lg sm:shadow-lg"
              />
            </div>

            {/* Mobile: Pinch to zoom hint */}
            <div className="sm:hidden absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm text-gray-800 text-xs px-3 py-1.5 rounded-full shadow-lg">
              Pinch to zoom • Tap outside to close
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DocumentImagesSection;
