import FlowTopBar from '@/components/FlowTopBar';
import DriverOnboardingScreen from '@/features/driver/components/DriverOnboardingScreen';

export default function DriverOnboardingPage() {
  return (
    <>
      <FlowTopBar title="Quero ser motorista" backHref="/mais" />
      <DriverOnboardingScreen />
    </>
  );
}
