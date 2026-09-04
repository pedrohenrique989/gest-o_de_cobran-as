"use client";
import * as XLSX from "xlsx";
import { fmtCompetencia, FIN } from "./_fmt";
import type { Receivable } from "@/types/domain";
export function exportarCsv(rows: Receivable[]) {
  const ws = XLSX.utils.json_to_sheet(rows.map((r) => ({ Fase: r.stage_code ?? "Pendente", Competência: fmtCompetencia(r.competence), HUB: r.hub, "Ministério/Governo": r.ministry_government ?? "", Instituto: r.institute ?? "", Fundação: r.foundation ?? "", Projeto: r.project_name,
    "Previsto Projeto": Number(r.planned_project), "Recebido Projeto": Number(r.received_project), "Saldo Projeto": Number(r.balance_project), "Previsto Innovatis": Number(r.planned_innovatis), "Recebido Innovatis": Number(r.received_innovatis), "Saldo Innovatis": Number(r.balance_innovatis),
    "Etapa": r.collection_status_label ?? "", Motivo: r.reason ?? "", Ação: r.action ?? "", Responsável: r.responsible_name ?? "", Prazo: r.operational_deadline ?? "", "Situação financeira": FIN[r.overall_financial_status], Origem: r.origin, Provisório: r.provisional ? "Sim" : "Não", "Última atualização": r.updated_at })));
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Cobranças");
  XLSX.writeFile(wb, `cobrancas-${new Date().toISOString().slice(0, 10)}.csv`, { bookType: "csv" });
}
