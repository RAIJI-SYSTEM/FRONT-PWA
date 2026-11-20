import FlowTopBar from '@/components/FlowTopBar';
import LegalDocument from '@/features/legal/LegalDocument';
import { TERMS } from '@/features/legal/terms';

export default function TermsPage() {
  return (
    <>
      <FlowTopBar title="Termos de uso" />
      <LegalDocument document={TERMS} />
    </>
  );
}
