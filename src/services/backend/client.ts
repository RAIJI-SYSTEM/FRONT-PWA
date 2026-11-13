import { ApiError } from '@/services/api';
import { getAccessToken } from '@/services/auth';

/**
 * Cliente do backend Raiji (monolito Java), sempre pelo Kong — a mesma porta do login.
 * NEXT_PUBLIC_RAIJI_API_URL (padrão http://localhost:8000). No app Android, use o IP do PC.
 */
export const RAIJI_API_URL = (process.env.NEXT_PUBLIC_RAIJI_API_URL ?? process.env.NEXT_PUBLIC_KEYCLOAK_URL ?? 'http://localhost:8000').replace(/\/$/, '');

type Query = Record<string, string | number | boolean | undefined | null | (string | number)[]>;

function buildUrl(path: string, query?: Query) {
  const url = new URL(`${RAIJI_API_URL}${path}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) value.forEach((v) => url.searchParams.append(key, String(v)));
    else url.searchParams.set(key, String(value));
  }
  return url.toString();
}

/** Chamada autenticada ao backend. Erros viram ApiError com a mensagem do servidor ("message"). */
export async function backend<T>(path: string, init: { method?: string; body?: unknown; query?: Query } = {}): Promise<T> {
  const token = await getAccessToken();
  if (!token) throw new ApiError('Entre na sua conta para continuar.', 401);

  const response = await fetch(buildUrl(path, init.query), {
    method: init.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.body !== undefined && !(init.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
    },
    body: init.body === undefined ? undefined : init.body instanceof FormData ? init.body : JSON.stringify(init.body),
  });

  if (response.status === 204) return undefined as T;
  const text = await response.text();
  const body = text ? safeJson(text) : null;
  if (!response.ok) {
    const message = (body && (body.message || body.error)) || defaultMessage(response.status);
    throw new ApiError(message, response.status, body?.fields);
  }
  return body as T;
}

function safeJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function defaultMessage(status: number) {
  if (status === 401) return 'Sua sessão expirou. Entre de novo.';
  if (status === 403) return 'Você não tem permissão para isso.';
  if (status === 404) return 'Não encontrado.';
  if (status >= 500) return 'O servidor está com problemas. Tente de novo em instantes.';
  return 'Erro inesperado. Tente novamente.';
}

/** Reais (número do backend) -> centavos (padrão do app) */
export const toCents = (reais: number | null | undefined) => (reais === null || reais === undefined ? 0 : Math.round(reais * 100));

/** Centavos -> reais com 2 casas, para enviar ao backend */
export const toReais = (cents: number | null | undefined) => (cents === null || cents === undefined ? null : Math.round(cents) / 100);

/**
 * Hora de Brasília sem fuso ("2026-11-20T08:00:00"), como o backend espera.
 * Os horários das caronas são "hora de parede" no Brasil.
 */
export function toBrazilLocal(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  const hour = get('hour') === '24' ? '00' : get('hour');
  return `${get('year')}-${get('month')}-${get('day')}T${hour}:${get('minute')}:${get('second')}`;
}

/** "2026-11-20T08:00:00" (hora de Brasília) -> ISO com fuso, para o app formatar */
export function fromBrazilLocal(local: string | null | undefined): string {
  if (!local) return new Date().toISOString();
  return new Date(`${local.slice(0, 19)}-03:00`).toISOString();
}
