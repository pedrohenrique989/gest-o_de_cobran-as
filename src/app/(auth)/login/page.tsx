import { LoginForm } from "./login-form";
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; inativo?: string }> }) {
  const sp = await searchParams;
  return (
    <main className="flex min-h-screen">
      <div className="hidden w-[40%] flex-col justify-between bg-navy p-10 text-white lg:flex">
        <div className="text-[15px] font-bold tracking-wide">INNOVATIS</div>
        <div><h1 className="text-[28px] font-semibold leading-tight">Gestão de Cobranças</h1><p className="mt-3 max-w-sm text-[13px] text-white/70">Acompanhamento de recebíveis dos HUBs IFES e GOV.</p></div>
        <div className="text-[11px] text-white/40">Acesso restrito. Usuários são criados pelo Master Admin.</div>
      </div>
      <div className="flex flex-1 items-center justify-center p-8"><LoginForm next={sp.next ?? "/visao-geral"} aviso={sp.inativo ? "Usuário inativo. Procure o Master Admin." : undefined} /></div>
    </main>
  );
}
