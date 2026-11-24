import { test } from "node:test";
import assert from "node:assert/strict";
import { staffLoginUrl, staffReturnPath } from "../src/lib/staff-login.ts";
test("only workspace paths survive the public login entry", () => {
  for (const path of ["https://evil.invalid", "//evil.invalid", "/\\evil", "/roadmap/auth/company/start", "/workspace?token=secret", "/roadmap/%2f%2fevil", "/workspace\n"]) assert.equal(staffReturnPath(path), "/");
  assert.equal(staffReturnPath("/roadmap/quarters?year=2026"), "/roadmap/quarters?year=2026");
  for (const path of ["/assignments/manage?member=some-member", "/companies/one", "/mentoring/program?tab=rounds", "/consulting"])
    assert.equal(staffLoginUrl(path).searchParams.get("next"), path);
  assert.equal(staffReturnPath("/consulting/api/me"), "/");
  assert.equal(staffLoginUrl("/roadmap").origin, "https://workspace.exventure.co.kr");
  assert.equal(staffLoginUrl("/workspace", true).origin, "http://127.0.0.1:3000");
});
