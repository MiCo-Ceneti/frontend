import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  className,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight font-mono">{value}</p>
        </div>
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-md bg-secondary")}>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}
