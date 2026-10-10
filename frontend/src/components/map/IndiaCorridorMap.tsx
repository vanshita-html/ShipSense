import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CorridorRisk } from '../../types';
import { MAP_CONFIG, RISK_COLORS, getRiskColor } from '../../constants/theme';

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Re-export MAP_CONFIG for backward compatibility
export { MAP_CONFIG };

// Coordinates dictionary for Indian hubs
export const CITY_COORDINATES: Record<string, [number, number]> = {
  'Mumbai': [19.0760, 72.8777],
  'Delhi NCR': [28.6139, 77.2090],
  'Bangalore': [12.9716, 77.5946],
  'Chennai': [13.0827, 80.2707],
  'Hyderabad': [17.3850, 78.4867],
  'Kolkata': [22.5726, 88.3639],
  'Ahmedabad': [23.0225, 72.5714],
  'Nagpur': [21.1458, 79.0882],
  'Mundra Port': [22.8400, 69.7200],
  'JNPT Mumbai': [18.9500, 72.9500],
  'Vizag Port': [17.6868, 83.2185],
  'Cochin': [9.9312, 76.2673],
  'Pune': [18.5204, 73.8567],
};

const INDIA_VIEWPORT_BOUNDS: L.LatLngBoundsExpression = [
  [8.0, 68.0],
  [34.5, 96.0],
];

// Controller to automatically fit only India, recalculate on resize, and enforce minZoom
const MapBoundsController: React.FC = () => {
  const map = useMap();

  useEffect(() => {
    const fitMap = () => {
      map.fitBounds(INDIA_VIEWPORT_BOUNDS, { padding: [10, 10], animate: false });
      const boundsZoom = map.getBoundsZoom(INDIA_VIEWPORT_BOUNDS, false, L.point(10, 10));
      map.setMinZoom(boundsZoom);
      map.invalidateSize();
    };

    fitMap();
    const timer = setTimeout(fitMap, 200);

    const handleResize = () => {
      fitMap();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [map]);

  return null;
};

const createCustomIcon = (markerColor: string) => {
  return L.divIcon({
    className: 'custom-map-pin',
    html: `
      <div style="
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background-color: ${markerColor};
        border: 2px solid white;
        box-shadow: 0 0 8px ${markerColor};
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="width: 5px; height: 5px; border-radius: 50%; background: white;"></div>
      </div>
    `,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
};

interface IndiaCorridorMapProps {
  corridors: CorridorRisk[];
  onSelectCorridor?: (corridor: CorridorRisk) => void;
}

export const IndiaCorridorMap: React.FC<IndiaCorridorMapProps> = ({
  corridors,
  onSelectCorridor,
}) => {
  return (
    <div className="relative w-full h-[520px] rounded-2xl overflow-hidden glass-card shadow-sm border border-slate-200">
      <MapContainer
        center={MAP_CONFIG.center}
        zoom={MAP_CONFIG.zoom}
        minZoom={MAP_CONFIG.minZoom}
        maxZoom={MAP_CONFIG.maxZoom}
        maxBounds={MAP_CONFIG.maxBounds}
        maxBoundsViscosity={1.0}
        scrollWheelZoom={false}
        className="w-full h-full"
        attributionControl={true}
      >
        <MapBoundsController />

        {/* Esri World Street Map Tiles (English Labels) */}
        <TileLayer
          url={MAP_CONFIG.tileUrl}
          attribution={MAP_CONFIG.attribution}
          minZoom={MAP_CONFIG.minZoom}
          maxZoom={MAP_CONFIG.maxZoom}
        />

        {/* Corridor Polylines */}
        {corridors.map((c) => {
          const parts = c.corridor.split(' - ').map((p) => p.trim());
          if (parts.length === 2 && CITY_COORDINATES[parts[0]] && CITY_COORDINATES[parts[1]]) {
            const positions: [number, number][] = [
              CITY_COORDINATES[parts[0]],
              CITY_COORDINATES[parts[1]],
            ];
            const color = getRiskColor(c.risk_band);
            const isCritical = c.risk_band?.toUpperCase() === 'CRITICAL';

            return (
              <Polyline
                key={c.corridor}
                positions={positions}
                pathOptions={{
                  color,
                  weight: isCritical ? 4.5 : 3.5,
                  opacity: 0.9,
                  dashArray: isCritical ? '8 6' : undefined,
                }}
                eventHandlers={{
                  click: () => onSelectCorridor && onSelectCorridor(c),
                }}
              />
            );
          }
          return null;
        })}

        {/* Hub Markers */}
        {Object.entries(CITY_COORDINATES).map(([cityName, coords]) => {
          const hubCorridors = corridors.filter((c) => c.corridor.includes(cityName));
          let hubRisk = 'Low';
          if (hubCorridors.some((c) => c.risk_band?.toUpperCase() === 'CRITICAL')) {
            hubRisk = 'Critical';
          } else if (hubCorridors.some((c) => c.risk_band?.toUpperCase() === 'HIGH')) {
            hubRisk = 'High';
          } else if (hubCorridors.some((c) => c.risk_band?.toUpperCase() === 'MEDIUM')) {
            hubRisk = 'Medium';
          }
          const markerColor = getRiskColor(hubRisk);

          return (
            <Marker
              key={cityName}
              position={coords}
              icon={createCustomIcon(markerColor)}
            >
              <Popup>
                <div className="p-1 text-xs">
                  <p className="font-bold text-slate-900">{cityName} Hub</p>
                  <p className="text-2xs text-slate-500">
                    Logistics Node: {coords[0].toFixed(2)}, {coords[1].toFixed(2)}
                  </p>
                  <p className="text-2xs font-semibold mt-0.5">
                    Corridor Risk: <span style={{ color: markerColor }}>{hubRisk}</span>
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Interactive Map Legend Overlay - Bottom Left & Compact */}
      <div className="absolute bottom-4 left-4 z-20 p-2.5 rounded-xl bg-white/90 backdrop-blur-xs border border-slate-200/90 shadow-sm text-2xs space-y-1 select-none pointer-events-auto">
        <p className="font-extrabold text-slate-900 text-[10px] uppercase tracking-wider">
          Corridor Risk Level
        </p>
        <div className="flex items-center gap-2 text-[10px]">
          <span
            className="w-3 h-1.5 rounded-xs shrink-0"
            style={{ backgroundColor: RISK_COLORS.Critical }}
          />
          <span className="text-slate-700 font-medium">Critical (&gt;70%)</span>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <span
            className="w-3 h-1.5 rounded-xs shrink-0"
            style={{ backgroundColor: RISK_COLORS.High }}
          />
          <span className="text-slate-700 font-medium">High (51-70%)</span>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <span
            className="w-3 h-1.5 rounded-xs shrink-0"
            style={{ backgroundColor: RISK_COLORS.Medium }}
          />
          <span className="text-slate-700 font-medium">Medium (31-50%)</span>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <span
            className="w-3 h-1.5 rounded-xs shrink-0"
            style={{ backgroundColor: RISK_COLORS.Low }}
          />
          <span className="text-slate-700 font-medium">Low (0-30%)</span>
        </div>
      </div>
    </div>
  );
};
