const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });
const pct = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
export const fmtBRL = (v: number | string | null | undefined) => brl.format(Number(v ?? 0));
export const fmtBRLContabil = (v: number) => (v < 0 ? `(${brl.format(Math.abs(v))})` : brl.format(v));
export const fmtPct = (num: number, den: number) => (den <= 0 ? "—" : `${pct.format((num / den) * 100)}%`);
export const fmtData = (iso: string | null | undefined) => { if (!iso) return "—"; const [a, m, d] = iso.slice(0, 10).split("-"); return `${d}/${m}/${a}`; };
export const fmtDataHora = (iso: string | null | undefined) => iso ? new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const MESES_LONGO = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
export const fmtCompetencia = (iso: string) => { const [a, m] = iso.split("-"); const n = MESES[Number(m) - 1]; return `${n[0].toUpperCase()}${n.slice(1)}/${a}`; };
export const fmtCompetenciaLonga = (iso: string) => { const [a, m] = iso.split("-"); return `${MESES_LONGO[Number(m) - 1]}/${a}`; };
export const parseBRL = (s: string) => { const l = s.replace(/[R$\s]/g, ""); const n = Number(l.includes(",") ? l.replace(/\./g, "").replace(",", ".") : l); return Number.isFinite(n) ? n : 0; };
export const num = (v: number | string | null | undefined) => Number(v ?? 0);
/** Competência atual (yyyy-mm-01) em America/Sao_Paulo. */
export const competenciaAtual = () => { const d = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`; };
export const addMeses = (comp: string, n: number) => { const [a, m] = comp.split("-").map(Number); const t = a * 12 + (m - 1) + n; return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, "0")}-01`; };
