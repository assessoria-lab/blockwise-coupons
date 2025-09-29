import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import GestaoLojistas from "./pages/GestaoLojistas";
import CadastroLojista from "./pages/CadastroLojista";
import RegistroVendas from "./pages/RegistroVendas";
import Login from "./pages/Login";
import LoginLojista from "./pages/LoginLojista";
import LojistaIndex from "./pages/lojista/LojistaIndex";
import { AuthProvider } from "./components/auth/AuthProvider";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import HistoricoCupons from "./components/admin/HistoricoCupons";
import DashboardFinanceiro from "./components/admin/DashboardFinanceiro";
import RelatoriosAnalises from "./components/admin/RelatoriosAnalises";
import RastreamentoPorBloco from "./components/admin/RastreamentoPorBloco";
import DashboardMonitoramento from "./components/admin/DashboardMonitoramento";
import BusinessIntelligence from "./components/admin/BusinessIntelligence";
import AuditoriaCompliance from "./components/admin/AuditoriaCompliance";
import ConfiguracoesSistema from "./components/admin/ConfiguracoesSistema";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/login-lojista" element={<LoginLojista />} />
            <Route path="/cadastro-lojista-publico" element={<CadastroLojista />} />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <Index />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/lojista" 
              element={
                <ProtectedRoute requiredRole="lojista">
                  <LojistaIndex />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/cadastro-lojista" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <CadastroLojista />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/registro-vendas" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <RegistroVendas />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/relatorios" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <RelatoriosAnalises />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/historico" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <HistoricoCupons />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/financeiro" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <DashboardFinanceiro />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/lojistas" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <GestaoLojistas />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/rastreamento" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <RastreamentoPorBloco />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/monitoramento" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <DashboardMonitoramento />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/business-intelligence" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <BusinessIntelligence />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/auditoria" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AuditoriaCompliance />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/configuracoes" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <ConfiguracoesSistema />
                </ProtectedRoute>
              } 
            />
            <Route path="/" element={<Home />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;