import { GoogleMap, useJsApiLoader, DirectionsService, DirectionsRenderer, Autocomplete } from "@react-google-maps/api";
import { useState, useCallback, useRef, useEffect } from "react";

const containerStyle = { width: "100%", height: "600px", borderRadius: "12px" };
const center = { lat: 10.3157, lng: 123.8854 }; // Default to Cebu City
const libraries = ["places"];

function Map() {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  // State for the text visible in the input boxes
  const [originInput, setOriginInput] = useState("");
  const [destInput, setDestInput] = useState("");
  
  // State that actually triggers the Directions API call
  const [requestOrigin, setRequestOrigin] = useState("");
  const [requestDest, setRequestDest] = useState("");

  const [response, setResponse] = useState(null);
  const [routeIndex, setRouteIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  // Refs to access the Google Autocomplete instance methods
  const originAutocompleteRef = useRef(null);
  const destAutocompleteRef = useRef(null);

  // 1. EFFICIENT DEBOUNCE
  // Instead of 5s, we use 1s. It waits for the user to stop typing 
  // before attempting a route calculation to save on API costs.
  useEffect(() => {
    if (!originInput || !destInput) return;

    const delayDebounceFn = setTimeout(() => {
      if (originInput !== requestOrigin || destInput !== requestDest) {
        setErrorMessage("");
        setRequestOrigin(originInput);
        setRequestDest(destInput);
        setResponse(null);
      }
    }, 1000); 

    return () => clearTimeout(delayDebounceFn);
  }, [originInput, destInput, requestOrigin, requestDest]);

  // 2. IMMEDIATE SYNC ON SELECTION
  // When a user clicks a suggestion, we bypass the debounce and trigger immediately.
  const onPlaceChanged = (type) => {
    const autocomplete = type === 'origin' ? originAutocompleteRef.current : destAutocompleteRef.current;
    if (autocomplete) {
      const place = autocomplete.getPlace();
      
      // Crucial: Use formatted_address to avoid the "NOT_FOUND" error
      const address = place.formatted_address || place.name;
      
      if (type === 'origin') {
        setOriginInput(address);
        setRequestOrigin(address);
      } else {
        setDestInput(address);
        setRequestDest(address);
      }
      setResponse(null);
      setErrorMessage("");
    }
  };

  // 3. ROBUST CALLBACK
  // We now check the 'status' argument to handle cases where roads don't connect.
  const directionsCallback = useCallback((res, status) => {
    if (status === 'OK' && res !== null) {
      setResponse(res);
      setRouteIndex(0);
      setErrorMessage("");
    } else if (status === 'ZERO_RESULTS') {
      setErrorMessage("No driving routes found between these points.");
      setResponse(null);
    } else if (status === 'NOT_FOUND') {
      setErrorMessage("One of the locations could not be identified.");
      setResponse(null);
    }
  }, []);

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div>Loading Engine Room...</div>;

  return (
    <div style={{ fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif', maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
      
      {/* SEARCH PANEL */}
      <div style={{ marginBottom: "20px", padding: "20px", background: "#fff", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", borderRadius: "12px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "15px", alignItems: "center" }}>
          
          <Autocomplete 
            onLoad={(ref) => (originAutocompleteRef.current = ref)} 
            onPlaceChanged={() => onPlaceChanged('origin')}
          >
            <input
              type="text"
              placeholder="Starting point..."
              value={originInput}
              onChange={(e) => setOriginInput(e.target.value)}
              style={inputStyle}
            />
          </Autocomplete>

          <div style={{ fontSize: "20px", color: "#ccc" }}>→</div>

          <Autocomplete 
            onLoad={(ref) => (destAutocompleteRef.current = ref)} 
            onPlaceChanged={() => onPlaceChanged('dest')}
          >
            <input
              type="text"
              placeholder="Destination..."
              value={destInput}
              onChange={(e) => setDestInput(e.target.value)}
              style={inputStyle}
            />
          </Autocomplete>

          {(originInput || destInput) && (
            <button 
              onClick={() => { 
                setOriginInput(""); setDestInput(""); 
                setRequestOrigin(""); setRequestDest("");
                setResponse(null); setErrorMessage("");
              }}
              style={{ border: "none", background: "none", color: "#ef5350", cursor: "pointer", fontWeight: "600" }}
            >
              Clear
            </button>
          )}
        </div>
        {errorMessage && <div style={{ color: "#ef5350", marginTop: "10px", fontSize: "0.9em" }}>{errorMessage}</div>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: response ? "1fr 350px" : "1fr", gap: "20px" }}>
        
        {/* MAP DISPLAY */}
        <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={13}>
          {requestOrigin && requestDest && !response && !errorMessage && (
            <DirectionsService
              options={{
                origin: requestOrigin,
                destination: requestDest,
                travelMode: "DRIVING",
                provideRouteAlternatives: true,
              }}
              callback={directionsCallback}
            />
          )}

          {response && (
            <>
              {response.routes.map((_, index) => (
                <DirectionsRenderer
                  key={index}
                  options={{
                    directions: response,
                    routeIndex: index,
                    suppressMarkers: index !== routeIndex, 
                    polylineOptions: {
                      strokeColor: index === routeIndex ? "#1976D2" : "#90A4AE",
                      strokeOpacity: index === routeIndex ? 1 : 0.5,
                      strokeWeight: index === routeIndex ? 6 : 4,
                      zIndex: index === routeIndex ? 10 : 1
                    }
                  }}
                />
              ))}
            </>
          )}
        </GoogleMap>

        {/* SIDEBAR: ROUTE OPTIONS */}
        {response && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <h3 style={{ margin: "0 0 10px 0", color: "#333" }}>Available Routes</h3>
            {response.routes.map((route, index) => (
              <div 
                key={index}
                onClick={() => setRouteIndex(index)}
                style={{
                  padding: "16px",
                  border: "2px solid",
                  borderColor: routeIndex === index ? "#1976D2" : "#eee",
                  borderRadius: "10px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  backgroundColor: routeIndex === index ? "#E3F2FD" : "#fff",
                  boxShadow: routeIndex === index ? "0 4px 12px rgba(25, 118, 210, 0.15)" : "none"
                }}
              >
                <div style={{ fontWeight: "bold", fontSize: "1.05em", marginBottom: "4px" }}>
                  {route.summary || "Main Route"}
                </div>
                <div style={{ color: "#666", display: "flex", justifyContent: "space-between", fontSize: "0.9em" }}>
                  <span>{route.legs[0].duration.text}</span>
                  <span>{route.legs[0].distance.text}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  width: "320px",
  padding: "14px 18px",
  borderRadius: "8px",
  border: "1px solid #ddd",
  fontSize: "15px",
  outline: "none",
  transition: "border-color 0.2s",
};

export default Map;