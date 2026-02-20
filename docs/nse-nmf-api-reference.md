# NSE NMF (MFSS) API Reference — v1.9.6

Extracted from NSE documentation (Nov 2025). For internal development reference.

## Overview

- **Protocol**: REST/JSON only (no SOAP — simpler than BSE)
- **Base URLs**:
  - UAT: `https://nseinvestuat.nseindia.com`
  - Production: `https://www.nseinvest.com`
- **API Base Path**: `/nsemfdesk/api/v2/` (v1 for legacy NFT/eKYC)
- **Batch Support**: Max 50 records per request
- **66+ API endpoints** across 12 categories

## Authentication

Every request requires 3 headers:

| Header | Value |
|--------|-------|
| `Content-Type` | `application/json` |
| `memberId` | INT (member code) |
| `Authorization` | `BASIC base64(LoginUserID:EncryptedPassword)` |

### Encrypted Password Generation
- Algorithm: **AES-128**
- Key: API Member License KEY
- `salt` = random 32-char alphanumeric
- `iv` = random 32-char alphanumeric
- `plain_text` = `API_Secret|RandomNumber`
- `Encrypted Password` = `base64(iv::salt::AES128(salt, iv, key, plain_text))`

### Security
- IP whitelist required (up to 4 static IPs per user)
- Role-based access per API
- TLS 1.3+ required

## All API Endpoints

### 1. Order Entry (2 endpoints)

| API | URL | Method | Notes |
|-----|-----|--------|-------|
| Purchase/Redemption | `/nsemfdesk/api/v2/transaction/NORMAL` | POST | `trxn_type`: P=Purchase, R=Redemption. Max 50 orders/batch |
| Switch | `/nsemfdesk/api/v2/transaction/SWITCH` | POST | `from_scheme_code` → `to_scheme_code`. Max 50/batch |

Key fields: `scheme_code`, `client_code`, `demat_physical` (C/N/P), `order_amount`, `folio_no`, `kyc_flag`, `euin_number`, `euin_declaration`

Response: `trxn_order_id`, `trxn_status` (TRXN SUCCESS/TRXN FAILED), `trxn_remark`

### 2. Systematic Plans (5 registration endpoints)

| API | URL | Method | Notes |
|-----|-----|--------|-------|
| XSIP Registration | `/nsemfdesk/api/v2/registration/product/XSIP` | POST | Mandate-based, step-up support |
| SIP Registration | `/nsemfdesk/api/v2/registration/product/SIP` | POST | Like XSIP without step-up |
| SIP Topup | `/nsemfdesk/api/v2/registration/product/SIP_TOPUP` | POST | Add-on to existing SIP |
| STP Registration | `/nsemfdesk/api/v2/registration/product/STP` | POST | Transfer between schemes |
| SWP Registration | `/nsemfdesk/api/v2/registration/product/SWP` | POST | Systematic withdrawal |

Key fields: `sch_code`, `client_code`, `start_date` (DD/MM/YYYY), `frequency_type`, `installment_amount`, `installment_no`, `xsip_mandate_id`

Response: `reg_id`, `reg_status` (REG_SUCCESS/REG_FAILED), `reg_remark`

### 3. Cancellation (6 endpoints)

| API | URL | Method |
|-----|-----|--------|
| Order Cancel | `/nsemfdesk/api/v2/cancellation/ORDER_CAN` | POST |
| SIP Cancel | `/nsemfdesk/api/v2/cancellation/SIP_CAN` | POST |
| XSIP Cancel | `/nsemfdesk/api/v2/cancellation/XSIP_CAN` | POST |
| Daily XSIP Cancel | `/nsemfdesk/api/v2/cancellation/DAILY_XSIP_CAN` | POST |
| STP Cancel | `/nsemfdesk/api/v2/cancellation/STP_CAN` | POST |
| SWP Cancel | `/nsemfdesk/api/v2/cancellation/SWP_CAN` | POST |

Response: `can_status` (CAN_SUCCESS/CAN_FAILED), `can_remark`

### 4. Client Registration (3 endpoints)

| API | URL | Method | Notes |
|-----|-----|--------|-------|
| UCC 183-Column | `/nsemfdesk/api/v2/registration/CLIENTCOMMON183` | POST | 183 fields, 1 record/request |
| Bank Detail Add/Del | `/nsemfdesk/api/v2/registration/CLIENTBANKDTL` | POST | Max 5 banks per client |
| eKYC Register | `/nsemfdesk/api/v1/EKYC/EKYCREG` | POST | Returns eKYC link (v1 endpoint) |

UCC key fields: `action_flag` (A=Add, M=Modify), `client_code`, `ph_first_name`, `ph_pan`, `ph_dob_incorporation`, `tax_status`, `holding_nature`, bank accounts (1-5), nominee details (1-10)

### 5. Mandates (2 endpoints)

