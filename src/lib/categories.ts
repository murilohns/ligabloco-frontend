export type Category =
  | 'COMIDA_BEBIDA_CASEIRA'
  | 'ELETRONICOS'
  | 'MOVEIS_DECORACAO'
  | 'ROUPAS_ACESSORIOS'
  | 'INFANTIL_BRINQUEDOS'
  | 'LIVROS_HOBBIES'
  | 'ESPORTES_LAZER'
  | 'VEICULOS'
  | 'BELEZA_CUIDADOS'
  | 'OUTROS';

export const CATEGORY_LABELS: Record<Category, string> = {
  COMIDA_BEBIDA_CASEIRA: 'Comida & Bebida caseira',
  ELETRONICOS: 'Eletrônicos',
  MOVEIS_DECORACAO: 'Móveis & Decoração',
  ROUPAS_ACESSORIOS: 'Roupas & Acessórios',
  INFANTIL_BRINQUEDOS: 'Infantil & Brinquedos',
  LIVROS_HOBBIES: 'Livros & Hobbies',
  ESPORTES_LAZER: 'Esportes & Lazer',
  VEICULOS: 'Veículos',
  BELEZA_CUIDADOS: 'Beleza & Cuidados',
  OUTROS: 'Outros',
};

export const CATEGORY_ORDER: Category[] = [
  'COMIDA_BEBIDA_CASEIRA',
  'ELETRONICOS',
  'MOVEIS_DECORACAO',
  'ROUPAS_ACESSORIOS',
  'INFANTIL_BRINQUEDOS',
  'LIVROS_HOBBIES',
  'ESPORTES_LAZER',
  'VEICULOS',
  'BELEZA_CUIDADOS',
  'OUTROS',
];
