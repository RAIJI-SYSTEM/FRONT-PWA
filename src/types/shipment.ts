export type ShipmentStatus = 'awaiting_pickup' | 'in_transit' | 'delivered' | 'canceled';

export interface Shipment {
  kind: 'shipment';
  id: string;
  code: string;
  status: ShipmentStatus;
  origin: string;
  destination: string;
  estimatedDelivery: string; // ISO 8601
  /** Progresso da entrega, de 0 a 100 */
  progress: number;
}
