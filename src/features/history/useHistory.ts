'use client';

import { useState } from 'react';
import { usePolling } from '@/hooks/usePolling';
import type { DeliveryHistoryItem, RideHistoryItem } from '@/types/history';

const loadOnce = () => false;

/** Carrega a lista e controla a avaliação (diálogo + mensagem de agradecimento) */
export function useHistory<T extends RideHistoryItem | DeliveryHistoryItem>(key: string, fetcher: () => Promise<T[]>) {
  const { data, error, setData } = usePolling(key, fetcher, loadOnce);
  const [rating, setRating] = useState<T | null>(null);
  const [thanks, setThanks] = useState(false);

  const onRated = (updated: T) => {
    setData((prev) => prev?.map((item) => (item.id === updated.id ? updated : item)) ?? prev);
    setRating(null);
    setThanks(true);
  };

  return { items: data, error, rating, startRating: setRating, cancelRating: () => setRating(null), onRated, thanks, closeThanks: () => setThanks(false) };
}
