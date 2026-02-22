# Sparrow Invest - Smart Portfolio Manager

## Project Overview
AI-powered mutual fund portfolio management platform with goal-aligned recommendations. The project consists of multiple platforms and services:
- **Next.js Web App** - Admin dashboard and user portal (local: 3800, dev: 3502, prod: 3500)
- **iOS Consumer App** - Native SwiftUI mobile app for consumers (ios-consumer)
- **iOS FA App** - Native SwiftUI mobile app for Financial Advisors (ios-fa)
- **Android Consumer App** - Native Kotlin/Jetpack Compose app for consumers (android-consumer)
- **Android FA App** - Native Kotlin/Jetpack Compose app for Financial Advisors (android-fa)
- **Backend** - NestJS API service (local: 3801, dev server: 3501)
- **ML Service** - Machine learning recommendation engine

## Project Structure
```
sparrow-invest/
├── platforms/
│   ├── web/                # Next.js web application
│   │   ├── src/
│   │   │   ├── components/ # Reusable React components
│   │   │   ├── context/    # React context providers
│   │   │   ├── pages/      # Next.js pages (Pages Router)
│   │   │   ├── services/   # API services
│   │   │   ├── styles/     # Global CSS and Tailwind
│   │   │   └── utils/      # Utility functions and constants
│   │   └── package.json
│   ├── ios-consumer/        # iOS consumer app (SwiftUI)
│   │   └── SparrowInvest/
│   │       ├── App/        # App entry point
│   │       ├── Models/     # Data models
│   │       ├── Views/      # SwiftUI views
│   │       ├── Components/ # Reusable components
│   │       ├── Services/   # API and state services
│   │       └── Utilities/  # Helpers and theme
│   ├── ios-fa/              # iOS FA app (SwiftUI)
│   │   └── SparrowInvestFA/
│   │       ├── App/        # App entry point
│   │       ├── Models/     # Data models
│   │       ├── Views/      # SwiftUI views
│   │       ├── Components/ # Reusable components
│   │       ├── Services/   # API and state services
│   │       └── Utilities/  # Helpers and theme
│   ├── android-consumer/    # Android consumer app (Kotlin/Compose)
│   │   └── app/src/main/java/com/sparrowinvest/consumer/
│   └── android-fa/         # Android FA app (Kotlin/Compose)
│       └── app/src/main/java/com/sparrowinvest/fa/
│           ├── ui/         # Compose UI (screens, components, navigation)
│           ├── data/       # Models, repositories
│           ├── core/       # Network, DI modules
│           └── MainActivity.kt
├── backend/                # NestJS API service (local: 3801, dev: 3501)
├── ml-service/             # ML recommendation engine
├── proto/                  # Protocol buffer definitions
├── docs/                   # Documentation
│   ├── design/            # Design guidelines
│   ├── ios/               # iOS-specific docs
│   └── phase-2/           # Phase 2 implementation
└── archived/              # Archived code (old mobile-v1)
```

## Frequently Used Commands

### Web App (Next.js)
- **Dev server**: `cd platforms/web && npm run dev`
- **Build**: `cd platforms/web && npm run build`
- **Lint**: `cd platforms/web && npm run lint`

### iOS Consumer App (SwiftUI)
- **Open in Xcode**: `open platforms/ios-consumer/SparrowInvest.xcodeproj` (or use XcodeGen with project.yml)
- **Generate project**: `cd platforms/ios-consumer && xcodegen generate`
- **Build**: `xcodebuild -project platforms/ios-consumer/SparrowInvest.xcodeproj -scheme SparrowInvest -destination 'platform=iOS Simulator,name=iPhone 17 Pro,OS=26.2' build`
- **Install & Run**: `xcrun simctl install "iPhone 17 Pro" <path-to-app> && xcrun simctl launch "iPhone 17 Pro" com.sparrowinvest.app`

### iOS FA App (SwiftUI)
- **Open in Xcode**: `open platforms/ios-fa/SparrowInvestFA.xcodeproj` (or use XcodeGen with project.yml)
- **Generate project**: `cd platforms/ios-fa && xcodegen generate`
- **Build**: `xcodebuild -project platforms/ios-fa/SparrowInvestFA.xcodeproj -scheme SparrowInvestFA -destination 'platform=iOS Simulator,name=iPhone 17 Pro,OS=26.2' build`

### Android FA App (Kotlin/Compose)
- **Build**: `cd platforms/android-fa && ./gradlew assembleDebug`
- **Install**: `adb install -r platforms/android-fa/app/build/outputs/apk/debug/app-debug.apk`
- **Run**: `adb shell am start -n com.sparrowinvest.fa/.MainActivity`
- **Build & Install**: `cd platforms/android-fa && ./gradlew installDebug`

> **Note**: Requires `JAVA_HOME` pointing to Android Studio's JDK:
> `export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"`

### Backend
- **Dev server**: `cd backend && npm run start:dev`
- **Build**: `cd backend && npm run build`
- **Unit tests**: `cd backend && npm test`
- **Test coverage**: `cd backend && npm run test:cov`
- **Database migrate**: `cd backend && npm run db:migrate`
- **Database seed**: `cd backend && npm run db:seed`
- **Seed all data**: `cd backend && npm run db:seed:all`
- **Prisma Studio**: `cd backend && npm run db:studio`
- **Trigger enrichment**: Batch job `scheme_enrichment` or direct: `SchemeEnrichmentService.enrichAll()`
- **Trigger metrics recalc**: `POST /api/v1/funds/live/sync/recalculate` (authenticated)

