import type { RawAircraft, Aircraft } from "./types.js";

const STALE_SECONDS = 60;

export function normalize(raw: RawAircraft): Aircraft | null {
  // Filter: no position or stale position -> drop it
  if (raw.lat === undefined || raw.lon === undefined) return null;
  if (raw.seen_pos === undefined || raw.seen_pos > STALE_SECONDS) return null;

  const altM = altitudeMeters(raw.alt_geom, raw.alt_baro);
  if (altM === null) return null;

  const callsign = raw.flight?.trim();

  return {
    id: raw.hex,
    callsign: callsign ? callsign : null,
    category: raw.category ?? null,
    position: {
      lat: raw.lat,
      lon: raw.lon,
      altM,
    },
    direction: raw.track ?? null,
    speedKt: raw.gs ?? null,
    verticalRateFpm: raw.baro_rate ?? null,
    onGround: raw.alt_baro === "ground",
    squawk: raw.squawk ?? null,
    emergency: raw.emergency !== undefined && raw.emergency !== "none",
  };
}

function altitudeMeters(
  gpsAlt: number | undefined,
  pressAlt: number | "ground" | undefined
): number | null {
  let altFt: number;

  if (pressAlt === "ground") {
    altFt = 0;
  } else if (gpsAlt !== undefined) {
    altFt = gpsAlt;
  } else if (pressAlt !== undefined) {
    altFt = pressAlt;
  } else {
    return null;
  }

  return altFt * 0.3048;
}