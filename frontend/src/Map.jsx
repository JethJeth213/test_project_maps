import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import { useEffect, useState } from "react";

const containerStyle = {
  width: "100%",
  height: "500px",
};

function Map() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  const [locations, setLocations] = useState([]);

  const center = {
    lat: 10.3157,
    lng: 123.8854,
  };

  useEffect(() => {
    fetch("http://127.0.0.1:8000/locations")
      .then((res) => res.json())
      .then((data) => setLocations(data));
  }, []);

  if (!isLoaded) return <p>Loading map...</p>;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={13}
    >
      {locations.map((loc) => (
        <Marker
          key={loc.id}
          position={{ lat: loc.lat, lng: loc.lng }}
        />
      ))}
    </GoogleMap>
  );
}

export default Map;