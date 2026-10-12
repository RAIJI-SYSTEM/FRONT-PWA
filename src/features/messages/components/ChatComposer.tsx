'use client';

import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { AlertCircle, Camera, FileText, Image as ImageIcon, Mic, Paperclip, SendHorizontal, Trash2, X } from 'lucide-react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { uploadFile } from '@/services/uploads';
import type { Attachment } from '@/types/message';
import {
  ACCEPT_DOCUMENTS,
  ACCEPT_IMAGES,
  attachmentTypeFor,
  fileExtension,
  formatDuration,
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENTS_PER_MESSAGE,
  MAX_VOICE_SECONDS,
} from '@/utils/attachments';
import { useVoiceRecorder, type VoiceRecording } from '../hooks/useVoiceRecorder';

export interface OutgoingMessage {
  text: string;
  attachments: Attachment[];
}

/** Arquivo escolhido, já subindo para o armazenamento enquanto o usuário escreve */
interface Draft {
  key: number;
  file: File;
  previewUrl?: string;
  status: 'uploading' | 'ready' | 'error';
  attachment?: Attachment;
}

interface ChatComposerProps {
  placeholder: string;
  quickReplies?: string[];
  onSend: (message: OutgoingMessage) => void;
}

const roundButton = {
  width: 46,
  height: 46,
  flexShrink: 0,
  bgcolor: 'primary.main',
  color: 'primary.contrastText',
  '&:hover': { bgcolor: 'primary.dark' },
  '&.Mui-disabled': { bgcolor: 'action.disabledBackground' },
};

let draftSeq = 0;

