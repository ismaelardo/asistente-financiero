/**
 * npm run db:seed   → insert demo data (skips if data exists)
 * npm run db:reset  → clear all tables then insert demo data
 */
import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';
import { initializeSchema } from '../lib/db/schema';

const reset = process.argv.includes('--reset');
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'finance.db'));
db.pragma('journal_mode = WAL');
initializeSchema(db);

if (reset) {
  db.exec(`
    DELETE FROM transactions;
    DELETE FROM debts;
    DELETE FROM classes;
    DELETE FROM income_sources;
    DELETE FROM goals;
    DELETE FROM ai_usage;
  `);
  console.log('Tablas limpiadas.');
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function isoDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().substring(0, 10);
}

// ── Transactions (3 meses) ────────────────────────────────────────────────────

const transactions: {
  date: string;
  amount: number;
  category: string;
  description: string;
  type: string;
  source: string;
}[] = [
  // --- Mes actual ---
  { date: isoDate(2),  amount: 850000, category: 'otros',          type: 'income',  description: 'Sueldo base',           source: 'Trabajo' },
  { date: isoDate(3),  amount: 450000, category: 'arriendo',       type: 'expense', description: 'Arriendo departamento', source: 'Propietario' },
  { date: isoDate(4),  amount: 62000,  category: 'servicios',      type: 'expense', description: 'Internet + básicos',    source: 'VTR / Enel' },
  { date: isoDate(5),  amount: 55000,  category: 'alimentación',   type: 'expense', description: 'Supermercado semanal',  source: 'Jumbo' },
  { date: isoDate(6),  amount: 180000, category: 'otros',          type: 'income',  description: 'Clases de programación', source: 'Alumnos' },
  { date: isoDate(7),  amount: 18500,  category: 'transporte',     type: 'expense', description: 'Tarjeta Bip recarga',   source: 'Metro' },
  { date: isoDate(8),  amount: 42000,  category: 'alimentación',   type: 'expense', description: 'Supermercado semanal',  source: 'Lider' },
  { date: isoDate(9),  amount: 28000,  category: 'entretenimiento',type: 'expense', description: 'Cine + Netflix',        source: 'Varios' },
  { date: isoDate(10), amount: 25000,  category: 'salud',          type: 'expense', description: 'Consulta médico',       source: 'Clínica' },
  { date: isoDate(11), amount: 48000,  category: 'alimentación',   type: 'expense', description: 'Supermercado semanal',  source: 'Jumbo' },
  { date: isoDate(12), amount: 120000, category: 'otros',          type: 'income',  description: 'Freelance diseño web',  source: 'Cliente' },
  { date: isoDate(14), amount: 35000,  category: 'transporte',     type: 'expense', description: 'Uber semana',           source: 'Uber' },
  { date: isoDate(15), amount: 52000,  category: 'alimentación',   type: 'expense', description: 'Supermercado semanal',  source: 'Lider' },
  // --- Mes anterior ---
  { date: isoDate(32), amount: 850000, category: 'otros',          type: 'income',  description: 'Sueldo base',           source: 'Trabajo' },
  { date: isoDate(33), amount: 450000, category: 'arriendo',       type: 'expense', description: 'Arriendo departamento', source: 'Propietario' },
  { date: isoDate(34), amount: 62000,  category: 'servicios',      type: 'expense', description: 'Internet + básicos',    source: 'VTR / Enel' },
  { date: isoDate(35), amount: 55000,  category: 'alimentación',   type: 'expense', description: 'Supermercado semanal',  source: 'Jumbo' },
  { date: isoDate(36), amount: 220000, category: 'otros',          type: 'income',  description: 'Clases de programación', source: 'Alumnos' },
  { date: isoDate(37), amount: 18500,  category: 'transporte',     type: 'expense', description: 'Tarjeta Bip recarga',   source: 'Metro' },
  { date: isoDate(38), amount: 44000,  category: 'alimentación',   type: 'expense', description: 'Supermercado semanal',  source: 'Lider' },
  { date: isoDate(39), amount: 15000,  category: 'entretenimiento',type: 'expense', description: 'Spotify anual prorrateado', source: 'Spotify' },
  { date: isoDate(40), amount: 48000,  category: 'alimentación',   type: 'expense', description: 'Supermercado semanal',  source: 'Jumbo' },
  { date: isoDate(41), amount: 80000,  category: 'otros',          type: 'income',  description: 'Tutoría extra',         source: 'Alumno particular' },
  { date: isoDate(42), amount: 32000,  category: 'transporte',     type: 'expense', description: 'Uber semana',           source: 'Uber' },
  { date: isoDate(43), amount: 51000,  category: 'alimentación',   type: 'expense', description: 'Supermercado semanal',  source: 'Lider' },
  { date: isoDate(44), amount: 18000,  category: 'salud',          type: 'expense', description: 'Medicamentos',          source: 'Farmacia' },
  { date: isoDate(45), amount: 35000,  category: 'entretenimiento',type: 'expense', description: 'Asado + salida',        source: 'Varios' },
  // --- Hace 2 meses ---
  { date: isoDate(62), amount: 850000, category: 'otros',          type: 'income',  description: 'Sueldo base',           source: 'Trabajo' },
  { date: isoDate(63), amount: 450000, category: 'arriendo',       type: 'expense', description: 'Arriendo departamento', source: 'Propietario' },
  { date: isoDate(64), amount: 62000,  category: 'servicios',      type: 'expense', description: 'Internet + básicos',    source: 'VTR / Enel' },
  { date: isoDate(65), amount: 57000,  category: 'alimentación',   type: 'expense', description: 'Supermercado semanal',  source: 'Jumbo' },
  { date: isoDate(66), amount: 280000, category: 'otros',          type: 'income',  description: 'Clases de programación', source: 'Alumnos' },
  { date: isoDate(67), amount: 18500,  category: 'transporte',     type: 'expense', description: 'Tarjeta Bip recarga',   source: 'Metro' },
  { date: isoDate(68), amount: 45000,  category: 'alimentación',   type: 'expense', description: 'Supermercado semanal',  source: 'Lider' },
  { date: isoDate(69), amount: 22000,  category: 'entretenimiento',type: 'expense', description: 'Restaurant',            source: 'Varios' },
  { date: isoDate(70), amount: 46000,  category: 'alimentación',   type: 'expense', description: 'Supermercado semanal',  source: 'Jumbo' },
  { date: isoDate(71), amount: 150000, category: 'otros',          type: 'income',  description: 'Workshop React',        source: 'Organización' },
  { date: isoDate(72), amount: 28000,  category: 'transporte',     type: 'expense', description: 'Uber semana',           source: 'Uber' },
  { date: isoDate(73), amount: 53000,  category: 'alimentación',   type: 'expense', description: 'Supermercado semanal',  source: 'Lider' },
  { date: isoDate(74), amount: 35000,  category: 'salud',          type: 'expense', description: 'Control dental',        source: 'Clínica' },
];

