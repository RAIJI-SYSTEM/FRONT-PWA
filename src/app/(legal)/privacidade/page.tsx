import FlowTopBar from '@/components/FlowTopBar';
import LegalDocument from '@/features/legal/LegalDocument';
import { PRIVACY } from '@/features/legal/privacy';

export default function PrivacyPage() {
  return (
    <>
      <FlowTopBar title="Privacidade" />
      <LegalDocument document={PRIVACY} />
    </>
  );
}
