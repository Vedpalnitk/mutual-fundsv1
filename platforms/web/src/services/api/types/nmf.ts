/**
 * NSE NMF (MFSS) Type Definitions
 *
 * Derived from backend DTOs and Prisma models in backend/src/nse-nmf/.
 * Replaces `any` in nmfApi methods with real types for type safety.
 */

// ============= Credentials =============

export interface NmfCredentialStatus {
  isConfigured: boolean
  memberId?: string
  loginUserId?: string
  ipWhitelist?: string
  isActive?: boolean
  lastTestedAt?: string | null
  testStatus?: string | null
  message?: string
}

export interface NmfCredentialSetRequest {
  memberId: string
  loginUserId: string
  apiSecret: string
  memberLicenseKey: string
  ipWhitelist?: string
}

// ============= UCC (Client Registration) =============

export type NmfUccStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED'

export interface NmfUccRegistration {
  id: string
  clientId: string
  advisorId: string
  clientCode: string | null
  status: NmfUccStatus
  fatcaStatus: string | null
  ekycStatus: string | null
  taxStatus: string | null
  holdingNature: string | null
  occupationCode: string | null
  nseResponseCode: string | null
  nseResponseMsg: string | null
  ekycLink: string | null
  createdAt: string
  updatedAt: string
}

// ============= Mandates =============

export type NmfMandateType = 'ENACH' | 'PHYSICAL'
export type NmfMandateStatus = 'CREATED' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED'

export interface NmfMandate {
  id: string
  clientId: string
  advisorId: string
  nseMandateId: string | null
  mandateType: NmfMandateType
  status: NmfMandateStatus
  amount: number
  accountNo: string | null
  ifscCode: string | null
  bankName: string | null
  startDate: string | null
  endDate: string | null
  umrn: string | null
  authUrl: string | null
  nseResponseCode: string | null
  nseResponseMsg: string | null
  createdAt: string
  updatedAt: string
}

export interface NmfMandateRegisterResponse {
  success: boolean
  mandateId: string
  mandate_id?: string
  status?: string
  remark?: string
}

// ============= Orders =============

export type NmfOrderType = 'PURCHASE' | 'REDEMPTION' | 'SWITCH'
export type NmfOrderStatus =
  | 'CREATED' | 'SUBMITTED' | 'ACCEPTED' | 'REJECTED'
  | 'PAYMENT_PENDING' | 'PAYMENT_SUCCESS' | 'PAYMENT_FAILED'
  | 'ALLOTTED' | 'CANCELLED'

export interface NmfOrder {
  id: string
  clientId: string
  advisorId: string
  transactionId: string | null
  mandateId: string | null
  orderType: NmfOrderType
  status: NmfOrderStatus
  nseOrderId: string | null
  schemeCode: string | null
  schemeName: string | null
  amount: number | null
  units: number | null
  nav: number | null
  allottedUnits: number | null
  allottedNav: number | null
  allottedAmount: number | null
  folioNumber: string | null
  dematPhysical: string | null
  switchSchemeCode: string | null
  switchSchemeName: string | null
  nseResponseCode: string | null
  nseResponseMsg: string | null
  submittedAt: string | null
  allottedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface NmfOrderPlaceResponse {
  success: boolean
  orderId: string
  order_id?: string
  status?: string
  remark?: string
}

export interface NmfOrderListResponse {
  data: NmfOrder[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// ============= Payments =============

export type NmfPaymentMode = 'MANDATE' | 'CHEQUE' | 'UPI' | 'NETBANKING' | 'RTGS' | 'NEFT'
export type NmfPaymentStatus = 'INITIATED' | 'REDIRECTED' | 'SUCCESS' | 'FAILED'

export interface NmfPayment {
  id: string
  orderId: string
  paymentMode: NmfPaymentMode
  status: NmfPaymentStatus
  amount: number
  bankCode: string | null
  vpa: string | null
  utrNo: string | null
  chequeNo: string | null
  chequeDate: string | null
  callbackUrl: string | null
  transactionRef: string | null
  nseResponseCode: string | null
  nseResponseMsg: string | null
  paidAt: string | null
  createdAt: string
  updatedAt: string
}

export interface NmfPaymentInitResponse {
  success: boolean
  paymentId: string
  transaction_ref?: string
  status?: string
  remark?: string
}

// ============= Scheme Master =============

export interface NmfScheme {
  id: string
  schemeCode: string
  isin: string | null
  schemeName: string
  amcCode: string | null
  purchaseAllowed: boolean
  redemptionAllowed: boolean
  sipAllowed: boolean
  stpAllowed: boolean
  swpAllowed: boolean
  switchAllowed: boolean
  minPurchaseAmt: number | null
  minSipAmt: number | null
  lastSyncedAt: string | null
}

export interface NmfSchemeSearchResponse {
  data: NmfScheme[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// ============= Systematic Registrations =============

export type NmfSystematicType = 'SIP' | 'XSIP' | 'STP' | 'SWP'
export type NmfSystematicStatus =
  | 'CREATED' | 'SUBMITTED' | 'APPROVED' | 'REJECTED'
  | 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'COMPLETED'

export interface NmfSystematicRegistration {
  id: string
  clientId: string
  advisorId: string
  sipId: string | null
  mandateId: string | null
  type: NmfSystematicType
  status: NmfSystematicStatus
  nseRegistrationId: string | null
  schemeCode: string | null
  schemeName: string | null
  amount: number | null
  frequencyType: string | null
  startDate: string | null
  endDate: string | null
  installments: number | null
  stepUpAmount: number | null
  stepUpPercent: number | null
  switchSchemeCode: string | null
  switchSchemeName: string | null
  folioNumber: string | null
  nseResponseCode: string | null
  nseResponseMsg: string | null
  createdAt: string
  updatedAt: string
}

// ============= UPI Status =============

export interface NmfUpiStatusResponse {
  orderId: string
  vpa: string
  status: string
  remark?: string
}

// ============= Child Orders =============

export interface NmfChildOrder {
  id: string
  parentOrderId: string
  installmentNo: number
  amount: number | null
  units: number | null
  nav: number | null
  status: string
  orderDate: string | null
  createdAt: string
}
