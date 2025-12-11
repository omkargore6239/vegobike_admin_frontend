import React, { useEffect, useRef } from "react";

export default function LiveLocationMap({ location }) {
  const mapRef = useRef(null);
  const mapObj = useRef(null);
  const markerObj = useRef(null);

  useEffect(() => {
    if (!window.google) {
      console.error("Google Maps script NOT loaded!");
      return;
    }
    if (!location || !location.latitude || !location.longitude) return;

    const pos = { lat: location.latitude, lng: location.longitude };

    // First time load → create map
    if (!mapObj.current) {
      mapObj.current = new window.google.maps.Map(mapRef.current, {
        center: pos,
        zoom: 16,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
        ],
      });

     const bikeIcon = {
  url: "/motorbike.svg", // directly from public folder
  scaledSize: new window.google.maps.Size(45, 45),
  anchor: new window.google.maps.Point(22, 22),
};

      markerObj.current = new window.google.maps.Marker({
        position: pos,
        map: mapObj.current,
        title: "Vehicle Current Location",
        icon: bikeIcon,
        animation: window.google.maps.Animation.DROP,
      });

      // ✅ Add info window on marker click
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; font-family: sans-serif;">
            <h3 style="margin: 0 0 8px 0; color: #4F46E5; font-size: 16px; font-weight: bold;">
              🏍️ Vehicle Location
            </h3>
            <p style="margin: 4px 0; font-size: 13px; color: #666;">
              <strong>Lat:</strong> ${pos.lat.toFixed(6)}<br/>
              <strong>Lng:</strong> ${pos.lng.toFixed(6)}
            </p>
          </div>
        `,
      });

      markerObj.current.addListener("click", () => {
        infoWindow.open(mapObj.current, markerObj.current);
      });
    } else {
      // For refreshing only update marker and map center
      mapObj.current.setCenter(pos);
      markerObj.current.setPosition(pos);
      
      // ✅ Smooth pan animation
      mapObj.current.panTo(pos);
    }
  }, [location]);

  return (
    <div
      ref={mapRef}
      style={{ 
        width: "100%", 
        height: "450px",
        background: "#f3f4f6"
      }}
    >
      {!location?.latitude && (
        <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="animate-pulse mb-4">
            <svg
              className="w-16 h-16 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <p className="text-lg font-semibold">📡 Waiting for GPS signal...</p>
          <p className="text-sm text-gray-400 mt-2">Location will appear shortly</p>
        </div>
      )}
    </div>
  );
}
