import React from "react";
import { getStatusBadge } from "../utils/batteryHelpers";

const BatteryStatusBadge = ({ statusCode }) => {
  const status = getStatusBadge(statusCode);

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r ${status.color} text-white shadow-sm`}
    >
      {status.label}
    </span>
  );
};

export default BatteryStatusBadge;
