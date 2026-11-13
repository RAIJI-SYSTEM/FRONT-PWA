/**
 * Login com o Keycloak (OpenID Connect, Authorization Code + PKCE).
 *
 * A senha nunca é digitada no app: login, cadastro e Google acontecem nas páginas do
 * Keycloak (por trás do Kong).
 *  - Web/PWA: a página é redirecionada e volta em /auth/callback.
 *  - App Android (Capacitor): abre uma aba sobreposta ao app (Chrome Custom Tabs, via
 *    @capacitor/browser) — sem trocar de app — e volta por com.raiji.app://auth/callback.
 *    O Google bloqueia login dentro de WebView, por isso a aba e não a WebView do app.
 *
 * A sessão (tokens) fica no localStorage e é renovada sozinha com o refresh token.
 */
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { OidcClient, WebStorageStateStore } from 'oidc-client-ts';

/** Endereço público do Keycloak (o Kong). No celular, use o IP do PC: http://192.168.0.10:8000 */
const KEYCLOAK_URL = (process.env.NEXT_PUBLIC_KEYCLOAK_URL ?? 'http://localhost:8000').replace(/\/$/, '');
const REALM = process.env.NEXT_PUBLIC_KEYCLOAK_REALM ?? 'raiji';
const CLIENT_ID = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID ?? 'raiji-api';

const ISSUER = `${KEYCLOAK_URL}/realms/${REALM}`;
const OIDC = `${ISSUER}/protocol/openid-connect`;
const NATIVE_REDIRECT_URI = 'com.raiji.app://auth/callback';
const STORAGE_KEY = 'raiji.auth.session';
/** Renova o token um pouco antes de vencer */
const REFRESH_MARGIN_SECONDS = 30;
/** Cor da barra da aba de login no Android (primary do tema) */
const TOOLBAR_COLOR = '#EF6C00';

export interface SessionUser {
  /** ID do Keycloak (claim "sub") — o mesmo usado pelo chat e pelo monolito */
  id: string;
  email?: string;
  name?: string;
}

export interface Session {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  /** Segundos desde 1970 */
  expiresAt: number;
  user: SessionUser;
}

export interface SignInOptions {
  /** Pula a tela do Keycloak e vai direto ao provedor (ex.: Google) */
  provider?: 'google';
  /** 'register' abre direto o formulário de cadastro */
  mode?: 'login' | 'register';
  /** Para onde ir depois de entrar */
  returnTo?: string;
}

export class SessionExpiredError extends Error {
  constructor() {
    super('Sua sessão expirou. Entre novamente.');
  }
}

const isBrowser = () => typeof window !== 'undefined';
const isNative = () => isBrowser() && Capacitor.isNativePlatform();
/** true no app Android/iOS (Capacitor); false no navegador */
export const isNativeApp = isNative;
const now = () => Math.floor(Date.now() / 1000);

// ---------------------------------------------------------------------------
// Sessão em memória + localStorage (com aviso para quem estiver observando)
// ---------------------------------------------------------------------------

let current: Session | null | undefined; // undefined = ainda não lida do storage
const listeners = new Set<() => void>();

function readStorage(): Session | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

function setSession(session: Session | null) {
  current = session;
  try {
    if (session) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // modo privado/storage bloqueado: a sessão fica só em memória
  }
  listeners.forEach((listener) => listener());
}

/** Sessão atual (mesmo objeto enquanto não muda — próprio para useSyncExternalStore) */
export function getSession(): Session | null {
  if (!isBrowser()) return null;
  if (current === undefined) current = readStorage();
  return current;
}

export function subscribeSession(listener: () => void) {
  listeners.add(listener);
  // Login/logout feito em outra aba do navegador
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      current = readStorage();
      listener();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

function toSession(tokens: {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  expires_at?: number;
  expires_in?: number;
  profile?: Record<string, unknown>;
}, previous?: Session): Session {
  const profile = tokens.profile ?? decodeJwt(tokens.id_token) ?? decodeJwt(tokens.access_token) ?? {};
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token ?? previous?.refreshToken,
    idToken: tokens.id_token ?? previous?.idToken,
    expiresAt: tokens.expires_at ?? now() + (tokens.expires_in ?? 60),
    user: {
      id: String(profile.sub ?? previous?.user.id ?? ''),
      email: (profile.email as string | undefined) ?? previous?.user.email,
      name: (profile.name as string | undefined) ?? previous?.user.name,
    },
  };
}

