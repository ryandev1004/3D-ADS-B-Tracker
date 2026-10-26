import type { Aircraft } from "../types";
import { distanceNm } from "./geo";

const CATEGORY_NAMES: Record<string, string> = {
  A1: "Light",
  A2: "Small",
  A3: "Large",
  A4: "High-vortex large (757)",
  A5: "Heavy",
  A6: "High performance",
  A7: "Rotorcraft",
  B1: "Glider",
  B2: "Lighter-than-air",
  B6: "Drone / UAV",
};

function row(label: string, value: string): string {
  return `<tr><th>${label}</th><td>${value}</td></tr>`;
}

export function titleFor(a: Aircraft): string {
  return a.callsign ?? a.id.toUpperCase();
}

// HTML shown in Cesium's InfoBox when a plane is selected
export function descriptionFor(a: Aircraft): string {
  const { lat, lon, altM } = a.position;
  const altFt = Math.round(altM / 0.3048);
  const rate = a.verticalRateFpm;
  const rateArrow = rate === null ? "" : rate > 300 ? "^ " : rate < -300 ? "v " : "";
  const categoryName = a.category ? CATEGORY_NAMES[a.category] : undefined;
  const category = a.category ? `${a.category}${categoryName ? ` (${categoryName})` : ""}` : "—";

  const emergencyBanner = a.emergency
    ? `<p style="color:#ff5555;font-weight:bold;"> EMERGENCY (squawk ${a.squawk ?? "?"})</p>`
    : "";

  return `
    ${emergencyBanner}
    <table class="cesium-infoBox-defaultTable">
      <tbody>
        ${row("Callsign", a.callsign ?? "—")}
        ${row("Hex", a.id.toUpperCase())}
        ${row("Category", category)}
        ${row("Squawk", a.squawk ?? "—")}
        ${row("Altitude", a.onGround ? "On ground" : `${rateArrow}${altFt.toLocaleString()} ft`)}
        ${row("Vert. rate", rate === null ? "—" : `${rate.toLocaleString()} ft/min`)}
        ${row("Ground speed", a.speedKt === null ? "—" : `${Math.round(a.speedKt)} kt`)}
        ${row("Track", a.heading === null ? "—" : `${a.heading.toFixed(1)}°`)}
        ${row("Position", `${lat.toFixed(3)}°, ${lon.toFixed(3)}°`)}
        ${row("Distance", `${distanceNm(lat, lon).toFixed(1)} nm`)}
      </tbody>
    </table>
  `;
}