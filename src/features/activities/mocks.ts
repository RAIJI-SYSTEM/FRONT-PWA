import type { Activity } from '@/types/activity';

// Dados de exemplo até a integração com a API (src/services)
export const ongoingActivitiesMock: Activity[] = [
  {
    kind: 'shipment',
    id: 'enc-1',
    code: '#H62J568107',
    status: 'in_transit',
    origin: 'Av. Paulista, 1000',
    destination: 'R. Augusta, 250',
    estimatedDelivery: '2026-10-06T18:30:00',
    progress: 60,
  },
  {
    kind: 'trip',
    id: 'via-1',
    status: 'scheduled',
    origin: 'Casa',
    destination: 'Aeroporto de Guarulhos',
    scheduledAt: '2026-10-06T20:15:00',
    driverName: 'Carlos',
    vehicle: 'Onix prata · ABC1D23',
  },
  {
    kind: 'shipment',
    id: 'enc-2',
    code: '#K91B220431',
    status: 'awaiting_pickup',
    origin: 'R. Oscar Freire, 90',
    destination: 'Av. Brasil, 1500',
    estimatedDelivery: '2026-10-07T10:00:00',
    progress: 5,
  },
  {
    kind: 'trip',
    id: 'via-2',
    status: 'scheduled',
    origin: 'Trabalho',
    destination: 'Casa',
    scheduledAt: '2026-10-07T18:00:00',
  },
];
