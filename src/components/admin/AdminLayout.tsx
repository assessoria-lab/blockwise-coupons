import { useState } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Store, 
  Users, 
  Settings, 
  Menu,
  X,
  Trophy,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import HeroBackground from './HeroBackground';

interface AdminLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

const AdminLayout = ({ children, currentPage, onNavigate }: AdminLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { 
      name: 'Dashboard', 
      href: '#dashboard', 
      icon: LayoutDashboard, 
      current: currentPage === 'dashboard',
      badge: null
    },
    { 
      name: 'Gestão de Blocos', 
      href: '#blocos', 
      icon: Package, 
      current: currentPage === 'blocos',
      badge: null
    },
    { 
      name: 'Lojistas', 
      href: '#lojistas', 
      icon: Store, 
      current: currentPage === 'lojistas',
      badge: '850'
    },
    { 
      name: 'Clientes', 
      href: '#clientes', 
      icon: Users, 
      current: currentPage === 'clientes',
      badge: null
    },
    { 
      name: 'Sorteios', 
      href: '#sorteios', 
      icon: Trophy, 
      current: currentPage === 'sorteios', 
      badge: 'Novo'
    },
    { 
      name: 'Relatórios', 
      href: '#relatorios', 
      icon: BarChart3, 
      current: currentPage === 'relatorios',
      badge: null
    },
    { 
      name: 'Configurações', 
      href: '#configuracoes', 
      icon: Settings, 
      current: currentPage === 'configuracoes',
      badge: null
    },
  ];

  return (
    <div className="min-h-screen bg-background relative">
      <HeroBackground />
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-sidebar/95 backdrop-blur-lg border-r border-sidebar-border/50 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0 pulse-glow
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div className="flex items-center justify-between h-20 px-4 border-b border-sidebar-border">
            <div className="flex items-center space-x-3">
              <img 
                src="/lovable-uploads/30762c46-4536-4a6c-bd54-a016f6a4ff1c.png" 
                alt="Show de Prêmios - Vem Pra 44" 
                className="h-12 w-auto"
              />
              <div>
                <h1 className="text-lg font-bold text-sidebar-foreground">Painel Admin</h1>
                <p className="text-xs text-sidebar-foreground/60">Sistema de Blocos</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm" 
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate(item.href.replace('#', ''));
                  }}
                  className={`
                    flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer
                    ${item.current 
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-soft' 
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    }
                  `}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <Badge variant="secondary" className="text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </a>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-white">AD</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  Admin User
                </p>
                <p className="text-xs text-sidebar-foreground/60 truncate">
                  admin@system.com
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-30 flex h-16 items-center gap-x-4 border-b border-border/50 bg-card/80 backdrop-blur-lg px-4 shadow-soft lg:px-6 glow-effect">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center">
              <h1 className="text-lg font-semibold text-foreground">
                {navigation.find(item => item.current)?.name || 'Painel Administrativo'}
              </h1>
            </div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <Badge variant="outline" className="bg-success-bg text-success border-success/20">
                Sistema Online
              </Badge>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;