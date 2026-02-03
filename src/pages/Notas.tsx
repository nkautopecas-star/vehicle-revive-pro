import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  FileText, 
  Building2, 
  ExternalLink,
  Settings,
  CheckCircle,
  AlertCircle
} from "lucide-react";

const integrations = [
  {
    id: "bling",
    name: "Bling",
    description: "Emissão de NF-e e gestão financeira",
    icon: "📋",
    connected: true,
    status: "active",
  },
  {
    id: "tiny",
    name: "Tiny ERP",
    description: "Sistema completo de gestão empresarial",
    icon: "📊",
    connected: false,
    status: "inactive",
  },
  {
    id: "nfe",
    name: "NFe.io",
    description: "Emissão simplificada de notas fiscais",
    icon: "📄",
    connected: false,
    status: "inactive",
  },
];

const Notas = () => {
  return (
    <AppLayout title="Notas Fiscais" description="Gerencie suas emissões de NF-e">
      <div className="space-y-6">
        {/* Integration Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Integrações Fiscais
            </CardTitle>
            <CardDescription>
              Conecte seu sistema de emissão de notas fiscais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {integrations.map((integration) => (
                <Card key={integration.id} className="relative">
                  <CardContent className="py-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-muted text-2xl">
                          {integration.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold">{integration.name}</h3>
                          <p className="text-xs text-muted-foreground">{integration.description}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      {integration.connected ? (
                        <Badge className="bg-success/20 text-success">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Conectado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Não conectado
                        </Badge>
                      )}
                      <Switch checked={integration.connected} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Notas Fiscais Recentes
                </CardTitle>
                <CardDescription>
                  Histórico de emissões via Bling
                </CardDescription>
              </div>
              <Button variant="outline" className="gap-2">
                <ExternalLink className="w-4 h-4" />
                Abrir Bling
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mx-auto mb-4">
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-4">
                Configure a integração com Bling para visualizar as notas fiscais
              </p>
              <Button variant="outline" className="gap-2">
                <Settings className="w-4 h-4" />
                Configurar Integração
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Notas;
