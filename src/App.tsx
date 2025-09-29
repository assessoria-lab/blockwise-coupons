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
import { CustomAuthProvider } from "./components/auth/CustomAuthProvider";
import { CustomProtectedRoute } from "./components/auth/CustomProtectedRoute";
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
    <CustomAuthProvider>
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
                <CustomProtectedRoute requiredType="admin">
                  <Index />
                </CustomProtectedRoute>
              }
            />
            <Route 
              path="/lojista" 
              element={
                <CustomProtectedRoute requiredType="lojista">
                  <LojistaIndex />
                </CustomProtectedRoute>
              } 
            />
            <Route 
              path="/cadastro-lojista" 
              element={
                <CustomProtectedRoute requiredType="admin">
                  <CadastroLojista />
                </CustomProtectedRoute>
              } 
            />
            <Route 
              path="/registro-vendas" 
              element={
                <CustomProtectedRoute requiredType="admin">
                  <RegistroVendas />
                </CustomProtectedRoute>
              } 
            />
            <Route 
              path="/admin/relatorios" 
              element={
                <CustomProtectedRoute requiredType="admin">
                  <RelatoriosAnalises />
                </CustomProtectedRoute>
              } 
            />
            <Route 
              path="/admin/historico" 
              element={
                <CustomProtectedRoute requiredType="admin">
                  <HistoricoCupons />
                </CustomProtectedRoute>
              } 
            />
            <Route 
              path="/admin/financeiro" 
              element={
                <CustomProtectedRoute requiredType="admin">
                  <DashboardFinanceiro />
                </CustomProtectedRoute>
              } 
            />
            <Route 
              path="/admin/lojistas" 
              element={
                <CustomProtectedRoute requiredType="admin">
                  <GestaoLojistas />
                </CustomProtectedRoute>
              } 
            />
            <Route 
              path="/admin/rastreamento" 
              element={
                <CustomProtectedRoute requiredType="admin">
                  <RastreamentoPorBloco />
                </CustomProtectedRoute>
              } 
            />
            <Route 
              path="/admin/monitoramento" 
              element={
                <CustomProtectedRoute requiredType="admin">
                  <DashboardMonitoramento />
                </CustomProtectedRoute>
              } 
            />
            <Route 
              path="/admin/business-intelligence" 
              element={
                <CustomProtectedRoute requiredType="admin">
                  <BusinessIntelligence />
                </CustomProtectedRoute>
              } 
            />
            <Route 
              path="/admin/auditoria" 
              element={
                <CustomProtectedRoute requiredType="admin">
                  <AuditoriaCompliance />
                </CustomProtectedRoute>
              } 
            />
            <Route 
              path="/admin/configuracoes" 
              element={
                <CustomProtectedRoute requiredType="admin">
                  <ConfiguracoesSistema />
                </CustomProtectedRoute>
              } 
            />
            <Route path="/" element={<Home />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </CustomAuthProvider>
  </QueryClientProvider>
);

export default App;