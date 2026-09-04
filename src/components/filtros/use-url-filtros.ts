"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
/** Filtros persistidos na URL (compartilháveis, sobrevivem ao reload). */
export function useUrlFiltros() {
  const router = useRouter(); const path = usePathname(); const sp = useSearchParams();
  const get = useCallback((k: string) => sp.get(k) ?? "", [sp]);
  const set = useCallback((patch: Record<string, string | null | undefined>) => {
    const p = new URLSearchParams(sp.toString());
    Object.entries(patch).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)));
    if (!("page" in patch)) p.delete("page");
    router.push(`${path}?${p.toString()}`);
  }, [router, path, sp]);
  const limpar = useCallback(() => router.push(path), [router, path]);
  return { get, set, limpar, sp };
}
