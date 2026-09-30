import type { Inquiry, InquiryPolicy } from "./contract.ts";
import type { WebsiteSessionStore } from "../company/contract.ts";
import type { InquiryMaintenanceStore } from "./maintenance.ts";

export type StoredInquiry = Omit<Inquiry, "consent"> & {
  requestId: string; payloadHash: string; ipHash: string; emailHash: string; policy: InquiryPolicy;
};
export type SaveResult =
  | { state: "saved"; reference: string }
  | { state: "conflict" }
  | { state: "rate-limited"; retryAfter: number };
export type PrivacySetting = { email: string; version: number };
export type PrivacySettingEvent = { previousEmail: string; email: string; version: number; actorId: string; createdAt: string };
export type PrivacyUpdateResult = { state: "saved"; setting: PrivacySetting } | { state: "conflict" } | { state: "invalid-email" };
export type InquirySummary = { reference: string; name: string; email: string; organization: string; kind: string; message: string; createdAt: string };
export interface InquiryStore {
  save(inquiry: StoredInquiry): Promise<SaveResult>;
  privacySetting(): Promise<PrivacySetting>;
  updatePrivacyContact(email: string, version: number, actorId: string): Promise<PrivacyUpdateResult>;
  privacyHistory(): Promise<PrivacySettingEvent[]>;
  list(): Promise<InquirySummary[]>;
  complete(reference: string): Promise<boolean>;
}
export type WebsiteStore = InquiryStore & WebsiteSessionStore & InquiryMaintenanceStore;
export function validContactEmail(email: unknown): email is string {
  return typeof email === "string" && email.length <= 254 && /^[^\s@\p{Cc}\p{Cf}]+@[^\s@\p{Cc}\p{Cf}]+\.[^\s@\p{Cc}\p{Cf}]+$/u.test(email);
}

export function readSaveResult(value: unknown): SaveResult {
  const result = value as Record<string, unknown> | null;
  if (result?.state === "saved" && typeof result.reference === "string" && /^EXV-\d{8}-[A-F0-9]{12}$/.test(result.reference)) return { state: "saved", reference: result.reference };
  if (result?.state === "conflict") return { state: "conflict" };
  if (result?.state === "rate-limited" && Number.isInteger(result.retryAfter) && Number(result.retryAfter) > 0 && Number(result.retryAfter) <= 3600) return { state: "rate-limited", retryAfter: Number(result.retryAfter) };
  throw new Error("Unexpected inquiry storage response");
}
