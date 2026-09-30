import "server-only";
import { resolve } from "node:path";
import { readInquirySettings, type InquirySettings } from "./settings.ts";
import { validContactEmail, type WebsiteStore } from "./store.ts";
import type { InquiryBackend } from "./backend-settings.ts";
import { SupabaseInquiryStore } from "./supabase-store.ts";

export function baseInquirySettings(): InquirySettings | null {
  const result = readInquirySettings(process.env);
  return result.enabled ? result.settings : null;
}
export async function inquirySettings(): Promise<InquirySettings | null> {
  const settings = baseInquirySettings();
  if (!settings) return null;
  try {
    const store = await inquiryStore(settings), contact = await store.privacySetting();
    if (!validContactEmail(contact.email) || !Number.isInteger(contact.version) || contact.version < 1) return null;
    return { ...settings, policy: { ...settings.policy, contact: contact.email, version: `${settings.policy.version}.contact-${contact.version}` } };
  } catch { return null; }
}
let localStore: WebsiteStore | undefined;
export async function inquiryStore(settings: InquiryBackend): Promise<WebsiteStore> {
  if (settings.mode === "supabase" && settings.database) return new SupabaseInquiryStore(settings.database);
  if (settings.mode !== "local-test" || process.env.VERCEL || process.env.VERCEL_ENV) throw new Error("Local inquiry storage is unavailable");
  if (!localStore) {
    const { LocalInquiryStore } = await import("./local-store.ts");
    localStore = new LocalInquiryStore(resolve(process.cwd(), ".local/inquiries-test.sqlite"));
  }
  return localStore;
}
