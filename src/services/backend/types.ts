/** Formatos das respostas do backend Raiji (valores em reais; datas de carona em hora de Brasília). */

export type RideType = 'PASSENGER' | 'CARGO' | 'MIXED';
export type RideStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
export type DeliveryStatusApi = 'PENDING' | 'CONFIRMED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
export type PackageSizeApi = 'ENVELOPE' | 'SMALL' | 'MEDIUM' | 'LARGE';
export type NotificationAudience = 'PASSENGER' | 'DRIVER' | 'COMPANY';

export interface CargoDetailsApi {
  maxWeightKg?: number | null;
  maxLengthCm?: number | null;
  maxWidthCm?: number | null;
  maxHeightCm?: number | null;
  observation?: string | null;
}

export interface RideApi {
  id: string;
  driverSub: string;
  driverName: string | null;
  vehicleId: string;
  type: RideType;
  originCity: string;
  originState: string;
  destinationCity: string;
  destinationState: string;
  departureDate: string;
  pricePerPassenger: number | null;
  platformFeePercent: number;
  platformFeePerPassenger: number | null;
  driverReceivesPerPassenger: number | null;
  totalSeats: number;
  availableSeats: number;
  status: RideStatus;
  cargoDetails: CargoDetailsApi | null;
  createdAt: string;
  originLatitude: number | null;
  originLongitude: number | null;
  originAddress: string | null;
  destinationLatitude: number | null;
  destinationLongitude: number | null;
  destinationAddress: string | null;
  meetingPoint: string | null;
  routeDistanceMeters: number | null;
  visibility: 'PUBLIC' | 'PRIVATE';
  bookingsClosed: boolean;
  startedAt: string | null;
  completedAt: string | null;
  pricePerPackage: number | null;
}

export interface RideSearchResultApi {
  ride: RideApi;
  pickupDistanceMeters: number;
  dropoffDistanceMeters: number | null;
  routeFraction: number;
  fullRoute: boolean;
  suggestedPrice: number | null;
  vehicle: string | null;
  suggestedPackagePrice: number | null;
}

export interface BaggageItemApi {
  type: 'mochila' | 'sacola' | 'mala' | 'caixa';
  quantity: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  weightKg?: number | null;
  description?: string | null;
}

export interface BookingApi {
  id: string;
  rideId: string;
  passengerSub: string;
  passengerName: string;
  status: BookingStatus;
  joinedAt: string;
  baggage: BaggageItemApi[];
  pendingBaggage: BaggageItemApi[];
  fullRoute: boolean;
  price: number | null;
  pickupAddress: string | null;
  dropoffAddress: string | null;
  confirmedAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
}

export interface MyBookingApi {
  booking: BookingApi;
  ride: RideApi;
}

export interface PriceBreakdownApi {
  price: number | null;
  platformFeePercent: number;
  platformFee: number | null;
  driverReceives: number | null;
}

export interface DeliveryApi {
  id: string;
  rideId: string;
  status: DeliveryStatusApi;
  senderSub: string;
  senderName: string | null;
  companyId: string | null;
  size: PackageSizeApi;
  description: string;
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  fragile: boolean;
  declaredValue: number | null;
  recipientName: string;
  recipientPhone: string;
  pickupAddress: string | null;
  dropoffAddress: string | null;
  fullRoute: boolean;
  price: number | null;
  platformFee: number | null;
  driverReceives: number | null;
  pickupCode: string | null;
  deliveryKeyword: string | null;
  requestedAt: string;
  confirmedAt: string | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  ride: {
    id: string;
    driverSub: string;
    driverName: string | null;
    originCity: string;
    originState: string;
    destinationCity: string;
    destinationState: string;
    departureDate: string;
    status: RideStatus;
    meetingPoint: string | null;
  } | null;
}

export interface NotificationApi {
  id: string;
  audience: NotificationAudience;
  kind: string | null;
  rideId: string | null;
  referenceId: string | null;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface UserMeApi {
  sub: string;
  email: string | null;
  fullName: string | null;
  userType: 'PF' | 'PJ' | null;
  passenger: boolean;
  driver: boolean;
  realmRoles: string[];
}

export interface VehicleApi {
  id: string;
  ownerSub: string;
  plate: string;
  type: string;
  model: string;
  color: string | null;
  year: number | null;
  passengerSeats: number | null;
  cargoVolumeLiters: number | null;
  active: boolean;
}

export interface DriverApplicationApi {
  id: string | null;
  status: 'NONE' | 'PROCESSING' | 'APPROVED' | 'REJECTED' | 'ERROR';
  reason: string | null;
  categoria: string | null;
  validade: string | null;
}

export type CompanyKind = 'MEI' | 'EMPRESA';
export type MemberRole = 'OWNER' | 'MEMBER';

export interface CompanyApi {
  id: string;
  cnpj: string;
  cnpjFormatted: string;
  legalName: string;
  tradeName: string | null;
  displayName: string;
  kind: CompanyKind;
  registrationStatus: string;
  mainActivity: string | null;
  city: string | null;
  state: string | null;
  myRole: MemberRole;
}

export interface CnpjPreviewApi {
  cnpj: string;
  cnpjFormatted: string;
  legalName: string | null;
  tradeName: string | null;
  kind: CompanyKind;
  registrationStatus: string | null;
  active: boolean;
  mainActivity: string | null;
  city: string | null;
  state: string | null;
  alreadyRegistered: boolean;
}

export interface CompanyMemberApi {
  id: string;
  email: string;
  displayName: string | null;
  role: MemberRole;
  status: 'INVITED' | 'ACTIVE' | 'REMOVED' | 'DECLINED';
  invitedAt: string | null;
  joinedAt: string | null;
  you: boolean;
}

export interface CompanyDetailApi {
  company: CompanyApi;
  members: CompanyMemberApi[];
}

export interface CompanyInviteApi {
  memberId: string;
  companyId: string;
  companyName: string;
  cnpjFormatted: string;
  kind: CompanyKind;
  invitedAt: string;
}

export type FreightStatus = 'OPEN' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
export type OfferStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'WITHDRAWN';

export interface FreightOfferApi {
  id: string;
  requestId: string;
  driverSub: string;
  driverName: string | null;
  vehicleId: string;
  price: number;
  message: string | null;
  status: OfferStatus;
  createdAt: string;
}

export interface FreightApi {
  id: string;
  companyId: string;
  companyName: string;
  direct: boolean;
  targetDriverSub: string | null;
  status: FreightStatus;
  originCity: string;
  originState: string;
  originAddress: string | null;
  destinationCity: string;
  destinationState: string;
  destinationAddress: string | null;
  desiredDate: string;
  size: PackageSizeApi;
  description: string;
  weightKg: number;
  fragile: boolean;
  declaredValue: number | null;
  recipientName: string | null;
  recipientPhone: string | null;
  offeredPrice: number | null;
  notes: string | null;
  pendingOffers: number;
  myOffer: FreightOfferApi | null;
  rideId: string | null;
  deliveryId: string | null;
  declineReason: string | null;
  createdAt: string;
  closedAt: string | null;
}

export interface AcceptAllApi {
  accepted: string[];
  skipped: { requestId: string; reason: string }[];
  availableSeats: number;
}
