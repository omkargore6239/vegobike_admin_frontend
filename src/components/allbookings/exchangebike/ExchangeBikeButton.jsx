import React, { useState } from 'react';
import { FaExchangeAlt } from 'react-icons/fa';
import ExchangeBikeModal from './ExchangeBikeModal';

const ExchangeBikeButton = ({ booking, onBikeExchanged }) => {
  const [showModal, setShowModal] = useState(false);

  // Only show button for active bookings
  const isActiveBooking = ['Accepted', 'Start Trip', 'Extend Trip'].includes(booking.status);

  if (!isActiveBooking) {
    return null;
  }

  const handleExchanged = () => {
    setShowModal(false);
    if (onBikeExchanged) {
      onBikeExchanged();
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-lg font-semibold text-sm transition-all shadow-md hover:shadow-lg hover:scale-105"
      >
        <FaExchangeAlt className="text-lg" />
        <span>Exchange Bike</span>
      </button>

      <ExchangeBikeModal
        show={showModal}
        onClose={() => setShowModal(false)}
        bookingId={booking.id}
        currentBikeId={booking.bikeDetails?.id || booking.vehicleId}
        onExchanged={handleExchanged}
      />
    </>
  );
};

export default ExchangeBikeButton;
