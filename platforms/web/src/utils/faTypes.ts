/**
 * FA Portal TypeScript Types & Interfaces
 *
 * Central type definitions for the Financial Advisor portal.
 * Import with: import { Client, Transaction, etc } from '@/utils/faTypes'
 */

// ============================================================
// Client Management
// ============================================================

export type RiskProfile = 'Conservative' | 'Moderate' | 'Aggressive'
export type FamilyRole = 'SELF' | 'SPOUSE' | 'CHILD' | 'PARENT' | 'SIBLING'

export interface Client {
  id: string
  name: string
  email: string
  phone: string
  pan?: string
  dateOfBirth?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  aum: number
  returns: number
  riskProfile: RiskProfile
  lastActive: string
  sipCount: number
  goalsCount: number
  joinedDate: string
  status: 'Active' | 'Inactive' | 'Pending KYC'
  kycStatus?: 'Verified' | 'Pending' | 'Expired'
  nominee?: {
    name: string
    relationship: string
    percentage: number
  }
  bankAccounts?: BankAccount[]
  // Family grouping fields
  familyGroupId?: string
  familyRole?: FamilyRole
  familyHeadId?: string
}

export interface FamilyGroup {
  id: string
  name: string // Derived from head's last name (e.g., "Sharma Family")
  headId: string
  members: Client[]
  totalAum: number
  avgReturns: number
  totalSipCount: number
  totalGoalsCount: number
}

export interface BankAccount {
  id: string
  bankName: string
  accountNumber: string
  ifsc: string
  accountType: 'Savings' | 'Current'
  isPrimary: boolean
  mandateStatus?: 'Active' | 'Pending' | 'Expired'
}

export interface ClientFormData {
  name: string
  email: string
  phone: string
  pan: string
  dateOfBirth: string
  address: string
  city: string
  state: string
  pincode: string
  riskProfile: RiskProfile
  nominee?: {
    name: string
    relationship: string
    percentage: number
  }
}

// ============================================================
// Portfolio
// ============================================================

export interface Holding {
  id: string
  fundName: string
  fundSchemeCode: string
  fundCategory: string
  assetClass: string
  folioNumber: string
  units: number
  avgNav: number
  currentNav: number
  investedValue: number
  currentValue: number
  absoluteGain: number
  absoluteGainPercent: number
  xirr?: number
  lastTransactionDate: string
}

export interface Portfolio {
  clientId: string
  totalInvested: number
  currentValue: number
  absoluteGain: number
  absoluteGainPercent: number
  xirr: number
  dayChange: number
  dayChangePercent: number
  holdings: Holding[]
  assetAllocation: AssetAllocation[]
  lastUpdated: string
}

export interface AssetAllocation {
  assetClass: string
  percentage: number
  value: number
  color: string
}

// ============================================================
// Transactions
// ============================================================

export type TransactionType = 'Buy' | 'Sell' | 'SIP' | 'SWP' | 'Switch' | 'STP'
export type TransactionStatus = 'Completed' | 'Pending' | 'Processing' | 'Failed' | 'Cancelled'

export interface Transaction {
  id: string
  clientId: string
  clientName: string
  fundName: string
  fundSchemeCode: string
  fundCategory: string
  type: TransactionType
  amount: number
  units: number
  nav: number
  status: TransactionStatus
  date: string
  folioNumber: string
  orderId?: string
  paymentMode?: 'Net Banking' | 'UPI' | 'NACH' | 'Cheque'
  remarks?: string
}

export type ExecutionPlatform = 'BSE_STARMF' | 'MFU' | 'AMC_DIRECT'

export interface TransactionFormData {
  clientId: string
  clientName?: string
  fundSchemeCode: string
  fundName?: string
  fundCategory?: string
  nav?: number
  type: TransactionType
  amount: number
  folioNumber?: string
  paymentMode?: 'Net Banking' | 'UPI' | 'NACH'
  // Execution platform & reference
  platform?: ExecutionPlatform
  orderNumber?: string // BSE order number or MFU reference
  remarks?: string
  // SIP-specific fields
  sipFrequency?: 'Monthly' | 'Quarterly' | 'Weekly'
  sipDate?: number // Day of month (1-28)
  sipStartDate?: string
  sipEndDate?: string
  isPerpetual?: boolean
  // Switch/STP fields
  targetFundCode?: string
  targetFundName?: string
}

