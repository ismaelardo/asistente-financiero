import type Database from 'better-sqlite3';

export function initializeSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      date        TEXT    NOT NULL,
      amount      INTEGER NOT NULL,
      category    TEXT    NOT NULL,
      description TEXT    NOT NULL,
      type        TEXT    NOT NULL CHECK(type IN ('income', 'expense')),
      source      TEXT    NOT NULL,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS debts (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      name             TEXT    NOT NULL,
      total_amount     INTEGER NOT NULL,
      remaining_amount INTEGER NOT NULL,
      interest_rate    REAL    NOT NULL DEFAULT 0,
      monthly_payment  INTEGER NOT NULL,
      due_date         TEXT    NOT NULL,
      created_at       TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS classes (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      date           TEXT    NOT NULL,
      student_name   TEXT    NOT NULL,
      duration_hours REAL    NOT NULL,
      rate_per_hour  INTEGER NOT NULL,
      paid           INTEGER NOT NULL DEFAULT 0 CHECK(paid IN (0, 1)),
      notes          TEXT    NOT NULL DEFAULT '',
      created_at     TEXT    NOT NULL DEFAULT (datetime('now')),
      transaction_id INTEGER            -- FK to transactions; set when paid=1
    );

    CREATE TABLE IF NOT EXISTS income_sources (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      name             TEXT    NOT NULL,
      type             TEXT    NOT NULL CHECK(type IN ('classes', 'job', 'freelance', 'workshop')),
      expected_monthly INTEGER NOT NULL DEFAULT 0,
      active           INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0, 1))
    );

    CREATE TABLE IF NOT EXISTS goals (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      name           TEXT    NOT NULL,
      target_amount  INTEGER NOT NULL,
      current_amount INTEGER NOT NULL DEFAULT 0,
      deadline       TEXT    NOT NULL,
      category       TEXT    NOT NULL DEFAULT '',
      created_at     TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ai_usage (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp     TEXT    NOT NULL,
      tokens_input  INTEGER NOT NULL DEFAULT 0,
      tokens_output INTEGER NOT NULL DEFAULT 0,
      cost_usd      REAL    NOT NULL DEFAULT 0,
      analysis_type TEXT    NOT NULL DEFAULT 'financial_analysis',
      month         TEXT    NOT NULL,
      response_text TEXT
    );
  `);

  // Migrations: add columns that didn't exist in the original schema
  const migrations = [
    'ALTER TABLE classes ADD COLUMN transaction_id INTEGER',
    'ALTER TABLE classes ADD COLUMN is_uper INTEGER DEFAULT 0',
    "ALTER TABLE classes ADD COLUMN uper_modality TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE classes ADD COLUMN uper_level TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE classes ADD COLUMN uper_pack TEXT NOT NULL DEFAULT ''",
    'ALTER TABLE classes ADD COLUMN uper_gross_rate INTEGER NOT NULL DEFAULT 0',
  ];
  for (const sql of migrations) {
    try { db.exec(sql); } catch { /* column already exists */ }
  }
}
