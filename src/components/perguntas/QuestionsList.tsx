import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Search, MessageSquare, Clock, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { MarketplaceQuestion } from "@/hooks/useMarketplaceQuestions";

const marketplaceConfig = {
  mercadolivre: { label: "Mercado Livre", color: "bg-yellow-500/20 text-yellow-500" },
  shopee: { label: "Shopee", color: "bg-orange-500/20 text-orange-500" },
  olx: { label: "OLX", color: "bg-blue-500/20 text-blue-500" },
};

interface QuestionsListProps {
  questions: MarketplaceQuestion[];
  isLoading: boolean;
  selectedId: string | null;
  onSelect: (question: MarketplaceQuestion) => void;
  pendingCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  showActiveOnly: boolean;
  onShowActiveOnlyChange: (value: boolean) => void;
}

export function QuestionsList({
  questions,
  isLoading,
  selectedId,
  onSelect,
  pendingCount,
  searchQuery,
  onSearchChange,
  showActiveOnly,
  onShowActiveOnlyChange,
}: QuestionsListProps) {
  return (
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
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar perguntas..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="active-only"
              checked={showActiveOnly}
              onCheckedChange={onShowActiveOnlyChange}
            />
            <Label htmlFor="active-only" className="text-sm text-muted-foreground cursor-pointer">
              Apenas itens ativos
            </Label>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-0">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : questions.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma pergunta encontrada</p>
            <p className="text-sm mt-1">
              As perguntas dos marketplaces aparecerão aqui
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {questions.map((q) => {
              const marketplace = q.listing?.marketplace_account?.marketplace || "mercadolivre";
              const config = marketplaceConfig[marketplace];
              
              return (
                <div
                  key={q.id}
                  onClick={() => onSelect(q)}
                  className={cn(
                    "p-4 cursor-pointer hover:bg-muted/50 transition-colors",
                    q.status === "pending" && "bg-muted/30",
                    selectedId === q.id && "bg-primary/10 border-l-2 border-l-primary"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden shrink-0">
                      {q.listing?.image_url ? (
                        <img
                          src={q.listing.image_url}
                          alt={q.listing?.titulo || "Produto"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full text-xl">
                          📦
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant="outline"
                          className={cn("text-xs", config.color)}
                        >
                          {config.label}
                        </Badge>
                        {q.status === "pending" ? (
                          <Clock className="w-3 h-3 text-warning" />
                        ) : (
                          <CheckCheck className="w-3 h-3 text-success" />
                        )}
                      </div>
                      <p className="text-sm font-medium truncate">
                        {q.listing?.titulo || "Produto não encontrado"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{q.question}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                          {q.customer_name || "Cliente"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(q.received_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
