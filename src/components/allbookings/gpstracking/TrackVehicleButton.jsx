import React, { useState } from "react";
import useLiveTracking from "../hooks/useLiveTracking";
import MapModal from "./MapModal";
import { FaMapMarkedAlt } from "react-icons/fa";

export default function TrackVehicleButton({ bookingId }) {
  const { location, startLive, stopLive } = useLiveTracking(bookingId);
  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    startLive();
    setOpen(true);
  };

  const handleClose = () => {
    stopLive();
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="bg-blue-600 text-white px-3 py-2 rounded-lg"
      >
        <FaMapMarkedAlt className="inline mr-1" />
        Track Vehicle
      </button>

      <MapModal show={open} onClose={handleClose} location={location} />
    </>
  );
}
