import { backend, toBrazilLocal } from './backend/client';
import type {
  CnpjPreviewApi,
  CompanyApi,
  CompanyDetailApi,
  CompanyInviteApi,
  CompanyMemberApi,
  FreightApi,
  FreightOfferApi,
  PackageSizeApi,
} from './backend/types';

/** Empresas (CNPJ conferido na Receita, vários gestores) e propostas de frete. */

export const previewCnpj = (cnpj: string) => backend<CnpjPreviewApi>(`/api/companies/cnpj/${encodeURIComponent(cnpj.replace(/\D/g, ''))}`);
export const registerCompany = (cnpj: string) => backend<CompanyApi>('/api/companies', { method: 'POST', body: { cnpj } });
export const listMyCompanies = () => backend<CompanyApi[]>('/api/companies/mine');
export const getCompany = (id: string) => backend<CompanyDetailApi>(`/api/companies/${id}`);
export const inviteMember = (id: string, email: string, name?: string) =>
  backend<CompanyMemberApi>(`/api/companies/${id}/members`, { method: 'POST', body: { email, name } });
export const removeMember = (id: string, memberId: string) => backend<void>(`/api/companies/${id}/members/${memberId}`, { method: 'DELETE' });
export const listMyInvites = () => backend<CompanyInviteApi[]>('/api/companies/invites');
export const acceptInvite = (memberId: string) => backend<CompanyApi>(`/api/companies/invites/${memberId}/accept`, { method: 'POST' });
export const declineInvite = (memberId: string) => backend<void>(`/api/companies/invites/${memberId}/decline`, { method: 'POST' });

export interface FreightPlaceInput {
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  address?: string;
}

export interface NewFreight {
  /** Proposta direta para este motorista; vazio = pedido público (motoristas se oferecem) */
  targetDriverSub?: string | null;
  offeredPrice?: number | null;
  origin: FreightPlaceInput;
  destination: FreightPlaceInput;
  desiredDate: Date;
  pkg: {
    size: PackageSizeApi;
    description: string;
    weightKg: number;
    fragile: boolean;
    declaredValue?: number | null;
    recipientName: string;
    recipientPhone: string;
  };
  notes?: string;
}

export const createFreight = (companyId: string, f: NewFreight) =>
  backend<FreightApi>(`/api/companies/${companyId}/freight-requests`, {
    method: 'POST',
    body: { ...f, desiredDate: toBrazilLocal(f.desiredDate) },
  });
export const listCompanyFreights = (companyId: string) => backend<FreightApi[]>(`/api/companies/${companyId}/freight-requests`);
export const getFreight = (id: string) => backend<FreightApi>(`/api/freight-requests/${id}`);
export const listFreightOffers = (id: string) => backend<FreightOfferApi[]>(`/api/freight-requests/${id}/offers`);
export const acceptFreightOffer = (id: string, offerId: string) =>
  backend<FreightApi>(`/api/freight-requests/${id}/offers/${offerId}/accept`, { method: 'POST' });
export const cancelFreight = (id: string) => backend<FreightApi>(`/api/freight-requests/${id}/cancel`, { method: 'POST' });

// Motorista
export const listFreightsForMe = () => backend<FreightApi[]>('/api/freight-requests/for-me');
export const listFreightsNearby = (lat: number, lng: number, radiusMeters = 30_000) =>
  backend<FreightApi[]>('/api/freight-requests/nearby', { query: { lat, lng, radiusMeters } });
export const acceptDirectFreight = (id: string, vehicleId: string) =>
  backend<FreightApi>(`/api/freight-requests/${id}/accept`, { method: 'POST', body: { vehicleId } });
export const declineDirectFreight = (id: string, reason?: string) =>
  backend<FreightApi>(`/api/freight-requests/${id}/decline`, { method: 'POST', body: { reason: reason ?? null } });
export const offerOnFreight = (id: string, price: number, vehicleId: string, message?: string) =>
  backend<FreightOfferApi>(`/api/freight-requests/${id}/offers`, { method: 'POST', body: { price, vehicleId, message } });
export const withdrawFreightOffer = (id: string, offerId: string) =>
  backend<void>(`/api/freight-requests/${id}/offers/${offerId}`, { method: 'DELETE' });