### Docker (Local Dev)
- **Start services**: `docker compose -f docker-compose.dev.yml up -d`
- **Stop services**: `docker compose -f docker-compose.dev.yml down`
- **Stop + wipe data**: `docker compose -f docker-compose.dev.yml down -v`
- **View logs**: `docker compose -f docker-compose.dev.yml logs -f`

### ML Service
- **Start**: `cd ml-service && python -m app.main`

## Code Style & Conventions

- Use TypeScript for all new code
- 2-space indentation
- Single quotes for strings
- No semicolons (follow existing codebase style)
- Use functional components with hooks
- Prefer named exports over default exports for utilities

## Path Aliases

### Web App (tsconfig.json in platforms/web)
- `@/components/*` → `src/components/*`
- `@/context/*` → `src/context/*`
- `@/services/*` → `src/services/*`
- `@/utils/*` → `src/utils/*`
- `@/styles/*` → `src/styles/*`

### iOS App
Uses SwiftUI with standard Swift package structure in `platforms/ios-consumer/SparrowInvest/`

## Important Patterns

### Theming
- Web: Class-based dark mode with CSS custom properties (`:root.dark`)
- iOS: SwiftUI native theming with AppTheme utility
- Both support system preference detection and manual toggle

### API Integration
- MFAPI.in for Indian mutual fund NAV data
- Web API services in `platforms/web/src/services/`
- iOS API services in `platforms/ios-consumer/SparrowInvest/Services/`

### Subdomain Portal Separation
- `sparrow-invest.com` → Landing page only (login/advisor/admin routes blocked, not yet public)
- `admin.sparrow-invest.com` → Admin portal only (advisor routes blocked)
- `localhost:3800` → Local dev frontend (full access, no restrictions)
- `localhost:3502` → Dev server frontend (full access, no restrictions)
- Implemented via Next.js edge middleware (`platforms/web/middleware.ts`) reading `Host` header
- Defense-in-depth: client-side hostname guards in `AdminLayout.tsx`, `AdvisorLayout.tsx`, and `index.tsx`
- Env vars `NEXT_PUBLIC_APP_HOSTNAME` / `NEXT_PUBLIC_ADMIN_HOSTNAME` control behavior; unset = dev mode
- **Landing page status**: "Launching Soon" badges replace login/get-started buttons (not open to public)

### Deployment Architecture
- **Local** (`dev` branch): full stack on ports **3800** (frontend) + **3801** (backend) + Docker services on 38xx
- **Prod** (`main` branch): frontend-only on port **3500**, serves landing page via Cloudflare tunnel (`sparrow-invest.com`)
- **Dev** (`dev` branch): full stack on ports **3502** (frontend) + **3501** (backend)
- Cloudflare tunnel (`sparrow-tunnel` PM2 process) routes `sparrow-invest.com` → `localhost:3500` (prod)
- Deploy prod: `git push origin main` → `ssh server` → build frontend manually, `pm2 restart sparrow-invest-prod`
- Deploy dev: `ssh server "/home/ved/deploy.sh sparrow-invest dev"` (builds both backend + frontend)
- **Note**: `deploy.sh` for prod fails on backend build (no DATABASE_URL) — build frontend directly instead
- **Prod safety**: No backend runs on prod — no `.env`, no `DATABASE_URL`, no database. Only the `sparrow_dev` database exists (used by dev backend on port 3501). When prod backend is needed, create a `sparrow_prod` database and `backend/.env` on the prod server path.
- **Firewall**: Ports 3500, 3501, 3502 restricted to localhost only via UFW (`127.0.0.1`)

### State Management
- Web: React Context API (no Redux), localStorage for persistence
- iOS: SwiftUI @Observable stores, UserDefaults for persistence

## Key Files

### Web App
- `platforms/web/middleware.ts` - Edge middleware for subdomain-based portal separation
- `platforms/web/src/pages/_app.tsx` - Next.js app wrapper with ThemeProvider
- `platforms/web/src/context/ThemeContext.tsx` - Web theme management
- `platforms/web/src/utils/v4-colors.ts` - V4 design system colors

### iOS Consumer App
- `platforms/ios-consumer/SparrowInvest/App/SparrowInvestApp.swift` - App entry point
- `platforms/ios-consumer/SparrowInvest/App/ContentView.swift` - Main content view
- `platforms/ios-consumer/SparrowInvest/Services/APIService.swift` - API integration
- `platforms/ios-consumer/SparrowInvest/Services/AuthManager.swift` - Authentication
- `platforms/ios-consumer/SparrowInvest/Services/FamilyStore.swift` - Family portfolio & client type
- `platforms/ios-consumer/SparrowInvest/Services/AdvisorStore.swift` - Advisor assignment management
- `platforms/ios-consumer/SparrowInvest/Views/Common/MainTabView.swift` - Main tab container, data loading
- `platforms/ios-consumer/SparrowInvest/Views/Home/HomeView.swift` - Dashboard with quick actions
- `platforms/ios-consumer/SparrowInvest/Views/Invest/ManagedInvestmentView.swift` - FA trade request form
- `platforms/ios-consumer/SparrowInvest/Models/TradeRequest.swift` - Trade request models
- `platforms/ios-consumer/SparrowInvest/Utilities/AppTheme.swift` - Theme management

