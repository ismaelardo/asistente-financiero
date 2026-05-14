'use client';
import { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import LineChart from '@/components/charts/LineChart';
import { formatCLP } from '@/lib/utils/formatCLP';
import { projectBalance, calcDebtFreeDate } from '@/lib/utils/calculations';
import type { MonthlyTotals, Debt, Goal } from '@/types';

const AVG_CLASS_INCOME_PER_WEEK = 50000; // assumed hourly rate × hours

export default function ProjectionsPage() {
  const [monthlyData, setMonthlyData] = useState<MonthlyTotals[]>([]);
  const [debts,       setDebts]       = useState<Debt[]>([]);
  const [goals,       setGoals]       = useState<Goal[]>([]);

  // Scenario sliders
  const [extraClasses,   setExtraClasses]   = useState(0);
  const [fixedSalary,    setFixedSalary]    = useState(0);
  const [freelanceIncome, setFreelanceIncome] = useState(0);
  const [extraDebtPay,   setExtraDebtPay]   = useState(0);

  useEffect(() => {
    Promise.all([
      fetch('/api/transactions?summary=monthly&months=3').then((r) => r.json()),
      fetch('/api/debts').then((r) => r.json()),
      fetch('/api/goals').then((r) => r.json()),
    ]).then(([tx, db, gl]) => {
      setMonthlyData(tx);
      setDebts(db);
      setGoals(gl);
    });
  }, []);

  // Calculate averages from last 3 months
  const avgIncome   = monthlyData.length > 0 ? monthlyData.reduce((s, m) => s + m.income,   0) / monthlyData.length : 0;
  const avgExpenses = monthlyData.length > 0 ? monthlyData.reduce((s, m) => s + m.expenses, 0) / monthlyData.length : 0;

  // Baseline scenario (current)
  const baseProjection = projectBalance(0, avgIncome, avgExpenses, 12);

  // Simulated scenario
  const simExtraMonthlyIncome =
    extraClasses * AVG_CLASS_INCOME_PER_WEEK * 4.33 + fixedSalary + freelanceIncome;
  const simExpenses = avgExpenses + extraDebtPay;
  const simProjection = projectBalance(0, avgIncome + simExtraMonthlyIncome, simExpenses, 12);

  const accumulatedExtra = simProjection[simProjection.length - 1]?.balance - baseProjection[baseProjection.length - 1]?.balance;

  // Debt-free simulation
  const debtsWithExtra = debts.map((d) => ({
    ...d,
    monthly_payment: d.monthly_payment + extraDebtPay / Math.max(1, debts.length),
  }));
  const debtFreeBase  = calcDebtFreeDate(debts);
  const debtFreeSim   = calcDebtFreeDate(debtsWithExtra);

  // First goal milestone
  const firstGoal = goals.reduce<{ name: string; monthsToReach: number } | null>((best, g) => {
    const needed = g.target_amount - g.current_amount;
    const monthlySavings = (avgIncome + simExtraMonthlyIncome - avgExpenses - extraDebtPay);
    if (monthlySavings <= 0) return best;
    const months = Math.ceil(needed / monthlySavings);
    if (!best || months < best.monthsToReach) return { name: g.name, monthsToReach: months };
    return best;
  }, null);

  const labels = baseProjection.map((p) => p.month);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Proyecciones y simulador</h1>
        <p className="text-sm text-gray-500 mt-1">
          Promedio actual — Ingresos: {formatCLP(Math.round(avgIncome))} / Gastos: {formatCLP(Math.round(avgExpenses))}
        </p>
      </div>

      {/* Sliders */}
      <Card>
        <h2 className="text-sm font-medium text-gray-700 mb-5">Escenario simulado</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              label: 'Clases adicionales por semana',
              value: extraClasses,
              min: 0, max: 20, step: 1,
              display: `${extraClasses} clases`,
              onChange: setExtraClasses,
            },
            {
              label: 'Sueldo fijo mensual (CLP)',
              value: fixedSalary,
              min: 0, max: 2000000, step: 50000,
              display: formatCLP(fixedSalary),
              onChange: setFixedSalary,
            },
            {
              label: 'Ingreso freelance mensual (CLP)',
              value: freelanceIncome,
              min: 0, max: 1000000, step: 25000,
              display: formatCLP(freelanceIncome),
              onChange: setFreelanceIncome,
            },
            {
              label: 'Pago extra a deudas (CLP/mes)',
              value: extraDebtPay,
              min: 0, max: 500000, step: 10000,
              display: formatCLP(extraDebtPay),
              onChange: setExtraDebtPay,
            },
          ].map(({ label, value, min, max, step, display, onChange }) => (
            <div key={label}>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">{label}</span>
                <span className="font-medium text-blue-600">{display}</span>
              </div>
              <input
                type="range"
                min={min} max={max} step={step}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Simulator metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <p className="text-xs text-gray-500">Ahorro adicional (12 meses)</p>
          <p className={`text-xl font-semibold mt-1 ${accumulatedExtra >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {formatCLP(Math.round(accumulatedExtra))}
          </p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500">Libre de deudas</p>
          <p className="text-xl font-semibold mt-1 text-blue-600">
            {debtFreeSim
              ? debtFreeSim.toLocaleDateString('es-CL', { month: 'short', year: 'numeric' })
              : debtFreeBase
              ? debtFreeBase.toLocaleDateString('es-CL', { month: 'short', year: 'numeric' })
              : '—'}
            {debtFreeSim && debtFreeBase && debtFreeSim < debtFreeBase && (
              <span className="text-sm text-green-600 font-normal ml-2">↑ antes</span>
            )}
          </p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500">Primera meta alcanzada</p>
          <p className="text-base font-semibold mt-1 text-gray-900">
            {firstGoal
              ? `${firstGoal.name} en ~${firstGoal.monthsToReach} meses`
              : 'Ajusta los parámetros'}
          </p>
        </Card>
      </div>

      {/* Projection chart */}
      {labels.length > 0 && (
        <Card>
          <h2 className="text-sm font-medium text-gray-700 mb-4">Balance proyectado — 12 meses</h2>
          <LineChart
            labels={labels}
            datasets={[
              { name: 'Escenario actual',    values: baseProjection.map((p) => p.balance), color: '#6b7280', dash: 'dash' },
              { name: 'Escenario simulado',  values: simProjection.map((p) => p.balance),  color: '#2563eb' },
            ]}
            height={300}
          />
        </Card>
      )}
    </div>
  );
}
