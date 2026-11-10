/**
 * SIMULAÇÃO do histórico de corridas e encomendas (um usuário, em memória).
 * Em produção, vem do banco de dados, paginado e filtrado no servidor.
 */
import 'server-only';
import type {
  DeliveryHistoryItem,
  DriverRating,
  HistoryDriver,
  HistoryKind,
  RateDriverRequest,
  RideHistoryItem,
} from '@/types/history';
import { MAX_RATING_COMMENT, tagsFor } from '@/utils/ratingTags';

const DRIVERS: Record<string, HistoryDriver> = {
  carlos: { id: 'carlos', name: 'Carlos Souza', vehicle: 'Onix prata · ABC1D23' },
  ana: { id: 'ana', name: 'Ana Ribeiro', vehicle: 'HB20 branco · QWE4R56' },
  marcos: { id: 'marcos', name: 'Marcos Alves', vehicle: 'Corolla cinza · ZXC0V12' },
  lima: { id: 'lima', name: 'Transportes Lima', vehicle: 'Spin preta · RTY7U89' },
  rafa: { id: 'rafa', name: 'Rafael Costa', vehicle: 'Fiorino branca · JKL3M45' },
};

const daysAgo = (days: number, hour = 9) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};
const rated = (stars: number, tags: string[], days: number): DriverRating => ({ stars, tags, ratedAt: daysAgo(days, 20) });

function seed() {
  const rides: RideHistoryItem[] = [
    { id: 'c1', status: 'scheduled', origin: 'Casa', destination: 'Aeroporto de Guarulhos', date: daysAgo(-1, 20), priceCents: 8930, distanceKm: 28.4, shared: false, paymentMethod: 'card', driver: DRIVERS.carlos },
    { id: 'c2', status: 'in_progress', origin: 'Av. Paulista, 1000', destination: 'Campinas', date: daysAgo(0, 7), priceCents: 4500, distanceKm: 94.2, shared: true, paymentMethod: 'pix', driver: DRIVERS.marcos },
    { id: 'c3', status: 'completed', origin: 'R. Oscar Freire, 90', destination: 'Shopping Ibirapuera', date: daysAgo(2, 18), priceCents: 2380, distanceKm: 6.1, shared: false, paymentMethod: 'card', driver: DRIVERS.ana },
    { id: 'c4', status: 'completed', origin: 'Trabalho', destination: 'Casa', date: daysAgo(5, 19), priceCents: 1990, distanceKm: 5.3, shared: false, paymentMethod: 'pix', driver: DRIVERS.carlos, rating: rated(5, ['Pontual', 'Direção segura'], 5) },
    { id: 'c5', status: 'canceled', origin: 'Casa', destination: 'Estação da Luz', date: daysAgo(9, 8), priceCents: 0, distanceKm: 7.8, shared: false, paymentMethod: 'card', driver: DRIVERS.ana },
    { id: 'c6', status: 'completed', origin: 'Av. Paulista, 1000', destination: 'Santos', date: daysAgo(21, 10), priceCents: 6200, distanceKm: 78.5, shared: true, paymentMethod: 'card', driver: DRIVERS.marcos },
    { id: 'c7', status: 'completed', origin: 'Casa', destination: 'Hospital Sírio-Libanês', date: daysAgo(45, 14), priceCents: 3150, distanceKm: 9.2, shared: false, paymentMethod: 'pix', driver: DRIVERS.carlos, rating: rated(4, ['Educado'], 44) },
    { id: 'c8', status: 'completed', origin: 'Rodoviária Tietê', destination: 'Casa', date: daysAgo(120, 22), priceCents: 4470, distanceKm: 14.9, shared: false, paymentMethod: 'card', driver: DRIVERS.ana, rating: rated(2, ['Rota ruim'], 119) },
  ];

  const deliveries: DeliveryHistoryItem[] = [
    { id: 'e1', code: '#H62J568107', status: 'in_transit', origin: 'Av. Paulista, 1000', destination: 'R. Augusta, 250', date: daysAgo(0, 15), priceCents: 931, size: 'small', description: 'Livros', recipientName: 'Maria Silva', driver: DRIVERS.lima },
    { id: 'e2', code: '#K91B220431', status: 'awaiting_pickup', origin: 'R. Oscar Freire, 90', destination: 'Av. Brasil, 1500', date: daysAgo(-1, 10), priceCents: 1540, size: 'medium', description: 'Roupas', recipientName: 'João Pedro', driver: DRIVERS.rafa },
    { id: 'e3', code: '#P07Z993215', status: 'delivered', origin: 'Casa', destination: 'Rio de Janeiro, RJ', date: daysAgo(3, 9), priceCents: 18900, size: 'large', description: 'Monitor', fragile: true, recipientName: 'Beatriz Lima', driver: DRIVERS.lima },
    { id: 'e4', code: '#A11C443290', status: 'delivered', origin: 'Trabalho', destination: 'Cartório Central', date: daysAgo(8, 11), priceCents: 820, size: 'envelope', description: 'Documentos', recipientName: 'Cartório', driver: DRIVERS.rafa, rating: rated(5, ['Pontual', 'Boa comunicação'], 8) },
    { id: 'e5', code: '#B55D110072', status: 'canceled', origin: 'Casa', destination: 'Osasco', date: daysAgo(15, 16), priceCents: 0, size: 'medium', description: 'Presente', recipientName: 'Ana Ribeiro', driver: DRIVERS.lima },
    { id: 'e6', code: '#C20E781154', status: 'delivered', origin: 'Casa', destination: 'Guarulhos', date: daysAgo(40, 13), priceCents: 2760, size: 'small', description: 'Eletrônicos', recipientName: 'Carlos Mendes', driver: DRIVERS.rafa },
    { id: 'e7', code: '#D98F302267', status: 'delivered', origin: 'Loja', destination: 'Campinas', date: daysAgo(95, 9), priceCents: 5600, size: 'large', description: 'Estante desmontada', recipientName: 'Loja Parceira', driver: DRIVERS.lima, rating: rated(3, ['Atrasou'], 94) },
  ];

  return { rides, deliveries };
}

