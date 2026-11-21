import FlowTopBar from '@/components/FlowTopBar';
import AdminPayoutsScreen from '@/features/payout/components/AdminPayoutsScreen';

export default function AdminPayoutsPage() {
  return (
    <>
      <FlowTopBar title="Repasses aos motoristas" backHref="/mais" />
      <AdminPayoutsScreen />
    </>
  );
}
