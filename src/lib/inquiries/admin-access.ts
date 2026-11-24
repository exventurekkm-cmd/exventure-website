import { companyPortal, uuidPattern, websiteApplication, type CompanySession } from "../company/contract.ts";
export { websiteApplication } from "../company/contract.ts";
export type { CompanySession } from "../company/contract.ts";
export async function checkInquiryAdminAccess(session: CompanySession | null, approvedAccountIds: readonly string[], fetcher: typeof fetch = fetch, portal = companyPortal): Promise<boolean> {
  if (!session || !Number.isSafeInteger(session.expiresAt) || session.expiresAt <= Date.now() || !session.accessToken || session.accessToken.length > 16000 || !uuidPattern.test(session.subject)) return false;
  try {
    const response = await fetcher(`${portal}/api/identity/access?application=${websiteApplication}`, { headers: { Authorization: `Bearer ${session.accessToken}` }, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(5000) });
    if (!response.ok) return false;
    const access = await response.json();
    // Only the live central response can override the ordinary admin allowlist.
    return access?.active === true && access.application_id === websiteApplication && access.account_id === session.subject && access.role === "admin"
      && (approvedAccountIds.includes(session.subject) || access.is_master === true);
  } catch { return false; }
}
