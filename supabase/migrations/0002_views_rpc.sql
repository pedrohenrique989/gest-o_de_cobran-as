-- =============================================================================
-- 0002: situação financeira, views enriquecidas e RPCs (toda escrita passa por aqui)
-- =============================================================================

-- ---------------------------------------------------------------- situação financeira
-- not_applicable | open | partial | paid
create or replace function public.fin_status(planned numeric, received numeric) returns text
language sql immutable as $$
  select case
    when coalesce(planned, 0) = 0 then 'not_applicable'
    when planned - coalesce(received, 0) <= 0.01 then 'paid'
    when coalesce(received, 0) = 0 then 'open'
    else 'partial' end
$$;

create or replace function public.fin_status_overall(p text, i text) returns text
language sql immutable as $$
  select case
    when p = 'not_applicable' and i = 'not_applicable' then 'not_applicable'
    when (p in ('paid','not_applicable')) and (i in ('paid','not_applicable')) then 'paid'
    when (p in ('open','not_applicable')) and (i in ('open','not_applicable')) then 'open'
    else 'partial' end
$$;

-- Competência corrente em America/Sao_Paulo.
create or replace function public.current_competence() returns date
language sql stable as $$
  select date_trunc('month', (now() at time zone 'America/Sao_Paulo'))::date
$$;

-- ---------------------------------------------------------------- views
create or replace view public.v_projects_enriched with (security_invoker = true) as
select p.*,
       s.code as stage_code, s.name as stage_name, s.color as stage_color
from public.projects p
left join public.project_stage_catalog s on s.id = p.project_stage_id;

create or replace view public.v_receivables_enriched with (security_invoker = true) as
select
  r.id, r.project_id, r.competence, r.original_competence, r.legacy_consolidated,
  r.planned_project, r.received_project, r.planned_innovatis, r.received_innovatis,
  greatest(r.planned_project - r.received_project, 0)     as balance_project,
  greatest(r.planned_innovatis - r.received_innovatis, 0) as balance_innovatis,
  public.fin_status(r.planned_project, r.received_project)     as project_financial_status,
  public.fin_status(r.planned_innovatis, r.received_innovatis) as innovatis_financial_status,
  public.fin_status_overall(public.fin_status(r.planned_project, r.received_project),
                            public.fin_status(r.planned_innovatis, r.received_innovatis)) as overall_financial_status,
  (r.received_project > r.planned_project + 0.01 or r.received_innovatis > r.planned_innovatis + 0.01) as received_exceeds_planned,
  r.financial_due_date, r.financial_received_date, r.invoice_number,
  r.collection_status_id, cs.display_label as collection_status_label, cs.is_paid as collection_is_paid,
  r.reason, r.action,
  r.responsible_user_id, coalesce(rp.full_name, r.responsible_legacy_name) as responsible_name, r.responsible_legacy_name,
  r.operational_deadline,
  (r.operational_deadline is not null and r.operational_deadline < (now() at time zone 'America/Sao_Paulo')::date
     and public.fin_status_overall(public.fin_status(r.planned_project, r.received_project),
                                   public.fin_status(r.planned_innovatis, r.received_innovatis)) not in ('paid','not_applicable')) as deadline_overdue,
  r.flag, r.origin, r.provisional, r.source_type, r.source_sheet_name, r.source_version, r.sync_status, r.sync_error,
  r.active, r.created_at, r.updated_at, r.updated_by, r.archived_at, r.archive_reason,
  -- projeto
  p.name as project_name, p.hub, p.ministry_government, p.institute, p.foundation,
  p.project_status, p.project_stage_id, s.code as stage_code, s.name as stage_name, s.color as stage_color,
  p.stage_pending, p.origin as project_origin, p.provisional as project_provisional, p.active as project_active,
  p.search_text,
  -- atraso V0: competência anterior à atual, saldo > 0,01, projeto ativo
  (r.competence < public.current_competence()
     and (greatest(r.planned_project - r.received_project, 0) + greatest(r.planned_innovatis - r.received_innovatis, 0)) > 0.01
     and p.project_status = 'active' and p.active and r.active) as is_overdue,
  -- participa dos indicadores ativos
  (p.project_status = 'active' and p.active and r.active) as counts_in_portfolio
