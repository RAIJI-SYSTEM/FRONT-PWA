import FlowTopBar from '@/components/FlowTopBar';
import DriverGate from '@/features/driver/components/DriverGate';
import NewRouteScreen from '@/features/driver/components/NewRouteScreen';

export default function NewRoutePage() {
  return (
    <>
      <FlowTopBar title="Publicar rota" backHref="/motorista/rotas" />
      <DriverGate>
        <NewRouteScreen />
      </DriverGate>
    </>
  );
}
