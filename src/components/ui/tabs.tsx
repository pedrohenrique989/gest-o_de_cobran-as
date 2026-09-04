"use client";
import Link from "next/link";
import { cn } from "@/lib/utils";
export const Tabs = ({ itens, atual, base }: { itens: { id: string; label: string }[]; atual: string; base: string }) => (
  <div className="flex gap-1 border-b border-line">
    {itens.map((t) => <Link key={t.id} href={`${base}?tab=${t.id}`} className={cn("-mb-px border-b-2 px-3 py-2 text-[13px]", atual === t.id ? "border-action font-medium text-action" : "border-transparent text-ink-muted hover:text-ink")}>{t.label}</Link>)}
  </div>
);