from public.receivables r
join public.projects p on p.id = r.project_id
left join public.project_stage_catalog s on s.id = p.project_stage_id
left join public.collection_status_catalog cs on cs.id = r.collection_status_id
left join public.profiles rp on rp.user_id = r.responsible_user_id;

-- Qualidade dos dados (subconjunto da V0; demais checagens dependem da importação — FASE 3/4)
create or replace view public.v_data_quality_issues with (security_invoker = true) as
select 'received_exceeds_planned' as issue, 'Recebido maior que previsto' as label, id as receivable_id, project_id, project_name, competence
  from public.v_receivables_enriched where received_exceeds_planned and active
union all
select 'paid_status_with_balance', 'Etapa "Pago" com saldo', id, project_id, project_name, competence
  from public.v_receivables_enriched where collection_is_paid and (balance_project + balance_innovatis) > 0.01 and active
union all
select 'project_paid_innovatis_open', 'Projeto pago e Innovatis em aberto', id, project_id, project_name, competence
  from public.v_receivables_enriched where project_financial_status = 'paid' and innovatis_financial_status in ('open','partial') and active
union all
select 'deadline_overdue', 'Prazo operacional vencido', id, project_id, project_name, competence
  from public.v_receivables_enriched where deadline_overdue and active and counts_in_portfolio
union all
select 'missing_responsible', 'Cobrança sem responsável', id, project_id, project_name, competence
  from public.v_receivables_enriched where responsible_name is null and overall_financial_status in ('open','partial') and active and counts_in_portfolio
union all
select 'missing_action', 'Cobrança sem ação', id, project_id, project_name, competence
  from public.v_receivables_enriched where nullif(btrim(action), '') is null and overall_financial_status in ('open','partial') and active and counts_in_portfolio
union all
select 'sync_error', 'Erro de sincronização', id, project_id, project_name, competence
  from public.v_receivables_enriched where sync_status in ('error','conflict') and active
union all
select 'stage_pending', 'Fase não definida', null, id, name, null
  from public.projects where (project_stage_id is null or stage_pending) and active
union all
select 'missing_hub_or_foundation', 'Projeto sem Fundação', null, id, name, null
  from public.projects where foundation is null and active and hub = 'IFES'
union all
select 'legacy_code_unmapped', 'Código legado sem mapeamento', null, null, legacy_code, null
  from public.legacy_code_mapping where mapped_to is null
union all
select 'possible_duplicate', 'Possível duplicidade de projeto', null, min(id::text)::uuid, min(name), null
  from public.projects where active group by normalized_name having count(*) > 1;

-- ---------------------------------------------------------------- RPCs
-- Convenção: SECURITY DEFINER + revalidação de papel dentro da função. Sem policies de escrita direta.

create or replace function public.assert_role(allowed public.app_role[]) returns void
language plpgsql stable security definer set search_path = public as $$
begin
  if auth.uid() is null or not public.is_active_user() or not (public.current_app_role() = any(allowed)) then
    raise exception 'Sem permissão para esta operação.' using errcode = '42501';
  end if;
end $$;

create or replace function public.audit_ctx(action text, metadata jsonb default null) returns void
language plpgsql as $$
begin
  perform set_config('app.action_type', action, true);
  perform set_config('app.metadata', coalesce(metadata::text, ''), true);
end $$;

