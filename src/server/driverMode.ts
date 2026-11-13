/**
 * SIMULAÇÃO do modo motorista (uma conta, em memória): cadastro (CNH + veículos),
 * rotas publicadas, pedidos da região e viagens aceitas.
 * Em produção: banco de dados, verificação da CNH na base do Detran/Senatran,
 * análise humana dos documentos e pedidos filtrados pela localização real do motorista.
 */
import 'server-only';
import type {
  Cnh,
  DriverAccount,
  DriverJob,
  DriverRoute,
  RegionRequest,
  Vehicle,
} from '@/types/driverMode';
import type { DriverProfile, PublicTrip } from '@/types/drivers';
import type { RateDriverRequest } from '@/types/history';
import { formatPlate, normalizePlate, validateCnh, validateVehicle } from '@/utils/driverValidation';
import { customerTagsFor, MAX_RATING_COMMENT } from '@/utils/ratingTags';
import { resolveAttachments } from './uploads';

export class DriverModeError extends Error {
  constructor(
    message: string,
    public status = 400,
    public fields?: Record<string, string>,
  ) {
    super(message);
  }
}

const hoursFromNow = (hours: number) => new Date(Date.now() + hours * 3_600_000).toISOString();
const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

function seed() {
  const requests: RegionRequest[] = [
    { id: 'r1', kind: 'ride', customerId: 'u-bia', customerName: 'Beatriz Lima', customerRating: 4.9, origin: 'Av. Paulista, 1000', destination: 'Aeroporto de Congonhas', distanceKm: 8.4, when: { type: 'now' }, earningsCents: 2860, passengers: 1, status: 'open' },
    { id: 'r2', kind: 'delivery', customerId: 'u-joao', customerName: 'João Pedro', customerRating: 4.7, origin: 'R. Oscar Freire, 90', destination: 'Av. Brasil, 1500', distanceKm: 3.2, when: { type: 'now' }, earningsCents: 1240, packageSize: 'small', fragile: false, status: 'open' },
    { id: 'r3', kind: 'delivery', customerId: 'u-maria', customerName: 'Maria Silva', customerRating: 5, origin: 'Shopping Ibirapuera', destination: 'R. Augusta, 250', distanceKm: 6.9, when: { type: 'scheduled', at: hoursFromNow(3) }, earningsCents: 2150, packageSize: 'medium', fragile: true, status: 'open' },
    { id: 'r4', kind: 'ride', customerId: 'u-lucas', customerName: 'Lucas Andrade', customerRating: 4.4, origin: 'Metrô Vila Madalena', destination: 'Campinas', distanceKm: 96.3, when: { type: 'scheduled', at: hoursFromNow(20) }, earningsCents: 9800, passengers: 2, status: 'open' },
    { id: 'r5', kind: 'ride', customerId: 'u-carla', customerName: 'Carla Nunes', customerRating: 4.8, origin: 'Estação da Luz', destination: 'Hospital Sírio-Libanês', distanceKm: 5.1, when: { type: 'now' }, earningsCents: 1980, passengers: 1, status: 'open' },
    { id: 'r6', kind: 'delivery', customerId: 'u-loja', customerName: 'Loja Parceira', customerRating: 4.6, origin: 'R. 25 de Março, 800', destination: 'Guarulhos', distanceKm: 21.7, when: { type: 'scheduled', at: hoursFromNow(6) }, earningsCents: 4300, packageSize: 'large', fragile: false, status: 'open' },
  ];

  const jobs: DriverJob[] = [
    { id: 'j1', kind: 'ride', customerId: 'u-ana', customerName: 'Ana Costa', origin: 'Casa', destination: 'Shopping Eldorado', date: daysAgo(1), earningsCents: 2240, status: 'completed' },
    { id: 'j2', kind: 'delivery', customerId: 'u-pedro', customerName: 'Pedro Rocha', origin: 'Av. Rebouças, 300', destination: 'Osasco', date: daysAgo(3), earningsCents: 3120, status: 'completed' },
    { id: 'j3', kind: 'ride', customerId: 'u-julia', customerName: 'Júlia Martins', origin: 'Metrô Paraíso', destination: 'Morumbi', date: daysAgo(6), earningsCents: 2780, status: 'completed', customerRating: { stars: 5, tags: ['Pontual'], ratedAt: daysAgo(6) } },
  ];

  return {
    account: { status: 'none', vehicles: [] } as DriverAccount,
    routes: [] as DriverRoute[],
    requests,
    jobs,
  };
}

