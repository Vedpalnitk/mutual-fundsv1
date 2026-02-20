// NSE NMF uses descriptive string statuses rather than numeric codes
// Map known NSE response patterns to user-friendly messages

const NSE_ERROR_MAP: Record<string, string> = {
  // Transaction responses
  'TRXN SUCCESS': 'Transaction placed successfully',
  'TRXN FAILED': 'Transaction failed',
  'TRXN DUPLICATE': 'Duplicate transaction detected',

  // Registration responses
  'REG_SUCCESS': 'Registration successful',
  'REG_FAILED': 'Registration failed',

  // Cancellation responses
  'CAN_SUCCESS': 'Cancellation successful',
  'CAN_FAILED': 'Cancellation failed',

  // Common errors
  'INVALID_MEMBER': 'Invalid member ID or credentials',
  'INVALID_AUTH': 'Authentication failed',
  'IP_NOT_WHITELISTED': 'IP address not whitelisted',
  'INVALID_CLIENT_CODE': 'Invalid client code',
  'INVALID_SCHEME': 'Invalid scheme code',
  'INVALID_AMOUNT': 'Invalid amount',
  'INVALID_DATE': 'Invalid date format',
  'SCHEME_NOT_ALLOWED': 'Scheme not allowed for this transaction type',
  'KYC_NOT_VERIFIED': 'KYC verification pending',
  'MANDATE_NOT_APPROVED': 'Mandate not approved',
  'INSUFFICIENT_BALANCE': 'Insufficient balance',
  'ORDER_NOT_FOUND': 'Order not found',
  'DUPLICATE_ORDER': 'Duplicate order',
}

export function getNseErrorMessage(status: string): string {
  if (!status) return 'Unknown error'
  return NSE_ERROR_MAP[status.toUpperCase()] || status
}

export function isNseSuccess(status: string): boolean {
  if (!status) return false
  const upper = status.toUpperCase()
  return upper.includes('SUCCESS') || upper === '100'
}
