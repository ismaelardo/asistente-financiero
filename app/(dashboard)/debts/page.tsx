'use client';
import { useEffect, useState, useCallback } from 'react';
import Card from '@/components/ui/Card';
import ProgressBar from '@/components/ui/ProgressBar';
import LineChart from '@/components/charts/LineChart';
import { FormField, Input } from '@/components/ui/FormField';
import { formatCLP } from '@/lib/utils/formatCLP';
import { calcDebtFreeDate } from '@/lib/utils/calculations';
import { Plus, X, Pencil, Trash2, Check } from 'lucide-react';
import type { Debt, CreateDebtInput } from '@/types';

const EMPTY: CreateDebtInput = {
  name: '', total_amount: 0, remaining_amount: 0,
  interest_rate: 0, monthly_payment: 0, due_date: '',
};

function buildProjection(debts: Debt[], months = 18) {
  if (debts.length === 0) return { labels: [], values: [] };

  let remaining = debts.map((d) => ({
    balance: d.remaining_amount,
    rate:    d.interest_rate / 100 / 12,
    payment: d.monthly_payment,
  }));

  const labels: string[] = [];
  const values: number[] = [];
  const now = new Date();

  labels.push(now.toISOString().substring(0, 7));
  values.push(remaining.reduce((s, d) => s + d.balance, 0));

  for (let i = 1; i <= months; i++) {
    remaining = remaining.map((d) => ({
      ...d,
      balance: Math.max(0, d.balance * (1 + d.rate) - d.payment),
    }));
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    labels.push(d.toISOString().substring(0, 7));
    const total = remaining.reduce((s, r) => s + r.balance, 0);
    values.push(Math.round(total));
    if (total === 0) break;
  }
  return { labels, values };
}

export default function DebtsPage() {
  const [debts,    setDebts]    = useState<Debt[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId,   setEditId]   = useState<number | null>(null);
  const [form,     setForm]     = useState<CreateDebtInput>(EMPTY);

  const load = useCallback(async () => {
    const res = await fetch('/api/debts');
    setDebts(await res.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = {
      ...form,
      total_amount:     Number(form.total_amount),
      remaining_amount: Number(form.remaining_amount),
      interest_rate:    Number(form.interest_rate),
      monthly_payment:  Number(form.monthly_payment),
    };
    if (editId !== null) {
      await fetch(`/api/debts/${editId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      setEditId(null);
    } else {
      await fetch('/api/debts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
    }
    setForm(EMPTY);
    setShowForm(false);
    load();
  };

  const handleEdit = (d: Debt) => {
    setForm({ name: d.name, total_amount: d.total_amount, remaining_amount: d.remaining_amount, interest_rate: d.interest_rate, monthly_payment: d.monthly_payment, due_date: d.due_date });
    setEditId(d.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar esta deuda?')) return;
    await fetch(`/api/debts/${id}`, { method: 'DELETE' });
    load();
  };

  const totalDebt   = debts.reduce((s, d) => s + d.remaining_amount, 0);
  const totalOriginal = debts.reduce((s, d) => s + d.total_amount, 0);
  const debtFreeDate  = calcDebtFreeDate(debts);
  const { labels, values } = buildProjection(debts);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Tracker de deudas</h1>
        <button
          onClick={() => { setShowForm(!showForm); setEditId(null); setForm(EMPTY); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showForm ? <X size={15} /> : <Plus size={15} />}
          {showForm ? 'Cancelar' : 'Nueva deuda'}
        </button>
      </div>

      {/* Metric summary */}
      <div className="flex flex-wrap gap-6 text-sm">
        <div>
          <p className="text-gray-500">Deuda total</p>
          <p className="text-xl font-semibold text-red-500">{formatCLP(totalDebt)}</p>
        </div>
        {debtFreeDate && (
          <div>
            <p className="text-gray-500">Libre de deudas</p>
            <p className="text-xl font-semibold text-blue-600">
              {debtFreeDate.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        )}
      </div>

      {/* Inline form */}
      {showForm && (
        <Card>
          <h2 className="text-sm font-medium text-gray-700 mb-4">
            {editId ? 'Editar deuda' : 'Nueva deuda'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <FormField label="Nombre">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Crédito BancoEstado" required />
            </FormField>
            <FormField label="Monto original (CLP)">
              <Input type="number" min="1" value={form.total_amount || ''} onChange={(e) => setForm({ ...form, total_amount: Number(e.target.value) })} required />
            </FormField>
            <FormField label="Saldo pendiente (CLP)">
              <Input type="number" min="0" value={form.remaining_amount || ''} onChange={(e) => setForm({ ...form, remaining_amount: Number(e.target.value) })} required />
            </FormField>
            <FormField label="Tasa anual (%)">
              <Input type="number" min="0" step="0.1" value={form.interest_rate || ''} onChange={(e) => setForm({ ...form, interest_rate: Number(e.target.value) })} />
            </FormField>
            <FormField label="Cuota mensual (CLP)">
              <Input type="number" min="1" value={form.monthly_payment || ''} onChange={(e) => setForm({ ...form, monthly_payment: Number(e.target.value) })} required />
            </FormField>
            <FormField label="Fecha de vencimiento">
              <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} required />
            </FormField>
            <div className="col-span-full flex justify-end">
              <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                <Check size={15} />
                {editId ? 'Guardar cambios' : 'Agregar deuda'}
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Debt cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {debts.map((d) => {
          const pct = totalOriginal > 0 ? Math.round(((d.total_amount - d.remaining_amount) / d.total_amount) * 100) : 0;
          return (
            <Card key={d.id}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-medium text-gray-900">{d.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Tasa: {d.interest_rate}% anual</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(d)} className="text-gray-400 hover:text-blue-600 transition-colors"><Pencil size={14} /></button>
                  <button onClick={() => handleDelete(d.id)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Pagado</span>
                <span className="font-medium text-gray-900">{pct}%</span>
              </div>
              <ProgressBar value={pct} color="blue" showLabel={false} />
              <div className="flex justify-between text-sm mt-3">
                <span className="text-red-500 font-medium">{formatCLP(d.remaining_amount)} pendiente</span>
                <span className="text-gray-500">Cuota: {formatCLP(d.monthly_payment)}/mes</span>
              </div>
            </Card>
          );
        })}
        {debts.length === 0 && (
          <div className="col-span-2 text-center text-gray-400 py-12 text-sm">
            Sin deudas registradas — ¡excelente!
          </div>
        )}
      </div>

      {/* Projection chart */}
      {labels.length > 1 && (
        <Card>
          <h2 className="text-sm font-medium text-gray-700 mb-4">Proyección de deuda total</h2>
          <LineChart
            labels={labels}
            datasets={[{ name: 'Deuda total', values, color: '#2563eb' }]}
            height={280}
          />
        </Card>
      )}
    </div>
  );
}
