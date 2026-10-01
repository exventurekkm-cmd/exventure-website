import { NextResponse, type NextRequest } from "next/server";
import { staffLoginUrl } from "@/lib/staff-login";
import { validLocalIntegrationEnvironment } from "@/lib/local-integration";
export function GET(request: NextRequest) {
  return NextResponse.redirect(staffLoginUrl(request.nextUrl.searchParams.get("next"), validLocalIntegrationEnvironment(process.env)), {
    headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" },
  });
}
