import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    trend: "up" | "down";
  };
  icon: ReactNode;
  description?: string;
}

export function StatCard({ title, value, change, icon, description }: StatCardProps) {
  return (
    <div className="stat-card group animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="metric-value">{value}</p>
          {change && (
            <div className="flex items-center gap-1">
              {change.trend === "up" ? (
                <TrendingUp className="w-4 h-4 text-success" />
              ) : (
                <TrendingDown className="w-4 h-4 text-destructive" />
              )}
              <span
                className={cn(
                  "text-sm font-medium",
                  change.trend === "up" ? "text-success" : "text-destructive"
                )}
              >
                {change.value > 0 ? "+" : ""}{change.value}%
              </span>
              <span className="text-xs text-muted-foreground">vs mês anterior</span>
            </div>
          )}
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
          {icon}
        </div>
      </div>
    </div>
  );
}
