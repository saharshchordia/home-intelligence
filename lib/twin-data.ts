export type EntityKind = "place" | "system" | "site";

export type HomeProfile = {
  id: string;
  name: string;
  location: string;
  acquiredAt: string;
  yearBuilt: number;
  design: string;
  livingAreaSqFt: number;
  lotSqFt: number;
  roomCount: number;
  bedrooms: number;
  bathrooms: number;
  qualityRating: string;
  conditionRating: string;
  sourceLabel: string;
  sourceDate: string;
};

export type TwinEntity = {
  id: string;
  homeId: string;
  name: string;
  kind: EntityKind;
  groupName: string;
  condition: string;
  detail: string;
  sourcePage: number;
};

export type TwinEvent = {
  id: string;
  homeId: string;
  occurredAt: string;
  title: string;
  type: string;
  summary: string;
  conditionBefore: string | null;
  conditionAfter: string | null;
  costCents: number | null;
  createdAt: string;
  entityIds: string[];
  evidenceIds: string[];
};

export type Evidence = {
  id: string;
  homeId: string;
  label: string;
  kind: string;
  sourceRef: string;
  capturedAt: string;
  visibility: string;
};

export type SourceDocument = {
  id: string;
  homeId: string;
  title: string;
  documentType: string;
  sourceDate: string;
  originalFilename: string;
  mimeType: string;
  pageCount: number;
  storageStatus: string;
};

export type AssertionEntityLink = {
  entityId: string;
  relationship: string;
  confidence: number;
  status: "auto-accepted" | "pending" | "approved" | "rejected";
  rationale: string;
};

export type InspectionAssertion = {
  id: string;
  homeId: string;
  documentId: string;
  reportItem: string;
  sourcePage: number;
  section: string;
  title: string;
  detail: string;
  severity: "maintenance" | "recommendation" | "safety";
  temporalStatus: "reported-at-acquisition" | "current-observation";
  reviewStatus: "accepted" | "pending" | "unassigned" | "reviewed";
  extractionConfidence: number;
  entityConfidence: number;
  temporalConfidence: number;
  locationRationale: string;
  entityLinks: AssertionEntityLink[];
  mediaIds: string[];
};

export type MediaAsset = {
  id: string;
  documentId: string;
  label: string;
  kind: string;
  sourcePage: number;
  objectKey: string;
  mimeType: string;
  storageStatus: string;
};

export type SpatialZone = {
  id: string;
  homeId: string;
  entityId: string | null;
  name: string;
  mode: "exterior" | "first" | "second" | "lower" | "garage";
  zoneType: "room" | "facade" | "yard" | "roof" | "system-area" | "custom";
  geometryKind: "box" | "plane" | "polygon";
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  depth: number;
  vertices?: Array<[number, number, number]>;
  color: string;
  status: "active" | "draft";
  createdAt: string;
};

export type EvidencePin = {
  id: string;
  homeId: string;
  assertionId: string;
  mediaId: string | null;
  zoneId: string | null;
  entityId: string | null;
  mode: SpatialZone["mode"];
  x: number;
  y: number;
  z: number;
  label: string;
  confidence: number;
  status: "proposed" | "approved";
  rationale: string;
  createdAt: string;
};

export type TwinPayload = {
  home: HomeProfile;
  entities: TwinEntity[];
  events: TwinEvent[];
  evidence: Evidence[];
  documents: SourceDocument[];
  assertions: InspectionAssertion[];
  mediaAssets: MediaAsset[];
  spatialZones: SpatialZone[];
  evidencePins: EvidencePin[];
};

export const baselineHome: HomeProfile = {
  id: "willow-house",
  name: "Willow House",
  location: "Atlanta, Georgia",
  acquiredAt: "2022-06-15",
  yearBuilt: 1930,
  design: "Cottage",
  livingAreaSqFt: 2995,
  lotSqFt: 11021,
  roomCount: 9,
  bedrooms: 4,
  bathrooms: 3,
  qualityRating: "Q3",
  conditionRating: "C3",
  sourceLabel: "Acquisition appraisal",
  sourceDate: "2022-06-15",
};

