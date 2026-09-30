-- Review-only migration. Not applied to any remote project.
-- Central identity/permissions and the business schemas are not changed here.
begin;

create schema website_private;
revoke all on schema website_private from public, anon, authenticated;
grant usage on schema website_private to service_role;

create table website_private.inquiries (
  request_id uuid primary key,
  reference text not null unique check (reference ~ '^EXV-[0-9]{8}-[A-F0-9]{12}$'),
  payload_hash text not null check (payload_hash ~ '^[a-f0-9]{64}$'),
  name text not null check (length(btrim(name)) between 1 and 80 and name !~ '[[:cntrl:]]'),
  email text not null check (length(email) <= 254 and email ~ '^[^[:space:]@[:cntrl:]]+@[^[:space:]@[:cntrl:]]+\.[^[:space:]@[:cntrl:]]+$'),
  organization text not null default '' check (length(organization) <= 120 and organization !~ '[[:cntrl:]]'),
  organization_consent boolean not null,
  kind text not null check (kind in ('business','research','partnership','other')),
  message text not null check (length(btrim(message)) between 10 and 3000),
  policy_snapshot jsonb not null check (jsonb_typeof(policy_snapshot) = 'object'),
  created_at timestamptz not null,
  expires_at timestamptz not null check (expires_at > created_at and expires_at <= created_at + interval '90 days'),
  status text not null default 'received' check (status = 'received'),
  notification_state text not null default 'not_configured' check (notification_state = 'not_configured'),
  check (organization_consent or organization = '')
);
create index inquiries_expiry on website_private.inquiries(expires_at);
create index inquiries_created on website_private.inquiries(created_at desc);

create table website_private.inquiry_rate_limits (
  key text not null check (key = 'global' or key ~ '^(ip|email):[a-f0-9]{64}$'),
  window_start timestamptz not null,
  count integer not null check (count > 0),
  expires_at timestamptz not null check (expires_at > window_start and expires_at <= window_start + interval '1 hour'),
  primary key (key, window_start)
);
create index inquiry_rate_expiry on website_private.inquiry_rate_limits(expires_at);

create table website_private.settings (
  id boolean primary key default true check (id),
  privacy_contact_email text not null default '',
  version bigint not null default 0 check (version >= 0),
  check (privacy_contact_email = '' or (length(privacy_contact_email) <= 254 and privacy_contact_email ~ '^[^[:space:]@[:cntrl:]]+@[^[:space:]@[:cntrl:]]+\.[^[:space:]@[:cntrl:]]+$'))
);
insert into website_private.settings(id) values(true);
create table website_private.setting_events (
  id bigint generated always as identity primary key,
  setting_name text not null default 'privacy_contact_email' check (setting_name = 'privacy_contact_email'),
  actor_id uuid not null,
  previous_email text not null,
  email text not null,
  version bigint not null,
  created_at timestamptz not null default clock_timestamp()
);
create index setting_events_created on website_private.setting_events(created_at);

alter table website_private.inquiries enable row level security;
alter table website_private.inquiry_rate_limits enable row level security;
alter table website_private.settings enable row level security;
alter table website_private.setting_events enable row level security;
revoke all on all tables in schema website_private from public, anon, authenticated;
revoke all on all sequences in schema website_private from public, anon, authenticated;
grant select, insert, delete on website_private.inquiries to service_role;
grant select, insert, update, delete on website_private.inquiry_rate_limits to service_role;
grant select, update on website_private.settings to service_role;
grant select, insert, delete on website_private.setting_events to service_role;
grant usage on sequence website_private.setting_events_id_seq to service_role;

create function public.purge_expired_website_inquiries() returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare v_inquiries bigint; v_rates bigint; v_events bigint;
begin
  delete from website_private.inquiries where expires_at <= clock_timestamp();
  get diagnostics v_inquiries = row_count;
  delete from website_private.inquiry_rate_limits where expires_at <= clock_timestamp();
  get diagnostics v_rates = row_count;
  delete from website_private.setting_events where created_at < clock_timestamp() - interval '90 days';
  get diagnostics v_events = row_count;
  return jsonb_build_object('inquiriesDeleted',v_inquiries,'rateEntriesDeleted',v_rates,'historyEntriesDeleted',v_events);
end $$;

