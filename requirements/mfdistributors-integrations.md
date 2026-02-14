# Comprehensive implementation plan for Sparrow Money: India's MF distribution platform

**BSE StAR MF emerges as the optimal transaction backbone for a Node.js-based mutual fund distribution platform, with MFCentral providing unified portfolio data across all RTAs.** The complete integration requires navigating approximately 8-12 distinct systems including transaction platforms (BSE StAR MF), RTAs (CAMS/KFintech), KYC registries (5 KRAs + CKYC), and payment infrastructure (NACH/UPI). A phased implementation targeting MVP in **3-4 months** and full platform in **6-12 months** is recommended, with total integration costs ranging from ₹15,000 (BSE registration) to several lakhs for enterprise partnerships.

---

## BSE StAR MF: The transaction foundation

BSE StAR MF (Stock Exchange Platform for Allotment and Redemption of Mutual Funds), launched December 2009, processes the majority of India's mutual fund transactions through **3,400+ members** with over ₹75,000 crore in annual transaction value. The platform uses **SOAP 1.2 Web Services** with newer JSON APIs for enhanced functionality.

### API documentation and endpoints

| Service | Demo URL | Production URL |
|---------|----------|----------------|
| Order Entry | https://bsestarmfdemo.bseindia.com/MFOrderEntry/MFOrder.svc | https://www.bsestarmf.in/MFOrderEntry/MFOrder.svc |
| Upload Service | https://bsestarmfdemo.bseindia.com/MFUploadService/MFUploadService.svc | https://www.bsestarmf.in/MFUploadService/MFUploadService.svc |
| UCC Registration | https://bsestarmfdemo.bseindia.com/StarMFCommonAPI/ClientMaster/Registration | Production equivalent |
| Reporting | - | https://www.bsestarmf.in/StarMFWebService/StarMFWebService.svc |

**Key documentation resources:**
- API File Structure (Version 3.1): https://www.bsestarmf.in/APIFileStructure.pdf
- Web File Structures (Version 4.8): https://www.bsestarmf.in/WEBFileStructure.pdf
- Service Endpoint Help: https://www.bsestarmf.in/StarMFWebService/StarMFWebService.svc/help

### Authentication mechanism

The `getPassword` method generates session tokens valid for **1 hour** on MFOrder.svc and **5 minutes** on other services. Authentication requires Member ID (BSE-assigned), User ID (5 characters), Password, and a random alphanumeric Passkey for entropy. The response format returns `100|EncryptedPassword` on success, which must be used for all subsequent API calls.

### Complete API capabilities

**Client Onboarding (UCC Creation):** The Enhanced UCC Registration API (JSON-based) handles new client registration, modification, and upgrades. Required fields include PAN, Tax Status, Bank Details (IFSC, Account Number), KYC status, FATCA details, and optional nominee/demat information. UCC creation is mandatory before any transaction.

**Transaction APIs:** Order placement uses `orderEntryParam` for purchases (P) and redemptions (R) with transaction types FRESH or ADDITIONAL. Switch orders use `switchOrderEntryParam`, while spread/overnight orders for liquid fund redemption with same-day purchase use `spreadOrderEntryParam`. Real-time RTA integration means **modification and cancellation of orders is no longer available**.

**Systematic Investment Plans:** Regular SIP uses `sipOrderEntryParam` with frequency options of MONTHLY, QUARTERLY, WEEKLY, or DAILY. The First Order Flag (Y/N) controls immediate first installment. XSIP/ISIP for mandate-based auto-debit uses `xsipOrderEntryParam` requiring either XSIP Mandate ID or ISIP Mandate ID.

**Mandate Registration:** Supports NACH, E-Mandate (Aadhaar-based), I-Mandate, and One-Time Mandate (OTM). The E-NACH Authentication URL API enables NPCI E-Mandate via Net Banking or Debit Card with maximum limit of **₹1 lakh**. Mandate registration uses MFAPI Flag 06.

### Vendor registration and fees

**For MFD Registration:**
- **Lifetime Fee:** ₹15,000 + GST (one-time)
- **Admin Charges:** ₹300 for spot registration
- **Annual Maintenance:** NIL
- **Transaction Charges:** NIL (BSE charges AMCs, not distributors)

**Required Documents:**
- Application letter with AMC empanelment list
- Valid ARN and AMFI registration certificate (self-certified)
- PAN card copy
- Self-certification of networth/tangible assets
- For companies: Constitution documents, Board resolutions

**Registration Contact:** BSE Help Desk +91-22-6136-3151

### Go-live certification process

