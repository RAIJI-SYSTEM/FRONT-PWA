/** O que está sendo pago: a vaga numa carona (reserva) ou o espaço de uma encomenda */
export type PaymentTarget = { kind: 'ride'; rideId: string; requestId: string } | { kind: 'delivery'; deliveryId: string };

export type PaymentKind = PaymentTarget['kind'];
