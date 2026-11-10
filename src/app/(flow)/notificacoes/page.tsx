import FlowTopBar from '@/components/FlowTopBar';
import NotificationsScreen from '@/features/notifications/components/NotificationsScreen';

export default function NotificationsPage() {
  return (
    <>
      <FlowTopBar title="Notificações" backHref="/homepage" />
      <NotificationsScreen mode="passenger" />
    </>
  );
}