1. Email request with existing BSE StAR MF Member ID to navaneetha.krishnan@bsetech.in or aqsa.shaikh@bsetech.in
2. Receive test market credentials and develop using sandbox
3. Schedule and conduct product demonstration in Test Market
4. Upon approval, receive production API URLs
5. **Typical timeline:** 2-4 weeks from demo request to approval

---

## MFU and MFCentral: Alternative transaction and portfolio data

### MF Utilities (MFU)

MFU is AMFI's "Shared Services" initiative enabling transactions across all participating AMCs through a single Common Account Number (CAN). **API integration is available** but requires direct partnership arrangement with MF Utilities India Pvt Ltd - no public API documentation exists.

**CAN Creation:** Electronic CAN (eCAN) available for KYC-compliant individual investors with provisional allotment followed by approval in 24-48 hours. Existing folios automatically map based on PAN and holding pattern.

**Transaction Capabilities:** Purchases, redemptions, switches (within same AMC only), SIP/SWP/STP registration through TransactEezz. PayEezz provides single mandate facility for SIP payments via eNACH.

**For technology companies:** Direct MFU API requires contacting MFUI through https://www.mfuindia.com. Alternative approaches include using middleware platforms like Fintech Primitives or Tarrakki, or integrating via BSE StAR MF instead.

### MFCentral: Unified portfolio access

MFCentral, launched September 2021 as a 50-50 joint venture between CAMS and KFintech, provides **single-point access to all mutual funds regardless of RTA**. The platform has **2.5+ million registered users**.

**API Technical Specifications:**
- **Authentication:** OAuth 2.0 with JWT tokens (validity ~30 days)
- **Encryption:** AES-256 bit symmetric encryption, CBC mode, PKCS5 padding
- **Digital Signatures:** JWS with RS256 algorithm
- **Base URL (UAT):** https://uatservices.mfcentral.com

**Available Endpoints:**
```
POST /oauth/token                           # Token generation
POST /api/client/V1/submitcassummaryrequest # CAS summary request
POST /api/client/V1/submitcasdetailrequest  # Detailed CAS with transactions
POST /api/client/V1/investorconsent         # OTP validation
POST /api/client/V1/getcasdocument          # Retrieve CAS document
```

**CAS Data Available:** Portfolio value (market value, cost value, gain/loss percentage), scheme details (AMC, folio, scheme code, NAV, units, ISIN), transaction history with date range filtering, investor details, KYC status, and broker information.

**Onboarding:** Contact MFCentral for partnership discussion. Credentials provided offline include clientId, clientSecret, userName, password, encryptionDecryptionKey, and RSA key pairs. Contact: support@mfcentral.com

---

## RTA integration: CAMS and KFintech

India's mutual fund RTAs split approximately **68% (CAMS)** and **32% (KFintech)** market share, together servicing 100% of AMCs.

### CAMS integration options

**edge360 for Distributors:** Comprehensive platform for ARN-empaneled distributors offering transaction initiation, live status tracking, brokerage management, portfolio viewing, and statement generation. Used by ~4,000 intermediaries processing ~5,000 financial transactions daily.
- **Access:** edge360.camsonline.com
- **Contact:** edge360@camsonline.com, 044-6125-0000

**CAMSPay:** Payment gateway with eNACH/mNACH mandate registration, UPI autopay integration, TPV (Third Party Validation), and T-day direct funding. PCI DSS Level 1 certified with fully API-based architecture.

**CAMSKRA:** 100+ APIs for KYC validation including Aadhaar OTP, DigiLocker, CKYC integration, facial recognition, and OCR. Low-code integration with partner tech stacks.

**CAMS WealthServ360:** Digital onboarding platform for AIFs/PMS with 100% digital flows, multi-mode e-sign, multi-custody integration, and 10-day go-live for integrations.
- **Contact:** productsales@camsonline.com

### KFintech integration options

**IRIS Super Application:** India's first distributor super application supporting multiple asset classes (Mutual Funds, NPS, AIFs, FDs). Features employee hierarchy management with EUIN tracking, AUM tracking at employee level, and seamless API integration.
- **URL:** iris.kfintech.com

**DSS (Distributor Services System):** Provides folio details, brokerage reports, KYC status checks, transaction status, capital gains reports, and various MIS in CSV/Text formats.
- **URL:** dss.kfintech.com

**Technical Architecture:** REST APIs with JSON, mobile-first microservices, cloud-ready frameworks, Android/iOS SDK support.

**Contact:** 
- Distributor support: 1800-571-6677
- General: +91-40-67162222

