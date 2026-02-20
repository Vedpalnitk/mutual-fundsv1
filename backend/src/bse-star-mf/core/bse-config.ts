export const BSE_ENDPOINTS = {
  // Order Entry Service (SOAP 1.2)
  ORDER_ENTRY: '/MFOrderEntry/MFOrder.svc/w/GenerateResponse',
  ORDER_PASSWORD: '/MFOrderEntry/MFOrder.svc/w/getPassword',

  // Additional Services (SOAP 1.2)
  ADDITIONAL_SERVICES: '/StarMFFileUploadService/MFUploadService.svc/w/GenerateResponse',
  ADDITIONAL_PASSWORD: '/StarMFFileUploadService/MFUploadService.svc/w/getPassword',

  // Enhanced APIs (REST/JSON)
  UCC_REGISTRATION: '/StarMFCommonAPI/ClientMaster/Registration',
  ORDER_STATUS: '/StarMFCommonAPI/OrderStatusCheck',
  ALLOTMENT_STATEMENT: '/StarMFCommonAPI/AllotmentStatement',
  REDEMPTION_STATEMENT: '/StarMFCommonAPI/RedemptionStatement',
  CHILD_ORDER_DETAILS: '/StarMFCommonAPI/ChildOrderDetails',

  // Payment API (REST/JSON)
  SINGLE_PAYMENT: '/StarMFSinglePaymentAPI/Single/Payment',

  // Mandate APIs (REST/JSON)
  EMANDATE_AUTH_URL: '/StarMFCommonAPI/EMandateAuthURL',
  MANDATE_DETAILS: '/StarMFCommonAPI/MandateDetailsRequest',
  MANDATE_SHIFT: '/StarMFAPI/api/Mandate/MandateShift',

  // STP API (REST/JSON)
  STP_REGISTRATION: '/starmfapi/api/stp/stpregistration',

  // File Upload
  FILE_UPLOAD: '/StarMFFileUploadService/FileUpload.svc/w/UploadFile',
  MANDATE_SCAN_UPLOAD: '/StarMFFileUploadService/FileUpload.svc/w/MandateScanFileData',
  IMAGE_UPLOAD_BASE64: '/StarMFCommonAPI/ImageUploadBase64',
  IMAGE_UPLOAD_BYTE: '/StarMFCommonAPI/ImageUploadByte',
}

export const BSE_SESSION_TTL = {
  ORDER_ENTRY: 60 * 60 * 1000,         // 60 minutes
  ADDITIONAL_SERVICES: 5 * 60 * 1000,  // 5 minutes
  FILE_UPLOAD: 0,                       // per-request
  MANDATE_STATUS: 0,                    // per-request
  CHILD_ORDER: 0,                       // per-request
}

export const BSE_SOAP_ACTIONS = {
  ORDER_ENTRY: 'http://bsestarmf.in/IStarMFOrder/orderEntryParam',
  SIP_ORDER: 'http://bsestarmf.in/IStarMFOrder/sipOrderEntryParam',
  XSIP_ORDER: 'http://bsestarmf.in/IStarMFOrder/xsipOrderEntryParam',
  SWITCH_ORDER: 'http://bsestarmf.in/IStarMFOrder/switchOrderEntryParam',
  SPREAD_ORDER: 'http://bsestarmf.in/IStarMFOrder/spreadOrderEntryParam',
  GET_PASSWORD: 'http://bsestarmf.in/IStarMFOrder/getPassword',
  ADDITIONAL_RESPONSE: 'http://bsestarmf.in/IStarMFUpload/GenerateResponse',
  ADDITIONAL_PASSWORD: 'http://bsestarmf.in/IStarMFUpload/getPassword',
  CHANGE_OF_BROKER_ENTRY: 'http://bsestarmf.in/IStarMFOrder/changeOfBrokerEntryParam',
}

export const BSE_TIMEOUTS = {
  DEFAULT: 30000,
  UPLOAD: 60000,
  PAYMENT: 45000,
}
