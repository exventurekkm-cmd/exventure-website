import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID, randomBytes } from 'node:crypto';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep, basename } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { PGlite } from '@electric-sql/pglite';
import { LocalInquiryStore } from '../src/lib/inquiries/local-store.ts';
import { SupabaseInquiryStore } from '../src/lib/inquiries/supabase-store.ts';
import { handlePurgeRequest } from '../src/lib/inquiries/maintenance.ts';
import { sealCompanyData, sessionHash } from '../src/lib/company/contract.ts';
import { readPrivacyDetails } from '../src/lib/inquiries/privacy-details.ts';
import { readInquirySettings } from '../src/lib/inquiries/settings.ts';

const actor='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',origin='https://website.example.invalid';
const policy={controller:'가상 처리 주체',purpose:'가상 문의 접수·확인·답변',version:'fixture-policy-v1',retentionDays:90,contact:'privacy@example.invalid'};
export const syntheticPrivacyDetails={version:policy.version,controllerLegalName:policy.controller,privacyContactRole:'가상 문의 개인정보 연락 담당 (실제 지정 아님)',processors:[{name:'가상 테스트 제공자',purpose:'테스트 저장',dataItems:'가상 문의',countries:['가상 처리 국가'],retention:'가상 보유 기준'}],internationalTransfer:{status:'not_applicable',approvedNotice:'가상 테스트 검토 문구. 실제 위탁·국외 이전 판단이 아닙니다.'}};
const stored=()=>({requestId:randomUUID(),payloadHash:'a'.repeat(64),ipHash:'b'.repeat(64),emailHash:'c'.repeat(64),name:'가상 방문자',email:'visitor@example.invalid',organization:'',organizationConsent:false,kind:'business',message:'실제 개인정보가 없는 가상 문의 테스트입니다.',policy});
const request=(body={action:'purge_expired'},extra={})=>new Request(`${origin}/api/admin/inquiries/purge`,{method:'POST',headers:{origin,'content-type':'application/json',...extra},body:typeof body==='string'?body:JSON.stringify(body)});
function sqlite(t){const dir=mkdtempSync(join(tmpdir(),'exv-maintenance-')),file=join(dir,'test.sqlite');let now=Date.now();const store=new LocalInquiryStore(file,()=>now),db=new DatabaseSync(file);t.after(()=>{db.close();store.close();const target=resolve(dir);assert.ok(target.startsWith(resolve(tmpdir())+sep)&&basename(target).startsWith('exv-maintenance-'));rmSync(target,{recursive:true,force:true});});return{store,db,advance:ms=>now+=ms};}

test('PostgREST 204 is accepted only for void session and purge-start functions',async()=>{
  const paths=[],store=new SupabaseInquiryStore({url:'https://abcdefghijklmnopqrst.supabase.co',secret:'sb_secret_synthetic'},async(url,options)=>{paths.push(url.split('/').at(-1));assert.equal(options.redirect,'error');assert.equal(options.cache,'no-store');return new Response(null,{status:204});});
  await store.storeSession('a'.repeat(64),actor,'synthetic-encrypted-session-payload',Date.now()+30_000);
  await store.deleteSession('a'.repeat(64));await store.startPurgeRun(randomUUID(),actor);
  assert.deepEqual(paths,['store_website_company_session','delete_website_company_session','start_website_inquiry_purge']);
});
test('empty 204 responses cannot impersonate required JSON session, inquiry, settings or purge results',async()=>{
  const store=new SupabaseInquiryStore({url:'https://abcdefghijklmnopqrst.supabase.co',secret:'sb_secret_synthetic'},async()=>new Response(null,{status:204}));
  for(const operation of [()=>store.readSession('a'.repeat(64)),()=>store.save(stored()),()=>store.privacySetting(),()=>store.updatePrivacyContact('privacy@example.invalid',0,actor),()=>store.executePurgeRun(randomUUID())])await assert.rejects(operation);
});

