import { Pendente } from "@/components/ui/basicos";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fmtDataHora } from "@/lib/format";
import type { SyncRun } from "@/types/domain";
const dur = (a: string, b: string | null) => (b ? `${Math.round((new Date(b).getTime() - new Date(a).getTime()) / 1000)}s` : "—");
export const Sincronizacoes = ({ runs, fila, fonte }: { runs: SyncRun[]; fila: number; fonte: { configured: boolean; healthy: boolean; message: string } }) => (
  <div className="space-y-3">
    <div className="panel px-4 py-3">
      <div className="flex flex-wrap items-center gap-3 text-[13px]">
        <span className="font-semibold">Google Sheets</span>{fonte.configured ? <Badge tom={fonte.healthy ? "green" : "red"}>{fonte.healthy ? "Acessível" : "Erro"}</Badge> : <Pendente />}<span className="text-ink-muted">{fonte.message}</span>
        <span className="ml-auto text-ink-muted">Pendentes na fila: <b className="num">{fila}</b></span>
        <Button size="sm" disabled>Sincronizar agora</Button><Button size="sm" variant="outline" disabled>Tentar novamente</Button>
      </div>
      <p className="mt-2 text-[11.5px] text-ink-faint">Sincronização, importação e write-back são implementados nas Edge Functions da FASE 3 (health-check, preview, initialize, import, synchronize, process-sync-queue, resolve-sync-conflict). Secrets necessários: <code>GOOGLE_SERVICE_ACCOUNT_JSON</code>, <code>GOOGLE_SPREADSHEET_ID</code>.</p>
    </div>
    <div className="panel"><div className="panel-head"><span className="panel-title">Execuções</span></div>
      {runs.length === 0 ? <p className="px-4 py-8 text-center text-[13px] text-ink-faint">Nenhuma sincronização executada.</p> : <table className="tbl"><thead><tr><th>Tipo</th><th>Status</th><th>Início</th><th>Fim</th><th>Duração</th><th className="num">Lidos</th><th className="num">Criados</th><th className="num">Atualizados</th><th className="num">Ignorados</th><th className="num">Erros</th><th className="num">Conflitos</th><th>Erro</th></tr></thead><tbody>
        {runs.map((r) => <tr key={r.id}><td>{r.type}</td><td><Badge tom={r.status === "success" ? "green" : r.status === "error" ? "red" : "orange"}>{r.status}</Badge></td><td>{fmtDataHora(r.started_at)}</td><td>{fmtDataHora(r.finished_at)}</td><td>{dur(r.started_at, r.finished_at)}</td><td className="num">{r.records_read}</td><td className="num">{r.records_created}</td><td className="num">{r.records_updated}</td><td className="num">{r.records_ignored}</td><td className="num">{r.records_with_errors}</td><td className="num">{r.conflicts}</td><td className="max-w-[240px] truncate text-danger" title={r.error_message ?? ""}>{r.error_message ?? "—"}</td></tr>)}
      </tbody></table>}
    </div>
  </div>
);
