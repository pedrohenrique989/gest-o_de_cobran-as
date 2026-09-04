import { fmtBRL } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Cards } from "@/services/dashboardService";
const Card = ({ r, v, tom, nota }: { r: string; v: string; tom?: "ok" | "danger" | "info"; nota?: string }) => (
  <div className="panel px-4 py-3"><div className="text-[11.5px] text-ink-muted">{r}</div><div className={cn("num mt-0.5 text-[22px] font-semibold leading-tight tracking-tight", tom === "ok" && "text-ok", tom === "danger" && "text-danger", tom === "info" && "text-info")}>{v}</div>{nota && <div className="mt-0.5 text-[11px] text-ink-faint">{nota}</div>}</div>
);
export const CardsExecutivos = ({ c }: { c: Cards }) => (
  <div className="grid grid-cols-4 gap-3 xl:grid-cols-8">
    <Card r="Valor Previsto" v={fmtBRL(c.previsto)} />
    <Card r="Valor Recebido" v={fmtBRL(c.recebido)} tom="ok" />
    <Card r="Valor em Aberto" v={fmtBRL(c.emAberto)} tom="info" />
    <Card r="Valor em Atraso" v={fmtBRL(c.emAtraso)} tom={c.emAtraso > 0 ? "danger" : undefined} />
    <Card r="Batimento" v={c.batimento} nota="Recebido / Previsto" />
    <Card r="Projetos com atraso" v={String(c.projetosAtrasados)} tom={c.projetosAtrasados > 0 ? "danger" : undefined} />
    <Card r="Recebíveis em atraso" v={String(c.recebiveisAtrasados)} tom={c.recebiveisAtrasados > 0 ? "danger" : undefined} />
    <Card r="Prazos operacionais vencidos" v={String(c.prazosVencidos)} tom={c.prazosVencidos > 0 ? "danger" : undefined} />
    {/* "Max dias de atraso financeiro": aguardando data financeira de vencimento (não disponível na planilha operacional). */}
  </div>
);
