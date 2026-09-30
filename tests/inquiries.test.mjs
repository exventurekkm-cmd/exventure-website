import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, basename, sep } from 'node:path';
import { randomUUID, randomBytes } from 'node:crypto';
import { validateInquiry } from '../src/lib/inquiries/contract.ts';
import { readInquirySettings, localTestPolicy, productionWebsiteRef } from '../src/lib/inquiries/settings.ts';
import { issueInquiryToken, verifyInquiryToken, keyedHash } from '../src/lib/inquiries/tokens.ts';
import { handleInquiryRequest, maxRequestBytes } from '../src/lib/inquiries/http.ts';
import { LocalInquiryStore } from '../src/lib/inquiries/local-store.ts';
import { handlePrivacySettingRequest, handleCompleteInquiryRequest } from '../src/lib/inquiries/admin-http.ts';
import { checkInquiryAdminAccess } from '../src/lib/inquiries/admin-access.ts';
import { sameOriginRequest } from '../src/lib/inquiries/origin.ts';

const secret = 'local-synthetic-only-not-a-production-credential-0001';
const origin = 'http://127.0.0.1:3127', now = Date.UTC(2026, 8, 30, 12);
const policy = { ...localTestPolicy, version: `${localTestPolicy.version}.contact-1`, contact: 'privacy@example.invalid' };
const settings = { mode: 'local-test', origin, secret, policy };
const valid = { name: '가상 방문자', email: 'visitor@example.invalid', organization: '가상 회사', organizationConsent: false, kind: 'business', message: '가상 문의입니다. 실제 개인정보를 포함하지 않습니다.', consent: true, website: '' };
const token = () => issueInquiryToken(secret, policy, now - 2000);
const request = (body, headers = {}, url = `${origin}/api/inquiries`) => new Request(url, { method: 'POST', headers: { origin, 'content-type': 'application/json', ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) });
const stored = (extra = {}) => ({ ...validateInquiry(valid).inquiry, requestId: randomUUID(), payloadHash: 'a'.repeat(64), ipHash: 'b'.repeat(64), emailHash: 'c'.repeat(64), policy, ...extra });
function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), 'exv-inquiry-'));
  const file = join(dir, 'test.sqlite');
  let time = now;
  const store = new LocalInquiryStore(file, () => time);
  t.after(() => {
    store.close();
    const target = resolve(dir), allowed = resolve(tmpdir()) + sep;
    assert.ok(target.startsWith(allowed) && basename(target).startsWith('exv-inquiry-'));
    rmSync(target, { recursive: true, force: true });
  });
  return { store, file, advance: ms => time += ms };
}

