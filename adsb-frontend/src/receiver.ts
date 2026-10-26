import * as Cesium from "cesium";
import { RX_LAT, RX_LON } from "./config";

export function addReceiverMarker(viewer: Cesium.Viewer) {
  viewer.entities.add({
    id: "receiver",
    name: "Receiver",
    position: Cesium.Cartesian3.fromDegrees(RX_LON, RX_LAT, 30),
    point: {
      pixelSize: 12,
      color: Cesium.Color.ORANGE,
      outlineColor: Cesium.Color.BLACK,
      outlineWidth: 2,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
    label: {
      text: "Receiver",
      font: "13px sans-serif",
      fillColor: Cesium.Color.ORANGE,
      outlineColor: Cesium.Color.BLACK,
      outlineWidth: 3,
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      pixelOffset: new Cesium.Cartesian2(0, -20),
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
    description: `<p>Your ADS-B receiver<br>${RX_LAT.toFixed(4)}°, ${RX_LON.toFixed(4)}°</p>`,
  });
}