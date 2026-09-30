import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep, basename } from 'node:path';
import { localIntegration, localIntegrationRequestUrl, validLocalIntegrationEnvironment } from '../src/lib/local-integration.ts';
import { readInquiryBackend, productionWebsiteRef, reservedSupabaseRefs } from '../src/lib/inquiries/backend-settings.ts';
import { readCompanyConfig } from '../src/lib/company/config.ts';
import { companyIssuer, companyPortal } from '../src/lib/company/contract.ts';
import { readInquirySettings, isTestInquiry } from '../src/lib/inquiries/settings.ts';
import { LocalInquiryStore } from '../src/lib/inquiries/local-store.ts';
import { SupabaseInquiryStore } from '../src/lib/inquiries/supabase-store.ts';
import { handleInquiryRequest } from '../src/lib/inquiries/http.ts';
import { handlePrivacySettingRequest, handleCompleteInquiryRequest, validAdminMutation } from '../src/lib/inquiries/admin-http.ts';
import { handlePurgeRequest } from '../src/lib/inquiries/maintenance.ts';
import { issueInquiryToken } from '../src/lib/inquiries/tokens.ts';

const actor = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const env = () => ({
  WEBSITE_LOCAL_INTEGRATION_ENABLED: 'true', WEBSITE_INQUIRY_MODE: 'supabase',
  WEBSITE_INQUIRY_DB_ENVIRONMENT: 'local-test', WEBSITE_INQUIRY_ORIGIN: localIntegration.origin,
  WEBSITE_INQUIRY_DB_URL: localIntegration.databaseUrl, WEBSITE_INQUIRY_DB_SECRET_KEY: 'sb_secret_synthetic_fixture_only',
  WEBSITE_INQUIRY_LOCAL_PROJECT_ID: localIntegration.websiteProjectId, WEBSITE_COMPANY_LOCAL_PROJECT_ID: localIntegration.accountsProjectId,
  WEBSITE_INQUIRY_SIGNING_SECRET: randomBytes(32).toString('hex'),
  WEBSITE_COMPANY_SSO_ENABLED: 'true', WEBSITE_COMPANY_AUTH_PROVISIONED: 'true',
  WEBSITE_COMPANY_OIDC_CLIENT_ID: 'ephemeral-fixture-client', WEBSITE_COMPANY_SESSION_KEY: randomBytes(32).toString('hex'),
  WEBSITE_COMPANY_ADMIN_ACCOUNT_ID: actor,
});
const req = (path, body, changes = {}, url = `${localIntegration.origin}${path}`) => new Request(url, { method: 'POST', headers: { host: '127.0.0.1:3003', origin: localIntegration.origin, 'content-type': 'application/json', 'sec-fetch-site': 'same-origin', ...changes }, body: JSON.stringify(body) });
function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), 'exv-local-integration-')), store = new LocalInquiryStore(join(dir, 'test.sqlite'));
  t.after(() => { store.close(); const target = resolve(dir); assert.ok(target.startsWith(resolve(tmpdir()) + sep) && basename(target).startsWith('exv-local-integration-')); rmSync(target, { recursive: true, force: true }); });
  return store;
}

test('explicit local integration selects real Supabase adapter and fixed accounts endpoints; public requests need no OAuth cookie', () => {
  const base = env(), backend = readInquiryBackend(base), company = readCompanyConfig(base), publicSettings = readInquirySettings(base);
  assert.deepEqual(backend, { mode: 'supabase', origin: localIntegration.origin, localIntegration: true, database: { url: localIntegration.databaseUrl, secret: base.WEBSITE_INQUIRY_DB_SECRET_KEY } });
  assert.equal(company.issuer, localIntegration.issuer); assert.equal(company.portal, localIntegration.portal); assert.equal(company.localIntegration, true);
  assert.equal(publicSettings.enabled, true); assert.equal(isTestInquiry(publicSettings.settings), true);
  assert.equal(publicSettings.settings.policy.retentionDays, 90); assert.match(publicSettings.settings.policy.version, /^local-synthetic-test/);
  assert.equal(readInquirySettings({ ...base, WEBSITE_INQUIRY_MODE: 'disabled' }).enabled, false);
  assert.ok(readCompanyConfig({ ...base, WEBSITE_INQUIRY_MODE: 'disabled' }));
  assert.equal(readInquirySettings({ ...base, WEBSITE_COMPANY_AUTH_PROVISIONED: 'false' }).enabled, false);
});

