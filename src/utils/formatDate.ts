export function formatDate(isoDate: string, locale = 'pt-BR') {
  return new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short' }).format(new Date(isoDate));
}

export function formatTime(isoDate: string, locale = 'pt-BR') {
  return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(new Date(isoDate));
}
