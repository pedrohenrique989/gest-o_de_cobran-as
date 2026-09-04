-- =============================================================================
-- INNOVATIS | GESTÃO DE COBRANÇAS — V0
-- 0001: extensões, enums, tabelas, índices, triggers (auditoria, proteções)
-- =============================================================================
create extension if not exists "pgcrypto";
create extension if not exists "unaccent";
create extension if not exists "pg_trgm";

-- ---------------------------------------------------------------- enums
create type public.app_role       as enum ('viewer', 'operator', 'master_admin');
create type public.project_status as enum ('active', 'backlog', 'lost', 'archived');
create type public.hub_type       as enum ('IFES', 'GOV');
create type public.record_origin  as enum ('google_sheets', 'crm', 'platform', 'future_financial_database');
create type public.sync_state     as enum ('synchronized', 'pending', 'error', 'conflict', 'platform_only');
create type public.source_type    as enum ('google_sheets', 'platform');
create type public.legacy_mapping_target as enum ('stage', 'status', 'ignore');

-- ---------------------------------------------------------------- helpers
-- Normalização para busca: minúsculas, sem acentos, espaços colapsados.
create or replace function public.normalize_text(t text) returns text
language sql immutable strict as $$
  select regexp_replace(lower(public.unaccent(t)), '\s+', ' ', 'g')
$$;

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); new.updated_by = coalesce(auth.uid(), new.updated_by); return new; end $$;

-- ---------------------------------------------------------------- profiles
create table public.profiles (
  user_id              uuid primary key references auth.users(id) on delete cascade,
  full_name            text not null,
  email                text not null unique,
  role                 public.app_role not null default 'viewer',
  active               boolean not null default true,
  must_change_password boolean not null default true,
  legacy_responsible_name text,           -- vínculo com o texto "Responsável" da planilha
  last_login_at        timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  created_by           uuid references auth.users(id),
  updated_by           uuid references auth.users(id)
);

create or replace function public.current_app_role() returns public.app_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where user_id = auth.uid() and active = true
$$;
create or replace function public.is_master_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.current_app_role() = 'master_admin', false)
$$;
create or replace function public.is_active_user() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where user_id = auth.uid() and active)
$$;

-- Provisionamento automático do profile (usuários são criados só pelo Master Admin).
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, full_name, email, role, must_change_password, created_by)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::public.app_role, 'viewer'),
    coalesce((new.raw_user_meta_data->>'must_change_password')::boolean, true),
    nullif(new.raw_user_meta_data->>'created_by', '')::uuid
  );
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Nunca desativar/rebaixar o último Master Admin ativo.
create or replace function public.protect_last_master_admin() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if old.role = 'master_admin' and old.active
     and (new.role <> 'master_admin' or new.active = false)
     and not exists (select 1 from public.profiles where role = 'master_admin' and active and user_id <> old.user_id) then
    raise exception 'Não é permitido desativar ou rebaixar o último Master Admin ativo.';
  end if;
  return new;
end $$;
create trigger profiles_protect_last_master before update on public.profiles
  for each row execute function public.protect_last_master_admin();
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------- catálogos
create table public.project_stage_catalog (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique,                 -- A, B, C, D
  name          text not null,
  display_order int  not null,
  color         text not null default 'neutral',
  active        boolean not null default true
);

create table public.collection_status_catalog (
  id                  uuid primary key default gen_random_uuid(),
  hub                 public.hub_type not null,
  source_label        text not null,                  -- texto exato da planilha
  display_label       text not null,
  display_order       int  not null,
  sla_days            int,
  default_responsible text,
  is_paid             boolean not null default false,
  is_partially_paid   boolean not null default false,
  is_not_applicable   boolean not null default false,
  active              boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (hub, source_label)
);

-- Mapa aba mensal → competência (confirmado pelo Master Admin no setup).
create table public.sheet_competence_map (
  id               uuid primary key default gen_random_uuid(),
  sheet_name       text not null unique,              -- "JUL - A Receber"
  competence_month int  not null check (competence_month between 1 and 12),
  competence_year  int  not null,
  active           boolean not null default true,
  confirmed_at     timestamptz,
  confirmed_by     uuid references auth.users(id)
);

