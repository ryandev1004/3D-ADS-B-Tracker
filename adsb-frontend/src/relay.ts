import type { SnapshotMessage } from "./types";

// Same host the page was loaded from, so it works from the Pi or my Mac
const RELAY_URL = `ws://${window.location.hostname}:8080`;

export function connectRelay(onSnapshot: (msg: SnapshotMessage) => void) {
  let retryMs = 1000;

  function connect() {
    const ws = new WebSocket(RELAY_URL);

    ws.onopen = () => {
      console.log("relay connected");
      retryMs = 1000; // reset backoff after a good connection
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === "snapshot") onSnapshot(msg as SnapshotMessage);
    };

    ws.onclose = () => {
      console.warn(`relay disconnected, retrying in ${retryMs}ms`);
      setTimeout(connect, retryMs);
      retryMs = Math.min(retryMs * 2, 10000); // back off, max 10s
    };
  }

  connect();
}