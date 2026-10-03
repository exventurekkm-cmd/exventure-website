import { isHostedRuntime, localIntegration, validLocalIntegrationEnvironment } from "../local-integration.ts";
export const productionWebsiteRef = "yyoyeyvgpfybsjpgaouv";
export const reservedSupabaseRefs = new Set([productionWebsiteRef, "gszfrbzvketspsipcitj", "drivizzujcrufcjxvlue", "borqaktfhhlfbavpkuyd"]);
export type InquiryBackend = { mode: "local-test" | "supabase"; origin: string; localIntegration?: true; database?: { url: string; secret: string } };
export function readInquiryBackend(env: Record<string, string | undefined>): InquiryBackend | null {
  if (env.WEBSITE_LOCAL_INTEGRATION_ENABLED === "true") {
    const secret = env.WEBSITE_INQUIRY_DB_SECRET_KEY;
    if (!validLocalIntegrationEnvironment(env) || !secret || (!secret.startsWith("sb_secret_") && !isServiceRoleJwt(secret)) || hasReservedJwtRef(secret)) return null;
    return { mode: "supabase", origin: localIntegration.origin, localIntegration: true, database: { url: localIntegration.databaseUrl, secret } };
  }
  let origin: URL;
  try { origin = new URL(env.WEBSITE_INQUIRY_ORIGIN ?? ""); }
  catch { return null; }
  if (origin.username || origin.password || origin.search || origin.hash || origin.pathname !== "/") return null;
  if (env.WEBSITE_INQUIRY_MODE === "local-test") {
    if (isHostedRuntime(env) || origin.protocol !== "http:" || !["127.0.0.1", "localhost", "[::1]"].includes(origin.hostname)) return null;
    return { mode: "local-test", origin: origin.origin };
  }
  const ref = projectRef(env.WEBSITE_INQUIRY_DB_URL);
  if (!ref) return null;
  if (env.VERCEL_ENV === "production") {
    if (env.WEBSITE_INQUIRY_DB_ENVIRONMENT !== "production" || ref !== productionWebsiteRef || !["https://exventure.co.kr", "https://exventure-website.vercel.app"].includes(origin.origin)) return null;
  } else {
    if (env.WEBSITE_INQUIRY_DB_ENVIRONMENT !== "test" || reservedSupabaseRefs.has(ref) || ref !== env.WEBSITE_INQUIRY_TEST_PROJECT_REF) return null;
    const publicRef = projectRef(env.NEXT_PUBLIC_SUPABASE_URL);
    if (publicRef && reservedSupabaseRefs.has(publicRef)) return null;
    const loopback = origin.protocol === "http:" && ["127.0.0.1", "localhost", "[::1]"].includes(origin.hostname);
    if (origin.protocol !== "https:" && !loopback) return null;
  }
  const secret = env.WEBSITE_INQUIRY_DB_SECRET_KEY;
  if (!secret || (!secret.startsWith("sb_secret_") && !isServiceRoleJwt(secret))) return null;
  return { mode: "supabase", origin: origin.origin, database: { url: `https://${ref}.supabase.co`, secret } };
}
function projectRef(raw: string | undefined): string | null {
  try {
    const url = new URL(raw ?? "");
    if (url.protocol !== "https:" || url.username || url.password || url.port || url.search || url.hash || url.pathname !== "/") return null;
    return /^([a-z]{20})\.supabase\.co$/.exec(url.hostname)?.[1] ?? null;
  } catch { return null; }
}
function isServiceRoleJwt(value: string): boolean {
  try { return value.split(".").length === 3 && JSON.parse(Buffer.from(value.split(".")[1], "base64url").toString()).role === "service_role"; }
  catch { return false; }
}
function hasReservedJwtRef(value: string): boolean {
  try { const payload = JSON.parse(Buffer.from(value.split(".")[1], "base64url").toString()); return reservedSupabaseRefs.has(payload.ref) || [...reservedSupabaseRefs].some(ref => typeof payload.iss === "string" && payload.iss.includes(ref)); }
  catch { return false; }
}
