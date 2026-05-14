import { getDb } from '../index';
import type {
  Transaction,
  CreateTransactionInput,
  TransactionFilters,
  MonthlyTotals,
  CategoryBreakdown,
} from '@/types';

export function getTransactions(filters: TransactionFilters = {}): {
  data: Transaction[];
  total: number;
} {
  const db = getDb();
  const { month, category, type, page = 1, pageSize = 20 } = filters;

  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (month) {
    conditions.push("strftime('%Y-%m', date) = ?");
    params.push(month);
  }
  if (category) {
    conditions.push('category = ?');
    params.push(category);
  }
  if (type) {
    conditions.push('type = ?');
    params.push(type);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * pageSize;

  const { count } = db
    .prepare(`SELECT COUNT(*) as count FROM transactions ${where}`)
    .get(...params) as { count: number };

  const data = db
    .prepare(`SELECT * FROM transactions ${where} ORDER BY date DESC LIMIT ? OFFSET ?`)
    .all(...params, pageSize, offset) as Transaction[];

  return { data, total: count };
}

export function getTransactionById(id: number): Transaction | undefined {
  return getDb()
    .prepare('SELECT * FROM transactions WHERE id = ?')
    .get(id) as Transaction | undefined;
}

export function createTransaction(input: CreateTransactionInput): Transaction {
  const db = getDb();
  const { lastInsertRowid } = db
    .prepare(
      `INSERT INTO transactions (date, amount, category, description, type, source)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(input.date, input.amount, input.category, input.description, input.type, input.source);
  return getTransactionById(lastInsertRowid as number)!;
}

export function updateTransaction(
  id: number,
  input: Partial<CreateTransactionInput>
): Transaction | undefined {
  const db = getDb();
  const fields = Object.keys(input)
    .map((k) => `${k} = ?`)
    .join(', ');
  db.prepare(`UPDATE transactions SET ${fields} WHERE id = ?`).run(...Object.values(input), id);
  return getTransactionById(id);
}

export function deleteTransaction(id: number): void {
  getDb().prepare('DELETE FROM transactions WHERE id = ?').run(id);
}

export function getMonthlyTotals(months = 6): MonthlyTotals[] {
  return getDb()
    .prepare(
      `SELECT
         strftime('%Y-%m', date) as month,
         SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END) as income,
         SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses
       FROM transactions
       WHERE date >= date('now', '-' || ? || ' months')
       GROUP BY month
       ORDER BY month ASC`
    )
    .all(months) as MonthlyTotals[];
}

export function getCategoryBreakdown(month: string): CategoryBreakdown[] {
  return getDb()
    .prepare(
      `SELECT category, SUM(amount) as total
       FROM transactions
       WHERE type = 'expense' AND strftime('%Y-%m', date) = ?
       GROUP BY category
       ORDER BY total DESC`
    )
    .all(month) as CategoryBreakdown[];
}

export function getLastNMonthsMetrics(months = 3): {
  month: string;
  income: number;
  expenses: number;
  balance: number;
}[] {
  return getDb()
    .prepare(
      `SELECT
         strftime('%Y-%m', date) as month,
         SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END) as income,
         SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses,
         SUM(CASE WHEN type = 'income'  THEN amount ELSE -amount END) as balance
       FROM transactions
       WHERE date >= date('now', '-' || ? || ' months')
       GROUP BY month
       ORDER BY month DESC`
    )
    .all(months) as { month: string; income: number; expenses: number; balance: number }[];
}

export function getCurrentMonthTotals(month: string): { income: number; expenses: number } {
  const db = getDb();
  const income = (
    db
      .prepare(
        `SELECT COALESCE(SUM(amount), 0) as total FROM transactions
         WHERE type = 'income' AND strftime('%Y-%m', date) = ?`
      )
      .get(month) as { total: number }
  ).total;

  const expenses = (
    db
      .prepare(
        `SELECT COALESCE(SUM(amount), 0) as total FROM transactions
         WHERE type = 'expense' AND strftime('%Y-%m', date) = ?`
      )
      .get(month) as { total: number }
  ).total;

  return { income, expenses };
}
