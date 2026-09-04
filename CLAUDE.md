# INNOVATIS | Gestão de Cobranças — V0

Contexto para agentes. Ler `README.md`, `docs/fase-3-google-sheets.md`.

- Português do Brasil em código, comentários e commits. Commits semânticos, sem atribuição a IA, só com aprovação explícita.
- Supabase é a base operacional. Frontend nunca fala com Google Sheets; só Edge Functions.
- Componentes nunca chamam supabase-js: tudo em `src/services` (leitura) e `*Actions.ts` (Server Actions → RPCs `rpc_*`).
- Operator não faz UPDATE direto: só `rpc_update_receivable_operational`. Master Admin só via RPCs com `assert_role`.
- `audit_logs` é imutável (trigger). Nunca hard delete: `rpc_archive_project` / `rpc_restore_project`.
- Fase A/B/C/D ≠ situação (active/backlog/lost/archived) ≠ etapa da cobrança ≠ situação financeira (calculada na view).
- Não implementar FASE 3 sem uma exportação real da planilha para validar o parser.
