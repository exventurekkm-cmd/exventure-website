import { validContactEmail, type InquiryStore } from "./store.ts";
import { sameOriginRequest } from "./origin.ts";
import { localIntegrationRequestUrl } from "../local-integration.ts";

export type AdminContext = { store: InquiryStore; actorId: string; origin: string; testOnly?: boolean; localIntegration?: true };
const reply = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "private, no-store", "Vary": "Cookie, Authorization", "X-Content-Type-Options": "nosniff" } });
export function validAdminMutation(request: Request, origin: string, testOnly = false, localIntegration = false): boolean {
  return request.method === "POST" && (!localIntegration || localIntegrationRequestUrl(request) !== null) && sameOriginRequest(request, origin, testOnly) && request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() === "application/json";
}
export async function smallAdminJson(request: Request): Promise<unknown> {
  if (Number(request.headers.get("content-length")) > 1024) throw new Error("Too large");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Missing body");
  let bytes = 0, text = "";
  const decoder = new TextDecoder("utf-8", { fatal: true });
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      bytes += part.value.byteLength;
      if (bytes > 1024) { await reader.cancel(); throw new Error("Too large"); }
      text += decoder.decode(part.value, { stream: true });
    }
    text += decoder.decode();
  } finally { reader.releaseLock(); }
  return JSON.parse(text);
}
export async function handlePrivacySettingRequest(request: Request, context: AdminContext | null): Promise<Response> {
  if (!context) return reply({ ok: false, message: "홈페이지 관리자 권한이 필요합니다." }, 403);
  if (!validAdminMutation(request, context.origin, context.testOnly, context.localIntegration)) return reply({ ok: false, message: "관리자 화면에서 다시 시도해주세요." }, 403);
  let input: unknown;
  try { input = await smallAdminJson(request); }
  catch { return reply({ ok: false, message: "입력 내용을 확인해주세요." }, 400); }
  const body = input as Record<string, unknown> | null;
  if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).some(key => !["email", "version"].includes(key)) || !validContactEmail(typeof body.email === "string" ? body.email.trim() : body.email) || !Number.isInteger(body.version) || Number(body.version) < 0) return reply({ ok: false, message: "공개할 이메일 주소를 확인해주세요." }, 400);
  try {
    const result = await context.store.updatePrivacyContact(String(body.email), Number(body.version), context.actorId);
    if (result.state === "conflict") return reply({ ok: false, message: "다른 변경이 먼저 저장됐습니다. 새로고침해 현재 주소를 확인해주세요." }, 409);
    if (result.state === "invalid-email") return reply({ ok: false, message: "공개할 이메일 주소를 확인해주세요." }, 400);
    return reply({ ok: true, setting: result.setting });
  } catch { return reply({ ok: false, message: "저장하지 못했습니다. 입력한 주소를 확인하고 다시 시도해주세요." }, 503); }
}
export async function handleCompleteInquiryRequest(request: Request, reference: string, context: AdminContext | null): Promise<Response> {
  if (!context) return reply({ ok: false, message: "홈페이지 관리자 권한이 필요합니다." }, 403);
  if (!validAdminMutation(request, context.origin, context.testOnly, context.localIntegration) || !/^EXV-\d{8}-[A-F0-9]{12}$/.test(reference)) return reply({ ok: false, message: "관리자 화면에서 다시 시도해주세요." }, 400);
  try {
    const deleted = await context.store.complete(reference);
    return reply({ ok: true, deleted });
  } catch { return reply({ ok: false, message: "삭제를 확인하지 못했습니다. 목록을 확인하고 다시 시도해주세요." }, 503); }
}
