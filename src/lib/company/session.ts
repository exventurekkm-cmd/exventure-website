import { checkInquiryAdminAccess } from "../inquiries/admin-access.ts";
import { openCompanyData, readCookie, sessionCookie, sessionHash, uuidPattern, type CompanySession, type WebsiteSessionStore } from "./contract.ts";
import type { CompanyConfig } from "./config.ts";
/** Read the verified server session and recheck central permission on every protected request. */
export async function authorizeWebsiteSession(cookie: string | null, config: CompanyConfig, store: WebsiteSessionStore, fetcher: typeof fetch = fetch): Promise<CompanySession | null> {
  const token = readCookie(cookie, sessionCookie);
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const hash = sessionHash(token);
  try {
    const payload = await store.readSession(hash);
    if (!payload) return null;
    const session = openCompanyData<CompanySession>(payload, config.key, "session");
    if (!uuidPattern.test(session.subject) || typeof session.accessToken !== "string" || !await checkInquiryAdminAccess(session, config.approvedAccountId, fetcher, config.portal)) {
      await store.deleteSession(hash); return null;
    }
    return session;
  } catch {
    // Invalid/expired sessions and unavailable permission services never yield access.
    try { await store.deleteSession(hash); } catch { /* Subsequent requests still fail closed. */ }
    return null;
  }
}
