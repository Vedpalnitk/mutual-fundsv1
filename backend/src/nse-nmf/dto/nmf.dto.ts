import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsNotEmpty,
  IsDateString,
  IsArray,
  MaxLength,
  MinLength,
  Min,
  Matches,
} from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { ValidationPipe } from '@nestjs/common'

/**
 * Pipe override for NSE pass-through DTOs (UCC, FATCA, eKYC, reports, callbacks).
 * These endpoints forward additional NSE-specific fields beyond what we explicitly
 * validate, so we disable whitelist stripping / forbidNonWhitelisted.
 * The decorated fields are still validated; extra fields just pass through.
 */
export const NsePassthroughPipe = new ValidationPipe({
  whitelist: false,
  transform: true,
  forbidNonWhitelisted: false,
})

// ─── Credentials ────────────────────────────────────────────────────────────

export class SetCredentialsDto {
  @ApiProperty({ description: 'NSE member ID' })
  @IsString()
  @IsNotEmpty()
  memberId: string

  @ApiProperty({ description: 'NSE login user ID' })
  @IsString()
  @IsNotEmpty()
  loginUserId: string

  @ApiProperty({ description: 'NSE API secret' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  apiSecret: string

  @ApiProperty({ description: 'NSE member license key' })
  @IsString()
  @IsNotEmpty()
  memberLicenseKey: string

  @ApiPropertyOptional({ description: 'IP addresses whitelisted with NSE', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  ipWhitelist?: string[]
}

// ─── Client Registration (UCC) ─────────────────────────────────────────────

export class RegisterUccDto {
  @ApiPropertyOptional({ description: 'NSE client code (defaults to PAN)' })
  @IsString()
  @IsOptional()
  client_code?: string

  @ApiPropertyOptional({ description: 'Tax status code' })
  @IsString()
  @IsOptional()
  tax_status?: string

  @ApiPropertyOptional({ description: 'Holding nature (SI/JO/AS)' })
  @IsString()
  @IsOptional()
  holding_nature?: string

  @ApiPropertyOptional({ description: 'Occupation code' })
  @IsString()
  @IsOptional()
  occupation_code?: string

  @ApiPropertyOptional({ description: 'First name' })
  @IsString()
  @IsOptional()
  first_name?: string

  @ApiPropertyOptional({ description: 'Last name' })
  @IsString()
  @IsOptional()
  last_name?: string

  @ApiPropertyOptional({ description: 'Date of birth (DD/MM/YYYY)' })
  @IsString()
  @IsOptional()
  dob?: string

  @ApiPropertyOptional({ description: 'Gender (M/F/T)' })
  @IsString()
  @IsOptional()
  gender?: string

  @ApiPropertyOptional({ description: 'PAN number' })
  @IsString()
  @IsOptional()
  @MaxLength(10)
  pan?: string

  @ApiPropertyOptional({ description: 'Email address' })
  @IsString()
  @IsOptional()
  email?: string

  @ApiPropertyOptional({ description: 'Mobile number' })
  @IsString()
  @IsOptional()
  mobile?: string

  @ApiPropertyOptional({ description: 'Address line 1' })
  @IsString()
  @IsOptional()
  address1?: string

  @ApiPropertyOptional({ description: 'Address line 2' })
  @IsString()
  @IsOptional()
  address2?: string

  @ApiPropertyOptional({ description: 'City' })
  @IsString()
  @IsOptional()
  city?: string

  @ApiPropertyOptional({ description: 'State' })
  @IsString()
  @IsOptional()
  state?: string

  @ApiPropertyOptional({ description: 'Pincode' })
  @IsString()
  @IsOptional()
  pincode?: string

  @ApiPropertyOptional({ description: 'Country' })
  @IsString()
  @IsOptional()
  country?: string

  @ApiPropertyOptional({ description: 'Bank account number' })
  @IsString()
  @IsOptional()
  bank_account_no?: string

  @ApiPropertyOptional({ description: 'Bank IFSC code' })
  @IsString()
  @IsOptional()
  bank_ifsc?: string

  @ApiPropertyOptional({ description: 'Bank name' })
  @IsString()
  @IsOptional()
  bank_name?: string

  @ApiPropertyOptional({ description: 'Account type (SB/CA)' })
  @IsString()
  @IsOptional()
  account_type?: string

  @ApiPropertyOptional({ description: 'Nominee name' })
  @IsString()
  @IsOptional()
  nominee_name?: string

  @ApiPropertyOptional({ description: 'Nominee relation' })
  @IsString()
  @IsOptional()
  nominee_relation?: string

  @ApiPropertyOptional({ description: 'Second holder name' })
  @IsString()
  @IsOptional()
  second_holder_name?: string

  @ApiPropertyOptional({ description: 'Second holder PAN' })
  @IsString()
  @IsOptional()
  second_holder_pan?: string

  @ApiPropertyOptional({ description: 'Third holder name' })
  @IsString()
  @IsOptional()
  third_holder_name?: string

  @ApiPropertyOptional({ description: 'Third holder PAN' })
  @IsString()
  @IsOptional()
  third_holder_pan?: string

  // NOTE: UCC has ~183 fields. Use NsePassthroughPipe on the controller endpoint
  // to allow additional NSE-specific fields to pass through without stripping.
}

// ─── FATCA ──────────────────────────────────────────────────────────────────

export class SubmitFatcaDto {
  @ApiPropertyOptional({ description: 'Country of birth' })
  @IsString()
  @IsOptional()
  birth_country?: string

  @ApiPropertyOptional({ description: 'Country of citizenship' })
  @IsString()
  @IsOptional()
  citizenship_country?: string

  @ApiPropertyOptional({ description: 'Country of nationality' })
  @IsString()
  @IsOptional()
  nationality_country?: string

  @ApiPropertyOptional({ description: 'Country of tax residency' })
  @IsString()
  @IsOptional()
  tax_country?: string

  @ApiPropertyOptional({ description: 'Tax identification number' })
  @IsString()
  @IsOptional()
  tax_id_number?: string

  @ApiPropertyOptional({ description: 'Source of wealth (01=Salary, 02=Business, etc.)' })
  @IsString()
  @IsOptional()
  source_of_wealth?: string

  @ApiPropertyOptional({ description: 'Annual income range code' })
  @IsString()
  @IsOptional()
  annual_income?: string

  @ApiPropertyOptional({ description: 'Net worth amount' })
  @IsString()
  @IsOptional()
  net_worth?: string

  @ApiPropertyOptional({ description: 'Net worth date (DD/MM/YYYY)' })
  @IsString()
  @IsOptional()
  net_worth_date?: string

  @ApiPropertyOptional({ description: 'Politically Exposed Person (Y/N/R)' })
  @IsString()
  @IsOptional()
  pep?: string

  @ApiPropertyOptional({ description: 'Occupation code' })
  @IsString()
  @IsOptional()
  occupation_code?: string

  @ApiPropertyOptional({ description: 'Occupation type' })
  @IsString()
  @IsOptional()
  occupation_type?: string

  // NOTE: FATCA may include additional NSE fields. Use NsePassthroughPipe.
}

// ─── FATCA Corporate ────────────────────────────────────────────────────────

export class SubmitFatcaCorporateDto {
  @ApiPropertyOptional({ description: 'Entity name' })
  @IsString()
  @IsOptional()
  entity_name?: string

  @ApiPropertyOptional({ description: 'Entity type (corporate/partnership/trust/etc.)' })
  @IsString()
  @IsOptional()
  entity_type?: string

  @ApiPropertyOptional({ description: 'Country of incorporation' })
  @IsString()
  @IsOptional()
  incorporation_country?: string

  @ApiPropertyOptional({ description: 'Country of tax residency' })
  @IsString()
  @IsOptional()
  tax_country?: string

  @ApiPropertyOptional({ description: 'Tax identification number' })
  @IsString()
  @IsOptional()
  tax_id_number?: string

  @ApiPropertyOptional({ description: 'GIIN (for FATCA reporting)' })
  @IsString()
  @IsOptional()
  giin?: string

  @ApiPropertyOptional({ description: 'Source of wealth (01=Business Income, etc.)' })
  @IsString()
  @IsOptional()
  source_of_wealth?: string

  @ApiPropertyOptional({ description: 'Net worth amount' })
  @IsString()
  @IsOptional()
  net_worth?: string

  @ApiPropertyOptional({ description: 'Net worth date (DD/MM/YYYY)' })
  @IsString()
  @IsOptional()
  net_worth_date?: string

  // NOTE: FATCA Corporate may include additional NSE fields. Use NsePassthroughPipe.
}

// ─── Client Bank Detail ─────────────────────────────────────────────────────

export class AddBankDetailDto {
  @ApiProperty({ description: 'Bank account number' })
  @IsString()
  @IsNotEmpty()
  account_no: string

  @ApiProperty({ description: 'Bank IFSC code' })
  @IsString()
  @IsNotEmpty()
  ifsc_code: string

  @ApiPropertyOptional({ description: 'Bank name' })
  @IsString()
  @IsOptional()
  bank_name?: string

  @ApiPropertyOptional({ description: 'Account type (SB/CA/CC/NRE/NRO)' })
  @IsString()
  @IsOptional()
  account_type?: string

  @ApiPropertyOptional({ description: 'Set as default bank (Y/N)' })
  @IsString()
  @IsOptional()
  default_flag?: string

  // NOTE: Bank detail may include additional NSE fields. Use NsePassthroughPipe.
}

export class DeleteBankDetailDto {
  @ApiProperty({ description: 'Bank account number to delete' })
  @IsString()
  @IsNotEmpty()
  account_no: string

  @ApiProperty({ description: 'Bank IFSC code' })
  @IsString()
  @IsNotEmpty()
  ifsc_code: string
}

// ─── eKYC ───────────────────────────────────────────────────────────────────

export class InitiateEkycDto {
  @ApiPropertyOptional({ description: 'PAN number for eKYC' })
  @IsString()
  @IsOptional()
  @MaxLength(10)
  pan?: string

  @ApiPropertyOptional({ description: 'Name as per KYC records' })
  @IsString()
  @IsOptional()
  name?: string

  @ApiPropertyOptional({ description: 'Email for eKYC communication' })
  @IsString()
  @IsOptional()
  email?: string

  @ApiPropertyOptional({ description: 'Mobile number for OTP' })
  @IsString()
  @IsOptional()
  mobile?: string

  // NOTE: eKYC may include additional NSE fields. Use NsePassthroughPipe.
}

// ─── Mandates ───────────────────────────────────────────────────────────────

export enum NseMandateType {
  ENACH = 'ENACH',
  PHYSICAL = 'PHYSICAL',
}

export class RegisterMandateDto {
  @ApiProperty({ description: 'Client ID (FAClient)' })
  @IsString()
  @IsNotEmpty()
  clientId: string

  @ApiProperty({ enum: NseMandateType, description: 'Mandate type' })
  @IsEnum(NseMandateType)
  mandateType: NseMandateType

  @ApiProperty({ description: 'Mandate amount', example: 50000 })
  @IsNumber()
  @Min(1)
  amount: number

  @ApiProperty({ description: 'Bank account number' })
  @IsString()
  @IsNotEmpty()
  accountNo: string

  @ApiProperty({ description: 'Bank IFSC code' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, { message: 'Invalid IFSC code format' })
  ifscCode: string

  @ApiPropertyOptional({ description: 'Bank name' })
  @IsString()
  @IsOptional()
  bankName?: string

  @ApiPropertyOptional({ description: 'Mandate start date (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  startDate?: string

  @ApiPropertyOptional({ description: 'Mandate end date (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  endDate?: string
}

// ─── Orders ─────────────────────────────────────────────────────────────────

export class PlacePurchaseOrderDto {
  @ApiProperty({ description: 'Client ID (FAClient)' })
  @IsString()
  @IsNotEmpty()
  clientId: string

  @ApiProperty({ description: 'NSE scheme code' })
  @IsString()
  @IsNotEmpty()
  schemeCode: string

  @ApiPropertyOptional({ description: 'Scheme name for display' })
  @IsString()
  @IsOptional()
  schemeName?: string

  @ApiProperty({ description: 'Purchase amount', example: 10000 })
  @IsNumber()
  @Min(1)
  amount: number

  @ApiPropertyOptional({ description: 'Existing folio number' })
  @IsString()
  @IsOptional()
  folioNumber?: string

  @ApiPropertyOptional({ description: 'Demat or physical (P/D)', default: 'P' })
  @IsString()
  @IsOptional()
  dematPhysical?: string

  @ApiPropertyOptional({ description: 'Mandate ID for payment' })
  @IsString()
  @IsOptional()
  mandateId?: string

  @ApiPropertyOptional({ description: 'Link to FATransaction record' })
  @IsString()
  @IsOptional()
  transactionId?: string
}

export class PlaceRedemptionDto {
  @ApiProperty({ description: 'Client ID (FAClient)' })
  @IsString()
  @IsNotEmpty()
  clientId: string

  @ApiProperty({ description: 'NSE scheme code' })
  @IsString()
  @IsNotEmpty()
  schemeCode: string

  @ApiPropertyOptional({ description: 'Scheme name for display' })
  @IsString()
  @IsOptional()
  schemeName?: string

  @ApiPropertyOptional({ description: 'Redemption amount (provide amount or units)' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  amount?: number

  @ApiPropertyOptional({ description: 'Redemption units (provide amount or units)' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  units?: number

  @ApiPropertyOptional({ description: 'Existing folio number' })
  @IsString()
  @IsOptional()
  folioNumber?: string

  @ApiPropertyOptional({ description: 'Link to FATransaction record' })
  @IsString()
  @IsOptional()
  transactionId?: string
}

export class PlaceSwitchOrderDto {
  @ApiProperty({ description: 'Client ID (FAClient)' })
  @IsString()
  @IsNotEmpty()
  clientId: string

  @ApiProperty({ description: 'Source scheme code' })
  @IsString()
  @IsNotEmpty()
  fromSchemeCode: string

  @ApiProperty({ description: 'Target scheme code' })
  @IsString()
  @IsNotEmpty()
  toSchemeCode: string

  @ApiPropertyOptional({ description: 'Source scheme name' })
  @IsString()
  @IsOptional()
  fromSchemeName?: string

  @ApiPropertyOptional({ description: 'Target scheme name' })
  @IsString()
  @IsOptional()
  toSchemeName?: string

  @ApiPropertyOptional({ description: 'Switch amount (provide amount or units)' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  amount?: number

  @ApiPropertyOptional({ description: 'Switch units (provide amount or units)' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  units?: number

  @ApiPropertyOptional({ description: 'Existing folio number' })
  @IsString()
  @IsOptional()
  folioNumber?: string

  @ApiPropertyOptional({ description: 'Link to FATransaction record' })
  @IsString()
  @IsOptional()
  transactionId?: string
}

// ─── Payments ───────────────────────────────────────────────────────────────

export enum NsePaymentMode {
  MANDATE = 'MANDATE',
  CHEQUE = 'CHEQUE',
  UPI = 'UPI',
  NETBANKING = 'NETBANKING',
  RTGS = 'RTGS',
  NEFT = 'NEFT',
}

export class InitiatePaymentDto {
  @ApiProperty({ enum: NsePaymentMode, description: 'Payment mode' })
  @IsEnum(NsePaymentMode)
  paymentMode: NsePaymentMode

  @ApiPropertyOptional({ description: 'Bank code for netbanking/NEFT/RTGS' })
  @IsString()
  @IsOptional()
  bankCode?: string

  @ApiPropertyOptional({ description: 'UPI VPA (e.g. user@upi)' })
  @IsString()
  @IsOptional()
  vpa?: string

  @ApiPropertyOptional({ description: 'UTR number for RTGS/NEFT' })
  @IsString()
  @IsOptional()
  utrNo?: string

  @ApiPropertyOptional({ description: 'Cheque number' })
  @IsString()
  @IsOptional()
  chequeNo?: string

  @ApiPropertyOptional({ description: 'Cheque date (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  chequeDate?: string

  @ApiPropertyOptional({ description: 'Mandate ID for mandate-based payment' })
  @IsString()
  @IsOptional()
  mandateId?: string
}

export class CheckUpiStatusDto {
  @ApiProperty({ description: 'Order ID to check UPI status for' })
  @IsString()
  @IsNotEmpty()
  orderId: string

  @ApiProperty({ description: 'UPI VPA used for the payment' })
  @IsString()
  @IsNotEmpty()
  vpa: string
}

export class PaymentCallbackDto {
  @ApiPropertyOptional({ description: 'NSE order ID' })
  @IsString()
  @IsOptional()
  order_id?: string

  @ApiPropertyOptional({ description: 'NSE transaction order ID' })
  @IsString()
  @IsOptional()
  trxn_order_id?: string

  @ApiPropertyOptional({ description: 'Payment status' })
  @IsString()
  @IsOptional()
  status?: string

  @ApiPropertyOptional({ description: 'Transaction reference' })
  @IsString()
  @IsOptional()
  transaction_ref?: string

  // NOTE: Callbacks may include additional NSE fields. Use NsePassthroughPipe.
}

// ─── Systematic Plans ───────────────────────────────────────────────────────

export class RegisterSipDto {
  @ApiProperty({ description: 'Client ID (FAClient)' })
  @IsString()
  @IsNotEmpty()
  clientId: string

  @ApiProperty({ description: 'NSE scheme code' })
  @IsString()
  @IsNotEmpty()
  schemeCode: string

  @ApiPropertyOptional({ description: 'Scheme name for display' })
  @IsString()
  @IsOptional()
  schemeName?: string

  @ApiProperty({ description: 'SIP installment amount', example: 5000 })
  @IsNumber()
  @Min(100)
  amount: number

  @ApiProperty({ description: 'Frequency type (MONTHLY/QUARTERLY/WEEKLY/DAILY)' })
  @IsString()
  @IsNotEmpty()
  frequencyType: string

  @ApiProperty({ description: 'SIP start date (YYYY-MM-DD)' })
  @IsDateString()
  startDate: string

  @ApiPropertyOptional({ description: 'SIP end date (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  endDate?: string

  @ApiPropertyOptional({ description: 'Number of installments' })
  @IsNumber()
  @Min(1)
  @IsOptional()
  installments?: number

  @ApiPropertyOptional({ description: 'Existing folio number' })
  @IsString()
  @IsOptional()
  folioNumber?: string

  @ApiPropertyOptional({ description: 'Link to existing FASIP record' })
  @IsString()
  @IsOptional()
  sipId?: string
}

export class RegisterXsipDto {
  @ApiProperty({ description: 'Client ID (FAClient)' })
  @IsString()
  @IsNotEmpty()
  clientId: string

  @ApiProperty({ description: 'NSE scheme code' })
  @IsString()
  @IsNotEmpty()
  schemeCode: string

  @ApiPropertyOptional({ description: 'Scheme name for display' })
  @IsString()
  @IsOptional()
  schemeName?: string

  @ApiProperty({ description: 'XSIP installment amount', example: 5000 })
  @IsNumber()
  @Min(100)
  amount: number

  @ApiProperty({ description: 'Frequency type (MONTHLY/QUARTERLY/WEEKLY/DAILY)' })
  @IsString()
  @IsNotEmpty()
  frequencyType: string

  @ApiProperty({ description: 'XSIP start date (YYYY-MM-DD)' })
  @IsDateString()
  startDate: string

  @ApiPropertyOptional({ description: 'XSIP end date (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  endDate?: string

  @ApiPropertyOptional({ description: 'Number of installments' })
  @IsNumber()
  @Min(1)
  @IsOptional()
  installments?: number

  @ApiProperty({ description: 'Mandate ID for XSIP debit' })
  @IsString()
  @IsNotEmpty()
  mandateId: string

  @ApiPropertyOptional({ description: 'Annual step-up amount' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  stepUpAmount?: number

  @ApiPropertyOptional({ description: 'Annual step-up percentage' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  stepUpPercent?: number

  @ApiPropertyOptional({ description: 'Existing folio number' })
  @IsString()
  @IsOptional()
  folioNumber?: string

  @ApiPropertyOptional({ description: 'Link to existing FASIP record' })
  @IsString()
  @IsOptional()
  sipId?: string
}

export class RegisterStpDto {
  @ApiProperty({ description: 'Client ID (FAClient)' })
  @IsString()
  @IsNotEmpty()
  clientId: string

  @ApiProperty({ description: 'Source scheme code' })
  @IsString()
  @IsNotEmpty()
  fromSchemeCode: string

  @ApiProperty({ description: 'Target scheme code' })
  @IsString()
  @IsNotEmpty()
  toSchemeCode: string

  @ApiPropertyOptional({ description: 'Source scheme name' })
  @IsString()
  @IsOptional()
  fromSchemeName?: string

  @ApiPropertyOptional({ description: 'Target scheme name' })
  @IsString()
  @IsOptional()
  toSchemeName?: string

  @ApiProperty({ description: 'STP installment amount', example: 5000 })
  @IsNumber()
  @Min(100)
  amount: number

  @ApiProperty({ description: 'Frequency type (MONTHLY/QUARTERLY/WEEKLY/DAILY)' })
  @IsString()
  @IsNotEmpty()
  frequencyType: string

  @ApiProperty({ description: 'STP start date (YYYY-MM-DD)' })
  @IsDateString()
  startDate: string

  @ApiPropertyOptional({ description: 'STP end date (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  endDate?: string

  @ApiPropertyOptional({ description: 'Number of installments' })
  @IsNumber()
  @Min(1)
  @IsOptional()
  installments?: number

  @ApiPropertyOptional({ description: 'Existing folio number' })
  @IsString()
  @IsOptional()
  folioNumber?: string

  @ApiPropertyOptional({ description: 'Link to existing FASIP record' })
  @IsString()
  @IsOptional()
  sipId?: string
}

export class RegisterSwpDto {
  @ApiProperty({ description: 'Client ID (FAClient)' })
  @IsString()
  @IsNotEmpty()
  clientId: string

  @ApiProperty({ description: 'NSE scheme code' })
  @IsString()
  @IsNotEmpty()
  schemeCode: string

  @ApiPropertyOptional({ description: 'Scheme name for display' })
  @IsString()
  @IsOptional()
  schemeName?: string

  @ApiProperty({ description: 'SWP installment amount', example: 5000 })
  @IsNumber()
  @Min(100)
  amount: number

  @ApiProperty({ description: 'Frequency type (MONTHLY/QUARTERLY/WEEKLY/DAILY)' })
  @IsString()
  @IsNotEmpty()
  frequencyType: string

  @ApiProperty({ description: 'SWP start date (YYYY-MM-DD)' })
  @IsDateString()
  startDate: string

  @ApiPropertyOptional({ description: 'SWP end date (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  endDate?: string

  @ApiPropertyOptional({ description: 'Number of installments' })
  @IsNumber()
  @Min(1)
  @IsOptional()
  installments?: number

  @ApiPropertyOptional({ description: 'Existing folio number' })
  @IsString()
  @IsOptional()
  folioNumber?: string

  @ApiPropertyOptional({ description: 'Link to existing FASIP record' })
  @IsString()
  @IsOptional()
  sipId?: string
}

// ─── SIP Topup ─────────────────────────────────────────────────────────

export class RegisterSipTopupDto {
  @ApiProperty({ description: 'Client ID (FAClient)' })
  @IsString()
  @IsNotEmpty()
  clientId: string

  @ApiProperty({ description: 'Existing SIP registration ID to top up' })
  @IsString()
  @IsNotEmpty()
  sipRegId: string

  @ApiProperty({ description: 'NSE scheme code' })
  @IsString()
  @IsNotEmpty()
  schemeCode: string

  @ApiPropertyOptional({ description: 'Scheme name for display' })
  @IsString()
  @IsOptional()
  schemeName?: string

  @ApiProperty({ description: 'Topup amount', example: 2000 })
  @IsNumber()
  @Min(100)
  amount: number

  @ApiProperty({ description: 'Frequency type (MONTHLY/QUARTERLY/WEEKLY/DAILY)' })
  @IsString()
  @IsNotEmpty()
  frequencyType: string

  @ApiProperty({ description: 'Topup start date (YYYY-MM-DD)' })
  @IsDateString()
  startDate: string

  @ApiPropertyOptional({ description: 'Topup end date (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  endDate?: string

  @ApiPropertyOptional({ description: 'Number of installments' })
  @IsNumber()
  @Min(1)
  @IsOptional()
  installments?: number

  @ApiPropertyOptional({ description: 'Existing folio number' })
  @IsString()
  @IsOptional()
  folioNumber?: string
}

// ─── Reports ────────────────────────────────────────────────────────────────

export class ReportQueryDto {
  @ApiPropertyOptional({ description: 'Report from date (YYYY-MM-DD or DD/MM/YYYY)' })
  @IsString()
  @IsOptional()
  from_date?: string

  @ApiPropertyOptional({ description: 'Report to date (YYYY-MM-DD or DD/MM/YYYY)' })
  @IsString()
  @IsOptional()
  to_date?: string

  @ApiPropertyOptional({ description: 'Client code filter' })
  @IsString()
  @IsOptional()
  client_code?: string

  @ApiPropertyOptional({ description: 'Scheme code filter' })
  @IsString()
  @IsOptional()
  scheme_code?: string

  @ApiPropertyOptional({ description: 'Order ID filter' })
  @IsString()
  @IsOptional()
  order_id?: string

  @ApiPropertyOptional({ description: 'SIP/XSIP registration ID filter' })
  @IsString()
  @IsOptional()
  reg_id?: string

  @ApiPropertyOptional({ description: 'Mandate ID filter' })
  @IsString()
  @IsOptional()
  mandate_id?: string

  @ApiPropertyOptional({ description: 'Transaction type filter' })
  @IsString()
  @IsOptional()
  trxn_type?: string

  @ApiPropertyOptional({ description: 'Order status filter' })
  @IsString()
  @IsOptional()
  status?: string

  @ApiPropertyOptional({ description: 'Folio number filter' })
  @IsString()
  @IsOptional()
  folio_no?: string

  @ApiPropertyOptional({ description: 'PAN filter' })
  @IsString()
  @IsOptional()
  pan?: string

  // NOTE: Reports may accept additional NSE-specific filter params. Use NsePassthroughPipe.
}

// ─── Uploads ────────────────────────────────────────────────────────────────

export class UploadFileDto {
  @ApiProperty({ description: 'NSE client code' })
  @IsString()
  @IsNotEmpty()
  clientCode: string

  @ApiProperty({ description: 'Base64-encoded file data' })
  @IsString()
  @IsNotEmpty()
  fileData: string

  @ApiProperty({ description: 'Original file name with extension', example: 'aof_scan.jpg' })
  @IsString()
  @IsNotEmpty()
  fileName: string
}

// ─── Utilities ──────────────────────────────────────────────────────────────

export class UtrUpdateDto {
  @ApiProperty({ description: 'NSE order ID to link UTR to' })
  @IsString()
  @IsNotEmpty()
  orderId: string

  @ApiProperty({ description: 'UTR number from bank transfer' })
  @IsString()
  @IsNotEmpty()
  utrNo: string
}

export class SipUmrnDto {
  @ApiProperty({ description: 'SIP registration ID to map' })
  @IsString()
  @IsNotEmpty()
  sipRegId: string

  @ApiProperty({ description: 'Mandate ID (UMRN) to link' })
  @IsString()
  @IsNotEmpty()
  mandateId: string
}

export class ShortUrlDto {
  @ApiPropertyOptional({ description: 'Order ID for payment URL' })
  @IsString()
  @IsOptional()
  orderId?: string

  @ApiPropertyOptional({ description: 'Registration ID for auth URL' })
  @IsString()
  @IsOptional()
  regId?: string
}

export class KycCheckDto {
  @ApiProperty({ description: 'PAN number to check KYC status' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z]{5}[0-9]{4}[A-Z]$/, { message: 'Invalid PAN format (expected ABCDE1234F)' })
  @MaxLength(10)
  pan: string
}

export class ResendCommDto {
  @ApiPropertyOptional({ description: 'Order ID to resend communication for' })
  @IsString()
  @IsOptional()
  orderId?: string

  @ApiPropertyOptional({ description: 'Registration ID to resend communication for' })
  @IsString()
  @IsOptional()
  regId?: string
}