const globalStore = globalThis as unknown as { driverMode?: ReturnType<typeof seed> };
const store = (globalStore.driverMode ??= seed());

const fail = (errors: Record<string, string | undefined>) => {
  const fields = Object.fromEntries(Object.entries(errors).filter(([, v]) => v)) as Record<string, string>;
  if (Object.keys(fields).length > 0) throw new DriverModeError(Object.values(fields)[0], 400, fields);
};

const requireApproved = () => {
  if (store.account.status === 'none') throw new DriverModeError('Complete o cadastro de motorista primeiro.', 403);
};

// ---------------------------------------------------------------------------
// Conta, CNH e veículos
// ---------------------------------------------------------------------------

export const getDriverAccount = () => store.account;

/** Salva a CNH (fotos já enviadas via /api/uploads: chegam só os IDs) */
export function saveCnh(input: Partial<Cnh> & { frontPhotoId?: string; backPhotoId?: string }) {
  const cnh: Cnh = {
    number: (input.number ?? '').replace(/\D/g, ''),
    category: input.category!,
    expiresAt: input.expiresAt ?? '',
    ear: input.ear === true,
  };
  fail(validateCnh(cnh));

  const photoIds = [input.frontPhotoId, input.backPhotoId].filter((id): id is string => Boolean(id));
  const photos = resolveAttachments(photoIds);
  if (!photos) throw new DriverModeError('Foto da CNH não encontrada. Envie de novo.');
  if (photos.some((p) => p.type !== 'image')) throw new DriverModeError('As fotos da CNH precisam ser imagens.');
  const byId = Object.fromEntries(photos.map((p) => [p.id, p]));
  const frontPhoto = input.frontPhotoId ? byId[input.frontPhotoId] : store.account.cnh?.frontPhoto;
  const backPhoto = input.backPhotoId ? byId[input.backPhotoId] : store.account.cnh?.backPhoto;
  fail({
    frontPhoto: !frontPhoto ? 'Envie a foto da frente da CNH.' : undefined,
    backPhoto: !backPhoto ? 'Envie a foto do verso da CNH.' : undefined,
  });

  store.account.cnh = { ...cnh, frontPhoto, backPhoto };
  updateStatus();
  return store.account;
}

/**
 * Cadastro completo (CNH + 1 veículo) → "em análise". Nesta simulação a análise é
 * aprovada na hora; em produção alguém confere os documentos antes de liberar.
 */
function updateStatus() {
  const complete = Boolean(store.account.cnh) && store.account.vehicles.length > 0;
  if (complete && store.account.status === 'none') store.account.status = 'approved';
}

function cleanVehicle(input: Partial<Vehicle>): Omit<Vehicle, 'id' | 'primary'> {
  const vehicle = {
    type: input.type!,
    model: input.model?.trim() ?? '',
    year: Number(input.year),
    color: input.color?.trim() ?? '',
    plate: normalizePlate(input.plate ?? ''),
    seats: Number(input.seats),
  };
  fail(validateVehicle(vehicle));
  return vehicle;
}

export function addVehicle(input: Partial<Vehicle>) {
  const vehicle = cleanVehicle(input);
  if (store.account.vehicles.some((v) => v.plate === vehicle.plate)) throw new DriverModeError('Esse veículo já está cadastrado.', 409);
  const isFirst = store.account.vehicles.length === 0;
  store.account.vehicles.push({ ...vehicle, id: crypto.randomUUID(), primary: isFirst });
  updateStatus();
  return store.account;
}

