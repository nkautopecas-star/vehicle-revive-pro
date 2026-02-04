import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useMarketplaceStats } from "@/hooks/useDashboardData";

export function MarketplaceStats() {
  const { data: marketplaces, isLoading } = useMarketplaceStats();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Vendas por Marketplace</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : !marketplaces || marketplaces.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            Nenhum marketplace conectado
          </div>
        ) : marketplaces.every((mp) => mp.sales === 0) ? (
          <div className="py-8 text-center text-muted-foreground">
            Nenhuma venda via marketplace ainda
          </div>
        ) : (
          marketplaces.map((mp) => (
            <div key={mp.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${mp.color}`} />
                  <span className="font-medium text-sm">{mp.name}</span>
                </div>
                <span className="text-sm text-muted-foreground">{mp.sales} vendas</span>
              </div>
              <Progress value={mp.percentage} className="h-2" />
              <p className="text-xs text-muted-foreground">
                R$ {mp.revenue.toLocaleString("pt-BR")} ({mp.percentage}% do total)
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