### iOS FA App
- `platforms/ios-fa/SparrowInvestFA/App/SparrowInvestFAApp.swift` - App entry point
- `platforms/ios-fa/SparrowInvestFA/App/ContentView.swift` - Main content view

### Android FA App
- `platforms/android-fa/app/src/main/java/com/sparrowinvest/fa/MainActivity.kt` - App entry point
- `platforms/android-fa/app/src/main/java/com/sparrowinvest/fa/ui/navigation/NavGraph.kt` - Navigation setup
- `platforms/android-fa/app/src/main/java/com/sparrowinvest/fa/ui/navigation/Screen.kt` - Route definitions
- `platforms/android-fa/app/src/main/java/com/sparrowinvest/fa/core/network/ApiService.kt` - Retrofit API interface
- `platforms/android-fa/app/src/main/java/com/sparrowinvest/fa/data/model/Transaction.kt` - FATransaction model
- `platforms/android-fa/app/src/main/java/com/sparrowinvest/fa/data/repository/TransactionRepository.kt` - Transaction data layer
- `platforms/android-fa/app/src/main/java/com/sparrowinvest/fa/ui/transactions/TransactionsScreen.kt` - Transactions UI
- `platforms/android-fa/app/src/main/java/com/sparrowinvest/fa/ui/transactions/PlatformWebViewScreen.kt` - BSE/MFU WebView
- `platforms/android-fa/app/src/main/java/com/sparrowinvest/fa/ui/clients/ClientDetailScreen.kt` - Client details

## CAS PDF Import (CAMS/KFintech Portfolio Ingestion)

Users upload password-protected CAS PDFs from CAMS/KFintech RTAs to import mutual fund portfolio data.

### Architecture
```
Frontend → NestJS Backend (POST /api/v1/cas/import) → ML Service (POST /api/v1/cas/parse via casparser)
```

### Backend Module
- **Location**: `backend/src/cas-import/` (module, controller, service, DTO)
- **Module**: `CasImportModule` imported in `app.module.ts`
- **DB Model**: `CASImport` in `schema.prisma` (tracks import status, investor info, counts)

### ML Service
- **Dependency**: `casparser==0.8.1` (MIT-licensed pdfminer backend)
- **Endpoint**: `POST /api/v1/cas/parse` (multipart: file + password)
- **Venv**: Python 3.12 at `ml-service/venv/`