export function updateVehicle(id: string, input: Partial<Vehicle>) {
  const current = store.account.vehicles.find((v) => v.id === id);
  if (!current) throw new DriverModeError('Veículo não encontrado.', 404);

  if (input.primary === true) {
    store.account.vehicles.forEach((v) => (v.primary = v.id === id));
    return store.account;
  }
  const vehicle = cleanVehicle({ ...current, ...input });
  if (store.account.vehicles.some((v) => v.id !== id && v.plate === vehicle.plate)) throw new DriverModeError('Outra placa igual já está cadastrada.', 409);
  Object.assign(current, vehicle);
  return store.account;
}

export function removeVehicle(id: string) {
  const vehicles = store.account.vehicles;
  if (!vehicles.some((v) => v.id === id)) throw new DriverModeError('Veículo não encontrado.', 404);
  if (vehicles.length === 1) throw new DriverModeError('Você precisa de pelo menos um veículo cadastrado.', 409);
  if (store.routes.some((r) => r.vehicleId === id && r.status === 'published'))
    throw new DriverModeError('Este veículo está em uma rota publicada. Cancele a rota antes.', 409);

  store.account.vehicles = vehicles.filter((v) => v.id !== id);
  if (!store.account.vehicles.some((v) => v.primary)) store.account.vehicles[0].primary = true;
  return store.account;
}

// ---------------------------------------------------------------------------
// Rotas publicadas
// ---------------------------------------------------------------------------

export const listRoutes = () => [...store.routes].sort((a, b) => Date.parse(a.departureAt) - Date.parse(b.departureAt));

/** Formato antigo da rota (só desta simulação; o app usa o backend) */
export type LegacyNewDriverRoute = Omit<DriverRoute, 'id' | 'seatsTaken' | 'status'>;

export function publishRoute(input: Partial<LegacyNewDriverRoute>) {
  requireApproved();
  const vehicle = store.account.vehicles.find((v) => v.id === input.vehicleId);
  const seats = Number(input.seats);
  const price = Math.round(Number(input.pricePerSeatCents));
  fail({
    originCity: !input.originCity?.trim() ? 'Informe a cidade de saída.' : undefined,
    departurePoint: !input.departurePoint?.trim() ? 'Informe o ponto de encontro.' : undefined,
    destinationCity: !input.destinationCity?.trim()
      ? 'Informe a cidade de destino.'
      : input.destinationCity.trim() === input.originCity?.trim()
        ? 'O destino precisa ser diferente da saída.'
        : undefined,
    departureAt:
      !input.departureAt || Number.isNaN(Date.parse(input.departureAt))
        ? 'Informe a data e o horário.'
        : Date.parse(input.departureAt) < Date.now() + 15 * 60_000
          ? 'Publique com pelo menos 15 minutos de antecedência.'
          : undefined,
    vehicleId: !vehicle ? 'Escolha o veículo.' : undefined,
    seats: vehicle && (!(seats >= 0) || seats > vehicle.seats) ? `De 0 a ${vehicle.seats} lugares neste veículo.` : undefined,
    pricePerSeatCents: !(price >= 100) ? 'Informe o preço por lugar (mínimo R$ 1,00).' : undefined,
  });
  if (seats === 0 && !input.acceptsPackages) throw new DriverModeError('Ofereça lugares ou aceite encomendas.', 400, { seats: 'Ofereça lugares ou aceite encomendas.' });

  const route: DriverRoute = {
    id: crypto.randomUUID(),
    originCity: input.originCity!.trim(),
    departurePoint: input.departurePoint!.trim(),
    destinationCity: input.destinationCity!.trim(),
    departureAt: new Date(input.departureAt!).toISOString(),
    vehicleId: vehicle!.id,
    seats,
    seatsTaken: 0,
    pricePerSeatCents: price,
    acceptsPackages: input.acceptsPackages === true,
    status: 'published',
  };
  store.routes.push(route);
  return route;
}

export function cancelRoute(id: string) {
  const route = store.routes.find((r) => r.id === id);
  if (!route) throw new DriverModeError('Rota não encontrada.', 404);
  if (route.status !== 'published') throw new DriverModeError('Esta rota não pode mais ser cancelada.', 409);
  route.status = 'canceled';
  return route;
}

// ---------------------------------------------------------------------------
// Pedidos da região
// ---------------------------------------------------------------------------

