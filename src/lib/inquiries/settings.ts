import type { InquiryPolicy } from "./contract.ts";
import { readInquiryBackend } from "./backend-settings.ts";
import { readPrivacyDetails, type PrivacyDetails } from "./privacy-details.ts";
import { readCompanyConfig } from "../company/config.ts";
import { isHostedRuntime } from "../local-integration.ts";
export { productionWebsiteRef } from "./backend-settings.ts";
export type InquirySettings = {
  mode: "local-test" | "supabase"; origin: string; secret: string; policy: InquiryPolicy;
  database?: { url: string; secret: string };
  privacyDetails?: PrivacyDetails;
  localIntegration?: true;
};
export type SettingsResult = { enabled: true; settings: InquirySettings } | { enabled: false; reason: string };
export const localTestPolicy: InquiryPolicy = {
  version: "local-synthetic-test-v2", controller: "엑스벤처 · 로컬 테스트", purpose: "문의 접수·내용 확인·답변 (가상 데이터 검증)",
  retentionDays: 90, contact: "",
};
function readPolicy(raw: string | undefined): InquiryPolicy | null {
  try {
    const value = JSON.parse(raw ?? "null") as InquiryPolicy | null;
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    for (const [key, max] of [["version", 60], ["controller", 120], ["purpose", 500]] as const) {
      if (typeof value[key] !== "string" || !value[key].trim() || value[key].length > max || /[\p{Cc}\p{Cf}]/u.test(value[key])) return null;
    }
    if (!/^[a-zA-Z0-9._-]{1,80}$/.test(value.version) || !Number.isInteger(value.retentionDays) || value.retentionDays < 1 || value.retentionDays > 90) return null;
    // Copy only the public, approved policy fields; never serialize the environment.
    return { version: value.version, controller: value.controller, purpose: value.purpose, retentionDays: value.retentionDays, contact: "" };
  } catch { return null; }
}
export function readInquirySettings(env: Record<string, string | undefined>): SettingsResult {
  const disabled = (reason: string): SettingsResult => ({ enabled: false, reason });
  const mode = env.WEBSITE_INQUIRY_MODE;
  if (!mode || mode === "disabled") return disabled("disabled");
  let origin: URL;
  try {
    origin = new URL(env.WEBSITE_INQUIRY_ORIGIN ?? "");
    if (origin.username || origin.password || origin.search || origin.hash || origin.pathname !== "/") return disabled("invalid-origin");
  } catch { return disabled("invalid-origin"); }
  const secret = env.WEBSITE_INQUIRY_SIGNING_SECRET;
  if (!secret || secret.length < 32) return disabled("missing-signing-secret");
  if (env.WEBSITE_LOCAL_INTEGRATION_ENABLED === "true") {
    const backend = readInquiryBackend(env);
    if (mode !== "supabase" || !backend?.localIntegration || !readCompanyConfig(env)) return disabled("local-integration-not-ready");
    return { enabled: true, settings: { ...backend, secret, policy: localTestPolicy } };
  }
  if (mode === "local-test") {
    if (isHostedRuntime(env) || origin.protocol !== "http:" || !["127.0.0.1", "localhost", "[::1]"].includes(origin.hostname)) return disabled("local-test-requires-loopback");
    return { enabled: true, settings: { mode, origin: origin.origin, secret, policy: localTestPolicy } };
  }
  if (mode !== "supabase") return disabled("unknown-mode");
  if (env.WEBSITE_INQUIRY_POLICY_APPROVED !== "true") return disabled("policy-not-approved");
  if (env.WEBSITE_INQUIRY_PROCESSOR_REVIEW_APPROVED !== "true") return disabled("processor-review-not-approved");
  const policy = readPolicy(env.WEBSITE_INQUIRY_POLICY_JSON);
  if (!policy) return disabled("missing-policy");
  const privacyDetails = readPrivacyDetails(env.WEBSITE_INQUIRY_PRIVACY_DETAILS_JSON, policy.version, policy.controller);
  if (!privacyDetails) return disabled("privacy-details-incomplete");
  const backend = readInquiryBackend(env);
  if (!backend || backend.mode !== "supabase") return disabled("backend-boundary-not-ready");
  if (!readCompanyConfig(env)) return disabled("administrator-auth-not-ready");
  if (env.WEBSITE_INQUIRY_PURGE_ENABLED !== "true" || env.WEBSITE_INQUIRY_RETENTION_OPERATIONS_APPROVED !== "true") return disabled("retention-operations-not-ready");
  return { enabled: true, settings: { ...backend, secret, policy, privacyDetails } };
}
export function isTestInquiry(settings: Pick<InquirySettings, "mode" | "localIntegration">): boolean {
  return settings.mode === "local-test" || settings.localIntegration === true;
}
