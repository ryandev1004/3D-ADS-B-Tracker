import "cesium/Build/Cesium/Widgets/widgets.css";
import "./style.css";
import * as Cesium from "cesium";
import { connectRelay } from "./relay";
import { createPlaneLayer } from "./planes";

Cesium.Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_ION_TOKEN;

const RENDER_DELAY_S = 3;

async function main() {
  const viewer = new Cesium.Viewer("app", {
    globe: false,
    timeline: false,
    animation: false,
    baseLayerPicker: false,
    geocoder: false,
    homeButton: false,
    sceneModePicker: false,
    navigationHelpButton: false,
  });

  const tileset = await Cesium.createGooglePhotorealistic3DTileset();
  viewer.scene.primitives.add(tileset);

  // Start southwest of Rowan, looking northeast toward PHL
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(-75.30, 39.55, 18000),
    orientation: {
      heading: Cesium.Math.toRadians(35),
      pitch: Cesium.Math.toRadians(-35),
    },
  });

  // Run Cesium's clock in real time, but a few seconds behind,
  // so it always interpolates between two known positions
  viewer.clock.shouldAnimate = true;
  viewer.clock.clockStep = Cesium.ClockStep.SYSTEM_CLOCK_MULTIPLIER;
  viewer.clock.multiplier = 1;
  viewer.clock.currentTime = Cesium.JulianDate.addSeconds(
    Cesium.JulianDate.now(),
    -RENDER_DELAY_S,
    new Cesium.JulianDate()
  );

  const planes = createPlaneLayer(viewer);

  connectRelay((msg) => {
    planes.update(msg.aircraft);
  });
}

main().catch(console.error);