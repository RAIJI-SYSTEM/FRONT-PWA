export type ShipmentStatus = 'pending' | 'in_transit' | 'delivered' | 'canceled';

export interface Shipment {
  id: string;
  code: string;
  status: ShipmentStatus;
  currentLocation: string;
  deliveryDate: string; // ISO 8601
  /** Progresso da entrega, de 0 a 100 */
  progress: number;
}
