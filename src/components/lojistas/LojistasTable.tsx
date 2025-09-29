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

  // Buscar lojas do banco de dados
  const { data: lojasDB = [], isLoading, refetch } = useQuery({
    queryKey: ['lojas', searchInput, statusFilter],
    queryFn: async () => {
      console.log('🔍 Buscando lojas do banco de dados...');
      
      let query = supabase
        .from('lojas')
        .select('*')
        .order('created_at', { ascending: false });

      // Filtrar por status
      if (statusFilter !== 'todos') {
        query = query.eq('ativo', statusFilter === 'ativo');
      }

      // Buscar por nome
      if (searchInput) {
        query = query.ilike('nome_loja', `%${searchInput}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Erro ao buscar lojas:', error);
        return [];
      }

      console.log('✅ Lojas carregadas:', data?.length);
      return (data || []) as LojaDB[];
    },
  });

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
                  Carregando lojas...
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