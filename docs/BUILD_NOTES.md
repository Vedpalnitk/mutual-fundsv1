# Sparrow Invest build notes

## Web App
- Stack: Next.js (pages router) + TypeScript + TailwindCSS.
- Branding: Sparrow blue (#006BFF) with gradient (#3A7BFF → #0044FF), rounded 16px cards, light shadows.
- Implemented core layout (Navbar, Footer, PageHeader) and AI portfolio dashboard with investor profile, allocation mix, fund recommendations, AI signals, and watchlist.
- Fund universe and detail scaffolds added with core/growth/stability groupings, category grid, fund metadata (returns, risk, expense ratio, AUM, exit load), holdings, and manager info.
- Investor profile flow now captures detailed personal, financial, goal, and risk inputs with persona preview and completeness meter.
- Next steps: enrich fund data coverage, add goal stress tests, model tax-optimized ELSS routing, and add responsive/accessibility polish.

## iOS App (SwiftUI)
- Stack: SwiftUI + Swift 5.9, iOS 17+
- Glass morphism design with dark/light mode support via AppTheme
- State management: @Observable stores (FamilyStore, AdvisorStore, PortfolioStore, etc.)

### User Types
- **Self-service users**: Direct brokerage platform integration (Zerodha, Groww, etc.)
- **Managed users**: FA-assisted flow with trade request submission

### Key Features Implemented
- Family portfolio view with member switching
- FA trade request flow (ManagedInvestmentView)
- Quick actions with conditional flow based on user type
- Advisor assignment and display for managed users

### Demo Users
- `amit.verma@demo.com` / `Demo@123` - Self-service user
- `priya.patel@demo.com` / `Demo@123` - Managed user (Patel Family)
- `rajesh.sharma@demo.com` / `Demo@123` - Managed user (Sharma Family)

## Backend (NestJS)
- Stack: NestJS + Prisma + PostgreSQL
- API prefix: `/api/v1/`
- Port: 3501

### Key Endpoints
- `POST /api/v1/auth/login` - User authentication
- `GET /api/v1/auth/me` - Current user profile
- `GET /api/v1/auth/me/portfolio` - Portfolio with clientType and advisor info
- `POST /api/v1/transactions/trade-request` - Submit trade request to FA
- `GET /api/v1/transactions/my-requests` - User's trade request history
