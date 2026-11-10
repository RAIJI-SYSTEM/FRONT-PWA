import FlowTopBar from '@/components/FlowTopBar';
import InboxScreen from '@/features/messages/components/InboxScreen';

/** Mensagens do modo motorista: passageiros, grupos de passageiros e empresas */
export default function DriverMessagesPage() {
  return (
    <>
      <FlowTopBar title="Mensagens" backHref="/motorista" />
      <InboxScreen mode="driver" />
    </>
  );
}