### CAS API Endpoints
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/v1/cas/import` | POST | Upload CAS PDF (multipart: file + password + optional clientId) |
| `/api/v1/cas/imports` | GET | List logged-in user's CAS imports (includes client name) |
| `/api/v1/cas/imports/:clientId` | GET | List CAS imports for a specific FA client |

### CAS Frontend Pages
| Page | Path | Purpose |
|------|------|---------|
| CAS Imports (Management) | `/advisor/cas-imports` | All imports dashboard with status/filters |
| Import CAS (Upload) | `/advisor/cas-import` | Upload form with client selector |
| Import Portfolio (Self) | `/import-portfolio` | Self-service user CAS upload |

### Import Flows
- **FA flow** (clientId provided): Upserts `FAHolding` + creates `FATransaction` records
- **Self-service flow** (no clientId): Upserts `Folio` + `Holding` records
- **ISIN lookup**: Tries `SchemePlan.isin` first, falls back to `mfapiSchemeCode` matching AMFI code
- **CAS password**: Typically PAN + DOB in DDMMYYYY format (auto-filled for FA clients)

## BSE StAR MF Integration

Full BSE StAR MF API integration for real mutual fund transactions via a partner MFD.

### Backend Module
- **Location**: `backend/src/bse-star-mf/` (~54 files)
- **Module**: `BseStarMfModule` imported in `app.module.ts`
- **Mock mode**: `BSE_MOCK_MODE=true` in `.env` for local dev (no BSE UAT needed)

### BSE Database Models (Prisma)
| Model | Purpose |
|-------|---------|
| `BsePartnerCredential` | Encrypted BSE credentials per advisor |
| `BseSessionToken` | Cached auth tokens with TTL |
| `BseUccRegistration` | FAClient → BSE UCC client mapping |
| `BseMandate` | Mandate records (XSIP/ISIP/NetBanking) |
| `BseOrder` | All BSE orders (purchase, redemption, SIP, etc.) |
| `BseChildOrder` | SIP/XSIP installment records |
| `BsePayment` | Payment records and status |
| `BseApiLog` | Sanitized audit log of BSE API calls |
| `BseSchemeMaster` | Scheme reference data |
| `BseBankMaster` | Bank codes for payment modes |

### BSE API Endpoints
| Route | Purpose |
|-------|---------|
| `POST /api/v1/bse/credentials` | Set BSE partner credentials |
| `POST /api/v1/bse/credentials/test` | Test BSE connection |
| `POST /api/v1/bse/ucc/:clientId/register` | Register client UCC |
| `POST /api/v1/bse/ucc/:clientId/fatca` | Upload FATCA |
| `POST /api/v1/bse/mandates` | Register mandate |
| `POST /api/v1/bse/orders/purchase` | Place purchase order |
| `POST /api/v1/bse/orders/redeem` | Place redemption |
| `POST /api/v1/bse/orders/switch` | Place switch order |
| `POST /api/v1/bse/payments/:orderId` | Initiate payment |
| `POST /api/v1/bse/systematic/sip` | Register SIP |
| `POST /api/v1/bse/systematic/xsip` | Register XSIP |
| `GET /api/v1/bse/scheme-master` | Search BSE schemes |

### BSE Frontend Pages
| Page | Path |
|------|------|
| BSE Setup | `/advisor/bse/setup` |
| BSE Clients (UCC) | `/advisor/bse/clients` |
| UCC Registration | `/advisor/bse/clients/[id]/register` |
| BSE Orders | `/advisor/bse/orders` |
| Order Detail | `/advisor/bse/orders/[id]` |
| BSE Mandates | `/advisor/bse/mandates` |
| Mandate Detail | `/advisor/bse/mandates/[id]` |
| BSE Reports | `/advisor/bse/reports` |
| Scheme Browser | `/advisor/bse/scheme-master` |

### BSE Components (`components/bse/`)
- `BseOrderPlacementModal` — 4-type order form (purchase/redeem/switch/spread)
- `BsePaymentModal` — Payment mode selection (DIRECT/NODAL/NEFT/UPI)
- `BseSchemePicker` — Autocomplete scheme search with 300ms debounce
- `BseStatusBadge` — Color-coded status pills (28 statuses)
- `BseOrderTimeline` — Horizontal lifecycle visualization
- `MandateRegistrationForm` — Mandate type, amount, bank, dates
- `UccRegistrationForm` — 5-step registration wizard

### BSE Cron Jobs
| Job | Schedule | Purpose |
|-----|----------|---------|
| Mandate status poll | Every 30 min | Poll BSE for pending mandates |
| Order status poll | Every 15 min | Poll BSE for pending orders |
| Allotment sync | Weekdays 9pm | Nightly allotment reconciliation |
| Scheme master sync | Sunday 2am | Weekly scheme data refresh |

### BSE Notes
- Database uses `prisma db push` (no migrations directory)
- BSE credentials encrypted with AES-256-GCM at rest
- Dual protocol: SOAP 1.2 (legacy) + REST/JSON (newer endpoints)
- `bseApi` namespace in `services/api.ts` (~50 endpoint methods)
- See `docs/bse-star-mf-integration.md` for full reference

## NSE NMF Integration

Full NSE NMF (MFSS) API integration as a second exchange platform alongside BSE StAR MF.

### Backend Module
- **Location**: `backend/src/nse-nmf/` (~40 files)
- **Module**: `NseNmfModule` imported in `app.module.ts`
- **Mock mode**: `NMF_MOCK_MODE=true` in `.env` for local dev (no NSE UAT needed)
- **Architecture**: Separate vertical slice — independent module, no shared base classes with BSE

### NSE vs BSE Key Differences
- **Protocol**: REST/JSON only (no SOAP)
- **Auth**: Stateless per-request AES-128-CBC header (no session tokens)
- **Batch support**: Up to 50 records per request
- **SIP Pause/Resume**: Built-in (`XSIP_PAUSE` endpoint)
- **eKYC**: Built-in registration (not available in BSE)
- **Payment modes**: 6 modes (MANDATE/CHEQUE/UPI/NETBANKING/RTGS/NEFT)

### NSE Database Models (Prisma)
| Model | Purpose |
|-------|---------|
| `NsePartnerCredential` | Encrypted NSE credentials per advisor |
| `NseUccRegistration` | FAClient → NSE UCC mapping (183 fields) |
| `NseMandate` | eNACH + physical mandate records |
| `NseOrder` | All NSE orders (purchase, redemption, switch) |
| `NseChildOrder` | SIP/XSIP installment records |
| `NsePayment` | Payment records (6 modes) |
| `NseApiLog` | Sanitized audit log of NSE API calls |
| `NseSchemeMaster` | NSE scheme reference data |
| `NseSystematicRegistration` | SIP/XSIP/STP/SWP registrations |

### NSE API Endpoints
| Route | Purpose |
|-------|---------|
| `POST /api/v1/nmf/credentials` | Set NSE partner credentials |
| `POST /api/v1/nmf/credentials/test` | Test NSE connection |
| `POST /api/v1/nmf/ucc/:clientId/register` | Register client UCC (183 fields) |
| `POST /api/v1/nmf/ucc/:clientId/fatca` | Upload FATCA |
| `POST /api/v1/nmf/ucc/:clientId/ekyc` | Initiate eKYC |
| `POST /api/v1/nmf/mandates` | Register mandate (eNACH/Physical) |
| `POST /api/v1/nmf/orders/purchase` | Place purchase order |
| `POST /api/v1/nmf/orders/redeem` | Place redemption |
| `POST /api/v1/nmf/orders/switch` | Place switch order |
| `POST /api/v1/nmf/payments/:orderId` | Initiate payment (6 modes) |
| `POST /api/v1/nmf/payments/callback` | Payment callback webhook (public) |
| `POST /api/v1/nmf/systematic/sip` | Register SIP |
| `POST /api/v1/nmf/systematic/xsip` | Register XSIP (mandate-based, step-up) |
| `POST /api/v1/nmf/systematic/stp` | Register STP |
| `POST /api/v1/nmf/systematic/swp` | Register SWP |
| `POST /api/v1/nmf/systematic/:id/pause` | Pause SIP/XSIP |
| `POST /api/v1/nmf/systematic/:id/resume` | Resume SIP/XSIP |
| `POST /api/v1/nmf/reports/:reportType` | Generate NSE reports (30+ types) |
| `POST /api/v1/nmf/uploads/:type` | File uploads (7 types, base64) |
| `POST /api/v1/nmf/utilities/kyc-check` | KYC status check by PAN |

### NSE Frontend Pages
| Page | Path |
|------|------|
| NMF Setup | `/advisor/nmf/setup` |
| NMF Clients (UCC) | `/advisor/nmf/clients` |
| UCC Registration | `/advisor/nmf/clients/[id]/register` |
| NMF Orders | `/advisor/nmf/orders` |
| Order Detail | `/advisor/nmf/orders/[id]` |
| NMF Mandates | `/advisor/nmf/mandates` |
| Mandate Detail | `/advisor/nmf/mandates/[id]` |
| NMF Systematic | `/advisor/nmf/systematic` |
| NMF Schemes | `/advisor/nmf/scheme-master` |
| NMF Reports | `/advisor/nmf/reports` |

### NSE Components (`components/nmf/`)
- `NmfStatusBadge` — Color-coded status pills for orders, mandates, systematic, payments
- `NmfOrderTimeline` — Horizontal 9-step lifecycle visualization
- `NmfPaymentModal` — 6 payment mode selection modal
- `NmfOrderPlacementModal` — Purchase/redeem/switch form with NmfSchemePicker
- `NmfSchemePicker` — Autocomplete scheme search querying NSE scheme master

### NSE Cron Jobs
| Job | Schedule | Purpose |
|-----|----------|---------|
| Mandate status poll | Every 30 min | Poll NSE for pending mandates |
| Order status poll | Every 10 min | Poll NSE for pending orders |
| Scheme master sync | Sunday 3am | Weekly scheme data refresh |

### NSE Notes
- NSE credentials encrypted with AES-256-GCM at rest (own key: `NMF_ENCRYPTION_KEY`)
- Per-request auth: AES-128-CBC encrypted `BASIC` header (no session tokens)
- Soft-link bridge: `NseOrder.transactionId` is `String?` (no Prisma FK to FATransaction)
- `nmfApi` namespace in `services/api.ts` (~50 endpoint methods)
- See `docs/nse-nmf-api-reference.md` for full reference

## Scalability Infrastructure

### Redis Caching (`cache-manager@5` + `cache-manager-ioredis-yet`)
- `CacheService` in `common/services/cache.service.ts` — global, no-op fallback if Redis unavailable
- Cached endpoints: `/auth/me/portfolio` (60s), `/advisor/dashboard` (30s), scheme searches (1h)
- Invalidate on writes: `cacheService.del('portfolio:${userId}')`

### Async Order Processing (BullMQ)
- `QueueModule` in `common/queue/queue.module.ts` — provides `BULLMQ_CONNECTION` globally
- BSE orders: `bse-orders` queue → `BseOrderProcessor` (5 concurrency)
- NSE orders: `nse-orders` queue → `NseOrderProcessor` (5 concurrency)
- API logs: `api-logs` queue → `ApiLogProcessor` (10 concurrency, low priority)
- Order placement returns `{ status: 'QUEUED' }` immediately, processes async

### Circuit Breakers (opossum)
- `BseHttpClient` and `NseHttpClient` wrap external API calls
- Opens after 50% failure rate (5+ calls), resets after 60s
- Falls back to `ServiceUnavailableException`

### Production Infrastructure
- `backend/Dockerfile` — multi-stage Node 20 Alpine build
- `docker-compose.prod.yml` — backend (2 replicas), postgres (tuned), redis, pgbouncer
- `backend/ecosystem.config.js` — PM2 cluster mode config
- Log cleanup cron: daily 3am, deletes BSE/NSE/audit logs > 90 days

## Fund Data Pipeline

Data flows in sequence: AMFI sync → NAV backfill → Metrics calculation → Enrichment

### Data Flow
| Step | Service | Batch Job ID | What it does |
|------|---------|-------------|-------------|
| 1. AMFI NAV Sync | `FundSyncService` | `amfi_nav` | Daily NAV from AMFI → `SchemePlanNav` (current) + `SchemePlanNavHistory` (1 record/day) |
| 2. NAV Backfill | `BackfillService` | `fund_nav_backfill` | 5yr history from MFAPI.in → `SchemePlanNavHistory` (tiered: 3mo daily + 3mo-5yr month-end). ~6hrs for 18K funds |
| 3. Metrics Recalc | `MetricsCalculatorService` | `POST /api/v1/funds/live/sync/recalculate` | Computes returns, volatility, Sharpe, Sortino, alpha/beta, max drawdown → `SchemePlanMetrics`. Assigns 1-5 star ratings per category |
| 4. Enrichment | `SchemeEnrichmentService` | `scheme_enrichment` | Fills benchmark, exitLoad, lockinPeriod, transaction flags, provider logos, risk ratings |

### Key Dependencies
- **Star ratings** (`fundRating`): Require 2.5+ years NAV history + metrics recalculation. If null, run backfill then recalculate
- **Risk ratings** (`riskRating`): Category-based fallback via enrichment (no NAV history needed). Volatility-based via metrics (needs 252+ days)
- **Benchmark fund**: UTI Nifty 50 (MFAPI code `120716`) needed for Alpha/Beta calculation

### Enrichment Service (4 phases)
- **Location**: `backend/src/funds/scheme-enrichment.service.ts`
- **Data files**: `backend/src/funds/data/benchmark-map.ts`, `backend/src/funds/data/provider-metadata-map.ts`
- **Phase A**: Category → SEBI benchmark TRI (42 L3 categories)
- **Phase B**: BSE/NSE scheme masters → transaction flags, exitLoad, lockinPeriod (matched by ISIN)
- **Phase C**: Static map → Provider logoUrl, websiteUrl (~44 AMCs)
- **Phase D**: Category → default risk rating 1-5 (SEBI riskometer fallback)
- **Cron**: Sunday 4 AM IST (after BSE 2 AM + NSE 3 AM syncs)

### Batch Jobs System
- **Location**: `backend/src/batch-jobs/` (registry, service, controller, module)
- **Registry**: `batch-jobs.registry.ts` — static array of `BatchJobDefinition` with id, schedule, cronExpression, manualTrigger flag
- **Trigger**: `POST /api/v1/admin/batch-jobs/:jobId/trigger` (requires JWT auth)
- **Dashboard**: `/admin/batch-jobs` — lists all jobs with latest run status, 24h stats
- **Groups**: `fund_sync`, `compliance`, `aum`, `insurance`, `bse`, `nse`
- **Adding a job**: Add to `BATCH_JOBS` array in registry + add switch case in `batch-jobs.service.ts`

## External APIs

### MFAPI.in (Mutual Fund API)
- Base URL: `https://api.mfapi.in`
- Get all funds: `GET /mf`
- Get fund details: `GET /mf/{schemeCode}`
- Returns NAV history for CAGR calculations

