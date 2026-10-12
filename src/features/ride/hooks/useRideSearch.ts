'use client';

import { usePolling } from '@/hooks/usePolling';
import { getRideSearch } from '@/services/rideSearch';
import type { RideSearch } from '@/types/ride';

const isSearching = (search: RideSearch) => search.status === 'searching';

/** Acompanha a busca de viagem enquanto os motoristas não respondem */
export function useRideSearch(id: string) {
  const { data, error, setData } = usePolling(id, getRideSearch, isSearching);
  return { search: data, error, setSearch: setData };
}
