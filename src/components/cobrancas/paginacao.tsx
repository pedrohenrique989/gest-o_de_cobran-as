"use client";
import { useUrlFiltros } from "@/components/filtros/use-url-filtros";
import { Button } from "@/components/ui/button";
export const Paginacao = ({ page, size, total }: { page: number; size: number; total: number }) => {
  const { set } = useUrlFiltros(); const paginas = Math.max(1, Math.ceil(total / size));
  return (
    <div className="flex items-center justify-between border-t border-line px-4 py-2 text-[12px] text-ink-muted">
      <span className="num">{total === 0 ? "0" : `${(page - 1) * size + 1}–${Math.min(page * size, total)}`} de {total}</span>
      <div className="flex items-center gap-2">
        <select className="field h-7 w-[70px]" value={size} onChange={(e) => set({ size: e.target.value, page: "1" })}>{[25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}</select>
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => set({ page: String(page - 1) })}>Anterior</Button>
        <span className="num">{page} / {paginas}</span>
        <Button variant="outline" size="sm" disabled={page >= paginas} onClick={() => set({ page: String(page + 1) })}>Próxima</Button>
      </div>
    </div>
  );
};