export const baselineEntities: TwinEntity[] = [
  { id: "home", homeId: "willow-house", name: "Whole home", kind: "place", groupName: "Home", condition: "C3", detail: "Generally good condition and well maintained at acquisition.", sourcePage: 3 },
  { id: "foyer", homeId: "willow-house", name: "Foyer", kind: "place", groupName: "Main level", condition: "Unknown", detail: "Entry and foyer labeled in the acquisition building sketch.", sourcePage: 22 },
  { id: "living-room", homeId: "willow-house", name: "Living room", kind: "place", groupName: "Main level", condition: "Good", detail: "Oak flooring, sheetrock walls and wood trim.", sourcePage: 16 },
  { id: "dining-room", homeId: "willow-house", name: "Dining room", kind: "place", groupName: "Main level", condition: "Good", detail: "Documented in the acquisition interior photos.", sourcePage: 16 },
  { id: "kitchen", homeId: "willow-house", name: "Kitchen", kind: "place", groupName: "Main level", condition: "Updated", detail: "Updated approximately 1-5 years before the appraisal.", sourcePage: 17 },
  { id: "family-room", homeId: "willow-house", name: "Family room", kind: "place", groupName: "Main level", condition: "Good", detail: "Documented in the acquisition interior photos.", sourcePage: 17 },
  { id: "primary-suite", homeId: "willow-house", name: "Primary suite", kind: "place", groupName: "Main level", condition: "Good", detail: "Bedroom and bathroom documented separately in the appraisal.", sourcePage: 17 },
  { id: "bedrooms", homeId: "willow-house", name: "Bedrooms 2-4", kind: "place", groupName: "Upper + main", condition: "Good", detail: "Three secondary bedrooms documented across the interior photo set.", sourcePage: 18 },
  { id: "upper-left-bedroom", homeId: "willow-house", name: "Upper left bedroom", kind: "place", groupName: "Upper level", condition: "Good", detail: "Second-floor bedroom on the left side of the hall in the acquisition sketch.", sourcePage: 22 },
  { id: "upper-right-bedroom", homeId: "willow-house", name: "Upper right bedroom", kind: "place", groupName: "Upper level", condition: "Good", detail: "Second-floor bedroom across the hall from the other upper bedroom in the acquisition sketch.", sourcePage: 22 },
  { id: "bathrooms", homeId: "willow-house", name: "Bathrooms", kind: "place", groupName: "Whole home", condition: "Updated", detail: "Updated approximately 6-10 years before the appraisal.", sourcePage: 18 },
  { id: "loft", homeId: "willow-house", name: "Loft", kind: "place", groupName: "Upper level", condition: "Good", detail: "Finished loft area documented in the appraisal.", sourcePage: 18 },
  { id: "attic", homeId: "willow-house", name: "Attic", kind: "place", groupName: "Upper level", condition: "Unknown", detail: "Walk-in attic documented during the acquisition inspection.", sourcePage: 7 },
  { id: "primary-bathroom", homeId: "willow-house", name: "Primary bathroom", kind: "place", groupName: "Main level", condition: "Unknown", detail: "Acquisition-era bathroom observations are preserved as dated findings.", sourcePage: 8 },
  { id: "upstairs-hall-bathroom", homeId: "willow-house", name: "Upstairs hall bathroom", kind: "place", groupName: "Upper level", condition: "Unknown", detail: "The single upper-level hall bath sits at the end of the second-floor hallway.", sourcePage: 9 },
  { id: "main-level-bathroom", homeId: "willow-house", name: "Main-level bathroom", kind: "place", groupName: "Main level", condition: "Unknown", detail: "Acquisition-era bathroom observations are preserved as dated findings.", sourcePage: 10 },
  { id: "upper-level-bathroom", homeId: "willow-house", name: "Upper-level bathroom", kind: "place", groupName: "Upper level", condition: "Unknown", detail: "Acquisition-era bathroom observations are preserved as dated findings.", sourcePage: 10 },
  { id: "laundry", homeId: "willow-house", name: "Laundry", kind: "place", groupName: "Main level", condition: "Unknown", detail: "Laundry fixtures and protection measures documented during acquisition.", sourcePage: 10 },
  { id: "cellar", homeId: "willow-house", name: "Cellar", kind: "place", groupName: "Lower level", condition: "Unknown", detail: "Utility and structural area documented during the acquisition inspection.", sourcePage: 16 },
  { id: "crawlspace", homeId: "willow-house", name: "Crawlspace", kind: "place", groupName: "Lower level", condition: "Unknown", detail: "Foundation and service area documented during the acquisition inspection.", sourcePage: 47 },
  { id: "garage", homeId: "willow-house", name: "Detached garage", kind: "place", groupName: "Exterior", condition: "Good", detail: "Detached single garage with documented interior.", sourcePage: 16 },
  { id: "front-entry", homeId: "willow-house", name: "Front entry", kind: "place", groupName: "Exterior", condition: "Unknown", detail: "Primary exterior entry documented during the acquisition inspection.", sourcePage: 28 },
  { id: "front-yard", homeId: "willow-house", name: "Front yard", kind: "site", groupName: "Exterior", condition: "Unknown", detail: "Front approach and yard area documented by the Physical AI exterior photo walk.", sourcePage: 0 },
  { id: "left-side-exterior", homeId: "willow-house", name: "Left side exterior", kind: "site", groupName: "Exterior", condition: "Unknown", detail: "Left side facade and side-yard path documented by the Physical AI exterior photo walk.", sourcePage: 0 },
  { id: "rear-exterior", homeId: "willow-house", name: "Rear exterior", kind: "site", groupName: "Exterior", condition: "Unknown", detail: "Rear facade and backyard transition documented by the Physical AI exterior photo walk.", sourcePage: 0 },
  { id: "right-entry-porch", homeId: "willow-house", name: "Right entry porch", kind: "site", groupName: "Exterior", condition: "Unknown", detail: "Exterior entry documented during the acquisition inspection.", sourcePage: 29 },
  { id: "driveway", homeId: "willow-house", name: "Driveway", kind: "site", groupName: "Grounds", condition: "Unknown", detail: "Driveway documented during the acquisition inspection.", sourcePage: 31 },
  { id: "walkways", homeId: "willow-house", name: "Walkways and steps", kind: "site", groupName: "Grounds", condition: "Unknown", detail: "Exterior circulation documented during the acquisition inspection.", sourcePage: 32 },
  { id: "retaining-walls", homeId: "willow-house", name: "Retaining walls", kind: "site", groupName: "Grounds", condition: "Unknown", detail: "Site retaining walls documented during the acquisition inspection.", sourcePage: 34 },
  { id: "patios", homeId: "willow-house", name: "Rear patios", kind: "site", groupName: "Exterior", condition: "Good", detail: "Two detached patios within the fenced backyard.", sourcePage: 16 },
  { id: "yard", homeId: "willow-house", name: "Fenced yard", kind: "site", groupName: "Exterior", condition: "Good", detail: "Irregular 11,021 sq ft site with fenced rear yard.", sourcePage: 15 },
  { id: "structure", homeId: "willow-house", name: "Structure", kind: "system", groupName: "Building envelope", condition: "Average", detail: "Brick/block foundation and brick veneer exterior.", sourcePage: 3 },
  { id: "roof", homeId: "willow-house", name: "Roof", kind: "system", groupName: "Building envelope", condition: "Good", detail: "Fiberglass roof covering at acquisition.", sourcePage: 3 },
  { id: "windows", homeId: "willow-house", name: "Windows", kind: "system", groupName: "Building envelope", condition: "Good", detail: "Thermoglaze windows at acquisition.", sourcePage: 3 },
  { id: "hvac", homeId: "willow-house", name: "HVAC", kind: "system", groupName: "Mechanical", condition: "Operational", detail: "Central heating and cooling; utilities functioning at inspection.", sourcePage: 3 },
  { id: "plumbing", homeId: "willow-house", name: "Plumbing", kind: "system", groupName: "Mechanical", condition: "Operational", detail: "Utilities were on and functioning at inspection.", sourcePage: 3 },
  { id: "electrical", homeId: "willow-house", name: "Electrical", kind: "system", groupName: "Mechanical", condition: "Operational", detail: "Utilities were on and functioning at inspection.", sourcePage: 3 },
  { id: "finishes", homeId: "willow-house", name: "Interior finishes", kind: "system", groupName: "Interior", condition: "Good", detail: "Oak, sheetrock, wood, marble and ceramic finishes noted.", sourcePage: 3 },
  { id: "water-heater", homeId: "willow-house", name: "Water heater", kind: "system", groupName: "Mechanical", condition: "Unknown", detail: "Fifty-gallon gas water heater documented during acquisition.", sourcePage: 49 },
  { id: "generator", homeId: "willow-house", name: "Generator", kind: "system", groupName: "Electrical", condition: "Unknown", detail: "Standby generator documented during acquisition.", sourcePage: 23 },
  { id: "fireplace", homeId: "willow-house", name: "Living room fireplace", kind: "system", groupName: "Interior", condition: "Unknown", detail: "Gas-log fireplace documented during acquisition.", sourcePage: 43 },
];

