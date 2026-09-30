import * as oidc from "openid-client";
import { companyIssuer, type LoginAttempt } from "./contract.ts";
import { localIntegration } from "../local-integration.ts";
export async function discoverCompanyClient(clientId: string, fetcher?: oidc.CustomFetch, issuer = companyIssuer, localTest = false) {
  const paths = new Set([`${localIntegration.issuer}/.well-known/openid-configuration`, `${localIntegration.issuer}/oauth/token`, `${localIntegration.issuer}/.well-known/jwks.json`]);
  if (localTest && issuer !== localIntegration.issuer) throw new Error("company_setup");
  const transport: oidc.CustomFetch | undefined = localTest ? async (url, options) => {
    if (!paths.has(url)) throw new Error("company_local_endpoint");
    const body = options.body instanceof Uint8Array ? new Uint8Array(options.body) : options.body;
    const response = fetcher ? await fetcher(url, options) : await fetch(url, { ...options, body, redirect: "error" });
    if (response.redirected || (response.status >= 300 && response.status < 400)) throw new Error("company_local_redirect");
    return response;
  } : fetcher;
  const client = await oidc.discovery(new URL(issuer), clientId, { id_token_signed_response_alg: "ES256" }, oidc.None(), {
    execute: [oidc.enableNonRepudiationChecks, ...(localTest ? [oidc.allowInsecureRequests] : [])], timeout: 10,
    ...(transport ? { [oidc.customFetch]: transport } : {}),
  });
  if (localTest) {
    const metadata = client.serverMetadata();
    if (metadata.issuer !== localIntegration.issuer || metadata.authorization_endpoint !== `${localIntegration.issuer}/oauth/authorize` || metadata.token_endpoint !== `${localIntegration.issuer}/oauth/token` || metadata.jwks_uri !== `${localIntegration.issuer}/.well-known/jwks.json` || !metadata.id_token_signing_alg_values_supported?.includes("ES256")) throw new Error("company_local_metadata");
  }
  return client;
}
export async function exchangeCompanyCode(client: oidc.Configuration, callback: URL, attempt: LoginAttempt, now = Date.now()) {
  if (attempt.expiresAt <= now || attempt.expiresAt > now + 600_000 || ![attempt.state, attempt.nonce, attempt.verifier].every(value => typeof value === "string" && /^[A-Za-z0-9_-]{32,128}$/.test(value))) throw new Error("company_expired");
  if (callback.searchParams.getAll("state").length !== 1 || callback.searchParams.get("state") !== attempt.state) throw new Error("company_state");
  if (callback.searchParams.has("error")) throw new Error("company_cancelled");
  if (callback.searchParams.getAll("code").length !== 1 || !callback.searchParams.get("code") || callback.searchParams.get("code")!.length > 2048) throw new Error("company_code");
  return oidc.authorizationCodeGrant(client, callback, { pkceCodeVerifier: attempt.verifier, expectedState: attempt.state, expectedNonce: attempt.nonce, idTokenExpected: true });
}
