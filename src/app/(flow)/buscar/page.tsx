'use client';

import FlowTopBar from '@/components/FlowTopBar';
import WithSearchParams from '@/components/WithSearchParams';
import SearchScreen from '@/features/search/components/SearchScreen';
import { isSearchMode } from '@/features/search/modes';

export default function SearchPage() {
  return (
    <>
      <FlowTopBar title="Buscar" backHref="/homepage" />
      <WithSearchParams>
        {(params) => {
          const mode = params.get('modo') ?? undefined;
          return <SearchScreen initialMode={isSearchMode(mode) ? mode : 'regiao'} />;
        }}
      </WithSearchParams>
    </>
  );
}
