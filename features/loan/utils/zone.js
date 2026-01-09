// features/loan/utils/zone.js
// CoinRabbit current_zone ranking:
// -1 = liquidation, 0 = red, 1 = orange, 2 = yellow, 3 = green
// Lower number => worse zone

export const ZONE = {
  LIQUIDATION: -1,
  RED: 0,
  ORANGE: 1,
  YELLOW: 2,
  GREEN: 3,
};

export function normalizeZone(z) {
  if (z === null || z === undefined || z === "") return null;
  const n = Number(z);
  if (!Number.isFinite(n)) return null;
  if (n < -1) return -1;
  if (n > 3) return 3;
  return n;
}

export function zoneToLabel(z) {
  const n = normalizeZone(z);
  if (n === null) return "—";
  if (n === 3) return "GREEN";
  if (n === 2) return "YELLOW";
  if (n === 1) return "ORANGE";
  if (n === 0) return "RED";
  if (n === -1) return "LIQUIDATION";
  return "—";
}

export function zoneToText(z) {
  // Friendly text for UI messages
  const n = normalizeZone(z);
  if (n === null) return "Unknown";
  if (n === 3) return "Safe";
  if (n === 2) return "Caution";
  if (n === 1) return "At risk";
  if (n === 0) return "Danger";
  if (n === -1) return "Liquidating";
  return "Unknown";
}

export function isDangerZone(z) {
  // Treat orange/red/liquidation as danger by default
  const n = normalizeZone(z);
  if (n === null) return false;
  return n <= 1;
}

export function zoneSeverity(z) {
  // Higher number = worse severity (useful for sorting)
  const n = normalizeZone(z);
  if (n === null) return 0;
  // Map: green=1, yellow=2, orange=3, red=4, liquidation=5
  if (n === 3) return 1;
  if (n === 2) return 2;
  if (n === 1) return 3;
  if (n === 0) return 4;
  if (n === -1) return 5;
  return 0;
}
