import type { TransactionCategory, CategoryTier } from '@/types';

export interface CategoryGroupDef {
  group: string;
  categories: TransactionCategory[];
}

// Agrupación por área de vida — orden en que aparecen en selects y gráficos
export const CATEGORY_GROUPS: CategoryGroupDef[] = [
  { group: 'Vivienda y hogar',    categories: ['arriendo', 'servicios', 'mejoras'] },
  { group: 'Alimentación',        categories: ['alimentación', 'comida fuera'] },
  { group: 'Movilidad',           categories: ['transporte'] },
  { group: 'Salud',               categories: ['salud'] },
  { group: 'Desarrollo personal', categories: ['desarrollo personal'] },
  { group: 'Ocio',                categories: ['entretenimiento sano', 'alcohol y cigarros'] },
  { group: 'Suscripciones',       categories: ['suscripciones'] },
  { group: 'Familia',             categories: ['pensiones y gastos hijos'] },
  { group: 'Educación',           categories: ['educación'] },
  { group: 'Otros',               categories: ['otros'] },
];

export const CATEGORY_TO_GROUP: Record<TransactionCategory, string> = CATEGORY_GROUPS.reduce(
  (acc, { group, categories }) => {
    for (const c of categories) acc[c] = group;
    return acc;
  },
  {} as Record<TransactionCategory, string>
);

// Eje de necesidad: qué tan esencial es el gasto, independiente del área de vida
export const CATEGORY_TIER: Record<TransactionCategory, CategoryTier> = {
  'arriendo': 'esencial',
  'servicios': 'esencial',
  'alimentación': 'esencial',
  'transporte': 'esencial',
  'salud': 'esencial',
  'pensiones y gastos hijos': 'esencial',
  'comida fuera': 'discrecional',
  'entretenimiento sano': 'discrecional',
  'alcohol y cigarros': 'discrecional',
  'suscripciones': 'discrecional',
  'desarrollo personal': 'discrecional',
  'mejoras': 'discrecional',
  'educación': 'discrecional',
  'otros': 'discrecional',
};

export const TIER_LABELS: Record<CategoryTier, string> = {
  esencial: 'Esencial',
  discrecional: 'Discrecional',
};
