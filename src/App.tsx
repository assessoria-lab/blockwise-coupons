import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import GestaoLojistas from "./pages/GestaoLojistas";
import { HistoricoCupons } from "./components/admin/HistoricoCupons";
import { DashboardFinanceiro } from "./components/admin/DashboardFinanceiro";
import { RelatoriosAnalises } from "./components/admin/RelatoriosAnalises";
import RastreamentoPorBloco from "./components/admin/RastreamentoPorBloco";
import DashboardMonitoramento from "./components/admin/DashboardMonitoramento";
import BusinessIntelligence from "./components/admin/BusinessIntelligence";
import AuditoriaCompliance from "./components/admin/AuditoriaCompliance";
import ConfiguracoesSistema from "./components/admin/ConfiguracoesSistema";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/admin/relatorios" element={<RelatoriosAnalises />} />
          <Route path="/admin/historico" element={<HistoricoCupons />} />
          <Route path="/admin/financeiro" element={<DashboardFinanceiro />} />
          <Route path="/admin/lojistas" element={<GestaoLojistas />} />
          <Route path="/admin/rastreamento" element={<RastreamentoPorBloco />} />
          <Route path="/admin/monitoramento" element={<DashboardMonitoramento />} />
          <Route path="/admin/business-intelligence" element={<BusinessIntelligence />} />
          <Route path="/admin/auditoria" element={<AuditoriaCompliance />} />
          <Route path="/admin/configuracoes" element={<ConfiguracoesSistema />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