## Local Development Setup

**Quick start**: `git clone` → `./setup.sh` → full stack running in minutes.

`setup.sh` handles: pre-flight checks, Docker services, env files, backend deps, DB schema + seeds, frontend deps.

### Port Scheme

| Service | Local (Mac) | Dev Server | Prod Server |
|---------|-------------|------------|-------------|
| Frontend | **3800** | 3502 | 3500 |
| Backend | **3801** | 3501 | -- |
| PostgreSQL | **3832** | 5432 | -- |
| Redis | **3879** | 6379 | -- |
| MinIO API | **3890** | -- | -- |
| MinIO Console | **3891** | -- | -- |

### Key Files
- `docker-compose.dev.yml` (root) — PostgreSQL, Redis, MinIO on 3800-series ports
- `backend/.env.example` → copy to `backend/.env` (defaults match docker-compose.dev.yml)
- `platforms/web/.env.example` → copy to `platforms/web/.env.local`
- `backend/docker-compose.yml` — **DEPRECATED**, uses standard ports that collide with system services

### Environment Files

**Backend** (`backend/.env`) — created from `backend/.env.example`:
```bash
PORT=3801
DATABASE_URL="postgresql://siuser:sipassword@localhost:3832/sparrowinvest_local?schema=public"
REDIS_HOST=localhost
REDIS_PORT=3879
MINIO_PORT=3890
```

