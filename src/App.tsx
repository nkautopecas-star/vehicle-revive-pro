import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Veiculos from "./pages/Veiculos";
import Pecas from "./pages/Pecas";
import Estoque from "./pages/Estoque";
import Marketplaces from "./pages/Marketplaces";
import Perguntas from "./pages/Perguntas";
import IA from "./pages/IA";
import Precificacao from "./pages/Precificacao";
import Notas from "./pages/Notas";
import Integracoes from "./pages/Integracoes";
import Configuracoes from "./pages/Configuracoes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/veiculos" element={<Veiculos />} />
          <Route path="/pecas" element={<Pecas />} />
          <Route path="/estoque" element={<Estoque />} />
          <Route path="/marketplaces" element={<Marketplaces />} />
          <Route path="/perguntas" element={<Perguntas />} />
          <Route path="/ia" element={<IA />} />
          <Route path="/precificacao" element={<Precificacao />} />
          <Route path="/notas" element={<Notas />} />
          <Route path="/integracoes" element={<Integracoes />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
