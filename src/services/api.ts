export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    /** Erros por campo, quando o servidor informa (ex.: { plate: "Placa inválida" }) */
    public fields?: Record<string, string>,
  ) {
    super(message);
  }
}

/**
 * Endereço do servidor das rotas /api. Vazio no navegador (mesma origem); no app Android
 * (exportação estática) aponta para o servidor, ex.: NEXT_PUBLIC_API_URL=http://192.168.0.10:3000
 */
const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');

/** Monta a URL completa de uma rota do servidor (também serve para anexos em /api/uploads/...) */
export const apiUrl = (path: string) => (path.startsWith('/') ? `${API_URL}${path}` : path);

/** fetch para as rotas /api do próprio app, já tratando JSON e erros */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(body.error ?? 'Erro inesperado. Tente novamente.', response.status, body.fields);
  return body as T;
}
