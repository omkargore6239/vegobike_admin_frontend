import { BASE_URL } from "../utils/batteryConstants";
import { getAuthToken } from "../utils/batteryHelpers";

const getHeaders = (includeContentType = true) => {
  const headers = {
    Authorization: `Bearer ${getAuthToken()}`,
  };

  if (includeContentType) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
};

export const batteryAPI = {
  // Get all batteries with filters
  getAll: async (params) => {
    const response = await fetch(`${BASE_URL}/api/batteries/getall?${params}`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("UNAUTHORIZED");
      }
      throw new Error(`Failed to fetch batteries: ${response.status}`);
    }

    return response.json();
  },

  // Get battery by ID
  getById: async (id) => {
    const response = await fetch(`${BASE_URL}/api/batteries/${id}`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch battery: ${response.status}`);
    }

    return response.json();
  },

  // Create new battery
  create: async (formData) => {
    const response = await fetch(`${BASE_URL}/api/batteries/add/battery`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: formData, // FormData with image
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      throw new Error(errorData.message || `Server returned ${response.status}`);
    }

    return response.json();
  },

  // Update battery
  update: async (id, data) => {
    const response = await fetch(`${BASE_URL}/api/batteries/update/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      throw new Error(errorData.message || `Server returned ${response.status}`);
    }

    return response.json();
  },

  // Update battery status
  updateStatus: async (id, newStatus) => {
    const response = await fetch(`${BASE_URL}/api/batteries/${id}/status`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ newStatus }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Failed to update status");
    }

    return response.json();
  },

  // Get batteries by status
  getByStatus: async (statusCode) => {
    const response = await fetch(`${BASE_URL}/api/batteries/status/${statusCode}`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch batteries: ${response.status}`);
    }

    return response.json();
  },
};

export const cityAPI = {
  getActive: async () => {
    const response = await fetch(`${BASE_URL}/api/cities/active`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch cities");
    }

    return response.json();
  },
};

export const storeAPI = {
  getActive: async () => {
    const response = await fetch(`${BASE_URL}/api/stores/active`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch stores");
    }

    return response.json();
  },

  getByCity: async (cityId) => {
    const response = await fetch(`${BASE_URL}/api/stores/active/by-city?cityId=${cityId}`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch stores");
    }

    return response.json();
  },
};
