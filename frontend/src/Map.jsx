import { GoogleMap, useJsApiLoader, DirectionsService, DirectionsRenderer, Autocomplete } from "@react-google-maps/api";
import { useState, useCallback, useRef, useEffect } from "react";

// Responsive container: 100% width, height adjusts based on screen
const containerStyle = { 
  width: "100%", 
  height: "50vh", // Use viewport height for better mobile feel
  minHeight: "350px",
  borderRadius: "12px" 
};
const center = { lat: 10.3157, lng: 123.8854 };
const libraries = ["places"];

function Map() {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const [originInput, setOriginInput] = useState("");
  const [destInput, setDestInput] = useState("");
  const [requestOrigin, setRequestOrigin] = useState("");
  const [requestDest, setRequestDest] = useState("");
  const [response, setResponse] = useState(null);
  const [routeIndex, setRouteIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  const originAutocompleteRef = useRef(null);
  const destAutocompleteRef = useRef(null);

  // Detect mobile for dynamic styling
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const onPlaceChanged = (type) => {
    const autocomplete = type === 'origin' ? originAutocompleteRef.current : destAutocompleteRef.current;
    if (autocomplete) {
      const place = autocomplete.getPlace();
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

  const directionsCallback = useCallback((res, status) => {
    if (status === 'OK' && res !== null) {
      setResponse(res);
      setRouteIndex(0);
      setErrorMessage("");
    } else if (status === 'ZERO_RESULTS') {
      setErrorMessage("No driving routes found.");
      setResponse(null);
    }
  }, []);

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div>Loading...</div>;

  return (
    <div style={{ 
      fontFamily: 'Segoe UI, sans-serif', 
      maxWidth: "1200px", 
      margin: "0 auto", 
      padding: isMobile ? "10px" : "20px" 
    }}>
      
      {/* SEARCH PANEL */}
      <div style={{ 
        marginBottom: "15px", 
        padding: isMobile ? "15px" : "20px", 
        background: "#fff", 
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)", 
        borderRadius: "12px" 
      }}>
        <div style={{ 
          display: "flex", 
          flexDirection: isMobile ? "column" : "row", 
          gap: "10px", 
          alignItems: "stretch" 
        }}>
          
          <Autocomplete 
            onLoad={(ref) => (originAutocompleteRef.current = ref)} 
            onPlaceChanged={() => onPlaceChanged('origin')}
          >
            <input
              type="text"
              placeholder="Origin..."
              value={originInput}
              onChange={(e) => setOriginInput(e.target.value)}
              style={{ ...inputStyle, width: isMobile ? "100%" : "300px" }}
            />
          </Autocomplete>

          {!isMobile && <div style={{ alignSelf: "center", color: "#ccc" }}>→</div>}

          <Autocomplete 
            onLoad={(ref) => (destAutocompleteRef.current = ref)} 
            onPlaceChanged={() => onPlaceChanged('dest')}
          >
            <input
              type="text"
              placeholder="Destination..."
              value={destInput}
              onChange={(e) => setDestInput(e.target.value)}
              style={{ ...inputStyle, width: isMobile ? "100%" : "300px" }}
            />
          </Autocomplete>

          <button 
            onClick={() => { 
              setOriginInput(""); setDestInput(""); 
              setRequestOrigin(""); setRequestDest("");
              setResponse(null); setErrorMessage("");
            }}
            style={{ 
              padding: "10px",
              border: "none", 
              background: isMobile ? "#f5f5f5" : "none", 
              color: "#ef5350", 
              borderRadius: "8px",
              cursor: "pointer", 
              fontWeight: "600" 
            }}
          >
            Clear
          </button>
        </div>
        {errorMessage && <div style={{ color: "#ef5350", marginTop: "10px", fontSize: "0.85em" }}>{errorMessage}</div>}
      </div>

      {/* MAIN CONTENT AREA */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: (response && !isMobile) ? "1fr 350px" : "1fr", 
        gap: "15px" 
      }}>
        
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
            <DirectionsRenderer
              options={{
                directions: response,
                routeIndex: routeIndex,
                polylineOptions: {
                  strokeColor: "#1976D2",
                  strokeWeight: 6,
                }
              }}
            />
          )}
        </GoogleMap>

        {/* ROUTE OPTIONS: Sidebar on Desktop, List on Mobile */}
        {response && (
          <div style={{ 
            display: "flex", 
            flexDirection: "column", 
            gap: "10px",
            maxHeight: isMobile ? "none" : "500px",
            overflowY: "auto",
            padding: "5px"
          }}>
            <h3 style={{ margin: "5px 0", fontSize: "1.1em" }}>Routes</h3>
            {response.routes.map((route, index) => (
              <div 
                key={index}
                onClick={() => {
                  setRouteIndex(index);
                  if (isMobile) window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                style={{
                  padding: "12px",
                  border: "2px solid",
                  borderColor: routeIndex === index ? "#1976D2" : "#eee",
                  borderRadius: "10px",
                  cursor: "pointer",
                  backgroundColor: routeIndex === index ? "#E3F2FD" : "#fff",
                }}
              >
                <div style={{ fontWeight: "bold", fontSize: "0.95em" }}>{route.summary || `Route ${index + 1}`}</div>
                <div style={{ color: "#666", fontSize: "0.85em", display: "flex", justifyContent: "space-between" }}>
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
  padding: "12px 15px",
  borderRadius: "8px",
  border: "1px solid #ddd",
  fontSize: "16px", // 16px prevents iOS/Android from auto-zooming on focus
  outline: "none",
  boxSizing: "border-box"
};

export default Map;