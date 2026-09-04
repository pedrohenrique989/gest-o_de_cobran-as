// SEED DE DESENVOLVIMENTO — dados claramente fictícios (nomes prefixados com "[DEV]", origin=platform, provisional=true).
// NÃO executar em produção: os dados reais entram pela importação do Google Sheets (FASE 3).
// Uso: npm run seed:dev  (requer SUPABASE_SERVICE_ROLE_KEY em .env.local)
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY");
if (process.env.NODE_ENV === "production" || process.env.ALLOW_DEV_SEED !== "1") throw new Error("Seed de dev bloqueado. Defina ALLOW_DEV_SEED=1 em ambiente de desenvolvimento.");
const db = createClient(url, key, { auth: { persistSession: false } });

const projetos = [
  { name: "[DEV] Projeto IFES fase A", stage: "A", hub: "IFES", min: "MPI", inst: "IFMA", fund: "FADEX", vals: [[180000, 36000, 180000, 36000], [180000, 36000, 0, 0]] },
  { name: "[DEV] Projeto IFES fase C", stage: "C", hub: "IFES", min: "MTUR", inst: "IFTO", fund: "FAPTO", vals: [[95000, 19000, 0, 0], [95000, 19000, 0, 0]] },
  { name: "[DEV] Projeto GOV fase D", stage: "D", hub: "GOV", min: "Pernambuco", inst: null, fund: "FADEX", vals: [[320000, 64000, 0, 0], [320000, 64000, 0, 0]] },
  { name: "[DEV] Projeto GOV parcial", stage: "B", hub: "GOV", min: "Maranhão", inst: null, fund: "FUNCERN", vals: [[150000, 30000, 75000, 30000], [150000, 30000, 0, 0]] },
];
const competencias = ["2026-08-01", "2026-09-01"];

async function main() {
  const { data: stages } = await db.from("project_stage_catalog").select("id, code");
  const stageId = (c: string) => stages!.find((s) => s.code === c)!.id;
  for (const p of projetos) {
    const { data: ex } = await db.from("projects").select("id").eq("name", p.name).maybeSingle();
    let id = ex?.id;
    if (!id) {
      const { data, error } = await db.from("projects").insert({
        name: p.name, normalized_name: p.name.toLowerCase(), search_text: `${p.name} ${p.min} ${p.inst ?? ""} ${p.fund}`.toLowerCase(),
        project_stage_id: stageId(p.stage), project_status: "active", hub: p.hub, ministry_government: p.min, institute: p.inst, foundation: p.fund,
        origin: "platform", provisional: true, notes: "Seed de desenvolvimento",
      }).select("id").single();
      if (error) throw error; id = data.id;
    }
    const rows = competencias.map((competence, i) => ({
      project_id: id, competence, planned_project: p.vals[i][0], planned_innovatis: p.vals[i][1], received_project: p.vals[i][2], received_innovatis: p.vals[i][3],
      origin: "platform", provisional: true, source_type: "platform", sync_status: "platform_only",
    }));
    const { error } = await db.from("receivables").upsert(rows, { onConflict: "project_id,competence" });
    if (error) throw error;
  }
  console.log(`Seed dev: ${projetos.length} projetos × ${competencias.length} competências.`);
}
main().catch((e) => { console.error(e); process.exit(1); });
