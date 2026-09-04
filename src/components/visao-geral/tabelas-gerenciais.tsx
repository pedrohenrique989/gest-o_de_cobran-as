import Link from "next/link";
import { cn } from "@/lib/utils";
import { fmtBRL, fmtCompetencia, fmtData } from "@/lib/format";
import { BadgeFase } from "@/components/ui/badges-dominio";
import { EmptyState } from "@/components/ui/basicos";
import type { Receivable } from "@/types/domain";
export const TabelaGerencial = ({ titulo, tom, rows, vazio }: { titulo: string; tom: "danger" | "ok"; rows: Receivable[]; vazio: string }) => (
  <div className="panel overflow-hidden">
    <div className={cn("flex items-center justify-between px-4 py-2 text-white", tom === "danger" ? "bg-danger" : "bg-ok")}><span className="text-[13px] font-semibold">{titulo}</span><span className="num text-[12px] opacity-90">{rows.length}</span></div>
    {rows.length === 0 ? <EmptyState msg={vazio} /> : <div className="max-h-[400px] overflow-auto"><table className="tbl"><thead><tr><th>Mês</th><th>HUB</th><th>Fase</th><th>Projeto</th><th>Etapa</th><th>Responsável</th><th>Prazo</th><th className="num">Saldo Projeto</th><th className="num">Saldo Innovatis</th></tr></thead><tbody>
      {rows.map((r) => <tr key={r.id} className="clicavel"><td><Link href={`/cobrancas?receivable=${r.id}`} className="block">{fmtCompetencia(r.competence)}</Link></td><td>{r.hub}</td><td><BadgeFase code={r.stage_code} color={r.stage_color} pending={r.stage_pending} /></td><td className="max-w-[220px] truncate" title={r.project_name}><Link href={`/cobrancas?receivable=${r.id}`} className="hover:text-action">{r.project_name}</Link></td><td className="max-w-[200px] truncate" title={r.collection_status_label ?? ""}>{r.collection_status_label ?? "—"}</td><td>{r.responsible_name ?? "—"}</td><td className={cn(r.deadline_overdue && "text-danger font-medium")}>{fmtData(r.operational_deadline)}</td><td className="num">{fmtBRL(r.balance_project)}</td><td className="num">{fmtBRL(r.balance_innovatis)}</td></tr>)}
    </tbody></table></div>}
  </div>
);
