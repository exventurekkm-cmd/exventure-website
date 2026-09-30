import { inquiryAdminContext } from "@/lib/inquiries/admin-runtime";
import { handlePurgeRequest } from "@/lib/inquiries/maintenance";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function POST(request: Request) {
  let context = null;
  try { context = await inquiryAdminContext(request); } catch { /* Fail closed. */ }
  return handlePurgeRequest(request, context, process.env.WEBSITE_INQUIRY_PURGE_ENABLED === "true", event => console.info(JSON.stringify(event)));
}
