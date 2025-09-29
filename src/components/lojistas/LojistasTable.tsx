import { useMemo, useState, useEffect } from 'react';
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

interface Lojista {
  id: string;
  nome_loja: string;
  cnpj: string;
  shopping?: string;
  segmento?: string;
  status: string;
  cupons_nao_atribuidos: number;
  blocos_comprados?: number;
  telefone?: string;
  email?: string;
  responsavel_nome?: string;
  cidade: string;
  endereco?: string;
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

  // Mock data
  const lojistas: Lojista[] = [
    {
      id: '1',
      nome_loja: 'Loja Exemplo',
      cnpj: '12345678000190',
      shopping: 'Shopping Center',
      segmento: 'Vestuário',
      status: 'ativo',
      cupons_nao_atribuidos: 150,
      blocos_comprados: 5,
      telefone: '(11) 99999-9999',
      email: 'loja@exemplo.com',
      responsavel_nome: 'João Silva',
      cidade: 'São Paulo',
      endereco: 'Rua Exemplo, 123'
    }
  ];

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
      accessorKey: 'responsavel_nome',
      header: 'Responsável',
    },
    {
      accessorKey: 'blocos_comprados',
      header: 'Blocos Comprados',
      cell: ({ row }: any) => (
        <div className="text-center font-semibold">
          {row.getValue('blocos_comprados') || 0}
        </div>
      ),
    },
    {
      accessorKey: 'cupons_nao_atribuidos',
      header: 'Cupons Disponíveis',
      cell: ({ row }: any) => (
        <div className="text-center">
          <Badge variant="outline" className="font-mono">
            {(row.getValue('cupons_nao_atribuidos') || 0).toLocaleString()}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: any) => {
        const status = row.getValue('status');
        const variant = status === 'ativo' ? 'default' : status === 'inativo' ? 'secondary' : 'destructive';
        return (
          <Badge variant={variant}>
            {status}
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
            {table.getRowModel().rows?.length ? (
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
                  Nenhum lojista encontrado.
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
            // Refresh data
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
          // Refresh data
        }}
      />
    </div>
  );
};