# 3D ADS-B Tracker

Live, real-time 3D visualization of air traffic over Glassboro, NJ, built from radio signals I capture myself.

An ADS-B USB receiver on a Raspberry Pi 5 picks up the 1090 MHz broadcasts that aircraft transmit, decodes them into positions, and streams them to a CesiumJS scene with photorealistic 3D terrain. Planes glide across the map in real time, oriented in their direction of travel, with traffic flowing in and out of Philadelphia International (PHL).

---

## How it works

```
 ✈️  Aircraft (1090 MHz ADS-B broadcasts)
        │
        ▼
 📡  AirNav FlightStick (RTL-SDR + 1090 MHz filter/LNA)
        │  USB
        ▼
 🍓  Raspberry Pi 5
        ├── readsb ........ decodes raw radio samples → aircraft.json
        ├── tar1090 ....... serves aircraft.json over HTTP (+ a 2D debug map)
        └── adsb-relay .... polls, normalizes, broadcasts over WebSocket :8080
                                │
                                ▼
 🌍  adsb-frontend (Vite + TypeScript + CesiumJS)
        └── Google Photorealistic 3D Tiles + live glTF aircraft
```

### `adsb-relay`
A small TypeScript / Node.js service that sits between readsb and the browser.

- Polls `aircraft.json` every second with a non-overlapping loop and request timeouts
- **Normalizes** raw readsb data: drops planes with no or stale positions, picks GPS altitude over barometric, converts feet → meters, trims callsigns, handles the `"ground"` altitude edge case
- **Broadcasts** clean snapshots to every connected client over WebSocket, and sends the latest snapshot immediately on connect
- Survives receiver/network hiccups without crashing

### `adsb-frontend`
A Vite + TypeScript + CesiumJS app.

- **Photorealistic 3D Tiles** of the Glassboro / Philadelphia area via Cesium ion
- **Smooth motion** using `SampledPositionProperty` with a short render delay, so planes interpolate between updates instead of jumping
- **Velocity-based orientation**, so models point nose-first and pitch with climbs and descents, with a heading-based fallback
- **Color coding**: green = climbing, blue = descending, white = level, red = emergency
- **Labels** with callsign and altitude
- **InfoBox panel** (click a plane) with callsign, hex, category, squawk, altitude, vertical rate, ground speed, track, position, and distance from the receiver
- **Receiver marker** showing where the antenna is
- Auto-reconnecting WebSocket client with exponential backoff

---

## Hardware

| Part | Notes |
|---|---|
| Raspberry Pi 5 | Official 27W power supply |
| AirNav FlightStick | RTL-SDR with integrated 1090 MHz filter, LNA, and ESD protection |
| 1090 MHz antenna | Small SMA rubber-duck, indoors near a window on a USB extension |

---

## Project structure

```
3D-ADS-B-Tracker/
├── adsb-relay/
│   └── src/
│       ├── index.ts        # polling loop + WebSocket server
│       ├── normalize.ts    # raw readsb data → clean Aircraft
│       └── types.ts        # RawAircraft, AircraftFile, Aircraft
└── adsb-frontend/
    ├── public/models/      # glTF aircraft model
    └── src/
        ├── main.ts         # viewer, camera, clock setup
        ├── relay.ts        # WebSocket client with reconnect
        ├── receiver.ts     # receiver location marker
        ├── config.ts       # receiver location, model path
        ├── types.ts        # shared Aircraft type
        └── planes/
            ├── planes.ts   # entity lifecycle (create / update / remove)
            ├── style.ts    # colors + labels
            ├── info-box.ts # InfoBox HTML
            └── geo.ts      # distance + orientation math
```

---

## Setup

### 1. Receiver (on the Pi)

Install readsb and tar1090 using [wiedehopf's scripts](https://github.com/wiedehopf/adsb-scripts):

```bash
sudo bash -c "$(wget -O - https://github.com/wiedehopf/adsb-scripts/raw/master/readsb-install.sh)"
sudo readsb-set-location <lat> <lon>
sudo bash -c "$(wget -nv -O - https://github.com/wiedehopf/tar1090/raw/master/install.sh)"
```

Verify at `http://<pi-ip>/tar1090`.

### 2. Relay (on the Pi)

Requires Node.js (LTS).

```bash
cd adsb-relay
npm install
npm run dev
```

Broadcasts on `ws://<pi-ip>:8080`.

### 3. Frontend

```bash
cd adsb-frontend
npm install
npm run dev
```

Create a `.env` file in `adsb-frontend/` with your free [Cesium ion](https://cesium.com/ion) token:

```
VITE_CESIUM_ION_TOKEN=your_token_here
```

Open the Network URL Vite prints (e.g. `http://<pi-ip>:5173`). The frontend connects to the relay on the same host automatically.

---

## Configuration

| Setting | File | Purpose |
|---|---|---|
| `RX_LAT`, `RX_LON` | `adsb-frontend/src/config.ts` | Receiver marker + distance calculations |
| `MODEL_URL` | `adsb-frontend/src/config.ts` | Aircraft glTF model |
| `RENDER_DELAY_S` | `adsb-frontend/src/main.ts` | How far behind real time the scene renders (smoothness vs. latency) |
| `STALE_SECONDS` | `adsb-relay/src/normalize.ts` | Drop planes whose last position is older than this |
| `POLL_MS` | `adsb-relay/src/index.ts` | How often the relay polls readsb |

---

## Roadmap

- [ ] Trails showing recent flight paths
- [ ] Status overlay (connection state, aircraft count)
- [ ] Route lookups (origin/destination) via adsbdb, with great-circle lines to the destination airport
- [ ] Different models per aircraft category (airliner, heavy, helicopter)
- [ ] Accurate ground placement for taxiing aircraft at PHL
- [ ] Run the relay as a systemd service
- [ ] Custom C++ ADS-B decoder to replace readsb

---

## Credits

- [readsb](https://github.com/wiedehopf/readsb) and [tar1090](https://github.com/wiedehopf/tar1090) by wiedehopf
- [CesiumJS](https://cesium.com/platform/cesiumjs/) and Cesium ion
- Google Photorealistic 3D Tiles, via Cesium ion
- Cesium Air sample model from the [CesiumJS repository](https://github.com/CesiumGS/cesium) (Apache 2.0)
