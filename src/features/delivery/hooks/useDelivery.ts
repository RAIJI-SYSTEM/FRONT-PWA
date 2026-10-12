'use client';

import { usePolling } from '@/hooks/usePolling';
import { getDelivery } from '@/services/deliveries';
import type { Delivery } from '@/types/delivery';

const isSearching = (delivery: Delivery) => delivery.status === 'searching';

/** Acompanha a entrega enquanto os motoristas não respondem */
export function useDelivery(id: string) {
  const { data, error, setData } = usePolling(id, getDelivery, isSearching);
  return { delivery: data, error, setDelivery: setData };
}