create function public.website_privacy_setting() returns jsonb
language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object('email',privacy_contact_email,'version',version) from website_private.settings where id;
$$;

create function public.set_website_privacy_contact(p_email text, p_version bigint, p_actor_id uuid) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare v_previous website_private.settings; v_email text := lower(btrim(p_email));
begin
  -- Caller is the website server, after a fresh website-specific admin permission check.
  if p_actor_id is null or p_version is null or p_version < 0 then raise invalid_parameter_value; end if;
  if v_email is null or length(v_email) > 254 or v_email !~ '^[^[:space:]@[:cntrl:]]+@[^[:space:]@[:cntrl:]]+\.[^[:space:]@[:cntrl:]]+$' then return '{"state":"invalid-email"}'::jsonb; end if;
  perform pg_advisory_xact_lock(hashtextextended('website_inquiry_intake_lock',0));
  select * into strict v_previous from website_private.settings where id for update;
  if v_previous.version <> p_version then return '{"state":"conflict"}'::jsonb; end if;
  if v_previous.privacy_contact_email = v_email then return jsonb_build_object('state','saved','setting',jsonb_build_object('email',v_email,'version',v_previous.version)); end if;
  update website_private.settings set privacy_contact_email=v_email, version=version+1 where id;
  insert into website_private.setting_events(actor_id,previous_email,email,version) values(p_actor_id,v_previous.privacy_contact_email,v_email,v_previous.version+1);
  return jsonb_build_object('state','saved','setting',jsonb_build_object('email',v_email,'version',v_previous.version+1));
end $$;

