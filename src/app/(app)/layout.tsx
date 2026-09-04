import { redirect } from "next/navigation";
import { perfilAtual } from "@/services/authService";
import { Sidebar } from "@/components/layout/sidebar";
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const perfil = await perfilAtual();
  if (perfil.must_change_password) redirect("/alterar-senha");
  return <div className="min-h-screen"><Sidebar role={perfil.role} /><div className="pl-52">{children}</div></div>;
}