| API | URL | Method | Notes |
|-----|-----|--------|-------|
| Mandate Registration | `/nsemfdesk/api/v2/registration/product/MANDATE` | POST | eNACH or Physical. Max 50/batch |
| Mandate Image Upload | `/nsemfdesk/api/v2/fileupload/MANDATEIMG` | POST | Base64 image for physical mandates |

Key fields: `mandate_type` (X=Physical, E=eNACH), `amount`, `account_no`, `ifsc_code`

### 6. Payments (2 endpoints)

| API | URL | Method | Notes |
|-----|-----|--------|-------|
| Purchase Payment | `/nsemfdesk/api/v2/payments/purchase_payment` | POST | Modes: MANDATE/CHEQUE/UPI/NETBANKING/RTGS/NEFT |
| UPI Status Check | `/nsemfdesk/api/v2/payments/upi_status_check` | POST | Check async UPI payment |

Payment modes: MANDATE (with mandate_id), UPI (with vpa + callback_url), NETBANKING (callback_url), RTGS/NEFT (utr_no), CHEQUE (cheque_no + cheque_date)

### 7. FATCA/Compliance (2 + uploads)

| API | URL | Method | Notes |
|-----|-----|--------|-------|
| FATCA Individual | `/nsemfdesk/api/v2/registration/FATCA` | POST | 40+ fields, 1 record |
| FATCA Common/Corporate | `/nsemfdesk/api/v2/registration/FATCA_COMMON` | POST | Entity FATCA |
| eLog Registration | `/nsemfdesk/api/v2/registration/eLOG` | POST | Client authorization |

### 8. File Uploads (7 endpoints)

| API | URL | Method |
|-----|-----|--------|
| AOF Image | `/nsemfdesk/api/v2/fileupload/AOFIMG` | POST |
| FATCA Image | `/nsemfdesk/api/v2/fileupload/FATCAIMG` | POST |
| POA Upload | `/nsemfdesk/api/v2/fileupload/POA_UPLOAD` | POST |
| Cancel Cheque | `/nsemfdesk/api/v2/fileupload/CANCELCHEQUE` | POST |
| Bank eLog | `/nsemfdesk/api/v2/fileupload/ELOGBANK` | POST |
| Mandate Scan | `/nsemfdesk/api/v2/fileupload/MANDATEIMG` | POST |
| NFT Image | `/nsemfdesk/api/v2/fileupload/NFTIMAGE` | POST |

All use base64 `file_data` + `file_name`. Formats: .jpg, .jpeg, .png, .tif, .tiff, .pdf

### 9. Utilities (4 endpoints)

| API | URL | Method | Notes |
|-----|-----|--------|-------|
| UTR Update | `/nsemfdesk/api/v2/transaction/UTRUPDATE` | POST | Link UTR to order |
| SIP UMRN Mapping | `/nsemfdesk/api/v2/registration/SIPUMRN` | POST | SIP→XSIP mandate mapping |
| Get Short URL | `/nsemfdesk/api/v2/reports/GET_LINK` | POST | Auth/payment links |
| Resend Communication | `/nsemfdesk/api/v2/registration/RESEND_COMM` | POST | Retrigger auth emails |
| SIP/XSIP Pause | `/nsemfdesk/api/v2/registration/XSIP_PAUSE` | POST | Pause/Resume SIPs |
| KYC Status Check | `/nsemfdesk/api/v2/utility/KYC_CHECK` | POST | PAN-based KYC lookup |

### 10. Reports (30+ endpoints)

