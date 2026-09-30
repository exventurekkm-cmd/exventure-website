-- Review-only. Run after website_inquiry_intake, first on an approved isolated test project.
-- No OAuth client, key, account/site grant, cron job, or deletion schedule is created.
begin;
create table website_private.company_sessions (
  hash text primary key check (hash ~ '^[a-f0-9]{64}$'),
  account_id uuid not null,
  payload text not null check (length(payload) between 29 and 32000 and payload ~ '^[A-Za-z0-9_-]+$'),
  created_at timestamptz not null default clock_timestamp(),
  expires_at timestamptz not null check (expires_at > created_at and expires_at <= created_at + interval '1 hour')
);
create index website_company_sessions_expiry on website_private.company_sessions(expires_at);
create table website_private.maintenance_runs (
  run_id uuid primary key, actor_id uuid not null,
  started_at timestamptz not null default clock_timestamp(), finished_at timestamptz,
  state text not null default 'started' check (state in ('started','succeeded','failed')),
  result jsonb,
  check ((state='started' and finished_at is null and result is null) or (state<>'started' and finished_at is not null and jsonb_typeof(result)='object'))
);
create index website_maintenance_started on website_private.maintenance_runs(started_at);
alter table website_private.company_sessions enable row level security;
alter table website_private.maintenance_runs enable row level security;
revoke all on website_private.company_sessions, website_private.maintenance_runs from public,anon,authenticated;
grant select,insert,delete on website_private.company_sessions to service_role;
grant select,insert,update,delete on website_private.maintenance_runs to service_role;

create function public.store_website_company_session(p_hash text,p_account_id uuid,p_payload text,p_expires_at timestamptz) returns void
language plpgsql security invoker set search_path = '' as $$
begin
  if p_hash is null or p_hash !~ '^[a-f0-9]{64}$' or p_account_id is null or p_payload is null or length(p_payload) not between 29 and 32000 or p_payload !~ '^[A-Za-z0-9_-]+$' or p_expires_at is null or p_expires_at <= clock_timestamp() or p_expires_at > clock_timestamp()+interval '1 hour' then raise invalid_parameter_value; end if;
  delete from website_private.company_sessions where expires_at <= clock_timestamp();
  insert into website_private.company_sessions(hash,account_id,payload,expires_at) values(p_hash,p_account_id,p_payload,p_expires_at);
end $$;
create function public.read_website_company_session(p_hash text) returns jsonb
language sql stable security invoker set search_path = '' as $$
  select to_jsonb(payload) from website_private.company_sessions where hash=p_hash and expires_at>clock_timestamp();
$$;
create function public.delete_website_company_session(p_hash text) returns void
language plpgsql security invoker set search_path = '' as $$
begin
  if p_hash is null or p_hash !~ '^[a-f0-9]{64}$' then raise invalid_parameter_value; end if;
  delete from website_private.company_sessions where hash=p_hash;
end $$;

-- Persist the intention before executing deletion. Only run IDs / counts / fixed failure codes are recorded.
create function public.start_website_inquiry_purge(p_run_id uuid,p_actor_id uuid) returns void
language plpgsql security invoker set search_path = '' as $$
begin
  if p_run_id is null or p_actor_id is null then raise invalid_parameter_value; end if;
  insert into website_private.maintenance_runs(run_id,actor_id) values(p_run_id,p_actor_id);
end $$;
create function public.execute_website_inquiry_purge(p_run_id uuid) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare v_run website_private.maintenance_runs; v_counts jsonb; v_sessions bigint; v_result jsonb;
begin
  if p_run_id is null then raise invalid_parameter_value; end if;
  select * into strict v_run from website_private.maintenance_runs where run_id=p_run_id for update;
  if v_run.state <> 'started' then return v_run.result; end if;
  begin
    perform pg_advisory_xact_lock(hashtextextended('website_inquiry_intake_lock',0));
    -- Cutoff uses the database clock only. No caller-provided dates, IDs, or retention override.
    v_counts := public.purge_expired_website_inquiries();
    delete from website_private.company_sessions where expires_at<=clock_timestamp();
    get diagnostics v_sessions = row_count;
    v_result := jsonb_build_object('runId',p_run_id,'state','succeeded','counts',v_counts||jsonb_build_object('sessionsDeleted',v_sessions));
    update website_private.maintenance_runs set state='succeeded',finished_at=clock_timestamp(),result=v_result where run_id=p_run_id;
    delete from website_private.maintenance_runs where run_id<>p_run_id and state<>'started' and started_at<clock_timestamp()-interval '90 days';
  exception when others then
    -- The subtransaction rolls back all deletions before recording failure. Do not retain SQL/error detail.
    v_result := jsonb_build_object('runId',p_run_id,'state','failed','reason','database_failure');
    update website_private.maintenance_runs set state='failed',finished_at=clock_timestamp(),result=v_result where run_id=p_run_id;
  end;
  return v_result;
end $$;
revoke all on function public.store_website_company_session(text,uuid,text,timestamptz) from public,anon,authenticated;
revoke all on function public.read_website_company_session(text) from public,anon,authenticated;
revoke all on function public.delete_website_company_session(text) from public,anon,authenticated;
revoke all on function public.start_website_inquiry_purge(uuid,uuid) from public,anon,authenticated;
revoke all on function public.execute_website_inquiry_purge(uuid) from public,anon,authenticated;
grant execute on function public.store_website_company_session(text,uuid,text,timestamptz) to service_role;
grant execute on function public.read_website_company_session(text) to service_role;
grant execute on function public.delete_website_company_session(text) to service_role;
grant execute on function public.start_website_inquiry_purge(uuid,uuid) to service_role;
grant execute on function public.execute_website_inquiry_purge(uuid) to service_role;
commit;
