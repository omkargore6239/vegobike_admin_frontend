import React from "react";
import LiveLocationMap from "./LiveLocationMap";
import { FaTimes, FaTachometerAlt, FaRoute, FaRoad, FaMapMarkerAlt } from "react-icons/fa";

export default function MapModal({ show, onClose, location }) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <FaMapMarkerAlt className="text-2xl" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Live Vehicle Tracking</h2>
                <p className="text-sm text-indigo-100">Real-time GPS location</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-all"
              aria-label="Close"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="bg-gradient-to-r from-slate-50 to-gray-100 px-6 py-4 border-b grid grid-cols-3 gap-4">
          {/* Speed */}
          <div className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm">
            <div className="bg-green-100 p-2.5 rounded-lg">
              <FaTachometerAlt className="text-green-600 text-xl" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Speed</p>
              <p className="text-lg font-bold text-gray-900">
                {location?.speed || 0} <span className="text-sm text-gray-500">km/h</span>
              </p>
            </div>
          </div>

          {/* Today's Distance */}
          <div className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm">
            <div className="bg-blue-100 p-2.5 rounded-lg">
              <FaRoute className="text-blue-600 text-xl" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Today</p>
              <p className="text-lg font-bold text-gray-900">
                {((location?.todayDistance || 0) / 1000).toFixed(2)}{" "}
                <span className="text-sm text-gray-500">km</span>
              </p>
            </div>
          </div>

          {/* Total Distance */}
          <div className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm">
            <div className="bg-purple-100 p-2.5 rounded-lg">
              <FaRoad className="text-purple-600 text-xl" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Total</p>
              <p className="text-lg font-bold text-gray-900">
                {((location?.totalDistance || 0) / 1000).toFixed(2)}{" "}
                <span className="text-sm text-gray-500">km</span>
              </p>
            </div>
          </div>
        </div>

        {/* Map Container */}
        <div className="p-4 bg-gray-50">
          <div className="rounded-xl overflow-hidden shadow-lg border border-gray-200">
            <LiveLocationMap location={location} />
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
            <span>Live tracking active</span>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-lg font-semibold text-sm transition-all shadow-md hover:shadow-lg"
          >
            Close Map
          </button>
        </div>
      </div>
    </div>
  );
}
