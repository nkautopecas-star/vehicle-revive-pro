import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { QuestionsList } from "@/components/perguntas/QuestionsList";
import { QuestionDetail } from "@/components/perguntas/QuestionDetail";
import { useMarketplaceQuestions, type MarketplaceQuestion } from "@/hooks/useMarketplaceQuestions";

const Perguntas = () => {
  const [selectedQuestion, setSelectedQuestion] = useState<MarketplaceQuestion | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: questions = [], isLoading } = useMarketplaceQuestions({
    search: searchQuery || undefined,
  });

  const pendingCount = useMemo(
    () => questions.filter((q) => q.status === "pending").length,
    [questions]
  );

  const handleSelectQuestion = (question: MarketplaceQuestion) => {
    setSelectedQuestion(question);
  };

  return (
    <AppLayout title="Central de Perguntas" description="Responda perguntas de todos os marketplaces">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-180px)]">
        {/* Questions List */}
        <div className="lg:col-span-1 flex flex-col">
          <QuestionsList
            questions={questions}
            isLoading={isLoading}
            selectedId={selectedQuestion?.id || null}
            onSelect={handleSelectQuestion}
            pendingCount={pendingCount}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>

        {/* Question Detail */}
        <div className="lg:col-span-2 flex flex-col">
          <QuestionDetail question={selectedQuestion} />
        </div>
      </div>
    </AppLayout>
  );
};

export default Perguntas;
