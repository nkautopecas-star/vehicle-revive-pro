import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Veiculos from "./pages/Veiculos";
import Pecas from "./pages/Pecas";
import PecaDetalhes from "./pages/PecaDetalhes";
import Estoque from "./pages/Estoque";
import Marketplaces from "./pages/Marketplaces";
import Perguntas from "./pages/Perguntas";
import IA from "./pages/IA";
import Precificacao from "./pages/Precificacao";
import Notas from "./pages/Notas";
import Integracoes from "./pages/Integracoes";
import Anuncios from "./pages/Anuncios";
import Configuracoes from "./pages/Configuracoes";
import Usuarios from "./pages/Usuarios";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public route */}
            <Route path="/auth" element={<Auth />} />

            {/* Protected routes - All authenticated users */}
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/veiculos" element={<ProtectedRoute><Veiculos /></ProtectedRoute>} />
            <Route path="/pecas" element={<ProtectedRoute><Pecas /></ProtectedRoute>} />
            <Route path="/pecas/:id" element={<ProtectedRoute><PecaDetalhes /></ProtectedRoute>} />
            <Route path="/estoque" element={<ProtectedRoute><Estoque /></ProtectedRoute>} />
            <Route path="/marketplaces" element={<ProtectedRoute><Marketplaces /></ProtectedRoute>} />
            <Route path="/anuncios" element={<ProtectedRoute><Anuncios /></ProtectedRoute>} />
            <Route path="/perguntas" element={<ProtectedRoute><Perguntas /></ProtectedRoute>} />
            <Route path="/ia" element={<ProtectedRoute><IA /></ProtectedRoute>} />
            <Route path="/precificacao" element={<ProtectedRoute><Precificacao /></ProtectedRoute>} />
            <Route path="/notas" element={<ProtectedRoute><Notas /></ProtectedRoute>} />
            <Route path="/integracoes" element={<ProtectedRoute><Integracoes /></ProtectedRoute>} />
            <Route path="/usuarios" element={<ProtectedRoute requiredRoles={['admin']}><Usuarios /></ProtectedRoute>} />
            <Route path="/configuracoes" element={<ProtectedRoute><Configuracoes /></ProtectedRoute>} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
