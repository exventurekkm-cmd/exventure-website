import { companyDependencies, companySetupResponse } from "@/lib/company/runtime";
import { handleCompanyLogout } from "@/lib/company/http";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try { const deps = await companyDependencies(); return deps ? handleCompanyLogout(request, deps) : companySetupResponse(); }
  catch { return companySetupResponse(); }
}
