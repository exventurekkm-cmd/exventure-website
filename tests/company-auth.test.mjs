import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep, basename } from 'node:path';
import { generateKeyPair, exportJWK, SignJWT } from 'jose';
import * as oidc from 'openid-client';
import { readCompanyConfig } from '../src/lib/company/config.ts';
import { companyIssuer, companyPortal, loginCookie, sessionCookie, sealCompanyData, openCompanyData, sessionHash } from '../src/lib/company/contract.ts';
import { discoverCompanyClient } from '../src/lib/company/oidc.ts';
import { handleCompanyStart, handleCompanyCallback, handleCompanyLogout } from '../src/lib/company/http.ts';
import { authorizeWebsiteSession } from '../src/lib/company/session.ts';
import { LocalInquiryStore } from '../src/lib/inquiries/local-store.ts';
import { handlePrivacySettingRequest, handleCompleteInquiryRequest } from '../src/lib/inquiries/admin-http.ts';
import { localIntegration } from '../src/lib/local-integration.ts';

const actor = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', other = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const origin = 'https://website.example.invalid', clientId = 'ephemeral-fixture-client';
const config = () => ({ origin, issuer: companyIssuer, portal: companyPortal, clientId, key: randomBytes(32).toString('hex'), approvedAccountId: actor });
const cookiePair = value => value.split(';')[0];
const callback = (authorization, header) => new Request(`${authorization.searchParams.get('redirect_uri')}?code=synthetic-one-use-code&state=${authorization.searchParams.get('state')}`, { headers: { cookie: header, ...(authorization.searchParams.get('redirect_uri').startsWith(localIntegration.origin)?{host:'127.0.0.1:3003'}:{}) } });
const mutation = (path, body, cookie, requestOrigin = origin) => new Request(`${origin}${path}`, { method: 'POST', headers: { origin: requestOrigin, 'content-type': 'application/json', cookie }, body: JSON.stringify(body) });

