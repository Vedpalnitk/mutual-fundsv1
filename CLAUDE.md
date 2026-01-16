# Sparrow Invest - Smart Portfolio Manager

## Project Overview
AI-powered mutual fund portfolio management platform with goal-aligned recommendations. The project consists of multiple platforms and services:
- **Next.js Web App** - Admin dashboard and user portal (port 3500)
- **iOS App** - Native SwiftUI mobile application (SparrowInvest)
- **Backend** - API service
- **ML Service** - Machine learning recommendation engine

## Project Structure
```
mutual-fundsv1/
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
│   └── ios/                # Native iOS app (SwiftUI)
│       └── SparrowInvest/
│           ├── App/        # App entry point
│           ├── Models/     # Data models
│           ├── Views/      # SwiftUI views
│           ├── Components/ # Reusable components
│           ├── Services/   # API and state services
│           └── Utilities/  # Helpers and theme
├── backend/                # Backend API service
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

### iOS App (SwiftUI)
- **Open in Xcode**: `open platforms/ios/SparrowInvest.xcodeproj` (or use XcodeGen with project.yml)
- **Build**: Use Xcode or `xcodebuild -project platforms/ios/SparrowInvest.xcodeproj`

### Backend
- **Dev server**: `cd backend && npm run dev`

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
Uses SwiftUI with standard Swift package structure in `platforms/ios/SparrowInvest/`

## Important Patterns

### Theming
- Web: Class-based dark mode with CSS custom properties (`:root.dark`)
- iOS: SwiftUI native theming with AppTheme utility
- Both support system preference detection and manual toggle

### API Integration
- MFAPI.in for Indian mutual fund NAV data
- Web API services in `platforms/web/src/services/`
- iOS API services in `platforms/ios/SparrowInvest/Services/`

### State Management
- Web: React Context API (no Redux), localStorage for persistence
- iOS: SwiftUI @Observable stores, UserDefaults for persistence

## Key Files

### Web App
- `platforms/web/src/pages/_app.tsx` - Next.js app wrapper with ThemeProvider
- `platforms/web/src/context/ThemeContext.tsx` - Web theme management
- `platforms/web/src/utils/v4-colors.ts` - V4 design system colors

### iOS App
- `platforms/ios/SparrowInvest/App/SparrowInvestApp.swift` - App entry point
- `platforms/ios/SparrowInvest/App/ContentView.swift` - Main content view
- `platforms/ios/SparrowInvest/Services/APIService.swift` - API integration
- `platforms/ios/SparrowInvest/Services/AuthManager.swift` - Authentication
- `platforms/ios/SparrowInvest/Utilities/AppTheme.swift` - Theme management

## External APIs

### MFAPI.in (Mutual Fund API)
- Base URL: `https://api.mfapi.in`
- Get all funds: `GET /mf`
- Get fund details: `GET /mf/{schemeCode}`
- Returns NAV history for CAGR calculations

## Additional Context
@docs/design/design-guidelines.md
@docs/BUILD_NOTES.md
@platforms/web/package.json
