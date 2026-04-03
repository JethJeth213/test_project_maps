import { GoogleMap, useJsApiLoader, MarkerF, DirectionsService, DirectionsRenderer, Autocomplete } from "@react-google-maps/api";
import { useState, useCallback, useRef } from "react";

const containerStyle = { width: "100%", height: "600px" }; // Increased height for better view
const center = { lat: 10.3157, lng: 123.8854 }; // Centered slightly differently for better default view
const libraries = ["places"];

function Map() {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const [response, setResponse] = useState(null);
  const [routeIndex, setRouteIndex] = useState(0); // Tracks selected route
  
  const originRef = useRef(null);
  const destinationRef = useRef(null);
  
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");

  const directionsCallback = useCallback((res) => {
    if (res !== null && res.status === 'OK') {
      setResponse(res);
      // Ensure the default selected index is valid for the new response
      setRouteIndex(0);
    } else {
      console.error("Directions request failed:", res?.status);
    }
  }, []);

  const handleSearch = () => {
    const originValue = originRef.current.value;
    const destValue = destinationRef.current.value;

    if (originValue && destValue) {
      setOrigin(originValue);
      setDestination(destValue);
      setResponse(null); // Clear to trigger a fresh DirectionsService request
    }
  };

  if (!isLoaded) return <div>Loading Map...</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "15px", padding: "10px" }}>
      {/* SEARCH BAR */}
      <div style={{ padding: "15px", background: "#fff", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", borderRadius: "8px" }}>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          
          <Autocomplete style={{ flex: 1 }}>
            <input
              type="text"
              placeholder="Origin (e.g., Ayala Center Cebu)"
              ref={originRef}
              style={{ width: "100%", padding: "12px", borderRadius: "4px", border: "1px solid #ccc" }}
            />
          </Autocomplete>

          <Autocomplete style={{ flex: 1 }}>
            <input
              type="text"
              placeholder="Destination (e.g., SM Seaside City)"
              ref={destinationRef}
              style={{ width: "100%", padding: "12px", borderRadius: "4px", border: "1px solid #ccc" }}
            />
          </Autocomplete>

          <button onClick={handleSearch} style={{ padding: "12px 24px", background: "#1a73e8", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>
            Find Routes
          </button>
        </div>
      </div>

      <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={13}>
        {/* DIRECTIONS LOGIC: Triggered when origin/destination change */}
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
          <>
            {/* 1. Unselected (Background) Routes - Yellow */}
            <DirectionsRenderer
              options={{
                directions: response,
                routeIndex: -1, // Setting index to -1 normally shows all, but we need precise control
                suppressMarkers: true, // Do not show A/B markers for background routes
                polylineOptions: {
                  strokeColor: "#F4B400", // Google Yellow
                  strokeOpacity: 0.6,
                  strokeWeight: 5,
                  zIndex: 1, // Lower priority
                },
              }}
              // Need to manually handle showing alternatives, 
              // as setting routeIndex alone doesn't change color properly for background
              {... (routeIndex !== -1 ? { options: {
                    directions: response,
                    // Filter routes to exclude the active one and show them yellow
                    routeIndex: -1,
                    suppressMarkers: true,
                    polylineOptions: {
                        strokeColor: "#F4B400", 
                        strokeOpacity: 0.5,
                        strokeWeight: 4,
                        zIndex: 1, 
                    }
                }} : {})}
            />

            {/* Alternative strategy for Background routes (more robust):
               Map through all routes EXCEPT the selected index and render them.
            */}
            {response.routes.map((route, index) => {
                if (index === routeIndex) return null; // Skip selected route
                return (
                    <DirectionsRenderer
                        key={`bg-route-${index}`}
                        options={{
                            directions: response,
                            routeIndex: index, // Render this specific background route
                            suppressMarkers: true, // No duplicate markers
                            polylineOptions: {
                                strokeColor: "#FBC02D", // Darker Yellow/Gold for visibility
                                strokeOpacity: 0.6,
                                strokeWeight: 5,
                                zIndex: 5, // Above standard map items, below active route
                            },
                        }}
                    />
                );
            })}

            {/* 2. Selected (Active) Route - Blue */}
            <DirectionsRenderer
              options={{
                directions: response,
                routeIndex: routeIndex, // Shows the user-selected route
                suppressMarkers: false, // Show standard A/B markers
                polylineOptions: {
                  strokeColor: "#1976D2", // Google Blue
                  strokeOpacity: 1.0,
                  strokeWeight: 6,
                  zIndex: 10, // Highest priority to be on top
                },
              }}
            />
          </>
        )}
      </GoogleMap>

      {/* ROUTE SELECTION PANEL & ETA */}
      {response && (
        <div style={{ padding: "10px", background: "#f9f9f9", borderRadius: "8px", border: "1px solid #eee" }}>
          <h3 style={{ marginTop: 0 }}>Available Routes</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {response.routes.map((route, index) => (
              <div 
                key={index}
                onClick={() => setRouteIndex(index)}
                style={{
                  flex: "1 1 calc(33.33% - 10px)", // 3 columns
                  minWidth: "250px",
                  padding: "15px",
                  border: "2px solid",
                  borderColor: routeIndex === index ? "#1976D2" : "#FBC02D",
                  borderRadius: "6px",
                  cursor: "pointer",
                  backgroundColor: routeIndex === index ? "#E3F2FD" : "#FFFDE7",
                  transition: "all 0.2s ease"
                }}
              >
                <div style={{ fontWeight: "bold", fontSize: "1.1em", color: routeIndex === index ? "#1565C0" : "#F57F17" }}>
                  Route {index + 1}: {route.summary || `Via ${route.legs[0].summary}`}
                </div>
                <div style={{ color: "#333", marginTop: "5px" }}>
                  Distance: <strong>{route.legs[0].distance.text}</strong>
                </div>
                <div style={{ color: routeIndex === index ? "#1976D2" : "#F57F17", fontSize: "1.2em", fontWeight: "bold", marginTop: "3px" }}>
                  ETA: {route.legs[0].duration.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Map;