async function fixture(t, local = false, metadataOverrides = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'exv-company-')), file = join(dir, 'test.sqlite');
  const store = new LocalInquiryStore(file), cfg = local ? { ...config(), origin:localIntegration.origin, issuer:localIntegration.issuer, portal:localIntegration.portal, localIntegration:true } : config();
  t.after(() => { store.close(); const target = resolve(dir); assert.ok(target.startsWith(resolve(tmpdir()) + sep) && basename(target).startsWith('exv-company-')); rmSync(target, { recursive: true, force: true }); });
  const pair = await generateKeyPair('ES256'), wrongPair = await generateKeyPair('ES256');
  const jwk = { ...await exportJWK(pair.publicKey), kid: 'ephemeral-key', alg: 'ES256', use: 'sig' };
  const metadata = { issuer: cfg.issuer, authorization_endpoint: `${cfg.issuer}/oauth/authorize`, token_endpoint: `${cfg.issuer}/oauth/token`, jwks_uri: `${cfg.issuer}/.well-known/jwks.json`, response_types_supported: ['code'], subject_types_supported: ['public'], id_token_signing_alg_values_supported: ['ES256'], token_endpoint_auth_methods_supported: ['none'], code_challenge_methods_supported: ['S256'], ...metadataOverrides };
  let authorization, variant = {}, access = { active: true, account_id: actor, application_id: 'exventure-website', role: 'admin' };
  const stats = { exchanges: 0, permissionChecks: 0 }, events = [];
  const transport = async (url, options) => {
    if (url === `${cfg.issuer}/.well-known/openid-configuration`) return Response.json(metadata);
    if (url === metadata.jwks_uri) return Response.json({ keys: [jwk] });
    assert.equal(url, metadata.token_endpoint); stats.exchanges++;
    const body = options.body;
    assert.equal(body.get('client_id'), clientId); assert.equal(body.get('redirect_uri'), `${cfg.origin}/auth/company/callback`);
    assert.equal(body.get('grant_type'), 'authorization_code'); assert.equal(body.get('code'), 'synthetic-one-use-code');
    assert.equal(body.has('client_secret'), false);
    if (await oidc.calculatePKCECodeChallenge(body.get('code_verifier')) !== authorization.searchParams.get('code_challenge')) return Response.json({ error: 'invalid_grant' }, { status: 400 });
    const claims = { iss: cfg.issuer, sub: actor, aud: clientId, nonce: authorization.searchParams.get('nonce'), iat: Math.floor(Date.now()/1000), exp: Math.floor(Date.now()/1000)+600, ...variant.claims };
    const alg = variant.wrongAlgorithm ? 'HS256' : 'ES256', key = variant.wrongAlgorithm ? randomBytes(32) : variant.badSignature ? wrongPair.privateKey : pair.privateKey;
    const idToken = await new SignJWT(claims).setProtectedHeader({ alg, kid: 'ephemeral-key' }).sign(key);
    return Response.json({ access_token: 'synthetic-central-token', token_type: 'Bearer', expires_in: variant.expiresIn ?? 3600, ...(variant.missingIdToken ? {} : { id_token: idToken }) });
  };
  const fetcher = async (url, options) => {
    stats.permissionChecks++;
    assert.equal(url, `${cfg.portal}/api/identity/access?application=exventure-website`);
    assert.equal(options.cache, 'no-store'); assert.equal(options.redirect, 'error');
    assert.equal(options.headers.Authorization, 'Bearer synthetic-central-token');
    if (access instanceof Error) throw access;
    return Response.json(access);
  };
  let client;
  const deps = { config: cfg, store, client: () => client ??= discoverCompanyClient(clientId, transport, cfg.issuer,local), fetcher, log: event => events.push(event) };
  async function start() {
    const response = await handleCompanyStart(new Request(`${cfg.origin}/auth/company/start?next=https://untrusted.example.invalid`,local?{headers:{host:'127.0.0.1:3003'}}:{}), deps);
    assert.equal(response.status, 303);
    authorization = new URL(response.headers.get('location'));
    assert.equal(authorization.origin, new URL(cfg.issuer).origin);
    assert.equal(authorization.searchParams.get('code_challenge_method'), 'S256');
    assert.equal(authorization.searchParams.get('redirect_uri'), `${cfg.origin}/auth/company/callback`);
    assert.equal(authorization.searchParams.get('scope'), 'openid email profile');
    const setCookie = response.headers.getSetCookie()[0]; assert.match(setCookie, local?/HttpOnly; SameSite=Lax/:/HttpOnly; Secure; SameSite=Lax/); assert.match(setCookie, /Path=\/auth\/company; Max-Age=600/);
    return { response, header: cookiePair(setCookie), authorization };
  }
  return { cfg, store, deps, events, stats, fetcher, start, setVariant: value => variant = value, setAccess: value => access = value };
}