export const baselineEvidence: Evidence[] = [
  { id: "ev-summary", homeId: "willow-house", label: "Property and condition summary", kind: "document", sourceRef: "Appraisal report, page 3", capturedAt: "2022-06-15", visibility: "private-source" },
  { id: "ev-exterior", homeId: "willow-house", label: "Exterior and street photos", kind: "photo-set", sourceRef: "Appraisal report, page 15", capturedAt: "2022-06-15", visibility: "private-source" },
  { id: "ev-interior", homeId: "willow-house", label: "Interior and site photos", kind: "photo-set", sourceRef: "Appraisal report, pages 16-18", capturedAt: "2022-06-15", visibility: "private-source" },
  { id: "ev-plat", homeId: "willow-house", label: "Plat map", kind: "drawing", sourceRef: "Appraisal report, page 21", capturedAt: "2022-06-15", visibility: "private-source" },
  { id: "ev-sketch", homeId: "willow-house", label: "Building sketch", kind: "drawing", sourceRef: "Appraisal report, page 22", capturedAt: "2022-06-15", visibility: "private-source" },
  { id: "ev-physical-ai-exterior-photo-walk", homeId: "willow-house", label: "Exterior baseline photo walk", kind: "photo-set", sourceRef: "Google Drive / Physical AI folder", capturedAt: "2026-08-02", visibility: "private-source" },
];

export const baselineEvent: TwinEvent = {
  id: "evt-acquisition-appraisal",
  homeId: "willow-house",
  occurredAt: "2022-06-15",
  title: "Acquisition appraisal baseline",
  type: "Baseline",
  summary: "The home was documented as a well-maintained 1930 cottage with Q3 quality and C3 overall condition. The report established the initial rooms, systems, site features, photos, plat and building sketch.",
  conditionBefore: null,
  conditionAfter: "C3",
  costCents: null,
  createdAt: "2022-06-15T12:00:00.000Z",
  entityIds: baselineEntities.map((entity) => entity.id),
  evidenceIds: baselineEvidence.map((item) => item.id),
};

