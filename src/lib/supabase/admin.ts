import "server-only";
import { createClient } from "@supabase/supabase-js";
/** service_role — SÓ servidor (Auth Admin API: criar usuário, resetar senha). "server-only" quebra o build se importado no client. */
export const createAdminClient = () => {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, { auth: { autoRefreshToken: false, persistSession: false } });
};
