import type { Debt } from '@/types';

export function calcSavingsRate(income: number, expenses: number): number {
  if (income <= 0) return 0;
  return Math.round(((income - expenses) / income) * 100);
}

export type HealthStatus = 'green' | 'yellow' | 'red';

export function calcFinancialHealth(savingsRate: number): HealthStatus {
  if (savingsRate >= 20) return 'green';
  if (savingsRate >= 10) return 'yellow';
  return 'red';
}

// Simulate month-by-month debt payoff applying interest + fixed payments
export function calcDebtFreeDate(debts: Debt[]): Date | null {
  if (debts.length === 0) return null;

  let remaining = debts.map((d) => ({
    balance: d.remaining_amount,
    monthlyRate: d.interest_rate / 100 / 12,
    payment: d.monthly_payment,
  }));

  let months = 0;
  const CAP = 600;

  while (remaining.some((d) => d.balance > 0) && months < CAP) {
    remaining = remaining.map((d) => {
      if (d.balance <= 0) return d;
      return { ...d, balance: Math.max(0, d.balance * (1 + d.monthlyRate) - d.payment) };
    });
    months++;
  }

  if (months >= CAP) return null;
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return date;
}

export function projectBalance(
  currentBalance: number,
  monthlyIncome: number,
  monthlyExpenses: number,
  months: number
): { month: string; balance: number }[] {
  const result: { month: string; balance: number }[] = [];
  let balance = currentBalance;
  const now = new Date();

  for (let i = 1; i <= months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    balance += monthlyIncome - monthlyExpenses;
    result.push({ month: d.toISOString().substring(0, 7), balance });
  }
  return result;
}

export function calcOptimalGoalLevels(
  avgMonthlyIncome: number,
  avgMonthlyExpenses: number
): { emergencyFund: number; optimalMonthlySavings: number; maxHealthyDebt: number } {
  return {
    emergencyFund: avgMonthlyExpenses * 3,
    optimalMonthlySavings: Math.round(avgMonthlyIncome * 0.2),
    maxHealthyDebt: Math.round(avgMonthlyIncome * 0.3),
  };
}
