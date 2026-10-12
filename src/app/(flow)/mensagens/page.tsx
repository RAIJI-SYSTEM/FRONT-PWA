import FlowTopBar from '@/components/FlowTopBar';
import InboxScreen from '@/features/messages/components/InboxScreen';

export default function MessagesPage() {
  return (
    <>
      <FlowTopBar title="Mensagens" backHref="/homepage" />
      <InboxScreen />
    </>
  );
}