**Frontend** (`platforms/web/.env.local`) — created from `platforms/web/.env.example`:
```bash
BACKEND_URL=http://localhost:3801
# NEXT_PUBLIC_APP_HOSTNAME and NEXT_PUBLIC_ADMIN_HOSTNAME unset = dev mode (full access)
```

### Android FA App
- Base URL configured in `core/network/NetworkModule.kt`
- Uses `10.0.2.2:3501` for emulator → localhost backend

## Gotchas & Common Issues

| Issue | Solution |
|-------|----------|
| Android build fails with "Java not found" | Set `JAVA_HOME` to Android Studio's JDK (see commands above) |
| Transactions screen shows JSON error | Ensure `FATransaction` model matches backend `TransactionResponseDto` (camelCase fields) |
| Backend status values mismatch | Backend uses title case (`Pending`, `Completed`), not uppercase (`PENDING`, `EXECUTED`) |
| iOS WebView cookies not persisting | Enable `setAcceptThirdPartyCookies()` on the WebView instance |
| Emulator can't reach backend | Use `10.0.2.2` instead of `localhost` for Android emulator |
| Admin routes 404 in production | Check `NEXT_PUBLIC_APP_HOSTNAME` — middleware blocks `/admin/*` on app subdomain |
| Middleware not running | `middleware.ts` must be at `platforms/web/middleware.ts` (project root, not `src/`) for Pages Router |
| Port 5432/6379 already in use | Use `docker-compose.dev.yml` (root), not `backend/docker-compose.yml` — local dev uses 3800-series ports |
| Backend can't connect to DB | Ensure Docker services are running: `docker compose -f docker-compose.dev.yml up -d` |
| Fund star ratings all null | Need NAV backfill (5yr history) then metrics recalculation. Run `fund_nav_backfill` then `recalculate` |
| Fund risk shows "Unknown" | Run `scheme_enrichment` batch job to populate category-based default risk ratings |
| Batch job trigger 401 | Admin endpoints require JWT auth. For local testing, use `npx ts-node` scripts directly |
| Prisma `upsert` fails on nullable unique keys | Can't use `upsert` when composite `@@unique` includes nullable field — use `findFirst` + `update/create` instead |
| `prisma db push` warns on constraint changes | Adding column to existing unique constraint needs `--accept-data-loss` flag (NULLs are distinct, no actual data loss) |
| BullMQ ioredis type error | BullMQ bundles its own ioredis — type `connection` params as `any`, not `Redis` |
| cache-manager API mismatch | Use `cache-manager@5` with `cache-manager-ioredis-yet@2.x` — use `caching()` not `createCache()` |
| Prisma enum types stale | After adding enum values to `schema.prisma`, run `npx prisma generate` before `tsc` |

