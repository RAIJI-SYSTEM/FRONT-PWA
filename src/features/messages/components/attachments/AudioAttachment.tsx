'use client';

import { useRef, useState } from 'react';
import { Mic, Pause, Play } from 'lucide-react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import IconButton from '@mui/material/IconButton';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { Attachment } from '@/types/message';
import { formatDuration } from '@/utils/attachments';

const SPEEDS = [1, 1.5, 2];

/** Player de mensagem de voz: play/pause, posição (arrastável e acessível pelo teclado) e velocidade */
export default function AudioAttachment({ attachment, mine }: { attachment: Attachment; mine: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  // Áudios gravados no navegador (webm) costumam não informar a duração: usamos a enviada junto
  const [duration, setDuration] = useState(attachment.durationSeconds ?? 0);
  const [speedIndex, setSpeedIndex] = useState(0);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) audio.play().catch(() => setPlaying(false));
    else audio.pause();
  };

  const changeSpeed = () => {
    const next = (speedIndex + 1) % SPEEDS.length;
    setSpeedIndex(next);
    if (audioRef.current) audioRef.current.playbackRate = SPEEDS[next];
  };

  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: { xs: 220, sm: 260 } }}>
      <audio
        ref={audioRef}
        src={attachment.url}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setCurrent(0);
        }}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => Number.isFinite(e.currentTarget.duration) && setDuration(e.currentTarget.duration)}
      />

      <IconButton
        onClick={toggle}
        aria-label={playing ? 'Pausar mensagem de voz' : 'Ouvir mensagem de voz'}
        sx={{
          width: 40,
          height: 40,
          flexShrink: 0,
          bgcolor: mine ? 'rgba(255 255 255 / 0.25)' : 'primary.main',
          color: mine ? 'inherit' : 'primary.contrastText',
          '&:hover': { bgcolor: mine ? 'rgba(255 255 255 / 0.35)' : 'primary.dark' },
        }}
      >
        {playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
      </IconButton>

      <Box sx={{ flex: 1, minWidth: 0, px: 0.5 }}>
        <Slider
          size="small"
          value={Math.min(current, duration || 0)}
          max={duration || 1}
          step={0.1}
          onChange={(_, value) => {
            const audio = audioRef.current;
            if (audio) audio.currentTime = value as number;
            setCurrent(value as number);
          }}
          aria-label="Posição da mensagem de voz"
          getAriaValueText={(value) => formatDuration(value)}
          sx={{ color: mine ? 'inherit' : 'primary.main', py: 1 }}
        />
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mt: -0.75 }}>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', opacity: 0.8 }}>
            <Mic size={12} />
            <Typography variant="caption">{formatDuration(playing || current > 0 ? current : duration)}</Typography>
          </Stack>
          <ButtonBase
            onClick={changeSpeed}
            aria-label={`Velocidade ${SPEEDS[speedIndex]}x. Alterar velocidade`}
            sx={{ px: 0.75, borderRadius: 999, typography: 'caption', fontWeight: 700, bgcolor: 'rgba(127 127 127 / 0.2)' }}
          >
            {String(SPEEDS[speedIndex]).replace('.', ',')}×
          </ButtonBase>
        </Stack>
      </Box>
    </Stack>
  );
}
