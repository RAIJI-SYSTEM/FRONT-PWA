import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import type { Attachment } from '@/types/message';
import AudioAttachment from './AudioAttachment';
import DocumentAttachment from './DocumentAttachment';
import ImageAttachment from './ImageAttachment';

/** Anexos dentro do balão: fotos em grade, depois documentos e áudios */
export default function MessageAttachments({ attachments, mine }: { attachments: Attachment[]; mine: boolean }) {
  const images = attachments.filter((a) => a.type === 'image');
  const others = attachments.filter((a) => a.type !== 'image');

  return (
    <Stack spacing={0.75}>
      {images.length > 0 && (
        <Box
          sx={{
            display: 'grid',
            gap: 0.5,
            gridTemplateColumns: images.length > 1 ? 'repeat(2, 1fr)' : '1fr',
            width: { xs: 220, sm: 260 },
          }}
        >
          {images.map((image) => (
            <ImageAttachment key={image.id} attachment={image} />
          ))}
        </Box>
      )}
      {others.map((attachment) =>
        attachment.type === 'audio' ? (
          <AudioAttachment key={attachment.id} attachment={attachment} mine={mine} />
        ) : (
          <DocumentAttachment key={attachment.id} attachment={attachment} mine={mine} />
        ),
      )}
    </Stack>
  );
}
