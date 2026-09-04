"use client";
import { useActionState } from "react";
import { alterarSenhaAction, type FormState } from "@/services/authActions";
import { Button } from "@/components/ui/button";
import { Erro } from "@/components/ui/basicos";
export default function AlterarSenhaPage() {
  const [state, action, pending] = useActionState<FormState, FormData>(alterarSenhaAction, {});
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <form action={action} className="panel w-full max-w-sm p-6">
        <h2 className="text-[16px] font-semibold">Defina sua nova senha</h2><p className="mb-5 text-[12px] text-ink-muted">Por segurança, a senha temporária precisa ser substituída no primeiro acesso.</p>
        <label className="lbl mb-3">Nova senha<input name="senha" type="password" required minLength={8} autoComplete="new-password" className="field mt-1" /></label>
        <label className="lbl mb-4">Confirmar<input name="confirmar" type="password" required minLength={8} autoComplete="new-password" className="field mt-1" /></label>
        <div className="mb-3"><Erro msg={state.erro} /></div>
        <Button type="submit" size="lg" className="w-full" disabled={pending}>{pending ? "Salvando…" : "Salvar e continuar"}</Button>
      </form>
    </main>
  );
}
