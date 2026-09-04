import { cn } from "@/lib/utils";
export type Tom = "neutral" | "green" | "blue" | "red" | "orange";
export const Badge = ({ tom = "neutral", children, className, title }: { tom?: Tom; children: React.ReactNode; className?: string; title?: string }) =>
  <span title={title} className={cn("badge", `b-${tom}`, className)}>{children}</span>;
