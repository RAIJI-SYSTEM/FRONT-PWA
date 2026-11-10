'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import Rating from '@mui/material/Rating';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { participantColor } from '@/features/messages/participantColor';
import type { RateDriverRequest } from '@/types/history';
import { MAX_RATING_COMMENT } from '@/utils/ratingTags';

const LABELS: Record<number, string> = { 1: 'Péssima', 2: 'Ruim', 3: 'Ok', 4: 'Boa', 5: 'Excelente' };

export interface RatingDialogProps {
  /** Quem está sendo avaliado */
  person: { id: string; name: string };
  title: string;
  subtitle: string;
  /** Etiquetas rápidas para a nota escolhida (elogios para 4–5, problemas para 1–3) */
  tagsFor: (stars: number) => string[];
  /** Envia a avaliação; se der erro, a mensagem aparece no diálogo */
  onSubmit: (rating: RateDriverRequest) => Promise<void>;
  onClose: () => void;
}

/**
 * Diálogo de avaliação: estrelas → etiquetas rápidas (mudam conforme a nota) → comentário opcional.
 * Usado pelo passageiro (avaliar motorista) e pelo motorista (avaliar passageiro).
 */
export default function RatingDialog({ person, title, subtitle, tagsFor, onSubmit, onClose }: RatingDialogProps) {
  const [stars, setStars] = useState<number | null>(null);
  const [hover, setHover] = useState(-1);
  const [tags, setTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const shown = hover > 0 ? hover : stars;
  const options = stars ? tagsFor(stars) : [];

  const changeStars = (value: number | null) => {
    // Elogios e problemas são listas diferentes: ao cruzar de 3 para 4 estrelas, limpa as etiquetas
    if (value && stars && value >= 4 !== stars >= 4) setTags([]);
    setStars(value);
  };

  const toggleTag = (tag: string) => setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));

  const submit = async () => {
    if (!stars) return;
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({ stars, tags, comment });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível enviar a avaliação.');
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs" aria-labelledby="rate-title">
      <Stack spacing={2.5} sx={{ p: 3, alignItems: 'center', textAlign: 'center' }}>
        <Avatar sx={{ width: 64, height: 64, bgcolor: participantColor(person.id), color: '#fff', fontWeight: 700, fontSize: '1.5rem' }}>
          {person.name.charAt(0)}
        </Avatar>
        <Stack spacing={0.5}>
          <Typography id="rate-title" variant="h6" sx={{ fontWeight: 700 }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        </Stack>

        <Stack spacing={0.5} sx={{ alignItems: 'center' }}>
          <Rating
            name="driver-rating"
            value={stars}
            onChange={(_, value) => changeStars(value)}
            onChangeActive={(_, value) => setHover(value)}
            size="large"
            getLabelText={(value) => `${value} estrela${value === 1 ? '' : 's'}, ${LABELS[value]}`}
            icon={<Star size={40} fill="currentColor" />}
            emptyIcon={<Star size={40} />}
            sx={{ color: 'primary.main', gap: 0.5 }}
          />
          <Typography sx={{ fontWeight: 700, minHeight: 24 }} aria-live="polite">
            {shown ? LABELS[shown] : 'Toque nas estrelas'}
          </Typography>
        </Stack>

        {stars && (
          <Stack spacing={1} sx={{ width: '100%' }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {stars >= 4 ? 'O que foi bom?' : 'O que pode melhorar?'}
            </Typography>
            <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
              {options.map((tag) => {
                const selected = tags.includes(tag);
                return (
                  <Chip
                    key={tag}
                    label={tag}
                    onClick={() => toggleTag(tag)}
                    aria-pressed={selected}
                    color={selected ? 'primary' : 'default'}
                    variant={selected ? 'filled' : 'outlined'}
                    sx={{ fontWeight: 600 }}
                  />
                );
              })}
            </Stack>
          </Stack>
        )}

        {stars && (
          <TextField
            fullWidth
            multiline
            minRows={2}
            label="Comentário (opcional)"
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, MAX_RATING_COMMENT))}
            helperText={`${comment.length}/${MAX_RATING_COMMENT}`}
            slotProps={{ formHelperText: { sx: { textAlign: 'right' } } }}
          />
        )}

        {error && (
          <Alert severity="error" sx={{ width: '100%', textAlign: 'left' }}>
            {error}
          </Alert>
        )}

        <Stack spacing={1} sx={{ width: '100%' }}>
          <Button
            variant="contained"
            disabled={!stars || submitting}
            onClick={submit}
            startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : undefined}
            sx={{ height: 52, borderRadius: 999, textTransform: 'none', fontWeight: 600, fontSize: '1rem' }}
          >
            Enviar avaliação
          </Button>
          <Button onClick={onClose} color="inherit" sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 600 }}>
            Agora não
          </Button>
        </Stack>
      </Stack>
    </Dialog>
  );
}