export const drivePhotoWalkDocument = {
  id: "physical-ai-exterior-2026-08-02",
  homeId: baselineHome.id,
  title: "Physical AI exterior photo walk",
  documentType: "photo-walk",
  sourceDate: "2026-08-02",
  originalFilename: "Physical AI Google Drive folder",
  mimeType: "application/vnd.home-intelligence.photo-walk+json",
  pageCount: 30,
  objectKey: "drive://folders/1eRur5-UbUV4kNYlPx7WXLYQds55JazPO",
  sha256: "drive-folder-1eRur5-UbUV4kNYlPx7WXLYQds55JazPO",
  storageStatus: "referenced",
  visibility: "private",
};

const drivePhotoWalkFiles = [
  ["IMG_5270.HEIC", "1e7NZsxCaf5AkGuM5byiLwUxMB0UZB2mq", "front-entry", 0.92, "auto-accepted", "Owner described the folder as beginning at the front door; this is the first image in filename sequence."],
  ["IMG_5271.HEIC", "1x1-8M-nOPDWstC2T5KNXIKAO_KbLSDmf", "front-entry", 0.9, "auto-accepted", "Early sequence image in the owner-described front-door start of the walk."],
  ["IMG_5272.HEIC", "1N5XffdQRAnvCHvDyx9dANcCrSZwZT2eP", "front-yard", 0.86, "pending", "Likely front yard based on owner-described walk direction, but exact view should be reviewed."],
  ["IMG_5273.HEIC", "1jgfAyanrKYIrjklpYSOSkhD50-G3QbDi", "front-yard", 0.86, "pending", "Likely front yard based on owner-described walk direction, but exact view should be reviewed."],
  ["IMG_5274.HEIC", "1SKBiQxftCSFdgD-0BLvH270WsCoJprra", "front-yard", 0.86, "pending", "Likely front yard based on owner-described walk direction, but exact view should be reviewed."],
  ["IMG_5275.HEIC", "11S5bx8bZw_ZV2ee6lkaN4m3kZVIsRyxO", "front-yard", 0.84, "pending", "Owner-provided order indicates this is still in the front/front-side transition."],
  ["IMG_5276.HEIC", "16di4oOLAvGHocNYFxoMz_6w7fY62ykM5", "front-yard", 0.84, "pending", "Owner-provided order indicates this is still in the front/front-side transition."],
  ["IMG_5277.HEIC", "18KMn6gPg90Bs8i0reLam-iQs6lNgRgXo", "front-yard", 0.84, "pending", "Owner-provided order indicates this is still in the front/front-side transition."],
  ["IMG_5278.HEIC", "1GIKL01itRloNjBz62NXKe8pxkaaGhHt7", "left-side-exterior", 0.82, "pending", "Likely left side exterior from the transition after front yard in the walk sequence."],
  ["IMG_5279.HEIC", "1IHK2j9chFxiV1LJ-x4nMJmJW1vFulnAF", "left-side-exterior", 0.82, "pending", "Likely left side exterior from the transition after front yard in the walk sequence."],
  ["IMG_5280.HEIC", "1vvWitjmMDmHYfhZXNYl99hoqQyjE8GhU", "left-side-exterior", 0.82, "pending", "Likely side facade based on owner-described walk direction."],
  ["IMG_5281.HEIC", "1mP4H0_EVubyXj2MWjZtGp7eNLeBSQNjB", "left-side-exterior", 0.82, "pending", "Likely side facade based on owner-described walk direction."],
  ["IMG_5282.HEIC", "1sg_ICdz7q_rQ1K0A1fPmOa5CtMY6H-Oz", "left-side-exterior", 0.82, "pending", "Likely side facade based on owner-described walk direction."],
  ["IMG_5283.HEIC", "1QnfDPkR1i9gFKsvJdUq1REz8OmJy97GQ", "left-side-exterior", 0.82, "pending", "Likely side facade based on owner-described walk direction."],
  ["IMG_5284.HEIC", "1Jxyi4NL30Q8MMhkMlW_Vkr4iJWu3Ue0c", "left-side-exterior", 0.8, "pending", "Likely side-to-back transition; needs visual confirmation before finer tagging."],
  ["IMG_5285.HEIC", "1YHbFsJrMXq3mwC0iJav0FInPwhoSmnvK", "left-side-exterior", 0.8, "pending", "Likely side-to-back transition; needs visual confirmation before finer tagging."],
  ["IMG_5286.HEIC", "1rwBXyIlYY-VS5zCRm9IiWiVj4kd_rsM6", "rear-exterior", 0.84, "pending", "Likely rear exterior/backyard based on the latter half of the owner-described route."],
  ["IMG_5287.HEIC", "1TzIC1K5GoynOuJrgXFNMy6JCGRHWT9Cl", "rear-exterior", 0.84, "pending", "Likely rear exterior/backyard based on the latter half of the owner-described route."],
  ["IMG_5288.HEIC", "1VyGGVUmZZ5nweJxAKfeX9AfQv7hq3EoV", "rear-exterior", 0.84, "pending", "Likely rear exterior/backyard based on the latter half of the owner-described route."],
  ["IMG_5289.HEIC", "10gB4ztjVRO7FXrSLlQeDlE1ws4pydXy3", "rear-exterior", 0.84, "pending", "Likely rear exterior/backyard based on the latter half of the owner-described route."],
  ["IMG_5290.HEIC", "1w6upPUG1JEM1wHXpmypd5G4lyXJOA_LK", "yard", 0.84, "pending", "Likely backyard based on owner-described final route segment."],
  ["IMG_5291.HEIC", "1rgMdeCRJWQGPSBEDwCDXrtenjzLoNmNK", "yard", 0.84, "pending", "Likely backyard based on owner-described final route segment."],
  ["IMG_5292.HEIC", "1RDRftnUqLDy5WcTBhoELFw17tiyQYkBL", "yard", 0.84, "pending", "Likely backyard based on owner-described final route segment."],
  ["IMG_5293.HEIC", "12uqdRU5JCjvqPzjq-6CQ50vO9Ljwn87l", "yard", 0.84, "pending", "Likely backyard based on owner-described final route segment."],
  ["IMG_5294.HEIC", "1dZJ1DOofmPg7R6JB53Wp7gBJ-gcmcSkW", "yard", 0.84, "pending", "Likely backyard based on owner-described final route segment."],
  ["IMG_5295.HEIC", "16I34KdeN4kygMh-p9qX0mQ4i4_wZUn_m", "yard", 0.84, "pending", "Likely backyard based on owner-described final route segment."],
  ["IMG_5296.HEIC", "1dUtDO9hUP5wG4dv89hcIHKclcckytvTH", "yard", 0.84, "pending", "Likely backyard based on owner-described final route segment."],
  ["IMG_5297.HEIC", "1JNr_RcaWsFd3XQqfbAJITkUmmQLGs8qJ", "yard", 0.84, "pending", "Likely backyard based on owner-described final route segment."],
  ["IMG_5298.HEIC", "1uFsVvAxr7mOphTj4t8BRtfzVRJ6UE5f6", "yard", 0.84, "pending", "Likely backyard based on owner-described final route segment."],
  ["IMG_5299.HEIC", "1csliyfEMLZcIT9SyV7-Aqe7rbhE7rV1L", "yard", 0.84, "pending", "Likely backyard based on owner-described final route segment."],
] as const;

