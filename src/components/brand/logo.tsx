import { cn } from "@/lib/utils";

export function Logo({ className, subtitle = true }: { className?: string; subtitle?: boolean }) {
  return (
    <div className={cn("flex items-baseline gap-2", className)}>
      <span className="text-xl font-semibold tracking-tight">
        Mi<span className="text-muted-foreground">Co</span>
      </span>
      {subtitle && (
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          / Ceneti
        </span>
      )}
    </div>
  );
}
