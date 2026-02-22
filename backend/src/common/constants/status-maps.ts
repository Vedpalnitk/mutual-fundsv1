export const TRANSACTION_TYPE_MAP: Record<string, string> = {
  BUY: 'Buy',
  SELL: 'Sell',
  SIP: 'SIP',
  SWP: 'SWP',
  SWITCH: 'Switch',
  STP: 'STP',
}

export const TRANSACTION_STATUS_MAP: Record<string, string> = {
  COMPLETED: 'Completed',
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
}

export const CLIENT_STATUS_MAP: Record<string, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  PENDING_KYC: 'Pending KYC',
}

export const RISK_PROFILE_MAP: Record<string, string> = {
  CONSERVATIVE: 'Conservative',
  MODERATE: 'Moderate',
  AGGRESSIVE: 'Aggressive',
}
