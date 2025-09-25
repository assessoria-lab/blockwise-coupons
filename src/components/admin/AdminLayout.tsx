import { useState } from 'react';
import { LayoutDashboard, Package, Store, Users, Settings, Menu, X, Trophy, BarChart3, ChevronLeft, ChevronRight, Search, TrendingUp, Activity, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMonitoramentoRealTime } from '@/hooks/useMonitoramentoRealTime';
interface AdminLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  forceExpanded?: boolean;
}
const AdminLayout = ({
  children,
  currentPage,
  onNavigate,
  forceExpanded = false
}: AdminLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isCollapsed = forceExpanded ? false : sidebarCollapsed;
  const { metricas } = useMonitoramentoRealTime();
  const navigation = [{
    name: 'Dashboard',
    href: '#dashboard',
    icon: LayoutDashboard,
    current: currentPage === 'dashboard',
    badge: null
  }, {
    name: 'Monitoramento',
    href: '#monitoramento',
    icon: Activity,
    current: currentPage === 'monitoramento',
    badge: 'Ao Vivo'
  }, {
    name: 'Gestão de Lojas',
    href: '#lojistas',
    icon: Store,
    current: currentPage === 'lojistas',
    badge: '3'
  }, {
    name: 'Rastreamento de Blocos',
    href: '/admin/rastreamento',
    icon: Search,
    current: currentPage === 'rastreamento',
    badge: null
  }, {
    name: 'Clientes',
    href: '#clientes',
    icon: Users,
    current: currentPage === 'clientes',
    badge: null
  }, {
    name: 'Sorteios',
    href: '#sorteios',
    icon: Trophy,
    current: currentPage === 'sorteios',
    badge: 'Novo'
  }, {
    name: 'Relatórios',
    href: '#relatorios',
    icon: BarChart3,
    current: currentPage === 'relatorios',
    badge: null
  }, {
    name: 'Configurações',
    href: '#configuracoes',
    icon: Settings,
    current: currentPage === 'configuracoes',
    badge: null
  }];
  return <div className="flex min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 bg-primary text-primary-foreground transform transition-all duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isCollapsed ? 'w-16' : 'w-64'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'justify-center px-4'} h-32 border-b border-primary-foreground/20`}>
            {!isCollapsed && <div className="flex items-center justify-center w-full">
                <img src="/lovable-uploads/30762c46-4536-4a6c-bd54-a016f6a4ff1c.png" alt="Show de Prêmios - Vem Pra 44" className="h-32 w-auto my-8" />
              </div>}
            {isCollapsed && <img src="/lovable-uploads/30762c46-4536-4a6c-bd54-a016f6a4ff1c.png" alt="Show de Prêmios" className="h-12 w-auto" />}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 pt-8 pb-4 space-y-1">
            {navigation.map(item => {
            const Icon = item.icon;
            return <div key={item.name} className="relative">
                  <a href={item.href} onClick={e => {
                e.preventDefault();
                onNavigate(item.href.replace('#', ''));
              }} className={`
                      flex items-center ${isCollapsed ? 'justify-center px-3' : 'px-3'} py-3 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer group
                      ${item.current ? 'bg-primary-foreground/20 text-primary-foreground shadow-lg border-r-2 border-accent' : 'text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground'}
                    `} title={isCollapsed ? item.name : undefined}>
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {!isCollapsed && <>
                        <span className="ml-3 flex-1">{item.name}</span>
                        {item.badge && <Badge variant="secondary" className="ml-2 text-xs bg-accent text-accent-foreground border-none hover:bg-accent hover:text-accent-foreground">
                            {item.badge}
                          </Badge>}
                      </>}
                  </a>
                </div>;
          })}
          </nav>

          {/* Footer */}
          {!isCollapsed && <div className="p-4 border-t border-primary-foreground/20">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-accent-foreground">AD</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-primary-foreground truncate">
                    Admin User
                  </p>
                  <p className="text-xs text-primary-foreground/70 truncate">
                    admin@system.com
                  </p>
                </div>
              </div>
            </div>}
        </div>
      </div>

      {/* Main content */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
        isCollapsed ? 'lg:ml-16' : 'lg:ml-64'
      }`}>
        {/* Top bar */}
        <div className="flex h-14 items-center gap-x-4 bg-white border-b border-border px-4 shadow-sm lg:px-6 flex-shrink-0">
          {/* Menu collapse button - outside sidebar */}
          {!forceExpanded && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex hover:bg-gray-100 p-2"
              title={sidebarCollapsed ? 'Expandir menu' : 'Recolher menu'}
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          )}
          
          <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex items-center gap-x-4 lg:gap-x-6 ml-auto">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.href = '/registro-vendas'}
                className="px-4 py-2 font-medium"
              >
                <Receipt className="h-4 w-4 mr-2" />
                Registro de Vendas
              </Button>
              
              <Button 
                variant="default" 
                size="sm"
                onClick={() => window.location.href = '/cadastro-lojista'}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 font-medium"
              >
                <Store className="h-4 w-4 mr-2" />
                Cadastrar Loja
              </Button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 bg-gray-50 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>;
};
export default AdminLayout;