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
- **Generate project**: `cd platforms/ios && xcodegen generate`
- **Build**: `xcodebuild -project platforms/ios/SparrowInvest.xcodeproj -scheme SparrowInvest -destination 'platform=iOS Simulator,name=iPhone 17 Pro,OS=26.2' build`
- **Install & Run**: `xcrun simctl install "iPhone 17 Pro" <path-to-app> && xcrun simctl launch "iPhone 17 Pro" com.sparrowinvest.app`

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
- `platforms/ios/SparrowInvest/Services/FamilyStore.swift` - Family portfolio & client type
- `platforms/ios/SparrowInvest/Services/AdvisorStore.swift` - Advisor assignment management
- `platforms/ios/SparrowInvest/Views/Common/MainTabView.swift` - Main tab container, data loading
- `platforms/ios/SparrowInvest/Views/Home/HomeView.swift` - Dashboard with quick actions
- `platforms/ios/SparrowInvest/Views/Invest/ManagedInvestmentView.swift` - FA trade request form
- `platforms/ios/SparrowInvest/Models/TradeRequest.swift` - Trade request models
- `platforms/ios/SparrowInvest/Utilities/AppTheme.swift` - Theme management

## External APIs

### MFAPI.in (Mutual Fund API)
- Base URL: `https://api.mfapi.in`
- Get all funds: `GET /mf`
- Get fund details: `GET /mf/{schemeCode}`
- Returns NAV history for CAGR calculations

---

## Demo Users for Testing

All demo users use the format `firstname.lastname@demo.com` with password `Demo@123`:

| Email | Password | Name | Type | Description |
|-------|----------|------|------|-------------|
| `amit.verma@demo.com` | `Demo@123` | Amit Verma | **Self-service** | No FA, uses brokerage platforms |
| `priya.patel@demo.com` | `Demo@123` | Priya Patel | **Managed** | Patel Family head, has FA advisor |
| `rajesh.sharma@demo.com` | `Demo@123` | Rajesh Sharma | **Managed** | Sharma Family head, has FA advisor |

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

## Additional Context
@docs/design/design-guidelines.md
@docs/BUILD_NOTES.md
@platforms/web/package.json

---

# iOS App Design Checklist

This checklist must be followed when creating or updating any SwiftUI component in the iOS app.

## Required Setup for Every Card/Tile Component

Every card or tile component MUST include:

```swift
@Environment(\.colorScheme) private var colorScheme
```

## Card Types and Styling

### 1. Primary Glass Card (Section Containers)

Use for: Main dashboard cards, section containers, hero cards

| Property | Dark Mode | Light Mode |
|----------|-----------|------------|
| Background | `Color.black.opacity(0.4)` + `.ultraThinMaterial` | `Color.white` |
| Border | Gradient `white.opacity(0.4→0.15→0.05→0.1)` | Gradient `black.opacity(0.08→0.04→0.02→0.06)` |
| Shadow | None | `black.opacity(0.08)`, radius 12, y: 4 |
| Corner Radius | `AppTheme.CornerRadius.xLarge` (20pt) | Same |
| Padding | `AppTheme.Spacing.medium` (16pt) | Same |

**Code Template:**
```swift
struct MyCard: View {
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        VStack {
            // Content
        }
        .padding(AppTheme.Spacing.medium)
        .background(cardBackground)
        .overlay(cardBorder)
        .shadow(color: cardShadow, radius: 12, x: 0, y: 4)
    }

    private var cardShadow: Color {
        colorScheme == .dark ? .clear : .black.opacity(0.08)
    }

    @ViewBuilder
    private var cardBackground: some View {
        if colorScheme == .dark {
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.xLarge, style: .continuous)
                .fill(Color.black.opacity(0.4))
                .background(
                    RoundedRectangle(cornerRadius: AppTheme.CornerRadius.xLarge, style: .continuous)
                        .fill(.ultraThinMaterial)
                )
        } else {
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.xLarge, style: .continuous)
                .fill(Color.white)
        }
    }

    private var cardBorder: some View {
        RoundedRectangle(cornerRadius: AppTheme.CornerRadius.xLarge, style: .continuous)
            .stroke(
                colorScheme == .dark
                    ? LinearGradient(
                        stops: [
                            .init(color: .white.opacity(0.4), location: 0),
                            .init(color: .white.opacity(0.15), location: 0.3),
                            .init(color: .white.opacity(0.05), location: 0.7),
                            .init(color: .white.opacity(0.1), location: 1)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                      )
                    : LinearGradient(
                        stops: [
                            .init(color: .black.opacity(0.08), location: 0),
                            .init(color: .black.opacity(0.04), location: 0.3),
                            .init(color: .black.opacity(0.02), location: 0.7),
                            .init(color: .black.opacity(0.06), location: 1)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                      ),
                lineWidth: 1
            )
    }
}
```

