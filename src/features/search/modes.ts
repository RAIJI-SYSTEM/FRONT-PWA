import { Hash, MapPinned, Route, type LucideIcon } from 'lucide-react';

export type SearchMode = 'regiao' | 'codigo' | 'cidades';

export const SEARCH_MODES: { value: SearchMode; label: string; description: string; icon: LucideIcon }[] = [
  { value: 'regiao', label: 'Na região', description: 'Motoristas perto de você', icon: MapPinned },
  { value: 'codigo', label: 'Por código', description: 'Código de 8 dígitos', icon: Hash },
  { value: 'cidades', label: 'Entre cidades', description: 'Viagens publicadas', icon: Route },
];

export const isSearchMode = (value: unknown): value is SearchMode => SEARCH_MODES.some((m) => m.value === value);
