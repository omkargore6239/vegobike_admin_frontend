export const FUEL_TYPE_OPTIONS = [
  { value: "PETROL", label: "⛽ Petrol" },
  { value: "DIESEL", label: "🛢️ Diesel" },
  { value: "ELECTRIC", label: "⚡ Electric" },
  { value: "HYBRID", label: "🔋 Hybrid" },
];

export const getCurrentYears = () => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 30 }, (_, i) => currentYear - i);
};
