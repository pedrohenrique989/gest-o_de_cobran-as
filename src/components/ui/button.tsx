import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
const v = cva("inline-flex items-center justify-center gap-1.5 rounded text-[13px] font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap", {
  variants: { variant: { primary: "bg-action text-white hover:bg-action-hover", outline: "border border-line bg-white hover:bg-canvas", ghost: "text-ink-muted hover:bg-canvas hover:text-ink", danger: "bg-danger text-white hover:bg-danger/90" }, size: { sm: "h-7 px-2.5 text-[12px]", md: "h-8 px-3", lg: "h-10 px-4" } },
  defaultVariants: { variant: "primary", size: "md" } });
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof v> {}
export const Button = ({ className, variant, size, ...p }: ButtonProps) => <button className={cn(v({ variant, size }), className)} {...p} />;
