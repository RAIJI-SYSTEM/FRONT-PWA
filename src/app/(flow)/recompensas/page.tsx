import FlowTopBar from '@/components/FlowTopBar';
import RewardsScreen from '@/features/rewards/components/RewardsScreen';

export default function RewardsPage() {
  return (
    <>
      <FlowTopBar title="Recompensas" backHref="/mais" />
      <RewardsScreen />
    </>
  );
}
