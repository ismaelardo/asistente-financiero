import { getDb } from '../index';
import type { Goal, CreateGoalInput } from '@/types';

export function getGoals(): Goal[] {
  return getDb().prepare('SELECT * FROM goals ORDER BY created_at DESC').all() as Goal[];
}

export function getGoalById(id: number): Goal | undefined {
  return getDb().prepare('SELECT * FROM goals WHERE id = ?').get(id) as Goal | undefined;
}

export function createGoal(input: CreateGoalInput): Goal {
  const { lastInsertRowid } = getDb()
    .prepare(
      `INSERT INTO goals (name, target_amount, current_amount, deadline, category)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(
      input.name,
      input.target_amount,
      input.current_amount,
      input.deadline,
      input.category
    );
  return getGoalById(lastInsertRowid as number)!;
}

export function updateGoal(id: number, input: Partial<CreateGoalInput>): Goal | undefined {
  const db = getDb();
  const fields = Object.keys(input)
    .map((k) => `${k} = ?`)
    .join(', ');
  db.prepare(`UPDATE goals SET ${fields} WHERE id = ?`).run(...Object.values(input), id);
  return getGoalById(id);
}

export function deleteGoal(id: number): void {
  getDb().prepare('DELETE FROM goals WHERE id = ?').run(id);
}