export const drivePhotoWalkMedia: Array<MediaAsset & { driveFileId: string; sourceRef: string; sha256: string }> = drivePhotoWalkFiles.map(([filename, driveFileId], index) => ({
  id: `media-physical-ai-${filename.toLowerCase().replace(".heic", "")}`,
  documentId: drivePhotoWalkDocument.id,
  label: filename,
  kind: "photo",
  sourcePage: index + 1,
  objectKey: `drive://${driveFileId}`,
  mimeType: "image/heif",
  storageStatus: "referenced",
  driveFileId,
  sourceRef: `Google Drive / Physical AI / ${filename}`,
  sha256: `drive-${driveFileId}`,
}));

export const drivePhotoWalkAssertions: InspectionAssertion[] = drivePhotoWalkFiles.map(([filename, , entityId, confidence, status, rationale], index) => ({
  id: `assert-physical-ai-${filename.toLowerCase().replace(".heic", "")}`,
  homeId: baselineHome.id,
  documentId: drivePhotoWalkDocument.id,
  reportItem: `Photo walk frame ${String(index + 1).padStart(2, "0")}`,
  sourcePage: index + 1,
  section: "Exterior photo walk",
  title: filename,
  detail: "Exterior baseline photo from the Physical AI Google Drive folder. The route was described by the homeowner as starting at the front door, moving left across the front yard and side of the house, then into the backyard.",
  severity: "maintenance",
  temporalStatus: "current-observation",
  reviewStatus: status === "auto-accepted" ? "accepted" : "pending",
  extractionConfidence: 0.98,
  entityConfidence: confidence,
  temporalConfidence: 0.94,
  locationRationale: rationale,
  entityLinks: [{
    entityId,
    relationship: "owner-described-route-segment",
    confidence,
    status,
    rationale,
  }],
  mediaIds: [`media-physical-ai-${filename.toLowerCase().replace(".heic", "")}`],
}));

export const drivePhotoWalkEvent: TwinEvent = {
  id: "evt-physical-ai-exterior-photo-walk-2026-08-02",
  homeId: baselineHome.id,
  occurredAt: "2026-08-02",
  title: "Exterior baseline photo walk",
  type: "Observation",
  summary: "Thirty exterior photos from the Physical AI Drive folder establish a current visual baseline from the front door, across the front and left side, and into the backyard. Broad route segments are recorded; exact feature tags remain review-gated.",
  conditionBefore: null,
  conditionAfter: "Documented",
  costCents: null,
  createdAt: "2026-08-02T23:33:36.877Z",
  entityIds: ["front-entry", "front-yard", "left-side-exterior", "rear-exterior", "yard"],
  evidenceIds: ["ev-physical-ai-exterior-photo-walk"],
};

