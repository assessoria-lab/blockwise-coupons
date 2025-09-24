import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import DashboardBlocos from '@/components/admin/DashboardBlocos';
import GestaoPoolBlocos from '@/components/admin/GestaoPoolBlocos';
import ConfiguracoesSistema from '@/components/admin/ConfiguracoesSistema';

const Index = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const handleNavigation = (page: string) => {
    setCurrentPage(page);
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardBlocos />;
      case 'blocos':
        return <GestaoPoolBlocos />;
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
