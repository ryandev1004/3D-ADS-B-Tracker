export type Aircraft = {
  id: string;
  callsign: string | null;
  category: string | null;
  position: { lat: number; lon: number; altM: number };
  heading: number | null;
  speedKt: number | null;
  verticalRateFpm: number | null;
  onGround: boolean;
  squawk: string | null;
  emergency: boolean;
};

export type SnapshotMessage = {
  type: "snapshot";
  now: number;
  aircraft: Aircraft[];
};