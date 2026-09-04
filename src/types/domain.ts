// Modelo de domínio da plataforma. Componentes só conhecem estes tipos — nunca abas/linhas/células do Sheets.
export type AppRole = "viewer" | "operator" | "master_admin";
export type ProjectStatus = "active" | "backlog" | "lost" | "archived";
export type Hub = "IFES" | "GOV";
export type RecordOrigin = "google_sheets" | "crm" | "platform" | "future_financial_database";
export type SyncState = "synchronized" | "pending" | "error" | "conflict" | "platform_only";
export type FinStatus = "not_applicable" | "open" | "partial" | "paid";
export type StageColor = "green" | "blue" | "neutral" | "orange";

export interface Profile { user_id: string; full_name: string; email: string; role: AppRole; active: boolean; must_change_password: boolean; legacy_responsible_name: string | null; last_login_at: string | null; created_at: string; }
export interface ProjectStage { id: string; code: string; name: string; display_order: number; color: StageColor; active: boolean; }
export interface CollectionStatus { id: string; hub: Hub; source_label: string; display_label: string; display_order: number; is_paid: boolean; is_partially_paid: boolean; is_not_applicable: boolean; active: boolean; }

/** Linha de v_receivables_enriched — o recebível já normalizado (duas linhas do Sheets = um registro). */
export interface Receivable {
  id: string; project_id: string; competence: string; original_competence: string | null; legacy_consolidated: boolean;
  planned_project: number; received_project: number; planned_innovatis: number; received_innovatis: number;
  balance_project: number; balance_innovatis: number;
  project_financial_status: FinStatus; innovatis_financial_status: FinStatus; overall_financial_status: FinStatus;
  received_exceeds_planned: boolean;
  financial_due_date: string | null; financial_received_date: string | null; invoice_number: string | null;
  collection_status_id: string | null; collection_status_label: string | null; collection_is_paid: boolean | null;
  reason: string | null; action: string | null;
  responsible_user_id: string | null; responsible_name: string | null; responsible_legacy_name: string | null;
  operational_deadline: string | null; deadline_overdue: boolean;
  flag: string | null; origin: RecordOrigin; provisional: boolean; source_type: "google_sheets" | "platform"; source_sheet_name: string | null;
  source_version: number; sync_status: SyncState; sync_error: string | null;
  active: boolean; created_at: string; updated_at: string; updated_by: string | null; archived_at: string | null; archive_reason: string | null;
  project_name: string; hub: Hub; ministry_government: string | null; institute: string | null; foundation: string | null;
  project_status: ProjectStatus; project_stage_id: string | null; stage_code: string | null; stage_name: string | null; stage_color: StageColor | null;
  stage_pending: boolean; project_origin: RecordOrigin; project_provisional: boolean; project_active: boolean; search_text: string;
  is_overdue: boolean; counts_in_portfolio: boolean;
}

export interface Project { id: string; name: string; project_stage_id: string | null; stage_code: string | null; stage_name: string | null; stage_pending: boolean; legacy_stage_code: string | null; project_status: ProjectStatus; hub: Hub; ministry_government: string | null; institute: string | null; foundation: string | null; origin: RecordOrigin; provisional: boolean; notes: string | null; active: boolean; archived_at: string | null; archive_reason: string | null; created_at: string; }

export interface AuditLog { id: string; entity_type: string; entity_id: string; action_type: string; changed_fields: string[]; before_data: Record<string, unknown> | null; after_data: Record<string, unknown> | null; actor_user_id: string | null; actor_name: string | null; actor_email: string | null; source: string; occurred_at: string; correlation_id: string | null; sync_status: SyncState | null; error_message: string | null; metadata: Record<string, unknown> | null; }
export interface SyncRun { id: string; started_at: string; finished_at: string | null; started_by: string | null; type: string; status: string; records_read: number; records_created: number; records_updated: number; records_ignored: number; records_with_errors: number; conflicts: number; details: unknown; error_message: string | null; }
export interface QualityIssue { issue: string; label: string; receivable_id: string | null; project_id: string | null; project_name: string | null; competence: string | null; }

export const ROLE_LABEL: Record<AppRole, string> = { viewer: "Viewer", operator: "Operator", master_admin: "Master Admin" };
export const STATUS_LABEL: Record<ProjectStatus, string> = { active: "Ativo", backlog: "Backlog", lost: "Perdido", archived: "Arquivado" };
export const FIN_LABEL: Record<FinStatus, string> = { not_applicable: "Não aplicável", open: "Aberto", partial: "Parcial", paid: "Pago" };
export const ORIGIN_LABEL: Record<RecordOrigin, string> = { google_sheets: "Planilha", crm: "CRM", platform: "Plataforma", future_financial_database: "Base financeira" };
export const SYNC_LABEL: Record<SyncState, string> = { synchronized: "Sincronizado", pending: "Pendente", error: "Erro", conflict: "Conflito", platform_only: "Só plataforma" };
export const ACTION_LABEL: Record<string, string> = { insert: "Criado", update: "Atualizado", operational_update: "Atualização operacional", receipt_registered: "Recebimento registrado", financial_update: "Valores alterados", receivable_created: "Recebível criado", project_created: "Projeto criado", project_updated: "Cadastro editado", stage_changed: "Fase alterada", status_changed: "Situação alterada", project_archived: "Excluído da gestão", project_restored: "Restaurado", user_updated: "Usuário atualizado", user_created: "Usuário criado", password_reset: "Senha resetada", import: "Importação", sync: "Sincronização" };
export const FIELD_LABEL: Record<string, string> = { collection_status_id: "Etapa da cobrança", responsible_user_id: "Responsável", responsible_legacy_name: "Responsável (legado)", operational_deadline: "Prazo", reason: "Motivo", action: "Ação", planned_project: "Previsto Projeto", planned_innovatis: "Previsto Innovatis", received_project: "Recebido Projeto", received_innovatis: "Recebido Innovatis", competence: "Competência", flag: "FLAG", origin: "Origem", provisional: "Provisório", project_stage_id: "Fase", project_status: "Situação", name: "Projeto", hub: "HUB", ministry_government: "Ministério/Governo", institute: "Instituto", foundation: "Fundação", active: "Ativo", role: "Perfil", full_name: "Nome", archive_reason: "Motivo da exclusão", invoice_number: "NF", financial_received_date: "Data do recebimento", source_version: "Versão", sync_status: "Sincronização", stage_pending: "Fase pendente", notes: "Observação", legacy_responsible_name: "Responsável legado", must_change_password: "Troca de senha", last_login_at: "Último acesso" };
