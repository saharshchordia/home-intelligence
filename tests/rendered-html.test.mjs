import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("ships the Home Intelligence product surface", async () => {
  const [page, dashboard, houseModel, modelLayout, layout, baseline, packageJson] = await Promise.all([
    readFile(new URL("app/page.tsx", root), "utf8"),
    readFile(new URL("app/components/TwinDashboard.tsx", root), "utf8"),
    readFile(new URL("app/components/HouseModel.tsx", root), "utf8"),
    readFile(new URL("lib/model-layout.ts", root), "utf8"),
    readFile(new URL("app/layout.tsx", root), "utf8"),
    readFile(new URL("lib/twin-data.ts", root), "utf8"),
    readFile(new URL("package.json", root), "utf8"),
  ]);

  assert.match(page, /<TwinDashboard initialTwin=\{baselineTwin\}/);
  assert.match(dashboard, /Home Intelligence/);
  assert.match(dashboard, /useState<Tab>\("Home model"\)/);
  assert.match(dashboard, /acceptedLinkStatuses\.has\(link\.status\)/);
  assert.match(houseModel, /WebGLRenderer/);
  assert.match(houseModel, /OrbitControls/);
  assert.match(modelLayout, /modelPlacements/);
  assert.match(modelLayout, /First floor/);
  assert.match(dashboard, /Add update/);
  assert.match(dashboard, /Evidence review/);
  assert.match(dashboard, /submitReview/);
  assert.match(dashboard, /fetch\(apiUrl\("\/api\/twin"\)\)/);
  assert.match(layout, /A living, evidence-linked history of a home/);
  assert.match(baseline, /Acquisition appraisal baseline/);
  assert.match(baseline, /2022-06-15/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton|site-creator-vinext-starter/);
  assert.doesNotMatch(`${page}\n${dashboard}\n${houseModel}\n${layout}`, /codex-preview|SkeletonPreview/);
});

test("includes GitHub Pages frontend and Supabase API wiring", async () => {
  const [pagesEntry, pagesWorkflow, supabaseMigration, supabaseFunction, supabaseSeed] = await Promise.all([
    readFile(new URL("github-pages/src/main.tsx", root), "utf8"),
    readFile(new URL(".github/workflows/pages.yml", root), "utf8"),
    readFile(new URL("supabase/migrations/0001_home_intelligence.sql", root), "utf8"),
    readFile(new URL("supabase/functions/home-api/index.ts", root), "utf8"),
    readFile(new URL("scripts/seed-supabase.ts", root), "utf8"),
  ]);

  assert.match(pagesEntry, /VITE_HOME_API_BASE_URL/);
  assert.match(pagesEntry, /VITE_SUPABASE_URL/);
  assert.match(pagesEntry, /mode="static"/);
  assert.match(pagesWorkflow, /VITE_HOME_API_BASE_URL/);
  assert.match(pagesWorkflow, /VITE_SUPABASE_PUBLISHABLE_KEY/);
  assert.match(supabaseMigration, /enable row level security/);
  assert.match(supabaseMigration, /home-evidence/);
  assert.match(supabaseFunction, /createClient/);
  assert.match(supabaseFunction, /GET \/api\/twin/);
  assert.match(supabaseSeed, /HOME_OWNER_USER_ID/);
});

test("includes persistence, documentation and the social preview", async () => {
  const migrations = await readdir(new URL("drizzle/", root));
  assert.ok(migrations.some((name) => name.endsWith(".sql")));
  await Promise.all([
    access(new URL("public/og.png", root)),
    access(new URL("docs/architecture.md", root)),
    access(new URL("app/api/import/inspection/route.ts", root)),
    access(new URL("app/api/evidence/route.ts", root)),
    access(new URL("app/api/review/route.ts", root)),
    access(new URL("app/api/storage/route.ts", root)),
    access(new URL("LICENSE", root)),
  ]);
});

test("keeps private appraisal identifiers out of public source", async () => {
  const [publicBaseline, importRoute, architecture] = await Promise.all([
    readFile(new URL("lib/twin-data.ts", root), "utf8"),
    readFile(new URL("app/api/import/inspection/route.ts", root), "utf8"),
    readFile(new URL("docs/architecture.md", root), "utf8"),
  ]);
  const publicSource = `${publicBaseline}\n${importRoute}\n${architecture}`;
  assert.doesNotMatch(publicSource, /borrower|parcel identifier|tax amount|2209 willow|saharsh chordia/i);
  assert.match(publicBaseline, /location: "Atlanta, Georgia"/);
  assert.doesNotMatch(publicSource, /cockroach|termite damage|asbestos material/i);
});
