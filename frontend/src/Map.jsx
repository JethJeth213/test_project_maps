import { GoogleMap, useJsApiLoader, DirectionsService, DirectionsRenderer, Autocomplete } from "@react-google-maps/api";
import { useState, useCallback, useRef, useEffect } from "react";

const containerStyle = { width: "100%", height: "600px", borderRadius: "12px" };
const center = { lat: 10.3157, lng: 123.8854 };
const libraries = ["places"];

function Map() {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  // State for inputs
  const [originInput, setOriginInput] = useState("");
  const [destInput, setDestInput] = useState("");
  
  // State for API triggers
  const [requestOrigin, setRequestOrigin] = useState("");
  const [requestDest, setRequestDest] = useState("");

  const [response, setResponse] = useState(null);
  const [routeIndex, setRouteIndex] = useState(0);

  // Refs for Autocomplete instances
  const originAutocompleteRef = useRef(null);
  const destAutocompleteRef = useRef(null);

  // 1. EFFICIENT DEBOUNCE (1 second instead of 5)
  useEffect(() => {
    if (!originInput || !destInput) return;

    const delayDebounceFn = setTimeout(() => {
      // Only trigger if the inputs actually changed from the last request
      if (originInput !== requestOrigin || destInput !== requestDest) {
        setRequestOrigin(originInput);
        setRequestDest(destInput);
        setResponse(null);
      }
    }, 1000); 

    return () => clearTimeout(delayDebounceFn);
  }, [originInput, destInput, requestOrigin, requestDest]);

  // 2. IMMEDIATE UPDATE ON SELECTION (The "Pleasant" Fix)
  const onPlaceChanged = (type) => {
    const autocomplete = type === 'origin' ? originAutocompleteRef.current : destAutocompleteRef.current;
    if (autocomplete) {
      const place = autocomplete.getPlace();
      const address = place.formatted_address || place.name;
      
      if (type === 'origin') {
        setOriginInput(address);
        setRequestOrigin(address); // Set immediately to bypass debounce
      } else {
        setDestInput(address);
        setRequestDest(address); // Set immediately to bypass debounce
      }
      setResponse(null);
    }
  };

  const directionsCallback = useCallback((res) => {
    if (res !== null && res.status === 'OK') {
      setResponse(res);
      setRouteIndex(0);
    }
  }, []);

  if (!isLoaded) return <div>Loading Map...</div>;

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
      
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

          <div style={{ fontSize: "20px", color: "#999" }}>→</div>

          <Autocomplete 
            onLoad={(ref) => (destAutocompleteRef.current = ref)} 
            onPlaceChanged={() => onPlaceChanged('dest')}
          >
            <input
              type="text"
              placeholder="Where to?"
              value={destInput}
              onChange={(e) => setDestInput(e.target.value)}
              style={inputStyle}
            />
          </Autocomplete>

          {(originInput || destInput) && (
            <button 
              onClick={() => { setOriginInput(""); setDestInput(""); setResponse(null); }}
              style={{ border: "none", background: "none", color: "#ef5350", cursor: "pointer", fontWeight: "600" }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: response ? "1fr 350px" : "1fr", gap: "20px" }}>
        
        {/* MAP */}
        <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={13}>
          {requestOrigin && requestDest && !response && (
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
                    suppressMarkers: index !== routeIndex, // Only show markers for active route
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

        {/* SIDEBAR: ROUTE LIST */}
        {response && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <h3 style={{ margin: "0 0 10px 0" }}>Suggested Routes</h3>
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
                  boxShadow: routeIndex === index ? "0 4px 12px rgba(25, 118, 210, 0.2)" : "none"
                }}
              >
                <div style={{ fontWeight: "bold", fontSize: "1.1em", marginBottom: "4px" }}>
                  {route.summary || `Via ${route.legs[0].steps[0].instructions.replace(/<b>|<\/b>/g, "").split(' ').slice(0,3).join(' ')}...`}
                </div>
                <div style={{ color: "#555", display: "flex", justifyContent: "space-between" }}>
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
  width: "300px",
  padding: "14px 18px",
  borderRadius: "8px",
  border: "1px solid #ddd",
  fontSize: "16px",
  outline: "none",
  boxShadow: "inset 0 1px 3px rgba(0,0,0,0.05)"
};

export default Map;