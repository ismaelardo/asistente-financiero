'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import Card from '@/components/ui/Card';
import DataTable, { type Column } from '@/components/ui/DataTable';
import BarChart from '@/components/charts/BarChart';
import { FormField, Input, Select } from '@/components/ui/FormField';
import { formatCLP } from '@/lib/utils/formatCLP';
import { Plus, X, Check, CheckCircle2, Clock, Pencil, Trash2 } from 'lucide-react';
import type { ClassSession, CreateClassInput } from '@/types';

interface StudentDefaults {
  student_name: string;
  rate_per_hour: number;
  duration_hours: number;
}

interface ClassSummary {
  total_classes: number;
  total_hours: number;
  income_paid: number;
  income_pending: number;
}

interface WeeklyIncome { week: string; income: number }

const EMPTY: CreateClassInput = {
  date: new Date().toISOString().substring(0, 10),
  student_name: '',
  duration_hours: 1,
  rate_per_hour: 25000,
  paid: 0,
  is_uper: 0,
  notes: '',
};

// ── Student autocomplete ───────────────────────────────────────────────────────

interface StudentAutocompleteProps {
  value: string;
  students: StudentDefaults[];
  onChange: (name: string) => void;
  onSelect: (student: StudentDefaults) => void;
}

function StudentAutocomplete({ value, students, onChange, onSelect }: StudentAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const matches = value.trim().length === 0
    ? students                                                     // empty → show all past students
    : students.filter((s) =>
        s.student_name.toLowerCase().includes(value.toLowerCase())
      );

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={value}
        required
        placeholder="Nombre o alias del alumno"
        autoComplete="off"
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false);
        }}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
      />

      {open && matches.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-md max-h-52 overflow-y-auto">
          {matches.map((s) => (
            <li key={s.student_name}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault(); // prevent input blur before click registers
                  onSelect(s);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2.5 hover:bg-blue-50 transition-colors flex justify-between items-center"
              >
                <span className="text-sm font-medium text-gray-900">{s.student_name}</span>
                <span className="text-xs text-gray-400">
                  {formatCLP(s.rate_per_hour)}/h · {s.duration_hours}h
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ClassesPage() {
  const currentMonth = new Date().toISOString().substring(0, 7);

  const [classes,    setClasses]    = useState<ClassSession[]>([]);
  const [summary,    setSummary]    = useState<ClassSummary | null>(null);
  const [weeklyData, setWeeklyData] = useState<WeeklyIncome[]>([]);
  const [students,   setStudents]   = useState<StudentDefaults[]>([]);
  const [showForm,   setShowForm]   = useState(false);
  const [editId,     setEditId]     = useState<number | null>(null);
  const [form,       setForm]       = useState<CreateClassInput>(EMPTY);
  const [uperOnly,   setUperOnly]   = useState(false);

  const load = useCallback(async () => {
    const uper = uperOnly ? '&uper=1' : '';
    const [cls, sum, weekly, studs] = await Promise.all([
      fetch(`/api/classes?${uper}`).then((r) => r.json()),
      fetch(`/api/classes?summary=monthly&month=${currentMonth}${uper}`).then((r) => r.json()),
      fetch('/api/classes?summary=weekly-income&weeks=4').then((r) => r.json()),
      fetch('/api/classes?summary=students').then((r) => r.json()),
    ]);
    setClasses(cls);
    setSummary(sum);
    setWeeklyData(weekly);
    setStudents(studs);
  }, [currentMonth, uperOnly]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = {
      ...form,
      duration_hours: Number(form.duration_hours),
      rate_per_hour:  Number(form.rate_per_hour),
    };
    if (editId !== null) {
      await fetch(`/api/classes/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      setEditId(null);
      setForm(EMPTY);
    } else {
      await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      setForm({ ...EMPTY, date: form.date }); // keep date for back-to-back entries
    }
    setShowForm(false);
    load();
  };

  const handleEdit = (s: ClassSession) => {
    setForm({
      date:           s.date,
      student_name:   s.student_name,
      duration_hours: s.duration_hours,
      rate_per_hour:  s.rate_per_hour,
      paid:           s.paid,
      is_uper:        s.is_uper,
      notes:          s.notes,
    });
    setEditId(s.id);
    setShowForm(true);
  };

  const togglePaid = async (session: ClassSession) => {
    await fetch(`/api/classes/${session.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paid: session.paid === 1 ? 0 : 1 }),
    });
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar esta clase?')) return;
    await fetch(`/api/classes/${id}`, { method: 'DELETE' });
    load();
  };

  const columns: Column<ClassSession>[] = [
    { header: 'Fecha',  accessor: 'date' },
    { header: 'Alumno', accessor: 'student_name' },
    { header: 'Horas',  accessor: (s) => `${s.duration_hours}h` },
    { header: 'Tarifa', accessor: (s) => `${formatCLP(s.rate_per_hour)}/h` },
    { header: 'Total',  accessor: (s) => formatCLP(s.duration_hours * s.rate_per_hour) },
    {
      header: 'Estado',
      accessor: (s) => (
        <button
          onClick={() => togglePaid(s)}
          className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full transition-colors ${
            s.paid === 1
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
          }`}
        >
          {s.paid === 1 ? <CheckCircle2 size={12} /> : <Clock size={12} />}
          {s.paid === 1 ? 'Pagado' : 'Pendiente'}
        </button>
      ),
    },
    {
      header: 'Uper',
      accessor: (s) => s.is_uper === 1
        ? <span className="text-xs font-medium text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">Uper</span>
        : null,
    },
    { header: 'Notas', accessor: 'notes' },
    {
      header: '',
      accessor: (s) => (
        <div className="flex gap-2">
          <button onClick={() => handleEdit(s)} className="text-gray-400 hover:text-blue-600 transition-colors">
            <Pencil size={14} />
          </button>
          <button onClick={() => handleDelete(s.id)} className="text-gray-400 hover:text-red-500 transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-gray-900">Clases</h1>
          <button
            onClick={() => setUperOnly(!uperOnly)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
              uperOnly
                ? 'bg-violet-600 text-white border-violet-600'
                : 'text-violet-600 border-violet-300 hover:bg-violet-50'
            }`}
          >
            Uper
          </button>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditId(null); setForm(EMPTY); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showForm ? <X size={15} /> : <Plus size={15} />}
          {showForm ? 'Cancelar' : 'Registrar clase'}
        </button>
      </div>

      {/* Monthly summary */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Clases',      value: String(summary.total_classes) },
            { label: 'Horas',       value: `${summary.total_hours}h` },
            { label: 'Cobrado',     value: formatCLP(summary.income_paid) },
            { label: 'Por cobrar',  value: formatCLP(summary.income_pending) },
          ].map(({ label, value }) => (
            <Card key={label} className={uperOnly ? 'border-violet-200 bg-violet-50/40' : ''}>
              <p className="text-xs text-gray-500">
                {uperOnly && <span className="text-violet-500 font-medium">Uper · </span>}
                {label}
              </p>
              <p className="text-lg font-semibold text-gray-900 mt-1">{value}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Inline form */}
      {showForm && (
        <Card>
          <h2 className="text-sm font-medium text-gray-700 mb-4">
            {editId ? 'Editar clase' : 'Registrar clase'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-3 gap-4">

            <FormField label="Alumno">
              <StudentAutocomplete
                value={form.student_name}
                students={students}
                onChange={(name) => setForm({ ...form, student_name: name })}
                onSelect={(s) =>
                  setForm({
                    ...form,
                    student_name:  s.student_name,
                    rate_per_hour: s.rate_per_hour,
                    duration_hours: s.duration_hours,
                  })
                }
              />
            </FormField>

            <FormField label="Fecha">
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </FormField>

            <FormField label="Duración (horas)">
              <Input
                type="number"
                min="0.5"
                step="0.5"
                value={form.duration_hours}
                onChange={(e) => setForm({ ...form, duration_hours: Number(e.target.value) })}
                required
              />
            </FormField>

            <FormField label="Tarifa por hora (CLP)">
              <Input
                type="number"
                min="1000"
                value={form.rate_per_hour}
                onChange={(e) => setForm({ ...form, rate_per_hour: Number(e.target.value) })}
                required
              />
            </FormField>

            <FormField label="¿Pagado?">
              <Select
                value={String(form.paid)}
                onChange={(e) => setForm({ ...form, paid: Number(e.target.value) as 0 | 1 })}
              >
                <option value="0">Pendiente</option>
                <option value="1">Pagado</option>
              </Select>
            </FormField>

            <FormField label="Notas">
              <Input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Tema de la clase"
              />
            </FormField>

            <div className="flex items-center gap-2 self-end pb-2">
              <input
                id="is_uper"
                type="checkbox"
                checked={form.is_uper === 1}
                onChange={(e) => setForm({ ...form, is_uper: e.target.checked ? 1 : 0 })}
                className="w-4 h-4 accent-violet-600 cursor-pointer"
              />
              <label htmlFor="is_uper" className="text-sm text-gray-700 cursor-pointer select-none">
                Clase de <span className="font-medium text-violet-600">Uper</span>
              </label>
            </div>

            <div className="col-span-full flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Check size={15} />
                {editId ? 'Guardar cambios' : 'Registrar'}
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Classes table */}
      <Card>
        <h2 className="text-sm font-medium text-gray-700 mb-4">Historial de clases</h2>
        <DataTable
          columns={columns}
          data={classes}
          keyField="id"
          emptyMessage="Sin clases registradas"
        />
      </Card>

      {/* Weekly income chart */}
      {weeklyData.length > 0 && (
        <Card>
          <h2 className="text-sm font-medium text-gray-700 mb-4">
            Ingresos por clases — últimas 4 semanas
          </h2>
          <BarChart
            labels={weeklyData.map((w) => w.week)}
            datasets={[{ name: 'Ingresos', values: weeklyData.map((w) => w.income), color: '#2563eb' }]}
            height={260}
          />
        </Card>
      )}
    </div>
  );
}
