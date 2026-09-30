import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import { SupabaseInquiryStore } from '../src/lib/inquiries/supabase-store.ts';

const sql = readFileSync(new URL('../supabase/migrations/20260930082856_website_inquiry_intake.sql', import.meta.url), 'utf8');
const actor = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const policy = { controller: '가상 테스트', purpose: '문의 접수·내용 확인·답변', version: 'test-v1.contact-1', retentionDays: 90, contact: 'privacy@example.invalid' };
const submission = (extra = {}) => ({ request_id: randomUUID(), payload_hash: 'a'.repeat(64), ip_hash: 'b'.repeat(64), email_hash: 'c'.repeat(64), name: '가상 방문자', email: 'visitor@example.invalid', organization: '미동의 회사는 버려야 함', organization_consent: false, kind: 'business', message: '가상 데이터로 migration을 검증합니다.', policy, ...extra });

test('migration and production RPC contract run on isolated PostgreSQL with fixture roles', async t => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec('create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls; grant usage on schema public to anon,authenticated,service_role;');
  await db.exec(sql);
  const rpc = async (name, params = {}) => {
    const names = Object.keys(params), args = names.map((key, index) => `${key} => $${index + 1}`).join(',');
    const values = Object.values(params).map(value => value && typeof value === 'object' ? JSON.stringify(value) : value);
    return (await db.query(`select public.${name}(${args}) as result`, values)).rows[0].result;
  };
  await t.test('all private tables use RLS and no privileged definer function exists', async () => {
    const tables = (await db.query("select relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='website_private' and c.relkind='r'")).rows;
    assert.equal(tables.length, 4); assert.ok(tables.every(row => row.relrowsecurity));
    const functions = (await db.query("select prosecdef from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and (proname like '%website%' or proname='submit_website_inquiry')")).rows;
    assert.equal(functions.length, 7); assert.ok(functions.every(row => row.prosecdef === false));
  });
  for (const role of ['anon','authenticated']) await t.test(`${role} cannot read inquiries/settings or execute protected RPCs`, async () => {
    await db.exec(`set role ${role}`);
    try {
      for (const query of ["select * from website_private.inquiries", "select * from website_private.settings", "select public.website_privacy_setting()", "select public.list_website_inquiries()", "select public.complete_website_inquiry('EXV-20260930-000000000000')", "select public.submit_website_inquiry('{}'::jsonb)", `select public.set_website_privacy_contact('privacy@example.invalid',0,'${actor}')`]) await assert.rejects(db.query(query), /permission denied/);
    } finally { await db.exec('reset role'); }
  });
  await db.exec('set role service_role');
  await t.test('unconfigured contact is empty; validated versioned update creates secret-free history', async () => {
    assert.deepEqual(await rpc('website_privacy_setting'), { email: '', version: 0 });
    assert.equal((await rpc('set_website_privacy_contact', { p_email: 'bad', p_version: 0, p_actor_id: actor })).state, 'invalid-email');
    assert.equal((await rpc('set_website_privacy_contact', { p_email: 'privacy@example.invalid', p_version: 0, p_actor_id: actor })).state, 'saved');
    assert.equal((await rpc('set_website_privacy_contact', { p_email: 'new@example.invalid', p_version: 0, p_actor_id: actor })).state, 'conflict');
    const history = await rpc('website_privacy_history'); assert.equal(history.length, 1); assert.equal(history[0].actorId, actor);
    assert.deepEqual(Object.keys(history[0]).sort(), ['actorId','createdAt','email','previousEmail','version']);
  });
  await t.test('durable save, identical retry, changed payload and optional consent have the expected results', async () => {
    const input = submission(), first = await rpc('submit_website_inquiry', { p_submission: input });
    assert.equal(first.state, 'saved'); assert.match(first.reference, /^EXV-\d{8}-[A-F0-9]{12}$/);
    assert.equal((await rpc('submit_website_inquiry', { p_submission: input })).reference, first.reference);
    assert.equal((await rpc('submit_website_inquiry', { p_submission: { ...input, payload_hash: 'd'.repeat(64) } })).state, 'conflict');
    const rows = await rpc('list_website_inquiries'); assert.equal(rows.length, 1); assert.equal(rows[0].organization, '');
    const period = (await db.query('select extract(epoch from expires_at-created_at)/86400 as days from website_private.inquiries')).rows[0].days;
    assert.equal(Number(period), 90);
  });
  await t.test('invalid schema input rolls back both inquiry and budget writes', async () => {
    const before = (await db.query('select sum(count) as total from website_private.inquiry_rate_limits')).rows[0].total;
    await assert.rejects(rpc('submit_website_inquiry', { p_submission: submission({ message: '' }) }));
    assert.equal((await db.query('select sum(count) as total from website_private.inquiry_rate_limits')).rows[0].total, before);
    await assert.rejects(rpc('submit_website_inquiry', { p_submission: submission({ policy: { ...policy, retentionDays: 91 } }) }));
  });
  await t.test('all three durable rate budgets reject overflow without creating a record', async () => {
    for (const [key, seconds, maximum] of [['ip:'+'b'.repeat(64),600,5],['email:'+'c'.repeat(64),3600,3],['global',3600,100]]) {
      await db.query('delete from website_private.inquiry_rate_limits');
      await db.query('insert into website_private.inquiry_rate_limits(key,window_start,count,expires_at) select $1,to_timestamp(floor(extract(epoch from clock_timestamp())/$2)*$2),$3,to_timestamp(floor(extract(epoch from clock_timestamp())/$2)*$2)+make_interval(secs=>$2)', [key,seconds,maximum]);
      const result = await rpc('submit_website_inquiry', { p_submission: submission() });
      assert.equal(result.state, 'rate-limited'); assert.ok(result.retryAfter > 0 && result.retryAfter <= seconds);
    }
    await db.query('delete from website_private.inquiry_rate_limits');
  });
  await t.test('completion deletes the full inquiry record', async () => {
    const items = await rpc('list_website_inquiries');
    assert.equal((await rpc('complete_website_inquiry', { p_reference: items[0].reference })).deleted, true);
    assert.deepEqual(await rpc('list_website_inquiries'), []);
  });
  await t.test('90-day deadline and security/history expiry are purged without touching settings', async () => {
    await rpc('submit_website_inquiry', { p_submission: submission() });
    await db.exec('reset role');
    await db.exec("with fixed as (select clock_timestamp() t) update website_private.inquiries set created_at=fixed.t-interval '91 days',expires_at=fixed.t-interval '1 day' from fixed; update website_private.inquiry_rate_limits set window_start=clock_timestamp()-interval '2 hours',expires_at=clock_timestamp()-interval '1 hour'; update website_private.setting_events set created_at=clock_timestamp()-interval '91 days'; set role service_role;");
    const deleted = await rpc('purge_expired_website_inquiries'); assert.equal(deleted.inquiriesDeleted, 1); assert.equal(deleted.rateEntriesDeleted, 3); assert.equal(deleted.historyEntriesDeleted, 1);
    assert.deepEqual(await rpc('website_privacy_setting'), { email: 'privacy@example.invalid', version: 1 });
  });
  await t.test('the Supabase adapter uses the same RPC SQL and never forwards an unconsented company', async () => {
    const seen = [];
    const mockFetch = async (url, init) => {
      seen.push({ url, init });
      const name = new URL(url).pathname.split('/').at(-1), body = JSON.parse(init.body);
      return Response.json(await rpc(name, body));
    };
    const store = new SupabaseInquiryStore({ url: 'https://abcdefghijklmnopqrst.supabase.co', secret: 'sb_secret_synthetic_fixture_only' }, mockFetch);
    const input = submission();
    const saved = await store.save({ requestId: input.request_id, payloadHash: input.payload_hash, ipHash: input.ip_hash, emailHash: input.email_hash, name: input.name, email: input.email, organization: 'must-not-be-forwarded', organizationConsent: false, kind: input.kind, message: input.message, policy });
    assert.equal(saved.state, 'saved'); assert.equal(JSON.parse(seen[0].init.body).p_submission.organization, '');
    assert.equal(seen[0].init.headers.Authorization, undefined); assert.equal(seen[0].init.redirect, 'error'); assert.equal(seen[0].init.cache, 'no-store');
    assert.equal((await store.list()).length, 1); assert.equal(await store.complete(saved.reference), true);
    assert.equal((await store.updatePrivacyContact('new@example.invalid', 1, actor)).state, 'saved');
    assert.equal((await store.privacySetting()).email, 'new@example.invalid');
    assert.equal((await rpc('submit_website_inquiry', { p_submission: submission() })).state, 'conflict');
  });
});
