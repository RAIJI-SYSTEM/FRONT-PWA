'use client';

import Stack from '@mui/material/Stack';
import FlowTopBar from '@/components/FlowTopBar';
import WithSearchParams from '@/components/WithSearchParams';
import NotificationSettings from '@/features/settings/components/NotificationSettings';
import SettingsSection from '@/features/settings/components/SettingsSection';
import ThemeSettings from '@/features/settings/components/ThemeSettings';

/** Configurações. Aberta pelo modo motorista com ?modo=motorista (as notificações são separadas por modo) */
export default function SettingsPage() {
  return (
    <WithSearchParams>
      {(params) => {
        const mode = params.get('modo') === 'motorista' ? 'driver' : 'passenger';
        return (
          <>
            <FlowTopBar title="Configurações" backHref={mode === 'driver' ? '/motorista/mais' : '/mais'} />
            <Stack spacing={4}>
              <SettingsSection id="aparencia" title="Aparência" description="Escolha como o app deve aparecer. A escolha fica salva neste aparelho.">
                <ThemeSettings />
              </SettingsSection>
              <SettingsSection
                id="notificacoes"
                title={mode === 'driver' ? 'Notificações do modo motorista' : 'Notificações'}
                description="Escolha sobre o que você quer ser avisado."
              >
                <NotificationSettings mode={mode} />
              </SettingsSection>
            </Stack>
          </>
        );
      }}
    </WithSearchParams>
  );
}
