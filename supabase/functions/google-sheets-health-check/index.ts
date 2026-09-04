// Testa secrets + acesso à planilha e lista as abas. Não lê dados, não escreve nada.
import { requireMasterAdmin } from "../_shared/auth.ts";
import { accessToken, json, loadConfig, sheetsGet } from "../_shared/google.ts";

Deno.serve(async (req) => {
  try { await requireMasterAdmin(req); } catch (e) { return json({ configured: false, healthy: false, message: (e as Error).message }, 401); }
  const cfg = loadConfig();
  if ("missing" in cfg) return json({ configured: false, healthy: false, message: `Configuração pendente: secrets ausentes (${cfg.missing.join(", ")})` });
  try {
    const token = await accessToken(cfg, "https://www.googleapis.com/auth/spreadsheets.readonly");
    const meta = await sheetsGet<{ properties: { title: string }; sheets: { properties: { title: string; gridProperties: { rowCount: number; columnCount: number } } }[] }>(cfg, token, "?fields=properties.title,sheets.properties");
    return json({ configured: true, healthy: true, message: `Acesso OK: "${meta.properties.title}" (${meta.sheets.length} abas)`,
      spreadsheetTitle: meta.properties.title, serviceAccount: cfg.clientEmail,
      sheets: meta.sheets.map((s) => ({ name: s.properties.title, rows: s.properties.gridProperties.rowCount, cols: s.properties.gridProperties.columnCount })) });
  } catch (e) {
    return json({ configured: true, healthy: false, message: `Falha de acesso: ${(e as Error).message}. Verifique se a planilha foi compartilhada com ${cfg.clientEmail}.` });
  }
});
