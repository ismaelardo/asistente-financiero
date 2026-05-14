'use client';
import { useEffect, useState, useCallback } from 'react';
import Card from '@/components/ui/Card';
import DataTable, { type Column } from '@/components/ui/DataTable';
import { FormField, Input, Select } from '@/components/ui/FormField';
import { formatCLP } from '@/lib/utils/formatCLP';
import { Pencil, Trash2, Plus, X, Check } from 'lucide-react';
import type { Transaction, CreateTransactionInput, TransactionCategory, TransactionType } from '@/types';

const CATEGORIES: TransactionCategory[] = [
  'alimentación','transporte','arriendo','servicios',
  'salud','educación','entretenimiento','otros',
];

const EMPTY_FORM: CreateTransactionInput = {
  date: new Date().toISOString().substring(0, 10),
  amount: 0,
  category: 'otros',
  description: '',
  type: 'expense',
  source: '',
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total,        setTotal]        = useState(0);
  const [page,         setPage]         = useState(1);
  const [filterMonth,  setFilterMonth]  = useState('');
  const [filterCat,    setFilterCat]    = useState('');
  const [filterType,   setFilterType]   = useState('');
  const [showForm,     setShowForm]     = useState(false);
  const [editId,       setEditId]       = useState<number | null>(null);
  const [form,         setForm]         = useState<CreateTransactionInput>(EMPTY_FORM);

  const PAGE_SIZE = 15;

  const buildUrl = useCallback(() => {
    const p = new URLSearchParams({
      page:     String(page),
      pageSize: String(PAGE_SIZE),
    });
    if (filterMonth) p.set('month',    filterMonth);
    if (filterCat)   p.set('category', filterCat);
    if (filterType)  p.set('type',     filterType);
    return `/api/transactions?${p}`;
  }, [page, filterMonth, filterCat, filterType]);

  const load = useCallback(async () => {
    const res = await fetch(buildUrl());
    const data = await res.json();
    setTransactions(data.data);
    setTotal(data.total);
  }, [buildUrl]);

  useEffect(() => { load(); }, [load]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [filterMonth, filterCat, filterType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = { ...form, amount: Number(form.amount) };
    if (editId !== null) {
      await fetch(`/api/transactions/${editId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      setEditId(null);
    } else {
      await fetch('/api/transactions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
    }
    setForm(EMPTY_FORM);
    setShowForm(false);
    load();
  };

  const handleEdit = (tx: Transaction) => {
    setForm({ date: tx.date, amount: tx.amount, category: tx.category, description: tx.description, type: tx.type, source: tx.source });
    setEditId(tx.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar esta transacción?')) return;
    await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
    load();
  };

  const totalFiltered = transactions.reduce(
    (acc, tx) => {
      tx.type === 'income' ? (acc.income += tx.amount) : (acc.expenses += tx.amount);
      return acc;
    },
    { income: 0, expenses: 0 }
  );

  const columns: Column<Transaction>[] = [
    { header: 'Fecha',       accessor: 'date' },
    { header: 'Descripción', accessor: 'description' },
    { header: 'Categoría',   accessor: 'category' },
    {
      header: 'Tipo',
      accessor: (tx) => (
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tx.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {tx.type === 'income' ? 'Ingreso' : 'Gasto'}
        </span>
      ),
    },
    {
      header: 'Monto',
      accessor: (tx) => (
        <span className={tx.type === 'income' ? 'text-green-600 font-medium' : 'text-gray-900'}>
          {tx.type === 'income' ? '+' : '-'}{formatCLP(tx.amount)}
        </span>
      ),
    },
    { header: 'Fuente', accessor: 'source' },
    {
      header: '',
      accessor: (tx) => (
        <div className="flex gap-2">
          <button onClick={() => handleEdit(tx)} className="text-gray-400 hover:text-blue-600 transition-colors">
            <Pencil size={14} />
          </button>
          <button onClick={() => handleDelete(tx.id)} className="text-gray-400 hover:text-red-500 transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Generate last 12 months for filter
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return d.toISOString().substring(0, 7);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Transacciones</h1>
        <button
          onClick={() => { setShowForm(!showForm); setEditId(null); setForm(EMPTY_FORM); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showForm ? <X size={15} /> : <Plus size={15} />}
          {showForm ? 'Cancelar' : 'Nueva transacción'}
        </button>
      </div>

      {/* Inline form */}
      {showForm && (
        <Card>
          <h2 className="text-sm font-medium text-gray-700 mb-4">
            {editId ? 'Editar transacción' : 'Nueva transacción'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <FormField label="Fecha">
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            </FormField>
            <FormField label="Tipo">
              <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as TransactionType })}>
                <option value="expense">Gasto</option>
                <option value="income">Ingreso</option>
              </Select>
            </FormField>
            <FormField label="Categoría">
              <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as TransactionCategory })}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </FormField>
            <FormField label="Descripción">
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ej: Supermercado semanal" required />
            </FormField>
            <FormField label="Monto (CLP)">
              <Input type="number" min="1" value={form.amount || ''} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} placeholder="0" required />
            </FormField>
            <FormField label="Fuente / Destino">
              <Input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="Ej: Jumbo, Trabajo" required />
            </FormField>
            <div className="col-span-full flex justify-end">
              <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                <Check size={15} />
                {editId ? 'Guardar cambios' : 'Agregar'}
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos los meses</option>
          {monthOptions.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todas las categorías</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Ingresos y gastos</option>
          <option value="income">Solo ingresos</option>
          <option value="expense">Solo gastos</option>
        </select>
      </div>

      {/* Summary */}
      <div className="flex gap-6 text-sm">
        <span className="text-green-600 font-medium">Ingresos: {formatCLP(totalFiltered.income)}</span>
        <span className="text-red-500 font-medium">Gastos: {formatCLP(totalFiltered.expenses)}</span>
        <span className="text-gray-600">{total} registros</span>
      </div>

      {/* Table */}
      <Card>
        <DataTable columns={columns} data={transactions} keyField="id" emptyMessage="Sin transacciones para los filtros seleccionados" />

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 mt-6 pt-4 border-t border-gray-100">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-500">{page} / {totalPages}</span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              Siguiente
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}