export const baselineSpatialZones: SpatialZone[] = [
  { id: "zone-foyer", homeId: baselineHome.id, entityId: "foyer", name: "Foyer", mode: "first", zoneType: "room", geometryKind: "box", x: -12, y: 0.42, z: 19, width: 8, height: 0.9, depth: 11, color: "#e2ddd2", status: "active", createdAt: "2026-08-03T15:30:00.000Z" },
  { id: "zone-dining-room", homeId: baselineHome.id, entityId: "dining-room", name: "Dining room", mode: "first", zoneType: "room", geometryKind: "box", x: 6, y: 0.42, z: 20, width: 15, height: 0.9, depth: 10, color: "#c9d9c8", status: "active", createdAt: "2026-08-03T15:30:00.000Z" },
  { id: "zone-living-room", homeId: baselineHome.id, entityId: "living-room", name: "Living room", mode: "first", zoneType: "room", geometryKind: "box", x: -10, y: 0.42, z: 5, width: 14, height: 0.9, depth: 17, color: "#c9d9c8", status: "active", createdAt: "2026-08-03T15:30:00.000Z" },
  { id: "zone-kitchen", homeId: baselineHome.id, entityId: "kitchen", name: "Kitchen", mode: "first", zoneType: "room", geometryKind: "box", x: 9, y: 0.42, z: 7, width: 17, height: 0.9, depth: 15, color: "#d8c9ac", status: "active", createdAt: "2026-08-03T15:30:00.000Z" },
  { id: "zone-family-room", homeId: baselineHome.id, entityId: "family-room", name: "Family room", mode: "first", zoneType: "room", geometryKind: "box", x: -10, y: 0.42, z: -13, width: 14, height: 0.9, depth: 17, color: "#c9d9c8", status: "active", createdAt: "2026-08-03T15:30:00.000Z" },
  { id: "zone-primary-suite", homeId: baselineHome.id, entityId: "primary-suite", name: "Primary suite", mode: "first", zoneType: "room", geometryKind: "box", x: 9, y: 0.42, z: -10, width: 17, height: 0.9, depth: 14, color: "#c7d3df", status: "active", createdAt: "2026-08-03T15:30:00.000Z" },
  { id: "zone-primary-bathroom", homeId: baselineHome.id, entityId: "primary-bathroom", name: "Primary bathroom", mode: "first", zoneType: "room", geometryKind: "box", x: 9, y: 0.42, z: -22, width: 17, height: 0.9, depth: 8, color: "#d8c9ac", status: "active", createdAt: "2026-08-03T15:30:00.000Z" },
  { id: "zone-main-level-bathroom", homeId: baselineHome.id, entityId: "main-level-bathroom", name: "Main-level bathroom", mode: "first", zoneType: "room", geometryKind: "box", x: -1, y: 0.42, z: -22, width: 6, height: 0.9, depth: 8, color: "#d8c9ac", status: "active", createdAt: "2026-08-03T15:30:00.000Z" },
  { id: "zone-laundry", homeId: baselineHome.id, entityId: "laundry", name: "Laundry", mode: "first", zoneType: "room", geometryKind: "box", x: -14, y: 0.42, z: -21, width: 7, height: 0.9, depth: 8, color: "#c8c5bd", status: "active", createdAt: "2026-08-03T15:30:00.000Z" },
  { id: "zone-loft", homeId: baselineHome.id, entityId: "loft", name: "Loft", mode: "second", zoneType: "room", geometryKind: "box", x: 0, y: 0.42, z: -7, width: 15, height: 0.9, depth: 26, color: "#c9d9c8", status: "active", createdAt: "2026-08-03T15:30:00.000Z" },
  { id: "zone-upper-left-bedroom", homeId: baselineHome.id, entityId: "upper-left-bedroom", name: "Upper left bedroom", mode: "second", zoneType: "room", geometryKind: "box", x: -10.5, y: 0.42, z: 8, width: 12, height: 0.9, depth: 12, color: "#c7d3df", status: "active", createdAt: "2026-08-03T15:30:00.000Z" },
  { id: "zone-upper-right-bedroom", homeId: baselineHome.id, entityId: "upper-right-bedroom", name: "Upper right bedroom", mode: "second", zoneType: "room", geometryKind: "box", x: 10.5, y: 0.42, z: 8, width: 14, height: 0.9, depth: 12, color: "#c7d3df", status: "active", createdAt: "2026-08-03T15:30:00.000Z" },
  { id: "zone-upstairs-hall-bathroom", homeId: baselineHome.id, entityId: "upstairs-hall-bathroom", name: "Upstairs hall bathroom", mode: "second", zoneType: "room", geometryKind: "box", x: 0, y: 0.42, z: 20, width: 7.5, height: 0.9, depth: 13.5, color: "#d8c9ac", status: "active", createdAt: "2026-08-03T15:30:00.000Z" },
  { id: "zone-attic", homeId: baselineHome.id, entityId: "attic", name: "Attic", mode: "second", zoneType: "room", geometryKind: "box", x: 0, y: 0.42, z: -18, width: 12, height: 0.9, depth: 9, color: "#c8c5bd", status: "active", createdAt: "2026-08-03T15:30:00.000Z" },
  { id: "zone-cellar", homeId: baselineHome.id, entityId: "cellar", name: "Cellar", mode: "lower", zoneType: "room", geometryKind: "box", x: 7, y: 0.42, z: 3, width: 20, height: 0.9, depth: 25, color: "#c8c5bd", status: "active", createdAt: "2026-08-03T15:30:00.000Z" },
  { id: "zone-crawlspace", homeId: baselineHome.id, entityId: "crawlspace", name: "Crawlspace", mode: "lower", zoneType: "system-area", geometryKind: "box", x: -8, y: 0.42, z: -6, width: 15, height: 0.9, depth: 33, color: "#c8c5bd", status: "active", createdAt: "2026-08-03T15:30:00.000Z" },
  { id: "zone-garage", homeId: baselineHome.id, entityId: "garage", name: "Detached garage", mode: "garage", zoneType: "room", geometryKind: "box", x: 0, y: 0.42, z: 0, width: 11, height: 0.9, depth: 19, color: "#c8c5bd", status: "active", createdAt: "2026-08-03T15:30:00.000Z" },
  { id: "zone-front-door", homeId: baselineHome.id, entityId: "front-entry", name: "Front door", mode: "exterior", zoneType: "facade", geometryKind: "box", x: -11, y: 4, z: 27.2, width: 6, height: 8, depth: 1.2, color: "#d8c9ac", status: "active", createdAt: "2026-08-03T15:30:00.000Z" },
  { id: "zone-front-left-facade", homeId: baselineHome.id, entityId: "front-yard", name: "Front-left facade", mode: "exterior", zoneType: "facade", geometryKind: "box", x: -10, y: 5.2, z: 27, width: 15, height: 10, depth: 1.2, color: "#c7d3df", status: "active", createdAt: "2026-08-03T15:30:00.000Z" },
  { id: "zone-front-right-facade", homeId: baselineHome.id, entityId: "front-yard", name: "Front-right facade", mode: "exterior", zoneType: "facade", geometryKind: "box", x: 9, y: 5.2, z: 27, width: 18, height: 10, depth: 1.2, color: "#c7d3df", status: "active", createdAt: "2026-08-03T15:30:00.000Z" },
  { id: "zone-left-side-wall", homeId: baselineHome.id, entityId: "left-side-exterior", name: "Left side wall", mode: "exterior", zoneType: "facade", geometryKind: "box", x: -18.5, y: 5.2, z: 0, width: 1.2, height: 10, depth: 52, color: "#dfece5", status: "active", createdAt: "2026-08-03T15:30:00.000Z" },
  { id: "zone-rear-left-corner", homeId: baselineHome.id, entityId: "rear-exterior", name: "Rear-left corner", mode: "exterior", zoneType: "facade", geometryKind: "box", x: -13, y: 5.2, z: -27, width: 10, height: 10, depth: 1.2, color: "#f5ead5", status: "active", createdAt: "2026-08-03T15:30:00.000Z" },
  { id: "zone-rear-facade", homeId: baselineHome.id, entityId: "rear-exterior", name: "Rear facade", mode: "exterior", zoneType: "facade", geometryKind: "box", x: 5, y: 5.2, z: -27, width: 24, height: 10, depth: 1.2, color: "#f5ead5", status: "active", createdAt: "2026-08-03T15:30:00.000Z" },
  { id: "zone-backyard", homeId: baselineHome.id, entityId: "yard", name: "Backyard", mode: "exterior", zoneType: "yard", geometryKind: "plane", x: 0, y: 0.04, z: -46, width: 58, height: 0.1, depth: 36, color: "#dfece5", status: "active", createdAt: "2026-08-03T15:30:00.000Z" },
  { id: "zone-driveway", homeId: baselineHome.id, entityId: "driveway", name: "Driveway", mode: "exterior", zoneType: "yard", geometryKind: "plane", x: 27, y: 0.05, z: 16.5, width: 13, height: 0.1, depth: 86, color: "#e2ddd2", status: "active", createdAt: "2026-08-03T15:30:00.000Z" },
  { id: "zone-garage-front", homeId: baselineHome.id, entityId: "garage", name: "Garage front", mode: "exterior", zoneType: "facade", geometryKind: "box", x: 28, y: 3.8, z: -26.25, width: 11, height: 7, depth: 1.2, color: "#c8c5bd", status: "active", createdAt: "2026-08-03T15:30:00.000Z" },
];

