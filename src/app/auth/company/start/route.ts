import { companyDependencies, companySetupResponse } from "@/lib/company/runtime";
import { handleCompanyStart } from "@/lib/company/http";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try { const deps = await companyDependencies(); return deps ? handleCompanyStart(request, deps) : companySetupResponse(); }
  catch { return companySetupResponse(); }
}
