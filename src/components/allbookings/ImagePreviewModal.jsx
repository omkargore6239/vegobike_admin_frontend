import React from 'react';
import { FaTimes } from 'react-icons/fa';

const ImagePreviewModal = ({ selectedImage, onClose }) => {
  if (!selectedImage) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-lg overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors z-10"
        >
          <FaTimes />
        </button>
        <div className="p-4">
          <h3 className="text-lg font-bold mb-2 text-gray-900">{selectedImage.name}</h3>
          <img
            src={selectedImage.url}
            alt={selectedImage.name}
            className="max-w-full max-h-[80vh] object-contain mx-auto"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>
    </div>
  );
};

export default ImagePreviewModal;
