import assert from "node:assert/strict";
import { resolve } from "node:path";
import { test } from "node:test";
import { pathToFileURL } from "node:url";

const websiteLogin = process.env.EXVENTURE_WEBSITE_DIR
  ? pathToFileURL(resolve(process.env.EXVENTURE_WEBSITE_DIR, "src/lib/staff-login.ts"))
  : new URL("../src/lib/staff-login.ts", import.meta.url);
const { staffLoginUrl } = await import(websiteLogin.href);

// These public entry points remain part of the contract even if a module
// accidentally disappears from the staff navigation.
const destinations = new Set([
  "/", "/roadmap", "/workspace", "/research", "/companies", "/mentoring", "/consulting", "/buyer-bridge", "/buyer-bridge/projects/new",
  "/research/projects/91000000-0000-4000-8000-000000000001?year=2026",
  "/research/surveys/91000000-0000-4000-8000-000000000002/report?historyPage=2",
  "/research?q=%EC%A1%B0%EC%82%AC", "/roadmap/quarters?year=2026", "/mentoring/new",
  "/assignments", "/assignments/manage?member=91000000-0000-4000-8000-000000000001",
  "/assignments/results/91000000-0000-4000-8000-000000000002",
]);

const workspaceDir = process.env.EXVENTURE_WORKSPACE_DIR;
let workspaceReturnPath;
if (workspaceDir) {
  const loadWorkspaceFile = (file) => import(pathToFileURL(resolve(workspaceDir, file)).href);
  const { workspaceModules } = await loadWorkspaceFile("src/platform/modules.ts");
  ({ staffReturnPath: workspaceReturnPath } = await loadWorkspaceFile("src/platform/staff-identity.ts"));
  assert.equal(typeof workspaceReturnPath, "function", "workspace must expose its staff return policy");
  for (const module of workspaceModules) {
    if (!module.external) destinations.add(module.href);
  }
}

function checkHandoff(url, destination) {
  assert.equal(url.origin, "https://workspace.exventure.co.kr");
  assert.equal(url.pathname, "/auth/staff/start");
  assert.deepEqual(url.searchParams.getAll("next"), [destination]);
}

for (const destination of destinations) {
  test(`website hands off the staff destination ${destination}`, () => {
    const handoff = staffLoginUrl(destination);
    checkHandoff(handoff, destination);
    if (workspaceReturnPath) {
      assert.equal(workspaceReturnPath(handoff.searchParams.get("next")), destination);
    }
  });

  if (process.env.EXVENTURE_VERIFY_LIVE === "1") {
    test(`published website hands off ${destination}`, async () => {
      const entry = new URL("https://exventure.co.kr/login");
      entry.searchParams.set("next", destination);
      const response = await fetch(entry, { redirect: "manual", signal: AbortSignal.timeout(10000) });
      assert.ok([301, 302, 303, 307, 308].includes(response.status), `GET /login returned ${response.status}`);
      const location = response.headers.get("location");
      assert.ok(location, "missing Location on the staff login redirect");
      checkHandoff(new URL(location, entry), destination);
    });
  }
}
