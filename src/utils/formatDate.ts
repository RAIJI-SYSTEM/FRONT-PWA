export function formatDate(isoDate: string, locale = 'pt-BR') {
  return new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short' }).format(new Date(isoDate));
}

export function formatTime(isoDate: string, locale = 'pt-BR') {
  return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(new Date(isoDate));
}

const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

function relativeDay(date: Date): 'today' | 'yesterday' | null {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(date, now)) return 'today';
  if (isSameDay(date, yesterday)) return 'yesterday';
  return null;
}

/** Horário da conversa na lista: "14:32" hoje, "Ontem", ou "12/10" */
export function formatMessageTime(isoDate: string, locale = 'pt-BR') {
  const date = new Date(isoDate);
  const day = relativeDay(date);
  if (day === 'today') return formatTime(isoDate, locale);
  if (day === 'yesterday') return 'Ontem';
  return new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit' }).format(date);
}

/** Separador de dia no chat: "Hoje", "Ontem" ou "12 de outubro" */
export function formatDayLabel(isoDate: string, locale = 'pt-BR') {
  const date = new Date(isoDate);
  const day = relativeDay(date);
  if (day === 'today') return 'Hoje';
  if (day === 'yesterday') return 'Ontem';
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long' }).format(date);
}
