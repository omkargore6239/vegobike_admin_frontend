import apiClient from    "../../../api/apiConfig";

export const gpsTrackingApi = {
  // Get live GPS location
  getLiveLocation: (bookingId) =>
    apiClient.get(`/admin/device/${bookingId}/location`),

  // Finalize trip (turn off engine at trip end)
  finalizeTrip: (bookingId) =>
    apiClient.post(`/admin/device/${bookingId}/finalize`),

  // Turn engine ON (Relay ON) - ✅ FIXED: Changed parameter from bikeId to bookingId
  relayOn: (bookingId) =>
    apiClient.post(`/admin/device/${bookingId}/relay/on`),

  // Turn engine OFF (Relay OFF) - ✅ FIXED: Changed parameter from bikeId to bookingId
  relayOff: (bookingId) =>
    apiClient.post(`/admin/device/${bookingId}/relay/off`),
};

