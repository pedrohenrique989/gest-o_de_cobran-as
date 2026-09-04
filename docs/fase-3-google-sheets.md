# FASE 3 — Integração Google Sheets (pendente)

Estado: `google-sheets-health-check` implementada (Service Account + listagem de abas). As demais oito Edge Functions existem com auth e checagem de secrets, mas respondem **501 "não implementada"** — a plataforma exibe "Configuração pendente" e não inventa resultados.

## Contrato já fixado
- `src/integrations/receivables-source/types.ts` — `ReceivablesSourceAdapter` (previewImport, importData, synchronize, updateOperationalFields, updateFinancialFields).
- `GoogleSheetsLegacyAdapter` só invoca Edge Functions; nomes de abas, linhas e células nunca chegam ao React.
- Tabelas prontas: `sheet_competence_map` (aba ↔ mês/ano), `legacy_code_mapping` (F, BACKLOG, PERDIDO…), `sync_runs`, `sync_queue`, colunas `source_*`/`sync_status` em `receivables`.

## Ordem sugerida de implementação
1. `preview-google-sheets-import` — ler abas do `sheet_competence_map` ativas, aplicar o parser das duas linhas (linha com projeto = superior; linha imediatamente abaixo = recebidos), classificar A/B/C/D/BACKLOG/PERDIDO/outros, contar IDs presentes/ausentes/duplicados. Não escreve nada.
2. `initialize-google-sheets` — só após aprovação explícita: detecta coluna técnica livre (não assumir), grava cabeçalho `ID_COBRANCA` e o mesmo UUID nas duas linhas, oculta a coluna. Registra em `sync_runs` + `audit_logs`.
3. `import-google-sheets` — upsert por `ID_COBRANCA`; `source_hash` por recebível; `legacy_consolidated` para Jul/2026 quando aplicável; nunca mescla projeto só pelo nome.
4. `synchronize-google-sheets` — recalcula hash; divergência sem edição na plataforma → atualiza e audita como "Alteração externa"; divergência com edição local → `sync_status = conflict`.
5. `update-receivable-operational` / `update-receivable-financial` — write-back das colunas I–M (nunca N, O, Q); falha → `sync_queue`.
6. `process-sync-queue` (cron) e `resolve-sync-conflict`.
7. Reconciliação: comparar previsto/recebido/saldo por competência × HUB × tipo com a aba Dashboard (tolerância R$ 0,01), sem corrigir silenciosamente.

## Validação necessária antes de codar o parser
Uma exportação real da planilha (ou acesso via health-check) para confirmar: posição exata das colunas A–R, células mescladas, linhas de total, e se a coluna técnica após Q continua livre.
