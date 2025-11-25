// src/pages/AdminBooking/components/SuccessModal.jsx
import React, { useEffect, useRef } from "react";
import { FaCheckCircle, FaTimes } from "react-icons/fa";

const SuccessModal = ({ bookingDetails, onClose }) => {
  const modalRef = useRef();

  // Close on ESC
  useEffect(() => {
    const onEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [onClose]);

  // Close on background click
  const handleBackdropClick = (e) => {
    if (e.target === modalRef.current) onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      ref={modalRef}
      onClick={handleBackdropClick}
      tabIndex={-1}
      aria-modal="true"
      role="dialog"
    >
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 animate-fadeIn relative shadow-2xl">
        {/* Close (X) Button */}
        <button
          onClick={onClose}
          title="Close"
          className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors text-2xl focus:outline-none"
        >
          <FaTimes />
        </button>

        <div className="text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaCheckCircle className="text-5xl text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Booking Successful!
          </h2>
          <div className="bg-gray-50 rounded-lg p-4 my-6">
            <p className="text-sm text-gray-600 mb-2">Booking ID</p>
            <p className="text-3xl font-bold text-[#2B2B80]">
              {bookingDetails.bookingId}
            </p>
          </div>
          <p className="text-gray-600 mb-6">
            {bookingDetails.message || "Booking created successfully!"}
          </p>
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-[#2B2B80] text-white rounded-lg hover:bg-[#1a1a4d] font-semibold text-lg mt-2"
          >
            Create Another Booking
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;
