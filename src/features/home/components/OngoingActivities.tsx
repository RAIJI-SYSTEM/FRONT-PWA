'use client';

import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Carousel from '@/components/Carousel';
import ActivityCard from '@/features/activities/components/ActivityCard';
import type { Activity } from '@/types/activity';

const MAX_ITEMS = 3;

interface OngoingActivitiesProps {
  activities: Activity[];
}

export default function OngoingActivities({ activities }: OngoingActivitiesProps) {
  const items = activities.slice(0, MAX_ITEMS);

  return (
    <Box component="section" aria-labelledby="ongoing-title">
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography id="ongoing-title" variant="h6" component="h2" sx={{ fontWeight: 600 }}>
          Acontecendo agora
        </Typography>
        <Button component={Link} href="/historico" size="small" endIcon={<ChevronRight size={16} />}>
          Ver histórico
        </Button>
      </Stack>

      {items.length > 0 ? (
        <Carousel aria-label="Viagens e encomendas em andamento">
          {items.map((activity) => (
            <ActivityCard key={`${activity.kind}-${activity.id}`} activity={activity} />
          ))}
        </Carousel>
      ) : (
        <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
          Nenhuma viagem ou encomenda em andamento.
        </Typography>
      )}
    </Box>
  );
}
