import Link from "next/link";
import { fmtDataHora } from "@/lib/format";
import { ACTION_LABEL, FIELD_LABEL, type AuditLog } from "@/types/domain";
const val = (v: unknown) => (v == null || v === "" ? "—" : typeof v === "object" ? JSON.stringify(v) : String(v));
export const Historico = ({ logs, master, receivableId }: { logs: AuditLog[]; master: boolean; receivableId: string }) => (
  <section>
    <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-muted">Histórico (últimas 5)</h3>
    {!master ? <p className="text-[12px] text-ink-faint">O histórico detalhado é visível ao Master Admin.</p> : logs.length === 0 ? <p className="text-[12px] text-ink-faint">Sem alterações registradas.</p> : (
      <table className="tbl"><thead><tr><th>Data</th><th>Usuário</th><th>Campo</th><th>Antes</th><th>Depois</th></tr></thead><tbody>
        {logs.flatMap((l) => (l.changed_fields.length ? l.changed_fields : ["—"]).map((c) => <tr key={`${l.id}-${c}`}><td>{fmtDataHora(l.occurred_at)}</td><td>{l.actor_name ?? (l.source === "google_sheets" ? "Alteração externa" : "sistema")}</td><td>{c === "—" ? ACTION_LABEL[l.action_type] ?? l.action_type : FIELD_LABEL[c] ?? c}</td><td className="max-w-[120px] truncate text-ink-muted" title={val(l.before_data?.[c])}>{c === "—" ? "" : val(l.before_data?.[c])}</td><td className="max-w-[120px] truncate" title={val(l.after_data?.[c])}>{c === "—" ? "" : val(l.after_data?.[c])}</td></tr>))}
      </tbody></table>)}
    {master && <Link href={`/auditoria?tab=alteracoes&entity=${receivableId}`} className="mt-2 inline-block text-[12px] text-action hover:underline">Ver auditoria completa</Link>}
  </section>
);