// ============================================================
// SIP Management
// ============================================================

export type SIPStatus = 'Active' | 'Paused' | 'Completed' | 'Cancelled' | 'Failed'
export type SIPFrequency = 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly'

export interface SIP {
  id: string
  clientId: string
  clientName: string
  fundName: string
  fundSchemeCode: string
  folioNumber: string
  amount: number
  frequency: SIPFrequency
  sipDate: number // Day of month (1-28)
  startDate: string
  endDate?: string // Optional for perpetual SIPs
  status: SIPStatus
  totalInstallments: number
  completedInstallments: number
  totalInvested: number
  currentValue: number
  returns: number
  returnsPercent: number
  nextSipDate: string
  lastSipDate?: string
  mandateId?: string
  stepUpPercent?: number
  stepUpFrequency?: 'Yearly' | 'Half-Yearly'
}

export interface SIPFormData {
  clientId: string
  fundSchemeCode: string
  amount: number
  frequency: SIPFrequency
  sipDate: number
  startDate: string
  endDate?: string
  isPerpetual: boolean
  stepUpPercent?: number
  stepUpFrequency?: 'Yearly' | 'Half-Yearly'
}

// ============================================================
// Goals
// ============================================================

export type GoalType = 'Retirement' | 'Education' | 'Home' | 'Emergency' | 'Wealth' | 'Wedding' | 'Travel' | 'Custom'
export type GoalPriority = 'High' | 'Medium' | 'Low'

export interface Goal {
  id: string
  clientId: string
  name: string
  type: GoalType
  targetAmount: number
  currentValue: number
  targetDate: string
  startDate: string
  priority: GoalPriority
  monthlyRequired: number
  onTrack: boolean
  progressPercent: number
  linkedSIPs: string[] // SIP IDs
  linkedHoldings: string[] // Holding IDs
  projectedValue: number
  shortfall?: number
  notes?: string
}

export interface GoalFormData {
  name: string
  type: GoalType
  targetAmount: number
  targetDate: string
  priority: GoalPriority
  initialInvestment?: number
  monthlyContribution?: number
  expectedReturn?: number
}

// ============================================================
// Prospects / Leads
// ============================================================

export type ProspectStage = 'Discovery' | 'Analysis' | 'Proposal' | 'Negotiation' | 'Closed Won' | 'Closed Lost'
export type LeadSource = 'Referral' | 'Website' | 'LinkedIn' | 'Event' | 'Cold Call' | 'Social Media' | 'Other'

export interface Prospect {
  id: string
  name: string
  email: string
  phone: string
  potentialAum: number
  stage: ProspectStage
  source: LeadSource
  nextAction: string
  nextActionDate: string
  createdAt: string
  lastContactedAt?: string
  notes: string
  referredBy?: string
  assignedTo?: string
  probability?: number // 0-100
  activities?: ProspectActivity[]
  meetingNotes?: ProspectMeetingNote[]
}

export interface ProspectMeetingNote {
  id: string
  title: string
  content: string
  meetingType: 'CALL' | 'IN_PERSON' | 'VIDEO' | 'EMAIL' | 'OTHER'
  meetingDate: string
}

export interface ProspectActivity {
  id: string
  type: 'Call' | 'Email' | 'Meeting' | 'Note' | 'Task'
  description: string
  date: string
  outcome?: string
}

export interface ProspectFormData {
  name: string
  email: string
  phone: string
  potentialAum: number
  source: LeadSource
  notes?: string
  referredBy?: string
}

// ============================================================
// Reports
// ============================================================

export type ReportType =
  | 'portfolio-statement'
  | 'transaction-report'
  | 'capital-gains'
  | 'performance-report'
  | 'sip-summary'
  | 'goal-report'

export type ReportFormat = 'PDF' | 'Excel' | 'CSV'
export type ReportFrequency = 'On-demand' | 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Annually'

