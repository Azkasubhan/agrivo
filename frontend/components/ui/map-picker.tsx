'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, Search } from 'lucide-react';

interface MapPickerProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
}

export function MapPicker({ latitude, longitude, onChange }: MapPickerProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  const [locateError, setLocateError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Default coordinate: Center of Indonesia if no coordinate is provided
  const defaultLat = latitude || -2.5489;
  const defaultLng = longitude || 118.0149;
  const defaultZoom = latitude && longitude ? 15 : 5;

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Define a custom premium SVG Pin icon so we don't rely on broken default Leaflet assets
    const greenPinIcon = L.divIcon({
      html: `
        <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
          <!-- Outer pulsing animation -->
          <div style="position: absolute; width: 24px; height: 24px; border-radius: 50%; background: rgba(20, 83, 45, 0.4); animation: pulse 1.8s infinite ease-in-out;"></div>
          <!-- Pin body -->
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 3px 5px rgba(0,0,0,0.3)); z-index: 2;">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#14532D" stroke="#fff" stroke-width="1.5"/>
          </svg>
        </div>
      `,
      className: 'custom-leaflet-pin',
      iconSize: [36, 36],
      iconAnchor: [18, 30] // anchors bottom-center
    });

    // 1. Initialize Map and set attributionControl: false to completely remove the attribution text
    const map = L.map(mapContainerRef.current, {
      center: [defaultLat, defaultLng],
      zoom: defaultZoom,
      zoomControl: false, // will position zoom control on bottom-right later
      attributionControl: false, // removes Esri and Leaflet logo text at bottom right
    });
    mapRef.current = map;

    // Add Zoom Control to bottom-right (looks much cleaner)
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // 2. Define Map Layers
    const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    });

    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
    });

    // Default to Satellite View (more useful for looking at crops/fields)
    satelliteLayer.addTo(map);

    // 3. Add Layer Toggle Control
    const baseMaps = {
      "Satellite View": satelliteLayer,
      "Street Map": streetLayer,
    };
    L.control.layers(baseMaps, undefined, { position: 'topright' }).addTo(map);

    // 4. Create and Add Marker
    const marker = L.marker([defaultLat, defaultLng], {
      icon: greenPinIcon,
      draggable: true,
    }).addTo(map);
    markerRef.current = marker;

    // Bind popup label
    marker.bindPopup("<b>Selected Field Location</b><br>Drag me to adjust position").openPopup();

    // 5. Handle Map Clicks to Move Pin
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      onChange(parseFloat(lat.toFixed(6)), parseFloat(lng.toFixed(6)));
    });

    // 6. Handle Marker Dragging to Update Location
    marker.on('dragend', () => {
      const position = marker.getLatLng();
      onChange(parseFloat(position.lat.toFixed(6)), parseFloat(position.lng.toFixed(6)));
    });

    // Cleanup on unmount
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Update marker position when prop updates externally (e.g. Locate Me or Search)
  useEffect(() => {
    if (mapRef.current && markerRef.current && latitude && longitude) {
      const curLatLng = markerRef.current.getLatLng();
      if (curLatLng.lat !== latitude || curLatLng.lng !== longitude) {
        markerRef.current.setLatLng([latitude, longitude]);
        mapRef.current.setView([latitude, longitude], 16);
      }
    }
  }, [latitude, longitude]);

  // Geocoding search using Nominatim API (completely free, no key required)
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchError(null);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
        {
          headers: {
            'User-Agent': 'AgrivoFarmApp/1.0'
          }
        }
      );
      const data = await res.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const numLat = parseFloat(lat);
        const numLng = parseFloat(lon);
        onChange(parseFloat(numLat.toFixed(6)), parseFloat(numLng.toFixed(6)));
        
        if (mapRef.current) {
          mapRef.current.setView([numLat, numLng], 16);
        }
      } else {
        setSearchError('Location not found. Try a different query.');
      }
    } catch (err) {
      setSearchError('Search failed. Check your internet connection.');
    } finally {
      setIsSearching(false);
    }
  };

  // Locate user using Geolocation API
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setLocateError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocateError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        setIsLocating(false);
        onChange(parseFloat(lat.toFixed(6)), parseFloat(lng.toFixed(6)));
        if (mapRef.current) {
          mapRef.current.setView([lat, lng], 16);
        }
      },
      (error) => {
        setIsLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocateError('GPS permission was denied.');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocateError('GPS position unavailable.');
            break;
          case error.TIMEOUT:
            setLocateError('GPS request timed out.');
            break;
          default:
            setLocateError('Failed to detect GPS location.');
        }
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div className="map-picker-wrapper">
      {/* Search Bar */}
      <div className="map-search-bar">
        <div className="map-search-input-wrapper">
          <Search size={16} className="map-search-icon" />
          <input
            type="text"
            placeholder="Search location (e.g. Klaten, Yogyakarta, Sleman)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSearch();
              }
            }}
            className="map-search-input"
          />
        </div>
        <button
          type="button"
          onClick={handleSearch}
          disabled={isSearching}
          className="map-search-btn"
        >
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </div>

      {searchError && (
        <div className="map-search-error">
          ⚠️ {searchError}
        </div>
      )}

      {/* Map Container */}
      <div ref={mapContainerRef} className="map-picker-element" />

      {/* Locate Me Floating Button */}
      <button
        type="button"
        className="map-locate-btn"
        onClick={handleLocateMe}
        disabled={isLocating}
        title="Find my current location"
      >
        <Navigation size={15} className={isLocating ? 'animate-pulse' : ''} />
        <span>{isLocating ? 'Locating...' : 'Locate Me'}</span>
      </button>

      {locateError && (
        <div className="map-error-bubble">
          ⚠️ {locateError}
        </div>
      )}

      <style>{`
        .map-picker-wrapper {
          position: relative;
          width: 100%;
          border: 1px solid #E8E2D9;
          border-radius: 12px;
          overflow: hidden;
          background: #FAF8F3;
          display: flex;
          flex-direction: column;
        }

        /* Search Bar Styles */
        .map-search-bar {
          display: flex;
          padding: 0.75rem;
          gap: 0.5rem;
          background: #FAF8F3;
          border-bottom: 1px solid #E8E2D9;
          z-index: 10;
        }

        .map-search-input-wrapper {
          position: relative;
          flex: 1;
          display: flex;
          align-items: center;
        }

        .map-search-icon {
          position: absolute;
          left: 10px;
          color: #787878;
        }

        .map-search-input {
          width: 100%;
          background: #fff;
          border: 1px solid #E8E2D9;
          border-radius: 8px;
          padding: 0.5rem 0.5rem 0.5rem 2rem;
          font-size: 0.85rem;
          color: #161616;
          outline: none;
          transition: border-color 0.2s;
        }

        .map-search-input:focus {
          border-color: #5A6F45;
        }

        .map-search-btn {
          background: #5A6F45;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 0.5rem 1rem;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .map-search-btn:hover {
          background: #475837;
        }

        .map-search-btn:disabled {
          background: #a0a0a0;
          cursor: not-allowed;
        }

        .map-search-error {
          background: #FDEDEC;
          border-bottom: 1px solid #FADBD8;
          color: #C0392B;
          padding: 0.5rem 0.75rem;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .map-picker-element {
          width: 100%;
          height: 250px;
          z-index: 1;
        }

        /* Float positioning for custom locate button */
        .map-locate-btn {
          position: absolute;
          bottom: 15px;
          left: 15px;
          z-index: 1000;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          background: #14532D;
          border: none;
          color: #fff;
          padding: 0.6rem 1rem;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          transition: background-color 0.2s, transform 0.1s;
        }

        .map-locate-btn:hover {
          background: #0f3d21;
        }

        .map-locate-btn:active {
          transform: scale(0.97);
        }

        .map-locate-btn:disabled {
          background: #787878;
          cursor: not-allowed;
        }

        .map-error-bubble {
          position: absolute;
          bottom: 15px;
          left: 130px;
          z-index: 1000;
          background: #FDEDEC;
          border: 1px solid #FADBD8;
          color: #C0392B;
          padding: 0.5rem 0.8rem;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 500;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
        }

        /* Marker pulse keyframes */
        @keyframes pulse {
          0% {
            transform: scale(0.6);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.3;
          }
          100% {
            transform: scale(1.6);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
