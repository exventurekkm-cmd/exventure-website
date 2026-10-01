import { test } from "node:test";
import assert from "node:assert/strict";
import { staffLoginUrl, staffReturnPath } from "../src/lib/staff-login.ts";
test("only workspace paths survive the public login entry", () => {
  for (const path of ["https://evil.invalid", "//evil.invalid", "/\\evil", "/roadmap/auth/company/start", "/workspace?token=secret", "/roadmap/%2f%2fevil", "/workspace\n"]) assert.equal(staffReturnPath(path), "/");
  assert.equal(staffReturnPath("/roadmap/quarters?year=2026"), "/roadmap/quarters?year=2026");
  assert.equal(staffLoginUrl("/roadmap").origin, "https://exventure-workspace.vercel.app");
  assert.equal(staffLoginUrl("/workspace", true).origin, "http://127.0.0.1:3000");
});