const insertTx = db.prepare(
  `INSERT INTO transactions (date, amount, category, description, type, source) VALUES (?, ?, ?, ?, ?, ?)`
);
for (const t of transactions) {
  insertTx.run(t.date, t.amount, t.category, t.description, t.type, t.source);
}
console.log(`${transactions.length} transacciones insertadas.`);

// ── Debts ────────────────────────────────────────────────────────────────────

const debts = [
  {
    name: 'Crédito de consumo BancoEstado',
    total_amount: 3000000,
    remaining_amount: 2200000,
    interest_rate: 18.0,
    monthly_payment: 120000,
    due_date: '2027-06-01',
  },
  {
    name: 'Tarjeta de crédito VISA',
    total_amount: 800000,
    remaining_amount: 450000,
    interest_rate: 30.0,
    monthly_payment: 80000,
    due_date: '2026-03-01',
  },
];

const insertDebt = db.prepare(
  `INSERT INTO debts (name, total_amount, remaining_amount, interest_rate, monthly_payment, due_date) VALUES (?, ?, ?, ?, ?, ?)`
);
for (const d of debts) {
  insertDebt.run(d.name, d.total_amount, d.remaining_amount, d.interest_rate, d.monthly_payment, d.due_date);
}
console.log(`${debts.length} deudas insertadas.`);

// ── Classes (últimas 4 semanas) ───────────────────────────────────────────────

