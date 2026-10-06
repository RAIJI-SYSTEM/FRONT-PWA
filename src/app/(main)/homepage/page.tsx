import Stack from '@mui/material/Stack';
import { ongoingActivitiesMock } from '@/features/activities/mocks';
import DestinationSearch from '@/features/home/components/DestinationSearch';
import OngoingActivities from '@/features/home/components/OngoingActivities';
import QuickActions from '@/features/home/components/QuickActions';

export default function HomePage() {
  // TODO: trocar o mock pela chamada à API (src/services)
  const activities = ongoingActivitiesMock;

  return (
    <Stack spacing={{ xs: 3, sm: 4 }}>
      <DestinationSearch />
      <QuickActions />
      <OngoingActivities activities={activities} />
    </Stack>
  );
}
