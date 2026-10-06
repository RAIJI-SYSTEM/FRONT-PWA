import type { Shipment } from '@/types/shipment';

// Dados de exemplo até a integração com a API (src/services)
export const currentShipmentMock: Shipment = {
  id: '1',
  code: '#H62J568107',
  status: 'in_transit',
  currentLocation: 'São Paulo, SP',
  deliveryDate: '2026-10-15T12:00:00',
  progress: 60,
};

export const recentShipmentsMock: Shipment[] = [
  {
    id: '2',
    code: '#H62J568108',
    status: 'in_transit',
    currentLocation: 'Campinas, SP',
    deliveryDate: '2026-10-15T12:00:00',
    progress: 45,
  },
  {
    id: '3',
    code: '#K91B220431',
    status: 'pending',
    currentLocation: 'Curitiba, PR',
    deliveryDate: '2026-10-18T12:00:00',
    progress: 10,
  },
  {
    id: '4',
    code: '#P07Z993215',
    status: 'delivered',
    currentLocation: 'Rio de Janeiro, RJ',
    deliveryDate: '2026-10-02T12:00:00',
    progress: 100,
  },
];
