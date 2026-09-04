"use client";
import { useUrlFiltros } from "@/components/filtros/use-url-filtros";
import { cn } from "@/lib/utils";
const itens: { v: string; l: string }[] = [
  { v: "atrasados", l: "Atrasados" }, { v: "mes_atual", l: "Mês atual" }, { v: "atrasados_mes_atual", l: "Atrasados + mês atual" },
  { v: "proximos", l: "Próximos" }, { v: "todos", l: "Todos" }, { v: "minhas", l: "Minhas cobranças" }, { v: "prazo_vencido", l: "Prazo operacional vencido" },
];
export const FiltrosRapidos = () => {
  const { get, set } = useUrlFiltros(); const atual = get("rapido") || (get("competencia") ? "mes" : "todos");
  return (
    <div className="flex flex-wrap gap-1">
      {itens.map((i) => <button key={i.v} onClick={() => set({ rapido: i.v === "todos" ? "" : i.v, competencia: "" })} className={cn("rounded border px-2.5 py-1 text-[12px]", atual === i.v ? "border-navy bg-navy text-white" : "border-line bg-white text-ink-muted hover:bg-canvas")}>{i.l}</button>)}
      {atual === "mes" && <span className="rounded border border-navy bg-navy px-2.5 py-1 text-[12px] text-white">Mês específico</span>}
    </div>
  );
};
