export type UperModality = 'online' | 'presencial';
export type UperLevel = 'escolar' | 'universitario';
export type UperPack = 'suelta' | 'pack4' | 'pack8';

const PRICE_TABLE: Record<UperModality, Record<UperLevel, Record<UperPack, number>>> = {
  online: {
    escolar:       { suelta: 16000, pack4: 14000, pack8: 13000 },
    universitario: { suelta: 18000, pack4: 16000, pack8: 15000 },
  },
  presencial: {
    escolar:       { suelta: 20000, pack4: 18000, pack8: 17000 },
    universitario: { suelta: 22000, pack4: 20000, pack8: 19000 },
  },
};

export function getUperGrossPrice(modality: UperModality, level: UperLevel, pack: UperPack): number {
  return PRICE_TABLE[modality][level][pack];
}

export function getUperDiscount(classNumber: number): number {
  if (classNumber <= 2) return 5000;
  if (classNumber === 3) return 4000;
  if (classNumber === 4) return 3000;
  if (classNumber === 5) return 2000;
  return 1000;
}

export function getUperNetPrice(
  modality: UperModality,
  level: UperLevel,
  pack: UperPack,
  classNumber: number,
): number {
  return getUperGrossPrice(modality, level, pack) - getUperDiscount(classNumber);
}
