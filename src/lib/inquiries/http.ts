import { isIP } from "node:net";
import { validateInquiry, type InquiryResponse } from "./contract.ts";
import type { InquirySettings } from "./settings.ts";
import type { InquiryStore } from "./store.ts";
import { keyedHash, policyHash, verifyInquiryToken } from "./tokens.ts";
import { sameOriginRequest } from "./origin.ts";
import { isTestInquiry } from "./settings.ts";
import { localIntegrationRequestUrl } from "../local-integration.ts";

export const maxRequestBytes = 24 * 1024;
type Dependencies = { settings: InquirySettings | null; store: Pick<InquiryStore, "save">; now?: () => number; log?: (event: string) => void; trustedPlatform?: boolean };
function reply(body: InquiryResponse, status: number): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "private, no-store", "Vary": "Origin", "X-Content-Type-Options": "nosniff", ...(body.ok === false && body.retryAfter ? { "Retry-After": String(body.retryAfter) } : {}) } });
}
const failure = (code: string, message: string, status: number) => reply({ ok: false, code, message }, status);
export async function handleInquiryRequest(request: Request, deps: Dependencies): Promise<Response> {
  if (request.method !== "POST") return failure("method_not_allowed", "지원하지 않는 요청입니다.", 405);
  const settings = deps.settings;
  if (!settings) return failure("unavailable", "문의 접수를 준비하고 있습니다. 잠시 후 다시 확인해주세요.", 503);
  const testOnly = isTestInquiry(settings);
  if ((settings.localIntegration && !localIntegrationRequestUrl(request)) || !sameOriginRequest(request, settings.origin, testOnly)) return failure("invalid_origin", "홈페이지 문의 화면에서 다시 시도해주세요.", 403);
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") return failure("unsupported_content_type", "지원하지 않는 요청 형식입니다.", 415);
  let input: unknown;
  try { input = await readBoundedJson(request); }
  catch (error) { return failure(error instanceof BodyTooLarge ? "body_too_large" : "invalid_json", error instanceof BodyTooLarge ? "입력한 내용이 너무 깁니다." : "입력 내용을 확인해주세요.", error instanceof BodyTooLarge ? 413 : 400); }
  const validation = validateInquiry(input);
  if (!validation.ok) return reply({ ok: false, code: validation.spam ? "invalid_submission" : "validation_failed", message: "입력 내용을 확인해주세요.", fieldErrors: validation.errors }, 400);
  const token = verifyInquiryToken((input as Record<string, unknown>).token, settings.secret, settings.policy, deps.now?.() ?? Date.now());
  if (!token.ok) {
    const messages = { invalid_token: "문의 화면을 새로고침한 뒤 다시 시도해주세요.", expired_token: "작성 시간이 만료됐습니다. 내용을 보관한 뒤 화면을 새로고침해주세요.", too_fast: "잠시 기다린 뒤 다시 제출해주세요.", policy_changed: "개인정보 안내가 변경됐습니다. 내용을 보관한 뒤 새로고침해 안내를 확인해주세요." };
    return failure(token.code, messages[token.code], token.code === "too_fast" ? 429 : 400);
  }
  // On Vercel, use only its overwritten platform header; arbitrary forwarded-for is never trusted.
  const ip = testOnly ? "127.0.0.1" : deps.trustedPlatform ? request.headers.get("x-vercel-forwarded-for")?.trim() : undefined;
  if (!ip || !isIP(ip)) return failure("unavailable", "현재 문의를 접수할 수 없습니다. 잠시 후 다시 시도해주세요.", 503);
  const { consent: _consent, ...inquiry } = validation.inquiry;
  const stored = {
    ...inquiry, requestId: token.requestId, policy: settings.policy,
    payloadHash: keyedHash(settings.secret, "payload", JSON.stringify([inquiry, policyHash(settings.policy)])),
    ipHash: keyedHash(settings.secret, "client", ip), emailHash: keyedHash(settings.secret, "email", inquiry.email.toLowerCase()),
  };
  try {
    const result = await deps.store.save(stored);
    if (result.state === "rate-limited") return reply({ ok: false, code: "rate_limited", message: "짧은 시간에 여러 문의가 접수됐습니다. 잠시 후 다시 시도해주세요.", retryAfter: result.retryAfter }, 429);
    if (result.state === "conflict") return failure("submission_conflict", "이미 접수된 문의와 내용이 다릅니다. 새 문의 화면에서 작성해주세요.", 409);
    return reply({ ok: true, reference: result.reference, testOnly }, 201);
  } catch {
    deps.log?.("website_inquiry_storage_unavailable");
    return failure("storage_unavailable", "접수 여부를 확인하지 못했습니다. 작성 내용은 유지됩니다. 같은 내용을 다시 제출해주세요.", 503);
  }
}
class BodyTooLarge extends Error {}
async function readBoundedJson(request: Request): Promise<unknown> {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxRequestBytes) throw new BodyTooLarge();
  if (!request.body) throw new Error("No request body");
  const reader = request.body.getReader(), chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxRequestBytes) { await reader.cancel(); throw new BodyTooLarge(); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
}
