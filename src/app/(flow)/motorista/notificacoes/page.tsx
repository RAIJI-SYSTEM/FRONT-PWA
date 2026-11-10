import FlowTopBar from '@/components/FlowTopBar';
import NotificationsScreen from '@/features/notifications/components/NotificationsScreen';

/** Notificações do modo motorista: pedidos na região, reservas, ganhos e documentos */
export default function DriverNotificationsPage() {
  return (
    <>
      <FlowTopBar title="Notificações" backHref="/motorista" />
      <NotificationsScreen mode="driver" />
    </>
  );
}
