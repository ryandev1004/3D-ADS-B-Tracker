import * as Cesium from "cesium";
import { RX_LAT, RX_LON } from "../config";

// Calculates how far a plane is from receiver
export function distanceNm(lat: number, lon: number): number {
  const R = 3440.065; // Earth radius in nm
  const toRad = Cesium.Math.toRadians;
  const dLat = toRad(lat - RX_LAT);
  const dLon = toRad(lon - RX_LON);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(RX_LAT)) * Math.cos(toRad(lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Turns a plane’s heading into a 3D rotation Cesium can apply to the model.
export function headingOrientation(cart: Cesium.Cartesian3, headingDeg: number): Cesium.Quaternion {
  const hpr = new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(headingDeg - 90), 0, 0);
  return Cesium.Transforms.headingPitchRollQuaternion(cart, hpr);
}