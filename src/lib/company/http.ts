import * as oidc from "openid-client";
import { checkInquiryAdminAccess } from "../inquiries/admin-access.ts";
import { validAdminMutation } from "../inquiries/admin-http.ts";
import type { CompanyConfig } from "./config.ts";
import { exchangeCompanyCode } from "./oidc.ts";
import { localIntegration, localIntegrationRequestUrl } from "../local-integration.ts";
import { loginCookie, sessionCookie, newSessionId, openCompanyData, readCookie, sealCompanyData, sessionHash, uuidPattern, type LoginAttempt, type WebsiteSessionStore } from "./contract.ts";

export type CompanyDependencies = { config: CompanyConfig | null; client: () => Promise<oidc.Configuration>; store: WebsiteSessionStore; fetcher?: typeof fetch; now?: () => number; log?: (event: string) => void };
const headers = () => new Headers({ "Cache-Control": "private, no-store", "Vary": "Cookie", "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff" });
function cookie(name: string, value: string, path: string, seconds: number, localTest = false) { return `${name}=${value}; Path=${path}; Max-Age=${Math.max(0, seconds)}; HttpOnly;${localTest ? "" : " Secure;"} SameSite=Lax`; }
function finish(origin: string, path: string, values: string[] = [], status = 303) {
  const h = headers(); h.set("Location", new URL(path, origin).href); values.forEach(value => h.append("Set-Cookie", value));
  return new Response(null, { status, headers: h });
}
function clearAttempt(config: CompanyConfig) { return cookie(loginCookie, "", "/auth/company", 0, config.localIntegration === true); }
function localError(message: string, status = 503) { return Response.json({ ok: false, message }, { status, headers: headers() }); }
function validUrl(request: Request, config: CompanyConfig, path: string) {
  if (config.localIntegration && (config.origin !== localIntegration.origin || config.issuer !== localIntegration.issuer || config.portal !== localIntegration.portal)) return null;
  const url = config.localIntegration ? localIntegrationRequestUrl(request) : new URL(request.url);
  return url && url.origin === config.origin && url.pathname === path && !url.hash && request.method === "GET" ? url : null;
}
export async function handleCompanyStart(request: Request, deps: CompanyDependencies): Promise<Response> {
  const config = deps.config;
  if (!config) return localError("홈페이지 관리자 인증을 준비하고 있습니다.");
  if (!validUrl(request, config, "/auth/company/start")) return localError("로그인 주소를 확인해주세요.", 400);
  try {
    const attempt: LoginAttempt = { state: oidc.randomState(), nonce: oidc.randomNonce(), verifier: oidc.randomPKCECodeVerifier(), expiresAt: (deps.now ?? Date.now)() + 600_000 };
    const client = await deps.client();
    const url = oidc.buildAuthorizationUrl(client, { redirect_uri: `${config.origin}/auth/company/callback`, scope: "openid email profile", state: attempt.state, nonce: attempt.nonce, code_challenge: await oidc.calculatePKCECodeChallenge(attempt.verifier), code_challenge_method: "S256" });
    const h = headers(); h.set("Location", url.href); h.append("Set-Cookie", cookie(loginCookie, sealCompanyData(attempt, config.key, "login"), "/auth/company", 600, config.localIntegration === true));
    return new Response(null, { status: 303, headers: h });
  } catch { deps.log?.("website_company_start_unavailable"); return finish(config.origin, "/admin/login?status=unavailable", [clearAttempt(config)]); }
}
export async function handleCompanyCallback(request: Request, deps: CompanyDependencies): Promise<Response> {
  const config = deps.config;
  if (!config) return localError("홈페이지 관리자 인증을 준비하고 있습니다.");
  const callback = validUrl(request, config, "/auth/company/callback");
  if (!callback) return localError("로그인 주소를 확인해주세요.", 400);
  const now = (deps.now ?? Date.now)();
  let failure = "invalid";
  try {
    const raw = readCookie(request.headers.get("cookie"), loginCookie);
    if (!raw) throw new Error("company_expired");
    const attempt = openCompanyData<LoginAttempt>(raw, config.key, "login", now);
    const tokens = await exchangeCompanyCode(await deps.client(), callback, attempt, now);
    const claims = tokens.claims();
    if (!claims || typeof claims.sub !== "string" || !uuidPattern.test(claims.sub) || typeof claims.exp !== "number" || typeof tokens.access_token !== "string" || !tokens.access_token || tokens.access_token.length > 16000 || typeof tokens.expires_in !== "number" || !Number.isFinite(tokens.expires_in) || tokens.expires_in <= 0) throw new Error("company_expired");
    const expiresAt = Math.floor(Math.min(now + tokens.expires_in * 1000, claims.exp * 1000, now + 3_600_000) - 15_000);
    if (expiresAt < now + 30_000) throw new Error("company_expired");
    const session = { subject: claims.sub, accessToken: tokens.access_token, expiresAt };
    failure = "denied";
    if (!await checkInquiryAdminAccess(session, config.approvedAccountId, deps.fetcher, config.portal)) throw new Error("company_denied");
    failure = "unavailable";
    const id = newSessionId();
    await deps.store.storeSession(sessionHash(id), session.subject, sealCompanyData(session, config.key, "session"), expiresAt);
    return finish(config.origin, "/admin/inquiries", [clearAttempt(config), cookie(sessionCookie, id, "/", Math.floor((expiresAt - now) / 1000), config.localIntegration === true)]);
  } catch { deps.log?.(`website_company_callback_${failure}`); return finish(config.origin, `/admin/login?status=${failure}`, [clearAttempt(config)]); }
}
export async function handleCompanyLogout(request: Request, deps: CompanyDependencies): Promise<Response> {
  const config = deps.config;
  if (!config) return localError("홈페이지 관리자 인증을 준비하고 있습니다.");
  if (!validAdminMutation(request, config.origin, config.localIntegration === true, config.localIntegration === true)) return localError("관리자 화면에서 다시 시도해주세요.", 403);
  try {
    const id = readCookie(request.headers.get("cookie"), sessionCookie);
    if (id && /^[a-f0-9]{64}$/.test(id)) await deps.store.deleteSession(sessionHash(id));
    const h = headers(); h.append("Set-Cookie", cookie(sessionCookie, "", "/", 0, config.localIntegration === true)); h.append("Set-Cookie", clearAttempt(config));
    return Response.json({ ok: true }, { headers: h });
  } catch { deps.log?.("website_company_logout_unavailable"); return localError("로그아웃을 확인하지 못했습니다. 다시 시도해주세요."); }
}
