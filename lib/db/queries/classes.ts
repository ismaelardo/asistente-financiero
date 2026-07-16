import { getDb } from '../index';
import type { ClassSession, CreateClassInput } from '@/types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function classAmount(session: Pick<ClassSession, 'duration_hours' | 'rate_per_hour'>): number {
  return Math.round(session.duration_hours * session.rate_per_hour);
}

function classDescription(session: Pick<ClassSession, 'student_name' | 'duration_hours'>): string {
  return `Clase: ${session.student_name} (${session.duration_hours}h)`;
}

// Creates a transaction row and returns its id
function insertLinkedTransaction(
  session: Pick<ClassSession, 'date' | 'student_name' | 'duration_hours' | 'rate_per_hour'>
): number {
  const db = getDb();
  const { lastInsertRowid } = db
    .prepare(
      `INSERT INTO transactions (date, amount, category, description, type, source)
       VALUES (?, ?, 'educación', ?, 'income', 'Clases')`
    )
    .run(session.date, classAmount(session), classDescription(session));
  return lastInsertRowid as number;
}

function deleteLinkedTransaction(transactionId: number): void {
  getDb().prepare('DELETE FROM transactions WHERE id = ?').run(transactionId);
}

// ── Public API ────────────────────────────────────────────────────────────────

export function getClasses(uperOnly = false): ClassSession[] {
  const where = uperOnly ? 'WHERE is_uper = 1' : '';
  return getDb()
    .prepare(`SELECT * FROM classes ${where} ORDER BY date DESC`)
    .all() as ClassSession[];
}

export function getClassesByDateRange(start: string, end: string): ClassSession[] {
  return getDb()
    .prepare('SELECT * FROM classes WHERE date >= ? AND date <= ? ORDER BY date DESC')
    .all(start, end) as ClassSession[];
}

export function getClassById(id: number): ClassSession | undefined {
  return getDb().prepare('SELECT * FROM classes WHERE id = ?').get(id) as ClassSession | undefined;
}

export function getStudentUperClassCount(studentName: string, excludeId?: number): number {
  const db = getDb();
  if (excludeId !== undefined) {
    return (db.prepare(
      'SELECT COUNT(*) as cnt FROM classes WHERE student_name = ? AND is_uper = 1 AND id != ?'
    ).get(studentName, excludeId) as { cnt: number }).cnt;
  }
  return (db.prepare(
    'SELECT COUNT(*) as cnt FROM classes WHERE student_name = ? AND is_uper = 1'
  ).get(studentName) as { cnt: number }).cnt;
}

export function createClass(input: CreateClassInput): ClassSession {
  const db = getDb();

  // If paid at creation time, generate the linked transaction immediately
  let transactionId: number | null = null;
  if (input.paid === 1) {
    transactionId = insertLinkedTransaction(input);
  }

  const { lastInsertRowid } = db
    .prepare(
      `INSERT INTO classes
         (date, student_name, duration_hours, rate_per_hour, paid, is_uper, notes, transaction_id,
          uper_modality, uper_level, uper_pack, uper_gross_rate)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      input.date,
      input.student_name,
      input.duration_hours,
      input.rate_per_hour,
      input.paid,
      input.is_uper,
      input.notes,
      transactionId,
      input.uper_modality ?? '',
      input.uper_level ?? '',
      input.uper_pack ?? '',
      input.uper_gross_rate ?? 0,
    );
  return getClassById(lastInsertRowid as number)!;
}

// Specific function for toggling the paid status — handles transaction sync
export function toggleClassPaid(id: number): ClassSession | undefined {
  const db = getDb();
  const session = getClassById(id);
  if (!session) return undefined;

  if (session.paid === 0) {
    // Marking as paid → create linked transaction
    const transactionId = insertLinkedTransaction(session);
    db.prepare('UPDATE classes SET paid = 1, transaction_id = ? WHERE id = ?').run(transactionId, id);
  } else {
    // Marking as unpaid → remove linked transaction
    if (session.transaction_id) {
      deleteLinkedTransaction(session.transaction_id);
    }
    db.prepare('UPDATE classes SET paid = 0, transaction_id = NULL WHERE id = ?').run(id);
  }

  return getClassById(id);
}

export function updateClass(
  id: number,
  input: Partial<Omit<CreateClassInput, 'paid'>>
): ClassSession | undefined {
  const db = getDb();
  const session = getClassById(id);
  if (!session) return undefined;

  const fields = Object.keys(input)
    .map((k) => `${k} = ?`)
    .join(', ');
  db.prepare(`UPDATE classes SET ${fields} WHERE id = ?`).run(...Object.values(input), id);

  // If the class was paid and any value affecting the amount changed, update the linked transaction
  const amountFields = new Set(['duration_hours', 'rate_per_hour', 'date', 'student_name']);
  const touchesAmount = Object.keys(input).some((k) => amountFields.has(k));

  if (session.paid === 1 && session.transaction_id && touchesAmount) {
    const updated = getClassById(id)!;
    db.prepare(
      `UPDATE transactions SET date = ?, amount = ?, description = ? WHERE id = ?`
    ).run(updated.date, classAmount(updated), classDescription(updated), session.transaction_id);
  }

  return getClassById(id);
}

export function deleteClass(id: number): void {
  const db = getDb();
  const session = getClassById(id);
  if (session?.transaction_id) {
    deleteLinkedTransaction(session.transaction_id);
  }
  db.prepare('DELETE FROM classes WHERE id = ?').run(id);
}

export interface ClassSummary {
  total_classes: number;
  total_hours: number;
  income_paid: number;
  income_pending: number;
}

export function getMonthlyClassSummary(month: string, uperOnly = false): ClassSummary {
  const uperFilter = uperOnly ? 'AND is_uper = 1' : '';
  return getDb()
    .prepare(
      `SELECT
         COUNT(*) as total_classes,
         COALESCE(SUM(duration_hours), 0) as total_hours,
         COALESCE(SUM(CASE WHEN paid = 1 THEN duration_hours * rate_per_hour ELSE 0 END), 0) as income_paid,
         COALESCE(SUM(CASE WHEN paid = 0 THEN duration_hours * rate_per_hour ELSE 0 END), 0) as income_pending
       FROM classes
       WHERE strftime('%Y-%m', date) = ? ${uperFilter}`
    )
    .get(month) as ClassSummary;
}

export function getWeeklyClassIncome(weeks = 4): { week: string; income: number }[] {
  return getDb()
    .prepare(
      `SELECT
         strftime('%Y-W%W', date) as week,
         COALESCE(SUM(duration_hours * rate_per_hour), 0) as income
       FROM classes
       WHERE date >= date('now', '-' || ? || ' days')
       GROUP BY week
       ORDER BY week ASC`
    )
    .all(weeks * 7) as { week: string; income: number }[];
}

export interface StudentDefaults {
  student_name: string;
  rate_per_hour: number;
  duration_hours: number;
}

export function getUniqueStudents(): StudentDefaults[] {
  return getDb()
    .prepare(
      `SELECT student_name, rate_per_hour, duration_hours
       FROM classes c1
       WHERE date = (
         SELECT MAX(date) FROM classes c2 WHERE c2.student_name = c1.student_name
       )
       GROUP BY student_name
       ORDER BY MAX(date) DESC`
    )
    .all() as StudentDefaults[];
}
