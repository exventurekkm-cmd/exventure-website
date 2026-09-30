import { DatabaseSync } from "node:sqlite";
import { randomBytes } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { validContactEmail, type WebsiteStore, type InquirySummary, type PrivacySetting, type PrivacySettingEvent, type PrivacyUpdateResult, type SaveResult, type StoredInquiry } from "./store.ts";
import { uuidPattern } from "../company/contract.ts";
import { readPurgeResult, type PurgeResult } from "./maintenance.ts";

/** Durable, loopback-only test storage. Runtime configuration never selects this on Vercel. */
export class LocalInquiryStore implements WebsiteStore {
  private db: DatabaseSync;
  private now: () => number;
  constructor(file: string, now: () => number = Date.now) {
    mkdirSync(dirname(file), { recursive: true });
    this.now = now;
    this.db = new DatabaseSync(file);
    this.db.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA busy_timeout = 5000;
      CREATE TABLE IF NOT EXISTS inquiries (
        request_id TEXT PRIMARY KEY, payload_hash TEXT NOT NULL, reference TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL, email TEXT NOT NULL, organization TEXT NOT NULL, organization_consent INTEGER NOT NULL, kind TEXT NOT NULL,
        message TEXT NOT NULL, policy_snapshot TEXT NOT NULL, created_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'received',
        notification_state TEXT NOT NULL DEFAULT 'not_configured'
      );
      CREATE INDEX IF NOT EXISTS inquiries_expiry ON inquiries(expires_at);
      CREATE TABLE IF NOT EXISTS rate_limits (
        key TEXT NOT NULL, window_start INTEGER NOT NULL, count INTEGER NOT NULL,
        expires_at INTEGER NOT NULL, PRIMARY KEY(key, window_start)
      );
      CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY CHECK(id=1), email TEXT NOT NULL, version INTEGER NOT NULL);
      INSERT OR IGNORE INTO settings(id,email,version) VALUES(1,'',0);
      CREATE TABLE IF NOT EXISTS setting_events (id INTEGER PRIMARY KEY, previous_email TEXT NOT NULL, email TEXT NOT NULL, version INTEGER NOT NULL, actor_id TEXT NOT NULL, created_at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS company_sessions (hash TEXT PRIMARY KEY, account_id TEXT NOT NULL, payload TEXT NOT NULL, expires_at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS maintenance_runs (run_id TEXT PRIMARY KEY, actor_id TEXT NOT NULL, started_at INTEGER NOT NULL, finished_at INTEGER, state TEXT NOT NULL, result TEXT);
    `);
  }
  async save(inquiry: StoredInquiry): Promise<SaveResult> {
    const now = this.now();
    this.db.exec("BEGIN IMMEDIATE");
    const commit = (result: SaveResult) => { this.db.exec("COMMIT"); return result; };
    try {
      this.db.prepare("DELETE FROM inquiries WHERE expires_at <= ?").run(now);
      this.db.prepare("DELETE FROM rate_limits WHERE expires_at <= ?").run(now);
      const existing = this.db.prepare("SELECT payload_hash, reference FROM inquiries WHERE request_id = ?").get(inquiry.requestId) as { payload_hash: string; reference: string } | undefined;
      if (existing) return commit(existing.payload_hash === inquiry.payloadHash ? { state: "saved", reference: existing.reference } : { state: "conflict" });
      const limits = [
        { key: `ip:${inquiry.ipHash}`, period: 600_000, limit: 5 },
        { key: `email:${inquiry.emailHash}`, period: 3_600_000, limit: 3 },
        { key: "global", period: 3_600_000, limit: 100 },
      ].map(limit => ({ ...limit, start: Math.floor(now / limit.period) * limit.period }));
      let retryAfter = 0;
      for (const limit of limits) {
        const row = this.db.prepare("SELECT count FROM rate_limits WHERE key = ? AND window_start = ?").get(limit.key, limit.start) as { count: number } | undefined;
        if ((row?.count ?? 0) >= limit.limit) retryAfter = Math.max(retryAfter, Math.ceil((limit.start + limit.period - now) / 1000));
      }
      if (retryAfter) return commit({ state: "rate-limited", retryAfter });
      const date = new Date(now).toISOString().slice(0, 10).replaceAll("-", "");
      const reference = `EXV-${date}-${randomBytes(6).toString("hex").toUpperCase()}`;
      this.db.prepare(`INSERT INTO inquiries (request_id,payload_hash,reference,name,email,organization,organization_consent,kind,message,policy_snapshot,created_at,expires_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
        .run(inquiry.requestId, inquiry.payloadHash, reference, inquiry.name, inquiry.email, inquiry.organizationConsent ? inquiry.organization : "", Number(inquiry.organizationConsent), inquiry.kind, inquiry.message, JSON.stringify(inquiry.policy), now, now + inquiry.policy.retentionDays * 86_400_000);
      for (const limit of limits) this.db.prepare(`INSERT INTO rate_limits (key,window_start,count,expires_at) VALUES (?,?,1,?) ON CONFLICT(key,window_start) DO UPDATE SET count = count + 1`).run(limit.key, limit.start, limit.start + limit.period);
      return commit({ state: "saved", reference });
    } catch (error) { this.db.exec("ROLLBACK"); throw error; }
  }
  async list(): Promise<InquirySummary[]> {
    this.purgeExpired();
    const rows = this.db.prepare("SELECT reference, name, email, organization, kind, message, created_at FROM inquiries ORDER BY created_at DESC, reference DESC LIMIT 50").all() as unknown as LocalInquirySummary[];
    return rows.map(({ created_at, ...row }) => ({ ...row, createdAt: new Date(created_at).toISOString() }));
  }
  async complete(reference: string): Promise<boolean> {
    if (!/^EXV-\d{8}-[A-F0-9]{12}$/.test(reference)) return false;
    return this.db.prepare("DELETE FROM inquiries WHERE reference = ?").run(reference).changes > 0;
  }
  async privacySetting(): Promise<PrivacySetting> {
    const row = this.db.prepare("SELECT email, version FROM settings WHERE id=1").get() as PrivacySetting;
    return { email: row.email, version: row.version };
  }
  async updatePrivacyContact(raw: string, version: number, actorId: string): Promise<PrivacyUpdateResult> {
    const email = raw.trim().toLowerCase();
    if (!validContactEmail(email)) return { state: "invalid-email" };
    if (!Number.isInteger(version) || version < 0 || !/^[0-9a-f-]{36}$/.test(actorId)) throw new Error("Invalid setting update");
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const previous = this.db.prepare("SELECT email, version FROM settings WHERE id=1").get() as PrivacySetting;
      if (previous.version !== version) { this.db.exec("COMMIT"); return { state: "conflict" }; }
      if (previous.email === email) { this.db.exec("COMMIT"); return { state: "saved", setting: { email: previous.email, version: previous.version } }; }
      const next = version + 1;
      this.db.prepare("UPDATE settings SET email=?, version=? WHERE id=1").run(email, next);
      this.db.prepare("INSERT INTO setting_events(previous_email,email,version,actor_id,created_at) VALUES(?,?,?,?,?)").run(previous.email, email, next, actorId, this.now());
      this.db.exec("COMMIT");
      return { state: "saved", setting: { email, version: next } };
    } catch (error) { this.db.exec("ROLLBACK"); throw error; }
  }
  async privacyHistory(): Promise<PrivacySettingEvent[]> {
    const rows = this.db.prepare("SELECT previous_email, email, version, actor_id, created_at FROM setting_events ORDER BY version DESC LIMIT 20").all() as unknown as { previous_email: string; email: string; version: number; actor_id: string; created_at: number }[];
    return rows.map(row => ({ previousEmail: row.previous_email, email: row.email, version: row.version, actorId: row.actor_id, createdAt: new Date(row.created_at).toISOString() }));
  }
  async storeSession(hash: string, accountId: string, payload: string, expiresAt: number): Promise<void> {
    if (!/^[a-f0-9]{64}$/.test(hash) || !uuidPattern.test(accountId) || !/^[A-Za-z0-9_-]{29,32000}$/.test(payload) || !Number.isSafeInteger(expiresAt) || expiresAt <= this.now() || expiresAt > this.now() + 3_600_000) throw new Error("company_session_input");
    this.db.prepare("DELETE FROM company_sessions WHERE expires_at <= ?").run(this.now());
    this.db.prepare("INSERT INTO company_sessions(hash,account_id,payload,expires_at) VALUES(?,?,?,?)").run(hash, accountId, payload, expiresAt);
  }
  async readSession(hash: string): Promise<string | null> {
    if (!/^[a-f0-9]{64}$/.test(hash)) return null;
    const row = this.db.prepare("SELECT payload FROM company_sessions WHERE hash=? AND expires_at>?").get(hash, this.now()) as { payload: string } | undefined;
    return row?.payload ?? null;
  }
  async deleteSession(hash: string): Promise<void> {
    if (!/^[a-f0-9]{64}$/.test(hash)) throw new Error("company_session_input");
    this.db.prepare("DELETE FROM company_sessions WHERE hash=?").run(hash);
  }
  async startPurgeRun(runId: string, actorId: string): Promise<void> {
    if (!uuidPattern.test(runId) || !uuidPattern.test(actorId)) throw new Error("purge_input");
    this.db.prepare("INSERT INTO maintenance_runs(run_id,actor_id,started_at,state) VALUES(?,?,?,'started')").run(runId, actorId, this.now());
  }
  async executePurgeRun(runId: string): Promise<PurgeResult> {
    if (!uuidPattern.test(runId)) throw new Error("purge_input");
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const run = this.db.prepare("SELECT state,result FROM maintenance_runs WHERE run_id=?").get(runId) as { state: string; result: string | null } | undefined;
      if (!run) throw new Error("purge_missing_run");
      if (run.result) { this.db.exec("COMMIT"); return readPurgeResult(JSON.parse(run.result)); }
      const now = this.now();
      const count = (sql: string, cutoff: number) => Number(this.db.prepare(sql).run(cutoff).changes);
      const counts = {
        inquiriesDeleted: count("DELETE FROM inquiries WHERE expires_at <= ?", now),
        rateEntriesDeleted: count("DELETE FROM rate_limits WHERE expires_at <= ?", now),
        historyEntriesDeleted: count("DELETE FROM setting_events WHERE created_at < ?", now - 90 * 86_400_000),
        sessionsDeleted: count("DELETE FROM company_sessions WHERE expires_at <= ?", now),
      };
      const result: PurgeResult = { runId, state: "succeeded", counts };
      this.db.prepare("UPDATE maintenance_runs SET state='succeeded',result=?,finished_at=? WHERE run_id=?").run(JSON.stringify(result), now, runId);
      this.db.prepare("DELETE FROM maintenance_runs WHERE run_id<>? AND started_at<? AND state<>'started'").run(runId, now - 90 * 86_400_000);
      this.db.exec("COMMIT"); return result;
    } catch (error) {
      this.db.exec("ROLLBACK");
      const result: PurgeResult = { runId, state: "failed", reason: "database_failure" };
      const updated = this.db.prepare("UPDATE maintenance_runs SET state='failed',result=?,finished_at=? WHERE run_id=? AND state='started'").run(JSON.stringify(result), this.now(), runId);
      if (!updated.changes) throw error;
      return result;
    }
  }
  purgeExpired(): number {
    const now = this.now();
    this.db.prepare("DELETE FROM rate_limits WHERE expires_at <= ?").run(now);
    this.db.prepare("DELETE FROM setting_events WHERE created_at < ?").run(now - 90 * 86_400_000);
    return Number(this.db.prepare("DELETE FROM inquiries WHERE expires_at <= ?").run(now).changes);
  }
  close() { this.db.close(); }
}
export type LocalInquirySummary = {
  reference: string; name: string; email: string; organization: string; kind: string; message: string; created_at: number;
};