const photoPinPositions: Record<string, { zoneId: string; entityId: string; position: [number, number, number] }> = {
  "IMG_5270.HEIC": { zoneId: "zone-front-door", entityId: "front-entry", position: [-11, 4.2, 27.9] },
  "IMG_5271.HEIC": { zoneId: "zone-front-door", entityId: "front-entry", position: [-10.2, 4.2, 27.9] },
  "IMG_5272.HEIC": { zoneId: "zone-front-left-facade", entityId: "front-yard", position: [-15, 5.5, 28] },
  "IMG_5273.HEIC": { zoneId: "zone-front-left-facade", entityId: "front-yard", position: [-10, 5.6, 28] },
  "IMG_5274.HEIC": { zoneId: "zone-front-right-facade", entityId: "front-yard", position: [0, 5.6, 28] },
  "IMG_5275.HEIC": { zoneId: "zone-front-right-facade", entityId: "front-yard", position: [8, 5.6, 28] },
  "IMG_5276.HEIC": { zoneId: "zone-front-right-facade", entityId: "front-yard", position: [14, 5.6, 28] },
  "IMG_5277.HEIC": { zoneId: "zone-left-side-wall", entityId: "left-side-exterior", position: [-19.2, 5.5, 19] },
  "IMG_5278.HEIC": { zoneId: "zone-left-side-wall", entityId: "left-side-exterior", position: [-19.2, 5.5, 12] },
  "IMG_5279.HEIC": { zoneId: "zone-left-side-wall", entityId: "left-side-exterior", position: [-19.2, 5.5, 5] },
  "IMG_5280.HEIC": { zoneId: "zone-left-side-wall", entityId: "left-side-exterior", position: [-19.2, 5.5, -2] },
  "IMG_5281.HEIC": { zoneId: "zone-left-side-wall", entityId: "left-side-exterior", position: [-19.2, 5.5, -9] },
  "IMG_5282.HEIC": { zoneId: "zone-left-side-wall", entityId: "left-side-exterior", position: [-19.2, 5.5, -16] },
  "IMG_5283.HEIC": { zoneId: "zone-left-side-wall", entityId: "left-side-exterior", position: [-19.2, 5.5, -23] },
  "IMG_5284.HEIC": { zoneId: "zone-rear-left-corner", entityId: "rear-exterior", position: [-16, 5.5, -28] },
  "IMG_5285.HEIC": { zoneId: "zone-rear-left-corner", entityId: "rear-exterior", position: [-10, 5.5, -28] },
  "IMG_5286.HEIC": { zoneId: "zone-rear-facade", entityId: "rear-exterior", position: [-4, 5.5, -28] },
  "IMG_5287.HEIC": { zoneId: "zone-rear-facade", entityId: "rear-exterior", position: [2, 5.5, -28] },
  "IMG_5288.HEIC": { zoneId: "zone-rear-facade", entityId: "rear-exterior", position: [8, 5.5, -28] },
  "IMG_5289.HEIC": { zoneId: "zone-rear-facade", entityId: "rear-exterior", position: [14, 5.5, -28] },
  "IMG_5290.HEIC": { zoneId: "zone-backyard", entityId: "yard", position: [-20, 1.2, -38] },
  "IMG_5291.HEIC": { zoneId: "zone-backyard", entityId: "yard", position: [-15, 1.2, -43] },
  "IMG_5292.HEIC": { zoneId: "zone-backyard", entityId: "yard", position: [-10, 1.2, -48] },
  "IMG_5293.HEIC": { zoneId: "zone-backyard", entityId: "yard", position: [-5, 1.2, -52] },
  "IMG_5294.HEIC": { zoneId: "zone-backyard", entityId: "yard", position: [0, 1.2, -55] },
  "IMG_5295.HEIC": { zoneId: "zone-backyard", entityId: "yard", position: [5, 1.2, -52] },
  "IMG_5296.HEIC": { zoneId: "zone-backyard", entityId: "yard", position: [10, 1.2, -48] },
  "IMG_5297.HEIC": { zoneId: "zone-backyard", entityId: "yard", position: [15, 1.2, -43] },
  "IMG_5298.HEIC": { zoneId: "zone-backyard", entityId: "yard", position: [20, 1.2, -38] },
  "IMG_5299.HEIC": { zoneId: "zone-backyard", entityId: "yard", position: [24, 1.2, -34] },
};