-- ---- operacional (operator / master_admin) — os cinco campos, com versionamento otimista
create or replace function public.rpc_update_receivable_operational(
  p_id uuid, p_expected_version int,
  p_collection_status_id uuid, p_responsible_user_id uuid, p_responsible_legacy_name text,
  p_operational_deadline date, p_reason text, p_action text
) returns jsonb language plpgsql security definer set search_path = public as $$
declare cur public.receivables; changed boolean;
begin
  perform public.assert_role(array['operator','master_admin']::public.app_role[]);
  select * into cur from public.receivables where id = p_id and active for update;
  if not found then raise exception 'Recebível não encontrado.'; end if;
  if cur.source_version <> p_expected_version then
    return jsonb_build_object('ok', false, 'conflict', true, 'current_version', cur.source_version,
      'current', jsonb_build_object('collection_status_id', cur.collection_status_id, 'responsible_user_id', cur.responsible_user_id,
        'responsible_legacy_name', cur.responsible_legacy_name, 'operational_deadline', cur.operational_deadline,
        'reason', cur.reason, 'action', cur.action, 'updated_at', cur.updated_at, 'updated_by', cur.updated_by));
  end if;
  changed := cur.collection_status_id is distinct from p_collection_status_id
          or cur.responsible_user_id is distinct from p_responsible_user_id
          or cur.responsible_legacy_name is distinct from nullif(btrim(p_responsible_legacy_name), '')
          or cur.operational_deadline is distinct from p_operational_deadline
          or cur.reason is distinct from nullif(btrim(p_reason), '')
          or cur.action is distinct from nullif(btrim(p_action), '');
  if not changed then return jsonb_build_object('ok', true, 'changed', false, 'version', cur.source_version); end if;

  perform public.audit_ctx('operational_update');
  update public.receivables set
    collection_status_id = p_collection_status_id, responsible_user_id = p_responsible_user_id,
    responsible_legacy_name = nullif(btrim(p_responsible_legacy_name), ''),
    operational_deadline = p_operational_deadline, reason = nullif(btrim(p_reason), ''), action = nullif(btrim(p_action), ''),
    source_version = source_version + 1,
    sync_status = case when source_type = 'google_sheets' then 'pending'::public.sync_state else sync_status end
  where id = p_id;

  -- write-back para a planilha (processado pela Edge Function process-sync-queue — FASE 3)
  if cur.source_type = 'google_sheets' then
    insert into public.sync_queue (receivable_id, operation, payload) values (p_id, 'writeback_operational',
      jsonb_build_object('collection_status_id', p_collection_status_id, 'responsible_user_id', p_responsible_user_id,
        'responsible_legacy_name', p_responsible_legacy_name, 'operational_deadline', p_operational_deadline,
        'reason', p_reason, 'action', p_action, 'version', cur.source_version + 1));
  end if;
  return jsonb_build_object('ok', true, 'changed', true, 'version', cur.source_version + 1);
end $$;

-- ---- financeiro (master_admin)
create or replace function public.rpc_register_receipt(
  p_id uuid, p_received_project numeric, p_received_innovatis numeric, p_received_date date,
  p_invoice_number text, p_note text, p_justification text
) returns jsonb language plpgsql security definer set search_path = public as $$
declare cur public.receivables;
begin
  perform public.assert_role(array['master_admin']::public.app_role[]);
  select * into cur from public.receivables where id = p_id and active for update;
  if not found then raise exception 'Recebível não encontrado.'; end if;
  if (p_received_project > cur.planned_project + 0.01 or p_received_innovatis > cur.planned_innovatis + 0.01)
     and nullif(btrim(p_justification), '') is null then
    raise exception 'Recebido maior que previsto exige justificativa.';
  end if;
  perform public.audit_ctx('receipt_registered', jsonb_build_object('note', p_note, 'justification', p_justification,
    'balance_before', greatest(cur.planned_project - cur.received_project, 0) + greatest(cur.planned_innovatis - cur.received_innovatis, 0)));
  update public.receivables set received_project = p_received_project, received_innovatis = p_received_innovatis,
    financial_received_date = coalesce(p_received_date, financial_received_date),
    invoice_number = coalesce(nullif(btrim(p_invoice_number), ''), invoice_number), source_version = source_version + 1
  where id = p_id;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.rpc_update_receivable_financial(
  p_id uuid, p_planned_project numeric, p_planned_innovatis numeric, p_received_project numeric, p_received_innovatis numeric,
  p_competence date, p_flag text, p_origin public.record_origin, p_provisional boolean, p_legacy_consolidated boolean, p_justification text
) returns jsonb language plpgsql security definer set search_path = public as $$
begin
  perform public.assert_role(array['master_admin']::public.app_role[]);
  perform public.audit_ctx('financial_update', jsonb_build_object('justification', p_justification));
  update public.receivables set planned_project = p_planned_project, planned_innovatis = p_planned_innovatis,
    received_project = p_received_project, received_innovatis = p_received_innovatis, competence = p_competence,
    flag = nullif(btrim(p_flag), ''), origin = p_origin, provisional = p_provisional, legacy_consolidated = p_legacy_consolidated,
    source_version = source_version + 1
  where id = p_id and active;
  if not found then raise exception 'Recebível não encontrado.'; end if;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.rpc_create_receivable(
  p_project_id uuid, p_competence date, p_planned_project numeric, p_planned_innovatis numeric,
  p_received_project numeric, p_received_innovatis numeric, p_collection_status_id uuid,
  p_reason text, p_action text, p_responsible_user_id uuid, p_responsible_legacy_name text,
  p_operational_deadline date, p_flag text, p_origin public.record_origin, p_provisional boolean
) returns uuid language plpgsql security definer set search_path = public as $$
declare new_id uuid;
begin
  perform public.assert_role(array['master_admin']::public.app_role[]);
  perform public.audit_ctx('receivable_created');
  insert into public.receivables (project_id, competence, planned_project, planned_innovatis, received_project, received_innovatis,
    collection_status_id, reason, action, responsible_user_id, responsible_legacy_name, operational_deadline, flag, origin, provisional,
    source_type, sync_status, created_by)
  values (p_project_id, p_competence, coalesce(p_planned_project,0), coalesce(p_planned_innovatis,0), coalesce(p_received_project,0),
    coalesce(p_received_innovatis,0), p_collection_status_id, nullif(btrim(p_reason),''), nullif(btrim(p_action),''), p_responsible_user_id,
    nullif(btrim(p_responsible_legacy_name),''), p_operational_deadline, nullif(btrim(p_flag),''), p_origin, p_provisional,
    'platform', 'platform_only', auth.uid())
  returning id into new_id;
  return new_id;