test('privacy approval flags alone cannot activate collection with unconfirmed legal/provider/transfer facts',()=>{
  const env={WEBSITE_INQUIRY_MODE:'supabase',WEBSITE_INQUIRY_ORIGIN:origin,WEBSITE_INQUIRY_SIGNING_SECRET:'synthetic-signing-material-only-000001',WEBSITE_INQUIRY_POLICY_APPROVED:'true',WEBSITE_INQUIRY_PROCESSOR_REVIEW_APPROVED:'true',WEBSITE_INQUIRY_POLICY_JSON:JSON.stringify(policy),WEBSITE_INQUIRY_DB_ENVIRONMENT:'test',WEBSITE_INQUIRY_TEST_PROJECT_REF:'abcdefghijklmnopqrst',WEBSITE_INQUIRY_DB_URL:'https://abcdefghijklmnopqrst.supabase.co',WEBSITE_INQUIRY_DB_SECRET_KEY:'sb_secret_synthetic',VERCEL_ENV:'preview'};
  Object.assign(env,{WEBSITE_COMPANY_SSO_ENABLED:'true',WEBSITE_COMPANY_AUTH_PROVISIONED:'true',WEBSITE_COMPANY_OIDC_CLIENT_ID:'ephemeral-fixture-client',WEBSITE_COMPANY_SESSION_KEY:randomBytes(32).toString('hex'),WEBSITE_COMPANY_ADMIN_ACCOUNT_ID:actor,WEBSITE_COMPANY_TEST_PROJECT_REF:'qrstuvwxyzabcdefghij',WEBSITE_COMPANY_TEST_PORTAL_ORIGIN:'https://accounts-test.example.invalid',WEBSITE_INQUIRY_PURGE_ENABLED:'true',WEBSITE_INQUIRY_RETENTION_OPERATIONS_APPROVED:'true'});
  assert.equal(readInquirySettings(env).enabled,false);
  assert.equal(readInquirySettings({...env,WEBSITE_INQUIRY_PRIVACY_DETAILS_JSON:JSON.stringify(syntheticPrivacyDetails)}).enabled,true);
  for(const change of [{WEBSITE_COMPANY_AUTH_PROVISIONED:'false'},{WEBSITE_INQUIRY_PURGE_ENABLED:'false'},{WEBSITE_INQUIRY_RETENTION_OPERATIONS_APPROVED:'false'}])assert.equal(readInquirySettings({...env,...change,WEBSITE_INQUIRY_PRIVACY_DETAILS_JSON:JSON.stringify(syntheticPrivacyDetails)}).enabled,false);
  for(const change of [{controllerLegalName:'미정'},{privacyContactRole:''},{processors:[]},{processors:[{...syntheticPrivacyDetails.processors[0],countries:[]}]},{internationalTransfer:{status:'pending',approvedNotice:''}},{internationalTransfer:{status:'applicable',approvedNotice:''}},{version:'other-version'}])assert.equal(readPrivacyDetails(JSON.stringify({...syntheticPrivacyDetails,...change}),policy.version,policy.controller),null);
});
test('purge requires a current admin, enable flag, exact origin and bounded fixed action; no arbitrary cutoff or whole-table action',async()=>{
  let starts=0,executes=0;const store={startPurgeRun:async()=>{starts++;},executePurgeRun:async()=>{executes++;}},context={store,actorId:actor,origin};
  assert.equal((await handlePurgeRequest(request(),null,true)).status,403);
  assert.equal((await handlePurgeRequest(request(),context,false)).status,503);
  for(const req of [request(undefined,{origin:'https://other.example.invalid'}),request(undefined,{'sec-fetch-site':'cross-site'})])assert.equal((await handlePurgeRequest(req,context,true)).status,403);
  for(const body of [{action:'purge_all'},{action:'purge_expired',cutoff:'2099-01-01'},[],{},'x'.repeat(1025)])assert.equal((await handlePurgeRequest(request(body),context,true)).status,400);
  assert.equal(starts,0);assert.equal(executes,0);
});
test('SQLite purge deletes only expired rows/sessions, retains fresh inquiries/settings, records counts and is idempotent by run',async t=>{
  const f=sqlite(t);await f.store.updatePrivacyContact('privacy@example.invalid',0,actor);
  await f.store.save(stored());const key=randomBytes(32).toString('hex'),id=randomBytes(32).toString('hex'),session={subject:actor,accessToken:'synthetic-central-token',expiresAt:Date.now()+30_000};
  await f.store.storeSession(sessionHash(id),actor,sealCompanyData(session,key,'session'),session.expiresAt);
  f.advance(91*86400000);await f.store.save(stored()); // Saving also clears old inquiries/rate rows; seed a separate expiry row below.
  f.db.prepare('UPDATE inquiries SET created_at=created_at-?,expires_at=expires_at-?').run(91*86400000,91*86400000);
  await f.store.save({...stored(),emailHash:'e'.repeat(64),ipHash:'f'.repeat(64)});
  // Restore one expired synthetic row without the save path silently purging it.
  const fresh=f.db.prepare('SELECT * FROM inquiries LIMIT 1').get();
  f.db.prepare('INSERT INTO inquiries SELECT ?,payload_hash,?,name,email,organization,organization_consent,kind,message,policy_snapshot,created_at-?,expires_at-?,status,notification_state FROM inquiries LIMIT 1').run(randomUUID(),'EXV-20260930-000000000001',91*86400000,91*86400000);
  assert.ok(fresh);const events=[];const response=await handlePurgeRequest(request(),{store:f.store,actorId:actor,origin},true,event=>events.push(event));
  assert.equal(response.status,200);const result=await response.json();assert.equal(result.state,'succeeded');assert.equal(result.counts.inquiriesDeleted,1);assert.equal(result.counts.sessionsDeleted,1);assert.equal(result.counts.historyEntriesDeleted,1);
  assert.equal(f.db.prepare('SELECT count(*) count FROM inquiries').get().count,1);assert.equal((await f.store.privacySetting()).email,'privacy@example.invalid');
  assert.deepEqual(await f.store.executePurgeRun(result.runId),{runId:result.runId,state:result.state,counts:result.counts});
  const audit=f.db.prepare('SELECT * FROM maintenance_runs').all();assert.equal(audit.length,1);assert.equal(audit[0].state,'succeeded');assert.doesNotMatch(JSON.stringify(audit)+JSON.stringify(events),/visitor@example|synthetic-central-token|privacy@example/);
});
test('SQLite deletion failure rolls back all deletes and records only a fixed safe failure',async t=>{
  const f=sqlite(t);await f.store.save(stored());f.advance(91*86400000);
  f.db.exec("CREATE TRIGGER fixture_delete_failure BEFORE DELETE ON inquiries BEGIN SELECT RAISE(ABORT,'visitor@example.invalid secret-must-not-be-logged'); END;");
  const response=await handlePurgeRequest(request(),{store:f.store,actorId:actor,origin},true),result=await response.json();
  assert.equal(response.status,503);assert.equal(result.state,'failed');assert.equal(result.reason,'database_failure');
  assert.equal(f.db.prepare('SELECT count(*) count FROM inquiries').get().count,1);assert.equal(f.db.prepare('SELECT state FROM maintenance_runs').get().state,'failed');assert.doesNotMatch(JSON.stringify(result),/visitor@example|secret-must/);
});
test('missing audit storage prevents execution; unknown network outcome stays unknown without retry',async()=>{
  let executes=0;const events=[];
  let store={startPurgeRun:async()=>{throw new Error('private database detail');},executePurgeRun:async()=>{executes++;}};
  assert.equal((await(await handlePurgeRequest(request(),{store,actorId:actor,origin},true,event=>events.push(event))).json()).state,'not_started');assert.equal(executes,0);
  store={startPurgeRun:async()=>{},executePurgeRun:async()=>{executes++;throw new Error('private database detail');}};
  const result=await(await handlePurgeRequest(request(),{store,actorId:actor,origin},true,event=>events.push(event))).json();assert.equal(result.state,'outcome_unknown');assert.equal(executes,1);assert.ok(result.runId);assert.doesNotMatch(JSON.stringify(events)+JSON.stringify(result),/private database detail/);
});
test('session and maintenance migration/REST adapter run on isolated PostgreSQL with RLS and denied public roles',async t=>{
  const db=new PGlite();t.after(()=>db.close());
  await db.exec('create role anon nologin;create role authenticated nologin;create role service_role nologin bypassrls;grant usage on schema public to anon,authenticated,service_role;');
  for(const name of ['20260930082856_website_inquiry_intake.sql','20260930100310_website_company_auth_maintenance.sql'])await db.exec(readFileSync(new URL('../supabase/migrations/'+name,import.meta.url),'utf8'));
  const rpc=async(name,params={})=>(await db.query(`select public.${name}(${Object.keys(params).map((key,i)=>`${key}=>$${i+1}`).join(',')}) result`,Object.values(params))).rows[0].result;
  const transport=async(url,options)=>{assert.equal(options.cache,'no-store');assert.equal(options.redirect,'error');return Response.json(await rpc(new URL(url).pathname.split('/').at(-1),JSON.parse(options.body)));};
  const store=new SupabaseInquiryStore({url:'https://abcdefghijklmnopqrst.supabase.co',secret:'sb_secret_synthetic'},transport);
  await t.test('RLS and PUBLIC execute remain closed for sessions and deletion audit',async()=>{
    assert.ok((await db.query("select relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='website_private' and c.relkind='r'")).rows.every(row=>row.relrowsecurity));
    assert.ok((await db.query("select prosecdef from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and proname like '%website%'")).rows.every(row=>!row.prosecdef));
    for(const role of ['anon','authenticated']){await db.exec(`set role ${role}`);try{for(const sql of ["select * from website_private.company_sessions","select * from website_private.maintenance_runs",`select public.read_website_company_session('${'a'.repeat(64)}')`,`select public.start_website_inquiry_purge('${randomUUID()}','${actor}')`,`select public.execute_website_inquiry_purge('${randomUUID()}')`])await assert.rejects(db.query(sql),/permission denied/);}finally{await db.exec('reset role');}}
  });
  await db.exec('set role service_role');
  await t.test('only encrypted session payloads/hash IDs are stored; expiration bound/read/logout work',async()=>{
    const hash='a'.repeat(64),session={subject:actor,accessToken:'synthetic-central-token',expiresAt:Date.now()+60_000},payload=sealCompanyData(session,randomBytes(32).toString('hex'),'session');
    await store.storeSession(hash,actor,payload,session.expiresAt);assert.equal(await store.readSession(hash),payload);assert.doesNotMatch(payload,/synthetic-central-token/);
    await assert.rejects(store.storeSession('b'.repeat(64),actor,payload,Date.now()+7200000));
    await store.deleteSession(hash);assert.equal(await store.readSession(hash),null);
  });
  await t.test('purge returns persisted counts, preserves fresh rows and repeated same run does not execute again',async()=>{
    await store.updatePrivacyContact(policy.contact,0,actor);await store.save({...stored(),policy:{...policy,version:policy.version+'.contact-1'}});
    await db.exec("reset role;with fixed as(select clock_timestamp() t)update website_private.inquiries set created_at=fixed.t-interval '91 days',expires_at=fixed.t-interval '1 day' from fixed;set role service_role;");
    const runId=randomUUID();await store.startPurgeRun(runId,actor);const result=await store.executePurgeRun(runId);assert.equal(result.state,'succeeded');assert.equal(result.counts.inquiriesDeleted,1);assert.deepEqual(await store.executePurgeRun(runId),result);assert.equal((await store.privacySetting()).email,policy.contact);
  });
  await t.test('database delete fault rolls back inquiry removal and commits safe failure audit',async()=>{
    await store.save({...stored(),policy:{...policy,version:policy.version+'.contact-1'}});
    await db.exec("reset role;with fixed as(select clock_timestamp() t)update website_private.inquiries set created_at=fixed.t-interval '91 days',expires_at=fixed.t-interval '1 day' from fixed;create function website_private.fixture_purge_fault() returns trigger language plpgsql as $$begin raise exception 'visitor@example.invalid private-detail';end$$;create trigger fixture_purge_fault before delete on website_private.inquiries for each row execute function website_private.fixture_purge_fault();set role service_role;");
    const runId=randomUUID();await store.startPurgeRun(runId,actor);const result=await store.executePurgeRun(runId);assert.deepEqual(result,{runId,state:'failed',reason:'database_failure'});
    assert.equal((await db.query('select count(*) count from website_private.inquiries')).rows[0].count,1);assert.equal((await db.query('select state from website_private.maintenance_runs where run_id=$1',[runId])).rows[0].state,'failed');assert.doesNotMatch(JSON.stringify(result),/visitor@example|private-detail/);
  });
});
