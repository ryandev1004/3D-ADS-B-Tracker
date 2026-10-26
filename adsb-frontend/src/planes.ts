import * as Cesium from "cesium";
import type { Aircraft } from "./types";

const MODEL_URL = "/models/Cesium_Air.glb";

type TrackedPlane = {
  entity: Cesium.Entity;
  position: Cesium.SampledPositionProperty;
  fallbackOrientation: Cesium.Quaternion | undefined;
  lastLat: number;
  lastLon: number;
};

function colorFor(a: Aircraft): Cesium.Color {
  if (a.emergency) return Cesium.Color.RED;
  const rate = a.verticalRateFpm ?? 0;
  if (rate > 300) return Cesium.Color.LIME; // climbing
  if (rate < -300) return Cesium.Color.DEEPSKYBLUE; // descending
  return Cesium.Color.WHITE; // level
}

function labelFor(a: Aircraft): string {
  const name = a.callsign ?? a.id;
  if (a.onGround) return `${name}\nGND`;
  const altFt = Math.round(a.position.altM / 0.3048);
  return `${name}\n${altFt.toLocaleString()} ft`;
}

// Fallback when the plane isn't moving between samples.
// Cesium's heading is measured from east; aviation heading is from north.
function headingOrientation(cart: Cesium.Cartesian3, headingDeg: number): Cesium.Quaternion {
  const hpr = new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(headingDeg - 90), 0, 0);
  return Cesium.Transforms.headingPitchRollQuaternion(cart, hpr);
}

export function createPlaneLayer(viewer: Cesium.Viewer) {
  const planes = new Map<string, TrackedPlane>();

  function update(aircraft: Aircraft[]) {
    const now = Cesium.JulianDate.now();
    const seen = new Set<string>();

    for (const a of aircraft) {
      const { lat, lon, altM } = a.position;

      // Safety: skip anything with invalid numbers so the renderer can't crash
      if (!Number.isFinite(lat) || !Number.isFinite(lon) || !Number.isFinite(altM)) continue;

      seen.add(a.id);
      const cart = Cesium.Cartesian3.fromDegrees(lon, lat, a.onGround ? 0 : altM);

      let plane = planes.get(a.id);

      // New plane so create an entity
      if (!plane) {
        const position = new Cesium.SampledPositionProperty();
        position.forwardExtrapolationType = Cesium.ExtrapolationType.HOLD;
        position.backwardExtrapolationType = Cesium.ExtrapolationType.HOLD;

        // Points the model's nose along its direction of travel
        const velocityOrientation = new Cesium.VelocityOrientationProperty(position);

        const tracked: TrackedPlane = {
          entity: undefined as unknown as Cesium.Entity, // set just below
          position,
          fallbackOrientation: undefined,
          lastLat: NaN,
          lastLon: NaN,
        };

        tracked.entity = viewer.entities.add({
          id: a.id,
          position,
          // Each frame: use velocity if it's moving, otherwise the heading fallback
          orientation: new Cesium.CallbackProperty((time, result) => {
            const t = time ?? viewer.clock.currentTime;
            return velocityOrientation.getValue(t, result) ?? tracked.fallbackOrientation;
          }, false),
          model: {
            uri: MODEL_URL,
            minimumPixelSize: 48, // stays visible when zoomed out
            maximumScale: 2000,
            colorBlendMode: Cesium.ColorBlendMode.MIX,
            colorBlendAmount: 0.5,
          },
          label: {
            font: "13px sans-serif",
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 3,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            pixelOffset: new Cesium.Cartesian2(0, -32),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
        });

        plane = tracked;
        planes.set(a.id, plane);
      }

      // Only add a sample when the position actually changed
      if (lat !== plane.lastLat || lon !== plane.lastLon) {
        plane.position.addSample(now, cart);
        plane.lastLat = lat;
        plane.lastLon = lon;
      }

      // Keep the fallback fresh in case the plane stalls between updates
      if (a.heading !== null && Number.isFinite(a.heading)) {
        plane.fallbackOrientation = headingOrientation(cart, a.heading);
      }

      // Update styling every snapshot
      plane.entity.model!.color = new Cesium.ConstantProperty(colorFor(a));
      plane.entity.label!.text = new Cesium.ConstantProperty(labelFor(a));
    }

    // Plane disappeared from the snapshot so remove it
    for (const [id, plane] of planes) {
      if (!seen.has(id)) {
        viewer.entities.remove(plane.entity);
        planes.delete(id);
      }
    }
  }

  return { update, count: () => planes.size };
}