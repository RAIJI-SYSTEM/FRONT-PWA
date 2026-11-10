/**
 * SIMULAÇÃO das notificações (um usuário, em memória).
 * Em produção: o backend cria as notificações nos eventos (motorista aceitou, pagamento aprovado...)
 * e também as envia como push (Capacitor Push Notifications → FCM/APNs), respeitando as preferências.
 */
import 'server-only';
import type { AppMode } from '@/types/message';
import type { AppNotification, NotificationPreferences } from '@/types/notification';

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

function seed() {
  const n = (id: string, mode: AppMode, category: AppNotification['category'], title: string, body: string, minutes: number, read: boolean, href?: string): AppNotification => ({
    id, mode, category, title, body, createdAt: minutesAgo(minutes), read, href,
  });

  const notifications: AppNotification[] = [
    // ---------- Passageiro ----------
    n('p1', 'passenger', 'trips', 'Carlos está a caminho', 'Seu motorista chega em cerca de 6 minutos. Onix prata · ABC1D23.', 4, false, '/corridas'),
    n('p2', 'passenger', 'messages', 'Nova mensagem de Carlos', '"Vou de Onix prata, placa ABC1D23."', 5, false, '/mensagens/conversa?id=carlos-aeroporto'),
    n('p3', 'passenger', 'deliveries', 'Encomenda a caminho', 'Transportes Lima coletou o pacote #H62J568107. Previsão: 18h30.', 95, true, '/encomendas'),
    n('p4', 'passenger', 'payments', 'Pagamento aprovado', 'R$ 23,80 no cartão final 4242 pela corrida até o Shopping Ibirapuera.', 60 * 26, true, '/corridas'),
    n('p5', 'passenger', 'trips', 'Como foi sua corrida?', 'Avalie Ana Ribeiro e ajude a manter a qualidade dos motoristas.', 60 * 25, false, '/corridas'),
    n('p6', 'passenger', 'promotions', 'Ganhe R$ 15 no primeiro cupom', 'Assista a 3 anúncios curtos e libere seu desconto.', 60 * 30, true, '/recompensas'),
    n('p7', 'passenger', 'promotions', 'Seu cupom ENVIA5 vence em 3 dias', 'R$ 5 de desconto na sua próxima encomenda.', 60 * 72, true, '/recompensas'),
    n('p8', 'passenger', 'account', 'Novo acesso à sua conta', 'Entramos a partir de um novo aparelho (Android). Se não foi você, troque sua senha.', 60 * 96, true),

    // ---------- Motorista ----------
    n('d1', 'driver', 'trips', 'Nova carona na sua região', 'Beatriz Lima · Av. Paulista → Aeroporto de Congonhas · R$ 28,60.', 3, false, '/motorista/viagens?aba=regiao'),
    n('d2', 'driver', 'deliveries', 'Encomenda frágil disponível', 'Shopping Ibirapuera → R. Augusta · tamanho médio · R$ 21,50.', 20, false, '/motorista/encomendas?aba=regiao'),
    n('d3', 'driver', 'messages', 'Nova mensagem de Carla', '"Dá para me deixar perto da Unicamp?"', 40, false, '/mensagens/conversa?id=mot-grupo-campinas'),
    n('d4', 'driver', 'trips', 'Reserva na sua rota', 'Lucas Andrade reservou 1 lugar em São Paulo → Campinas.', 60 * 5, true, '/motorista/rotas'),
    n('d5', 'driver', 'payments', 'Ganho liberado', 'R$ 31,20 da entrega para Osasco já está disponível.', 60 * 28, true, '/motorista/encomendas?aba=minhas'),
    n('d6', 'driver', 'account', 'Você recebeu 5 estrelas', 'Júlia Martins avaliou sua viagem: "Pontual".', 60 * 30, true),
    n('d7', 'driver', 'account', 'Mantenha seus documentos em dia', 'Confira a validade da sua CNH no perfil de motorista.', 60 * 100, true, '/motorista/perfil'),
  ];

  const preferences: Record<AppMode, NotificationPreferences> = {
    passenger: { trips: true, deliveries: true, payments: true, messages: true, promotions: true },
    driver: { trips: true, deliveries: true, payments: true, messages: true, promotions: false },
  };
  return { notifications, preferences };
}

const globalStore = globalThis as unknown as { notifications?: ReturnType<typeof seed> };
const store = (globalStore.notifications ??= seed());

/** Mais recentes primeiro; tipos desligados nas preferências não aparecem ("account" sempre aparece) */
export function listNotifications(mode: AppMode) {
  const prefs = store.preferences[mode];
  return store.notifications
    .filter((n) => n.mode === mode && (n.category === 'account' || prefs[n.category]))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

/** Marca como lidas: as indicadas por id, ou todas do modo */
export function markRead(mode: AppMode, ids?: string[]) {
  for (const n of store.notifications) {
    if (n.mode === mode && (!ids || ids.includes(n.id))) n.read = true;
  }
  return listNotifications(mode);
}

export function removeNotification(mode: AppMode, id: string) {
  const before = store.notifications.length;
  store.notifications = store.notifications.filter((n) => !(n.mode === mode && n.id === id));
  return before !== store.notifications.length;
}

export const getPreferences = (mode: AppMode) => store.preferences[mode];

export function updatePreferences(mode: AppMode, changes: Partial<NotificationPreferences>) {
  const current = store.preferences[mode];
  for (const key of Object.keys(current) as (keyof NotificationPreferences)[]) {
    if (typeof changes[key] === 'boolean') current[key] = changes[key];
  }
  return current;
}
