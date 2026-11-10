'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { SEARCH_MODES, type SearchMode } from '../modes';

// Cada aba é carregada só quando aberta (a de código, por exemplo, nem usa mapa/cidades)
const TABS: Record<SearchMode, React.ComponentType> = {
  regiao: dynamic(() => import('./RegionTab')),
  codigo: dynamic(() => import('./CodeTab')),
  cidades: dynamic(() => import('./CitiesTab')),
};

/** Busca com três modos: motoristas na região, motorista por código e viagens entre cidades */
export default function SearchScreen({ initialMode }: { initialMode: SearchMode }) {
  const router = useRouter();
  const [mode, setMode] = useState<SearchMode>(initialMode);
  const ActiveTab = TABS[mode];

  const changeMode = (next: SearchMode) => {
    setMode(next);
    // Guarda o modo na URL (dá para compartilhar o link e o "voltar" funciona), sem pular a página
    router.replace(`/buscar?modo=${next}`, { scroll: false });
  };

  return (
    <Box>
      <Tabs
        value={mode}
        onChange={(_, value: SearchMode) => changeMode(value)}
        variant="fullWidth"
        aria-label="Tipo de busca"
        sx={{
          mb: 2.5,
          minHeight: 44,
          p: 0.5,
          borderRadius: 999,
          bgcolor: 'background.paper',
          border: 1,
          borderColor: 'divider',
          '& .MuiTabs-indicator': { height: '100%', borderRadius: 999, zIndex: 0 },
          '& .MuiTab-root': { minHeight: 36, zIndex: 1, textTransform: 'none', fontWeight: 600, borderRadius: 999, px: 1 },
          '& .MuiTab-root.Mui-selected': { color: 'primary.contrastText' },
        }}
      >
        {SEARCH_MODES.map(({ value, label }) => (
          <Tab key={value} value={value} label={label} id={`search-tab-${value}`} aria-controls={`search-panel-${value}`} />
        ))}
      </Tabs>

      <Box role="tabpanel" id={`search-panel-${mode}`} aria-labelledby={`search-tab-${mode}`}>
        <ActiveTab />
      </Box>
    </Box>
  );
}
