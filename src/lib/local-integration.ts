/** Approved Exventure QA stack only. These are endpoints, never credentials or mutable request input. */
export const localIntegration = {
  origin: "http://127.0.0.1:3003",
  issuer: "http://127.0.0.1:58421/auth/v1",
  portal: "http://127.0.0.1:3002",
  databaseUrl: "http://127.0.0.1:58621",
  websiteProjectId: "exventure-website-ui-qa",
  accountsProjectId: "exventure-accounts-ui-qa",
} as const;
export function isHostedRuntime(env: Record<string, string | undefined>): boolean {
  return ["VERCEL", "VERCEL_ENV", "VERCEL_URL", "VERCEL_PROJECT_ID"].some(key => env[key] !== undefined);
}
export function validLocalIntegrationEnvironment(env: Record<string, string | undefined>): boolean {
  if (env.WEBSITE_LOCAL_INTEGRATION_ENABLED !== "true" || isHostedRuntime(env)) return false;
  if (env.WEBSITE_INQUIRY_DB_ENVIRONMENT !== "local-test" || !["disabled", "supabase"].includes(env.WEBSITE_INQUIRY_MODE ?? "") || env.WEBSITE_INQUIRY_ORIGIN !== localIntegration.origin || env.WEBSITE_INQUIRY_DB_URL !== localIntegration.databaseUrl || env.WEBSITE_INQUIRY_LOCAL_PROJECT_ID !== localIntegration.websiteProjectId || env.WEBSITE_COMPANY_LOCAL_PROJECT_ID !== localIntegration.accountsProjectId) return false;
  for (const [key, expected] of [
    ["NEXT_PUBLIC_SITE_URL", localIntegration.origin], ["NEXT_PUBLIC_SUPABASE_URL", localIntegration.databaseUrl],
    ["WEBSITE_COMPANY_TEST_PORTAL_ORIGIN", localIntegration.portal],
    ["WEBSITE_INQUIRY_TEST_PROJECT_REF", localIntegration.websiteProjectId], ["WEBSITE_COMPANY_TEST_PROJECT_REF", localIntegration.accountsProjectId],
  ]) if (env[key] && env[key] !== expected) return false;
  return true;
}
/** The browser/Host must use 127. Next's internal localhost normalization never becomes a public callback. */
export function localIntegrationRequestUrl(request: Request): URL | null {
  const url = new URL(request.url);
  if (request.headers.get("host") !== "127.0.0.1:3003" || url.protocol !== "http:" || url.port !== "3003" || !["127.0.0.1", "localhost"].includes(url.hostname) || url.username || url.password || url.hash) return null;
  const origin = request.headers.get("origin");
  if (origin && ![localIntegration.origin, localIntegration.portal, "http://127.0.0.1:58421"].includes(origin)) return null;
  return new URL(url.pathname + url.search, localIntegration.origin);
}
