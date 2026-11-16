import { readInquiryBackend, reservedSupabaseRefs } from "../inquiries/backend-settings.ts";
import { companyIssuer, companyPortal, legacyCompanyPortal, uuidPattern } from "./contract.ts";
import { localIntegration } from "../local-integration.ts";
export type CompanyConfig = { origin: string; issuer: string; portal: string; clientId: string; key: string; approvedAccountIds: readonly string[]; localIntegration?: true };
function readApprovedAccountIds(env: Record<string, string | undefined>): string[] | null {
  // A configured list replaces the legacy single account, including when invalid.
  const raw = env.WEBSITE_COMPANY_ADMIN_ACCOUNT_IDS ?? env.WEBSITE_COMPANY_ADMIN_ACCOUNT_ID;
  if (!raw || raw.length > 4096) return null;
  const ids = raw.split(",").map(id => id.trim());
  if (ids.length > 100 || !ids.every(id => uuidPattern.test(id))) return null;
  return [...new Set(ids)];
}
/** No default client, key, account grant, or HTTP authentication fallback. */
export function readCompanyConfig(env: Record<string, string | undefined>): CompanyConfig | null {
  if (env.WEBSITE_COMPANY_SSO_ENABLED !== "true" || env.WEBSITE_COMPANY_AUTH_PROVISIONED !== "true") return null;
  const backend = readInquiryBackend(env);
  const clientId = env.WEBSITE_COMPANY_OIDC_CLIENT_ID, key = env.WEBSITE_COMPANY_SESSION_KEY, approvedAccountIds = readApprovedAccountIds(env);
  if (!backend || backend.mode !== "supabase" || !clientId || !/^[A-Za-z0-9._-]{1,200}$/.test(clientId) || !key || !/^[a-f0-9]{64}$/.test(key) || !approvedAccountIds) return null;
  if (backend.localIntegration) return { origin: backend.origin, issuer: localIntegration.issuer, portal: localIntegration.portal, clientId, key, approvedAccountIds, localIntegration: true };
  if (!backend.origin.startsWith("https://")) return null;
  if (env.VERCEL_ENV === "production") return { origin: backend.origin, issuer: companyIssuer, portal: companyPortal, clientId, key, approvedAccountIds };
  // Nonproduction must opt into its own central identity project. Never fall back to production Auth.
  const ref = env.WEBSITE_COMPANY_TEST_PROJECT_REF;
  if (!ref || !/^[a-z]{20}$/.test(ref) || reservedSupabaseRefs.has(ref)) return null;
  try {
    const portal = new URL(env.WEBSITE_COMPANY_TEST_PORTAL_ORIGIN ?? "");
    if (portal.protocol !== "https:" || portal.username || portal.password || portal.port || portal.search || portal.hash || portal.pathname !== "/" || [companyPortal, legacyCompanyPortal].includes(portal.origin)) return null;
    return { origin: backend.origin, issuer: `https://${ref}.supabase.co/auth/v1`, portal: portal.origin, clientId, key, approvedAccountIds };
  } catch { return null; }
}
