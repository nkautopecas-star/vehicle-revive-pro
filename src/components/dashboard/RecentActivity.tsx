import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Package, ShoppingCart, MessageSquare, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useRecentActivity, type RecentActivityItem } from "@/hooks/useDashboardData";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const activityConfig = {
  sale: {
    icon: ShoppingCart,
    title: "Venda realizada",
    iconColor: "text-success",
    bgColor: "bg-success/10",
  },
  question: {
    icon: MessageSquare,
    title: "Nova pergunta",
    iconColor: "text-info",
    bgColor: "bg-info/10",
  },
  vehicle: {
    icon: Car,
    title: "Veículo cadastrado",
    iconColor: "text-primary",
    bgColor: "bg-primary/10",
  },
  stock: {
    icon: AlertCircle,
    title: "Estoque baixo",
    iconColor: "text-warning",
    bgColor: "bg-warning/10",
  },
  part: {
    icon: Package,
    title: "Peça adicionada",
    iconColor: "text-muted-foreground",
    bgColor: "bg-muted",
  },
};

export function RecentActivity() {
  const { data: activities, isLoading } = useRecentActivity();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Atividade Recente</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : !activities || activities.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            Nenhuma atividade recente
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => {
              const config = activityConfig[activity.type];
              const Icon = config.icon;
              return (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className={cn("flex items-center justify-center w-9 h-9 rounded-lg shrink-0", config.bgColor)}>
                    <Icon className={cn("w-4 h-4", config.iconColor)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(activity.time, { addSuffix: true, locale: ptBR })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
