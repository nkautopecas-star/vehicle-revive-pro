import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Link2, 
  Loader2
} from "lucide-react";
import { useMercadoLivre } from "@/hooks/useMercadoLivre";
import { useOLX } from "@/hooks/useOLX";
import { MLAccountCard } from "@/components/integrations/MLAccountCard";
import { MLConnectCard } from "@/components/integrations/MLConnectCard";
import { OLXAccountCard } from "@/components/integrations/OLXAccountCard";
import { OLXConnectCard } from "@/components/integrations/OLXConnectCard";

const otherIntegrations = [
  {
    id: "shopee",
    name: "Shopee",
    description: "Integração completa com Shopee Sellers",
    icon: "🧡",
    connected: false,
    accounts: 0,
    category: "marketplace",
  },
  {
    id: "bling",
    name: "Bling",
    description: "ERP e emissão de notas fiscais",
    icon: "📋",
    connected: false,
    accounts: 0,
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
    connected: false,
    accounts: 0,
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
  erp: { label: "ERP & Fiscal", description: "Gestão e notas fiscais" },
  logistics: { label: "Logística", description: "Frete e entregas" },
};

const Integracoes = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [processingCode, setProcessingCode] = useState(false);
  
  const { 
    accounts: mlAccounts, 
    isLoadingAccounts: isLoadingMLAccounts,
    isConnecting: isConnectingML,
    startOAuth: startMLOAuth,
    exchangeCode: exchangeMLCode,
    syncAll,
    isSyncing 
  } = useMercadoLivre();

  const {
    accounts: olxAccounts,
    isLoadingAccounts: isLoadingOLXAccounts,
    isConnecting: isConnectingOLX,
    startOAuth: startOLXOAuth,
    exchangeCode: exchangeOLXCode,
  } = useOLX();

  // Handle OAuth callback
  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    
    if (code && !processingCode) {
      setProcessingCode(true);
      
      // Determine which marketplace based on state or URL params
      // OLX might add a specific state or we can check for OLX-specific params
      const isOLX = state?.includes('olx') || searchParams.get('source') === 'olx';
      
      const exchangePromise = isOLX 
        ? exchangeOLXCode(code) 
        : exchangeMLCode(code);
      
      exchangePromise
        .then(() => {
          setSearchParams({});
        })
        .catch(() => {
          setSearchParams({});
        })
        .finally(() => {
          setProcessingCode(false);
        });
    }
  }, [searchParams, exchangeMLCode, exchangeOLXCode, setSearchParams, processingCode]);

  const categorizedIntegrations = Object.entries(categories).map(([key, value]) => ({
    ...value,
    key,
    items: otherIntegrations.filter((i) => i.category === key),
  }));

  return (
    <AppLayout title="Integrações" description="Gerencie todas as suas integrações">
      <div className="space-y-8">
        {/* Mercado Livre Section */}
        <div>
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Mercado Livre</h2>
            <p className="text-sm text-muted-foreground">
              Sincronize peças, preços e responda perguntas automaticamente
            </p>
          </div>
          
          {isLoadingMLAccounts ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mlAccounts?.map((account) => (
                <MLAccountCard
                  key={account.id}
                  account={account}
                  onSync={syncAll}
                  isSyncing={isSyncing}
                />
              ))}
              <MLConnectCard 
                onConnect={startMLOAuth} 
                isConnecting={isConnectingML || processingCode} 
              />
            </div>
          )}
        </div>

        {/* OLX Section */}
        <div>
          <div className="mb-4">
            <h2 className="text-lg font-semibold">OLX</h2>
            <p className="text-sm text-muted-foreground">
              Publique anúncios automaticamente na OLX Brasil
            </p>
          </div>
          
          {isLoadingOLXAccounts ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {olxAccounts?.map((account) => (
                <OLXAccountCard
                  key={account.id}
                  account={account}
                />
              ))}
              <OLXConnectCard 
                onConnect={startOLXOAuth} 
                isConnecting={isConnectingOLX || processingCode} 
              />
            </div>
          )}
        </div>

        {/* Other Marketplaces */}
        <div>
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Outros Marketplaces</h2>
            <p className="text-sm text-muted-foreground">Em breve</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {otherIntegrations
              .filter((i) => i.category === 'marketplace')
              .map((integration) => (
                <Card key={integration.id} className="relative overflow-hidden opacity-60">
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
                      <Badge variant="outline" className="text-muted-foreground">
                        Em breve
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>

        {/* Other Categories */}
        {categorizedIntegrations.map((category) => (
          <div key={category.key}>
            <div className="mb-4">
              <h2 className="text-lg font-semibold">{category.label}</h2>
              <p className="text-sm text-muted-foreground">{category.description}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {category.items.map((integration) => (
                <Card key={integration.id} className="relative overflow-hidden opacity-60">
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
                      <Badge variant="outline" className="text-muted-foreground">
                        Em breve
                      </Badge>
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
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm font-medium mb-2">URL do Webhook Mercado Livre:</p>
                <code className="text-xs bg-background px-2 py-1 rounded border">
                  {import.meta.env.VITE_SUPABASE_URL}/functions/v1/ml-webhook
                </code>
                <p className="text-xs text-muted-foreground mt-2">
                  Configure esta URL nas notificações da sua aplicação no Portal de Desenvolvedores do Mercado Livre
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Integracoes;
