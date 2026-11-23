/**
 * Notificações push (Firebase Cloud Messaging) no app Android, pelo plugin do Capacitor.
 *
 * - Ao entrar: pergunta ao servidor se o push está ligado; se estiver, pede permissão,
 *   registra o aparelho e manda o token ao backend (PUT /api/push/devices).
 * - Ao tocar numa notificação: abre a conversa ou as notificações do modo certo.
 * - Ao sair da conta: remove o token, para o aparelho não receber avisos de outra pessoa.
 *
 * No navegador não faz nada. Sem o google-services.json no build do app, também não: registrar
 * sem ele derruba o app (erro nativo que o try/catch daqui não alcança).
 */
import { Capacitor } from '@capacitor/core';
import { backend } from '@/services/backend/client';
import { routes } from '@/utils/routes';

/** O build do app levou o google-services.json? (definido no next.config.ts) */
const PUSH_AVAILABLE = process.env.NEXT_PUBLIC_PUSH_AVAILABLE === 'true';

const CHANNEL_ID = 'raiji'; // o mesmo que o backend usa (FcmSender.ANDROID_CHANNEL)

let currentToken: string | null = null;
let registeredFor: string | null = null;
let listenersReady = false;

type Navigate = (href: string) => void;

/** Para onde ir ao tocar na notificação */
export function pushTarget(data: Record<string, unknown> | undefined): string | null {
  if (!data) return null;
  if (data.type === 'chat' && typeof data.conversationId === 'string') return routes.conversation(data.conversationId);
  if (data.type === 'notification') return data.audience === 'DRIVER' ? '/motorista/notificacoes' : '/notificacoes';
  return null;
}

async function setupListeners(navigate: Navigate) {
  if (listenersReady) return;
  listenersReady = true;
  const { PushNotifications } = await import('@capacitor/push-notifications');

  await PushNotifications.createChannel({
    id: CHANNEL_ID,
    name: 'Mensagens e avisos',
    description: 'Mensagens do chat e avisos das suas viagens',
    importance: 5,
    visibility: 1,
    sound: 'default',
    vibration: true,
  }).catch(() => {});

  await PushNotifications.addListener('registration', async ({ value }) => {
    currentToken = value;
    try {
      await backend('/api/push/devices', { method: 'PUT', body: { token: value, platform: Capacitor.getPlatform() } });
    } catch (err) {
      console.warn('push: token não registrado no servidor', err);
    }
  });
  await PushNotifications.addListener('registrationError', (err) => {
    console.warn('push: registro falhou (falta o google-services.json?)', err);
  });
  await PushNotifications.addListener('pushNotificationActionPerformed', ({ notification }) => {
    const target = pushTarget(notification.data);
    if (target) navigate(target);
  });
}

/** Chamado com a pessoa logada (uma vez por conta, mesmo que a tela remonte) */
export async function initPush(userId: string, navigate: Navigate) {
  if (!PUSH_AVAILABLE || !Capacitor.isNativePlatform() || registeredFor === userId) return;
  registeredFor = userId;
  try {
    const { enabled } = await backend<{ enabled: boolean }>('/api/push/devices/status');
    if (!enabled) return;
    const { PushNotifications } = await import('@capacitor/push-notifications');
    await setupListeners(navigate);
    let permission = await PushNotifications.checkPermissions();
    if (permission.receive === 'prompt' || permission.receive === 'prompt-with-rationale') {
      permission = await PushNotifications.requestPermissions();
    }
    if (permission.receive !== 'granted') return;
    await PushNotifications.register();
  } catch (err) {
    registeredFor = null; // tenta de novo na próxima abertura
    console.warn('push: não foi possível ativar', err);
  }
}

/** Antes de sair da conta */
export async function unregisterPush() {
  const token = currentToken;
  registeredFor = null;
  currentToken = null;
  if (!token || !Capacitor.isNativePlatform()) return;
  await backend('/api/push/devices', { method: 'DELETE', body: { token, platform: Capacitor.getPlatform() } }).catch(() => {});
}
