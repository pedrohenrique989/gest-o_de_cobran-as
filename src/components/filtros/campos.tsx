"use client";
import { useUrlFiltros } from "./use-url-filtros";
export const SelectFiltro = ({ chave, rotulo, opcoes, todos = "Todos", w = "min-w-[130px]" }: { chave: string; rotulo: string; opcoes: { v: string; l: string }[] | string[]; todos?: string; w?: string }) => {
  const { get, set } = useUrlFiltros();
  const ops = opcoes.map((o) => (typeof o === "string" ? { v: o, l: o } : o));
  return <label className="lbl">{rotulo}<select className={`field mt-0.5 ${w}`} value={get(chave)} onChange={(e) => set({ [chave]: e.target.value })}><option value="">{todos}</option>{ops.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}</select></label>;
};
export const BuscaFiltro = ({ chave = "q", rotulo = "Buscar", placeholder, w = "min-w-[220px]" }: { chave?: string; rotulo?: string; placeholder?: string; w?: string }) => {
  const { get, set } = useUrlFiltros();
  let t: ReturnType<typeof setTimeout>;
  return <label className="lbl">{rotulo}<input className={`field mt-0.5 ${w}`} placeholder={placeholder} defaultValue={get(chave)} onChange={(e) => { clearTimeout(t); const v = e.target.value; t = setTimeout(() => set({ [chave]: v }), 400); }} /></label>;
};
export const ToggleFiltro = ({ chave, rotulo, ligadoQuando = "1", padraoLigado = false }: { chave: string; rotulo: string; ligadoQuando?: string; padraoLigado?: boolean }) => {
  const { get, set } = useUrlFiltros();
  const atual = get(chave); const ligado = atual ? atual === ligadoQuando : padraoLigado;
  return <label className="flex h-8 items-center gap-1.5 self-end text-[12px] text-ink-muted"><input type="checkbox" checked={ligado} onChange={(e) => set({ [chave]: e.target.checked ? (padraoLigado ? "" : ligadoQuando) : (padraoLigado ? "0" : "") })} />{rotulo}</label>;
};
export const LimparFiltros = () => { const { limpar } = useUrlFiltros(); return <button onClick={limpar} className="h-8 self-end rounded px-2 text-[12px] text-ink-muted hover:bg-canvas">Limpar</button>; };
