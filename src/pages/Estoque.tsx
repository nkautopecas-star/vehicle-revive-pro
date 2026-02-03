import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Search,
  Filter,
  ArrowUpDown,
  RefreshCw
} from "lucide-react";

interface StockItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  minQuantity: number;
  location: string;
  lastSale: string;
  turnover: "high" | "medium" | "low";
}

const stockItems: StockItem[] = [
  { id: "1", name: "Motor Completo", category: "Motor", quantity: 3, minQuantity: 2, location: "A1-E2", lastSale: "há 2 dias", turnover: "high" },
  { id: "2", name: "Câmbio Automático", category: "Transmissão", quantity: 2, minQuantity: 2, location: "A2-E1", lastSale: "há 3 dias", turnover: "high" },
  { id: "3", name: "Farol LED", category: "Iluminação", quantity: 15, minQuantity: 5, location: "B1-E3", lastSale: "há 1 dia", turnover: "high" },
  { id: "4", name: "Painel de Instrumentos", category: "Interior", quantity: 1, minQuantity: 3, location: "C1-E2", lastSale: "há 7 dias", turnover: "medium" },
  { id: "5", name: "Porta Dianteira", category: "Carroceria", quantity: 8, minQuantity: 4, location: "D1-E1", lastSale: "há 4 dias", turnover: "medium" },
  { id: "6", name: "Alternador", category: "Elétrica", quantity: 12, minQuantity: 5, location: "A3-E2", lastSale: "há 2 dias", turnover: "high" },
  { id: "7", name: "Radiador", category: "Arrefecimento", quantity: 0, minQuantity: 2, location: "B2-E1", lastSale: "há 14 dias", turnover: "low" },
  { id: "8", name: "Bomba de Combustível", category: "Combustível", quantity: 6, minQuantity: 3, location: "C2-E3", lastSale: "há 5 dias", turnover: "medium" },
];

const turnoverConfig = {
  high: { label: "Alto", className: "bg-success/20 text-success", icon: TrendingUp },
  medium: { label: "Médio", className: "bg-warning/20 text-warning", icon: ArrowUpDown },
  low: { label: "Baixo", className: "bg-destructive/20 text-destructive", icon: TrendingDown },
};

const Estoque = () => {
  const lowStockItems = stockItems.filter((item) => item.quantity <= item.minQuantity);
  const outOfStockItems = stockItems.filter((item) => item.quantity === 0);
  const totalItems = stockItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <AppLayout title="Estoque" description="Controle inteligente de estoque">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalItems}</p>
                <p className="text-xs text-muted-foreground">Itens em Estoque</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-warning/10">
                <AlertTriangle className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{lowStockItems.length}</p>
                <p className="text-xs text-muted-foreground">Estoque Baixo</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-destructive/10">
                <Package className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{outOfStockItems.length}</p>
                <p className="text-xs text-muted-foreground">Sem Estoque</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-success/10">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">92%</p>
                <p className="text-xs text-muted-foreground">Taxa de Sincronização</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Alert Banner */}
        {lowStockItems.length > 0 && (
          <Card className="border-warning/50 bg-warning/5">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                  <div>
                    <p className="font-medium">Atenção: {lowStockItems.length} itens com estoque baixo</p>
                    <p className="text-sm text-muted-foreground">
                      {outOfStockItems.length > 0 && `${outOfStockItems.length} sem estoque. `}
                      Anúncios serão pausados automaticamente.
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Ver Detalhes</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar no estoque..." className="pl-9" />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="w-4 h-4" />
          </Button>
          <Button variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Sincronizar
          </Button>
        </div>

        {/* Stock Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {stockItems.map((item) => {
            const stockPercentage = Math.min((item.quantity / (item.minQuantity * 2)) * 100, 100);
            const isLow = item.quantity <= item.minQuantity;
            const isOut = item.quantity === 0;
            const TurnoverIcon = turnoverConfig[item.turnover].icon;

            return (
              <Card key={item.id} className={cn(
                "transition-all",
                isOut && "border-destructive/50",
                isLow && !isOut && "border-warning/50"
              )}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{item.name}</CardTitle>
                      <CardDescription>{item.category}</CardDescription>
                    </div>
                    <Badge className={turnoverConfig[item.turnover].className}>
                      <TurnoverIcon className="w-3 h-3 mr-1" />
                      {turnoverConfig[item.turnover].label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-baseline justify-between mb-2">
                        <span className={cn(
                          "text-3xl font-bold",
                          isOut && "text-destructive",
                          isLow && !isOut && "text-warning"
                        )}>
                          {item.quantity}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          min. {item.minQuantity}
                        </span>
                      </div>
                      <Progress 
                        value={stockPercentage} 
                        className={cn(
                          "h-2",
                          isOut && "[&>div]:bg-destructive",
                          isLow && !isOut && "[&>div]:bg-warning"
                        )} 
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>📍 {item.location}</span>
                      <span>Última venda: {item.lastSale}</span>
                    </div>
                    {isOut && (
                      <Badge variant="destructive" className="w-full justify-center">
                        Anúncios Pausados
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
};

export default Estoque;
