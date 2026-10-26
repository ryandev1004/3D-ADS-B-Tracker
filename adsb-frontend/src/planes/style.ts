import * as Cesium from "cesium";
import type { Aircraft } from "../types";

export function colorFor(a: Aircraft): Cesium.Color {
  if (a.emergency) return Cesium.Color.RED;
  const rate = a.verticalRateFpm ?? 0;
  if (rate > 300) return Cesium.Color.LIME; // climbing
  if (rate < -300) return Cesium.Color.DEEPSKYBLUE; // descending
  return Cesium.Color.WHITE; // level
}

export function labelFor(a: Aircraft): string {
  const name = a.callsign ?? a.id;
  if (a.onGround) return `${name}\nGND`;
  const altFt = Math.round(a.position.altM / 0.3048);
  return `${name}\n${altFt.toLocaleString()} ft`;
}