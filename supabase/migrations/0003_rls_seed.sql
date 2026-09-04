-- =============================================================================
-- 0003: RLS, grants mínimos e catálogos iniciais
-- =============================================================================
alter table public.profiles                  enable row level security;
alter table public.project_stage_catalog     enable row level security;
alter table public.collection_status_catalog enable row level security;
alter table public.sheet_competence_map      enable row level security;
alter table public.legacy_code_mapping       enable row level security;
alter table public.projects                  enable row level security;
alter table public.receivables               enable row level security;
alter table public.audit_logs                enable row level security;
alter table public.sync_runs                 enable row level security;
alter table public.sync_queue                enable row level security;

-- ANON: nenhum acesso (sem policies para anon). Leituras exigem usuário ATIVO.
create policy profiles_select   on public.profiles                  for select to authenticated using (public.is_active_user());
create policy stage_select      on public.project_stage_catalog     for select to authenticated using (public.is_active_user());
create policy cstatus_select    on public.collection_status_catalog for select to authenticated using (public.is_active_user());
create policy compmap_select    on public.sheet_competence_map      for select to authenticated using (public.is_active_user());
create policy legacy_select     on public.legacy_code_mapping       for select to authenticated using (public.is_active_user());
create policy projects_select   on public.projects                  for select to authenticated using (public.is_active_user());
create policy receivables_select on public.receivables              for select to authenticated using (public.is_active_user());

-- Master Admin: só leitura de auditoria/sincronização e escrita direta nos catálogos/configurações.
create policy audit_select      on public.audit_logs   for select to authenticated using (public.is_master_admin());
create policy sync_runs_select  on public.sync_runs    for select to authenticated using (public.is_master_admin());
create policy sync_queue_select on public.sync_queue   for select to authenticated using (public.is_master_admin());
create policy stage_admin   on public.project_stage_catalog     for all to authenticated using (public.is_master_admin()) with check (public.is_master_admin());
create policy cstatus_admin on public.collection_status_catalog for all to authenticated using (public.is_master_admin()) with check (public.is_master_admin());
create policy compmap_admin on public.sheet_competence_map      for all to authenticated using (public.is_master_admin()) with check (public.is_master_admin());
create policy legacy_admin  on public.legacy_code_mapping       for all to authenticated using (public.is_master_admin()) with check (public.is_master_admin());

-- Sem policies de INSERT/UPDATE/DELETE em projects, receivables, profiles, audit_logs, sync_*:
-- toda escrita passa pelas RPCs (SECURITY DEFINER) ou pelas Edge Functions (service_role).
revoke insert, update, delete on public.audit_logs from anon, authenticated;
revoke insert, update, delete on public.projects, public.receivables, public.profiles, public.sync_runs, public.sync_queue from anon, authenticated;
revoke all on all tables in schema public from anon;
revoke execute on all functions in schema public from anon;

-- ---------------------------------------------------------------- catálogos
insert into public.project_stage_catalog (code, name, display_order, color) values
  ('A', 'Projeto em execução', 1, 'green'),
  ('B', 'Projeto em planejamento', 2, 'blue'),
  ('C', 'Projeto em fase de contrato', 3, 'neutral'),
  ('D', 'Projeto em negociação / anterior ao contrato', 4, 'orange');

insert into public.collection_status_catalog (hub, source_label, display_label, display_order, is_paid, is_partially_paid, is_not_applicable) values
  ('IFES', '2. Assinatura no SEI', '2. Assinatura no SEI', 1, false, false, false),
  ('IFES', '4. Nota de Crédito (Orçamento)', '4. Nota de Crédito (Orçamento)', 2, false, false, false),
  ('IFES', '4.2 Reserva Orçamentária', '4.2 Reserva Orçamentária', 3, false, false, false),
  ('IFES', '6. Assinatura do Contrato (IFES x Fundação)', '6. Assinatura do Contrato (IFES x Fundação)', 4, false, false, false),
  ('IFES', '8. Solicitação financeiro ao ministério', '8. Solicitação financeiro ao ministério', 5, false, false, false),
  ('IFES', '8.3 Envio do Financeiro (Ministério para IFES)', '8.3 Envio do Financeiro (Ministério para IFES)', 6, false, false, false),
  ('IFES', '9. Pagamento à Fundação (IFES para Fundação)', '9. Pagamento à Fundação (IFES para Fundação)', 7, false, false, false),
  ('IFES', '11. Pedido de Fatura com relatório técnico Innovatis para Fundação', '11. Pedido de Fatura com relatório técnico', 8, false, false, false),
  ('IFES', '13. Pago', '13. Pago', 9, true, false, false),
  ('IFES', 'Não se aplica', 'Não se aplica', 10, false, false, true),
  ('GOV', '7. Recebimento da medição / relatório técnico', '7. Recebimento da medição / relatório técnico', 1, false, false, false),
  ('GOV', '8. Consolidação do Relatório do Produto', '8. Consolidação do Relatório do Produto', 2, false, false, false),
  ('GOV', '9. Encaminhamento para validação do Fiscal', '9. Encaminhamento para validação do Fiscal', 3, false, false, false),
  ('GOV', '10. Validação pelo Fiscal do Contrato', '10. Validação pelo Fiscal do Contrato', 4, false, false, false),
  ('GOV', '11. Solicitação de emissão da Nota Fiscal', '11. Solicitação de emissão da Nota Fiscal', 5, false, false, false),
  ('GOV', '12. Encaminhamento pela Fundação ao órgão', '12. Encaminhamento pela Fundação ao órgão', 6, false, false, false),
  ('GOV', '13. Pagamento pelo órgão responsável', '13. Pagamento pelo órgão responsável', 7, false, false, false),
  ('GOV', '16. Pago', '16. Pago', 8, true, false, false),
  ('GOV', '17. Pago parcialmente', '17. Pago parcialmente', 9, false, true, false),
  ('GOV', '17. Não se aplica', '17. Não se aplica', 10, false, false, true);

-- Mapa de competências proposto (confirmação pelo Master Admin no wizard — FASE 3). Não hardcode no código.
insert into public.sheet_competence_map (sheet_name, competence_month, competence_year) values
  ('JUL - A Receber', 7, 2026), ('AGO - A Receber', 8, 2026), ('SET - A Receber', 9, 2026),
  ('OUT - A Receber', 10, 2026), ('NOV - A Receber', 11, 2026), ('DEZ - A Receber', 12, 2026);
