import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import DashboardBlocos from '@/components/admin/DashboardBlocos';
import GestaoPoolBlocos from '@/components/admin/GestaoPoolBlocos';
import ConfiguracoesSistema from '@/components/admin/ConfiguracoesSistema';
import GestaoLojistas from './GestaoLojistas';
import { RelatoriosAnalises } from '@/components/admin/RelatoriosAnalises';
import GestaoClientes from '@/components/admin/GestaoClientes';
import GestaoSorteios from '@/components/admin/GestaoSorteios';

const Index = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const handleNavigation = (page: string) => {
    setCurrentPage(page);
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardBlocos />;
      case 'lojistas':
        return <GestaoLojistas />;
      case 'blocos':
        return <GestaoPoolBlocos />;
      case 'relatorios':
        return <RelatoriosAnalises />;
      case 'clientes':
        return <GestaoClientes />;
      case 'sorteios':
        return <GestaoSorteios />;
      case 'configuracoes':
        return <ConfiguracoesSistema />;
      default:
        return <DashboardBlocos />;
    }
  };

  return (
    <AdminLayout currentPage={currentPage} onNavigate={handleNavigation}>
      {renderCurrentPage()}
    </AdminLayout>
  );
};

export default Index;
