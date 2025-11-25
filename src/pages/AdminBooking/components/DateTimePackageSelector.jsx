import React, { useState, useEffect } from "react";
import { FaCalendar, FaClock, FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { toast } from "react-toastify";

const DateTimePackageSelector = ({ initialData, onNext, onBack }) => {
  const [startDate, setStartDate] = useState(initialData.startDate || "");
  const [endDate, setEndDate] = useState(initialData.endDate || "");

  // Get minimum selectable date-time - current date rounded to nearest 5 mins or next minute
  const getMinDateTimeLocal = () => {
    const now = new Date();
    now.setSeconds(0);
    now.setMilliseconds(0);
    // Optional: round up to next 5 minutes
    const minutes = now.getMinutes();
    now.setMinutes(minutes + (5 - (minutes % 5)));
    return now.toISOString().slice(0, 16);
  };

  const minDateTime = getMinDateTimeLocal();

  // Format date as DD/MM/YYYY HH:MM
  const formatDateDisplay = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const calculateDuration = () => {
    if (!startDate || !endDate) return null;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMs = end - start;
    if (diffMs <= 0) return null;
    const hours = diffMs / (1000 * 60 * 60);
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return { hours, days, remainingHours };
  };

  const duration = calculateDuration();

  // Validate dates on clicking "Check Available Bikes"
  const handleNext = () => {
    if (!startDate || !endDate) {
      toast.error("Please select both start and end date/time");
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (start < now) {
      toast.error("Start date/time cannot be in the past");
      return;
    }
    if (end <= start) {
      toast.error("End date/time must be after start date/time");
      return;
    }

    const diffHours = (end - start) / (1000 * 60 * 60);
    if (diffHours < 0.5) {
      toast.error("Minimum rental duration is 30 minutes");
      return;
    }

    onNext({
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    });
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        <FaCalendar className="inline mr-2 text-[#2B2B80]" />
        Step 3: Select Rental Period
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Start Date & Time */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FaClock className="inline mr-2" />
            Start Date & Time *
          </label>
          <input
            type="datetime-local"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            min={minDateTime}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2B2B80] focus:border-transparent"
          />
          {startDate && (
            <p className="text-xs text-gray-600 mt-2">
              📅 Selected: <strong>{formatDateDisplay(startDate)}</strong>
            </p>
          )}
        </div>

        {/* End Date & Time */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FaClock className="inline mr-2" />
            End Date & Time *
          </label>
          <input
            type="datetime-local"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate || minDateTime}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2B2B80] focus:border-transparent"
          />
          {endDate && (
            <p className="text-xs text-gray-600 mt-2">
              📅 Selected: <strong>{formatDateDisplay(endDate)}</strong>
            </p>
          )}
        </div>
      </div>

      {/* Duration Preview */}
      {duration && (
        <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl">
          <h4 className="font-bold text-blue-900 mb-4 text-lg">
            📊 Rental Duration Summary
          </h4>

          {/* Date Range Display */}
          <div className="mb-4 p-4 bg-white rounded-lg border border-blue-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-blue-700 block mb-1">From:</span>
                <p className="font-bold text-gray-900">
                  {formatDateDisplay(startDate)}
                </p>
              </div>
              <div>
                <span className="text-blue-700 block mb-1">To:</span>
                <p className="font-bold text-gray-900">
                  {formatDateDisplay(endDate)}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-white rounded-lg p-4 text-center border border-blue-200">
              <span className="text-blue-700 text-sm block mb-2">Total Hours</span>
              <p className="font-bold text-blue-900 text-2xl">
                {duration.hours.toFixed(1)}h
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 text-center border border-blue-200">
              <span className="text-blue-700 text-sm block mb-2">Full Days</span>
              <p className="font-bold text-blue-900 text-2xl">{duration.days}d</p>
            </div>
            <div className="bg-white rounded-lg p-4 text-center border border-blue-200">
              <span className="text-blue-700 text-sm block mb-2">Extra Hours</span>
              <p className="font-bold text-blue-900 text-2xl">
                {duration.remainingHours.toFixed(1)}h
              </p>
            </div>
          </div>

          {/* Pricing Logic Explanation */}
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-blue-800 mb-2">
              <strong>💡 Backend Pricing Logic:</strong>
            </p>
            <p className="text-xs text-blue-700 leading-relaxed">
              {duration.hours < 24
                ? duration.hours > 6
                  ? "⚡ Will be charged as 1 full day (more than 6 hours)"
                  : "⚡ Will be charged at hourly rate"
                : `⚡ ${duration.days} full day(s)${
                    duration.remainingHours > 6
                      ? " + 1 additional day (remainder > 6h)"
                      : duration.remainingHours > 0
                      ? ` + ${duration.remainingHours.toFixed(1)}h at hourly rate`
                      : ""
                  }`}
            </p>
          </div>
        </div>
      )}

      {/* Info Message */}
      <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-sm text-amber-800">
          📦 <strong>Note:</strong> Packages can be selected for each bike in the
          next step (optional). If no package is selected, pricing will be
          calculated based on the duration above.
        </p>
      </div>

      {/* Navigation Buttons */}
      <div className="mt-8 flex justify-between">
        <button
          onClick={onBack}
          className="px-8 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2 font-semibold transition-all"
        >
          <FaArrowLeft />
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={!startDate || !endDate}
          className="px-8 py-3 bg-gradient-to-r from-[#2B2B80] to-[#1a1a4d] text-white rounded-lg hover:from-[#1f1f60] hover:to-[#0f0f3a] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-semibold transition-all shadow-lg hover:shadow-xl"
        >
          Check Available Bikes
          <FaArrowRight />
        </button>
      </div>
    </div>
  );
};

export default DateTimePackageSelector;
