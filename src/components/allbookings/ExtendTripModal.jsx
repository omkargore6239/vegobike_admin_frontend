import React from 'react';
import { FaTimes } from 'react-icons/fa';

const ExtendTripModal = ({
  show,
  onClose,
  newEndDateTime,
  setNewEndDateTime,
  onConfirm,
  loading,
  currentEndDate
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Extend Trip</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes />
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current End Time
          </label>
          <input
            type="text"
            value={new Date(currentEndDate).toLocaleString('en-IN')}
            disabled
            className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            New End Date & Time
          </label>
          <input
            type="datetime-local"
            value={newEndDateTime}
            onChange={(e) => setNewEndDateTime(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading || !newEndDateTime}
            className={`flex-1 px-4 py-2 rounded-lg text-white transition-colors ${
              loading || !newEndDateTime
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {loading ? 'Extending...' : 'Extend Trip'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExtendTripModal;
