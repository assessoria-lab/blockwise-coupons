# Sistema de Blocos de Cupons - Painel Administrativo

## 📋 Visão Geral

Este é um painel administrativo moderno e profissional para gerenciar um sistema de cupons baseado em **blocos**. O sistema implementa o modelo de negócio onde lojistas compram blocos de 100 cupons, e os cupons são posteriormente atribuídos aos clientes com base em suas compras.

## 🎯 Modelo de Negócio Implementado

### Sistema de 3 Estados dos Cupons

1. **Estado 1: Pool Geral** 
   - Status: `disponivel_venda`
   - Blocos criados pelo sistema, aguardando compra por lojistas
   - `bloco.lojista_id = NULL`

2. **Estado 2: Blocos com Lojistas**
   - Status: `nao_atribuido` 
   - Blocos comprados por lojistas, cupons não atribuídos a clientes
   - `bloco.lojista_id = UUID_lojista`

3. **Estado 3: Cupons Atribuídos**
   - Status: `atribuido`
   - Cupons atribuídos a clientes baseados em compras reais
   - `cupom.cliente_id = UUID_cliente`

### Numeração Sequencial Única

- Range: 1.000.000 até 999.999.999.999
- Formato: `CP000001000001` (exemplo)
- Sequência global nunca repete
- Gerenciada pela sequência `seq_cupom_global`

## 🏗️ Estrutura do Projeto

```
src/
├── components/
│   ├── admin/
│   │   ├── AdminLayout.tsx          # Layout principal com sidebar
│   │   ├── DashboardBlocos.tsx      # Dashboard principal
│   │   ├── GestaoPoolBlocos.tsx     # Gestão de criação de blocos
│   │   └── ConfiguracoesSistema.tsx # Configurações do sistema
│   └── ui/                          # Componentes shadcn/ui
├── types/
│   └── blocks.ts                    # Tipos TypeScript para Supabase
├── pages/
│   ├── Index.tsx                    # Página principal
│   └── NotFound.tsx                 # Página 404 personalizada
└── hooks/                           # Hooks customizados
```

## 🎨 Design System

O sistema implementa um design profissional com:

- **Cores Semânticas**: Sistema baseado em tokens CSS para consistência
- **Estados Visuais**: Cada estado dos blocos tem cores específicas
  - Pool Geral: Azul (`--pool-available`)
  - Lojistas: Índigo (`--lojista-blocks`) 
  - Clientes: Verde (`--client-assigned`)
- **Gradientes**: Botões e elementos com gradientes modernos
- **Sombras**: Sistema de profundidade com sombras sutis
- **Responsivo**: Layout adaptativo para desktop e mobile

## 📊 Funcionalidades Implementadas

### 1. Dashboard Principal
- Métricas dos 3 estados dos blocos
- Controle da sequência global de cupons
- Estatísticas em tempo real
- Indicadores de integridade do sistema

### 2. Gestão de Blocos
- Criação de novos blocos no pool
- Prévia da operação antes de confirmar
- Validações de quantidade
- Feedback visual de sucesso/erro

### 3. Layout Administrativo
- Sidebar navegável com badges informativos
- Header contextual
- Navegação fluida entre páginas
- Status de conexão com Supabase

### 4. Configurações
- Informações do sistema
- Configurações de notificações
- Configurações de segurança
- Status de conexão com banco de dados

## 🔌 Integração com Supabase

O sistema está preparado para integração com Supabase:

1. **Tipos TypeScript**: Estrutura completa em `types/blocks.ts`
2. **Funções RPC**: Preparado para chamar `criar_blocos_pool`
3. **Views Materializadas**: Configurado para `mv_dashboard_blocos`
4. **Queries em Tempo Real**: Estrutura para subscriptions

### Para Conectar ao Supabase:

1. Clique no botão verde "Supabase" no topo da interface
2. Configure suas tabelas baseadas nos tipos em `types/blocks.ts`
3. Implemente as funções RPC necessárias
4. Configure as policies de RLS

## 📈 Métricas do Sistema

O dashboard monitora:

- **Blocos no Pool**: Disponíveis para venda
- **Blocos com Lojistas**: Vendidos mas não atribuídos
- **Cupons Atribuídos**: Participando dos sorteios
- **Sequência Global**: Integridade e capacidade
- **Atividade Diária**: Vendas e atribuições do dia

## 🚀 Próximos Passos

Após conectar ao Supabase, você pode expandir com:

1. **Gestão de Lojistas**: CRUD completo
2. **Gestão de Clientes**: Interface de clientes
3. **Sistema de Sorteios**: Módulo completo de sorteios
4. **Relatórios Avançados**: Analytics e exportações
5. **Notificações**: Sistema de alertas em tempo real

## 🛠️ Tecnologias Utilizadas

- **React 18** com TypeScript
- **Tailwind CSS** com design system customizado
- **shadcn/ui** para componentes base
- **Lucide React** para ícones
- **React Router** para navegação
- **Vite** para build e desenvolvimento

## 📱 Responsividade

O sistema é totalmente responsivo:
- **Desktop**: Layout de sidebar completa
- **Tablet**: Sidebar colapsável  
- **Mobile**: Menu hambúrguer com overlay

---

**Status**: ✅ Pronto para produção com dados mockados
**Próximo**: 🔌 Conectar ao Supabase para dados reais