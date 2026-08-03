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
  temporalStatus: "reported-at-acquisition";
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
  mimeType: string;
  storageStatus: string;
};

export type TwinPayload = {
  home: HomeProfile;
  entities: TwinEntity[];
  events: TwinEvent[];
  evidence: Evidence[];
  documents: SourceDocument[];
  assertions: InspectionAssertion[];
  mediaAssets: MediaAsset[];
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
  { id: "bathrooms", homeId: "willow-house", name: "Bathrooms", kind: "place", groupName: "Whole home", condition: "Updated", detail: "Updated approximately 6-10 years before the appraisal.", sourcePage: 18 },
  { id: "loft", homeId: "willow-house", name: "Loft", kind: "place", groupName: "Upper level", condition: "Good", detail: "Finished loft area documented in the appraisal.", sourcePage: 18 },
  { id: "attic", homeId: "willow-house", name: "Attic", kind: "place", groupName: "Upper level", condition: "Unknown", detail: "Walk-in attic documented during the acquisition inspection.", sourcePage: 7 },
  { id: "primary-bathroom", homeId: "willow-house", name: "Primary bathroom", kind: "place", groupName: "Main level", condition: "Unknown", detail: "Acquisition-era bathroom observations are preserved as dated findings.", sourcePage: 8 },
  { id: "upstairs-hall-bathroom", homeId: "willow-house", name: "Upstairs hall bathroom", kind: "place", groupName: "Upper level", condition: "Unknown", detail: "Acquisition-era bathroom observations are preserved as dated findings.", sourcePage: 9 },
  { id: "main-level-bathroom", homeId: "willow-house", name: "Main-level bathroom", kind: "place", groupName: "Main level", condition: "Unknown", detail: "Acquisition-era bathroom observations are preserved as dated findings.", sourcePage: 10 },
  { id: "upper-level-bathroom", homeId: "willow-house", name: "Upper-level bathroom", kind: "place", groupName: "Upper level", condition: "Unknown", detail: "Acquisition-era bathroom observations are preserved as dated findings.", sourcePage: 10 },
  { id: "laundry", homeId: "willow-house", name: "Laundry", kind: "place", groupName: "Main level", condition: "Unknown", detail: "Laundry fixtures and protection measures documented during acquisition.", sourcePage: 10 },
  { id: "cellar", homeId: "willow-house", name: "Cellar", kind: "place", groupName: "Lower level", condition: "Unknown", detail: "Utility and structural area documented during the acquisition inspection.", sourcePage: 16 },
  { id: "crawlspace", homeId: "willow-house", name: "Crawlspace", kind: "place", groupName: "Lower level", condition: "Unknown", detail: "Foundation and service area documented during the acquisition inspection.", sourcePage: 47 },
  { id: "garage", homeId: "willow-house", name: "Detached garage", kind: "place", groupName: "Exterior", condition: "Good", detail: "Detached single garage with documented interior.", sourcePage: 16 },
  { id: "front-entry", homeId: "willow-house", name: "Front entry", kind: "place", groupName: "Exterior", condition: "Unknown", detail: "Primary exterior entry documented during the acquisition inspection.", sourcePage: 28 },
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

export const baselineTwin: TwinPayload = {
  home: baselineHome,
  entities: baselineEntities,
  events: [baselineEvent],
  evidence: baselineEvidence,
  documents: [],
  assertions: [],
  mediaAssets: [],
};