const classes: { date: string; student_name: string; duration_hours: number; rate_per_hour: number; paid: number; notes: string }[] = [
  { date: isoDate(2),  student_name: 'Catalina M.',  duration_hours: 2, rate_per_hour: 25000, paid: 1, notes: 'JavaScript avanzado' },
  { date: isoDate(3),  student_name: 'Diego R.',     duration_hours: 1.5, rate_per_hour: 22000, paid: 1, notes: 'HTML/CSS básico' },
  { date: isoDate(4),  student_name: 'Valentina P.', duration_hours: 2, rate_per_hour: 25000, paid: 0, notes: 'React hooks' },
  { date: isoDate(7),  student_name: 'Catalina M.',  duration_hours: 2, rate_per_hour: 25000, paid: 1, notes: 'Promesas y async/await' },
  { date: isoDate(9),  student_name: 'Pablo S.',     duration_hours: 1, rate_per_hour: 20000, paid: 0, notes: 'Python introducción' },
  { date: isoDate(10), student_name: 'Diego R.',     duration_hours: 1.5, rate_per_hour: 22000, paid: 1, notes: 'Formularios HTML' },
  { date: isoDate(14), student_name: 'Valentina P.', duration_hours: 2, rate_per_hour: 25000, paid: 1, notes: 'Context API' },
  { date: isoDate(15), student_name: 'Pablo S.',     duration_hours: 1, rate_per_hour: 20000, paid: 1, notes: 'Funciones Python' },
  { date: isoDate(16), student_name: 'Catalina M.',  duration_hours: 2, rate_per_hour: 25000, paid: 0, notes: 'TypeScript básico' },
  { date: isoDate(17), student_name: 'Andrés V.',    duration_hours: 1.5, rate_per_hour: 22000, paid: 1, notes: 'SQL fundamentals' },
  { date: isoDate(21), student_name: 'Diego R.',     duration_hours: 2, rate_per_hour: 22000, paid: 1, notes: 'CSS Flexbox/Grid' },
  { date: isoDate(22), student_name: 'Andrés V.',    duration_hours: 1.5, rate_per_hour: 22000, paid: 0, notes: 'Joins en SQL' },
  { date: isoDate(23), student_name: 'Valentina P.', duration_hours: 2, rate_per_hour: 25000, paid: 1, notes: 'Next.js intro' },
  { date: isoDate(24), student_name: 'Pablo S.',     duration_hours: 1, rate_per_hour: 20000, paid: 1, notes: 'Listas y diccionarios' },
];

const insertClass = db.prepare(
  `INSERT INTO classes (date, student_name, duration_hours, rate_per_hour, paid, notes) VALUES (?, ?, ?, ?, ?, ?)`
);
for (const c of classes) {
  insertClass.run(c.date, c.student_name, c.duration_hours, c.rate_per_hour, c.paid, c.notes);
}
console.log(`${classes.length} clases insertadas.`);

// ── Income sources ────────────────────────────────────────────────────────────

const sources = [
  { name: 'Trabajo dependiente', type: 'job',       expected_monthly: 850000, active: 1 },
  { name: 'Clases particulares', type: 'classes',   expected_monthly: 300000, active: 1 },
  { name: 'Freelance dev',       type: 'freelance', expected_monthly: 150000, active: 1 },
];

const insertSource = db.prepare(
  `INSERT INTO income_sources (name, type, expected_monthly, active) VALUES (?, ?, ?, ?)`
);
for (const s of sources) insertSource.run(s.name, s.type, s.expected_monthly, s.active);
console.log(`${sources.length} fuentes de ingreso insertadas.`);

// ── Goals ─────────────────────────────────────────────────────────────────────

const goals = [
  { name: 'Fondo de emergencia', target_amount: 1500000, current_amount: 400000,  deadline: '2026-12-31', category: 'ahorro' },
  { name: 'Vacaciones Perú',     target_amount: 800000,  current_amount: 150000,  deadline: '2026-07-15', category: 'viaje' },
  { name: 'Computador nuevo',    target_amount: 600000,  current_amount: 50000,   deadline: '2026-09-01', category: 'tecnología' },
];

const insertGoal = db.prepare(
  `INSERT INTO goals (name, target_amount, current_amount, deadline, category) VALUES (?, ?, ?, ?, ?)`
);
for (const g of goals) insertGoal.run(g.name, g.target_amount, g.current_amount, g.deadline, g.category);
console.log(`${goals.length} metas insertadas.`);

console.log('\nSeed completado exitosamente.');
db.close();
