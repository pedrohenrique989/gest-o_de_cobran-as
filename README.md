# INNOVATIS | Gestão de Cobranças — V0

Sistema interno de gestão de recebíveis dos HUBs IFES e GOV. Substitui a navegação pelas abas mensais da planilha por uma base operacional no Supabase, com autenticação, três perfis, auditoria imutável e integração com o Google Sheets via Edge Functions.

**Estado desta entrega:** FASE 1 (Supabase) e FASE 2 (frontend) implementadas. FASE 3 (Google Sheets) tem o contrato, as tabelas, o health-check e os esqueletos das demais funções — ver `docs/fase-3-google-sheets.md`. FASE 4 (qualidade/testes/refino) parcial: view `v_data_quality_issues` e testes unitários de formatação.

## 1. Arquitetura

```
Google Sheets → Sheets API v4 → Supabase Edge Functions → Supabase Postgres → Next.js (App Router)
```

- O frontend nunca consulta o Google Sheets. Filtros e dashboards leem `v_receivables_enriched` no Postgres.
- Leitura em Server Components (`src/services/*Service.ts`); mutações em Server Actions (`*Actions.ts`) que chamam RPCs `rpc_*` com `assert_role` — o servidor revalida a permissão sempre.
- Camada de abstração da fonte: `src/integrations/receivables-source/` com `ReceivablesSourceAdapter`, `GoogleSheetsLegacyAdapter` (V0) e `FinancialDatabaseAdapter` (futuro, não funcional). Componentes React não conhecem abas, linhas ou células.
- Três clients Supabase: browser, server (cookies) e admin (`service_role`, `server-only`).

## 2. Modelo de dados

Quatro conceitos separados: **fase** (A/B/C/D, `project_stage_catalog`), **situação do projeto** (`active|backlog|lost|archived`), **etapa da cobrança** (`collection_status_catalog`) e **situação financeira** (calculada na view: Não aplicável / Aberto / Parcial / Pago, por Projeto, Innovatis e Geral). Origem (`google_sheets|crm|platform|future_financial_database`) e `provisional` são independentes da fase.

Um recebível = duas linhas da planilha = **uma** linha em `receivables`. Competência sempre no dia 1. Saldo = `greatest(previsto − recebido, 0)`; recebido > previsto gera alerta em `v_data_quality_issues`, nunca saldo negativo. Atraso na V0 = competência < atual ∧ saldo > 0,01 ∧ projeto ativo — o prazo operacional não entra nesse cálculo.

## 3. Tabelas

| Tabela | Papel |
|---|---|
| `profiles` | usuário, perfil (`viewer|operator|master_admin`), `must_change_password`, `last_login_at` |
| `project_stage_catalog` | fases A–D (descrição, ordem, cor) |
| `collection_status_catalog` | etapas de cobrança por HUB, flags `is_paid/is_partially_paid/is_not_applicable`, SLA |
| `sheet_competence_map` | aba mensal ↔ mês/ano (confirmado pelo Master Admin no setup) |
| `legacy_code_mapping` | códigos fora de A–D/BACKLOG/PERDIDO (ex.: F) → fase, situação ou ignorar |
| `projects` | cadastro, fase, situação, origem, provisoriedade, soft delete |
| `receivables` | valores, campos operacionais, `source_*`, `source_version`, `sync_status`, soft delete |
| `audit_logs` | imutável (UPDATE/DELETE bloqueados por trigger); before/after JSONB |
| `sync_runs`, `sync_queue` | execuções de importação/sincronização e fila de write-back |

Views: `v_projects_enriched`, `v_receivables_enriched` (saldos, situações financeiras, `is_overdue`, `deadline_overdue`, `search_text` sem acentos), `v_data_quality_issues`. Migrations em `supabase/migrations/0001…0003`.

## 4. Permissões

| | Viewer | Operator | Master Admin |
|---|---|---|---|
| Visão Geral, Cobranças, filtros, exportar | ✓ | ✓ | ✓ |
| Etapa, Responsável, Prazo, Motivo, Ação | — | ✓ (via `rpc_update_receivable_operational`) | ✓ |
| Projeto, fase, situação, valores, recebimentos, competência, origem | — | — | ✓ |
| Usuários, sincronização, conflitos, Auditoria | — | — | ✓ |