create function public.website_privacy_history() returns jsonb
language sql stable security invoker set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('previousEmail',previous_email,'email',email,'version',version,'actorId',actor_id,'createdAt',to_char(created_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"')) order by version desc),'[]'::jsonb)
  from (select * from website_private.setting_events order by version desc limit 20) events;
$$;

create function public.submit_website_inquiry(p_submission jsonb) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare
  v_now timestamptz := clock_timestamp(); v_request uuid; v_payload text; v_ip text; v_email_hash text;
  v_existing website_private.inquiries; v_policy jsonb; v_days integer; v_setting website_private.settings;
  v_organization text; v_organization_consent boolean; v_reference text;
  v_limit record; v_start timestamptz; v_count integer; v_retry integer := 0;
begin
  if jsonb_typeof(p_submission) is distinct from 'object' then raise invalid_parameter_value; end if;
  v_request := (p_submission->>'request_id')::uuid;
  v_payload := p_submission->>'payload_hash'; v_ip := p_submission->>'ip_hash'; v_email_hash := p_submission->>'email_hash';
  if v_request is null or v_payload is null or v_payload !~ '^[a-f0-9]{64}$' or v_ip is null or v_ip !~ '^[a-f0-9]{64}$' or v_email_hash is null or v_email_hash !~ '^[a-f0-9]{64}$' then raise invalid_parameter_value; end if;
  if jsonb_typeof(p_submission->'organization_consent') is distinct from 'boolean' then raise invalid_parameter_value; end if;
  v_organization_consent := (p_submission->>'organization_consent')::boolean;
  v_organization := case when v_organization_consent then coalesce(p_submission->>'organization','') else '' end;
  v_policy := p_submission->'policy';
  if jsonb_typeof(v_policy) is distinct from 'object' or jsonb_typeof(v_policy->'retentionDays') is distinct from 'number' or (v_policy->>'retentionDays') !~ '^[0-9]{1,2}$' then raise invalid_parameter_value; end if;
  v_days := (v_policy->>'retentionDays')::integer;
  if v_days < 1 or v_days > 90 or coalesce(v_policy->>'version','') !~ '^[a-zA-Z0-9._-]{1,80}$' or length(coalesce(v_policy->>'controller','')) not between 1 and 120 or length(coalesce(v_policy->>'purpose','')) not between 1 and 500 then raise invalid_parameter_value; end if;
  perform pg_advisory_xact_lock(hashtextextended('website_inquiry_intake_lock',0));
  perform public.purge_expired_website_inquiries();
  select * into strict v_setting from website_private.settings where id;
  if v_setting.privacy_contact_email = '' or v_policy->>'contact' is distinct from v_setting.privacy_contact_email or (v_policy->>'version') not like ('%.contact-'||v_setting.version) then return '{"state":"conflict"}'::jsonb; end if;
  select * into v_existing from website_private.inquiries where request_id=v_request;
  if found then
    if v_existing.payload_hash <> v_payload then return '{"state":"conflict"}'::jsonb; end if;
    return jsonb_build_object('state','saved','reference',v_existing.reference);
  end if;
  for v_limit in select * from (values ('ip:'||v_ip,600,5),('email:'||v_email_hash,3600,3),('global',3600,100)) as limits(key,seconds,maximum) loop
    v_start := to_timestamp(floor(extract(epoch from v_now)/v_limit.seconds)*v_limit.seconds);
    select count into v_count from website_private.inquiry_rate_limits where key=v_limit.key and window_start=v_start;
    if coalesce(v_count,0) >= v_limit.maximum then v_retry := greatest(v_retry,ceil(extract(epoch from v_start + make_interval(secs=>v_limit.seconds) - v_now))::integer); end if;
  end loop;
  if v_retry > 0 then return jsonb_build_object('state','rate-limited','retryAfter',v_retry); end if;
  v_reference := 'EXV-'||to_char(v_now at time zone 'UTC','YYYYMMDD')||'-'||upper(left(replace(gen_random_uuid()::text,'-',''),12));
  insert into website_private.inquiries(request_id,reference,payload_hash,name,email,organization,organization_consent,kind,message,policy_snapshot,created_at,expires_at)
  values(v_request,v_reference,v_payload,p_submission->>'name',p_submission->>'email',v_organization,v_organization_consent,p_submission->>'kind',p_submission->>'message',v_policy,v_now,v_now+make_interval(days=>v_days));
  for v_limit in select * from (values ('ip:'||v_ip,600,5),('email:'||v_email_hash,3600,3),('global',3600,100)) as limits(key,seconds,maximum) loop
    v_start := to_timestamp(floor(extract(epoch from v_now)/v_limit.seconds)*v_limit.seconds);
    insert into website_private.inquiry_rate_limits(key,window_start,count,expires_at) values(v_limit.key,v_start,1,v_start+make_interval(secs=>v_limit.seconds))
    on conflict(key,window_start) do update set count=website_private.inquiry_rate_limits.count+1;
  end loop;
  return jsonb_build_object('state','saved','reference',v_reference);
end $$;

create function public.list_website_inquiries() returns jsonb
language sql stable security invoker set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('reference',reference,'name',name,'email',email,'organization',organization,'kind',kind,'message',message,'createdAt',to_char(created_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"')) order by created_at desc,reference desc),'[]'::jsonb)
  from (select * from website_private.inquiries where expires_at>clock_timestamp() order by created_at desc,reference desc limit 50) inquiries;
$$;

create function public.complete_website_inquiry(p_reference text) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare v_count bigint;
begin
  if p_reference is null or p_reference !~ '^EXV-[0-9]{8}-[A-F0-9]{12}$' then raise invalid_parameter_value; end if;
  delete from website_private.inquiries where reference=p_reference;
  get diagnostics v_count = row_count;
  return jsonb_build_object('deleted',v_count>0);
end $$;

-- Functions default to PUBLIC EXECUTE. Revoke that explicitly; no public client gets any DB access.
revoke all on function public.purge_expired_website_inquiries() from public,anon,authenticated;
revoke all on function public.website_privacy_setting() from public,anon,authenticated;
revoke all on function public.set_website_privacy_contact(text,bigint,uuid) from public,anon,authenticated;
revoke all on function public.website_privacy_history() from public,anon,authenticated;
revoke all on function public.submit_website_inquiry(jsonb) from public,anon,authenticated;
revoke all on function public.list_website_inquiries() from public,anon,authenticated;
revoke all on function public.complete_website_inquiry(text) from public,anon,authenticated;
grant execute on function public.purge_expired_website_inquiries() to service_role;
grant execute on function public.website_privacy_setting() to service_role;
grant execute on function public.set_website_privacy_contact(text,bigint,uuid) to service_role;
grant execute on function public.website_privacy_history() to service_role;
grant execute on function public.submit_website_inquiry(jsonb) to service_role;
grant execute on function public.list_website_inquiries() to service_role;
grant execute on function public.complete_website_inquiry(text) to service_role;

-- No pg_cron job, account grant, new login role, Storage bucket, or outbound notification is created.
commit;
