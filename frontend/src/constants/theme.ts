// Centralized Design Tokens and Shared Constants for ShipSense

export const RISK_COLORS = {
  Low: '#16a34a',      // Green
  Medium: '#eab308',   // Yellow
  High: '#f97316',     // Orange
  Critical: '#dc2626', // Red
} as const;

export type RiskLevel = keyof typeof RISK_COLORS;

export const getRiskColor = (band?: string): string => {
  if (!band) return RISK_COLORS.Low;
  const upper = band.toUpperCase();
  if (upper === 'CRITICAL') return RISK_COLORS.Critical;
  if (upper === 'HIGH') return RISK_COLORS.High;
  if (upper === 'MEDIUM') return RISK_COLORS.Medium;
  return RISK_COLORS.Low;
};

// Map Tile & Geographic Constraint Settings
export const MAP_CONFIG = {
  tileUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
  attribution: 'Tiles &copy; Esri',
  center: [22.5, 79] as [number, number],
  zoom: 5,
  minZoom: 4,
  maxZoom: 10,
  maxBounds: [
    [5, 67],
    [37.5, 98],
  ] as [[number, number], [number, number]],
  maxBoundsViscosity: 1.0,
};
