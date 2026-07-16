'use client';
import { useEffect, useState } from 'react';
import MetricCard from '@/components/ui/MetricCard';
import Card from '@/components/ui/Card';
import BarChart from '@/components/charts/BarChart';
import PieChart from '@/components/charts/PieChart';
import { formatCLPCompact } from '@/lib/utils/formatCLP';
import { calcSavingsRate, calcFinancialHealth } from '@/lib/utils/calculations';
import { CATEGORY_TO_GROUP, CATEGORY_TIER, TIER_LABELS } from '@/lib/config/categoryGroups';
import type { MonthlyTotals, CategoryBreakdown, TransactionCategory } from '@/types';

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
function fmtMonth(yyyymm: string) {
  const [y, m] = yyyymm.split('-');
  return `${MESES[+m - 1]} ${y}`;
}

const HEALTH_CONFIG = {
  green:  { label: 'Saludable',   bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500' },
  yellow: { label: 'Moderado',    bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-400' },
  red:    { label: 'En riesgo',   bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500' },
};

export default function OverviewPage() {
  const currentMonth = new Date().toISOString().substring(0, 7);

  const [currentTotals, setCurrentTotals] = useState({ income: 0, expenses: 0 });
  const [monthlyData,   setMonthlyData]   = useState<MonthlyTotals[]>([]);
  const [categories,    setCategories]    = useState<CategoryBreakdown[]>([]);
  const [catView,       setCatView]       = useState<'category' | 'group'>('category');

  useEffect(() => {
    fetch(`/api/transactions?summary=current-month&month=${currentMonth}`)
      .then((r) => r.json()).then(setCurrentTotals);
    fetch(`/api/transactions?summary=monthly&months=6`)
      .then((r) => r.json()).then(setMonthlyData);
    fetch(`/api/transactions?summary=categories&month=${currentMonth}`)
      .then((r) => r.json()).then(setCategories);
  }, [currentMonth]);

  const balance     = currentTotals.income - currentTotals.expenses;
  const savingsRate = calcSavingsRate(currentTotals.income, currentTotals.expenses);
  const health      = calcFinancialHealth(savingsRate);
  const hc          = HEALTH_CONFIG[health];

  // Agrupa el desglose por categoría en grupos por área de vida
  const groupedCategories = Object.values(
    categories.reduce<Record<string, CategoryBreakdown>>((acc, c) => {
      const group = CATEGORY_TO_GROUP[c.category as TransactionCategory] ?? 'Otros';
      acc[group] = acc[group]
        ? { category: group, total: acc[group].total + c.total }
        : { category: group, total: c.total };
      return acc;
    }, {})
  ).sort((a, b) => b.total - a.total);

  const displayCategories = catView === 'category' ? categories : groupedCategories;

  // Desglose por categoría dentro de cada tier de necesidad
  const essentialCategories = categories.filter(
    (c) => CATEGORY_TIER[c.category as TransactionCategory] === 'esencial'
  );
  const discretionaryCategories = categories.filter(
    (c) => CATEGORY_TIER[c.category as TransactionCategory] === 'discrecional'
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Panorama general</h1>
        <p className="text-sm text-gray-500 mt-1">{currentMonth}</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Ingresos del mes"
          value={formatCLPCompact(currentTotals.income)}
          accentColor="green"
        />
        <MetricCard
          title="Gastos del mes"
          value={formatCLPCompact(currentTotals.expenses)}
          accentColor="red"
        />
        <MetricCard
          title="Balance neto"
          value={formatCLPCompact(balance)}
          accentColor={balance >= 0 ? 'blue' : 'red'}
        />
        <MetricCard
          title="Tasa de ahorro"
          value={`${savingsRate}%`}
          accentColor={savingsRate >= 20 ? 'green' : savingsRate >= 10 ? 'gray' : 'red'}
        />
      </div>

      {/* Health indicator */}
      <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg ${hc.bg}`}>
        <span className={`w-2 h-2 rounded-full ${hc.dot}`} />
        <span className={`text-sm font-medium ${hc.text}`}>
          Salud financiera: {hc.label} — tasa de ahorro {savingsRate}%
        </span>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-sm font-medium text-gray-700 mb-4">Ingresos vs Gastos — últimos 6 meses</h2>
          <BarChart
            labels={monthlyData.map((m) => fmtMonth(m.month))}
            datasets={[
              { name: 'Ingresos',  values: monthlyData.map((m) => m.income),   color: '#10b981' },
              { name: 'Gastos',    values: monthlyData.map((m) => m.expenses),  color: '#ef4444' },
            ]}
            height={280}
          />
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-700">Distribución de gastos — {currentMonth}</h2>
            <div className="flex text-xs border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setCatView('category')}
                className={`px-2 py-1 ${catView === 'category' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}
              >
                Por categoría
              </button>
              <button
                onClick={() => setCatView('group')}
                className={`px-2 py-1 ${catView === 'group' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}
              >
                Por grupo
              </button>
            </div>
          </div>
          {displayCategories.length > 0 ? (
            <PieChart
              labels={displayCategories.map((c) => c.category)}
              values={displayCategories.map((c) => c.total)}
              height={280}
            />
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              Sin gastos registrados este mes
            </div>
          )}
        </Card>
      </div>

      {/* Esencial vs Discrecional */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-sm font-medium text-gray-700 mb-4">
            {TIER_LABELS.esencial} — {currentMonth}
          </h2>
          {essentialCategories.length > 0 ? (
            <PieChart
              labels={essentialCategories.map((c) => c.category)}
              values={essentialCategories.map((c) => c.total)}
              height={280}
            />
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              Sin gastos esenciales este mes
            </div>
          )}
        </Card>

        <Card>
          <h2 className="text-sm font-medium text-gray-700 mb-4">
            {TIER_LABELS.discrecional} — {currentMonth}
          </h2>
          {discretionaryCategories.length > 0 ? (
            <PieChart
              labels={discretionaryCategories.map((c) => c.category)}
              values={discretionaryCategories.map((c) => c.total)}
              height={280}
            />
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              Sin gastos discrecionales este mes
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
