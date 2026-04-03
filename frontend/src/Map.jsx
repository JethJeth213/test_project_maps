import { GoogleMap, useJsApiLoader, MarkerF, DirectionsService, DirectionsRenderer, Autocomplete } from "@react-google-maps/api";
import { useState, useCallback, useRef } from "react";

const containerStyle = { width: "100%", height: "500px" };
const center = { lat: 10.3002, lng: 123.8917 };
// Define libraries outside to prevent unnecessary re-renders
const libraries = ["places"];

function Map() {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const [response, setResponse] = useState(null);
  const [routeIndex, setRouteIndex] = useState(0);
  
  // Refs to access the Autocomplete instances
  const originRef = useRef(null);
  const destinationRef = useRef(null);
  
  // State for the actual location strings
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");

  const directionsCallback = useCallback((res) => {
    if (res !== null && res.status === 'OK') {
      setResponse(res);
    }
  }, []);

  const handleSearch = () => {
    // Get values from the autocomplete input fields
    const originValue = originRef.current.value;
    const destValue = destinationRef.current.value;

    if (originValue && destValue) {
      setOrigin(originValue);
      setDestination(destValue);
      setResponse(null); // Clear previous route to trigger new request
    }
  };

  if (!isLoaded) return <div>Loading Map...</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {/* SEARCH BAR */}
      <div style={{ padding: "15px", background: "#fff", boxShadow: "0 2px 6px rgba(0,0,0,0.3)", borderRadius: "4px" }}>
        <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
          
          <Autocomplete>
            <input
              type="text"
              placeholder="From (e.g. CTU Main)"
              ref={originRef}
              style={{ width: "250px", padding: "10px" }}
            />
          </Autocomplete>

          <Autocomplete>
            <input
              type="text"
              placeholder="To (e.g. Ayala Center)"
              ref={destinationRef}
              style={{ width: "250px", padding: "10px" }}
            />
          </Autocomplete>

          <button onClick={handleSearch} style={{ padding: "10px 20px", background: "#4285F4", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
            Get Routes
          </button>
        </div>
      </div>

      <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={13}>
        {/* Only run DirectionsService when we have both locations and no response yet */}
        {origin && destination && !response && (
          <DirectionsService
            options={{
              origin: origin,
              destination: destination,
              travelMode: "DRIVING",
              provideRouteAlternatives: true,
            }}
            callback={directionsCallback}
          />
        )}

        {response && (
          <DirectionsRenderer
            options={{
              directions: response,
              routeIndex: routeIndex,
            }}
          />
        )}
      </GoogleMap>

      {/* ROUTE DETAILS & ETA */}
      {response && (
        <div style={{ padding: "10px" }}>
          <h4>Suggested Routes</h4>
          {response.routes.map((route, index) => (
            <div 
              key={index}
              onClick={() => setRouteIndex(index)}
              style={{
                padding: "10px",
                border: "2px solid",
                borderColor: routeIndex === index ? "#4285F4" : "#eee",
                borderRadius: "5px",
                marginBottom: "8px",
                cursor: "pointer",
                backgroundColor: routeIndex === index ? "#f0f7ff" : "#fff"
              }}
            >
              <div style={{ fontWeight: "bold" }}>Route {index + 1}: {route.summary}</div>
              <div style={{ color: "#555" }}>
                {route.legs[0].distance.text} — <span style={{ color: "#1a73e8" }}>{route.legs[0].duration.text} ETA</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Map;