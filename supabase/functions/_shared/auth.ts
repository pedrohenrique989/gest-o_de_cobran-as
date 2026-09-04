// Valida o JWT do chamador e exige master_admin (o servidor sempre revalida a permissão).
import { createClient } from "npm:@supabase/supabase-js@2";

export async function requireMasterAdmin(req: Request) {
  const auth = req.headers.get("Authorization") ?? "";
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  const { data: profile } = await supabase.from("profiles").select("role, active").eq("user_id", user.id).single();
  if (!profile?.active || profile.role !== "master_admin") throw new Error("Somente Master Admin");
  return { user, supabase };
}
