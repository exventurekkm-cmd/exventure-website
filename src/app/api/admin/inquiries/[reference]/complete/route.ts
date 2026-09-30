import { inquiryAdminContext } from "@/lib/inquiries/admin-runtime";
import { handleCompleteInquiryRequest } from "@/lib/inquiries/admin-http";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function POST(request: Request, { params }: { params: Promise<{ reference: string }> }) {
  let context = null;
  try { context = await inquiryAdminContext(request); } catch { /* Fail closed. */ }
  return handleCompleteInquiryRequest(request, (await params).reference, context);
}
