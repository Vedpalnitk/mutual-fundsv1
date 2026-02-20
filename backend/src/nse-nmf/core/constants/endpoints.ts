export const NSE_ENDPOINTS = {
  // Order Entry
  NORMAL_ORDER: '/nsemfdesk/api/v2/transaction/NORMAL',
  SWITCH_ORDER: '/nsemfdesk/api/v2/transaction/SWITCH',
  UTR_UPDATE: '/nsemfdesk/api/v2/transaction/UTRUPDATE',

  // Client Registration
  UCC_183: '/nsemfdesk/api/v2/registration/CLIENTCOMMON183',
  CLIENT_BANK_DETAIL: '/nsemfdesk/api/v2/registration/CLIENTBANKDTL',
  EKYC_REGISTER: '/nsemfdesk/api/v1/EKYC/EKYCREG',

  // FATCA / Compliance
  FATCA: '/nsemfdesk/api/v2/registration/FATCA',
  FATCA_COMMON: '/nsemfdesk/api/v2/registration/FATCA_COMMON',
  ELOG: '/nsemfdesk/api/v2/registration/eLOG',

  // Systematic Plans
  SIP: '/nsemfdesk/api/v2/registration/product/SIP',
  XSIP: '/nsemfdesk/api/v2/registration/product/XSIP',
  SIP_TOPUP: '/nsemfdesk/api/v2/registration/product/SIP_TOPUP',
  STP: '/nsemfdesk/api/v2/registration/product/STP',
  SWP: '/nsemfdesk/api/v2/registration/product/SWP',
  XSIP_PAUSE: '/nsemfdesk/api/v2/registration/XSIP_PAUSE',
  SIP_UMRN: '/nsemfdesk/api/v2/registration/SIPUMRN',
  RESEND_COMM: '/nsemfdesk/api/v2/registration/RESEND_COMM',

  // Mandates
  MANDATE: '/nsemfdesk/api/v2/registration/product/MANDATE',

  // Cancellation
  ORDER_CANCEL: '/nsemfdesk/api/v2/cancellation/ORDER_CAN',
  SIP_CANCEL: '/nsemfdesk/api/v2/cancellation/SIP_CAN',
  XSIP_CANCEL: '/nsemfdesk/api/v2/cancellation/XSIP_CAN',
  DAILY_XSIP_CANCEL: '/nsemfdesk/api/v2/cancellation/DAILY_XSIP_CAN',
  STP_CANCEL: '/nsemfdesk/api/v2/cancellation/STP_CAN',
  SWP_CANCEL: '/nsemfdesk/api/v2/cancellation/SWP_CAN',

  // Payments
  PURCHASE_PAYMENT: '/nsemfdesk/api/v2/payments/purchase_payment',
  UPI_STATUS_CHECK: '/nsemfdesk/api/v2/payments/upi_status_check',

  // File Uploads
  AOF_IMAGE: '/nsemfdesk/api/v2/fileupload/AOFIMG',
  FATCA_IMAGE: '/nsemfdesk/api/v2/fileupload/FATCAIMG',
  POA_UPLOAD: '/nsemfdesk/api/v2/fileupload/POA_UPLOAD',
  CANCEL_CHEQUE: '/nsemfdesk/api/v2/fileupload/CANCELCHEQUE',
  ELOG_BANK: '/nsemfdesk/api/v2/fileupload/ELOGBANK',
  MANDATE_IMAGE: '/nsemfdesk/api/v2/fileupload/MANDATEIMG',
  NFT_IMAGE: '/nsemfdesk/api/v2/fileupload/NFTIMAGE',

  // Reports
  PROV_ORDERS: '/nsemfdesk/api/v2/reports/PROV_ORDERS',
  ORDER_STATUS: '/nsemfdesk/api/v2/reports/ORDER_STATUS',
  ORDER_LIFECYCLE: '/nsemfdesk/api/v2/reports/order_lifecycle',
  TRANSACTION_DETAIL: '/nsemfdesk/api/v2/reports/TRANSACTION_DETAIL_REPORT',
  MANDATE_STATUS: '/nsemfdesk/api/v2/reports/MANDATE_STATUS',
  ALLOTMENT_STATEMENT: '/nsemfdesk/api/v2/reports/ALLOTMENT_STATEMENT',
  REDEMPTION_STATEMENT: '/nsemfdesk/api/v2/reports/REDEMPTION_STATEMENT',
  REDEMPTION_PAYOUT: '/nsemfdesk/api/v2/reports/REDEMPTION_PAYOUT',
  REDEMPTION_PAYOUT_NON_DEMAT: '/nsemfdesk/api/v2/reports/REDEMPTION_PAYOUT_NON_DEMAT',
  CLIENT_AUTHORIZATION: '/nsemfdesk/api/v2/reports/client_authorization',
  CLIENT_DETAIL: '/nsemfdesk/api/v2/reports/client_detail_report',
  CLIENT_MASTER: '/nsemfdesk/api/v2/reports/client_master_report',
  CLIENT_KYC: '/nsemfdesk/api/v2/reports/CLIENT_KYC_REPORT',
  FATCA_REPORT: '/nsemfdesk/api/v2/reports/FATCA_REPORT',
  AOF_UPLOAD_REPORT: '/nsemfdesk/api/v2/reports/AOF_IMAGE_UPLODA_REPORT',
  ELOG_UPLOAD_REPORT: '/nsemfdesk/api/v2/reports/ELOG_UPLOAD_REPORT',
  TWO_FA_REPORT: '/nsemfdesk/api/v2/reports/2fa',
  SIP_REG_REPORT: '/nsemfdesk/api/v2/reports/SIP_REG_REPORT',
  SIP_CAN_REPORT: '/nsemfdesk/api/v2/reports/SIP_CAN_REPORT',
  SIP_INST_DUE: '/nsemfdesk/api/v2/reports/SIP_INST_DUE_REPORT',
  SIP_TOPUP_REPORT: '/nsemfdesk/api/v2/reports/SIP_TOPUP_REPORT',
  STEPUP_REG_REPORT: '/nsemfdesk/api/v2/reports/STEPUP_REG_REPORT',
  XSIP_REG_REPORT: '/nsemfdesk/api/v2/reports/XSIP_REG_REPORT',
  XSIP_CAN_REPORT: '/nsemfdesk/api/v2/reports/XSIP_CAN_REPORT',
  XSIP_INST_DUE: '/nsemfdesk/api/v2/reports/XSIP_INST_DUE_REPORT',
  XSIP_TOPUP_REPORT: '/nsemfdesk/api/v2/reports/XSIP_TOPUP_REPORT',
  STP_REG_REPORT: '/nsemfdesk/api/v2/reports/STP_REG_REPORT',
  STP_CAN_REPORT: '/nsemfdesk/api/v2/reports/STP_CAN_REPORT',
  STP_INST_DUE: '/nsemfdesk/api/v2/reports/STP_INST_DUE_REPORT',
  SWP_REG_REPORT: '/nsemfdesk/api/v2/reports/SWP_REG_REPORT',
  SWP_CAN_REPORT: '/nsemfdesk/api/v2/reports/SWP_CAN_REPORT',
  SWP_INST_DUE: '/nsemfdesk/api/v2/reports/SWP_INST_DUE_REPORT',
  MEMBER_FUND_ALLOCATION: '/nsemfdesk/api/v2/reports/MEMBER_FUND_ALLOCATION',
  MEMBER_FUND_AGEWISE: '/nsemfdesk/api/v2/reports/MEMBER_FUND_ALLOCATION/AGE_WISE',
  MASTER_DOWNLOAD: '/nsemfdesk/api/v2/reports/MASTER_DOWNLOAD',
  GET_LINK: '/nsemfdesk/api/v2/reports/GET_LINK',

  // Utilities
  KYC_CHECK: '/nsemfdesk/api/v2/utility/KYC_CHECK',

  // NFT
  NFT_NOM: '/nsemfdesk/api/v1/NFT/NOM',

  // Admin
  CHANGE_API_SECRET: '/nsemfdesk/api/v2/admin/CHANGE_API_SECRET',
}

export const NSE_TIMEOUTS = {
  DEFAULT: 30000,
  UPLOAD: 60000,
  PAYMENT: 45000,
  REPORT: 60000,
}
