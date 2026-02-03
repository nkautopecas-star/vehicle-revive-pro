import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Package, ShoppingCart, MessageSquare, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const activities = [
  {
    id: 1,
    type: "sale",
    icon: ShoppingCart,
    title: "Venda realizada",
    description: "Motor Completo - Honda Civic 2019",
    time: "há 5 min",
    iconColor: "text-success",
    bgColor: "bg-success/10",
  },
  {
    id: 2,
    type: "question",
    icon: MessageSquare,
    title: "Nova pergunta",
    description: "Mercado Livre - Farol LED VW Polo",
    time: "há 12 min",
    iconColor: "text-info",
    bgColor: "bg-info/10",
  },
  {
    id: 3,
    type: "vehicle",
    icon: Car,
    title: "Veículo cadastrado",
    description: "Toyota Corolla 2021 - ABC-1234",
    time: "há 30 min",
    iconColor: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    id: 4,
    type: "stock",
    icon: AlertCircle,
    title: "Estoque baixo",
    description: "Painel de Instrumentos - 2 unidades",
    time: "há 1 hora",
    iconColor: "text-warning",
    bgColor: "bg-warning/10",
  },
  {
    id: 5,
    type: "part",
    icon: Package,
    title: "Peça adicionada",
    description: "15 peças do Fiat Argo 2020",
    time: "há 2 horas",
    iconColor: "text-muted-foreground",
    bgColor: "bg-muted",
  },
];

export function RecentActivity() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Atividade Recente</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = activity.icon;
            return (
              <div key={activity.id} className="flex items-start gap-3">
                <div className={cn("flex items-center justify-center w-9 h-9 rounded-lg shrink-0", activity.bgColor)}>
                  <Icon className={cn("w-4 h-4", activity.iconColor)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{activity.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
