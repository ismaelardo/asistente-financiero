import { getDb } from '../index';
import type { Debt, CreateDebtInput } from '@/types';

export function getDebts(): Debt[] {
  return getDb().prepare('SELECT * FROM debts ORDER BY created_at DESC').all() as Debt[];
}

export function getDebtById(id: number): Debt | undefined {
  return getDb().prepare('SELECT * FROM debts WHERE id = ?').get(id) as Debt | undefined;
}

export function createDebt(input: CreateDebtInput): Debt {
  const { lastInsertRowid } = getDb()
    .prepare(
      `INSERT INTO debts (name, total_amount, remaining_amount, interest_rate, monthly_payment, due_date)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      input.name,
      input.total_amount,
      input.remaining_amount,
      input.interest_rate,
      input.monthly_payment,
      input.due_date
    );
  return getDebtById(lastInsertRowid as number)!;
}

export function updateDebt(id: number, input: Partial<CreateDebtInput>): Debt | undefined {
  const db = getDb();
  const fields = Object.keys(input)
    .map((k) => `${k} = ?`)
    .join(', ');
  db.prepare(`UPDATE debts SET ${fields} WHERE id = ?`).run(...Object.values(input), id);
  return getDebtById(id);
}

export function deleteDebt(id: number): void {
  getDb().prepare('DELETE FROM debts WHERE id = ?').run(id);
}

export function getTotalDebt(): number {
  const result = getDb()
    .prepare('SELECT COALESCE(SUM(remaining_amount), 0) as total FROM debts')
    .get() as { total: number };
  return result.total;
}
