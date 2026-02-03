import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ExternalLink, Plus, RefreshCw, Settings } from "lucide-react";

interface Marketplace {
  id: string;
  name: string;
  logo: string;
  connected: boolean;
  accounts: number;
  listings: number;
  sales: number;
  lastSync?: string;
  status: "active" | "error" | "syncing";
}

const marketplaces: Marketplace[] = [
  {
    id: "mercadolivre",
    name: "Mercado Livre",
    logo: "🛒",
    connected: true,
    accounts: 2,
    listings: 245,
    sales: 156,
    lastSync: "há 5 min",
    status: "active",
  },
  {
    id: "shopee",
    name: "Shopee",
    logo: "🧡",
    connected: true,
    accounts: 1,
    listings: 180,
    sales: 78,
    lastSync: "há 12 min",
    status: "active",
  },
  {
    id: "olx",
    name: "OLX",
    logo: "📦",
    connected: false,
    accounts: 0,
    listings: 0,
    sales: 0,
    status: "active",
  },
];

const statusConfig = {
  active: { label: "Ativo", className: "bg-success/20 text-success" },
  error: { label: "Erro", className: "bg-destructive/20 text-destructive" },
  syncing: { label: "Sincronizando", className: "bg-info/20 text-info" },
};

const Marketplaces = () => {
  return (
    <AppLayout title="Marketplaces" description="Gerencie suas integrações com marketplaces">
      <div className="space-y-6">
        {/* Connected Marketplaces */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {marketplaces.map((mp) => (
            <Card key={mp.id} className="relative overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-muted text-2xl">
                      {mp.logo}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{mp.name}</CardTitle>
                      {mp.connected && (
                        <p className="text-xs text-muted-foreground">
                          {mp.accounts} conta{mp.accounts > 1 ? "s" : ""} conectada{mp.accounts > 1 ? "s" : ""}
                        </p>
                      )}
                    </div>
                  </div>
                  <Switch checked={mp.connected} />
                </div>
              </CardHeader>
              <CardContent>
                {mp.connected ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-2xl font-bold">{mp.listings}</p>
                        <p className="text-xs text-muted-foreground">Anúncios</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-2xl font-bold">{mp.sales}</p>
                        <p className="text-xs text-muted-foreground">Vendas</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Badge className={statusConfig[mp.status].className}>
                          {statusConfig[mp.status].label}
                        </Badge>
                        <span className="text-muted-foreground">
                          Sincronizado {mp.lastSync}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      Conecte sua conta para começar a vender
                    </p>
                    <Button className="gap-2">
                      <Plus className="w-4 h-4" />
                      Conectar Conta
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center p-4 rounded-lg bg-muted/30">
                <p className="text-3xl font-bold text-primary">425</p>
                <p className="text-sm text-muted-foreground">Anúncios Ativos</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/30">
                <p className="text-3xl font-bold text-success">234</p>
                <p className="text-sm text-muted-foreground">Vendas no Mês</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/30">
                <p className="text-3xl font-bold text-info">12</p>
                <p className="text-sm text-muted-foreground">Perguntas Pendentes</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/30">
                <p className="text-3xl font-bold">98%</p>
                <p className="text-sm text-muted-foreground">Taxa de Sincronização</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Marketplaces;
