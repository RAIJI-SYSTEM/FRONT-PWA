// TODO: integrar com o backend de autenticação (ex.: usando src/services/api.ts)

export interface Credentials {
  email: string;
  password: string;
}

const simulateRequest = () => new Promise((resolve) => setTimeout(resolve, 800));

export async function signInWithEmail({ email, password }: Credentials) {
  await simulateRequest();
  if (!email || !password) throw new Error('E-mail ou senha inválidos.');
}

export async function signInWithGoogle() {
  await simulateRequest();
}
