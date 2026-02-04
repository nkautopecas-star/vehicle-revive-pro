import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { QuestionsList } from "@/components/perguntas/QuestionsList";
import { QuestionDetail } from "@/components/perguntas/QuestionDetail";
import { useMarketplaceQuestions, type MarketplaceQuestion } from "@/hooks/useMarketplaceQuestions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, History } from "lucide-react";

const Perguntas = () => {
  const [selectedQuestion, setSelectedQuestion] = useState<MarketplaceQuestion | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [activeTab, setActiveTab] = useState<"pending" | "answered">("pending");

  const { data: questions = [], isLoading } = useMarketplaceQuestions({
    search: searchQuery || undefined,
    listingStatus: showActiveOnly ? "active" : "all",
    status: activeTab,
  });

  const pendingCount = useMemo(
    () => questions.filter((q) => q.status === "pending").length,
    [questions]
  );

  const handleSelectQuestion = (question: MarketplaceQuestion) => {
    setSelectedQuestion(question);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as "pending" | "answered");
    setSelectedQuestion(null);
  };

  return (
    <AppLayout title="Central de Perguntas" description="Responda perguntas de todos os marketplaces">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-180px)]">
        {/* Questions List */}
        <div className="lg:col-span-1 flex flex-col">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="flex flex-col h-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Pendentes
              </TabsTrigger>
              <TabsTrigger value="answered" className="flex items-center gap-2">
                <History className="w-4 h-4" />
                Histórico
              </TabsTrigger>
            </TabsList>
            <TabsContent value="pending" className="flex-1 mt-0">
              <QuestionsList
                questions={questions}
                isLoading={isLoading}
                selectedId={selectedQuestion?.id || null}
                onSelect={handleSelectQuestion}
                pendingCount={pendingCount}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                showActiveOnly={showActiveOnly}
                onShowActiveOnlyChange={setShowActiveOnly}
                showPendingBadge={true}
              />
            </TabsContent>
            <TabsContent value="answered" className="flex-1 mt-0">
              <QuestionsList
                questions={questions}
                isLoading={isLoading}
                selectedId={selectedQuestion?.id || null}
                onSelect={handleSelectQuestion}
                pendingCount={0}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                showActiveOnly={showActiveOnly}
                onShowActiveOnlyChange={setShowActiveOnly}
                showPendingBadge={false}
              />
            </TabsContent>
          </Tabs>
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
