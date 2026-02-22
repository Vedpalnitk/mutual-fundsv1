/**
 * Onboarding Wizard API
 */
import { request, requestUpload } from '../api'

// ============= Types =============

export interface OnboardingStepStatus {
  completed: boolean
  skipped: boolean
}

export interface OnboardingImportStatus {
  camsWbrUploaded: boolean
  kfintechMisUploaded: boolean
  camsWbrImportId: string | null
  kfintechMisImportId: string | null
}

export interface OnboardingStatus {
  id: string
  currentStep: number
  isComplete: boolean
  steps: {
    profile: OnboardingStepStatus
    arn: OnboardingStepStatus
    exchange: OnboardingStepStatus
    team: OnboardingStepStatus
    import: OnboardingStepStatus
    commission: OnboardingStepStatus
  }
  importStatus: OnboardingImportStatus
  completedAt: string | null
}

export interface BulkImportResult {
  id: string
  importType: string
  fileName: string
  fileSize: number
  status: string
  totalRecords: number
  importedClients: number
  importedHoldings: number
  skippedRecords: number
  errorRecords: number
  createdAt: string
}

export interface BulkImportError {
  row: number
  field: string
  message: string
}

export interface DefaultCommissionRate {
  amcName: string
  category: string
  schemeType: string
  trailRate: number
  upfrontRate: number
  providerId?: string
}

// ============= Onboarding API =============

export const onboardingApi = {
  getStatus: () =>
    request<OnboardingStatus>('/api/v1/advisor/onboarding'),

  completeStep: (step: number, data?: any) =>
    request<OnboardingStatus>('/api/v1/advisor/onboarding/step', {
      method: 'POST',
      body: { step, data },
    }),

  skipStep: (step: number) =>
    request<OnboardingStatus>('/api/v1/advisor/onboarding/skip', {
      method: 'POST',
      body: { step },
    }),

  completeWizard: () =>
    request<OnboardingStatus>('/api/v1/advisor/onboarding/complete', {
      method: 'POST',
    }),
}

// ============= Bulk Import API =============

export const bulkImportApi = {
  uploadCamsWbr: (file: File) =>
    requestUpload<BulkImportResult>('/api/v1/bulk-import/cams-wbr', file),

  uploadKfintechMis: (file: File) =>
    requestUpload<BulkImportResult>('/api/v1/bulk-import/kfintech-mis', file),

  getStatus: (id: string) =>
    request<BulkImportResult>(`/api/v1/bulk-import/${id}`),

  getErrors: (id: string) =>
    request<BulkImportError[]>(`/api/v1/bulk-import/${id}/errors`),

  getHistory: () =>
    request<BulkImportResult[]>('/api/v1/bulk-import/history'),
}

// ============= Commission Defaults API =============

export const commissionDefaultsApi = {
  getDefaults: () =>
    request<DefaultCommissionRate[]>('/api/v1/commissions/defaults'),

  bulkCreate: (rates: Array<{ providerId: string; category: string; schemeType: string; trailRate: number; upfrontRate: number }>) =>
    request<{ created: number; skipped: number }>('/api/v1/commissions/rates/bulk', {
      method: 'POST',
      body: { rates },
    }),
}
