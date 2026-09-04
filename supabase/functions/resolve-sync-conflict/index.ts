// FASE 3 — resolve-sync-conflict
// Contrato: ver src/integrations/receivables-source/types.ts e docs/fase-3-google-sheets.md.
// Estado: NÃO IMPLEMENTADA. Responde 501 para a plataforma exibir "Configuração pendente" sem inventar resultados.
import { requireMasterAdmin } from "../_shared/auth.ts";
import { json, loadConfig } from "../_shared/google.ts";

Deno.serve(async (req) => {
  try { await requireMasterAdmin(req); } catch (e) { return json({ error: (e as Error).message }, 401); }
  const cfg = loadConfig();
  if ("missing" in cfg) return json({ error: `Configuração pendente: secrets ausentes (${cfg.missing.join(", ")})` }, 503);
  return json({ error: "Função da FASE 3 ainda não implementada (resolve-sync-conflict)." }, 501);
});
