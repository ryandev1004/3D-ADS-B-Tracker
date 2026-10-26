export type RawAircraft = {
  hex: string;                   // ICAO address, always present

  // Identity
  flight?: string;               // callsign, has trailing spaces
  category?: string;             // e.g. "A3" = large aircraft

  // Position
  lat?: number;
  lon?: number;
  alt_geom?: number;             // GPS altitude, feet
  alt_baro?: number | "ground";  // pressure altitude, feet

  // Motion
  track?: number;                // heading, degrees
  gs?: number;                   // ground speed, knots
  baro_rate?: number;            // climb/descent, ft/min

  // Freshness
  seen_pos?: number;             // seconds since last position

  // Extras
  squawk?: string;
  emergency?: string;
};

// The whole aircraft.json file
export type AircraftFile = {
  now: number;                   // Unix timestamp, seconds
  aircraft: RawAircraft[];
};

// Your clean shape, what the frontend receives
export type Aircraft = {
  id: string;
  callsign: string | null;
  category: string | null;
  position: {
    lat: number;
    lon: number;
    altM: number;                // meters
  };
  heading: number | null;        // degrees
  speedKt: number | null;
  verticalRateFpm: number | null;
  onGround: boolean;
  squawk: string | null;
  emergency: boolean;
};