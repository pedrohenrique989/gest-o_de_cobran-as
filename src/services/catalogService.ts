import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { CollectionStatus, ProjectStage } from "@/types/domain";
export const listarFases = cache(async (): Promise<ProjectStage[]> => { const s = await createClient(); const { data } = await s.from("project_stage_catalog").select("*").eq("active", true).order("display_order"); return (data as ProjectStage[]) ?? []; });
export const listarEtapas = cache(async (): Promise<CollectionStatus[]> => { const s = await createClient(); const { data } = await s.from("collection_status_catalog").select("*").eq("active", true).order("hub").order("display_order"); return (data as CollectionStatus[]) ?? []; });
