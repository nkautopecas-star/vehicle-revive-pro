import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Calculator, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Search,
  RefreshCw,
  Target,
  BarChart3
} from "lucide-react";
import { useState } from "react";
import { ListingTypeRulesCard } from "@/components/precificacao/ListingTypeRulesCard";

interface PriceAnalysis {
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  suggestedPrice: number;
  margin: number;
  competitorCount: number;
}

const Precificacao = () => {
  const [margin, setMargin] = useState([30]);
  const [analysis, setAnalysis] = useState<PriceAnalysis | null>({
    minPrice: 4200,
    maxPrice: 6800,
    avgPrice: 5400,
    suggestedPrice: 5500,
    margin: 57,
    competitorCount: 12,
  });

  return (
    <AppLayout title="Precificação Inteligente" description="Calcule o preço ideal para suas peças">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" />
              Calculadora de Preços
            </CardTitle>
            <CardDescription>
              Configure os parâmetros de precificação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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
              <label className="text-sm font-medium">Preço de Custo</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                <Input className="pl-10" placeholder="0,00" defaultValue="3.500,00" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Margem Desejada</label>
                <span className="text-sm font-bold text-primary">{margin[0]}%</span>
              </div>
              <Slider
                value={margin}
                onValueChange={setMargin}
                max={100}
                min={10}
                step={5}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>10%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            <Button className="w-full gap-2">
              <Search className="w-4 h-4" />
              Analisar Mercado
            </Button>
          </CardContent>
        </Card>

        {/* Analysis Results */}
        <div className="lg:col-span-2 space-y-6">
          {analysis && (
            <>
              {/* Price Suggestion */}
              <Card className="border-primary/50 bg-primary/5">
                <CardContent className="py-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Preço Sugerido</p>
                      <p className="text-4xl font-bold text-primary">
                        R$ {analysis.suggestedPrice.toLocaleString("pt-BR")}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className="bg-success/20 text-success">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          {analysis.margin}% margem
                        </Badge>
                        <Badge variant="outline">
                          {analysis.competitorCount} concorrentes
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                      <Target className="w-8 h-8 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Market Analysis */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-success/10">
                        <TrendingDown className="w-5 h-5 text-success" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Menor Preço</p>
                        <p className="text-xl font-bold">R$ {analysis.minPrice.toLocaleString("pt-BR")}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-info/10">
                        <BarChart3 className="w-5 h-5 text-info" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Preço Médio</p>
                        <p className="text-xl font-bold">R$ {analysis.avgPrice.toLocaleString("pt-BR")}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-warning/10">
                        <TrendingUp className="w-5 h-5 text-warning" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Maior Preço</p>
                        <p className="text-xl font-bold">R$ {analysis.maxPrice.toLocaleString("pt-BR")}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Detalhamento do Preço</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Preço de Custo</span>
                      <span className="font-medium">R$ 3.500,00</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Margem ({margin[0]}%)</span>
                      <span className="font-medium text-success">+ R$ 1.050,00</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Taxa Mercado Livre (16%)</span>
                      <span className="font-medium text-destructive">- R$ 728,00</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Frete Médio</span>
                      <span className="font-medium">R$ 150,00</span>
                    </div>
                    <div className="flex items-center justify-between py-2 pt-4">
                      <span className="font-bold">Lucro Líquido Estimado</span>
                      <span className="font-bold text-primary text-xl">R$ 1.772,00</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Listing Type Rules Section */}
      <div className="mt-6">
        <ListingTypeRulesCard />
      </div>
    </AppLayout>
  );
};

export default Precificacao;
