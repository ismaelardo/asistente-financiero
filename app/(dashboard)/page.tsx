'use client';
import { useEffect, useState } from 'react';
import MetricCard from '@/components/ui/MetricCard';
import Card from '@/components/ui/Card';
import BarChart from '@/components/charts/BarChart';
import PieChart from '@/components/charts/PieChart';
import { formatCLP, formatCLPCompact } from '@/lib/utils/formatCLP';
import { calcSavingsRate, calcFinancialHealth } from '@/lib/utils/calculations';
import type { MonthlyTotals, CategoryBreakdown } from '@/types';

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
            labels={monthlyData.map((m) => m.month)}
            datasets={[
              { name: 'Ingresos',  values: monthlyData.map((m) => m.income),   color: '#10b981' },
              { name: 'Gastos',    values: monthlyData.map((m) => m.expenses),  color: '#ef4444' },
            ]}
            height={280}
          />
        </Card>

        <Card>
          <h2 className="text-sm font-medium text-gray-700 mb-4">Distribución de gastos — {currentMonth}</h2>
          {categories.length > 0 ? (
            <PieChart
              labels={categories.map((c) => c.category)}
              values={categories.map((c) => c.total)}
              height={280}
            />
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              Sin gastos registrados este mes
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
