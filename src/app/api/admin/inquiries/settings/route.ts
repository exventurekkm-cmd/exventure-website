import { inquiryAdminContext } from "@/lib/inquiries/admin-runtime";
import { handlePrivacySettingRequest } from "@/lib/inquiries/admin-http";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function POST(request: Request) {
  let context = null;
  try { context = await inquiryAdminContext(request); } catch { /* Fail closed. */ }
  return handlePrivacySettingRequest(request, context);
}