test('missing opt-in, another project, localhost, wrong port, external URLs or production DB cannot enter local mode', () => {
  const base = env();
  for (const change of [
    { WEBSITE_LOCAL_INTEGRATION_ENABLED: 'false' }, { WEBSITE_LOCAL_INTEGRATION_ENABLED: '' },
    { WEBSITE_INQUIRY_DB_ENVIRONMENT: 'production' }, { WEBSITE_INQUIRY_DB_ENVIRONMENT: 'test' }, { WEBSITE_INQUIRY_MODE: 'local-test' },
    { WEBSITE_INQUIRY_LOCAL_PROJECT_ID: 'another-stack' }, { WEBSITE_COMPANY_LOCAL_PROJECT_ID: '' },
    { WEBSITE_INQUIRY_ORIGIN: 'http://localhost:3003' }, { WEBSITE_INQUIRY_ORIGIN: 'http://127.0.0.1:3004' },
    { WEBSITE_INQUIRY_DB_URL: 'http://localhost:58621' }, { WEBSITE_INQUIRY_DB_URL: 'http://127.0.0.1:58521' },
    { WEBSITE_INQUIRY_DB_URL: `https://${productionWebsiteRef}.supabase.co` },
    { NEXT_PUBLIC_SITE_URL: 'https://exventure-website.vercel.app' }, { NEXT_PUBLIC_SUPABASE_URL: `https://${productionWebsiteRef}.supabase.co` },
    { WEBSITE_COMPANY_TEST_PORTAL_ORIGIN: companyPortal }, { WEBSITE_COMPANY_TEST_PORTAL_ORIGIN: 'http://localhost:3002' },
    { WEBSITE_COMPANY_TEST_PROJECT_REF: 'gszfrbzvketspsipcitj' }, { WEBSITE_INQUIRY_TEST_PROJECT_REF: 'another-stack' },
    { WEBSITE_INQUIRY_DB_SECRET_KEY: '' }, { WEBSITE_INQUIRY_DB_SECRET_KEY: 'sb_publishable_fixture' },
  ]) {
    const candidate = { ...base, ...change };
    assert.equal(readInquiryBackend(candidate), null, JSON.stringify(change));
    assert.equal(readCompanyConfig(candidate), null, JSON.stringify(change));
    assert.equal(readInquirySettings(candidate).enabled, false, JSON.stringify(change));
  }
  for (const ref of reservedSupabaseRefs) {
    const jwt = ['synthetic', Buffer.from(JSON.stringify({ role: 'service_role', ref, iss: `https://${ref}.supabase.co/auth/v1` })).toString('base64url'), 'synthetic'].join('.');
    assert.equal(readInquiryBackend({ ...base, WEBSITE_INQUIRY_DB_SECRET_KEY: jwt }), null);
  }
});

test('every Vercel marker, including empty values, disables both HTTP test paths; production stays HTTPS', () => {
  const base = env();
  for (const key of ['VERCEL', 'VERCEL_ENV', 'VERCEL_URL', 'VERCEL_PROJECT_ID']) for (const value of ['', 'preview', 'production']) {
    const candidate = { ...base, [key]: value };
    assert.equal(validLocalIntegrationEnvironment(candidate), false);
    assert.equal(readInquiryBackend(candidate), null); assert.equal(readCompanyConfig(candidate), null); assert.equal(readInquirySettings(candidate).enabled, false);
    const oldFixture = { WEBSITE_INQUIRY_MODE: 'local-test', WEBSITE_INQUIRY_ORIGIN: localIntegration.origin, WEBSITE_INQUIRY_SIGNING_SECRET: base.WEBSITE_INQUIRY_SIGNING_SECRET, [key]: value };
    assert.equal(readInquiryBackend(oldFixture), null); assert.equal(readInquirySettings(oldFixture).enabled, false);
  }
  const production = { ...base, WEBSITE_LOCAL_INTEGRATION_ENABLED: 'false', VERCEL_ENV: 'production', WEBSITE_INQUIRY_DB_ENVIRONMENT: 'production', WEBSITE_INQUIRY_ORIGIN: 'https://exventure-website.vercel.app', WEBSITE_INQUIRY_DB_URL: `https://${productionWebsiteRef}.supabase.co` };
  const company = readCompanyConfig(production); assert.ok(company); assert.equal(company.issuer, companyIssuer); assert.equal(company.portal, companyPortal); assert.equal(company.localIntegration, undefined);
  assert.equal(readCompanyConfig({ ...production, WEBSITE_INQUIRY_ORIGIN: localIntegration.origin }), null);
  assert.equal(readCompanyConfig({ ...production, WEBSITE_LOCAL_INTEGRATION_ENABLED: 'true' }), null);
  assert.equal(readInquirySettings(production).enabled, false); // Unconfirmed legal facts still block production collection.
});

test('local request boundary accepts only actual 127 Host and exact Origin, preserving Next internal normalization', () => {
  const path = '/api/inquiries';
  assert.equal(localIntegrationRequestUrl(req(path, {})).origin, localIntegration.origin);
  const internal = req(path, {}, {}, `http://localhost:3003${path}`);
  assert.equal(localIntegrationRequestUrl(internal).href, `${localIntegration.origin}${path}`);
  assert.equal(validAdminMutation(internal, localIntegration.origin, true, true), true);
  for (const request of [req(path, {}, { host: 'localhost:3003' }), req(path, {}, { origin: 'http://localhost:3003' }), req(path, {}, { origin: localIntegration.portal }), req(path, {}, { 'sec-fetch-site': 'cross-site' }), req(path, {}, { host: 'external.example.invalid', 'x-forwarded-host': '127.0.0.1:3003', 'x-forwarded-proto': 'http' }), req(path, {}, {}, `http://127.0.0.1:3004${path}`), req(path, {}, {}, `https://127.0.0.1:3003${path}`)]) assert.equal(validAdminMutation(request, localIntegration.origin, true, true), false);
});

