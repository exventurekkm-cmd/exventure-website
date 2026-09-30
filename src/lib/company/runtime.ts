import "server-only";
import { readCompanyConfig } from "./config.ts";
import { discoverCompanyClient } from "./oidc.ts";
import { readInquiryBackend } from "../inquiries/backend-settings.ts";
import { inquiryStore } from "../inquiries/runtime.ts";
import type { CompanyDependencies } from "./http.ts";
let client: ReturnType<typeof discoverCompanyClient> | undefined;
let clientKey = "";
export async function companyDependencies(): Promise<CompanyDependencies | null> {
  const config = readCompanyConfig(process.env), backend = readInquiryBackend(process.env);
  if (!config || !backend) return null;
  return {
    config, store: await inquiryStore(backend),
    client: () => {
      // Cache provider metadata only. Central authorization is never cached.
      const requestedKey = `${config.issuer}|${config.clientId}|${config.localIntegration === true}`;
      if (!client || clientKey !== requestedKey) {
        clientKey = requestedKey;
        client = discoverCompanyClient(config.clientId, undefined, config.issuer, config.localIntegration === true).catch(error => { if (clientKey === requestedKey) client = undefined; throw error; });
      }
      return client;
    },
    log: event => console.info(event),
  };
}
export function companySetupResponse() {
  return Response.json({ ok: false, message: "홈페이지 관리자 인증을 준비하고 있습니다." }, { status: 503, headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}
