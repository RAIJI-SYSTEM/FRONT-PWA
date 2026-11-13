'use client';

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ActionBar from '@/components/ActionBar';
import type { RideOffer } from '@/types/ride';
import OfferCard from './OfferCard';

interface OfferListProps {
  offers: RideOffer[];
  onContinue: (offer: RideOffer) => void;
  /** Ex.: ['motorista', 'motoristas'] ou ['opção de entrega', 'opções de entrega'] */
  noun?: [singular: string, plural: string];
  /** Texto do botão (padrão: "Pedir vaga") */
  actionLabel?: string;
}

/** "Escolher o melhor trajeto": as ofertas já vêm ordenadas por preço */
export default function OfferList({ offers, onContinue, noun = ['carona', 'caronas'], actionLabel = 'Pedir vaga' }: OfferListProps) {
  const [selectedId, setSelectedId] = useState(offers[0]?.id);
  const selected = offers.find((offer) => offer.id === selectedId);
  const fastestId = offers.reduce((a, b) => (b.etaMinutes < a.etaMinutes ? b : a), offers[0])?.id;

  return (
    <Stack spacing={2}>
      <Box>
        <Typography component="h2" variant="h6" sx={{ fontWeight: 700 }}>
          {offers.length === 1 ? `1 ${noun[0]} disponível` : `${offers.length} ${noun[1]} disponíveis`}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Motoristas que já vão fazer esse caminho. O preço é do motorista.
        </Typography>
      </Box>

      <Stack spacing={1.5} role="radiogroup" aria-label={`${noun[1]} disponíveis`}>
        {offers.map((offer, index) => (
          <OfferCard
            key={offer.id}
            offer={offer}
            selected={offer.id === selectedId}
            onSelect={() => setSelectedId(offer.id)}
            highlight={index === 0 ? 'Mais barato' : offer.id === fastestId ? 'Mais rápido' : undefined}
          />
        ))}
      </Stack>

      <ActionBar>
        <Button
          fullWidth
          variant="contained"
          disabled={!selected}
          onClick={() => selected && onContinue(selected)}
          endIcon={<ArrowRight size={20} />}
          sx={{ height: 56, borderRadius: 999, fontSize: '1rem', fontWeight: 600, textTransform: 'none', boxShadow: 3 }}
        >
          {actionLabel}
        </Button>
      </ActionBar>
    </Stack>
  );
}
