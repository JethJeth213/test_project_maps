import { GoogleMap, useJsApiLoader, DirectionsService, DirectionsRenderer, Autocomplete } from "@react-google-maps/api";
import { useState, useCallback, useRef, useEffect } from "react";

const containerStyle = { width: "100%", height: "600px" };
const center = { lat: 10.3157, lng: 123.8854 };
const libraries = ["places"];

function Map() {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  // State for the raw input (changes every keystroke)
  const [originInput, setOriginInput] = useState("");
  const [destInput, setDestInput] = useState("");
  
  // State for the "Debounced" values (only changes after pause)
  const [debouncedOrigin, setDebouncedOrigin] = useState("");
  const [debouncedDest, setDebouncedDest] = useState("");

  const [response, setResponse] = useState(null);
  const [routeIndex, setRouteIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);

  // 1. DEBOUNCE LOGIC
  useEffect(() => {
    if (!originInput && !destInput) return;

    setIsTyping(true);
    // Set a timer (e.g., 5000ms = 5 seconds)
    const delayDebounceFn = setTimeout(() => {
      setDebouncedOrigin(originInput);
      setDebouncedDest(destInput);
      setResponse(null); // Clear old routes to trigger new fetch
      setIsTyping(false);
    }, 5000); 

    // Cleanup: This cancels the timer if the user types again before it finishes
    return () => clearTimeout(delayDebounceFn);
  }, [originInput, destInput]);

  const directionsCallback = useCallback((res) => {
    if (res !== null && res.status === 'OK') {
      setResponse(res);
      setRouteIndex(0);
    }
  }, []);

  if (!isLoaded) return <div>Loading Map...</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "15px", padding: "10px" }}>
      
      {/* SEARCH BAR */}
      <div style={{ padding: "15px", background: "#fff", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", borderRadius: "8px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
          
          <Autocomplete onPlaceChanged={() => {}}>
            <input
              type="text"
              placeholder="Origin..."
              value={originInput}
              onChange={(e) => setOriginInput(e.target.value)}
              style={{ width: "300px", padding: "12px", borderRadius: "4px", border: "1px solid #ccc" }}
            />
          </Autocomplete>

          <Autocomplete onPlaceChanged={() => {}}>
            <input
              type="text"
              placeholder="Destination..."
              value={destInput}
              onChange={(e) => setDestInput(e.target.value)}
              style={{ width: "300px", padding: "12px", borderRadius: "4px", border: "1px solid #ccc" }}
            />
          </Autocomplete>

          {isTyping && (
            <span style={{ color: "#666", fontSize: "0.9em", fontStyle: "italic" }}>
              Waiting for you to finish typing... (5s delay)
            </span>
          )}
        </div>
      </div>

      <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={13}>
        {/* Only call API when we have debounced values and no active response */}
        {debouncedOrigin && debouncedDest && !response && (
          <DirectionsService
            options={{
              origin: debouncedOrigin,
              destination: debouncedDest,
              travelMode: "DRIVING",
              provideRouteAlternatives: true,
            }}
            callback={directionsCallback}
          />
        )}

        {response && (
          <>
            {/* Render Yellow (Unselected) Routes */}
            {response.routes.map((route, index) => {
                if (index === routeIndex) return null;
                return (
                    <DirectionsRenderer
                        key={index}
                        options={{
                            directions: response,
                            routeIndex: index,
                            suppressMarkers: true,
                            polylineOptions: { strokeColor: "#FBC02D", strokeOpacity: 0.5, strokeWeight: 5, zIndex: 5 }
                        }}
                    />
                );
            })}

            {/* Render Blue (Selected) Route */}
            <DirectionsRenderer
              options={{
                directions: response,
                routeIndex: routeIndex,
                polylineOptions: { strokeColor: "#1976D2", strokeOpacity: 1, strokeWeight: 6, zIndex: 10 }
              }}
            />
          </>
        )}
      </GoogleMap>

      {/* ROUTE LIST */}
      {response && !isTyping && (
        <div style={{ padding: "10px", background: "#f9f9f9", borderRadius: "8px" }}>
          <h3>Available Routes</h3>
          <div style={{ display: "flex", gap: "10px" }}>
            {response.routes.map((route, index) => (
              <div 
                key={index}
                onClick={() => setRouteIndex(index)}
                style={{
                  padding: "15px",
                  border: "2px solid",
                  borderColor: routeIndex === index ? "#1976D2" : "#FBC02D",
                  borderRadius: "6px",
                  cursor: "pointer",
                  backgroundColor: routeIndex === index ? "#E3F2FD" : "#FFFDE7"
                }}
              >
                <strong>Route {index + 1}</strong>
                <div>ETA: {route.legs[0].duration.text}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Map;