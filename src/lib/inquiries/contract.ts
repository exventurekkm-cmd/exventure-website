export const inquiryKinds = [
  { value: "business", label: "기업 진단·사업화 지원" },
  { value: "research", label: "시장검증·소비자 반응조사" },
  { value: "partnership", label: "기관 협업·프로그램" },
  { value: "other", label: "기타 문의" },
] as const;

export type InquiryKind = (typeof inquiryKinds)[number]["value"];
export type InquiryField = "name" | "email" | "organization" | "kind" | "message" | "consent";
export type FieldErrors = Partial<Record<InquiryField, string>>;
export type Inquiry = {
  name: string; email: string; organization: string; organizationConsent: boolean; kind: InquiryKind; message: string; consent: true;
};
export type InquiryPolicy = {
  version: string; controller: string; purpose: string; retentionDays: number; contact: string;
};
export type InquiryResponse =
  | { ok: true; reference: string; testOnly: boolean }
  | { ok: false; code: string; message: string; fieldErrors?: FieldErrors; retryAfter?: number };

const keys = new Set(["name", "email", "organization", "organizationConsent", "kind", "message", "consent", "token", "website"]);
const singleLineControl = /[\p{Cc}\p{Cf}]/u;
const messageControl = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/u;

export function validateInquiry(value: unknown):
  | { ok: true; inquiry: Inquiry }
  | { ok: false; errors: FieldErrors; spam?: boolean } {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ok: false, errors: {} };
  const input = value as Record<string, unknown>;
  if (Object.keys(input).some(key => !keys.has(key))) return { ok: false, errors: {} };
  if (typeof input.website !== "string" || input.website !== "") return { ok: false, errors: {}, spam: true };
  const errors: FieldErrors = {};
  const text = (field: "name" | "email" | "organization" | "message") =>
    typeof input[field] === "string" ? input[field].trim().normalize("NFC") : "";
  const organizationConsent = input.organizationConsent === true;
  // Ignore the optional value entirely when consent is absent, even if a client sends it anyway.
  const name = text("name"), email = text("email"), organization = organizationConsent ? text("organization") : "", message = text("message");
  if (!name || name.length > 80 || singleLineControl.test(name)) errors.name = "이름을 1~80자 이내로 입력해주세요.";
  if (!email || email.length > 254 || singleLineControl.test(email) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email)) errors.email = "회신받을 이메일 주소를 확인해주세요.";
  if (organizationConsent && (typeof input.organization !== "string" || organization.length > 120 || singleLineControl.test(organization))) errors.organization = "회사·기관명은 120자 이내로 입력해주세요.";
  if (!inquiryKinds.some(kind => kind.value === input.kind)) errors.kind = "문의 종류를 선택해주세요.";
  if (message.length < 10 || message.length > 3000 || messageControl.test(message)) errors.message = "문의 내용을 10~3,000자 이내로 입력해주세요.";
  if (input.consent !== true) errors.consent = "개인정보 수집·이용 안내를 읽고 동의해주세요.";
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, inquiry: { name, email, organization, organizationConsent, message, kind: input.kind as InquiryKind, consent: true } };
}
