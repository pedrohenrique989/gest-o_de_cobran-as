import { LogOut } from "lucide-react";
import { logoutAction } from "@/services/authActions";
import { ultimaSync } from "@/services/auditService";
import { fmtDataHora } from "@/lib/format";
import { Badge, type Tom } from "@/components/ui/badge";
import { ROLE_LABEL, type Profile } from "@/types/domain";
const tomSync: Record<string, [Tom, string]> = { success: ["green", "Sincronizado"], running: ["orange", "Pendente"], partial: ["orange", "Pendente"], error: ["red", "Erro"], not_configured: ["orange", "Configuração pendente"] };
export const Topbar = async ({ titulo, perfil, extra }: { titulo: string; perfil: Profile; extra?: React.ReactNode }) => {
  const s = await ultimaSync(); const [tom, label] = tomSync[s.status] ?? ["neutral", s.status];
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-line bg-white px-6">
      <div className="flex items-center gap-4"><h1 className="text-[16px] font-semibold text-navy">{titulo}</h1>{extra}</div>
      <div className="flex items-center gap-5">
        <div className="text-right text-[11px] text-ink-faint">Última sincronização<div className="flex items-center justify-end gap-1.5 text-ink"><Badge tom={tom}>{label}</Badge>{s.finished_at && <span>{fmtDataHora(s.finished_at)}</span>}</div></div>
        <div className="text-right leading-tight"><div className="text-[13px] font-medium">{perfil.full_name}</div><div className="text-[11px] text-ink-faint">{perfil.email} · {ROLE_LABEL[perfil.role]}</div></div>
        <form action={logoutAction}><button className="rounded p-1.5 text-ink-faint hover:bg-canvas hover:text-ink" title="Sair"><LogOut size={15} /></button></form>
      </div>
    </header>
  );
};