test('isolated local public submission, contact changes, unconsented company omission, completion and expiry purge preserve guards', async t => {
  const store = fixture(t), base = readInquirySettings(env()).settings, context = { store, actorId: actor, origin: localIntegration.origin, testOnly: true, localIntegration: true };
  assert.equal((await handlePrivacySettingRequest(req('/api/admin/inquiries/settings', { email: 'privacy@example.invalid', version: 0 }), context)).status, 200);
  const setting = await store.privacySetting(), policy = { ...base.policy, version: `${base.policy.version}.contact-${setting.version}`, contact: setting.email }, settings = { ...base, policy };
  const now = Date.now(), token = issueInquiryToken(settings.secret, policy, now - 2000);
  const input = { name: '가상 방문자', email: 'visitor@example.invalid', kind: 'business', message: '실제 개인정보가 없는 로컬 통합 테스트 문의입니다.', organization: '가상 미동의 회사', organizationConsent: false, consent: true, website: '', token };
  for (const headers of [{ host: 'localhost:3003' }, { origin: 'http://localhost:3003' }, { origin: localIntegration.portal }, { 'sec-fetch-site': 'cross-site' }]) assert.equal((await handleInquiryRequest(req('/api/inquiries', input, headers), { settings, store, now: () => now })).status, 403);
  assert.equal((await store.list()).length, 0);
  const response = await handleInquiryRequest(req('/api/inquiries', input, {}, 'http://localhost:3003/api/inquiries'), { settings, store, now: () => now });
  assert.equal(response.status, 201); const receipt = await response.json(); assert.equal(receipt.testOnly, true);
  assert.equal((await store.list())[0].organization, '');
  assert.equal((await handlePrivacySettingRequest(req('/api/admin/inquiries/settings', { email: 'changed@example.invalid', version: 1 }), null)).status, 403);
  assert.equal((await handlePrivacySettingRequest(req('/api/admin/inquiries/settings', { email: 'changed@example.invalid', version: 1 }), context)).status, 200);
  const changed = await store.privacySetting(), updated = { ...settings, policy: { ...base.policy, contact: changed.email, version: `${base.policy.version}.contact-${changed.version}` } };
  const obsolete = await handleInquiryRequest(req('/api/inquiries', input), { settings: updated, store, now: () => now });
  assert.equal(obsolete.status, 400); assert.equal((await obsolete.json()).code, 'policy_changed');
  assert.equal((await store.privacyHistory()).length, 2);
  const path = `/api/admin/inquiries/${receipt.reference}/complete`;
  assert.equal((await handleCompleteInquiryRequest(req(path, {}, { host: 'localhost:3003' }), receipt.reference, context)).status, 400);
  assert.equal((await handleCompleteInquiryRequest(req(path, {}), receipt.reference, null)).status, 403);
  assert.equal((await handleCompleteInquiryRequest(req(path, {}), receipt.reference, context)).status, 200); assert.equal((await store.list()).length, 0);
  assert.equal((await handlePurgeRequest(req('/api/admin/inquiries/purge', { action: 'purge_expired' }, { origin: localIntegration.portal }), context, true)).status, 403);
  assert.equal((await handlePurgeRequest(req('/api/admin/inquiries/purge', { action: 'purge_expired' }), context, false)).status, 503);
  assert.equal((await handlePurgeRequest(req('/api/admin/inquiries/purge', { action: 'purge_expired' }), context, true)).status, 200);
});

test('local integration uses the real Supabase REST request shape, exact website API and no redirects; company without consent is never transmitted', async () => {
  const backend = readInquiryBackend(env()), calls = [];
  const store = new SupabaseInquiryStore(backend.database, async (url, options) => { calls.push({ url, options }); return Response.json({ state: 'saved', reference: 'EXV-20260930-000000000001' }); });
  await store.save({ requestId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', payloadHash: 'a'.repeat(64), ipHash: 'b'.repeat(64), emailHash: 'c'.repeat(64), name: '가상 방문자', email: 'visitor@example.invalid', kind: 'business', message: '로컬 어댑터 가상 테스트입니다.', organization: '가상 미동의 회사', organizationConsent: false, policy: readInquirySettings(env()).settings.policy });
  assert.equal(calls.length, 1); assert.equal(calls[0].url, 'http://127.0.0.1:58621/rest/v1/rpc/submit_website_inquiry'); assert.equal(calls[0].options.redirect, 'error'); assert.equal(calls[0].options.cache, 'no-store'); assert.doesNotMatch(calls[0].options.body, /가상 미동의 회사/);
  assert.equal(JSON.parse(calls[0].options.body).p_submission.organization, '');
});
