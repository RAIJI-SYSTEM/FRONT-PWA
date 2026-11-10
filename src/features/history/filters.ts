import { normalize } from '@/utils/text';

export type Period = 'all' | '7d' | '30d' | '90d';

export const PERIODS: { value: Period; label: string }[] = [
  { value: 'all', label: 'Todo o período' },
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: '90d', label: 'Últimos 3 meses' },
];

const PERIOD_DAYS: Record<Exclude<Period, 'all'>, number> = { '7d': 7, '30d': 30, '90d': 90 };

/** Itens futuros (agendados) sempre entram: o filtro de período olha para o passado */
export function inPeriod(isoDate: string, period: Period) {
  if (period === 'all') return true;
  const time = Date.parse(isoDate);
  return time >= Date.now() - PERIOD_DAYS[period] * 86_400_000;
}

export function matchesQuery(query: string, ...fields: (string | undefined)[]) {
  const q = normalize(query.trim());
  return !q || fields.some((field) => field && normalize(field).includes(q));
}

/** Agrupa por mês ("outubro de 2026"), mantendo a ordem recebida */
export function groupByMonth<T extends { date: string }>(items: T[], locale = 'pt-BR') {
  const formatter = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' });
  const groups: { label: string; items: T[] }[] = [];
  for (const item of items) {
    const label = formatter.format(new Date(item.date));
    const last = groups.at(-1);
    if (last?.label === label) last.items.push(item);
    else groups.push({ label, items: [item] });
  }
  return groups;
}