---

## Demo Users for Testing

All demo users use the format `firstname.lastname@demo.com` with password `Demo@123`:

| Email | Password | Name | Type | Description |
|-------|----------|------|------|-------------|
| `amit.verma@demo.com` | `Demo@123` | Amit Verma | **Self-service** | No FA, uses brokerage platforms |
| `priya.patel@demo.com` | `Demo@123` | Priya Patel | **Managed** | Patel Family head, has FA advisor |
| `rajesh.sharma@demo.com` | `Demo@123` | Rajesh Sharma | **Managed** | Sharma Family head, has FA advisor |

### FA (Advisor) Demo Users

| Email | Password | Name |
|-------|----------|------|
| `priya.sharma@sparrow-invest.com` | `Advisor@123` | Priya Sharma |
| `arun.mehta@sparrow-invest.com` | `Advisor@123` | Arun Mehta |
| `kavitha.nair@sparrow-invest.com` | `Advisor@123` | Kavitha Nair |

### User Types

1. **Self-service Users** (`clientType: "self"`)
   - Not linked to any Financial Advisor (FA)
   - Quick actions (Invest/Withdraw/SIP) show brokerage platform selection (Zerodha, Groww, etc.)
   - Can browse and research funds independently

2. **Managed Users** (`clientType: "managed"`)
   - Linked to an FA via `FAClient` record with `userId` field
   - Quick actions show `ManagedQuickActionSheet` directing to fund selection
   - Trade requests submitted to FA for execution via `ManagedInvestmentView`
   - Family members visible in portfolio view

### FA Client Families (Database)

**Patel Family:**
- SELF: Priya Patel (linked to `priya.patel@demo.com`)
- SPOUSE: Vikram Patel
- CHILD: Ananya Patel
- PARENT: Harish Patel

**Sharma Family:**
- SELF: Rajesh Sharma (linked to `rajesh.sharma@demo.com`)
- SPOUSE: Sunita Sharma
- CHILD: Arjun Sharma
- PARENT: Kamla Devi Sharma

### FA Portal API Patterns

| Endpoint Pattern | Description |
|------------------|-------------|
| `GET /api/v1/goals` | All goals for logged-in advisor |
| `GET /api/v1/clients/:clientId/goals` | Goals for specific client |
| `GET /api/v1/funds/live/search?q=HDFC` | Fund search (append "Direct Growth" for direct plans) |
| `POST /api/v1/sips/:id/pause` | Pause a SIP |
| `POST /api/v1/sips/:id/resume` | Resume a paused SIP |
| `POST /api/v1/sips/:id/cancel` | Cancel a SIP |
| `GET /api/v1/advisor/dashboard` | Aggregated KPIs, client alerts |
| `GET /api/v1/advisor/action-calendar` | SIP expiries, birthdays, follow-ups, upcoming SIPs |
| `GET /api/v1/advisor/insights` | Portfolio health scores |
| `GET /api/v1/advisor/insights/cross-sell` | Cross-sell gap analysis per client |
| `GET /api/v1/advisor/insights/churn-risk` | Churn risk scoring per client |
| `GET /api/v1/advisor/insights/strategic` | Strategic insights |
| `POST /api/v1/advisor/insights/deep/:clientId` | Deep analysis for a client |
| `GET /api/v1/bi/aum` | AUM overview |
| `GET /api/v1/bi/monthly-scorecard` | MoM comparison (AUM, flows, SIP, clients) |
| `GET /api/v1/bi/revenue-attribution` | Trail income by AMC |
| `GET /api/v1/bi/client-segmentation` | Client tiers (Diamond/Gold/Silver/Bronze) |
| `GET /api/v1/bi/net-flows` | Net flow analysis |
| `GET /api/v1/bi/sip-health` | SIP book health metrics |

### FA Portal Pages & Navigation

The FA sidebar uses collapsible sections (state persisted in localStorage as `fa-sidebar-sections`). Dashboard is pinned at top.

