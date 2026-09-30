import { companyPortal, uuidPattern, websiteApplication, type CompanySession } from "../company/contract.ts";
export { websiteApplication } from "../company/contract.ts";
export type { CompanySession } from "../company/contract.ts";
export async function checkInquiryAdminAccess(session: CompanySession | null, approvedAccountId: string, fetcher: typeof fetch = fetch, portal = companyPortal): Promise<boolean> {
  if (!session || !Number.isSafeInteger(session.expiresAt) || session.expiresAt <= Date.now() || !session.accessToken || session.accessToken.length > 16000 || session.subject !== approvedAccountId || !uuidPattern.test(approvedAccountId)) return false;
  try {
    const response = await fetcher(`${portal}/api/identity/access?application=${websiteApplication}`, { headers: { Authorization: `Bearer ${session.accessToken}` }, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(5000) });
    if (!response.ok) return false;
    const access = await response.json();
    return access?.active === true && access.application_id === websiteApplication && access.account_id === session.subject && access.role === "admin";
  } catch { return false; }
}