### 2. List Item Card (Nested Cards/Rows)

Use for: Transaction rows, SIP rows, goal rows, fund items, holding cards

| Property | Dark Mode | Light Mode |
|----------|-----------|------------|
| Background | `Color.white.opacity(0.06)` | `Color(uiColor: .tertiarySystemFill)` |
| Border | `Color.white.opacity(0.08)` | `Color.clear` |
| Corner Radius | `AppTheme.CornerRadius.small` or `.medium` | Same |
| Padding | 10-12pt | Same |

**Code Template:**
```swift
.background(
    colorScheme == .dark ? Color.white.opacity(0.06) : Color(uiColor: .tertiarySystemFill),
    in: RoundedRectangle(cornerRadius: AppTheme.CornerRadius.small, style: .continuous)
)
.overlay(
    RoundedRectangle(cornerRadius: AppTheme.CornerRadius.small, style: .continuous)
        .stroke(colorScheme == .dark ? Color.white.opacity(0.08) : Color.clear, lineWidth: 0.5)
)
```

### 3. Category/Tinted Cards

Use for: Category tiles, filter chips, colored badges

| Property | Dark Mode | Light Mode |
|----------|-----------|------------|
| Background | `categoryColor.opacity(0.15)` | `categoryColor.opacity(0.1)` |
| Border | `categoryColor.opacity(0.2)` | None |
| Corner Radius | `AppTheme.CornerRadius.medium` | Same |

**Code Template:**
```swift
.background(
    color.opacity(colorScheme == .dark ? 0.15 : 0.1),
    in: RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
)
.overlay(
    RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
        .stroke(colorScheme == .dark ? color.opacity(0.2) : Color.clear, lineWidth: 0.5)
)
```

### 4. Segmented Controls / Pill Selectors

Use for: Period selectors, tab selectors, toggle controls

| Property | Dark Mode | Light Mode |
|----------|-----------|------------|
| Track Background | `Color.black.opacity(0.4)` + `.ultraThinMaterial` | `Color.white` |
| Border | Gradient `white.opacity(0.4→0.05→0.1)` | Gradient `black.opacity(0.1→0.03→0.07)` |
| Shadow | None | `black.opacity(0.04)`, radius 8, y: 2 |
| Active Segment | Solid `.blue` | Same |
| Shape | Capsule | Capsule |

**Code Template:**
```swift
HStack(spacing: 0) {
    ForEach(options, id: \.self) { option in
        Button(action: {}) {
            Text(option)
                .foregroundColor(isSelected ? .white : .primary)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 10)
                .background {
                    if isSelected {
                        Capsule().fill(.blue)
                    }
                }
        }
    }
}
.padding(4)
.background(segmentBackground)
.overlay(segmentBorder)
.shadow(color: segmentShadow, radius: 8, x: 0, y: 2)

// Where:
private var segmentShadow: Color {
    colorScheme == .dark ? .clear : .black.opacity(0.04)
}

@ViewBuilder
private var segmentBackground: some View {
    if colorScheme == .dark {
        Capsule()
            .fill(Color.black.opacity(0.4))
            .background(Capsule().fill(.ultraThinMaterial))
    } else {
        Capsule().fill(Color.white)
    }
}

private var segmentBorder: some View {
    Capsule()
        .stroke(
            colorScheme == .dark
                ? LinearGradient(
                    stops: [
                        .init(color: .white.opacity(0.4), location: 0),
                        .init(color: .white.opacity(0.15), location: 0.3),
                        .init(color: .white.opacity(0.05), location: 0.7),
                        .init(color: .white.opacity(0.1), location: 1)
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                  )
                : LinearGradient(
                    stops: [
                        .init(color: .black.opacity(0.1), location: 0),
                        .init(color: .black.opacity(0.05), location: 0.3),
                        .init(color: .black.opacity(0.03), location: 0.7),
                        .init(color: .black.opacity(0.07), location: 1)
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                  ),
            lineWidth: 1
        )
}
```

### 5. Glass Buttons

Use for: Secondary actions, glass-style buttons

