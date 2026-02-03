import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Link2, 
  ExternalLink,
  Settings,
  CheckCircle,
  AlertCircle,
  Zap
} from "lucide-react";

const integrations = [
  {
    id: "mercadolivre",
    name: "Mercado Livre",
    description: "API oficial para anúncios e vendas",
    icon: "🛒",
    connected: true,
    accounts: 2,
    category: "marketplace",
  },
  {
    id: "shopee",
    name: "Shopee",
    description: "Integração completa com Shopee Sellers",
    icon: "🧡",
    connected: true,
    accounts: 1,
    category: "marketplace",
  },
  {
    id: "olx",
    name: "OLX",
    description: "Publicação de anúncios na OLX",
    icon: "📦",
    connected: false,
    accounts: 0,
    category: "marketplace",
  },
  {
    id: "bling",
    name: "Bling",
    description: "ERP e emissão de notas fiscais",
    icon: "📋",
    connected: true,
    accounts: 1,
    category: "erp",
  },
  {
    id: "tiny",
    name: "Tiny ERP",
    description: "Sistema de gestão empresarial",
    icon: "📊",
    connected: false,
    accounts: 0,
    category: "erp",
  },
  {
    id: "correios",
    name: "Correios",
    description: "Cálculo de frete e rastreamento",
    icon: "📬",
    connected: true,
    accounts: 1,
    category: "logistics",
  },
  {
    id: "melhorenvio",
    name: "Melhor Envio",
    description: "Gestão de fretes e transportadoras",
    icon: "🚚",
    connected: false,
    accounts: 0,
    category: "logistics",
  },
];

const categories = {
  marketplace: { label: "Marketplaces", description: "Plataformas de venda" },
  erp: { label: "ERP & Fiscal", description: "Gestão e notas fiscais" },
  logistics: { label: "Logística", description: "Frete e entregas" },
};

const Integracoes = () => {
  const categorizedIntegrations = Object.entries(categories).map(([key, value]) => ({
    ...value,
    key,
    items: integrations.filter((i) => i.category === key),
  }));

  return (
    <AppLayout title="Integrações" description="Gerencie todas as suas integrações">
      <div className="space-y-8">
        {categorizedIntegrations.map((category) => (
          <div key={category.key}>
            <div className="mb-4">
              <h2 className="text-lg font-semibold">{category.label}</h2>
              <p className="text-sm text-muted-foreground">{category.description}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {category.items.map((integration) => (
                <Card key={integration.id} className="relative overflow-hidden">
                  <CardContent className="py-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-muted text-2xl">
                          {integration.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold">{integration.name}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {integration.description}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {integration.connected ? (
                          <>
                            <Badge className="bg-success/20 text-success">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Conectado
                            </Badge>
                            {integration.accounts > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {integration.accounts} conta{integration.accounts > 1 ? "s" : ""}
                              </span>
                            )}
                          </>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Não conectado
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {integration.connected && (
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Settings className="w-4 h-4" />
                          </Button>
                        )}
                        <Button 
                          variant={integration.connected ? "ghost" : "default"} 
                          size={integration.connected ? "icon" : "sm"}
                          className={integration.connected ? "h-8 w-8" : "gap-2"}
                        >
                          {integration.connected ? (
                            <ExternalLink className="w-4 h-4" />
                          ) : (
                            <>
                              <Zap className="w-4 h-4" />
                              Conectar
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}

        {/* Webhooks Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="w-5 h-5 text-primary" />
              Webhooks
            </CardTitle>
            <CardDescription>
              Configure webhooks para receber notificações em tempo real
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Nenhum webhook configurado
              </p>
              <Button variant="outline">Adicionar Webhook</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Integracoes;
