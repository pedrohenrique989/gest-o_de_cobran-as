"use client";
import { useUrlFiltros } from "@/components/filtros/use-url-filtros";
import { TabelaCobrancas } from "./tabela";
import { DrawerCobranca, type DrawerProps } from "./drawer-cobranca";
import type { Receivable } from "@/types/domain";
export const ListaCobrancas = ({ rows, total, page, size, drawer }: { rows: Receivable[]; total: number; page: number; size: number; drawer: DrawerProps }) => {
  const { set } = useUrlFiltros();
  return (<><TabelaCobrancas rows={rows} total={total} page={page} size={size} onAbrir={(id) => set({ receivable: id, page: String(page) })} /><DrawerCobranca {...drawer} /></>);
};
