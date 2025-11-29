import React from 'react';
import { FaCamera } from 'react-icons/fa';
import { BASE_URL } from '../../api/apiConfig';

const TripImageCard = ({ label, imageData, onImageClick }) => {
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;

    // ✅ If already full URL (http/https), use it directly
    if (
      imagePath.startsWith('http://') ||
      imagePath.startsWith('https://') ||
      imagePath.startsWith('data:image')
    ) {
      return imagePath;
    }

    // ✅ Otherwise, it's a relative path - add BASE_URL
    const cleanPath = imagePath.replace(/^\/+/, '');
    return `${BASE_URL}/${cleanPath}`;
  };

  const imageUrl = getImageUrl(imageData);
  const hasImage = imageUrl && imageUrl.trim() !== '';

  const handleError = (e) => {
    console.error(`❌ Failed to load ${label}:`, imageUrl);
    e.target.onerror = null;
    e.target.style.display = 'none';
    e.target.parentNode.innerHTML = `
      <div class="text-center p-2 sm:p-4">
        <div class="text-red-500 text-2xl sm:text-3xl mb-2">⚠️</div>
        <p class="text-red-500 text-xs">Failed to load</p>
      </div>
    `;
  };

  return (
    <div className="bg-white rounded-lg shadow-md border p-2 sm:p-3">
      <h3 className="text-xs sm:text-sm font-bold text-gray-900 mb-1 sm:mb-2 truncate">{label}</h3>

      <div
        className={`w-full h-32 sm:h-40 bg-gray-100 border-2 ${
          hasImage ? 'border-indigo-200 cursor-pointer hover:border-indigo-400' : 'border-gray-200'
        } flex items-center justify-center rounded-lg overflow-hidden transition-all`}
        onClick={() => hasImage && onImageClick(imageUrl, label)}
      >
        {hasImage ? (
          <img
            src={imageUrl}
            alt={label}
            className="w-full h-full object-cover"
            crossOrigin="anonymous"
            onError={handleError}
          />
        ) : (
          <div className="text-center">
            <FaCamera className="text-gray-300 text-2xl sm:text-3xl mx-auto mb-1 sm:mb-2" />
            <p className="text-gray-400 text-xs">No image</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TripImageCard;