end $$;

-- ---- projetos (master_admin)
create or replace function public.rpc_create_project(
  p_name text, p_stage_code text, p_project_status public.project_status, p_hub public.hub_type,
  p_ministry_government text, p_institute text, p_foundation text, p_origin public.record_origin, p_provisional boolean, p_notes text
) returns uuid language plpgsql security definer set search_path = public as $$
declare new_id uuid; stage_id uuid;
begin
  perform public.assert_role(array['master_admin']::public.app_role[]);
  if nullif(btrim(p_name), '') is null then raise exception 'Nome do projeto é obrigatório.'; end if;
  select id into stage_id from public.project_stage_catalog where code = p_stage_code and active;
  perform public.audit_ctx('project_created');
  insert into public.projects (name, normalized_name, search_text, project_stage_id, stage_pending, project_status, hub,
    ministry_government, institute, foundation, origin, provisional, notes, created_by)
  values (p_name, '', '', stage_id, stage_id is null, coalesce(p_project_status, 'active'), p_hub,
    nullif(btrim(p_ministry_government),''), nullif(btrim(p_institute),''), nullif(btrim(p_foundation),''), p_origin, p_provisional, p_notes, auth.uid())
  returning id into new_id;
  return new_id;
end $$;

create or replace function public.rpc_update_project(
  p_id uuid, p_name text, p_hub public.hub_type, p_ministry_government text, p_institute text, p_foundation text,
  p_origin public.record_origin, p_provisional boolean, p_notes text
) returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.assert_role(array['master_admin']::public.app_role[]);
  perform public.audit_ctx('project_updated');
  update public.projects set name = p_name, hub = p_hub, ministry_government = nullif(btrim(p_ministry_government),''),
    institute = nullif(btrim(p_institute),''), foundation = nullif(btrim(p_foundation),''), origin = p_origin,
    provisional = p_provisional, notes = p_notes
  where id = p_id;
  if not found then raise exception 'Projeto não encontrado.'; end if;
end $$;

create or replace function public.rpc_set_project_stage(p_id uuid, p_stage_code text, p_justification text)
returns void language plpgsql security definer set search_path = public as $$
declare stage_id uuid; prev text;
begin
  perform public.assert_role(array['master_admin']::public.app_role[]);
  select id into stage_id from public.project_stage_catalog where code = p_stage_code and active;
  if stage_id is null then raise exception 'Fase % inválida.', p_stage_code; end if;
  select s.code into prev from public.projects p left join public.project_stage_catalog s on s.id = p.project_stage_id where p.id = p_id;
  perform public.audit_ctx('stage_changed', jsonb_build_object('from', prev, 'to', p_stage_code, 'justification', p_justification));
  update public.projects set project_stage_id = stage_id, stage_pending = false where id = p_id;
  if not found then raise exception 'Projeto não encontrado.'; end if;
end $$;

