import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import { useEffect, useState, useMemo } from "react";

const containerStyle = {
  width: "100%",
  height: "500px",
};

function Map() {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  const [locations, setLocations] = useState([]);

  // Memoize center to prevent unnecessary re-renders
  const center = useMemo(() => ({
    lat: 10.3157,
    lng: 123.8854,
  }), []);

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL;
    // Ensure no double slashes if VITE_API_URL ends in /
    const cleanUrl = apiUrl.endsWith('/') ? `${apiUrl}locations` : `${apiUrl}/locations`;

    fetch(cleanUrl)
      .then(res => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then(data => {
        console.log("Fetched locations:", data);
        setLocations(Array.isArray(data) ? data : []);
      })
      .catch(err => console.error("Fetch error:", err));
  }, []);

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <p>Loading map...</p>;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={13}
    >
      {locations.map((loc) => (
        <Marker
          key={loc.id || `${loc.lat}-${loc.lng}`}
          position={{ 
            lat: Number(loc.lat), 
            lng: Number(loc.lng) 
          }}
        />
      ))}
    </GoogleMap>
  );
}

export default Map;