| API | URL |
|-----|-----|
| Provisional Orders | `/nsemfdesk/api/v2/reports/PROV_ORDERS` |
| Order Status | `/nsemfdesk/api/v2/reports/ORDER_STATUS` |
| Order Lifecycle | `/nsemfdesk/api/v2/reports/order_lifecycle` |
| Transaction Detail | `/nsemfdesk/api/v2/reports/TRANSACTION_DETAIL_REPORT` |
| Mandate Status | `/nsemfdesk/api/v2/reports/MANDATE_STATUS` |
| Allotment Statement | `/nsemfdesk/api/v2/reports/ALLOTMENT_STATEMENT` |
| Redemption Statement | `/nsemfdesk/api/v2/reports/REDEMPTION_STATEMENT` |
| Redemption Payout | `/nsemfdesk/api/v2/reports/REDEMPTION_PAYOUT` |
| Redemption Payout (Non-Demat) | `/nsemfdesk/api/v2/reports/REDEMPTION_PAYOUT_NON_DEMAT` |
| Client Authorization | `/nsemfdesk/api/v2/reports/client_authorization` |
| Client Detail | `/nsemfdesk/api/v2/reports/client_detail_report` |
| Client Master | `/nsemfdesk/api/v2/reports/client_master_report` |
| Client KYC | `/nsemfdesk/api/v2/reports/CLIENT_KYC_REPORT` |
| FATCA Report | `/nsemfdesk/api/v2/reports/FATCA_REPORT` |
| AOF Upload Report | `/nsemfdesk/api/v2/reports/AOF_IMAGE_UPLODA_REPORT` |
| eLog Upload Report | `/nsemfdesk/api/v2/reports/ELOG_UPLOAD_REPORT` |
| 2FA Report | `/nsemfdesk/api/v2/reports/2fa` |
| SIP Registration | `/nsemfdesk/api/v2/reports/SIP_REG_REPORT` |
| SIP Cancellation | `/nsemfdesk/api/v2/reports/SIP_CAN_REPORT` |
| SIP Installment Due | `/nsemfdesk/api/v2/reports/SIP_INST_DUE_REPORT` |
| SIP Topup | `/nsemfdesk/api/v2/reports/SIP_TOPUP_REPORT` |
| Step-up Registration | `/nsemfdesk/api/v2/reports/STEPUP_REG_REPORT` |
| XSIP Registration | `/nsemfdesk/api/v2/reports/XSIP_REG_REPORT` |
| XSIP Cancellation | `/nsemfdesk/api/v2/reports/XSIP_CAN_REPORT` |
| XSIP Installment Due | `/nsemfdesk/api/v2/reports/XSIP_INST_DUE_REPORT` |
| XSIP Topup | `/nsemfdesk/api/v2/reports/XSIP_TOPUP_REPORT` |
| STP Registration | `/nsemfdesk/api/v2/reports/STP_REG_REPORT` |
| STP Cancellation | `/nsemfdesk/api/v2/reports/STP_CAN_REPORT` |
| STP Installment Due | `/nsemfdesk/api/v2/reports/STP_INST_DUE_REPORT` |
| SWP Registration | `/nsemfdesk/api/v2/reports/SWP_REG_REPORT` |
| SWP Cancellation | `/nsemfdesk/api/v2/reports/SWP_CAN_REPORT` |
| SWP Installment Due | `/nsemfdesk/api/v2/reports/SWP_INST_DUE_REPORT` |
| Member Fund Allocation | `/nsemfdesk/api/v2/reports/MEMBER_FUND_ALLOCATION` |
| Agewise/Bankwise | `/nsemfdesk/api/v2/reports/MEMBER_FUND_ALLOCATION/AGE_WISE` |
| Master Download | `/nsemfdesk/api/v2/reports/MASTER_DOWNLOAD` |

### 11. NFT (Non-Financial Transactions)

| API | URL | Method |
|-----|-----|--------|
| NFT Image Upload | `/nsemfdesk/api/v2/fileupload/NFTIMAGE` | POST |
| NFT Registration | `/nsemfdesk/api/v1/NFT/NOM` | POST |

### 12. Admin

| API | URL | Method | Notes |
|-----|-----|--------|-------|
| Change API Secret | `/nsemfdesk/api/v2/admin/CHANGE_API_SECRET` | POST | Regenerates secret key |

---

## NSE vs BSE Key Differences

| Aspect | NSE NMF | BSE StAR MF |
|--------|---------|-------------|
| Protocol | REST/JSON only | SOAP 1.2 + REST/JSON |
| Auth | AES-128 BASIC header | AES-256 + session tokens |
| Session mgmt | Stateless (auth per request) | Session tokens with TTL |
| Param format | JSON fields | Pipe-separated strings in SOAP |
| Batch support | 50 records/request | Varies |
| Payment modes | MANDATE/CHEQUE/UPI/NETBANKING/RTGS/NEFT | DIRECT/NODAL/NEFT/UPI |
| Payment flow | Async callbacks (UPI/NETBANKING) | Redirect-based |
| UCC fields | 183 columns (JSON) | ~99 pipe-separated fields |
| FATCA | 40+ fields individual, separate corporate | 75 pipe-separated fields |
| SIP types | SIP + XSIP (with step-up + topup) | SIP + XSIP |
| SIP Pause | Supported (XSIP_PAUSE) | Not in BSE API |
| KYC | Built-in eKYC registration | External CKYC upload |
| Short URLs | Built-in (GET_LINK) | Not available |
| NFT support | Yes (nominee/bank changes) | No |
| Reports | 30+ dedicated endpoints | Fewer, combined |
| Client types | Demat (CDSL/NSDL) + Physical | Similar |

## Order Lifecycle (NSE)

```
Order Placed → 2FA Pending → Auth Pending → Payment Pending
  → Payment Confirmation Pending → Pending for RTA
  → Validated by RTA → Allotment Done → Units Transferred

  (or at any stage: Rejected / Auto Rejected / Order Expired)
```

## Settlement

- Funds go to NSE Clearing Ltd (NCL) via virtual accounts
- RTGS: 22-digit UTR, NEFT: 16-digit UTR, IMPS: 12-digit UTR
- Cut-off: Liquid funds 1:00 PM, Others 2:30 PM
- Payment link valid: T+2 days
- Order valid without payment: 5 working days
- Refund for unreconciled: T+3 working days
