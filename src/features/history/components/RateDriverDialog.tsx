'use client';

import RatingDialog from '@/components/RatingDialog';
import { rateDriver } from '@/services/history';
import type { DeliveryHistoryItem, HistoryDriver, HistoryKind, RideHistoryItem } from '@/types/history';
import { tagsFor } from '@/utils/ratingTags';

export interface RateDriverDialogProps<T extends RideHistoryItem | DeliveryHistoryItem> {
  kind: HistoryKind;
  item: T;
  driver: HistoryDriver;
  onClose: () => void;
  onRated: (updated: T) => void;
}

/** Passageiro/remetente avalia o motorista de uma corrida ou encomenda */
export default function RateDriverDialog<T extends RideHistoryItem | DeliveryHistoryItem>({
  kind,
  item,
  driver,
  onClose,
  onRated,
}: RateDriverDialogProps<T>) {
  return (
    <RatingDialog
      person={driver}
      title={`Como foi ${kind === 'rides' ? 'sua corrida' : 'sua entrega'} com ${driver.name.split(' ')[0]}?`}
      subtitle="Sua avaliação ajuda a manter a qualidade dos motoristas."
      tagsFor={(stars) => tagsFor(kind, stars)}
      onSubmit={async (rating) => onRated(await rateDriver<T>(kind, item.id, rating))}
      onClose={onClose}
    />
  );
}