### CAMS vs KFintech AMC coverage

**CAMS services:** SBI MF, HDFC MF, ICICI Prudential, Kotak MF, Aditya Birla Sun Life, DSP, Franklin Templeton, HSBC, PGIM India, Sundaram, PPFAS (10 of top 15 AMCs)

**KFintech services:** Axis MF, Nippon India, Mirae Asset, Edelweiss, Baroda BNP Paribas, LIC MF, Motilal Oswal, Quant MF, Groww MF (17 of last 20 new AMCs)

**Recommendation:** Use MFCentral for unified portfolio data to avoid dual RTA integration complexity.

---

## KYC and KRA integration

### Available KRAs in India (5 SEBI-registered)

| KRA | Parent Organization | Website | Best For |
|-----|---------------------|---------|----------|
| CVL KRA | CDSL Ventures | cvlkra.com | Largest repository |
| CAMS KRA | CAMS | camskra.com | MF-focused, AI-embedded |
| KFintech KRA | KFin Technologies | kfinkra.in | Good MF coverage |
| NDML KRA | NSDL subsidiary | kra.ndml.in | Biometric support |
| DotEx KRA | NSE subsidiary | nseindia.com | Exchange integration |

All KRAs are **interconnected and interoperable** per SEBI regulations - KYC completed on one is valid across all. Technology providers typically need to partner with SEBI-registered intermediaries (AMC, RIA, Broker) to access KRA APIs.

### KYC verification workflow

```
Step 1: PAN Input → Check any KRA via unified API
        ├─ KYC Validated → Allow investment (fully compliant)
        ├─ KYC Registered → Check Aadhaar validation status
        ├─ KYC On Hold → Collect missing documents
        └─ Not Found → Initiate new KYC

Step 2: If needed, check CKYC (CERSAI - 70+ crore records)
        ├─ Found → Download, validate, allow investment
        └─ Not Found → Initiate eKYC

Step 3: eKYC Options
        ├─ Aadhaar OTP: Limit ₹50,000/MF/year
        ├─ Video KYC (V-CIP): Unlimited investments
        └─ Physical KYC: Offline submission
```

### eKYC and Video KYC integration

**Aadhaar OTP eKYC:** Investment limit of ₹50,000 per MF per year without In-Person Verification. Process involves UIDAI OTP verification, eKYC data download (encrypted), form confirmation, and eSign.

**Video KYC (V-CIP):** SEBI-compliant process requiring live video with liveness detection, face match with UIDAI photo, geo-tagging, timestamping, and random Q&A verification. Providers include Pixl Video KYC, VideoSDK (~90% success rate), and Fintech Primitives.

### CKYC integration

Central KYC managed by CERSAI under PMLA with 14-digit CKYC number (KIN). Integration methods include real-time API, bulk upload (max 25MB), and SFTP. Operations: Search (PAN/Aadhaar/KIN), Download, Upload, Update.

**Providers:** Arya.ai, TrackWizz, Protean, CloudBankin, Surepass, PixDynamics

### Unified KRA API option

**cvl-kra.in** offers single API accessing all 5 KRAs with JSON REST format and sandbox testing. Pricing: ₹850/month for 200 calls, ₹3,600/month for 1,000 calls.

---

## Payment integration

### BSE payment gateway through ICCL

ICCL (Indian Clearing Corporation Ltd.) handles payment settlement for BSE StAR MF with **no direct fund handling by distributors**.

**Direct Pay Banks (T-day settlement):** Axis Bank, ICICI Bank, IDBI Bank, Kotak Mahindra Bank, SBI, Yes Bank

**Settlement Timelines:**
- L0 transactions (Liquid/Overnight): Payment to ICCL before 1:20 PM for T-1 NAV
- Normal category: Full payment by 9:30 AM on T+1

### NACH and eMandate for SIPs

**Mandate Parameters:**
- Maximum amount: ₹1 crore (NACH rules)
- eSign-based mandates: Typically capped at ₹1 lakh
- Maximum validity: 40 years or "until cancelled"
- Physical mandate registration: 25-30 calendar days
- eMandate (digital): Few hours to 2 days

**eMandate Authorization Modes:**
1. **Aadhaar eSign:** OTP-based, requires PAN-Aadhaar linkage
2. **Net Banking:** Bank credentials and OTP
3. **Debit Card:** Card number, PIN, expiry, OTP

**NPCI Integration Options:**
- Direct integration requires own utility code and sponsor bank
- Through BSE StAR MF uses their infrastructure
- Via payment service providers (Decentro, BillDesk)