| Section | Pages |
|---------|-------|
| **Pinned** | Dashboard |
| **Clients** | Clients, Pipeline, Command Center, Insights |
| **Transactions** | Transactions, CAS Imports |
| **Research** | Funds, Compare, My Picks, Deep Analysis, Calculators, Reports |
| **BSE StAR MF** | BSE Setup, BSE Clients, BSE Orders, BSE Mandates, BSE Reports |
| **NSE NMF** | NMF Setup, NMF Clients, NMF Orders, NMF Mandates, NMF Systematic, NMF Schemes, NMF Reports |
| **Business** | AUM & Analytics, Commissions, Team, Branches, Compliance |
| **Account** | Settings |

#### Pipeline (`/advisor/pipeline`)
Sales pipeline for prospects/leads. Kanban board + list view with stage management.
- Components: `components/advisor/pipeline/` (PipelineCard, PipelineBoard, PipelineList)
- Uses ProspectFormModal, ConvertToClientModal

#### Command Center (`/advisor/command-center`)
Unified workspace with 3 tabs: Tasks, Activity, Compose.
- **Tasks tab**: System alerts banner (failed SIPs, pending txns, KYC) + CRM task management
- **Activity tab**: Merged timeline of CRM activities + sent communications
- **Compose tab**: Email/WhatsApp sending with templates, bulk send, history
- Components: `components/advisor/command-center/` (TasksTab, ActivityTab, ComposeTab, SystemAlertsBanner)
- Backend guards: CRM + Communications controllers both use `@RequiredPage('/advisor/command-center')`

### FA Portal Components

- **FANotificationProvider**: Must wrap app in `_app.tsx` for toast notifications. Already configured.
- **TransactionFormModal**: Reusable modal for Buy/SIP/Redeem/Switch transactions
- **FACard, FATintedCard, FAInfoTile**: Themed card components for FA Portal

---

## iOS App - User Flow Architecture

### Login & Data Loading Flow

1. User logs in via `AuthManager.loginWithEmail()`
2. `MainTabView.task` triggers `familyStore.loadFromAPI()`
3. API returns `clientType` ("self" or "managed") and optional `advisor` info
4. `FamilyStore` sets/clears `advisor` based on response
5. `MainTabView` calls `advisorStore.setAssignedAdvisor()` or `removeAssignedAdvisor()`

### Key Files for User Type Detection

| File | Purpose |
|------|---------|
| `Services/FamilyStore.swift` | Stores `clientType` and `advisor` info from API |
| `Services/AdvisorStore.swift` | Manages `assignedAdvisorId` and `hasAssignedAdvisor` |
| `Views/Common/MainTabView.swift` | Orchestrates data loading on app launch |
| `Views/Home/HomeView.swift` | `QuickActionsRow` checks `isManagedClient` for flow routing |

### Managed User Investment Flow

1. **HomeView** → Quick action button (Invest/Withdraw/SIP)
2. **ManagedQuickActionSheet** → Shows advisor info, "Browse Funds" button
3. **ExploreView** → User selects a fund
4. **ManagedInvestmentView** → User enters amount, submits trade request
5. **API** → `POST /api/v1/transactions/trade-request` creates `FATransaction` with PENDING status
6. **Confirmation** → User sees success message that request sent to advisor

### Key iOS Files for FA Trade Flow

| File | Purpose |
|------|---------|
| `Models/TradeRequest.swift` | `TradeRequest` and `TradeRequestResponse` models |
| `Services/APIService.swift` | `submitTradeRequest()` and `getMyTradeRequests()` methods |
| `Views/Invest/ManagedInvestmentView.swift` | Investment form for managed users |
| `Views/Home/HomeView.swift` | `ManagedQuickActionSheet` component |

### Backend Endpoints for Trade Requests

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/transactions/trade-request` | POST | Submit trade request to FA |
| `/api/v1/transactions/my-requests` | GET | Get user's trade request history |
| `/api/v1/auth/me/portfolio` | GET | Returns `clientType`, `advisor`, `family` data |

## Available Skills

| Skill | Command | Description |
|-------|---------|-------------|
| **Frontend Design** | `/frontend-design` | Create distinctive, production-grade frontend interfaces with high design quality. Use for building web components, pages, or redesigning existing UI. |
| **Feature Development** | `/feature-dev` | Guided feature development with codebase understanding and architecture focus. |
| **Code Review** | `/code-review` | Review pull requests for bugs, security, and code quality. |
| **CLAUDE.md Revision** | `/revise-claude-md` | Update CLAUDE.md with learnings from the current session. |
| **CLAUDE.md Improver** | `/claude-md-improver` | Audit and improve CLAUDE.md files in the repository. |

### Usage
Invoke skills by typing the command (e.g., `/frontend-design`) followed by your request.

## Additional Context

Design guidelines and platform-specific rules are in `.claude/rules/`:
- `.claude/rules/design-checklist.md` - iOS/Web design system (glass cards, theming)
- `.claude/rules/mobile/ios.md` - iOS SwiftUI patterns
- `.claude/rules/security.md` - Security guidelines

Also see:
- `docs/design/design-guidelines.md` - Brand colors, typography, components
- `docs/BUILD_NOTES.md` - Build history and decisions
