export type TransactionCategory =
  | 'alimentación'
  | 'comida fuera'
  | 'transporte'
  | 'arriendo'
  | 'servicios'
  | 'suscripciones'
  | 'salud'
  | 'educación'
  | 'desarrollo personal'
  | 'entretenimiento sano'
  | 'alcohol y cigarros'
  | 'pensiones y gastos hijos'
  | 'mejoras'
  | 'otros';

export type CategoryTier = 'esencial' | 'discrecional';

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: number;
  date: string;
  amount: number;
  category: TransactionCategory;
  description: string;
  type: TransactionType;
  source: string;
  created_at: string;
}

export interface Debt {
  id: number;
  name: string;
  total_amount: number;
  remaining_amount: number;
  interest_rate: number;
  monthly_payment: number;
  due_date: string;
  created_at: string;
}

export interface ClassSession {
  id: number;
  date: string;
  student_name: string;
  duration_hours: number;
  rate_per_hour: number;
  paid: 0 | 1;
  is_uper: 0 | 1;
  notes: string;
  created_at: string;
  transaction_id: number | null;
  uper_modality: string;
  uper_level: string;
  uper_pack: string;
  uper_gross_rate: number;
}

export type IncomeSourceType = 'classes' | 'job' | 'freelance' | 'workshop';

export interface IncomeSource {
  id: number;
  name: string;
  type: IncomeSourceType;
  expected_monthly: number;
  active: 0 | 1;
}

export interface Goal {
  id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string;
  category: string;
  created_at: string;
}

export interface AiUsage {
  id: number;
  timestamp: string;
  tokens_input: number;
  tokens_output: number;
  cost_usd: number;
  analysis_type: string;
  month: string;
  response_text?: string;
}

export interface MonthlyUsageSummary {
  month: string;
  total_tokens_input: number;
  total_tokens_output: number;
  total_cost_usd: number;
}

export type CreateTransactionInput = Omit<Transaction, 'id' | 'created_at'>;
export type CreateDebtInput = Omit<Debt, 'id' | 'created_at'>;
export type CreateClassInput = Omit<ClassSession, 'id' | 'created_at' | 'transaction_id' | 'is_uper'>
  & { is_uper: 0 | 1 };
export type CreateGoalInput = Omit<Goal, 'id' | 'created_at'>;

export interface TransactionFilters {
  month?: string;
  category?: TransactionCategory;
  type?: TransactionType;
  page?: number;
  pageSize?: number;
}

export interface MonthlyMetrics {
  income: number;
  expenses: number;
  balance: number;
  savingsRate: number;
}

export interface ProjectionScenario {
  extraClassesPerWeek: number;
  fixedMonthlySalary: number;
  monthlyFreelance: number;
  extraDebtPayment: number;
}

export interface MonthlyTotals {
  month: string;
  income: number;
  expenses: number;
}

export interface CategoryBreakdown {
  category: string;
  total: number;
}
