import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
export const companyIssuer = "https://gszfrbzvketspsipcitj.supabase.co/auth/v1";
export const companyPortal = "https://accounts.exventure.co.kr";
export const legacyCompanyPortal = "https://exventure-accounts.vercel.app";
export const websiteApplication = "exventure-website";
export const loginCookie = "website-company-login";
export const sessionCookie = "website-company-session";
export const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export type LoginAttempt = { state: string; nonce: string; verifier: string; expiresAt: number };
export type CompanySession = { accessToken: string; subject: string; expiresAt: number };
export interface WebsiteSessionStore {
  storeSession(hash: string, accountId: string, payload: string, expiresAt: number): Promise<void>;
  readSession(hash: string): Promise<string | null>;
  deleteSession(hash: string): Promise<void>;
}
export function newSessionId() { return randomBytes(32).toString("hex"); }
export function sessionHash(value: string) { return createHash("sha256").update(value).digest("hex"); }
export function sealCompanyData(value: unknown, key: string, purpose: "login" | "session") {
  if (!/^[a-f0-9]{64}$/.test(key)) throw new Error("company_setup");
  const iv = randomBytes(12), cipher = createCipheriv("aes-256-gcm", Buffer.from(key, "hex"), iv);
  cipher.setAAD(Buffer.from(`website-company:${purpose}:v1`));
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64url");
}
export function openCompanyData<T extends { expiresAt: number }>(value: string, key: string, purpose: "login" | "session", now = Date.now()): T {
  if (!/^[a-f0-9]{64}$/.test(key) || value.length > 32000 || !/^[A-Za-z0-9_-]+$/.test(value)) throw new Error("company_expired");
  const bytes = Buffer.from(value, "base64url");
  if (bytes.length < 29) throw new Error("company_expired");
  const cipher = createDecipheriv("aes-256-gcm", Buffer.from(key, "hex"), bytes.subarray(0, 12));
  cipher.setAAD(Buffer.from(`website-company:${purpose}:v1`)); cipher.setAuthTag(bytes.subarray(12, 28));
  const data = JSON.parse(Buffer.concat([cipher.update(bytes.subarray(28)), cipher.final()]).toString("utf8")) as T;
  if (!data || !Number.isSafeInteger(data.expiresAt) || data.expiresAt <= now) throw new Error("company_expired");
  return data;
}
export function readCookie(header: string | null, name: string): string | null {
  const matches = (header ?? "").split(";").map(part => part.trim()).filter(part => part.startsWith(`${name}=`));
  if (matches.length !== 1) return null;
  try { return decodeURIComponent(matches[0].slice(name.length + 1)); } catch { return null; }
}