### UPI for mutual funds

UPI Autopay accounts for **~45% of new SIP registrations** as of 2025. Default SIP limit of ₹15,000 per transaction without PIN for each debit, with multiple SIPs up to ₹1 lakh per day. Mandatory 24-48 hour pre-debit notification via SMS, email, and UPI app.

**Setup:** Select UPI Autopay → Enter VPA → Approve mandate in UPI app → Confirm SIP details

---

## Regulatory requirements

### Technology provider registrations

**BSE StAR MF MFD Registration:** Requires valid AMFI ARN, KYC compliance, and documentation including identity/address proof, PAN, ARN certificate, AMC empanelment letters, and bank details.

**AMFI ARN Registration Process:**
1. Pass NISM Series V-A: Mutual Fund Distributors Exam (1-2 weeks preparation)
2. Register on AMFI website with NISM certificate
3. Complete KYD (Know Your Distributor) with CAMS
4. Pay prescribed fees
5. Receive ARN (2-4 weeks total)

**ARN Validity:** 3 years with renewal required. EUIN (Employee Unique Identification Number) mandatory for sales personnel.

### SEBI compliance framework

**Key Regulations:**
- SEBI (Mutual Funds) Regulations, 1996 (amended March 2025)
- New SEBI (Mutual Funds) Regulations, 2026 effective April 1, 2026
- CIR/MRD/DSA/32/2013: MFDs cannot handle pay-in/payout of funds

**Platform Requirements:**
- No direct handling of investor funds (all through ICCL)
- KYC norms compliance
- Transaction records retention: **5 years minimum**
- Risk disclosure in all communications

### SEBI Cybersecurity Framework (CSCRF)

Effective January/April 2025, the framework classifies entities with proportionate requirements:

| Category | Key Requirements |
|----------|------------------|
| MIIs | Full compliance, CISO reporting to MD/CEO |
| Qualified REs | ISO 27001, half-yearly VAPT |
| Mid-size REs | Annual VAPT, comprehensive audits |
| Small-size REs | Proportionate compliance |

**Mandatory Elements:** Board-approved cybersecurity policy, VAPT by CERT-In empanelled auditors, Cyber Capability Index assessment, incident response plan, data localization compliance.

### Digital Personal Data Protection Act, 2023

Full compliance required by **May 2027** under DPDP Rules 2025.

**Key Obligations:**
- Clear, informed, specific consent with itemized data description
- Privacy notice in English or 22 scheduled languages
- Data principal rights: access, correction, erasure, portability
- Personal data breach reporting (all breaches)
- Retention only for specified purpose period
- **Penalties:** Up to ₹250 crore for violations

---

## Implementation roadmap for Sparrow Money

### Phase 1: Foundation (3-4 months)

**Month 1-2:**
- Complete AMFI ARN registration for company
- Register as MFD with BSE StAR MF (₹15,000 + GST)
- Obtain test environment credentials
- Set up Node.js project with NestJS framework
- Implement KRA integration for KYC status checks (use unified API initially)

**Month 2-3:**
- Build UCC creation flow with BSE StAR MF SOAP integration
- Integrate single payment gateway (Razorpay recommended)
- Implement lump sum purchase and redemption flows
- Basic portfolio view using BSE reporting APIs

**Month 3-4:**
- Complete BSE StAR MF certification demo
- Go-live with basic MVP functionality
- Launch employee management for distributor's team

### Phase 2: Core features (2-3 months)

**Month 4-5:**
- SIP functionality with NACH mandate registration
- Switch, SWP, STP transaction support
- MFCentral integration for consolidated portfolio data
- Capital gains reporting

**Month 5-6:**
- UPI Autopay integration for SIPs
- Goal-based investing features
- NAV data integration from AMFI feeds
- Mobile app development (React Native)

### Phase 3: Advanced features (2-3 months)

**Month 6-8:**
- Video KYC (V-CIP) for unlimited investments
- Multiple payment gateway options
- Advanced analytics and reporting
- White-label capabilities for sub-distributors

### Technical architecture for Node.js

**Recommended Stack:**
```
Frontend: React.js / React Native (mobile)
Backend: NestJS (Node.js + TypeScript)
Database: PostgreSQL (transactions, ACID) + Redis (cache, sessions)
Queue: Redis Queue or RabbitMQ (async processing)
BSE Integration: Custom SOAP client (strong-soap npm package)
Monitoring: Prometheus + Grafana + Sentry
Deployment: AWS/GCP with Kubernetes
```