-- Códigos legados fora de A/B/C/D/BACKLOG/PERDIDO (ex.: F).
create table public.legacy_code_mapping (
  id             uuid primary key default gen_random_uuid(),
  legacy_code    text not null unique,
  occurrences    int  not null default 0,
  sample_project text,
  source_sheet   text,
  mapped_to      public.legacy_mapping_target,
  target_value   text,                                -- código da fase ou valor de project_status
  mapped_by      uuid references auth.users(id),
  mapped_at      timestamptz,
  created_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------- projects
create table public.projects (
  id                   uuid primary key default gen_random_uuid(),
  name                 text not null,
  normalized_name      text not null,
  search_text          text not null,
  project_stage_id     uuid references public.project_stage_catalog(id),   -- NULL = pendente de classificação
  stage_pending        boolean not null default false,
  legacy_stage_code    text,                                                 -- texto original (BACKLOG, PERDIDO, F…)
  project_status       public.project_status not null default 'active',
  status_before_archive public.project_status,
  hub                  public.hub_type not null,
  ministry_government  text,
  institute            text,
  foundation           text,
  origin               public.record_origin not null default 'platform',
  provisional          boolean not null default false,
  notes                text,
  active               boolean not null default true,
  created_by           uuid references auth.users(id),
  created_at           timestamptz not null default now(),
  updated_by           uuid references auth.users(id),
  updated_at           timestamptz not null default now(),
  archived_at          timestamptz,
  archived_by          uuid references auth.users(id),
  archive_reason       text
);

create or replace function public.projects_normalize() returns trigger language plpgsql as $$
begin
  new.name := btrim(regexp_replace(new.name, '\s+', ' ', 'g'));
  new.normalized_name := public.normalize_text(new.name);
  new.search_text := public.normalize_text(concat_ws(' ', new.name, new.ministry_government, new.institute, new.foundation));
  return new;
end $$;
create trigger projects_normalize before insert or update on public.projects
  for each row execute function public.projects_normalize();
create trigger projects_updated_at before update on public.projects
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------- receivables
create table public.receivables (
  id                      uuid primary key default gen_random_uuid(),
  project_id              uuid not null references public.projects(id),
  competence              date not null check (competence = date_trunc('month', competence)::date),
  original_competence     date,
  legacy_consolidated     boolean not null default false,   -- Jul/2026 concentra vencidos até Jun/2026
  planned_project         numeric(20,4) not null default 0 check (planned_project >= 0),
  received_project        numeric(20,4) not null default 0 check (received_project >= 0),
  planned_innovatis       numeric(20,4) not null default 0 check (planned_innovatis >= 0),
  received_innovatis      numeric(20,4) not null default 0 check (received_innovatis >= 0),
  financial_due_date      date,
  financial_received_date date,
  invoice_number          text,
  collection_status_id    uuid references public.collection_status_catalog(id),
  reason                  text,
  action                  text,
  responsible_user_id     uuid references public.profiles(user_id),
  responsible_legacy_name text,
  operational_deadline    date,
  flag                    text,
  origin                  public.record_origin not null default 'platform',
  provisional             boolean not null default false,
  source_type             public.source_type not null default 'platform',
  source_sheet_name       text,
  source_top_row          int,
  source_received_row     int,
  source_hash             text,
  source_version          int not null default 1,
  sync_status             public.sync_state not null default 'platform_only',
  sync_error              text,
  active                  boolean not null default true,
  created_at              timestamptz not null default now(),
  created_by              uuid references auth.users(id),
  updated_at              timestamptz not null default now(),
  updated_by              uuid references auth.users(id),
  archived_at             timestamptz,
  archived_by             uuid references auth.users(id),
  archive_reason          text,
  unique (project_id, competence)
);
create trigger receivables_updated_at before update on public.receivables
  for each row execute function public.set_updated_at();

create index receivables_competence_idx  on public.receivables (competence);
create index receivables_project_idx     on public.receivables (project_id);
create index receivables_status_idx      on public.receivables (collection_status_id);
create index receivables_responsible_idx on public.receivables (responsible_user_id);
create index receivables_deadline_idx    on public.receivables (operational_deadline);
create index receivables_active_idx      on public.receivables (active) where active;
create index receivables_provisional_idx on public.receivables (provisional);
create index receivables_sync_idx        on public.receivables (sync_status);
create index projects_hub_idx            on public.projects (hub);
create index projects_stage_idx          on public.projects (project_stage_id);
create index projects_status_idx         on public.projects (project_status);
create index projects_active_idx         on public.projects (active) where active;
create index projects_search_idx         on public.projects using gin (search_text gin_trgm_ops);

-- ---------------------------------------------------------------- audit_logs (imutável)
create table public.audit_logs (
  id             uuid primary key default gen_random_uuid(),
  entity_type    text not null,
  entity_id      uuid not null,
  action_type    text not null,
  changed_fields text[] not null default '{}',
  before_data    jsonb,
  after_data     jsonb,
  actor_user_id  uuid,
  actor_name     text,
  actor_email    text,
  source         text not null default 'platform',   -- platform | google_sheets | import | system
  occurred_at    timestamptz not null default now(),
  correlation_id uuid,
  sync_status    public.sync_state,
  error_message  text,
  metadata       jsonb
);
create index audit_logs_occurred_idx on public.audit_logs (occurred_at desc);
create index audit_logs_entity_idx   on public.audit_logs (entity_type, entity_id);
create index audit_logs_actor_idx    on public.audit_logs (actor_user_id);

create or replace function public.audit_logs_immutable() returns trigger language plpgsql as $$
begin raise exception 'audit_logs é imutável (% não permitido).', tg_op; end $$;
create trigger audit_logs_no_update before update on public.audit_logs for each row execute function public.audit_logs_immutable();
create trigger audit_logs_no_delete before delete on public.audit_logs for each row execute function public.audit_logs_immutable();

-- Trigger genérico. Contexto opcional via set_config('app.action_type'|'app.source'|'app.correlation_id'|'app.metadata', ..., true).
create or replace function public.write_audit_log() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  before_j jsonb := case when tg_op = 'INSERT' then null else to_jsonb(old) end;
  after_j  jsonb := case when tg_op = 'DELETE' then null else to_jsonb(new) end;
  changed  text[] := '{}';
  k text;
  ignore constant text[] := array['updated_at','updated_by','normalized_name','search_text','source_hash'];
  actor record;
  entity_id uuid := coalesce((after_j->>'id')::uuid, (after_j->>'user_id')::uuid, (before_j->>'id')::uuid, (before_j->>'user_id')::uuid);
  action text := coalesce(nullif(current_setting('app.action_type', true), ''), lower(tg_op));
begin
  if tg_op = 'UPDATE' then
    for k in select jsonb_object_keys(after_j) loop
      if k = any(ignore) then continue; end if;
      if (before_j->k) is distinct from (after_j->k) then changed := changed || k; end if;
    end loop;
    if array_length(changed, 1) is null then return new; end if;   -- nada mudou: sem log
  end if;

  select full_name, email into actor from public.profiles where user_id = auth.uid();
  insert into public.audit_logs (entity_type, entity_id, action_type, changed_fields, before_data, after_data,
                                 actor_user_id, actor_name, actor_email, source, correlation_id, sync_status, metadata)
  values (tg_table_name, entity_id, action, changed, before_j, after_j,
          auth.uid(), actor.full_name, actor.email,
          coalesce(nullif(current_setting('app.source', true), ''), case when auth.uid() is null then 'system' else 'platform' end),
          nullif(current_setting('app.correlation_id', true), '')::uuid,
          (after_j->>'sync_status')::public.sync_state,
          nullif(current_setting('app.metadata', true), '')::jsonb);
  return coalesce(new, old);
end $$;

create trigger projects_audit    after insert or update on public.projects    for each row execute function public.write_audit_log();
create trigger receivables_audit after insert or update on public.receivables for each row execute function public.write_audit_log();
create trigger profiles_audit    after insert or update on public.profiles    for each row execute function public.write_audit_log();

-- ---------------------------------------------------------------- sincronização
create table public.sync_runs (
  id                  uuid primary key default gen_random_uuid(),
  started_at          timestamptz not null default now(),
  finished_at         timestamptz,
  started_by          uuid references auth.users(id),
  type                text not null,      -- preview | initialize | import | synchronize | writeback | reconcile
  status              text not null default 'running',   -- running | success | partial | error
  records_read        int not null default 0,
  records_created     int not null default 0,
  records_updated     int not null default 0,
  records_ignored     int not null default 0,
  records_with_errors int not null default 0,
  conflicts           int not null default 0,
  details             jsonb,
  error_message       text
);
create index sync_runs_started_idx on public.sync_runs (started_at desc);

create table public.sync_queue (
  id             uuid primary key default gen_random_uuid(),
  receivable_id  uuid not null references public.receivables(id),
  operation      text not null default 'writeback_operational',
  payload        jsonb not null,
  status         text not null default 'pending',   -- pending | processing | done | error
  attempts       int not null default 0,
  last_error     text,
  created_at     timestamptz not null default now(),
  processed_at   timestamptz
);
create index sync_queue_status_idx on public.sync_queue (status, created_at);
