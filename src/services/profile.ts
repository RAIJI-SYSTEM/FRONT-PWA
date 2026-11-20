import type { ContactApi, UserMeApi } from './backend/types';
import { backend } from './backend/client';

/** Tipo de conta (PF/PJ) e capacidades (passageiro, motorista) */
export const getMe = () => backend<UserMeApi>('/api/users/me');

/** Nome e e-mail (do login) + telefone e foto salvos no app */
export const getContact = () => backend<ContactApi>('/api/users/me/contact');

/** Telefone no formato E.164 (+5511912345678) */
export const updatePhone = (phone: string) => backend<ContactApi>('/api/users/me', { method: 'PATCH', body: { phone } });