**Microservices Architecture:**
```
┌─────────────────────────────────────────────────────┐
│                 API Gateway (NestJS)                │
│           Rate Limiting, JWT Auth, Helmet           │
└─────────────────────────────────────────────────────┘
                          │
    ┌─────────────────────┼─────────────────────┐
    │                     │                     │
┌───▼───┐           ┌─────▼─────┐         ┌────▼────┐
│Identity│           │  Orders   │         │ Payment │
│Service │           │  Service  │         │ Service │
│KYC/Auth│           │SIP/Lumpsum│         │NACH/UPI │
└────────┘           └───────────┘         └─────────┘
    │                     │                     │
    └─────────────────────┼─────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
    ┌────▼────┐     ┌─────▼─────┐    ┌────▼────┐
    │BSE StAR │     │ MFCentral │    │Reporting│
    │Integration│   │ /RTA Data │    │ Service │
    └──────────┘    └───────────┘    └─────────┘
```

**NestJS Security Implementation:**
```typescript
// Rate Limiting
@Module({
  imports: [
    ThrottlerModule.forRoot({ ttl: 60, limit: 100 }),
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})

// Required packages
// helmet (HTTP headers)
// @nestjs/throttler (rate limiting)
// passport-jwt (authentication)
// class-validator (input validation)
// strong-soap (BSE SOAP client)
```

---

## Existing players and reference implementations

### Platform comparison

| Platform | Approach | Best For |
|----------|----------|----------|
| **Fintech Primitives** | Full PaaS with REST APIs | Quick MVP, 70+ partners |
| **Tarrakki** | All 41 AMCs via single API | 1-month vs 6-month DIY |
| **Investwell** | NSE integration, hybrid online/offline | Traditional distributors |
| **Wealth Elite** | White-labeled SaaS | Sub-broker management |
| **AssetPlus** | 17,000+ MFDs | Proprietary research |

### Available open-source resources

**Python (Reference):** `github.com/utkarshohm/mf-platform-bse` (91 stars) - Built by AMFI-licensed distributor, processed ₹50 lacs in transactions using Zeep SOAP client and Selenium.

**BSE API Documentation:** `github.com/amitwilson/BSEStarMF_API` - Community documentation for poorly documented APIs.

**Node.js NAV Packages:**
- `amfinav` - Fetch NAV data from AMFI
- `india-mutual-fund-info` - Historical NAV data
- MFapi.in - Free REST API with Swagger UI

**Postman Collection:** `postman.com/remiges-tech/bse-starmf-v2-api/overview`

### Build vs buy decision

| Approach | Timeline | Cost Profile | Best For |
|----------|----------|--------------|----------|
| Fintech Primitives/Tarrakki | 1-3 months | Higher ongoing fees | Quick market entry |
| Direct BSE Integration | 6-12 months | Higher upfront, lower ongoing | Scale and control |
| Hybrid (aggregator + custom) | 3-6 months | Moderate | Balanced approach |

---

## Key contacts and resources

**BSE StAR MF:**
- API Support: navaneetha.krishnan@bsetech.in, aqsa.shaikh@bsetech.in
- Platform: https://www.bsestarmf.in
- Help Desk: +91-22-6136-3151

**MFCentral:** support@mfcentral.com | https://www.mfcentral.com

**CAMS:** edge360@camsonline.com, productsales@camsonline.com | 044-6125-0000

**KFintech:** 1800-571-6677 (distributor) | +91-40-67162222

**MFU:** https://www.mfuindia.com (contact via website)

---

## Conclusion: Critical success factors

Building Sparrow Money requires navigating a complex ecosystem of **8-12 distinct integrations** spanning transaction platforms, RTAs, KYC registries, and payment infrastructure. The most efficient path prioritizes **BSE StAR MF for transactions** and **MFCentral for portfolio data**, avoiding the complexity of dual RTA integration.

Three factors will determine success: First, **invest heavily in error handling and reconciliation** - BSE StAR MF's SOAP API has known challenges with transaction status tracking and payment reconciliation. Second, **build robust audit trails from day one** - SEBI's 5-year retention requirement and CSCRF compliance mandate comprehensive logging. Third, **consider starting with Fintech Primitives or Tarrakki for rapid MVP** while planning for direct BSE integration at scale - this hybrid approach balances speed-to-market with long-term control.

The total investment spans ₹15,000 (BSE registration) plus development costs, with **MVP achievable in 3-4 months** and full platform capability in 6-12 months. The regulatory landscape continues evolving with new SEBI MF Regulations 2026 and DPDP Act compliance deadlines - building flexibility into the architecture will be essential for long-term success.