function decodeJwt(token?: string): Record<string, unknown> | null {
  if (!token) return null;
  try {
    const payload = token.split('.')[1]!.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(decodeURIComponent(escape(atob(payload)))) as Record<string, unknown>;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// OpenID Connect
// ---------------------------------------------------------------------------

let client: OidcClient | undefined;

function oidc() {
  client ??= new OidcClient({
    authority: ISSUER,
    client_id: CLIENT_ID,
    redirect_uri: isNative() ? NATIVE_REDIRECT_URI : `${window.location.origin}/auth/callback`,
    response_type: 'code',
    scope: 'openid profile email',
    // Endpoints informados aqui: o app não precisa buscar o documento de descoberta
    metadata: {
      issuer: ISSUER,
      authorization_endpoint: `${OIDC}/auth`,
      token_endpoint: `${OIDC}/token`,
      end_session_endpoint: `${OIDC}/logout`,
      userinfo_endpoint: `${OIDC}/userinfo`,
      jwks_uri: `${OIDC}/certs`,
    },
    // localStorage: sobrevive ao app ir para segundo plano enquanto a aba de login está aberta
    stateStore: new WebStorageStateStore({ store: window.localStorage }),
  });
  return client;
}

/**
 * Abre o login do Keycloak (ou o cadastro, ou direto o Google).
 * Na web a página sai e volta em /auth/callback; no app abre a aba sobreposta.
 */
export async function signIn({ provider, mode = 'login', returnTo = '/homepage' }: SignInOptions = {}) {
  const request = await oidc().createSigninRequest({
    state: { returnTo },
    ui_locales: 'pt-BR',
    ...(provider ? { extraQueryParams: { kc_idp_hint: provider } } : {}),
  });
  // Cadastro: mesmo pedido, no endpoint de registro do Keycloak
  // (o Keycloak 26.0 ignora o padrão prompt=create e abriria o login)
  const url = mode === 'register' ? request.url.replace(`${OIDC}/auth?`, `${OIDC}/registrations?`) : request.url;

  if (isNative()) {
    await initNativeAuth();
    await Browser.open({ url, toolbarColor: TOOLBAR_COLOR, presentationStyle: 'popover' });
  } else {
    window.location.assign(url);
  }
}

/**
 * Conclui o login a partir da URL de retorno (?code=...&state=...): troca o código
 * pelos tokens e grava a sessão. Devolve para onde o usuário deve ir.
 */
export async function completeSignIn(url = window.location.href): Promise<string> {
  const response = await oidc().processSigninResponse(url);
  setSession(toSession(response));
  const state = response.userState as { returnTo?: string } | undefined;
  return state?.returnTo ?? '/homepage';
}

let refreshing: Promise<Session> | null = null;

async function refreshSession(session: Session): Promise<Session> {
  if (!session.refreshToken) throw new SessionExpiredError();
  const response = await fetch(`${OIDC}/token`, {
    method: 'POST',
    body: new URLSearchParams({ grant_type: 'refresh_token', client_id: CLIENT_ID, refresh_token: session.refreshToken }),
  });
  if (!response.ok) {
    setSession(null);
    throw new SessionExpiredError();
  }
  const next = toSession(await response.json(), session);
  setSession(next);
  return next;
}

/**
 * Token para chamar as APIs (Kong): `Authorization: Bearer <token>`.
 * Renova sozinho quando está para vencer. null = ninguém logado.
 */
export async function getAccessToken(): Promise<string | null> {
  const session = getSession();
  if (!session) return null;
  if (session.expiresAt - REFRESH_MARGIN_SECONDS > now()) return session.accessToken;
  refreshing ??= refreshSession(session).finally(() => {
    refreshing = null;
  });
  return (await refreshing).accessToken;
}

/**
 * Renova o token AGORA (ex.: logo depois da CNH ser aprovada, para o token já
 * trazer a permissão de motorista).
 */
export async function forceRefreshSession(): Promise<Session | null> {
  const session = getSession();
  if (!session) return null;
  refreshing ??= refreshSession(session).finally(() => {
    refreshing = null;
  });
  return refreshing;
}

/** Sai: apaga a sessão local e encerra a sessão no Keycloak (sem abrir página nenhuma) */
export async function signOut() {
  const session = getSession();
  setSession(null);
  if (session?.refreshToken) {
    await fetch(`${OIDC}/logout`, {
      method: 'POST',
      body: new URLSearchParams({ client_id: CLIENT_ID, refresh_token: session.refreshToken }),
    }).catch(() => {});
  }
}

// ---------------------------------------------------------------------------
// App Android: retorno do login por com.raiji.app://auth/callback
// ---------------------------------------------------------------------------

let nativeInit: Promise<void> | undefined;
const nativeErrorListeners = new Set<(error: Error) => void>();

/** Avisa a tela de login quando o retorno no app falha */
export function onNativeSignInError(listener: (error: Error) => void) {
  nativeErrorListeners.add(listener);
  return () => {
    nativeErrorListeners.delete(listener);
  };
}

async function handleNativeUrl(url: string) {
  if (!url.startsWith(NATIVE_REDIRECT_URI)) return;
  await Browser.close().catch(() => {}); // fecha a aba de login
  try {
    await completeSignIn(url);
  } catch (err) {
    nativeErrorListeners.forEach((listener) => listener(err instanceof Error ? err : new Error(String(err))));
  }
}

/**
 * Registra o retorno do login no app. Chame cedo (a tela de login já chama).
 * Também trata o caso do app ter sido reaberto pelo próprio link de retorno.
 */
export function initNativeAuth(): Promise<void> {
  if (!isNative()) return Promise.resolve();
  nativeInit ??= (async () => {
    await App.addListener('appUrlOpen', ({ url }) => void handleNativeUrl(url));
    const launch = await App.getLaunchUrl();
    if (launch?.url) await handleNativeUrl(launch.url);
  })();
  return nativeInit;
}
