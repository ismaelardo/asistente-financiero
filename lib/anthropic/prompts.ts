import type { Debt, Goal } from '@/types';
import { formatCLP } from '@/lib/utils/formatCLP';

interface FinancialContext {
  monthlyMetrics: { month: string; income: number; expenses: number; balance: number }[];
  debts: Debt[];
  goals: Goal[];
}

export function buildFinancialAnalysisPrompt(ctx: FinancialContext): string {
  const metricsText = ctx.monthlyMetrics
    .map(
      (m) =>
        `- ${m.month}: Ingresos ${formatCLP(m.income)}, Gastos ${formatCLP(m.expenses)}, Balance ${formatCLP(m.balance)}`
    )
    .join('\n');

  const debtsText =
    ctx.debts.length > 0
      ? ctx.debts
          .map(
            (d) =>
              `- ${d.name}: Saldo ${formatCLP(d.remaining_amount)}, Cuota ${formatCLP(d.monthly_payment)}/mes, Tasa ${d.interest_rate}% anual`
          )
          .join('\n')
      : 'Sin deudas registradas';

  const goalsText =
    ctx.goals.length > 0
      ? ctx.goals
          .map((g) => {
            const pct = g.target_amount > 0
              ? Math.round((g.current_amount / g.target_amount) * 100)
              : 0;
            return `- ${g.name}: objetivo ${formatCLP(g.target_amount)}, acumulado ${formatCLP(g.current_amount)} (${pct}%), plazo ${g.deadline}`;
          })
          .join('\n')
      : 'Sin metas registradas';

  return `Eres un asesor financiero personal para un usuario chileno. Analiza la siguiente información y entrega un análisis estructurado en español.

## Datos financieros — últimos 3 meses

### Resumen mensual:
${metricsText}

### Deudas actuales:
${debtsText}

### Metas de ahorro:
${goalsText}

## Responde con exactamente estas 4 secciones, usando los títulos en negrita tal como aparecen:

**1. Diagnóstico de la situación actual**
[2–3 oraciones sobre el estado financiero general]

**2. Las 3 prioridades concretas para este mes**
[Lista numerada con 3 acciones específicas y realizables]

**3. Tips de ahorro personalizados**
[2 tips concretos basados en los patrones de gasto reales del usuario]

**4. Fuente de ingreso a priorizar**
[Recomendación específica sobre en qué fuente de ingreso enfocar energía y por qué]

Sé directo y usa cifras en pesos chilenos cuando refuerces un punto.`;
}