Anon: nenhum acesso. Ninguém faz UPDATE direto em `projects`/`receivables` — só RPCs `security definer`. O último Master Admin ativo não pode ser desativado (trigger). Versionamento otimista: as RPCs recebem `expected_version` e rejeitam se `source_version` mudou.

## 5. Configurar o Supabase

1. Crie o projeto. **Authentication → Providers → Email**: desligue *Enable sign ups* e *Confirm email*.
2. **SQL Editor**: execute, na ordem, `0001_schema.sql`, `0002_views_rpc.sql`, `0003_rls_seed.sql`.
3. Copie `.env.example` → `.env.local` e preencha URL, anon key e service_role key.
4. `npm install && npm run dev`.

## 6. Criar o Master Admin

**Authentication → Users → Add user**: e-mail, senha temporária, *Auto Confirm* e, em User Metadata:
```json
{ "full_name": "Nome", "role": "master_admin", "must_change_password": true }
```
O trigger `handle_new_user` cria o `profile`. No primeiro login a plataforma redireciona para `/alterar-senha`.

## 7. Google Service Account

Google Cloud Console → APIs & Services → ative **Google Sheets API** → Credentials → Service Account → chave JSON. Guarde o JSON; ele não entra no repositório nem no Next.

## 8. Compartilhar a planilha

Compartilhe a planilha com o `client_email` da Service Account como **Editor** (necessário para o write-back e a coluna `ID_COBRANCA`).

## 9. Cadastrar os secrets

```
supabase secrets set GOOGLE_SERVICE_ACCOUNT_JSON="$(cat service-account.json)"
supabase secrets set GOOGLE_SPREADSHEET_ID=<id da URL da planilha>
supabase functions deploy
```
Até isso ser feito, a aba **Auditoria → Sincronizações** mostra "Configuração pendente". Teste com `google-sheets-health-check` (lista as abas encontradas).

## 10–15. Preview, competências, IDs, importação, reconciliação, produção

Fluxo previsto (wizard da FASE 3, ver `docs/fase-3-google-sheets.md`): health-check → listar abas → confirmar mês/ano de cada aba em `sheet_competence_map` → preview (parser das duas linhas, fases encontradas, inconsistências, IDs presentes/ausentes/duplicados, coluna técnica que será usada) → **autorização explícita** → gerar `ID_COBRANCA` nas duas linhas → importar → reconciliar com a aba Dashboard (tolerância R$ 0,01, divergências exibidas, nunca corrigidas em silêncio) → ativar. Nada é escrito na planilha antes da aprovação do Master Admin. **Estado: apenas o health-check está implementado.**

## 16. Criar usuários

Auditoria → Usuários → *Criar usuário* (nome, e-mail, perfil, senha temporária). A senha não é exibida novamente; o usuário troca no primeiro login. Também: ativar/desativar, resetar senha, alterar perfil, vincular a responsável legado.

## 17. Erros de sincronização

Auditoria → Sincronizações lista `sync_runs` e a fila. Falha de write-back não destrói a alteração local: ela fica em `sync_queue` com `sync_status = pending|error` e destaque na tabela de Cobranças; *Tentar novamente* reprocessa. Conflito (`conflict`) exibe valor aberto × atual × tentado para resolução manual.

## 18. Substituir o Google Sheets pela base financeira

Implementar `FinancialDatabaseAdapter` (`src/integrations/receivables-source/financialDatabaseAdapter.ts`) com o mesmo contrato e trocar o adaptador em `index.ts`. Registros passam a `origin = future_financial_database`; projetos provisórios são vinculados via *Vincular a registro oficial* (sem duplicar valores, sem mesclar por nome). Frontend, RLS, RPCs e auditoria não mudam.

## Comandos

`npm run dev` · `npm run build` · `npm run typecheck` · `npm run test` · `npm run seed:dev` (dados claramente fictícios `[DEV]`, exige `ALLOW_DEV_SEED=1`; produção usa a importação real).
