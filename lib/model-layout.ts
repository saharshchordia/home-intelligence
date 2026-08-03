export type ModelMode = "exterior" | "first" | "second" | "lower" | "garage";

export type RoomZone = {
  entityId: string;
  label: string;
  mode: Exclude<ModelMode, "exterior">;
  x: number;
  z: number;
  width: number;
  depth: number;
  tone: "living" | "service" | "sleeping" | "circulation" | "utility";
};

export type ModelPlacement = {
  mode: ModelMode;
  position: [number, number, number];
};

export const modelModes: Array<{ id: ModelMode; label: string }> = [
  { id: "exterior", label: "Exterior" },
  { id: "first", label: "First floor" },
  { id: "second", label: "Second floor" },
  { id: "lower", label: "Lower level" },
  { id: "garage", label: "Garage" },
];

export const roomZones: RoomZone[] = [
  { entityId: "foyer", label: "Foyer", mode: "first", x: -12, z: 19, width: 8, depth: 11, tone: "circulation" },
  { entityId: "dining-room", label: "Dining", mode: "first", x: 6, z: 20, width: 15, depth: 10, tone: "living" },
  { entityId: "living-room", label: "Living", mode: "first", x: -10, z: 5, width: 14, depth: 17, tone: "living" },
  { entityId: "kitchen", label: "Kitchen", mode: "first", x: 9, z: 7, width: 17, depth: 15, tone: "service" },
  { entityId: "family-room", label: "Family", mode: "first", x: -10, z: -13, width: 14, depth: 17, tone: "living" },
  { entityId: "primary-suite", label: "Primary bedroom", mode: "first", x: 9, z: -10, width: 17, depth: 14, tone: "sleeping" },
  { entityId: "primary-bathroom", label: "Primary bath", mode: "first", x: 9, z: -22, width: 17, depth: 8, tone: "service" },
  { entityId: "main-level-bathroom", label: "Main bath", mode: "first", x: -1, z: -22, width: 6, depth: 8, tone: "service" },
  { entityId: "laundry", label: "Laundry", mode: "first", x: 15, z: 18, width: 5, depth: 7, tone: "utility" },
  { entityId: "loft", label: "Loft", mode: "second", x: 0, z: -6, width: 15, depth: 22, tone: "living" },
  { entityId: "bedrooms", label: "Bedroom", mode: "second", x: -9, z: 10, width: 12, depth: 12, tone: "sleeping" },
  { entityId: "upstairs-hall-bathroom", label: "Hall bath", mode: "second", x: 0, z: 20, width: 8, depth: 9, tone: "service" },
  { entityId: "upper-level-bathroom", label: "Upper bath", mode: "second", x: 0, z: 12, width: 7, depth: 7, tone: "service" },
  { entityId: "attic", label: "Attic", mode: "second", x: 7, z: -15, width: 8, depth: 10, tone: "utility" },
  { entityId: "cellar", label: "Cellar", mode: "lower", x: 7, z: 3, width: 20, depth: 25, tone: "utility" },
  { entityId: "crawlspace", label: "Crawlspace", mode: "lower", x: -8, z: -6, width: 15, depth: 33, tone: "utility" },
  { entityId: "garage", label: "Detached garage", mode: "garage", x: 0, z: 0, width: 11, depth: 19, tone: "utility" },
];

export const modelPlacements: Record<string, ModelPlacement> = {
  foyer: { mode: "first", position: [-12, 1.5, 19] },
  "living-room": { mode: "first", position: [-10, 1.5, 5] },
  "dining-room": { mode: "first", position: [6, 1.5, 20] },
  kitchen: { mode: "first", position: [9, 1.5, 7] },
  "family-room": { mode: "first", position: [-10, 1.5, -13] },
  "primary-suite": { mode: "first", position: [9, 1.5, -10] },
  "primary-bathroom": { mode: "first", position: [9, 1.5, -22] },
  "main-level-bathroom": { mode: "first", position: [-1, 1.5, -22] },
  laundry: { mode: "first", position: [15, 1.5, 18] },
  loft: { mode: "second", position: [0, 1.5, -6] },
  bedrooms: { mode: "second", position: [-9, 1.5, 10] },
  "upstairs-hall-bathroom": { mode: "second", position: [0, 1.5, 20] },
  "upper-level-bathroom": { mode: "second", position: [0, 1.5, 12] },
  attic: { mode: "second", position: [7, 1.5, -15] },
  cellar: { mode: "lower", position: [7, 1.5, 3] },
  crawlspace: { mode: "lower", position: [-8, 1.5, -6] },
  garage: { mode: "garage", position: [0, 1.5, 0] },
  "front-entry": { mode: "exterior", position: [-11, 3, 27] },
  "right-entry-porch": { mode: "exterior", position: [19, 3, 8] },
  driveway: { mode: "exterior", position: [26, 1, 10] },
  walkways: { mode: "exterior", position: [-17, 1, 25] },
  "retaining-walls": { mode: "exterior", position: [22, 2, -22] },
  patios: { mode: "exterior", position: [-12, 1, -32] },
  yard: { mode: "exterior", position: [0, 1, -39] },
};
