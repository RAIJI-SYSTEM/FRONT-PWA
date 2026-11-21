import FlowTopBar from '@/components/FlowTopBar';
import DriverGate from '@/features/driver/components/DriverGate';
import DriverPayoutsScreen from '@/features/payout/components/DriverPayoutsScreen';

export default function DriverPayoutsPage() {
  return (
    <>
      <FlowTopBar title="Repasses" backHref="/motorista/mais" />
      <DriverGate>
        <DriverPayoutsScreen />
      </DriverGate>
    </>
  );
}