export const drivePhotoWalkPins: EvidencePin[] = drivePhotoWalkFiles.map(([filename], index) => {
  const target = photoPinPositions[filename];
  const [x, y, z] = target.position;
  return {
    id: `pin-physical-ai-${filename.toLowerCase().replace(".heic", "")}`,
    homeId: baselineHome.id,
    assertionId: `assert-physical-ai-${filename.toLowerCase().replace(".heic", "")}`,
    mediaId: `media-physical-ai-${filename.toLowerCase().replace(".heic", "")}`,
    zoneId: target.zoneId,
    entityId: target.entityId,
    mode: "exterior",
    x,
    y,
    z,
    label: `Frame ${index + 1}`,
    confidence: index < 2 ? 0.9 : 0.78,
    status: index < 2 ? "approved" : "proposed",
    rationale: "Initial spatial pin inferred from the homeowner-described photo-walk sequence; refine manually if the photo view is more specific.",
    createdAt: "2026-08-03T15:30:00.000Z",
  };
});

export const baselineTwin: TwinPayload = {
  home: baselineHome,
  entities: baselineEntities,
  events: [drivePhotoWalkEvent, baselineEvent],
  evidence: baselineEvidence,
  documents: [drivePhotoWalkDocument],
  assertions: drivePhotoWalkAssertions,
  mediaAssets: drivePhotoWalkMedia,
  spatialZones: baselineSpatialZones,
  evidencePins: drivePhotoWalkPins,
};
