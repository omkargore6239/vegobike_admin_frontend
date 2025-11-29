// Battery Status Configuration matching YOUR EXACT BACKEND ENUM
export const BATTERY_STATUS = {
  0: {
    code: 0,
    label: "OUT OF SERVICE",
    enumLabel: "out_of_service",
    color: "from-red-500 to-rose-600",
    bgColor: "bg-red-50",
    textColor: "text-red-600",
    description: "Battery is not operational",
  },
  1: {
    code: 1,
    label: "IN BIKE",
    enumLabel: "in_bike",
    color: "from-green-500 to-emerald-500",
    bgColor: "bg-green-50",
    textColor: "text-green-600",
    description: "Battery is assigned to a bike",
  },
  2: {
    code: 2,
    label: "CHARGING",
    enumLabel: "charging",
    color: "from-yellow-500 to-amber-500",
    bgColor: "bg-yellow-50",
    textColor: "text-yellow-600",
    description: "Battery is being charged",
  },
  3: {
    code: 3,
    label: "OPEN",
    enumLabel: "open",
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-50",
    textColor: "text-blue-600",
    description: "Battery is available and ready",
  },
};

// Statuses available for manual selection (excludes IN_BIKE)
export const BATTERY_STATUS_OPTIONS = [
  BATTERY_STATUS[0], // OUT OF SERVICE
  BATTERY_STATUS[2], // CHARGING
  BATTERY_STATUS[3], // OPEN
];

export const SEARCH_FIELDS = [
  { value: "batteryId", label: "Battery ID" },
  { value: "company", label: "Company" },
  { value: "storeName", label: "Store" },
  { value: "cityName", label: "City" },
];

export const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

export const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:8081";
