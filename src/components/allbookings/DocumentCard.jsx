import React from 'react';
import { FaFileAlt, FaCheckCircle, FaTimesCircle, FaClock, FaExclamationTriangle } from 'react-icons/fa';
import { BASE_URL } from '../../api/apiConfig';

const DocumentCard = ({ 
  label, 
  docType, 
  imageData, 
  status, 
  updating, 
  onVerify, 
  onReject,
  onImageClick 
}) => {
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    // ✅ If already full URL (http/https), use it directly
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('data:image')) {
      return imagePath;
    }
    
    // ✅ Otherwise, it's a relative path - add BASE_URL
    const cleanPath = imagePath.replace(/^\/+/, '');
    return `${BASE_URL}/${cleanPath}`;
  };

  const imageUrl = getImageUrl(imageData);
  const hasImage = imageUrl && imageUrl.trim() !== '';

  return (
    <div className="bg-white rounded-lg shadow-md border p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold text-gray-900">{label}</h3>
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
          status === 'VERIFIED' ? 'bg-green-100 text-green-700' :
          status === 'REJECTED' ? 'bg-red-100 text-red-700' :
          'bg-yellow-100 text-yellow-700'
        }`}>
          {status}
        </span>
      </div>

      <div 
        className={`w-full h-40 bg-gray-100 border-2 ${
          hasImage ? 'border-indigo-200 cursor-pointer' : 'border-gray-200'
        } flex items-center justify-center rounded-lg overflow-hidden`}
        onClick={() => hasImage && onImageClick(imageUrl, label)}
      >
        {hasImage ? (
          <img 
            src={imageUrl} 
            alt={label} 
            className="w-full h-full object-cover"
            crossOrigin="anonymous"
            onError={(e) => {
              console.error(`❌ Failed to load ${label}:`, imageUrl);
              e.target.style.display = 'none';
              e.target.parentNode.innerHTML = `
                <div class="text-center p-4">
                  <div class="text-red-500 text-3xl mb-2">⚠️</div>
                  <p class="text-red-500 text-xs">Failed to load</p>
                </div>
              `;
            }}
          />
        ) : (
          <div className="text-center">
            <FaFileAlt className="text-gray-300 text-3xl mx-auto mb-2" />
            <p className="text-gray-400 text-xs">No document uploaded</p>
          </div>
        )}
      </div>

      {hasImage && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => onVerify(docType)}
            disabled={updating || status === 'VERIFIED'}
            className={`flex-1 flex items-center justify-center px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
              status === 'VERIFIED'
                ? 'bg-green-100 text-green-700 cursor-not-allowed'
                : updating
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            <FaCheckCircle className="mr-1" />
            {status === 'VERIFIED' ? 'Verified' : updating ? 'Updating...' : 'Verify'}
          </button>
          <button
            onClick={() => onReject(docType)}
            disabled={updating || status === 'REJECTED'}
            className={`flex-1 flex items-center justify-center px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
              status === 'REJECTED'
                ? 'bg-red-100 text-red-700 cursor-not-allowed'
                : updating
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            <FaTimesCircle className="mr-1" />
            {status === 'REJECTED' ? 'Rejected' : updating ? 'Updating...' : 'Reject'}
          </button>
        </div>
      )}
    </div>
  );
};

export default DocumentCard;
