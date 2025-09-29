import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, LogIn, Store, Shield, Users } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-6">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img src="/assets/logo-show-premios.png" alt="Show de Prêmios" className="h-40 w-auto" />
        </div>

        {/* Welcome Card */}
        <Card className="text-center">
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Bem-vindo ao Show de Prêmios</CardTitle>
            <CardDescription className="text-lg">
              Sistema de gestão de cupons e sorteios
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Login Instructions */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Info className="h-5 w-5" />
              Como fazer login
            </CardTitle>
            <CardDescription>
              Escolha seu tipo de acesso e use as credenciais abaixo para entrar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-white rounded-lg border">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <h4 className="font-semibold text-blue-900">Administrador</h4>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Acesso completo ao sistema de gestão
                </p>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Email:</p>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded block">
                    admin@sistema.com
                  </code>
                  <p className="text-xs text-gray-500">
                    Ou qualquer email que contenha "admin"
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Senha: qualquer uma
                  </p>
                </div>
              </div>

              <div className="p-4 bg-white rounded-lg border">
                <div className="flex items-center gap-2 mb-3">
                  <Store className="h-5 w-5 text-emerald-600" />
                  <h4 className="font-semibold text-emerald-900">Lojista</h4>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Painel para gestão da sua loja
                </p>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Email:</p>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded block">
                    loja@exemplo.com
                  </code>
                  <p className="text-xs text-gray-500">
                    Ou qualquer email com "loja" ou terminado em .com
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Senha: qualquer uma
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid md:grid-cols-2 gap-4">
          <Button
            onClick={() => navigate('/login')}
            className="h-16 text-lg"
            size="lg"
          >
            <Shield className="mr-2 h-5 w-5" />
            Acesso Administrativo
          </Button>
          
          <Button
            onClick={() => navigate('/login-lojista')}
            variant="outline"
            className="h-16 text-lg border-2"
            size="lg"
          >
            <Store className="mr-2 h-5 w-5" />
            Painel do Lojista
          </Button>
        </div>

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Funcionalidades do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="font-medium mb-1">Gestão Admin</h4>
                <p className="text-gray-600">Controle total de lojistas, cupons e sorteios</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Store className="h-6 w-6 text-emerald-600" />
                </div>
                <h4 className="font-medium mb-1">Painel Lojista</h4>
                <p className="text-gray-600">Atribuição de cupons e controle de vendas</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <h4 className="font-medium mb-1">Clientes</h4>
                <p className="text-gray-600">Gestão de clientes e histórico de cupons</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Home;