test('company setup has no default credentials, grant, hosted fixture, or HTTP downgrade', () => {
  assert.equal(readCompanyConfig({}), null);
  const env = { WEBSITE_INQUIRY_MODE: 'disabled', WEBSITE_INQUIRY_ORIGIN: origin, WEBSITE_INQUIRY_DB_ENVIRONMENT: 'test', WEBSITE_INQUIRY_DB_URL: 'https://abcdefghijklmnopqrst.supabase.co', WEBSITE_INQUIRY_TEST_PROJECT_REF: 'abcdefghijklmnopqrst', WEBSITE_INQUIRY_DB_SECRET_KEY: 'sb_secret_synthetic', WEBSITE_COMPANY_SSO_ENABLED: 'true', WEBSITE_COMPANY_AUTH_PROVISIONED: 'true', WEBSITE_COMPANY_OIDC_CLIENT_ID: clientId, WEBSITE_COMPANY_SESSION_KEY: randomBytes(32).toString('hex'), WEBSITE_COMPANY_ADMIN_ACCOUNT_ID: actor, VERCEL_ENV: 'preview' };
  assert.equal(readCompanyConfig(env),null);
  Object.assign(env,{ WEBSITE_COMPANY_TEST_PROJECT_REF:'qrstuvwxyzabcdefghij',WEBSITE_COMPANY_TEST_PORTAL_ORIGIN:'https://accounts-test.example.invalid' });
  assert.ok(readCompanyConfig(env)); // Administrator setup can run while public collection stays disabled.
  for (const change of [{ WEBSITE_COMPANY_AUTH_PROVISIONED: 'false' }, { WEBSITE_COMPANY_SESSION_KEY: '' }, { WEBSITE_COMPANY_ADMIN_ACCOUNT_ID: other.replace('b','x') }, { WEBSITE_INQUIRY_ORIGIN: 'http://127.0.0.1:3003' }, { WEBSITE_INQUIRY_MODE: 'local-test' }, { WEBSITE_INQUIRY_DB_URL: 'https://yyoyeyvgpfybsjpgaouv.supabase.co' }, { WEBSITE_COMPANY_TEST_PROJECT_REF:'gszfrbzvketspsipcitj' }, { WEBSITE_COMPANY_TEST_PORTAL_ORIGIN:companyPortal }, { WEBSITE_COMPANY_TEST_PORTAL_ORIGIN:'http://127.0.0.1:3002' }]) assert.equal(readCompanyConfig({ ...env, ...change }), null);
  assert.equal(readCompanyConfig(env).issuer,'https://qrstuvwxyzabcdefghij.supabase.co/auth/v1');
});
test('AES-GCM purpose binding, expiry and corruption protect login/session data', () => {
  const cfg = config(), data = { accessToken: 'synthetic-hidden-token', subject: actor, expiresAt: Date.now()+60_000 };
  const sealed = sealCompanyData(data, cfg.key, 'session');
  assert.doesNotMatch(sealed, /synthetic-hidden-token/); assert.deepEqual(openCompanyData(sealed,cfg.key,'session'),data);
  assert.throws(() => openCompanyData(sealed,cfg.key,'login')); assert.throws(() => openCompanyData(sealed,randomBytes(32).toString('hex'),'session'));
  const bytes=Buffer.from(sealed,'base64url'); bytes[bytes.length-1]^=1; assert.throws(() => openCompanyData(bytes.toString('base64url'),cfg.key,'session'));
  assert.throws(() => openCompanyData(sealed,cfg.key,'session',data.expiresAt));
});
test('verified login stores an encrypted server session; every protected mutation rechecks permission and revocation deletes the session', async t => {
  const f=await fixture(t), start=await f.start();
  const response=await handleCompanyCallback(callback(start.authorization,start.header),f.deps);
  assert.equal(response.headers.get('location'), `${origin}/admin/inquiries`);
  const cookies=response.headers.getSetCookie(); assert.equal(cookies.length,2); assert.match(cookies[0],/Max-Age=0/);
  const session=cookiePair(cookies[1]), id=session.split('=')[1]; assert.match(id,/^[a-f0-9]{64}$/); assert.doesNotMatch(JSON.stringify(cookies),/synthetic-central-token/);
  const encrypted=await f.store.readSession(sessionHash(id)); assert.ok(encrypted); assert.doesNotMatch(encrypted,/synthetic-central-token/);
  assert.equal((await authorizeWebsiteSession(session,f.cfg,f.store,f.fetcher)).subject,actor);
  const auth=await authorizeWebsiteSession(session,f.cfg,f.store,f.fetcher);
  const context={ store:f.store,actorId:auth.subject,origin };
  assert.equal((await handlePrivacySettingRequest(mutation('/api/admin/inquiries/settings',{ email:'privacy@example.invalid',version:0 },session),context)).status,200);
  f.setAccess({ active:true,account_id:actor,application_id:'exventure-website',role:'viewer',company_admin:true });
  assert.equal(await authorizeWebsiteSession(session,f.cfg,f.store,f.fetcher),null);
  assert.equal(await f.store.readSession(sessionHash(id)),null);
  assert.equal((await handlePrivacySettingRequest(mutation('/api/admin/inquiries/settings',{email:'changed@example.invalid',version:1},session),null)).status,403);
  assert.equal((await f.store.privacySetting()).email,'privacy@example.invalid');
  assert.equal((await handleCompleteInquiryRequest(mutation('/api/admin/inquiries/EXV-20260930-000000000000/complete',{},session),'EXV-20260930-000000000000',null)).status,403);
  assert.equal(f.stats.permissionChecks,4);
});
test('real ES256 verifier rejects invalid issuer/audience/nonce/expiry/signature/algorithm and malformed token claims', async t => {
  for (const [label,variant] of [ ['issuer',{claims:{iss:'https://untrusted.example.invalid'}}], ['audience',{claims:{aud:'other-client'}}], ['nonce',{claims:{nonce:'different'}}], ['expiry',{claims:{exp:Math.floor(Date.now()/1000)-120}}], ['signature',{badSignature:true}], ['algorithm',{wrongAlgorithm:true}], ['missing ID token',{missingIdToken:true}], ['subject',{claims:{sub:'invalid-subject'}}], ['short session',{expiresIn:10}] ]) await t.test(label, async st => {
    const f=await fixture(st); f.setVariant(variant); const start=await f.start(), response=await handleCompanyCallback(callback(start.authorization,start.header),f.deps);
    assert.equal(response.headers.get('location'),`${origin}/admin/login?status=invalid`);
    assert.equal(response.headers.getSetCookie().length,1); assert.equal(f.stats.permissionChecks,0);
    assert.doesNotMatch(JSON.stringify(f.events),/synthetic-central-token|code=/);
  });
});
test('state, duplicate parameters, missing/expired cookie, cancellation and PKCE failure never issue a session', async t => {
  for (const label of ['wrong state','duplicate state','duplicate code','missing cookie','duplicate cookie','expired attempt','cancelled','wrong PKCE']) await t.test(label,async st => {
    const f=await fixture(st), start=await f.start(); let header=start.header, url=new URL(callback(start.authorization,header).url);
    if(label==='wrong state')url.searchParams.set('state','wrong');
    if(label==='duplicate state')url.searchParams.append('state',url.searchParams.get('state'));
    if(label==='duplicate code')url.searchParams.append('code','extra');
    if(label==='missing cookie')header='';
    if(label==='duplicate cookie')header+='; '+header;
    if(label==='cancelled')url.searchParams.set('error','access_denied');
    if(label==='expired attempt'||label==='wrong PKCE') {
      const attempt=openCompanyData(header.split('=')[1],f.cfg.key,'login');
      if(label==='expired attempt')attempt.expiresAt=Date.now()-1; else attempt.verifier=oidc.randomPKCECodeVerifier();
      header=`${loginCookie}=${sealCompanyData(attempt,f.cfg.key,'login')}`;
    }
    const response=await handleCompanyCallback(new Request(url,{headers:{cookie:header}}),f.deps);
    assert.equal(response.headers.get('location'),`${origin}/admin/login?status=invalid`); assert.equal(response.headers.getSetCookie().length,1);
    assert.equal(f.stats.permissionChecks,0); assert.equal(f.stats.exchanges,label==='wrong PKCE'?1:0);
  });
});
test('website role/account/site mismatch, inactive account and unavailable central service fail closed', async t => {
  const base={ active:true,account_id:actor,application_id:'exventure-website',role:'admin' };
  for(const [label,access] of [['viewer',{...base,role:'viewer',company_admin:true}],['wrong account',{...base,account_id:other}],['wrong site',{...base,application_id:'exventure-research'}],['inactive',{...base,active:false}],['unavailable',new Error('synthetic-token-must-not-be-logged')]])await t.test(label,async st=>{
    const f=await fixture(st);f.setAccess(access);const start=await f.start();const response=await handleCompanyCallback(callback(start.authorization,start.header),f.deps);
    assert.equal(response.headers.get('location'),`${origin}/admin/login?status=denied`);assert.equal(response.headers.getSetCookie().length,1);
    assert.doesNotMatch(JSON.stringify(f.events),/synthetic-token|synthetic-central-token/);
  });
});
test('server storage failure cannot issue a browser session or disclose tokens; callback rejects another origin',async t=>{
  const f=await fixture(t),start=await f.start(); const failed={...f.deps,store:{storeSession:async()=>{throw new Error('synthetic-central-token');}}};
  const response=await handleCompanyCallback(callback(start.authorization,start.header),failed);
  assert.equal(response.headers.get('location'),`${origin}/admin/login?status=unavailable`);assert.equal(response.headers.getSetCookie().length,1);
  const offOrigin=new Request(callback(start.authorization,start.header).url.replace(origin,'https://other.example.invalid'),{headers:{cookie:start.header}});
  assert.equal((await handleCompanyCallback(offOrigin,f.deps)).status,400);assert.doesNotMatch(JSON.stringify(f.events),/synthetic-central-token/);
});
test('logout requires same-origin POST and removes the server session before clearing cookies',async t=>{
  const f=await fixture(t),start=await f.start();const response=await handleCompanyCallback(callback(start.authorization,start.header),f.deps);
  const session=cookiePair(response.headers.getSetCookie()[1]),hash=sessionHash(session.split('=')[1]);
  assert.equal((await handleCompanyLogout(mutation('/auth/company/logout',{},session,'https://other.example.invalid'),f.deps)).status,403);
  assert.ok(await f.store.readSession(hash));
  const result=await handleCompanyLogout(mutation('/auth/company/logout',{},session),f.deps);
  assert.equal(result.status,200);assert.equal(await f.store.readSession(hash),null);assert.ok(result.headers.getSetCookie().every(value=>value.includes('Max-Age=0')));
  assert.equal(await authorizeWebsiteSession(session,f.cfg,f.store,f.fetcher),null);
});
test('invalid/duplicate cookies, expired server sessions and central HTTP denial cannot access protected data',async t=>{
  const f=await fixture(t),start=await f.start();const response=await handleCompanyCallback(callback(start.authorization,start.header),f.deps);
  const session=cookiePair(response.headers.getSetCookie()[1]);
  for(const cookie of [null,'',`${session}; ${session}`,`${sessionCookie}=not-a-session-id`])assert.equal(await authorizeWebsiteSession(cookie,f.cfg,f.store,f.fetcher),null);
  assert.equal(await authorizeWebsiteSession(session,f.cfg,f.store,async()=>new Response(null,{status:403})),null);
  assert.equal(await f.store.readSession(sessionHash(session.split('=')[1])),null);
  const id=randomBytes(32).toString('hex'),expiresAt=Date.now()+100;
  await f.store.storeSession(sessionHash(id),actor,sealCompanyData({subject:actor,accessToken:'synthetic-central-token',expiresAt},f.cfg.key,'session'),expiresAt);
  await new Promise(resolve=>setTimeout(resolve,120));
  assert.equal(await authorizeWebsiteSession(`${sessionCookie}=${id}`,f.cfg,f.store,f.fetcher),null);
});
test('explicit local OAuth keeps PKCE and ES256 verification, canonicalizes only Next internal URL and rechecks/revokes site permission',async t=>{
  const f=await fixture(t,true),start=await f.start();
  assert.equal(start.authorization.searchParams.get('redirect_uri'),'http://127.0.0.1:3003/auth/company/callback');
  const req=callback(start.authorization,start.header);
  const response=await handleCompanyCallback(new Request(req.url.replace('http://127.0.0.1:3003','http://localhost:3003'),{headers:req.headers}),f.deps);
  assert.equal(response.headers.get('location'),`${localIntegration.origin}/admin/inquiries`);
  assert.ok(response.headers.getSetCookie().every(value=>!value.includes('; Secure')));assert.ok(response.headers.getSetCookie().every(value=>value.includes('HttpOnly')&&value.includes('SameSite=Lax')));
  const session=cookiePair(response.headers.getSetCookie()[1]);assert.equal((await authorizeWebsiteSession(session,f.cfg,f.store,f.fetcher)).subject,actor);
  f.setAccess({active:true,account_id:actor,application_id:'exventure-website',role:'viewer',company_admin:true});
  assert.equal(await authorizeWebsiteSession(session,f.cfg,f.store,f.fetcher),null);assert.equal(await f.store.readSession(sessionHash(session.split('=')[1])),null);
});
test('local HTTP never relaxes issuer/audience/nonce/state/PKCE/signature/expiry validation',async t=>{
  for(const [label,variant] of [['issuer',{claims:{iss:companyIssuer}}],['audience',{claims:{aud:'other-client'}}],['nonce',{claims:{nonce:'wrong'}}],['signature',{badSignature:true}],['algorithm',{wrongAlgorithm:true}],['expired',{claims:{exp:Math.floor(Date.now()/1000)-120}}]])await t.test(label,async st=>{
    const f=await fixture(st,true);f.setVariant(variant);const start=await f.start(),response=await handleCompanyCallback(callback(start.authorization,start.header),f.deps);
    assert.equal(response.headers.get('location'),`${localIntegration.origin}/admin/login?status=invalid`);assert.equal(f.stats.permissionChecks,0);assert.equal(response.headers.getSetCookie().length,1);
  });
  for(const label of ['state','PKCE'])await t.test(label,async st=>{
    const f=await fixture(st,true),start=await f.start();let req=callback(start.authorization,start.header);
    if(label==='state'){const url=new URL(req.url);url.searchParams.set('state','wrong');req=new Request(url,{headers:req.headers});}
    else{const attempt=openCompanyData(start.header.split('=')[1],f.cfg.key,'login');attempt.verifier=oidc.randomPKCECodeVerifier();req=new Request(req.url,{headers:{host:'127.0.0.1:3003',cookie:`${loginCookie}=${sealCompanyData(attempt,f.cfg.key,'login')}`}});}
    assert.equal((await handleCompanyCallback(req,f.deps)).headers.get('location'),`${localIntegration.origin}/admin/login?status=invalid`);assert.equal(f.stats.permissionChecks,0);
  });
});
test('local discovery rejects external/localhost/wrong-port metadata before any token or JWKS request',async t=>{
  for(const [label,metadata] of [['external authorize',{authorization_endpoint:'https://untrusted.example.invalid/authorize'}],['localhost token',{token_endpoint:'http://localhost:58421/auth/v1/oauth/token'}],['wrong-port token',{token_endpoint:'http://127.0.0.1:58422/auth/v1/oauth/token'}],['external JWKS',{jwks_uri:'https://untrusted.example.invalid/keys'}],['wrong issuer',{issuer:companyIssuer}],['HS256 only',{id_token_signing_alg_values_supported:['HS256']}]])await t.test(label,async st=>{
    const f=await fixture(st,true,metadata);const response=await handleCompanyStart(new Request(`${localIntegration.origin}/auth/company/start`,{headers:{host:'127.0.0.1:3003'}}),f.deps);
    assert.equal(response.headers.get('location'),`${localIntegration.origin}/admin/login?status=unavailable`);assert.equal(f.stats.exchanges,0);assert.equal(f.stats.permissionChecks,0);
  });
  let calls=0;
  await assert.rejects(discoverCompanyClient(clientId,async()=>{calls++;return Response.json({});},localIntegration.issuer,false));assert.equal(calls,0);
  await assert.rejects(discoverCompanyClient(clientId,async()=>{calls++;return Response.json({});},companyIssuer,true));assert.equal(calls,0);
});
test('local auth request rejects a localhost browser Host, another port/host and forwarded-host overrides',async t=>{
  const f=await fixture(t,true);
  for(const [url,headers] of [[`${localIntegration.origin}/auth/company/start`,{host:'localhost:3003'}],['http://127.0.0.1:3004/auth/company/start',{host:'127.0.0.1:3003'}],['http://other.example.invalid:3003/auth/company/start',{host:'127.0.0.1:3003'}],[`${localIntegration.origin}/auth/company/start`,{host:'other.example.invalid', 'x-forwarded-host':'127.0.0.1:3003'}],[`${localIntegration.origin}/auth/company/start`,{host:'127.0.0.1:3003',origin:'http://localhost:3003'}]])assert.equal((await handleCompanyStart(new Request(url,{headers}),f.deps)).status,400);
  assert.equal(f.stats.exchanges,0);assert.equal(f.stats.permissionChecks,0);
});

test('local OAuth transport rejects discovery redirects before another endpoint is requested',async()=>{
  let calls=0;
  await assert.rejects(discoverCompanyClient(clientId,async(url,options)=>{
    calls++;assert.equal(url,`${localIntegration.issuer}/.well-known/openid-configuration`);assert.equal(options.redirect,'manual');
    return new Response(null,{status:302,headers:{location:'https://untrusted.example.invalid/keys'}});
  },localIntegration.issuer,true));
  assert.equal(calls,1);
});
