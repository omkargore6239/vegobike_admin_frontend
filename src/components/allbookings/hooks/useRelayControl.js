import { gpsTrackingApi } from "../utils/gpsTrackingApi";
import { toast } from "react-toastify";

export default function useRelayControl() {
  const finalizeTrip = async (bookingId) => {
    try {
      const res = await gpsTrackingApi.finalizeTrip(bookingId);
      toast.success(res.data.message || "Trip finalized!");
    } catch (err) {
      console.error("Finalize Error:", err);
      toast.error("Relay Off failed");
    }
  };

  return { finalizeTrip };
}
