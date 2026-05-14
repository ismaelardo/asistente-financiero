'use client';
import { useEffect, useState, useCallback } from 'react';
import Card from '@/components/ui/Card';
import ProgressBar from '@/components/ui/ProgressBar';
import LineChart from '@/components/charts/LineChart';
import { FormField, Input } from '@/components/ui/FormField';
import { formatCLP } from '@/lib/utils/formatCLP';
import { calcOptimalGoalLevels } from '@/lib/utils/calculations';
import { Plus, X, Pencil, Trash2, Check } from 'lucide-react';
import type { Goal, CreateGoalInput, MonthlyTotals } from '@/types';

const EMPTY: CreateGoalInput = {
  name: '', target_amount: 0, current_amount: 0, deadline: '', category: '',
};

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
}

function goalProjection(goal: Goal, monthlySavings: number) {
  if (monthlySavings <= 0) return { labels: [], values: [] };
  const needed  = goal.target_amount - goal.current_amount;
  const months  = Math.min(Math.ceil(needed / monthlySavings) + 1, 24);
  const labels: string[] = [];
  const values: number[] = [];
  let amount = goal.current_amount;
  const now = new Date();
  for (let i = 0; i <= months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    labels.push(d.toISOString().substring(0, 7));
    values.push(Math.min(goal.target_amount, Math.round(amount)));
    amount += monthlySavings;
  }
  return { labels, values };
}

export default function GoalsPage() {
  const [goals,       setGoals]       = useState<Goal[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyTotals[]>([]);
  const [showForm,    setShowForm]    = useState(false);
  const [editId,      setEditId]      = useState<number | null>(null);
  const [form,        setForm]        = useState<CreateGoalInput>(EMPTY);

  const load = useCallback(async () => {
    const [gl, tx] = await Promise.all([
      fetch('/api/goals').then((r) => r.json()),
      fetch('/api/transactions?summary=monthly&months=3').then((r) => r.json()),
    ]);
    setGoals(gl);
    setMonthlyData(tx);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = { ...form, target_amount: Number(form.target_amount), current_amount: Number(form.current_amount) };
    if (editId !== null) {
      await fetch(`/api/goals/${editId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      setEditId(null);
    } else {
      await fetch('/api/goals', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
    }
    setForm(EMPTY);
    setShowForm(false);
    load();
  };

  const handleEdit = (g: Goal) => {
    setForm({ name: g.name, target_amount: g.target_amount, current_amount: g.current_amount, deadline: g.deadline, category: g.category });
    setEditId(g.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar esta meta?')) return;
    await fetch(`/api/goals/${id}`, { method: 'DELETE' });
    load();
  };

  const avgIncome   = monthlyData.length > 0 ? monthlyData.reduce((s, m) => s + m.income,   0) / monthlyData.length : 0;
  const avgExpenses = monthlyData.length > 0 ? monthlyData.reduce((s, m) => s + m.expenses, 0) / monthlyData.length : 0;
  const monthlySavings = avgIncome - avgExpenses;
  const optimal = calcOptimalGoalLevels(avgIncome, avgExpenses);

  // Build a multi-series chart with one line per goal
  const allLabels = goals.length > 0
    ? goalProjection(goals[0], monthlySavings / Math.max(1, goals.length)).labels
    : [];

  const chartDatasets = goals.map((g, i) => {
    const colors = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6'];
    const { values } = goalProjection(g, monthlySavings / Math.max(1, goals.length));
    return { name: g.name, values, color: colors[i % colors.length] };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Metas</h1>
        <button
          onClick={() => { setShowForm(!showForm); setEditId(null); setForm(EMPTY); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showForm ? <X size={15} /> : <Plus size={15} />}
          {showForm ? 'Cancelar' : 'Nueva meta'}
        </button>
      </div>

      {/* Optimal levels */}
      <Card className="bg-blue-50 border-blue-100">
        <h2 className="text-sm font-medium text-blue-800 mb-3">Niveles óptimos sugeridos</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-blue-600 font-medium">Fondo de emergencia</p>
            <p className="text-blue-900">{formatCLP(optimal.emergencyFund)}</p>
            <p className="text-blue-500 text-xs mt-0.5">3 × promedio de gastos</p>
          </div>
          <div>
            <p className="text-blue-600 font-medium">Ahorro mensual óptimo</p>
            <p className="text-blue-900">{formatCLP(optimal.optimalMonthlySavings)}</p>
            <p className="text-blue-500 text-xs mt-0.5">20% de ingresos promedio</p>
          </div>
          <div>
            <p className="text-blue-600 font-medium">Deuda máxima sana</p>
            <p className="text-blue-900">{formatCLP(optimal.maxHealthyDebt)}</p>
            <p className="text-blue-500 text-xs mt-0.5">30% de ingresos mensuales</p>
          </div>
        </div>
      </Card>

      {/* Inline form */}
      {showForm && (
        <Card>
          <h2 className="text-sm font-medium text-gray-700 mb-4">{editId ? 'Editar meta' : 'Nueva meta'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <FormField label="Nombre de la meta">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Fondo de emergencia" required />
            </FormField>
            <FormField label="Monto objetivo (CLP)">
              <Input type="number" min="1" value={form.target_amount || ''} onChange={(e) => setForm({ ...form, target_amount: Number(e.target.value) })} required />
            </FormField>
            <FormField label="Acumulado actual (CLP)">
              <Input type="number" min="0" value={form.current_amount || ''} onChange={(e) => setForm({ ...form, current_amount: Number(e.target.value) })} />
            </FormField>
            <FormField label="Fecha límite">
              <Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} required />
            </FormField>
            <FormField label="Categoría">
              <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Ej: ahorro, viaje, tecnología" />
            </FormField>
            <div className="col-span-full flex justify-end">
              <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
                <Check size={15} />
                {editId ? 'Guardar cambios' : 'Crear meta'}
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Goal cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {goals.map((g) => {
          const pct = g.target_amount > 0 ? Math.round((g.current_amount / g.target_amount) * 100) : 0;
          const days = daysUntil(g.deadline);
          const color = pct >= 75 ? 'green' : pct >= 40 ? 'blue' : 'yellow';
          return (
            <Card key={g.id}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-medium text-gray-900">{g.name}</p>
                  {g.category && <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full mt-1 inline-block">{g.category}</span>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(g)} className="text-gray-400 hover:text-blue-600"><Pencil size={13} /></button>
                  <button onClick={() => handleDelete(g.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={13} /></button>
                </div>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">{formatCLP(g.current_amount)} / {formatCLP(g.target_amount)}</span>
                <span className="font-medium">{pct}%</span>
              </div>
              <ProgressBar value={pct} color={color} />
              <p className="text-xs text-gray-400 mt-2">
                {days > 0 ? `${days} días restantes` : 'Plazo vencido'} · hasta {g.deadline}
              </p>
            </Card>
          );
        })}
        {goals.length === 0 && (
          <div className="col-span-3 text-center text-gray-400 py-12 text-sm">
            Sin metas registradas. ¡Crea tu primera meta!
          </div>
        )}
      </div>

      {/* Projection chart */}
      {goals.length > 0 && allLabels.length > 0 && (
        <Card>
          <h2 className="text-sm font-medium text-gray-700 mb-4">Proyección de metas al ritmo actual</h2>
          <LineChart labels={allLabels} datasets={chartDatasets} height={280} />
        </Card>
      )}
    </div>
  );
}
