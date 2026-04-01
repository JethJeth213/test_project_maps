import { GoogleMap, useJsApiLoader, MarkerF } from "@react-google-maps/api";
import { useEffect, useState } from "react";

const containerStyle = {
  width: "100%",
  height: "500px",
};

const center = {
  lat: 10.3157,
  lng: 123.8854,
};

function Map() {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  const [locations, setLocations] = useState([]);

  useEffect(() => {
    const fetchUrl = `${import.meta.env.VITE_API_URL.replace(/\/$/, "")}/locations`;
    
    fetch(fetchUrl)
      .then(res => res.json())
      .then(data => {
        console.log("Raw Backend Data:", data);
        setLocations(Array.isArray(data) ? data : []);
      })
      .catch(err => console.error("Vercel Fetch Error:", err));
  }, []);

  if (!isLoaded) return <div>Loading Map...</div>;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={13}
    >
      {/* 1. TEST MARKER: If this shows up, your API is working fine */}
      <MarkerF 
        position={center} 
        label="TEST"
      />

      {/* 2. DYNAMIC MARKERS: Using MarkerF and Float conversion */}
      {locations.map((loc) => (
        <MarkerF
          key={loc.id || Math.random()}
          position={{ 
            lat: parseFloat(loc.lat), 
            lng: parseFloat(loc.lng) 
          }}
        />
      ))}
    </GoogleMap>
  );
}

export default Map;