export const listOpenRequests = () => store.requests.filter((r) => r.status === 'open');

/** Aceitar vira uma viagem em "Viagens"; recusar some da lista deste motorista */
export function respondToRequest(id: string, action: 'accept' | 'reject') {
  requireApproved();
  const request = store.requests.find((r) => r.id === id);
  if (!request) throw new DriverModeError('Pedido não encontrado.', 404);
  if (request.status !== 'open') throw new DriverModeError('Este pedido já foi respondido ou aceito por outro motorista.', 409);

  if (action === 'reject') {
    request.status = 'rejected';
    return { request };
  }

  const vehicle = store.account.vehicles.find((v) => v.primary) ?? store.account.vehicles[0];
  if (request.kind === 'ride' && vehicle && (request.passengers ?? 1) > vehicle.seats)
    throw new DriverModeError(`Seu veículo principal tem ${vehicle.seats} lugar(es); este pedido é para ${request.passengers}.`, 409);

  request.status = 'accepted';
  const job: DriverJob = {
    id: `job-${request.id}`,
    kind: request.kind,
    customerId: request.customerId,
    customerName: request.customerName,
    origin: request.origin,
    destination: request.destination,
    date: request.when.type === 'scheduled' ? request.when.at : new Date().toISOString(),
    earningsCents: request.earningsCents,
    status: 'accepted',
  };
  store.jobs.unshift(job);
  return { request, job };
}

// ---------------------------------------------------------------------------
// Viagens do motorista e avaliação de passageiros
// ---------------------------------------------------------------------------

export const listJobs = () => [...store.jobs].sort((a, b) => Date.parse(b.date) - Date.parse(a.date));

export function rateCustomer(id: string, input: Partial<RateDriverRequest>) {
  const job = store.jobs.find((j) => j.id === id);
  if (!job) throw new DriverModeError('Viagem não encontrada.', 404);
  if (job.status !== 'completed') throw new DriverModeError('Só é possível avaliar depois que a viagem terminar.', 409);
  if (job.customerRating) throw new DriverModeError('Você já avaliou este passageiro.', 409);

  const stars = Math.round(Number(input.stars));
  if (!(stars >= 1 && stars <= 5)) throw new DriverModeError('Escolha de 1 a 5 estrelas.');
  const allowed = customerTagsFor(stars);
  job.customerRating = {
    stars,
    tags: (input.tags ?? []).filter((t) => allowed.includes(t)),
    comment: input.comment?.trim().slice(0, MAX_RATING_COMMENT) || undefined,
    ratedAt: new Date().toISOString(),
  };
  return job;
}

/**
 * Rotas publicadas aqui, no formato da busca de passageiros ("Buscar → Entre cidades").
 * TODO: com usuários reais, usar nome, código e avaliação do perfil do motorista logado.
 */
export function listPublishedTrips(): PublicTrip[] {
  const vehicles = store.account.vehicles;
  return store.routes
    .filter((r) => r.status === 'published')
    .map((route) => {
      const vehicle = vehicles.find((v) => v.id === route.vehicleId);
      const driver: DriverProfile = {
        id: 'me',
        code: '00000001',
        name: 'Pablo',
        personType: 'pf',
        vehicle: vehicle ? `${vehicle.model} ${vehicle.color.toLowerCase()} · ${formatPlate(vehicle.plate)}` : '',
        rating: 5,
        tripsCount: store.jobs.filter((j) => j.status === 'completed').length,
        city: route.originCity,
        servesCities: [route.destinationCity],
        services: route.acceptsPackages ? ['rides', 'deliveries'] : ['rides'],
        verified: store.account.status === 'approved',
        memberSince: new Date().toISOString().slice(0, 10),
      };
      return {
        id: `route-${route.id}`,
        originCity: route.originCity,
        destinationCity: route.destinationCity,
        departurePoint: route.departurePoint,
        departureAt: route.departureAt,
        seatsAvailable: route.seats - route.seatsTaken,
        pricePerSeatCents: route.pricePerSeatCents,
        acceptsPackages: route.acceptsPackages,
        driver,
      };
    });
}