-- Ativo/Backlog/Perdido. Reativar a partir de "lost" exige justificativa e fase confirmada.
create or replace function public.rpc_set_project_status(p_id uuid, p_status public.project_status, p_justification text, p_stage_code text default null)
returns void language plpgsql security definer set search_path = public as $$
declare cur public.projects; stage_id uuid;
begin
  perform public.assert_role(array['master_admin']::public.app_role[]);
  if p_status = 'archived' then raise exception 'Use "Excluir da gestão" para arquivar.'; end if;
  select * into cur from public.projects where id = p_id for update;
  if not found then raise exception 'Projeto não encontrado.'; end if;
  if cur.project_status = 'lost' and p_status = 'active' then
    if nullif(btrim(p_justification), '') is null then raise exception 'Reativar um projeto perdido exige justificativa.'; end if;
    if p_stage_code is null then raise exception 'Reativar um projeto perdido exige confirmar a fase (A/B/C/D).'; end if;
  end if;
  if p_stage_code is not null then
    select id into stage_id from public.project_stage_catalog where code = p_stage_code and active;
    if stage_id is null then raise exception 'Fase % inválida.', p_stage_code; end if;
  end if;
  perform public.audit_ctx('status_changed', jsonb_build_object('from', cur.project_status, 'to', p_status, 'justification', p_justification));
  update public.projects set project_status = p_status,
    project_stage_id = coalesce(stage_id, project_stage_id), stage_pending = case when stage_id is not null then false else stage_pending end
  where id = p_id;
end $$;

-- "Excluir da gestão" = soft delete
create or replace function public.rpc_archive_project(p_id uuid, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.assert_role(array['master_admin']::public.app_role[]);
  if nullif(btrim(p_reason), '') is null then raise exception 'Informe o motivo da exclusão.'; end if;
  perform public.audit_ctx('project_archived', jsonb_build_object('reason', p_reason));
  update public.projects set active = false, status_before_archive = project_status, project_status = 'archived',
    archived_at = now(), archived_by = auth.uid(), archive_reason = p_reason
  where id = p_id and active;
  if not found then raise exception 'Projeto não encontrado ou já arquivado.'; end if;
  update public.receivables set active = false, archived_at = now(), archived_by = auth.uid(), archive_reason = p_reason
  where project_id = p_id and active;
end $$;

create or replace function public.rpc_restore_project(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.assert_role(array['master_admin']::public.app_role[]);
  perform public.audit_ctx('project_restored');
  update public.projects set active = true, project_status = coalesce(status_before_archive, 'active'), status_before_archive = null,
    archived_at = null, archived_by = null, archive_reason = null
  where id = p_id and active = false;
  if not found then raise exception 'Projeto não encontrado ou não está arquivado.'; end if;
  update public.receivables set active = true, archived_at = null, archived_by = null, archive_reason = null where project_id = p_id and active = false;
end $$;

-- ---- usuários (master_admin) — criação/reset de senha ocorrem via Auth Admin API (server), o profile via RPC
create or replace function public.rpc_update_profile(p_user_id uuid, p_role public.app_role, p_active boolean, p_full_name text, p_legacy_responsible_name text)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.assert_role(array['master_admin']::public.app_role[]);
  perform public.audit_ctx('user_updated');
  update public.profiles set role = p_role, active = p_active, full_name = coalesce(nullif(btrim(p_full_name),''), full_name),
    legacy_responsible_name = nullif(btrim(p_legacy_responsible_name), '')
  where user_id = p_user_id;
  if not found then raise exception 'Usuário não encontrado.'; end if;
end $$;

-- Próprio usuário: marca login e conclusão da troca de senha
create or replace function public.rpc_touch_last_login() returns void
language sql security definer set search_path = public as $$
  update public.profiles set last_login_at = now() where user_id = auth.uid();
$$;
create or replace function public.rpc_password_changed() returns void
language sql security definer set search_path = public as $$
  update public.profiles set must_change_password = false where user_id = auth.uid();
$$;

-- Última sincronização (para o cabeçalho)
create or replace function public.rpc_last_sync() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce((select jsonb_build_object('started_at', started_at, 'finished_at', finished_at, 'status', status, 'type', type)
                   from public.sync_runs order by started_at desc limit 1),
                  jsonb_build_object('status', 'not_configured'))
$$;
