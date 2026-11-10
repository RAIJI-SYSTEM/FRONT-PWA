import 'server-only';
import type { AppMode } from '@/types/message';

/** ?modo=motorista → "driver"; qualquer outro valor → "passenger" */
export const modeFromRequest = (request: Request): AppMode =>
  new URL(request.url).searchParams.get('modo') === 'motorista' ? 'driver' : 'passenger';
