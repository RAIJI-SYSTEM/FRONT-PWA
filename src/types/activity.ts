import type { Shipment } from './shipment';
import type { Trip } from './trip';

/** Algo que está acontecendo agora ou prestes a começar: uma viagem ou uma encomenda */
export type Activity = Trip | Shipment;
