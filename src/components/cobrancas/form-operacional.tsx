"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Erro } from "@/components/ui/basicos";
import { fmtData, fmtDataHora } from "@/lib/format";
import { salvarOperacional, type ConflitoInfo } from "@/services/receivablesActions";
import type { CollectionStatus, Profile, Receivable } from "@/types/domain";

interface Valores { collection_status_id: string; responsible_user_id: string; responsible_legacy_name: string; operational_deadline: string; reason: string; action: string }
const deRecebivel = (r: Receivable): Valores => ({ collection_status_id: r.collection_status_id ?? "", responsible_user_id: r.responsible_user_id ?? "", responsible_legacy_name: r.responsible_legacy_name ?? "", operational_deadline: r.operational_deadline ?? "", reason: r.reason ?? "", action: r.action ?? "" });

export const FormOperacional = ({ r, etapas, perfis, perfilAtual, podeEditar, onSalvo }: { r: Receivable; etapas: CollectionStatus[]; perfis: Profile[]; perfilAtual: Profile; podeEditar: boolean; onSalvo: () => void }) => {
  const original = deRecebivel(r);
  const [v, setV] = useState<Valores>(original);
  const [confirmando, setConfirmando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [conflito, setConflito] = useState<ConflitoInfo | null>(null);
  const [registrado, setRegistrado] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const up = (k: keyof Valores) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setV((s) => ({ ...s, [k]: e.target.value }));

  const rotEtapa = (id: string) => etapas.find((e) => e.id === id)?.display_label ?? "—";
  const rotResp = (id: string, legado: string) => perfis.find((p) => p.user_id === id)?.full_name ?? legado ?? "—";
  const diffs: { campo: string; antes: string; depois: string }[] = [];
  if (v.collection_status_id !== original.collection_status_id) diffs.push({ campo: "Etapa da cobrança", antes: rotEtapa(original.collection_status_id), depois: rotEtapa(v.collection_status_id) });
  if (v.responsible_user_id !== original.responsible_user_id || v.responsible_legacy_name !== original.responsible_legacy_name) diffs.push({ campo: "Responsável", antes: rotResp(original.responsible_user_id, original.responsible_legacy_name), depois: rotResp(v.responsible_user_id, v.responsible_legacy_name) });
  if (v.operational_deadline !== original.operational_deadline) diffs.push({ campo: "Prazo", antes: fmtData(original.operational_deadline), depois: fmtData(v.operational_deadline) });
  if (v.reason !== original.reason) diffs.push({ campo: "Motivo", antes: original.reason || "—", depois: v.reason || "—" });
  if (v.action !== original.action) diffs.push({ campo: "Ação", antes: original.action || "—", depois: v.action || "—" });

  const salvar = () => start(async () => {
    const res = await salvarOperacional({ id: r.id, expected_version: r.source_version, collection_status_id: v.collection_status_id || null, responsible_user_id: v.responsible_user_id || null, responsible_legacy_name: v.responsible_user_id ? null : (v.responsible_legacy_name || null), operational_deadline: v.operational_deadline || null, reason: v.reason || null, action: v.action || null });
    setConfirmando(false);
    if (!res.ok) { setErro(res.erro); if (res.conflito) setConflito(res.conflito); return; }
    setErro(null); setRegistrado(`Atualização registrada por ${perfilAtual.full_name} em ${fmtDataHora(new Date().toISOString())}.`); onSalvo();
  });
  const opcoesHub = etapas.filter((e) => e.hub === r.hub);

  return (
    <section className="space-y-3">
      <h3 className="text-[12px] font-semibold uppercase tracking-wide text-ink-muted">Acompanhamento operacional</h3>
      <label className="lbl">Etapa da cobrança<select className="field mt-0.5" value={v.collection_status_id} onChange={up("collection_status_id")} disabled={!podeEditar}><option value="">—</option>{opcoesHub.map((e) => <option key={e.id} value={e.id}>{e.display_label}</option>)}</select></label>
      <div className="grid grid-cols-2 gap-3">
        <label className="lbl">Responsável (usuário)<select className="field mt-0.5" value={v.responsible_user_id} onChange={up("responsible_user_id")} disabled={!podeEditar}><option value="">— (usar nome livre)</option>{perfis.filter((p) => p.active).map((p) => <option key={p.user_id} value={p.user_id}>{p.full_name}</option>)}</select></label>
        <label className="lbl">Responsável (nome livre)<input className="field mt-0.5" value={v.responsible_legacy_name} onChange={up("responsible_legacy_name")} disabled={!podeEditar || !!v.responsible_user_id} placeholder="Usado se nenhum usuário for selecionado" /></label>
      </div>
      <label className="lbl">Prazo<input type="date" className="field mt-0.5 w-[160px]" value={v.operational_deadline} onChange={up("operational_deadline")} disabled={!podeEditar} /></label>
      <label className="lbl">Motivo<textarea className="field mt-0.5 h-16 py-1.5" value={v.reason} onChange={up("reason")} disabled={!podeEditar} /></label>
      <label className="lbl">Ação<textarea className="field mt-0.5 h-16 py-1.5" value={v.action} onChange={up("action")} disabled={!podeEditar} /></label>

      {conflito && (
        <div className="rounded border border-danger/30 bg-danger-soft p-3 text-[12px]">
          <p className="font-semibold text-danger">Outra pessoa alterou este recebível enquanto você editava.</p>
          <p className="mt-1 text-ink-muted">Versão que você abriu: {r.source_version} · versão atual: {conflito.current_version} · atualizado em {fmtDataHora(String(conflito.current.updated_at))}.</p>
          <table className="tbl mt-2"><thead><tr><th>Campo</th><th>Você abriu</th><th>Atual no sistema</th><th>Você tentou salvar</th></tr></thead><tbody>
            {[["Etapa", rotEtapa(original.collection_status_id), rotEtapa(String(conflito.current.collection_status_id ?? "")), rotEtapa(v.collection_status_id)], ["Prazo", fmtData(original.operational_deadline), fmtData(conflito.current.operational_deadline as string), fmtData(v.operational_deadline)], ["Motivo", original.reason || "—", String(conflito.current.reason ?? "—"), v.reason || "—"], ["Ação", original.action || "—", String(conflito.current.action ?? "—"), v.action || "—"]].map(([c, a, b, d]) => <tr key={c}><td>{c}</td><td>{a}</td><td className="font-medium">{b}</td><td>{d}</td></tr>)}
          </tbody></table>
          <div className="mt-2 flex gap-2"><Button size="sm" variant="outline" onClick={() => { setConflito(null); onSalvo(); }}>Recarregar com a versão atual</Button></div>
        </div>
      )}
      <Erro msg={erro} />
      {registrado && <p className="text-[12px] text-ok">{registrado}</p>}
      {podeEditar && !confirmando && <Button onClick={() => diffs.length ? setConfirmando(true) : setErro("Nenhum campo foi alterado.")} disabled={pending || !!conflito}>Salvar atualização</Button>}
      {confirmando && (
        <div className="rounded border border-line bg-canvas p-3">
          <p className="mb-2 text-[12px] font-semibold">Confirme as alterações</p>
          <table className="tbl"><thead><tr><th>Campo</th><th>Antes</th><th>Depois</th></tr></thead><tbody>{diffs.map((d) => <tr key={d.campo}><td>{d.campo}</td><td className="whitespace-normal text-ink-muted">{d.antes}</td><td className="whitespace-normal font-medium">{d.depois}</td></tr>)}</tbody></table>
          <div className="mt-3 flex gap-2"><Button onClick={salvar} disabled={pending}>{pending ? "Salvando…" : "Confirmar e salvar"}</Button><Button variant="outline" onClick={() => setConfirmando(false)}>Voltar</Button></div>
        </div>
      )}
    </section>
  );
};