| Property | Dark Mode | Light Mode |
|----------|-----------|------------|
| Background | `Color.black.opacity(0.4)` + `.ultraThinMaterial` | `Color.white` |
| Border | Gradient `white.opacity(0.4→0.05→0.1)` | Gradient `black.opacity(0.1→0.03→0.07)` |
| Shadow | None | `black.opacity(0.06)`, radius 8, y: 2 |
| Corner Radius | 14pt (rounded rect) or Capsule | Same |

**Code Template:**
```swift
Button(action: {}) {
    Text("Glass Button")
        .font(.system(size: 17, weight: .semibold))
        .foregroundColor(.primary)
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
        .background(buttonBackground)
        .overlay(buttonBorder)
}

@ViewBuilder
private var buttonBackground: some View {
    if colorScheme == .dark {
        RoundedRectangle(cornerRadius: 14, style: .continuous)
            .fill(Color.black.opacity(0.4))
            .background(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .fill(.ultraThinMaterial)
            )
    } else {
        RoundedRectangle(cornerRadius: 14, style: .continuous)
            .fill(Color.white)
            .shadow(color: .black.opacity(0.06), radius: 8, x: 0, y: 2)
    }
}

private var buttonBorder: some View {
    RoundedRectangle(cornerRadius: 14, style: .continuous)
        .stroke(
            colorScheme == .dark
                ? LinearGradient(
                    stops: [
                        .init(color: .white.opacity(0.4), location: 0),
                        .init(color: .white.opacity(0.15), location: 0.3),
                        .init(color: .white.opacity(0.05), location: 0.7),
                        .init(color: .white.opacity(0.1), location: 1)
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                  )
                : LinearGradient(
                    stops: [
                        .init(color: .black.opacity(0.1), location: 0),
                        .init(color: .black.opacity(0.05), location: 0.3),
                        .init(color: .black.opacity(0.03), location: 0.7),
                        .init(color: .black.opacity(0.07), location: 1)
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                  ),
            lineWidth: 1
        )
}
```

### 6. Secondary/Outlined Buttons

Use for: Secondary actions with color accent

| Property | Dark Mode | Light Mode |
|----------|-----------|------------|
| Background | `Color.blue.opacity(0.1)` | `Color.blue.opacity(0.05)` |
| Border | Gradient `blue.opacity(0.5→0.1→0.3)` | Gradient `blue.opacity(0.3→0.1→0.2)` |
| Text Color | `.blue` | `.blue` |

### 7. Pills & Chips

Use for: Filter chips, tag pills, selection chips

| Property | Dark Mode (unselected) | Light Mode (unselected) |
|----------|------------------------|-------------------------|
| Background | `Color.black.opacity(0.4)` + `.ultraThinMaterial` | `Color.white` |
| Border | Gradient `white.opacity(0.4→0.05→0.1)` | Gradient `black.opacity(0.1→0.03→0.07)` |
| Shadow | None | `black.opacity(0.04)`, radius 6, y: 2 |
| Shape | Capsule | Capsule |

| Property | Selected State |
|----------|----------------|
| Background | Solid `.blue` |
| Border | None |
| Text Color | `.white` |

**Code Template:**
```swift
Text(text)
    .font(.system(size: 14, weight: .semibold))
    .foregroundColor(isSelected ? .white : .primary)
    .padding(.horizontal, 16)
    .padding(.vertical, 10)
    .background(chipBackground)
    .overlay(chipBorder)
    .shadow(color: chipShadow, radius: 6, x: 0, y: 2)

private var chipShadow: Color {
    if isSelected { return .clear }
    return colorScheme == .dark ? .clear : .black.opacity(0.04)
}

@ViewBuilder
private var chipBackground: some View {
    if isSelected {
        Capsule().fill(.blue)
    } else if colorScheme == .dark {
        Capsule()
            .fill(Color.black.opacity(0.4))
            .background(Capsule().fill(.ultraThinMaterial))
    } else {
        Capsule().fill(Color.white)
    }
}

@ViewBuilder
private var chipBorder: some View {
    if isSelected {
        Capsule().stroke(Color.clear, lineWidth: 0)
    } else {
        Capsule()
            .stroke(/* gradient border */, lineWidth: 1)
    }
}
```

### 8. Text Fields / Search Inputs

Use for: Search bars, text inputs, form fields

| Property | Dark Mode | Light Mode |
|----------|-----------|------------|
| Background | `Color.black.opacity(0.4)` + `.ultraThinMaterial` | `Color.white` |
| Border | Gradient `white.opacity(0.4→0.05→0.1)` | Gradient `black.opacity(0.1→0.03→0.07)` |
| Shadow | None | `black.opacity(0.04)`, radius 8, y: 2 |
| Corner Radius | 14pt | Same |
| Padding | 16pt | Same |

