import { handleInquiryRequest } from "@/lib/inquiries/http";
import { inquirySettings, inquiryStore } from "@/lib/inquiries/runtime";
import type { InquiryStore } from "@/lib/inquiries/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 15;
export async function POST(request: Request) {
  const settings = await inquirySettings();
  const unavailableStore = { save: async () => { throw new Error("Storage unavailable"); } };
  // Store initialization is inside the error boundary: disk/configuration failures must not return HTML.
  let store: Pick<InquiryStore, "save"> = unavailableStore;
  if (settings) {
    try { store = await inquiryStore(settings); }
    catch { /* The handler returns the same safe, retryable storage error. */ }
  }
  return handleInquiryRequest(request, { settings, store, trustedPlatform: process.env.VERCEL === "1", log: event => console.error(event) });
}