test('mandatory consent is explicit; company data is discarded without separate consent', () => {
  assert.equal(validateInquiry({ ...valid, consent: false }).ok, false);
  assert.equal(validateInquiry({ ...valid, consent: 'true' }).ok, false);
  assert.equal(validateInquiry(valid).inquiry.organization, '');
  assert.equal(validateInquiry({ ...valid, organizationConsent: true }).inquiry.organization, '가상 회사');
});
test('field limits, unknown fields, controls and honeypot are rejected', () => {
  for (const bad of [{ name: '' }, { email: 'bad' }, { message: '짧음' }, { message: 'x'.repeat(3001) }, { kind: 'unknown' }, { name: 'test\nname' }, { website: 'spam' }, { attachment: 'not-allowed' }]) assert.equal(validateInquiry({ ...valid, ...bad }).ok, false);
});
test('tokens reject tampering, early submission, expiry and changed contact notice', () => {
  const value = issueInquiryToken(secret, policy, now);
  assert.equal(verifyInquiryToken(value, secret, policy, now + 2000).ok, true);
  assert.equal(verifyInquiryToken(value, secret, policy, now + 10).code, 'too_fast');
  assert.equal(verifyInquiryToken(value, secret, policy, now + 31 * 60_000).code, 'expired_token');
  assert.equal(verifyInquiryToken(value + 'a', secret, policy, now + 2000).code, 'invalid_token');
  assert.equal(verifyInquiryToken(value, secret, { ...policy, contact: 'new@example.invalid' }, now + 2000).code, 'policy_changed');
});
test('disabled configuration and hosted local mode fail closed', () => {
  assert.equal(readInquirySettings({}).enabled, false);
  const local = { WEBSITE_INQUIRY_MODE: 'local-test', WEBSITE_INQUIRY_ORIGIN: origin, WEBSITE_INQUIRY_SIGNING_SECRET: secret };
  assert.equal(readInquirySettings(local).enabled, true);
  for (const env of [{ VERCEL: '1' }, { VERCEL_ENV: 'preview' }, { WEBSITE_INQUIRY_ORIGIN: 'http://192.0.2.10' }, { WEBSITE_INQUIRY_SIGNING_SECRET: '' }]) assert.equal(readInquirySettings({ ...local, ...env }).enabled, false);
});
test('remote Preview must use an explicit test ref and stop sharing public production DB values', () => {
  const details = { version: policy.version, controllerLegalName: policy.controller, privacyContactRole: '가상 개인정보 담당', processors: [{ name: '가상 제공자', purpose: '가상 저장', dataItems: '가상 문의', countries: ['가상 국가'], retention: '가상 기준' }], internationalTransfer: { status: 'not_applicable', approvedNotice: '가상 테스트 검토 안내' } };
  const base = { WEBSITE_INQUIRY_MODE: 'supabase', WEBSITE_INQUIRY_ORIGIN: 'https://review.example.invalid', WEBSITE_INQUIRY_SIGNING_SECRET: secret, WEBSITE_INQUIRY_POLICY_APPROVED: 'true', WEBSITE_INQUIRY_PROCESSOR_REVIEW_APPROVED: 'true', WEBSITE_INQUIRY_POLICY_JSON: JSON.stringify(policy), WEBSITE_INQUIRY_DB_ENVIRONMENT: 'test', WEBSITE_INQUIRY_TEST_PROJECT_REF: 'abcdefghijklmnopqrst', WEBSITE_INQUIRY_DB_URL: 'https://abcdefghijklmnopqrst.supabase.co', WEBSITE_INQUIRY_DB_SECRET_KEY: 'sb_secret_synthetic_fixture_only', VERCEL_ENV: 'preview' };
  base.WEBSITE_INQUIRY_PRIVACY_DETAILS_JSON = JSON.stringify(details);
  Object.assign(base, { WEBSITE_COMPANY_SSO_ENABLED: 'true', WEBSITE_COMPANY_AUTH_PROVISIONED: 'true', WEBSITE_COMPANY_OIDC_CLIENT_ID: 'ephemeral-fixture-client', WEBSITE_COMPANY_SESSION_KEY: randomBytes(32).toString('hex'), WEBSITE_COMPANY_ADMIN_ACCOUNT_ID: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', WEBSITE_COMPANY_TEST_PROJECT_REF:'qrstuvwxyzabcdefghij', WEBSITE_COMPANY_TEST_PORTAL_ORIGIN:'https://accounts-test.example.invalid', WEBSITE_INQUIRY_PURGE_ENABLED: 'true', WEBSITE_INQUIRY_RETENTION_OPERATIONS_APPROVED: 'true' });
  assert.equal(readInquirySettings(base).enabled, true);
  assert.equal(readInquirySettings({ ...base, NEXT_PUBLIC_SUPABASE_URL: `https://${productionWebsiteRef}.supabase.co` }).enabled, false);
  for (const ref of [productionWebsiteRef, 'gszfrbzvketspsipcitj', 'drivizzujcrufcjxvlue']) assert.equal(readInquirySettings({ ...base, WEBSITE_INQUIRY_DB_URL: `https://${ref}.supabase.co`, WEBSITE_INQUIRY_TEST_PROJECT_REF: ref }).enabled, false);
  assert.equal(readInquirySettings({ ...base, WEBSITE_INQUIRY_POLICY_APPROVED: '' }).enabled, false);
  assert.equal(readInquirySettings({ ...base, WEBSITE_INQUIRY_PROCESSOR_REVIEW_APPROVED: '' }).enabled, false);
  assert.equal(readInquirySettings({ ...base, WEBSITE_INQUIRY_DB_URL: 'https://example.invalid' }).enabled, false);
});
test('disabled endpoint does not invoke storage or consume submitted data', async () => {
  let calls = 0;
  const response = await handleInquiryRequest(request({ name: 'synthetic' }), { settings: null, store: { save: async () => { calls++; } } });
  assert.equal(response.status, 503); assert.equal(calls, 0); assert.match(response.headers.get('cache-control'), /no-store/);
});
test('origin, fetch metadata, content type and streamed size are enforced before saving', async () => {
  let calls = 0;
  const deps = { settings, now: () => now, store: { save: async () => { calls++; } } };
  for (const [headers, status] of [[{ origin: 'https://other.example.invalid' }, 403], [{ 'sec-fetch-site': 'cross-site' }, 403], [{ 'content-type': 'text/plain' }, 415]]) assert.equal((await handleInquiryRequest(request({ ...valid, token: token() }, headers), deps)).status, status);
  assert.equal((await handleInquiryRequest(request('invalid-json'), deps)).status, 400);
  assert.equal((await handleInquiryRequest(request('x'.repeat(maxRequestBytes + 1), { 'content-length': '1' }), deps)).status, 413);
  assert.equal(calls, 0);
});
test('storage failure yields no success/reference or personal details in response/log', async () => {
  const events = [];
  const response = await handleInquiryRequest(request({ ...valid, token: token() }), { settings, now: () => now, log: event => events.push(event), store: { save: async () => { throw new Error('visitor@example.invalid private-token'); } } });
  assert.equal(response.status, 503);
  const body = await response.text(); assert.doesNotMatch(body, /visitor@example.invalid|private-token|reference/);
  assert.deepEqual(events, ['website_inquiry_storage_unavailable']);
});
test('Next local URL alias still requires exact Origin, Host, port and an explicit fixture', async t => {
  const { store } = fixture(t);
  const alias = (headers = {}, url = 'http://localhost:3127/api/inquiries') => request({ ...valid, token: token() }, { host: '127.0.0.1:3127', 'sec-fetch-site': 'same-origin', ...headers }, url);
  assert.equal(sameOriginRequest(alias(), origin, true), true);
  assert.equal(sameOriginRequest(alias(), origin, false), false);
  for (const bad of [alias({ origin: 'http://localhost:3127' }), alias({ origin: 'https://other.example.invalid' }), alias({ host: 'other.example.invalid' }), alias({ host: '' }), alias({ 'sec-fetch-site': 'cross-site' }), alias({}, 'http://localhost:3128/api/inquiries'), alias({}, 'https://localhost:3127/api/inquiries'), alias({}, 'http://attacker.example.invalid:3127/api/inquiries')]) assert.equal(sameOriginRequest(bad, origin, true), false);
  assert.equal((await handleInquiryRequest(alias(), { settings, store, now: () => now })).status, 201);
  const context = { store, origin, actorId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', testOnly: true };
  const setting = request({ email: 'privacy@example.invalid', version: 0 }, { host: '127.0.0.1:3127', 'sec-fetch-site': 'same-origin' }, 'http://localhost:3127/api/admin/inquiries/settings');
  assert.equal((await handlePrivacySettingRequest(setting, context)).status, 200);
});
test('remote storage cannot trust caller-supplied forwarded-for outside Vercel', async () => {
  const remote = { ...settings, mode: 'supabase' };
  const response = await handleInquiryRequest(request({ ...valid, token: token() }, { 'x-forwarded-for': '192.0.2.1', 'x-vercel-forwarded-for': '192.0.2.1' }), { settings: remote, trustedPlatform: false, now: () => now, store: { save: async () => { throw new Error('must not run'); } } });
  assert.equal(response.status, 503);
});
test('SQLite saves once on retry/concurrent duplicate and survives reopening', async t => {
  const { store, file } = fixture(t), input = stored();
  const [first, second] = await Promise.all([store.save(input), store.save(input)]);
  assert.equal(first.reference, second.reference);
  assert.equal((await store.save({ ...input, payloadHash: 'd'.repeat(64) })).state, 'conflict');
  const reopened = new LocalInquiryStore(file, () => now);
  assert.equal((await reopened.list()).length, 1); reopened.close();
  assert.equal((await store.list())[0].organization, '');
});
test('SQLite enforces email and IP budgets while allowing identical retry', async t => {
  const { store } = fixture(t), first = stored();
  for (let index = 0; index < 3; index++) assert.equal((await store.save({ ...first, requestId: randomUUID() })).state, 'saved');
  assert.equal((await store.save({ ...first, requestId: randomUUID() })).state, 'rate-limited');
  for (let index = 0; index < 2; index++) assert.equal((await store.save(stored({ emailHash: keyedHash(secret, 'test', String(index)) }))).state, 'saved');
  assert.equal((await store.save(stored({ emailHash: 'e'.repeat(64) }))).state, 'rate-limited');
});
test('completed inquiries are deleted and the 90-day deadline purges unfinished inquiries', async t => {
  const { store, advance } = fixture(t);
  const first = await store.save(stored());
  assert.equal(await store.complete(first.reference), true); assert.equal((await store.list()).length, 0);
  await store.save(stored({ emailHash: 'd'.repeat(64) }));
  advance(90 * 86_400_000); assert.equal(store.purgeExpired(), 1); assert.equal((await store.list()).length, 0);
});
test('contact settings are independent, versioned, durable and record only the allowed audit fields', async t => {
  const { store, file } = fixture(t), actorId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  assert.equal((await store.privacySetting()).email, '');
  assert.equal((await store.updatePrivacyContact('bad', 0, actorId)).state, 'invalid-email');
  assert.equal((await store.updatePrivacyContact(' Privacy@Example.Invalid ', 0, actorId)).setting.email, 'privacy@example.invalid');
  assert.equal((await store.updatePrivacyContact('changed@example.invalid', 0, actorId)).state, 'conflict');
  assert.equal((await store.updatePrivacyContact('changed@example.invalid', 1, actorId)).state, 'saved');
  const history = await store.privacyHistory(); assert.equal(history.length, 2); assert.equal(history[0].actorId, actorId);
  assert.deepEqual(Object.keys(history[0]).sort(), ['actorId','createdAt','email','previousEmail','version']);
  const reopened = new LocalInquiryStore(file); assert.equal((await reopened.privacySetting()).email, 'changed@example.invalid'); reopened.close();
});
test('only a fresh, active, approved website admin session passes access verification', async () => {
  const id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', session = { subject: id, accessToken: 'synthetic-test-token', expiresAt: Date.now() + 60000 };
  const good = { active: true, account_id: id, application_id: 'exventure-website', role: 'admin' };
  for (const patch of [{ role: 'viewer' }, { role: 'member' }, { active: false }, { application_id: 'management-site' }, { account_id: randomUUID() }]) assert.equal(await checkInquiryAdminAccess(session, id, async () => Response.json({ ...good, ...patch })), false);
  assert.equal(await checkInquiryAdminAccess(session, id, async () => Response.json(good)), true);
  assert.equal(await checkInquiryAdminAccess(null, id), false);
  assert.equal(await checkInquiryAdminAccess({ ...session, expiresAt: 0 }, id), false);
  assert.equal(await checkInquiryAdminAccess(session, id, async () => { throw new Error('unavailable'); }), false);
  assert.equal(await checkInquiryAdminAccess(session, id, async () => new Response('', { status: 403 })), false);
});
test('settings/complete APIs deny missing permission and cross-origin requests; errors do not overwrite settings', async t => {
  const { store } = fixture(t), context = { store, origin, actorId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' };
  const req = (body, headers = {}) => request(body, headers, `${origin}/api/admin/inquiries/settings`);
  assert.equal((await handlePrivacySettingRequest(req({ email: 'privacy@example.invalid', version: 0 }), null)).status, 403);
  assert.equal((await handlePrivacySettingRequest(req({ email: 'privacy@example.invalid', version: 0 }, { origin: 'https://other.example.invalid' }), context)).status, 403);
  assert.equal((await handlePrivacySettingRequest(req({ email: 'bad', version: 0 }), context)).status, 400);
  assert.equal((await handlePrivacySettingRequest(req({ email: 'privacy@example.invalid', version: 0 }), context)).status, 200);
  assert.equal((await handlePrivacySettingRequest(req({ email: 'new@example.invalid', version: 0 }), context)).status, 409);
  const broken = { ...context, store: { ...store, updatePrivacyContact: async () => { throw new Error('synthetic failure'); } } };
  assert.equal((await handlePrivacySettingRequest(req({ email: 'new@example.invalid', version: 1 }), broken)).status, 503);
  assert.equal((await store.privacySetting()).email, 'privacy@example.invalid');
  const saved = await store.save(stored());
  assert.equal((await handleCompleteInquiryRequest(req({}), saved.reference, null)).status, 403);
  assert.equal((await handleCompleteInquiryRequest(req({}), saved.reference, context)).status, 200);
  assert.equal((await store.list()).length, 0);
});
test('HTTP full path returns a receipt only after a durable local save and retry keeps the receipt', async t => {
  const { store } = fixture(t), body = { ...valid, token: token() }, deps = { settings, store, now: () => now };
  const first = await handleInquiryRequest(request(body), deps), second = await handleInquiryRequest(request(body), deps);
  assert.equal(first.status, 201); assert.equal((await first.json()).reference, (await second.json()).reference);
  assert.equal((await store.list()).length, 1);
});
