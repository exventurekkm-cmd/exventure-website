import { companyDependencies, companySetupResponse } from "@/lib/company/runtime";
import { handleCompanyCallback } from "@/lib/company/http";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try { const deps = await companyDependencies(); return deps ? handleCompanyCallback(request, deps) : companySetupResponse(); }
  catch { return companySetupResponse(); }
}
