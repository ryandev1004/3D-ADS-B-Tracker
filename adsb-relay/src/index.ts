import type { AircraftFile, Aircraft } from "./types.js";
import { normalize } from "./normalize.js";
import { WebSocketServer, WebSocket } from "ws";

const WS_PORT = 8080;
const wss = new WebSocketServer({ port: WS_PORT });
console.log(`WebSocket server on ws://localhost:${WS_PORT}`);

const URL = "http://localhost/tar1090/data/aircraft.json";
const POLL_MS = 1000;

let latest: Aircraft[] = [];

function snapshotMessage(): string {
  return JSON.stringify({
    type: "snapshot",
    now: Date.now(),
    aircraft: latest,
  });
}

function broadcast() {
  const msg = snapshotMessage();
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  }
}

wss.on("connection", (ws) => {
  console.log(`client connected (${wss.clients.size} total)`);
  ws.send(snapshotMessage());

  ws.on("error", (err) => console.error("client socket error:", err.message));
  ws.on("close", () => console.log(`client disconnected (${wss.clients.size} total)`));
});

wss.on("error", (err) => console.error("websocket server error:", err.message));

async function poll() {
  try {
    const res = await fetch(URL, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = (await res.json()) as AircraftFile;

    latest = data.aircraft
      .map(normalize)
      .filter((a): a is Aircraft => a !== null);

    broadcast();
    console.log(`${latest.length} aircraft → ${wss.clients.size} client(s)`);
  } catch (err) {
    console.error("poll failed:", err);
  }

  setTimeout(poll, POLL_MS);
}

poll();