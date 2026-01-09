// features/loan/ui/LoanZonePill.jsx
"use client";

import { isDangerZone, zoneToLabel } from "@/features/loan/utils/zone";

export default function LoanZonePill({
  zone,
  showWhenUnknown = false,
  size = "sm", // "sm" | "md"
}) {
  const label = zoneToLabel(zone);
  const unknown = label === "—";

  if (unknown && !showWhenUnknown) return null;

  const danger = isDangerZone(zone);

  const pad = size === "md" ? "6px 10px" : "4px 8px";
  const fontSize = size === "md" ? 12 : 11;

  // Simple colors (inline) so you can drop it anywhere with no Tailwind dependency
  const style = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: pad,
    borderRadius: 999,
    fontSize,
    fontWeight: 700,
    letterSpacing: 0.3,
    border: "1px solid",
    userSelect: "none",
    whiteSpace: "nowrap",
    background: unknown ? "#f5f5f5" : danger ? "#fff1f2" : "#f0fdf4",
    color: unknown ? "#666" : danger ? "#b91c1c" : "#166534",
    borderColor: unknown ? "#ddd" : danger ? "#fecaca" : "#bbf7d0",
  };

  return <span style={style}>{unknown ? "ZONE —" : `ZONE ${label}`}</span>;
}
