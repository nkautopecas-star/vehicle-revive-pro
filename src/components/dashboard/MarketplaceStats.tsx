import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const marketplaces = [
  { name: "Mercado Livre", sales: 156, revenue: 234000, percentage: 65, color: "bg-chart-1" },
  { name: "Shopee", sales: 78, revenue: 89000, percentage: 25, color: "bg-chart-2" },
  { name: "OLX", sales: 34, revenue: 45000, percentage: 10, color: "bg-chart-3" },
];

export function MarketplaceStats() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Vendas por Marketplace</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {marketplaces.map((mp) => (
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
        ))}
      </CardContent>
    </Card>
  );
}
