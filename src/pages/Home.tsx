import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, LogIn, Store, Shield, Users } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#034001] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
        style={{
          backgroundImage: 'url(/assets/background-home.jpg)'
        }}
      />

      {/* Animated Glow Effects */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-[#42A626] rounded-full blur-3xl opacity-10 animate-pulse" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#F2CB05] rounded-full blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="max-w-5xl w-full space-y-8 relative z-10">
        {/* Logo */}
        <div className="flex justify-center animate-fade-in">
          <div className="relative">
            <div className="absolute inset-0 bg-[#42A626] blur-2xl opacity-20 rounded-full" />
            <img src="/assets/logo-show-premios.png" alt="Show de Prêmios" className="h-32 w-auto relative z-10" />
          </div>
        </div>

        {/* Welcome Card */}
        <Card className="text-center border-0 shadow-2xl animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <CardHeader className="pb-8">
            <CardTitle className="text-4xl font-bold text-[#034001] mb-3">
              Bem-vindo ao Show de Prêmios
            </CardTitle>
            <CardDescription className="text-lg text-gray-600">
              Sistema completo de gestão de cupons e sorteios
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Login Instructions */}
        <Card className="border-0 bg-gradient-to-br from-white to-gray-50 shadow-2xl animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-[#034001] text-2xl">
              <div className="p-2 bg-[#42A626] rounded-lg">
                <Info className="h-6 w-6 text-white" />
              </div>
              Modo Demonstração
            </CardTitle>
            <CardDescription className="text-base">
              Use qualquer email e senha para acessar o sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 bg-white rounded-xl border-2 border-[#034001]/10 hover:border-[#034001]/30 transition-all duration-200 hover:shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-[#034001] rounded-lg">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="font-bold text-[#034001] text-xl">Administrador</h4>
                </div>
                <p className="text-gray-600 mb-4">
                  Acesso completo ao sistema de gestão
                </p>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-medium text-gray-700 mb-1">Exemplos de email:</p>
                    <code className="text-xs bg-gray-100 px-3 py-2 rounded-lg block mb-1">
                      admin@sistema.com
                    </code>
                    <code className="text-xs bg-gray-100 px-3 py-2 rounded-lg block">
                      qualquer@email.com
                    </code>
                  </div>
                  <p className="text-xs text-[#42A626] font-medium">
                    💡 Senha: qualquer uma
                  </p>
                </div>
              </div>

              <div className="p-6 bg-white rounded-xl border-2 border-[#42A626]/10 hover:border-[#42A626]/30 transition-all duration-200 hover:shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-[#42A626] rounded-lg">
                    <Store className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="font-bold text-[#034001] text-xl">Lojista</h4>
                </div>
                <p className="text-gray-600 mb-4">
                  Painel para gestão da sua loja
                </p>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-medium text-gray-700 mb-1">Exemplos de email:</p>
                    <code className="text-xs bg-gray-100 px-3 py-2 rounded-lg block mb-1">
                      loja@exemplo.com
                    </code>
                    <code className="text-xs bg-gray-100 px-3 py-2 rounded-lg block">
                      qualquer@email.com
                    </code>
                  </div>
                  <p className="text-xs text-[#42A626] font-medium">
                    💡 Senha: qualquer uma
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid md:grid-cols-2 gap-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <Button
            onClick={() => navigate('/login')}
            className="h-20 text-lg bg-[#034001] hover:bg-[#042d01] text-white shadow-xl hover:shadow-2xl transition-all duration-200 border-2 border-white/20 hover:border-white/30"
            size="lg"
          >
            <Shield className="mr-3 h-6 w-6" />
            Acesso Administrativo
          </Button>
          
          <Button
            onClick={() => navigate('/login-lojista')}
            className="h-20 text-lg bg-[#42A626] hover:bg-[#368a1f] text-white shadow-xl hover:shadow-2xl transition-all duration-200 border-2 border-white/20 hover:border-white/30"
            size="lg"
          >
            <Store className="mr-3 h-6 w-6" />
            Painel do Lojista
          </Button>
        </div>

        {/* Features */}
        <Card className="border-0 shadow-2xl animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-[#034001] text-2xl">
              <div className="p-2 bg-gradient-to-br from-[#42A626] to-[#034001] rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              Funcionalidades do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center group hover:scale-105 transition-transform duration-200">
                <div className="w-16 h-16 bg-gradient-to-br from-[#034001] to-[#042d01] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-shadow">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h4 className="font-bold mb-2 text-[#034001]">Gestão Admin</h4>
                <p className="text-gray-600 text-sm">Controle total de lojistas, cupons e sorteios</p>
              </div>
              
              <div className="text-center group hover:scale-105 transition-transform duration-200">
                <div className="w-16 h-16 bg-gradient-to-br from-[#42A626] to-[#368a1f] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-shadow">
                  <Store className="h-8 w-8 text-white" />
                </div>
                <h4 className="font-bold mb-2 text-[#034001]">Painel Lojista</h4>
                <p className="text-gray-600 text-sm">Atribuição de cupons e controle de vendas</p>
              </div>
              
              <div className="text-center group hover:scale-105 transition-transform duration-200">
                <div className="w-16 h-16 bg-gradient-to-br from-[#F2CB05] to-[#D97904] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-shadow">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h4 className="font-bold mb-2 text-[#034001]">Clientes</h4>
                <p className="text-gray-600 text-sm">Gestão de clientes e histórico de cupons</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Home;