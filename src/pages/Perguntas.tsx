import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search, Send, Sparkles, MessageSquare, Clock, CheckCheck, Package } from "lucide-react";

interface Question {
  id: string;
  marketplace: "mercadolivre" | "shopee" | "olx";
  productName: string;
  productImage: string;
  customerName: string;
  question: string;
  status: "pending" | "answered";
  time: string;
  answer?: string;
}

const questions: Question[] = [
  {
    id: "1",
    marketplace: "mercadolivre",
    productName: "Motor Completo Honda Civic 2019 2.0 Flex",
    productImage: "🚗",
    customerName: "João Silva",
    question: "Bom dia! Esse motor serve no Civic 2018? Qual a quilometragem?",
    status: "pending",
    time: "há 5 min",
  },
  {
    id: "2",
    marketplace: "shopee",
    productName: "Farol LED VW Polo 2021",
    productImage: "💡",
    customerName: "Maria Santos",
    question: "Vocês enviam para o Nordeste? Qual o prazo?",
    status: "pending",
    time: "há 12 min",
  },
  {
    id: "3",
    marketplace: "mercadolivre",
    productName: "Câmbio Automático Toyota Corolla 2020",
    productImage: "⚙️",
    customerName: "Pedro Oliveira",
    question: "Tem garantia? Aceita troca?",
    status: "answered",
    time: "há 1 hora",
    answer: "Olá! Sim, oferecemos 90 dias de garantia. Infelizmente não trabalhamos com trocas.",
  },
  {
    id: "4",
    marketplace: "mercadolivre",
    productName: "Painel de Instrumentos Fiat Argo",
    productImage: "📊",
    customerName: "Ana Costa",
    question: "Funciona no Cronos também?",
    status: "pending",
    time: "há 2 horas",
  },
];

const marketplaceConfig = {
  mercadolivre: { label: "Mercado Livre", color: "bg-yellow-500/20 text-yellow-500" },
  shopee: { label: "Shopee", color: "bg-orange-500/20 text-orange-500" },
  olx: { label: "OLX", color: "bg-blue-500/20 text-blue-500" },
};

const Perguntas = () => {
  const pendingCount = questions.filter((q) => q.status === "pending").length;

  return (
    <AppLayout title="Central de Perguntas" description="Responda perguntas de todos os marketplaces">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-180px)]">
        {/* Questions List */}
        <div className="lg:col-span-1 flex flex-col">
          <Card className="flex-1 flex flex-col overflow-hidden">
            <CardHeader className="pb-3 shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Perguntas
                  {pendingCount > 0 && (
                    <Badge className="bg-primary text-primary-foreground">
                      {pendingCount} pendentes
                    </Badge>
                  )}
                </CardTitle>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Buscar perguntas..." className="pl-9" />
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0">
              <div className="divide-y divide-border">
                {questions.map((q) => (
                  <div
                    key={q.id}
                    className={cn(
                      "p-4 cursor-pointer hover:bg-muted/50 transition-colors",
                      q.status === "pending" && "bg-muted/30"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted text-xl shrink-0">
                        {q.productImage}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant="outline"
                            className={cn("text-xs", marketplaceConfig[q.marketplace].color)}
                          >
                            {marketplaceConfig[q.marketplace].label}
                          </Badge>
                          {q.status === "pending" ? (
                            <Clock className="w-3 h-3 text-warning" />
                          ) : (
                            <CheckCheck className="w-3 h-3 text-success" />
                          )}
                        </div>
                        <p className="text-sm font-medium truncate">{q.productName}</p>
                        <p className="text-xs text-muted-foreground truncate">{q.question}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-muted-foreground">{q.customerName}</span>
                          <span className="text-xs text-muted-foreground">{q.time}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Question Detail */}
        <div className="lg:col-span-2 flex flex-col">
          <Card className="flex-1 flex flex-col overflow-hidden">
            <CardHeader className="pb-3 shrink-0 border-b border-border">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-muted text-3xl">
                    🚗
                  </div>
                  <div>
                    <CardTitle className="text-lg">Motor Completo Honda Civic 2019</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={marketplaceConfig.mercadolivre.color}>
                        Mercado Livre
                      </Badge>
                      <span className="text-sm text-muted-foreground">há 5 min</span>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  <Package className="w-4 h-4" />
                  Ver Produto
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Customer Question */}
                <div className="flex gap-3">
                  <Avatar className="w-10 h-10 shrink-0">
                    <AvatarFallback className="bg-muted">JS</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">João Silva</span>
                      <span className="text-xs text-muted-foreground">há 5 min</span>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/50 border border-border">
                      <p className="text-sm">
                        Bom dia! Esse motor serve no Civic 2018? Qual a quilometragem?
                      </p>
                    </div>
                  </div>
                </div>

                {/* AI Suggestion */}
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                      <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-primary">Sugestão IA</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Olá João! Sim, esse motor é compatível com o Civic 2018. A quilometragem é de aproximadamente 85.000 km. Oferecemos 90 dias de garantia. Posso ajudar em algo mais?
                      </p>
                      <Button size="sm" className="mt-3 gap-2">
                        <Sparkles className="w-4 h-4" />
                        Usar sugestão
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <div className="p-4 border-t border-border shrink-0">
              <div className="flex gap-3">
                <Textarea
                  placeholder="Digite sua resposta..."
                  className="min-h-[80px] resize-none"
                />
                <div className="flex flex-col gap-2">
                  <Button size="icon" className="h-10 w-10">
                    <Send className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="outline" className="h-10 w-10">
                    <Sparkles className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Perguntas;
