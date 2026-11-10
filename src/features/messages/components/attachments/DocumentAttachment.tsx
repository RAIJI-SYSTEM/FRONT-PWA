import { Download } from 'lucide-react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import type { Attachment } from '@/types/message';
import { fileExtension, formatBytes } from '@/utils/attachments';
import { apiUrl } from '@/services/api';

/** Card do documento: tipo, nome, tamanho e download */
export default function DocumentAttachment({ attachment, mine }: { attachment: Attachment; mine: boolean }) {
  return (
    <ButtonBase
      component="a"
      href={apiUrl(attachment.url)}
      download={attachment.name}
      aria-label={`Baixar ${attachment.name} (${formatBytes(attachment.sizeBytes)})`}
      sx={{
        width: '100%',
        minWidth: { xs: 220, sm: 260 },
        justifyContent: 'flex-start',
        gap: 1.5,
        p: 1.25,
        borderRadius: 2,
        textAlign: 'left',
        bgcolor: mine ? 'rgba(255 255 255 / 0.18)' : 'action.hover',
      }}
    >
      <Box
        sx={{
          width: 42,
          height: 48,
          flexShrink: 0,
          borderRadius: 1.5,
          display: 'grid',
          placeItems: 'center',
          bgcolor: mine ? 'rgba(255 255 255 / 0.9)' : 'primary.main',
          color: mine ? 'primary.main' : 'primary.contrastText',
          fontSize: '0.625rem',
          fontWeight: 800,
        }}
      >
        {fileExtension(attachment.name).slice(0, 4)}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
          {attachment.name}
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.8 }}>
          {formatBytes(attachment.sizeBytes)}
        </Typography>
      </Box>
      <Download size={18} style={{ flexShrink: 0 }} />
    </ButtonBase>
  );
}