**Code Template:**
```swift
HStack {
    Image(systemName: "magnifyingglass")
        .foregroundColor(.secondary)
    Text("Search...")
        .foregroundColor(Color(uiColor: .placeholderText))
    Spacer()
}
.padding(16)
.background(fieldBackground)
.overlay(fieldBorder)
.shadow(color: fieldShadow, radius: 8, x: 0, y: 2)

private var fieldShadow: Color {
    colorScheme == .dark ? .clear : .black.opacity(0.04)
}

@ViewBuilder
private var fieldBackground: some View {
    if colorScheme == .dark {
        RoundedRectangle(cornerRadius: 14, style: .continuous)
            .fill(Color.black.opacity(0.4))
            .background(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .fill(.ultraThinMaterial)
            )
    } else {
        RoundedRectangle(cornerRadius: 14, style: .continuous)
            .fill(Color.white)
    }
}

private var fieldBorder: some View {
    RoundedRectangle(cornerRadius: 14, style: .continuous)
        .stroke(/* gradient border */, lineWidth: 1)
}
```

## Corner Radius Reference (AppTheme.CornerRadius)

| Name | Value | Use Case |
|------|-------|----------|
| `small` | 8pt | Icon containers, small badges |
| `medium` | 12pt | List items, nested cards |
| `large` | 16pt | Action cards, buttons |
| `xLarge` | 20pt | Section cards, main tiles |
| `xxLarge` | 24pt | Hero cards, primary containers |

## Spacing Reference (AppTheme.Spacing)

| Name | Value | Use Case |
|------|-------|----------|
| `small` | 8pt | Tight spacing, icon gaps |
| `compact` | 12pt | List item padding, row spacing |
| `medium` | 16pt | Card padding, section gaps |
| `large` | 20pt | Hero card padding |
| `xLarge` | 24pt | Major section separation |

## Icon Containers

Always wrap icons in a tinted background container:

```swift
ZStack {
    RoundedRectangle(cornerRadius: AppTheme.CornerRadius.small, style: .continuous)
        .fill(iconColor.opacity(0.15))
        .frame(width: 36, height: 36)

    Image(systemName: "star.fill")
        .font(.system(size: 14))
        .foregroundColor(iconColor)
}
```

## Typography

| Element | Weight | Size |
|---------|--------|------|
| Card Title | `.regular` | 16pt |
| Section Label | `.regular` (uppercase, tracking) | 11pt |
| Body Text | `.light` | 13-14pt |
| Secondary Text | `.regular` | 11-12pt |
| Large Values | `.light, .rounded` | 16-22pt |

## Checklist Before Committing

- [ ] Added `@Environment(\.colorScheme) private var colorScheme` to component
- [ ] Background adapts to dark/light mode (`Color.white` for light, `Color.black.opacity(0.4)` + material for dark)
- [ ] Border/stroke gradient adapts to dark/light mode (white opacities for dark, black opacities for light)
- [ ] Shadow added for light mode only (cards: `radius: 12, y: 4`; buttons/inputs: `radius: 8, y: 2`; chips: `radius: 6, y: 2`)
- [ ] Uses `AppTheme.CornerRadius` constants
- [ ] Uses `AppTheme.Spacing` constants
- [ ] Icon containers have tinted backgrounds
- [ ] Buttons use glass styling with gradient borders
- [ ] Chips/Pills use glass styling when unselected, solid blue when selected
- [ ] Form inputs (search fields, text fields) use glass styling
- [ ] Segmented controls use glass styling with gradient borders
- [ ] Tested in both light and dark mode
- [ ] Nested items (rows, list items) have appropriate styling

## Common Mistakes to Avoid

- Using `Color.white` in dark mode (should use `Color.black.opacity(0.4)` + `.ultraThinMaterial`)
- Forgetting to add gradient border stroke for both light and dark modes
- Missing shadow for light mode (`black.opacity(0.08)` for cards, `0.04-0.06` for buttons/inputs)
- Hardcoding corner radius values instead of using AppTheme constants
- Using wrong opacity values (dark mode borders use white, light mode uses black)
- Using `.regularMaterial` or `.ultraThinMaterial` alone in light mode (should use `Color.white`)
- Using `Color(uiColor: .tertiarySystemFill)` for inputs in light mode (should use `Color.white` with gradient border)
- Not testing in both light and dark mode before committing
