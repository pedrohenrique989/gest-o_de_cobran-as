"use client";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
export const Drawer = ({ aberto, titulo, subtitulo, onFechar, children }: { aberto: boolean; titulo: string; subtitulo?: string; onFechar: () => void; children: React.ReactNode }) => (
  <>
    <div className={cn("fixed inset-0 z-30 bg-navy/30 transition-opacity", aberto ? "opacity-100" : "pointer-events-none opacity-0")} onClick={onFechar} />
    <aside className={cn("fixed inset-y-0 right-0 z-40 flex w-full max-w-[640px] flex-col bg-white shadow-xl transition-transform", aberto ? "translate-x-0" : "translate-x-full")} aria-hidden={!aberto}>
      <div className="flex items-start justify-between border-b border-line px-5 py-3">
        <div><h2 className="text-[15px] font-semibold text-navy">{titulo}</h2>{subtitulo && <p className="text-[12px] text-ink-muted">{subtitulo}</p>}</div>
        <button onClick={onFechar} className="text-ink-faint hover:text-ink" aria-label="Fechar"><X size={18} /></button>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4">{aberto && children}</div>
    </aside>
  </>
);
