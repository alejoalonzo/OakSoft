// features/loan/ui/LoanDangerZoneBar.jsx
"use client";

import { normalizeZone, zoneToLabel, zoneToText, isDangerZone } from "@/features/loan/utils/zone";

export default function LoanDangerZoneBar({
  zone,
  showLabel = true,
  showHelpText = true,
  compact = false,
}) {
  const z = normalizeZone(zone);
  const label = zoneToLabel(z);
  const text = zoneToText(z);
  const danger = isDangerZone(z);

  // Order from worst -> best (left to right)
  const segments = [
    { value: -1, name: "LIQ" },
    { value: 0, name: "RED" },
    { value: 1, name: "ORG" },
    { value: 2, name: "YEL" },
    { value: 3, name: "GRN" },
  ];

  const containerStyle = {
    display: "grid",
    gap: compact ? 6 : 10,
    width: "100%",
  };

  const barStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: 6,
    width: "100%",
  };

  const segBase = {
    height: compact ? 10 : 12,
    borderRadius: 999,
    border: "1px solid #ddd",
    background: "#f3f4f6",
  };

  const getSegStyle = (v) => {
    const active = z !== null && v === z;
    return {
      ...segBase,
      outline: active ? "2px solid #111" : "none",
      opacity: z === null ? 0.6 : active ? 1 : 0.45,
      transform: active ? "scaleY(1.15)" : "none",
    };
  };

  const headerStyle = {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 12,
  };

  const pillStyle = {
    fontSize: 12,
    fontWeight: 800,
    padding: "4px 10px",
    borderRadius: 999,
    border: "1px solid",
    background: z === null ? "#f5f5f5" : danger ? "#fff1f2" : "#f0fdf4",
    color: z === null ? "#666" : danger ? "#b91c1c" : "#166534",
    borderColor: z === null ? "#ddd" : danger ? "#fecaca" : "#bbf7d0",
    whiteSpace: "nowrap",
  };

  const helpStyle = {
    fontSize: 12,
    color: "#666",
    lineHeight: 1.3,
  };

  return (
    <div style={containerStyle}>
      {showLabel && (
        <div style={headerStyle}>
          <div style={{ fontWeight: 700 }}>Danger zone</div>
          <span style={pillStyle}>{label === "—" ? "ZONE —" : `ZONE ${label}`}</span>
        </div>
      )}

      <div style={barStyle}>
        {segments.map((s) => (
          <div key={s.value} style={getSegStyle(s.value)} title={s.name} />
        ))}
      </div>

      {showHelpText && (
        <div style={helpStyle}>
          {z === null
            ? "Zone not available yet."
            : danger
              ? `Status: ${text}. Consider increasing collateral or repaying to reduce risk.`
              : `Status: ${text}.`}
        </div>
      )}
    </div>
  );
}
