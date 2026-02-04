import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Send, Sparkles, Package, MessageSquare, ExternalLink, Loader2, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { MarketplaceQuestion } from "@/hooks/useMarketplaceQuestions";
import { useAnswerQuestion } from "@/hooks/useMarketplaceQuestions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const marketplaceConfig = {
  mercadolivre: { label: "Mercado Livre", color: "bg-yellow-500/20 text-yellow-500" },
  shopee: { label: "Shopee", color: "bg-orange-500/20 text-orange-500" },
  olx: { label: "OLX", color: "bg-blue-500/20 text-blue-500" },
};

interface QuestionDetailProps {
  question: MarketplaceQuestion | null;
}

export function QuestionDetail({ question }: QuestionDetailProps) {
  const [answer, setAnswer] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
  const answerMutation = useAnswerQuestion();

  const handleGenerateSuggestion = async () => {
    if (!question) return;

    setIsLoadingSuggestion(true);
    setAiSuggestion(null);

    try {
      const { data, error } = await supabase.functions.invoke("suggest-answer", {
        body: {
          question: question.question,
          productTitle: question.listing?.titulo,
          productPrice: question.listing?.preco,
        },
      });

      if (error) throw error;

      if (data.suggestion) {
        setAiSuggestion(data.suggestion);
      } else if (data.error) {
        toast.error(data.error);
      }
    } catch (error) {
      console.error("Error generating suggestion:", error);
      toast.error("Erro ao gerar sugestão. Tente novamente.");
    } finally {
      setIsLoadingSuggestion(false);
    }
  };

  const handleUseSuggestion = () => {
    if (aiSuggestion) {
      setAnswer(aiSuggestion);
      setAiSuggestion(null);
    }
  };

  const handleSubmit = () => {
    if (!question || !answer.trim()) return;

    answerMutation.mutate(
      {
        questionId: question.id,
        answer: answer.trim(),
        externalId: question.external_id,
      },
      {
        onSuccess: () => {
          setAnswer("");
        },
      }
    );
  };

  if (!question) {
    return (
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">Selecione uma pergunta</p>
            <p className="text-sm">Escolha uma pergunta na lista para visualizar</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const marketplace = question.listing?.marketplace_account?.marketplace || "mercadolivre";
  const config = marketplaceConfig[marketplace];
  const customerInitials = question.customer_name
    ? question.customer_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "CL";

  const mlItemUrl = question.listing?.external_id
    ? `https://www.mercadolivre.com.br/p/${question.listing.external_id}`
    : null;

  // Get product image: first from linked part, then from cached ML image
  const partImage = question.listing?.part?.part_images
    ?.sort((a, b) => (a.order_position ?? 0) - (b.order_position ?? 0))[0]?.file_path;

  const imageUrl = partImage
    ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/part-images/${partImage}`
    : question.listing?.image_url || null;

  return (
    <Card className="flex-1 flex flex-col overflow-hidden">
      <CardHeader className="pb-3 shrink-0 border-b border-border">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0 flex-1">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={question.listing?.titulo || "Produto"}
                className="w-16 h-16 rounded-xl object-cover shrink-0 bg-muted"
              />
            ) : (
              <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-muted text-3xl shrink-0">
                📦
              </div>
            )}
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg leading-tight">
                {question.listing?.titulo || "Produto não encontrado"}
              </CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={config.color}>{config.label}</Badge>
                <span className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(question.received_at), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            {mlItemUrl && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => window.open(mlItemUrl, "_blank")}
              >
                <ExternalLink className="w-4 h-4" />
                Ver no ML
              </Button>
            )}
            <Button variant="outline" size="sm" className="gap-2">
              <Package className="w-4 h-4" />
              Ver Produto
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {/* Customer Question */}
          <div className="flex gap-3">
            <Avatar className="w-10 h-10 shrink-0">
              <AvatarFallback className="bg-muted">{customerInitials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">{question.customer_name || "Cliente"}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(question.received_at), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </span>
              </div>
              <div className="p-4 rounded-xl bg-muted/50 border border-border">
                <p className="text-sm">{question.question}</p>
              </div>
            </div>
          </div>

          {/* Previous Answer if exists */}
          {question.status === "answered" && question.answer && (
            <div className="flex gap-3 justify-end">
              <div className="flex-1 max-w-[80%]">
                <div className="flex items-center gap-2 mb-1 justify-end">
                  <span className="text-xs text-muted-foreground">
                    {question.answered_at &&
                      formatDistanceToNow(new Date(question.answered_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                  </span>
                  <span className="font-medium">Você</span>
                </div>
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                  <p className="text-sm">{question.answer}</p>
                </div>
              </div>
              <Avatar className="w-10 h-10 shrink-0">
                <AvatarFallback className="bg-primary/20 text-primary">EU</AvatarFallback>
              </Avatar>
            </div>
          )}

          {/* AI Suggestion (only for pending questions) */}
          {question.status === "pending" && (
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                  {isLoadingSuggestion ? (
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-primary" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-sm font-medium text-primary">Sugestão IA</span>
                    {!aiSuggestion && !isLoadingSuggestion && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1"
                        onClick={handleGenerateSuggestion}
                      >
                        <Sparkles className="w-3 h-3" />
                        Gerar sugestão
                      </Button>
                    )}
                  </div>
                  {isLoadingSuggestion ? (
                    <p className="text-sm text-muted-foreground">
                      Gerando sugestão de resposta...
                    </p>
                  ) : aiSuggestion ? (
                    <div className="space-y-3">
                      <p className="text-sm">{aiSuggestion}</p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={handleUseSuggestion}
                        >
                          <Check className="w-3 h-3" />
                          Usar sugestão
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1"
                          onClick={handleGenerateSuggestion}
                        >
                          <Sparkles className="w-3 h-3" />
                          Nova sugestão
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Clique em "Gerar sugestão" para receber uma resposta sugerida por IA.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>

      {/* Answer Input - only for pending questions */}
      {question.status === "pending" && (
        <div className="p-4 border-t border-border shrink-0">
          <div className="flex gap-3">
            <Textarea
              placeholder="Digite sua resposta..."
              className="min-h-[80px] resize-none"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              disabled={answerMutation.isPending}
            />
            <div className="flex flex-col gap-2">
              <Button
                size="icon"
                className="h-10 w-10"
                onClick={handleSubmit}
                disabled={!answer.trim() || answerMutation.isPending}
              >
                <Send className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="outline" className="h-10 w-10" disabled>
                <Sparkles className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
