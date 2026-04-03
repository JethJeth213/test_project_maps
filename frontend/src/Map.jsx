import { GoogleMap, useJsApiLoader, MarkerF, DirectionsService, DirectionsRenderer } from "@react-google-maps/api";
import { useState, useCallback } from "react";

const containerStyle = { width: "100%", height: "500px" };
const center = { lat: 10.3002, lng: 123.8917 };

function Map() {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    // Add 'places' if you want to use Autocomplete later
    libraries: ['places'] 
  });

  const [response, setResponse] = useState(null);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [routeIndex, setRouteIndex] = useState(0);

  // 1. Callback when DirectionsService returns data
  const directionsCallback = useCallback((res) => {
    if (res !== null && res.status === 'OK') {
      setResponse(res);
    } else {
      console.error("Directions Request Failed:", res);
    }
  }, []);

  // 2. Trigger the search
  const handleSearch = () => {
    if (origin !== "" && destination !== "") {
      setResponse(null); // Reset before new search
    }
  };

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {/* INPUT UI */}
      <div style={{ padding: "10px", background: "#f4f4f4", borderRadius: "8px" }}>
        <input 
          placeholder="From (e.g. Cebu City)" 
          onChange={(e) => setOrigin(e.target.value)} 
          style={{ marginRight: "10px", padding: "5px" }}
        />
        <input 
          placeholder="To (e.g. Mandaue City)" 
          onChange={(e) => setDestination(e.target.value)} 
          style={{ marginRight: "10px", padding: "5px" }}
        />
        <button onClick={handleSearch} style={{ padding: "5px 15px", cursor: "pointer" }}>
          Find Routes
        </button>
      </div>

      <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={13}>
        {/* DIRECTIONS LOGIC */}
        {origin !== "" && destination !== "" && response === null && (
          <DirectionsService
            options={{
              origin: origin,
              destination: destination,
              travelMode: "DRIVING",
              provideRouteAlternatives: true, // This allows multiple routes
            }}
            callback={directionsCallback}
          />
        )}

        {response !== null && (
          <DirectionsRenderer
            options={{
              directions: response,
              routeIndex: routeIndex, // Controls which route is highlighted
            }}
          />
        )}
      </GoogleMap>

      {/* ETA DISPLAY */}
      {response && (
        <div style={{ marginTop: "10px" }}>
          <h3>Available Routes:</h3>
          {response.routes.map((route, index) => (
            <div 
              key={index} 
              onClick={() => setRouteIndex(index)}
              style={{ 
                padding: "10px", 
                border: "1px solid #ccc", 
                marginBottom: "5px", 
                cursor: "pointer",
                backgroundColor: routeIndex === index ? "#e0f7fa" : "white"
              }}
            >
              <strong>Route {index + 1}:</strong> {route.summary} <br />
              <span>Distance: {route.legs[0].distance.text}</span> | 
              <span style={{ color: "green" }}> ETA: {route.legs[0].duration.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Map;