// frontend/src/lib/service-categories.ts
export type ServiceCategory =
  | 'CLEANING'
  | 'MAINTENANCE'
  | 'ASSEMBLY'
  | 'TUTORING'
  | 'PET'
  | 'BEAUTY'
  | 'TECH'
  | 'FITNESS'
  | 'OTHER';

export const SERVICE_CATEGORY_LABELS: Record<ServiceCategory, string> = {
  CLEANING: 'Limpeza',
  MAINTENANCE: 'Manutenção',
  ASSEMBLY: 'Montagem & Instalação',
  TUTORING: 'Aulas',
  PET: 'Pet',
  BEAUTY: 'Beleza',
  TECH: 'Tecnologia',
  FITNESS: 'Fitness',
  OTHER: 'Outros',
};

export const SERVICE_CATEGORY_ORDER: ServiceCategory[] = [
  'CLEANING',
  'MAINTENANCE',
  'ASSEMBLY',
  'TUTORING',
  'PET',
  'BEAUTY',
  'TECH',
  'FITNESS',
  'OTHER',
];

export type PricingType = 'FIXED' | 'PER_HOUR' | 'NEGOTIABLE';

export const PRICING_TYPE_LABELS: Record<PricingType, string> = {
  FIXED: 'Preço fixo',
  PER_HOUR: 'Por hora',
  NEGOTIABLE: 'A combinar',
};
