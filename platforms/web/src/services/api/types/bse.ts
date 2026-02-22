/**
 * BSE StAR MF Type Definitions
 *
 * Derived from backend DTOs and Prisma models in backend/src/bse-star-mf/.
 * Replaces `any` in bseApi methods with real types for type safety.
 */

// ============= Credentials =============

export interface BseCredentialStatus {
  isConfigured: boolean
  memberId?: string
  userIdBse?: string
  arn?: string
  euin?: string
  isActive?: boolean
  lastTestedAt?: string | null
  testStatus?: string | null
  message?: string
}

export interface BseCredentialSetRequest {
  memberId: string
  userIdBse: string
  password: string
  arn: string
  euin?: string
  passKey: string
}

// ============= UCC (Client Registration) =============

export type BseUccStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED'

export interface BseUccRegistration {
  id: string
  clientId: string
  advisorId: string
  clientCode: string | null
  status: BseUccStatus
  fatcaStatus: string | null
  ckycStatus: string | null
  taxStatus: string | null
  holdingNature: string | null
  occupationCode: string | null
  bseResponseCode: string | null
  bseResponseMsg: string | null
  createdAt: string
  updatedAt: string
}

export interface BseUccRegisterRequest {
  transType?: 'NEW' | 'MOD'
  taxStatus: string
  holdingNature?: string
  occupationCode?: string
  secondHolderPan?: string
  thirdHolderPan?: string
  guardianPan?: string
  nomineeName?: string
  nomineeRelation?: string
  communicationMode?: string
  dividendPayMode?: string
}

// ============= Mandates =============

export type BseMandateType = 'XSIP' | 'ISIP' | 'NET_BANKING'
export type BseMandateStatus = 'CREATED' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED' | 'SHIFTED'

export interface BseMandate {
  id: string
  clientId: string
  advisorId: string
  mandateId: string | null
  mandateType: BseMandateType
  status: BseMandateStatus
  amount: number
  bankAccountId: string | null
  bankCode: string | null
  startDate: string | null
  endDate: string | null
  umrn: string | null
  authUrl: string | null
  bseResponseCode: string | null
  bseResponseMsg: string | null
  createdAt: string
  updatedAt: string
}

export interface BseMandateRegisterResponse {
  id: string
  mandateId: string | null
  mandateType: BseMandateType
  status: BseMandateStatus
  amount: number
  responseCode: string
  message: string
}

// ============= Orders =============

export type BseOrderType = 'PURCHASE' | 'REDEMPTION' | 'SIP' | 'XSIP' | 'SWITCH' | 'STP' | 'SWP'
export type BseOrderStatus =
  | 'CREATED' | 'SUBMITTED' | 'ACCEPTED' | 'REJECTED'
  | 'PAYMENT_PENDING' | 'PAYMENT_SUCCESS' | 'PAYMENT_FAILED'
  | 'ALLOTTED' | 'CANCELLED' | 'FAILED'

export interface BseOrder {
  id: string
  clientId: string
  advisorId: string
  transactionId: string | null
  sipId: string | null
  mandateId: string | null
  orderType: BseOrderType
  status: BseOrderStatus
  bseOrderNumber: string | null
  bseRegistrationNo: string | null
  transCode: string
  schemeCode: string | null
  schemeName: string | null
  buySell: string
  buySellType: string
  amount: number | null
  units: number | null
  nav: number | null
  allottedUnits: number | null
  allottedNav: number | null
  allottedAmount: number | null
  dpTxnMode: string | null
  folioNumber: string | null
  frequency: string | null
  sipStartDate: string | null
  sipEndDate: string | null
  installments: number | null
  firstOrderFlag: string | null
  switchSchemeCode: string | null
  switchSchemeName: string | null
  bseResponseCode: string | null
  bseResponseMsg: string | null
  submittedAt: string | null
  allottedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface BseOrderPlaceResponse {
  id: string
  bseOrderNumber: string | null
  referenceNumber: string
  status: BseOrderStatus
  responseCode: string
  message: string
}

export interface BseOrderListResponse {
  data: BseOrder[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// ============= Payments =============

export type BsePaymentMode = 'DIRECT' | 'NODAL' | 'NEFT' | 'UPI'
export type BsePaymentStatus = 'INITIATED' | 'REDIRECTED' | 'SUCCESS' | 'FAILED'

export interface BsePayment {
  id: string
  orderId: string
  paymentMode: BsePaymentMode
  status: BsePaymentStatus
  amount: number
  bankCode: string | null
  redirectUrl: string | null
  transactionRef: string | null
  bseResponseCode: string | null
  bseResponseMsg: string | null
  paidAt: string | null
  createdAt: string
  updatedAt: string
}

export interface BsePaymentInitResponse {
  id: string
  orderId: string
  status: BsePaymentStatus
  redirectUrl: string | null
  transactionRef: string | null
  responseCode: string
  message: string
}

// ============= Scheme Master =============

export interface BseScheme {
  id: string
  schemeCode: string
  rtaSchemeCode: string | null
  isin: string | null
  amcCode: string | null
  schemeName: string
  schemeType: string | null
  schemePlan: string | null
  schemeOption: string | null
  purchaseAllowed: boolean
  redemptionAllowed: boolean
  sipAllowed: boolean
  stpAllowed: boolean
  swpAllowed: boolean
  switchAllowed: boolean
  minPurchaseAmt: number | null
  maxPurchaseAmt: number | null
  purchaseMultiple: number | null
  minRedemptionAmt: number | null
  minSipAmt: number | null
  lastSyncedAt: string | null
}

export interface BseSchemeSearchResponse {
  data: BseScheme[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// ============= Banks =============

export interface BseBankMaster {
  bankCode: string
  bankName: string
}

// ============= Child Orders =============

export interface BseChildOrder {
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
