import { Badge, type Tom } from "./badge";
import { FIN_LABEL, STATUS_LABEL, SYNC_LABEL, type FinStatus, type ProjectStatus, type StageColor, type SyncState } from "@/types/domain";
const fin: Record<FinStatus, Tom> = { not_applicable: "neutral", open: "blue", partial: "orange", paid: "green" };
const st: Record<ProjectStatus, Tom> = { active: "green", backlog: "orange", lost: "red", archived: "neutral" };
const sy: Record<SyncState, Tom> = { synchronized: "green", pending: "orange", error: "red", conflict: "red", platform_only: "neutral" };
export const BadgeFin = ({ s }: { s: FinStatus }) => <Badge tom={fin[s]}>{FIN_LABEL[s]}</Badge>;
export const BadgeSituacao = ({ s }: { s: ProjectStatus }) => <Badge tom={st[s]}>{STATUS_LABEL[s]}</Badge>;
export const BadgeSync = ({ s, erro }: { s: SyncState; erro?: string | null }) => <Badge tom={sy[s]} title={erro ?? undefined}>{SYNC_LABEL[s]}</Badge>;
export const BadgeFase = ({ code, color, pending }: { code: string | null; color: StageColor | null; pending?: boolean }) =>
  pending || !code ? <Badge tom="orange" title="Fase pendente de classificação">Pendente</Badge> : <Badge tom={color ?? "neutral"} className="font-semibold">{code}</Badge>;
export const BadgeProvisorio = () => <Badge tom="orange" title="Registro provisório (CRM / pré-base)">CRM / Pré-base</Badge>;
export const BadgeConsolidado = () => <Badge tom="neutral" title="Julho/2026 contém cobranças consolidadas de competências vencidas até junho/2026.">Consolidado</Badge>;
