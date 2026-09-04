import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Project } from "@/types/domain";
export async function listarProjetos(incluirArquivados = false): Promise<Project[]> {
  const s = await createClient();
  let q = s.from("v_projects_enriched").select("*").order("name");
  if (!incluirArquivados) q = q.eq("active", true);
  const { data } = await q; return (data as Project[]) ?? [];
}
export async function obterProjeto(id: string): Promise<Project | null> {
  const s = await createClient(); const { data } = await s.from("v_projects_enriched").select("*").eq("id", id).maybeSingle<Project>(); return data ?? null;
}