export default function ChatComposer({ placeholder, quickReplies, onSend }: ChatComposerProps) {
  const [text, setText] = useState('');
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [sendingVoice, setSendingVoice] = useState(false);
  const imageInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const documentInput = useRef<HTMLInputElement>(null);

  const sendVoice = async (recording: VoiceRecording | null) => {
    if (!recording) return;
    setSendingVoice(true);
    try {
      const attachment = await uploadFile(recording.file, { durationSeconds: recording.durationSeconds });
      onSend({ text: '', attachments: [attachment] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível enviar o áudio.');
    } finally {
      setSendingVoice(false);
    }
  };

  const recorder = useVoiceRecorder({ onLimitReached: sendVoice });
  const recording = recorder.state === 'recording';
  const shownError = error ?? recorder.error;

  // Libera as prévias locais das imagens ao sair da tela
  const draftsRef = useRef(drafts);
  useEffect(() => {
    draftsRef.current = drafts;
  });
  useEffect(() => () => draftsRef.current.forEach((d) => d.previewUrl && URL.revokeObjectURL(d.previewUrl)), []);

  const updateDraft = (key: number, changes: Partial<Draft>) =>
    setDrafts((prev) => prev.map((d) => (d.key === key ? { ...d, ...changes } : d)));

  const addFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = ''; // permite escolher o mesmo arquivo de novo
    setError(null);

    const room = MAX_ATTACHMENTS_PER_MESSAGE - drafts.length;
    if (files.length > room) setError(`Envie no máximo ${MAX_ATTACHMENTS_PER_MESSAGE} arquivos por mensagem.`);

    for (const file of files.slice(0, Math.max(room, 0))) {
      const type = attachmentTypeFor(file.type);
      if (!type) {
        setError(`"${file.name}" não é um tipo de arquivo aceito.`);
        continue;
      }
      if (file.size > MAX_ATTACHMENT_BYTES) {
        setError(`"${file.name}" é maior que 10 MB.`);
        continue;
      }
      // Já começa a enviar enquanto o usuário escreve a legenda
      const draft: Draft = {
        key: ++draftSeq,
        file,
        previewUrl: type === 'image' ? URL.createObjectURL(file) : undefined,
        status: 'uploading',
      };
      setDrafts((prev) => [...prev, draft]);
      uploadFile(file)
        .then((attachment) => updateDraft(draft.key, { status: 'ready', attachment }))
        .catch(() => updateDraft(draft.key, { status: 'error' }));
    }
  };

  const removeDraft = (draft: Draft) => {
    if (draft.previewUrl) URL.revokeObjectURL(draft.previewUrl);
    setDrafts((prev) => prev.filter((d) => d.key !== draft.key));
  };

  const uploading = drafts.some((d) => d.status === 'uploading');
  const ready = drafts.filter((d) => d.status === 'ready' && d.attachment).map((d) => d.attachment!);
  const canSend = !uploading && (text.trim().length > 0 || ready.length > 0);
  const showMic = !text.trim() && drafts.length === 0;

  const send = () => {
    if (!canSend) return;
    onSend({ text: text.trim(), attachments: ready });
    setText('');
    drafts.forEach((d) => d.previewUrl && URL.revokeObjectURL(d.previewUrl));
    setDrafts([]);
    setError(null);
  };

  // Enter envia; Shift+Enter quebra a linha
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      send();
    }
  };

  const openPicker = (input: HTMLInputElement | null) => {
    setMenuAnchor(null);
    input?.click();
  };

  return (
    <Box>
      {shownError && (
        <Alert
          severity="error"
          sx={{ mb: 1 }}
          onClose={() => {
            setError(null);
            recorder.clearError();
          }}
        >
          {shownError}
        </Alert>
      )}

      {quickReplies && !recording && drafts.length === 0 && (
        <Stack
          direction="row"
          spacing={1}
          sx={{ overflowX: 'auto', pb: 1.25, scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}
          aria-label="Respostas rápidas"
        >
          {quickReplies.map((reply) => (
            <Chip
              key={reply}
              label={reply}
              variant="outlined"
              onClick={() => onSend({ text: reply, attachments: [] })}
              sx={{ flexShrink: 0, fontWeight: 600 }}
            />
          ))}
        </Stack>
      )}

      {/* Prévia dos anexos escolhidos */}
      {drafts.length > 0 && (
        <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 1.25 }} aria-label="Anexos a enviar">
          {drafts.map((draft) => (
            <Box
              key={draft.key}
              sx={{
                position: 'relative',
                flexShrink: 0,
                width: 72,
                height: 72,
                borderRadius: 2,
                overflow: 'hidden',
                border: 1,
                borderColor: draft.status === 'error' ? 'error.main' : 'divider',
                bgcolor: 'background.paper',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              {draft.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- prévia local (blob:) do arquivo escolhido
                <img src={draft.previewUrl} alt={draft.file.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <Stack sx={{ alignItems: 'center', px: 0.5, color: 'text.secondary' }}>
                  <FileText size={22} />
                  <Typography variant="caption" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                    {fileExtension(draft.file.name).slice(0, 4)}
                  </Typography>
                </Stack>
              )}
              {draft.status !== 'ready' && (
                <Box
                  sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', bgcolor: 'rgba(0 0 0 / 0.45)', color: '#fff' }}
                  aria-label={draft.status === 'uploading' ? 'Enviando arquivo' : 'Falha no envio'}
                >
                  {draft.status === 'uploading' ? <CircularProgress size={22} color="inherit" /> : <AlertCircle size={22} />}
                </Box>
              )}
              <IconButton
                size="small"
                onClick={() => removeDraft(draft)}
                aria-label={`Remover ${draft.file.name}`}
                sx={{ position: 'absolute', top: 2, right: 2, p: 0.25, bgcolor: 'rgba(0 0 0 / 0.6)', color: '#fff', '&:hover': { bgcolor: 'rgba(0 0 0 / 0.8)' } }}
              >
                <X size={14} />
              </IconButton>
            </Box>
          ))}
        </Stack>
      )}

      {recording ? (
        // Barra de gravação: cancelar · cronômetro · enviar
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <IconButton onClick={() => recorder.cancel()} aria-label="Cancelar gravação" sx={{ width: 46, height: 46, color: 'error.main' }}>
            <Trash2 size={22} />
          </IconButton>
          <Stack
            direction="row"
            spacing={1.25}
            role="status"
            aria-live="polite"
            sx={{ flex: 1, alignItems: 'center', px: 2, height: 46, borderRadius: 3, border: 1, borderColor: 'divider', bgcolor: 'background.paper' }}
          >
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                bgcolor: 'error.main',
                '@keyframes rec': { '50%': { opacity: 0.3 } },
                animation: 'rec 1s infinite',
                '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
              }}
            />
            <Typography sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{formatDuration(recorder.elapsed)}</Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              Gravando… (máx. {formatDuration(MAX_VOICE_SECONDS)})
            </Typography>
          </Stack>
          <IconButton onClick={async () => sendVoice(await recorder.stop())} aria-label="Enviar mensagem de voz" sx={roundButton}>
            <SendHorizontal size={20} />
          </IconButton>
        </Stack>
      ) : (
        <Stack
          component="form"
          direction="row"
          spacing={1}
          sx={{ alignItems: 'flex-end' }}
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <IconButton
            onClick={(e) => setMenuAnchor(e.currentTarget)}
            aria-label="Anexar arquivo"
            aria-haspopup="menu"
            aria-expanded={Boolean(menuAnchor)}
            disabled={drafts.length >= MAX_ATTACHMENTS_PER_MESSAGE}
            sx={{ width: 46, height: 46, flexShrink: 0 }}
          >
            <Paperclip size={22} />
          </IconButton>
          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={() => setMenuAnchor(null)}
            anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
            transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          >
            <MenuItem onClick={() => openPicker(imageInput.current)}>
              <ListItemIcon>
                <ImageIcon size={20} />
              </ListItemIcon>
              Foto ou imagem
            </MenuItem>
            <MenuItem onClick={() => openPicker(cameraInput.current)}>
              <ListItemIcon>
                <Camera size={20} />
              </ListItemIcon>
              Câmera
            </MenuItem>
            <MenuItem onClick={() => openPicker(documentInput.current)}>
              <ListItemIcon>
                <FileText size={20} />
              </ListItemIcon>
              Documento
            </MenuItem>
          </Menu>
          <input ref={imageInput} type="file" accept={ACCEPT_IMAGES} multiple hidden onChange={addFiles} />
          {/* capture abre direto a câmera traseira no celular */}
          <input ref={cameraInput} type="file" accept="image/*" capture="environment" hidden onChange={addFiles} />
          <input ref={documentInput} type="file" accept={ACCEPT_DOCUMENTS} multiple hidden onChange={addFiles} />

          <TextField
            fullWidth
            multiline
            maxRows={4}
            size="small"
            placeholder={drafts.length > 0 ? 'Adicione uma legenda (opcional)' : placeholder}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            slotProps={{ htmlInput: { 'aria-label': 'Escreva uma mensagem', maxLength: 1000 } }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, py: 1.25 } }}
          />

          {showMic ? (
            <IconButton onClick={recorder.start} disabled={sendingVoice} aria-label="Gravar mensagem de voz" sx={roundButton}>
              {sendingVoice ? <CircularProgress size={20} color="inherit" /> : <Mic size={20} />}
            </IconButton>
          ) : (
            <IconButton type="submit" disabled={!canSend} aria-label={uploading ? 'Aguardando envio dos anexos' : 'Enviar mensagem'} sx={roundButton}>
              {uploading ? <CircularProgress size={20} color="inherit" /> : <SendHorizontal size={20} />}
            </IconButton>
          )}
        </Stack>
      )}
    </Box>
  );
}
