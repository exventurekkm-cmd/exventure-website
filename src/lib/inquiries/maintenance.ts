import { randomUUID } from "node:crypto";
import { smallAdminJson, validAdminMutation } from "./admin-http.ts";
export type PurgeCounts = { inquiriesDeleted: number; rateEntriesDeleted: number; historyEntriesDeleted: number; sessionsDeleted: number };
export type PurgeResult = { runId: string; state: "succeeded"; counts: PurgeCounts } | { runId: string; state: "failed"; reason: "database_failure" };
export interface InquiryMaintenanceStore {
  startPurgeRun(runId: string, actorId: string): Promise<void>;
  executePurgeRun(runId: string): Promise<PurgeResult>;
}
export function readPurgeResult(value: unknown): PurgeResult {
  const result = value as Partial<PurgeResult> | null;
  if (!result || typeof result.runId !== "string" || !/^[a-f0-9-]{36}$/.test(result.runId)) throw new Error("purge_response");
  if (result.state === "failed" && result.reason === "database_failure") return { runId: result.runId, state: "failed", reason: "database_failure" };
  if (result.state === "succeeded" && result.counts && Object.values(result.counts).length === 4 && ["inquiriesDeleted", "rateEntriesDeleted", "historyEntriesDeleted", "sessionsDeleted"].every(key => Number.isSafeInteger(result.counts?.[key as keyof PurgeCounts]) && Number(result.counts?.[key as keyof PurgeCounts]) >= 0)) return { runId: result.runId, state: "succeeded", counts: { inquiriesDeleted: result.counts.inquiriesDeleted, rateEntriesDeleted: result.counts.rateEntriesDeleted, historyEntriesDeleted: result.counts.historyEntriesDeleted, sessionsDeleted: result.counts.sessionsDeleted } };
  throw new Error("purge_response");
}
export async function handlePurgeRequest(request: Request, context: { origin: string; actorId: string; testOnly?: boolean; localIntegration?: true; store: InquiryMaintenanceStore } | null, enabled: boolean, log: (event: { event: string; runId?: string }) => void = () => {}): Promise<Response> {
  const reply = (body: unknown, status: number) => Response.json(body, { status, headers: { "Cache-Control": "private, no-store", "Vary": "Cookie", "X-Content-Type-Options": "nosniff" } });
  if (!context) return reply({ ok: false, state: "denied" }, 403);
  if (!enabled) return reply({ ok: false, state: "disabled" }, 503);
  if (!validAdminMutation(request, context.origin, context.testOnly, context.localIntegration)) return reply({ ok: false, state: "invalid_request" }, 403);
  try {
    const body = await smallAdminJson(request) as Record<string, unknown> | null;
    if (!body || Array.isArray(body) || Object.keys(body).length !== 1 || body.action !== "purge_expired") return reply({ ok: false, state: "invalid_request" }, 400);
  } catch { return reply({ ok: false, state: "invalid_request" }, 400); }
  const runId = randomUUID();
  try { await context.store.startPurgeRun(runId, context.actorId); }
  catch { log({ event: "website_inquiry_purge_not_started", runId }); return reply({ ok: false, state: "not_started", runId }, 503); }
  try {
    const result = readPurgeResult(await context.store.executePurgeRun(runId));
    if (result.runId !== runId) throw new Error("purge_response");
    log({ event: `website_inquiry_purge_${result.state}`, runId });
    return reply({ ok: result.state === "succeeded", ...result }, result.state === "succeeded" ? 200 : 503);
  } catch {
    // A transport error cannot tell us whether the DB transaction committed. Do not claim failure/deletion or blindly retry.
    log({ event: "website_inquiry_purge_outcome_unknown", runId });
    return reply({ ok: false, state: "outcome_unknown", runId }, 503);
  }
}
