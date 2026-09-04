import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AppRole, Profile } from "@/types/domain";

export const perfilAtual = cache(async (): Promise<Profile> => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle<Profile>();
  if (!data || !data.active) { await supabase.auth.signOut(); redirect("/login?inativo=1"); }
  return data;
});
export async function exigirPapel(...papeis: AppRole[]): Promise<Profile> {
  const p = await perfilAtual();
  if (!papeis.includes(p.role)) throw new Error("Sem permissão para esta operação.");
  return p;
}
export const isMaster = (p: Profile) => p.role === "master_admin";
export const podeOperar = (p: Profile) => p.role === "master_admin" || p.role === "operator";
export async function listarPerfis(): Promise<Profile[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").order("full_name");
  return (data as Profile[] | null) ?? [];
}
