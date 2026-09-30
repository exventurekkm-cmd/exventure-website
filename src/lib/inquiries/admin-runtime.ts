import "server-only";
import { cookies } from "next/headers";
import { inquiryStore } from "./runtime.ts";
import { readInquiryBackend } from "./backend-settings.ts";
import { readCompanyConfig } from "../company/config.ts";
import { authorizeWebsiteSession } from "../company/session.ts";
import { checkInquiryAdminAccess, websiteApplication } from "./admin-access.ts";
import type { WebsiteStore } from "./store.ts";

export const fixtureAdminId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
export type InquiryAdminContext = { store: WebsiteStore; actorId: string; origin: string; testOnly: boolean; localIntegration?: true };
export async function inquiryAdminContext(request?: Request): Promise<InquiryAdminContext | null> {
  const settings = readInquiryBackend(process.env);
  if (!settings) return null;
  if (settings.mode === "supabase") {
    const config = readCompanyConfig(process.env);
    if (!config) return null;
    const store = await inquiryStore(settings);
    const session = await authorizeWebsiteSession(request ? request.headers.get("cookie") : (await cookies()).toString(), config, store);
    return session ? { store, actorId: session.subject, origin: config.origin, testOnly: settings.localIntegration === true, localIntegration: settings.localIntegration } : null;
  }
  // Explicit synthetic fixture only; no header, company-admin shortcut, or hosted fixture access.
  if (process.env.VERCEL || process.env.VERCEL_ENV) return null;
  const role = process.env.WEBSITE_INQUIRY_LOCAL_ADMIN_ROLE ?? "viewer";
  const fixture: typeof fetch = async () => Response.json({ active: true, account_id: fixtureAdminId, application_id: websiteApplication, role });
  const permitted = await checkInquiryAdminAccess({ subject: fixtureAdminId, accessToken: "local-synthetic-session", expiresAt: Date.now() + 60_000 }, fixtureAdminId, fixture);
  if (!permitted) return null;
  return { store: await inquiryStore(settings), actorId: fixtureAdminId, origin: settings.origin, testOnly: true };
}
