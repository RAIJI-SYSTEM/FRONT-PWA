export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

/** fetch para as rotas /api do próprio app, já tratando JSON e erros */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(body.error ?? 'Erro inesperado. Tente novamente.', response.status);
  return body as T;
}
