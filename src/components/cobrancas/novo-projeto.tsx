"use client";
import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Erro } from "@/components/ui/basicos";
import { criarProjeto, type ProjetoInput } from "@/services/receivablesActions";
import { ORIGIN_LABEL, STATUS_LABEL } from "@/types/domain";
export const NovoProjeto = () => {
  const [aberto, setAberto] = useState(false); const [erro, setErro] = useState<string | null>(null); const [pending, start] = useTransition();
  const [f, setF] = useState<ProjetoInput>({ name: "", stage_code: "A", project_status: "active", hub: "IFES", ministry_government: "", institute: "", foundation: "", origin: "crm", provisional: true, notes: "" });
  const up = <K extends keyof ProjetoInput>(k: K) => (v: ProjetoInput[K]) => setF((s) => ({ ...s, [k]: v }));
  const salvar = () => start(async () => { const r = await criarProjeto({ ...f, ministry_government: f.ministry_government || null, institute: f.institute || null, foundation: f.foundation || null, notes: f.notes || null }); if (!r.ok) { setErro(r.erro); return; } setErro(null); setAberto(false); });
  const L = ({ t, c, children }: { t: string; c?: string; children: React.ReactNode }) => <label className={`lbl ${c ?? ""}`}>{t}{children}</label>;
  return (<>
    <Button size="sm" onClick={() => setAberto(true)}><Plus size={13} /> Novo projeto</Button>
    <Modal aberto={aberto} titulo="Cadastrar projeto" onFechar={() => setAberto(false)}>
      <div className="grid grid-cols-2 gap-3">
        <L t="Projeto" c="col-span-2"><input className="field mt-0.5" value={f.name} onChange={(e) => up("name")(e.target.value)} /></L>
        <L t="Fase do projeto"><select className="field mt-0.5" value={f.stage_code ?? ""} onChange={(e) => up("stage_code")((e.target.value || null) as ProjetoInput["stage_code"])}>{["A", "B", "C", "D"].map((x) => <option key={x}>{x}</option>)}<option value="">Pendente</option></select></L>
        <L t="Situação"><select className="field mt-0.5" value={f.project_status} onChange={(e) => up("project_status")(e.target.value as ProjetoInput["project_status"])}>{(["active", "backlog", "lost"] as const).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select></L>
        <L t="HUB"><select className="field mt-0.5" value={f.hub} onChange={(e) => up("hub")(e.target.value as "IFES" | "GOV")}><option>IFES</option><option>GOV</option></select></L>
        <L t="Ministério / Governo"><input className="field mt-0.5" value={f.ministry_government ?? ""} onChange={(e) => up("ministry_government")(e.target.value)} /></L>
        <L t="Instituto"><input className="field mt-0.5" value={f.institute ?? ""} onChange={(e) => up("institute")(e.target.value)} /></L>
        <L t="Fundação"><input className="field mt-0.5" value={f.foundation ?? ""} onChange={(e) => up("foundation")(e.target.value)} /></L>
        <L t="Origem"><select className="field mt-0.5" value={f.origin} onChange={(e) => up("origin")(e.target.value as ProjetoInput["origin"])}>{Object.entries(ORIGIN_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></L>
        <label className="flex items-center gap-2 self-end pb-2 text-[12px]"><input type="checkbox" checked={f.provisional} onChange={(e) => up("provisional")(e.target.checked)} />Provisório (CRM / pré-base)</label>
        <L t="Observação" c="col-span-2"><textarea className="field mt-0.5 h-14 py-1.5" value={f.notes ?? ""} onChange={(e) => up("notes")(e.target.value)} /></L>
      </div>
      <p className="mt-2 text-[11px] text-ink-faint">Após criar o projeto, abra qualquer recebível dele (ou use &quot;Criar nova parcela&quot;) para cadastrar as competências previstas.</p>
      <Erro msg={erro} /><div className="mt-4 flex justify-end gap-2"><Button variant="outline" onClick={() => setAberto(false)}>Cancelar</Button><Button disabled={pending} onClick={salvar}>{pending ? "Criando…" : "Criar projeto"}</Button></div>
    </Modal>
  </>);
};
