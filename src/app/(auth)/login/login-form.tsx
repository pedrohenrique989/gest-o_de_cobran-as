"use client";
import { useActionState } from "react";
import { loginAction, type FormState } from "@/services/authActions";
import { Button } from "@/components/ui/button";
import { Erro } from "@/components/ui/basicos";
export const LoginForm = ({ next, aviso }: { next: string; aviso?: string }) => {
  const [state, action, pending] = useActionState<FormState, FormData>(loginAction, {});
  return (
    <form action={action} className="panel w-full max-w-sm p-6">
      <h2 className="text-[16px] font-semibold">Entrar</h2><p className="mb-5 text-[12px] text-ink-muted">Use seu e-mail corporativo.</p>
      <input type="hidden" name="next" value={next} />
      <label className="lbl mb-3">E-mail<input name="email" type="email" required autoComplete="email" className="field mt-1" /></label>
      <label className="lbl mb-4">Senha<input name="senha" type="password" required autoComplete="current-password" className="field mt-1" /></label>
      <div className="mb-3"><Erro msg={state.erro ?? aviso} /></div>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>{pending ? "Entrando…" : "Entrar"}</Button>
    </form>
  );
};
