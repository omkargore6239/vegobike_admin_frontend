import apiClient from    "../../../api/apiConfig";

export const gpsTrackingApi = {
  getLiveLocation: (bookingId) =>
    apiClient.get(`/admin/device/${bookingId}/location`),

  finalizeTrip: (bookingId) =>
    apiClient.post(`/admin/device/${bookingId}/finalize`),

  relayOn: (bikeId) =>
    apiClient.post(`/admin/device/${bikeId}/relay/on`),

  relayOff: (bikeId) =>
    apiClient.post(`/admin/device/${bikeId}/relay/off`),
};

