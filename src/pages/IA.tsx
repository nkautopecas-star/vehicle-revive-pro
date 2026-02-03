import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Sparkles, 
  Wand2, 
  Copy, 
  Check,
  Package,
  Car,
  FileText,
  Loader2
} from "lucide-react";
import { useState } from "react";

const IA = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTitle, setGeneratedTitle] = useState("");
  const [generatedDescription, setGeneratedDescription] = useState("");
  const [copied, setCopied] = useState<"title" | "description" | null>(null);

  const handleGenerate = () => {
    setIsGenerating(true);
    // Simulating AI generation
    setTimeout(() => {
      setGeneratedTitle("Motor Completo Honda Civic 2.0 Flex 2019 - Original com Garantia 90 Dias");
      setGeneratedDescription(`🔧 MOTOR COMPLETO HONDA CIVIC 2.0 FLEX 2019

✅ ORIGINAL DE FÁBRICA
✅ FUNCIONAMENTO PERFEITO
✅ GARANTIA DE 90 DIAS

📦 PRODUTO EM EXCELENTE ESTADO

Este motor foi retirado de um Honda Civic 2019 com baixa quilometragem. Todas as peças foram testadas e aprovadas por nossa equipe técnica.

🚗 COMPATIBILIDADE:
• Honda Civic 2016-2021
• Honda CR-V 2017-2021

📋 ESPECIFICAÇÕES:
• Motorização: 2.0 Flex
• Potência: 155cv (gasolina) / 155cv (etanol)
• Quilometragem: 85.000 km

💳 FORMAS DE PAGAMENTO:
Aceitamos todas as formas de pagamento do Mercado Livre

📦 ENVIO:
Enviamos para todo o Brasil com frete calculado

⚠️ IMPORTANTE:
Recomendamos a instalação por profissional qualificado.`);
      setIsGenerating(false);
    }, 2000);
  };

  const handleCopy = (type: "title" | "description") => {
    const text = type === "title" ? generatedTitle : generatedDescription;
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <AppLayout title="Inteligência Artificial" description="Ferramentas com IA para otimizar seu trabalho">
      <Tabs defaultValue="anuncios" className="space-y-6">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="anuncios" className="gap-2">
            <FileText className="w-4 h-4" />
            Criar Anúncios
          </TabsTrigger>
          <TabsTrigger value="compatibilidade" className="gap-2">
            <Car className="w-4 h-4" />
            Compatibilidade
          </TabsTrigger>
          <TabsTrigger value="respostas" className="gap-2">
            <Sparkles className="w-4 h-4" />
            Sugerir Respostas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="anuncios" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-primary" />
                  Dados da Peça
                </CardTitle>
                <CardDescription>
                  Preencha as informações para gerar o anúncio
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Peça</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma peça" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Motor Completo - Honda Civic 2019</SelectItem>
                      <SelectItem value="2">Câmbio Automático - Toyota Corolla 2020</SelectItem>
                      <SelectItem value="3">Farol LED - VW Polo 2021</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Marketplace</label>
                  <Select defaultValue="mercadolivre">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mercadolivre">Mercado Livre</SelectItem>
                      <SelectItem value="shopee">Shopee</SelectItem>
                      <SelectItem value="olx">OLX</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Tom do Anúncio</label>
                  <Select defaultValue="profissional">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="profissional">Profissional</SelectItem>
                      <SelectItem value="amigavel">Amigável</SelectItem>
                      <SelectItem value="urgente">Urgência</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Informações Adicionais</label>
                  <Textarea
                    placeholder="Adicione detalhes extras sobre a peça..."
                    rows={3}
                  />
                </div>

                <Button 
                  onClick={handleGenerate} 
                  className="w-full gap-2"
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Gerar Anúncio com IA
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Generated Content */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Anúncio Gerado
                </CardTitle>
                <CardDescription>
                  Revise e copie o conteúdo gerado
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {generatedTitle ? (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Título</label>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleCopy("title")}
                        >
                          {copied === "title" ? (
                            <Check className="w-4 h-4 text-success" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50 border border-border">
                        <p className="text-sm font-medium">{generatedTitle}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {generatedTitle.length} caracteres
                        </Badge>
                        {generatedTitle.length <= 60 && (
                          <Badge className="bg-success/20 text-success text-xs">
                            ✓ Tamanho ideal
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Descrição</label>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleCopy("description")}
                        >
                          {copied === "description" ? (
                            <Check className="w-4 h-4 text-success" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50 border border-border max-h-[300px] overflow-y-auto">
                        <p className="text-sm whitespace-pre-wrap">{generatedDescription}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button className="flex-1 gap-2">
                        <Package className="w-4 h-4" />
                        Criar Anúncio
                      </Button>
                      <Button variant="outline" onClick={handleGenerate}>
                        <Sparkles className="w-4 h-4" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                      <Sparkles className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">
                      Selecione uma peça e clique em "Gerar Anúncio" para começar
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="compatibilidade">
          <Card>
            <CardHeader>
              <CardTitle>Compatibilidade Automática</CardTitle>
              <CardDescription>
                A IA analisa a peça e sugere veículos compatíveis
              </CardDescription>
            </CardHeader>
            <CardContent className="py-12 text-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mx-auto mb-4">
                <Car className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-4">
                Selecione uma peça para ver sugestões de compatibilidade
              </p>
              <Button variant="outline">Selecionar Peça</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="respostas">
          <Card>
            <CardHeader>
              <CardTitle>Sugestões de Respostas</CardTitle>
              <CardDescription>
                A IA sugere respostas para as perguntas dos clientes
              </CardDescription>
            </CardHeader>
            <CardContent className="py-12 text-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-4">
                Vá para a Central de Perguntas para usar esta funcionalidade
              </p>
              <Button variant="outline">Ir para Perguntas</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default IA;