// A chave tem versão: ao mudar os dados de exemplo, troque-a para o `next dev` recriar tudo
const globalStore = globalThis as unknown as { historyV2?: ReturnType<typeof seed> };
const store = (globalStore.historyV2 ??= seed());

/** Mais recentes primeiro; agendadas (no futuro) aparecem no topo */
const byDateDesc = <T extends { date: string }>(items: T[]) => [...items].sort((a, b) => Date.parse(b.date) - Date.parse(a.date));

export const listRides = () => byDateDesc(store.rides);
export const listDeliveries = () => byDateDesc(store.deliveries);

export class RatingError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

/** Avalia o motorista de uma corrida concluída ou encomenda entregue (uma única vez) */
export function rateDriver(kind: HistoryKind, id: string, request: RateDriverRequest) {
  const item = kind === 'rides' ? store.rides.find((r) => r.id === id) : store.deliveries.find((d) => d.id === id);
  if (!item) throw new RatingError('Não encontrado.', 404);

  const finished = kind === 'rides' ? item.status === 'completed' : item.status === 'delivered';
  if (!finished) throw new RatingError('Só é possível avaliar depois que terminar.', 409);
  if (item.rating) throw new RatingError('Você já avaliou este motorista.', 409);

  const stars = Math.round(Number(request.stars));
  if (!(stars >= 1 && stars <= 5)) throw new RatingError('Escolha de 1 a 5 estrelas.');

  const allowed = tagsFor(kind, stars);
  const tags = (request.tags ?? []).filter((tag) => allowed.includes(tag));
  const comment = request.comment?.trim().slice(0, MAX_RATING_COMMENT) || undefined;

  item.rating = { stars, tags, comment, ratedAt: new Date().toISOString() };
  return item;
}
