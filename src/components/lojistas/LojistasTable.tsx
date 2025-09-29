import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  getFilteredRowModel,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Edit, DollarSign } from 'lucide-react';
import { VendaBlocosModal } from './VendaBlocosModal';
import { LojistaModal } from './LojistaModal';

interface LojaDB {
  id: string;
  nome_loja: string;
  cnpj?: string;
  shopping?: string;
  segmento?: string;
  ativo: boolean;
  cidade?: string;
  endereco?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface Lojista {
  id: string;
  nome_loja: string;
  cnpj: string;
  shopping?: string;
  segmento?: string;
  status: string;
  cidade: string;
  endereco?: string;
  telefone?: string;
  email?: string;
  responsavel_nome?: string;
  cupons_nao_atribuidos?: number;
  blocos_comprados?: number;
}

export const LojistasTable = () => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [selectedLojista, setSelectedLojista] = useState<Lojista | null>(null);
  const [showVendaModal, setShowVendaModal] = useState(false);
  const [showLojistaModal, setShowLojistaModal] = useState(false);
  const [editingLojista, setEditingLojista] = useState<Lojista | null>(null);

  // Dados de demonstração
  const lojasDemo: LojaDB[] = [
    { id: '1', nome_loja: 'Bella Moda', cnpj: '10000000000001', cidade: 'São Paulo', shopping: 'Shopping Ibirapuera', segmento: 'Moda e Vestuário', ativo: true, endereco: 'Rua das Lojas, 100', user_id: 'demo', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: '2', nome_loja: 'Fashion Style', cnpj: '10000000000002', cidade: 'Rio de Janeiro', shopping: 'Barra Shopping', segmento: 'Moda e Vestuário', ativo: true, endereco: 'Rua das Lojas, 200', user_id: 'demo', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: '3', nome_loja: 'Trend Boutique', cnpj: '10000000000003', cidade: 'São Paulo', shopping: 'Shopping Morumbi', segmento: 'Moda e Vestuário', ativo: true, endereco: 'Rua das Lojas, 300', user_id: 'demo', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: '4', nome_loja: 'Chic Fashion', cnpj: '10000000000004', cidade: 'Curitiba', shopping: 'Shopping JK Iguatemi', segmento: 'Moda e Vestuário', ativo: true, endereco: 'Rua das Lojas, 400', user_id: 'demo', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: '5', nome_loja: 'Look Moderno', cnpj: '10000000000005', cidade: 'Belo Horizonte', shopping: 'Shopping Pátio Savassi', segmento: 'Moda e Vestuário', ativo: true, endereco: 'Rua das Lojas, 500', user_id: 'demo', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: '6', nome_loja: 'Glamour Store', cnpj: '10000000000006', cidade: 'Porto Alegre', shopping: 'Shopping Iguatemi Porto Alegre', segmento: 'Moda e Vestuário', ativo: true, endereco: 'Rua das Lojas, 600', user_id: 'demo', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: '7', nome_loja: 'Vogue Boutique', cnpj: '10000000000007', cidade: 'Rio de Janeiro', shopping: 'Shopping Morumbi', segmento: 'Moda e Vestuário', ativo: true, endereco: 'Rua das Lojas, 700', user_id: 'demo', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: '8', nome_loja: 'Elite Fashion', cnpj: '10000000000008', cidade: 'Belo Horizonte', shopping: 'Shopping Cidade Jardim', segmento: 'Moda e Vestuário', ativo: true, endereco: 'Rua das Lojas, 800', user_id: 'demo', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: '9', nome_loja: 'Style Mania', cnpj: '10000000000009', cidade: 'Curitiba', shopping: 'Shopping JK Iguatemi', segmento: 'Moda e Vestuário', ativo: true, endereco: 'Rua das Lojas, 900', user_id: 'demo', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: '10', nome_loja: 'Urban Chic', cnpj: '10000000000010', cidade: 'São Paulo', shopping: 'Shopping Eldorado', segmento: 'Moda e Vestuário', ativo: true, endereco: 'Rua das Lojas, 1000', user_id: 'demo', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ];

  // Usar dados mockados
  const lojasDB = lojasDemo;
  const isLoading = false;
  const error = null;
  const refetch = () => console.log('Refetch simulado');

  // Converter dados do banco para o formato da interface
  const lojistas: Lojista[] = useMemo(() => {
    return lojasDB.map(loja => ({
      id: loja.id,
      nome_loja: loja.nome_loja,
      cnpj: loja.cnpj || '',
      shopping: loja.shopping,
      segmento: loja.segmento,
      status: loja.ativo ? 'ativo' : 'inativo',
      cidade: loja.cidade || '',
      endereco: loja.endereco,
      cupons_nao_atribuidos: 0,
      blocos_comprados: 0,
    }));
  }, [lojasDB]);

  const columns = useMemo(() => [
    {
      accessorKey: 'nome_loja',
      header: 'Nome da Loja',
      cell: ({ row }: any) => (
        <div className="font-medium">{row.getValue('nome_loja')}</div>
      ),
    },
    {
      accessorKey: 'cnpj',
      header: 'CNPJ',
      cell: ({ row }: any) => (
        <div className="font-mono text-sm">{row.getValue('cnpj')}</div>
      ),
    },
    {
      accessorKey: 'shopping',
      header: 'Shopping',
      cell: ({ row }: any) => (
        <div>{row.getValue('shopping') || 'Não informado'}</div>
      ),
    },
    {
      accessorKey: 'segmento',
      header: 'Segmento',
      cell: ({ row }: any) => (
        <Badge variant="outline" className="text-xs">
          {row.getValue('segmento') || 'Não informado'}
        </Badge>
      ),
    },
    {
      accessorKey: 'cidade',
      header: 'Cidade',
      cell: ({ row }: any) => (
        <div>{row.getValue('cidade') || 'Não informado'}</div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: any) => {
        const status = row.getValue('status');
        return (
          <Badge variant={status === 'ativo' ? 'default' : 'secondary'}>
            {status === 'ativo' ? 'Ativo' : 'Inativo'}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: 'Ações',
      cell: ({ row }: any) => {
        const lojista = row.original;
        return (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingLojista(lojista);
                setShowLojistaModal(true);
              }}
              title="Editar Lojista"
            >
              <Edit className="h-4 w-4 mr-1" />
              Editar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedLojista(lojista);
                setShowVendaModal(true);
              }}
              title="Vender Blocos"
            >
              <DollarSign className="h-4 w-4 mr-1" />
              Vender
            </Button>
          </div>
        );
      },
    },
  ], []);

  const table = useReactTable({
    data: lojistas,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar lojistas..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-input rounded-md bg-background"
          >
            <option value="todos">Todos os Status</option>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
            <option value="suspenso">Suspenso</option>
          </select>
        </div>
        <Button onClick={() => {
          setEditingLojista(null);
          setShowLojistaModal(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Lojista
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
                    <p>Carregando lojas...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-red-500">Erro ao carregar lojas</p>
                    <Button onClick={() => refetch()} size="sm">Tentar novamente</Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Nenhuma loja encontrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {showVendaModal && selectedLojista && (
        <VendaBlocosModal
          lojista={selectedLojista}
          onClose={() => {
            setShowVendaModal(false);
            setSelectedLojista(null);
          }}
          onSuccess={() => {
            refetch();
          }}
        />
      )}

      <LojistaModal
        lojista={editingLojista}
        isOpen={showLojistaModal}
        onClose={() => {
          setShowLojistaModal(false);
          setEditingLojista(null);
        }}
        onSuccess={() => {
          refetch();
        }}
      />
    </div>
  );
};