export interface Report {
  id: string
  name: string
  type: ReportType
  client: string
  clientId?: string
  generatedAt: string
  size: string
  format: ReportFormat
  downloadUrl?: string
}

export interface ScheduledReport {
  id: string
  name: string
  type: ReportType
  clients: string[] | 'all'
  frequency: ReportFrequency
  nextRun: string
  lastRun?: string
  status: 'Active' | 'Paused'
  emailTo?: string[]
}

export interface ReportConfig {
  clientId: string | 'all'
  reportType: ReportType
  dateRange: {
    from: string
    to: string
  }
  format: ReportFormat
  includeDetails?: boolean
}

// ============================================================
// Analysis & Insights
// ============================================================

export type AnalysisType =
  | 'portfolio-health'
  | 'goal-tracker'
  | 'rebalance'
  | 'tax-harvest'
  | 'risk-analysis'
  | 'fund-compare'
  | 'overlap-analysis'

export interface AnalysisResult {
  summary: string
  score: number // 0-100
  recommendations: string[]
  metrics: {
    diversification: number
    riskAlignment: number
    goalProgress: number
    costEfficiency: number
  }
  generatedAt: string
}

export type InsightSeverity = 'success' | 'warning' | 'error' | 'info'

export interface AIInsight {
  id: string
  clientId: string
  clientName: string
  type: string
  message: string
  severity: InsightSeverity
  date: string
  actionRequired: boolean
  actionUrl?: string
}

// ============================================================
// Dashboard
// ============================================================

export interface DashboardKPI {
  label: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon?: string
}

export interface PendingAction {
  id: string
  title: string
  description: string
  clientName?: string
  dueDate?: string
  priority: 'High' | 'Medium' | 'Low'
  type: 'kyc' | 'sip' | 'goal' | 'transaction' | 'document' | 'followup'
}

// ============================================================
// Advisor / Settings
// ============================================================

export interface AdvisorProfile {
  id: string
  name: string
  email: string
  phone: string
  arn: string // AMFI Registration Number
  euin: string // Employee Unique Identification Number
  firmName?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  photoUrl?: string
  joinedDate: string
}

export interface AdvisorPreferences {
  theme: 'light' | 'dark' | 'system'
  defaultReportFormat: ReportFormat
  emailNotifications: boolean
  smsNotifications: boolean
  sipReminders: boolean
  goalAlerts: boolean
  marketAlerts: boolean
  dashboardWidgets: string[]
}

// ============================================================
// Funds (extends from services/api)
// ============================================================

export interface FundBasic {
  schemeCode: number
  schemeName: string
  fundHouse: string
  assetClass: string
  category?: string
}

export interface FundDetails extends FundBasic {
  currentNav: number
  navDate: string
  dayChange: number
  dayChangePercent: number
  return1M?: number
  return3M?: number
  return6M?: number
  return1Y?: number
  return3Y?: number
  return5Y?: number
  expenseRatio?: number
  aum?: number
  fundRating?: number
  riskRating?: number
  minInvestment?: number
  minSipAmount?: number
  exitLoad?: string
  benchmark?: string
  fundManager?: string
  launchDate?: string
}

// ============================================================
// Saved Deep Analysis
// ============================================================

export interface SavedAnalysisSummary {
  id: string
  clientId: string
  clientName: string
  title: string
  status: 'DRAFT' | 'FINAL' | 'SHARED'
  latestVersion: number
  createdAt: string
  updatedAt: string
  versions: { id: string; versionNumber: number; editNotes?: string; createdAt: string }[]
}

export interface AnalysisVersionDetail {
  versionNumber: number
  editNotes?: string
  createdAt: string
  personaData: any
  riskData: any
  rebalancingData: any
}

// ============================================================
// Common Utility Types
// ============================================================

export type SortDirection = 'asc' | 'desc'

export interface PaginationParams {
  page: number
  limit: number
  sortBy?: string
  sortDirection?: SortDirection
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface DateRange {
  from: string
  to: string
}

export interface SelectOption {
  value: string
  label: string
}
