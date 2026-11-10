import type { HistoryKind } from '@/types/history';

/**
 * Etiquetas rápidas da avaliação. Elogios aparecem para 4–5 estrelas; problemas, para 1–3.
 * Usadas na tela e validadas no servidor (o servidor só aceita etiquetas desta lista).
 */
export const RATING_TAGS: Record<HistoryKind, { praise: string[]; issues: string[] }> = {
  rides: {
    praise: ['Pontual', 'Educado', 'Direção segura', 'Carro limpo', 'Boa conversa', 'Rota eficiente'],
    issues: ['Atrasou', 'Direção perigosa', 'Rota ruim', 'Carro sujo', 'Falta de educação', 'Cobrança indevida'],
  },
  deliveries: {
    praise: ['Pontual', 'Cuidado com o pacote', 'Boa comunicação', 'Educado'],
    issues: ['Atrasou', 'Pacote danificado', 'Sem comunicação', 'Entregou no lugar errado'],
  },
};

export const MAX_RATING_COMMENT = 300;

export const tagsFor = (kind: HistoryKind, stars: number) =>
  stars >= 4 ? RATING_TAGS[kind].praise : RATING_TAGS[kind].issues;

/** Etiquetas quando o motorista avalia o passageiro/remetente */
export const CUSTOMER_RATING_TAGS = {
  praise: ['Pontual', 'Educado', 'Respeitoso', 'Pacote bem embalado', 'Boa comunicação'],
  issues: ['Atrasou', 'Desrespeitoso', 'Sujou o veículo', 'Pacote mal embalado', 'Endereço errado'],
};

export const customerTagsFor = (stars: number) => (stars >= 4 ? CUSTOMER_RATING_TAGS.praise : CUSTOMER_RATING_TAGS.issues);
