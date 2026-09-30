import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type { InquiryPolicy } from "./contract.ts";

export const tokenLifetimeMs = 30 * 60 * 1000;
export function policyHash(policy: InquiryPolicy): string {
  return createHash("sha256").update(JSON.stringify([policy.version, policy.controller, policy.purpose, policy.retentionDays, policy.contact])).digest("hex");
}
export function keyedHash(secret: string, purpose: string, value: string): string {
  return createHmac("sha256", secret).update(`${purpose}\0${value}`).digest("hex");
}
export function issueInquiryToken(secret: string, policy: InquiryPolicy, now = Date.now()): string {
  const payload = Buffer.from(JSON.stringify({ id: randomUUID(), issuedAt: now, policy: policyHash(policy) })).toString("base64url");
  return `${payload}.${keyedHash(secret, "form-token", payload)}`;
}
export function verifyInquiryToken(token: unknown, secret: string, policy: InquiryPolicy, now = Date.now()):
  | { ok: true; requestId: string }
  | { ok: false; code: "invalid_token" | "expired_token" | "too_fast" | "policy_changed" } {
  if (typeof token !== "string" || token.length > 800 || !/^[A-Za-z0-9_-]+\.[a-f0-9]{64}$/.test(token)) return { ok: false, code: "invalid_token" };
  const [payload, signature] = token.split(".");
  if (!timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(keyedHash(secret, "form-token", payload), "hex"))) return { ok: false, code: "invalid_token" };
  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!claims || typeof claims !== "object" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(claims.id) || !Number.isSafeInteger(claims.issuedAt)) return { ok: false, code: "invalid_token" };
    if (claims.policy !== policyHash(policy)) return { ok: false, code: "policy_changed" };
    if (now - claims.issuedAt > tokenLifetimeMs || claims.issuedAt > now + 5000) return { ok: false, code: "expired_token" };
    if (now - claims.issuedAt < 1000) return { ok: false, code: "too_fast" };
    return { ok: true, requestId: claims.id };
  } catch { return { ok: false, code: "invalid_token" }; }
}
