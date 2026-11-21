import DriverGate from '@/features/driver/components/DriverGate';
import NewRouteScreen from '@/features/driver/components/NewRouteScreen';

/** A barra do topo fica na própria tela: o voltar muda conforme a etapa (mapa, saída, lugares, revisão) */
export default function NewRoutePage() {
  return (
    <DriverGate>
      <NewRouteScreen />
    </DriverGate>
  );
}
