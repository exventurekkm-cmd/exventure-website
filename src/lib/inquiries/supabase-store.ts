import { readSaveResult, type WebsiteStore, type InquirySummary, type PrivacySetting, type PrivacySettingEvent, type PrivacyUpdateResult, type SaveResult, type StoredInquiry } from "./store.ts";
import { readPurgeResult, type PurgeResult } from "./maintenance.ts";

export class SupabaseInquiryStore implements WebsiteStore {
  private url: string;
  private secret: string;
  private fetcher: typeof fetch;
  constructor(database: { url: string; secret: string }, fetcher: typeof fetch = fetch) {
    this.url = database.url; this.secret = database.secret; this.fetcher = fetcher;
  }
  async save(inquiry: StoredInquiry): Promise<SaveResult> {
    return readSaveResult(await this.rpc("submit_website_inquiry", { p_submission: {
      request_id: inquiry.requestId, payload_hash: inquiry.payloadHash, ip_hash: inquiry.ipHash, email_hash: inquiry.emailHash,
      name: inquiry.name, email: inquiry.email, organization: inquiry.organizationConsent ? inquiry.organization : "", organization_consent: inquiry.organizationConsent,
      kind: inquiry.kind, message: inquiry.message, policy: inquiry.policy,
    } }));
  }
  async privacySetting(): Promise<PrivacySetting> { return await this.rpc("website_privacy_setting", {}) as PrivacySetting; }
  async privacyHistory(): Promise<PrivacySettingEvent[]> { return await this.rpc("website_privacy_history", {}) as PrivacySettingEvent[]; }
  async updatePrivacyContact(email: string, version: number, actorId: string): Promise<PrivacyUpdateResult> {
    return await this.rpc("set_website_privacy_contact", { p_email: email, p_version: version, p_actor_id: actorId }) as PrivacyUpdateResult;
  }
  async list(): Promise<InquirySummary[]> { return await this.rpc("list_website_inquiries", {}) as InquirySummary[]; }
  async complete(reference: string): Promise<boolean> {
    const result = await this.rpc("complete_website_inquiry", { p_reference: reference }) as { deleted: boolean };
    return result.deleted === true;
  }
  async storeSession(hash: string, accountId: string, payload: string, expiresAt: number): Promise<void> {
    await this.rpc("store_website_company_session", { p_hash: hash, p_account_id: accountId, p_payload: payload, p_expires_at: new Date(expiresAt).toISOString() }, true);
  }
  async readSession(hash: string): Promise<string | null> {
    const result = await this.rpc("read_website_company_session", { p_hash: hash });
    if (result !== null && typeof result !== "string") throw new Error("company_session_response");
    return result as string | null;
  }
  async deleteSession(hash: string): Promise<void> { await this.rpc("delete_website_company_session", { p_hash: hash }, true); }
  async startPurgeRun(runId: string, actorId: string): Promise<void> { await this.rpc("start_website_inquiry_purge", { p_run_id: runId, p_actor_id: actorId }, true); }
  async executePurgeRun(runId: string): Promise<PurgeResult> { return readPurgeResult(await this.rpc("execute_website_inquiry_purge", { p_run_id: runId })); }
  private async rpc(name: string, body: Record<string, unknown>, allowNoContent = false): Promise<unknown> {
    const headers: Record<string, string> = { "Content-Type": "application/json", apikey: this.secret };
    // Modern secret keys are gateway keys, not JWTs. Legacy service-role JWTs also need Authorization.
    if (this.secret.split(".").length === 3) headers.Authorization = `Bearer ${this.secret}`;
    const response = await this.fetcher(`${this.url}/rest/v1/rpc/${name}`, {
      method: "POST", headers, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(10_000),
      body: JSON.stringify(body),
    });
    // Never log PostgREST error bodies, because they can contain personal data or SQL context.
    if (!response.ok) throw new Error("Inquiry storage unavailable");
    // PostgREST returns 204 for SQL void functions. Data-returning RPCs must still return valid JSON.
    if (allowNoContent && response.status === 204) return null;
    return response.json();
  }
}
