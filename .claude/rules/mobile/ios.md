# iOS App (SwiftUI) Guidelines

## Project Structure

```
platforms/ios/SparrowInvest/
├── App/                    # App entry point
├── Models/                 # Data models (Codable structs)
├── Views/                  # SwiftUI views organized by feature
│   ├── Common/            # Shared views (MainTabView)
│   ├── Home/              # Dashboard views
│   ├── Explore/           # Fund browsing
│   ├── Invest/            # Investment flows
│   └── Profile/           # User profile
├── Components/            # Reusable UI components
├── Services/              # State stores and API services
└── Utilities/             # Helpers, theme, extensions
```

## State Management

Use `@Observable` stores injected as `@EnvironmentObject`:

```swift
// In App
@StateObject private var familyStore = FamilyStore()
@StateObject private var advisorStore = AdvisorStore()

// In Views
@EnvironmentObject var familyStore: FamilyStore
@EnvironmentObject var advisorStore: AdvisorStore
```

### Key Stores

| Store | Purpose |
|-------|---------|
| `AuthManager` | Authentication state, user session |
| `FamilyStore` | Family portfolio, clientType, advisor info |
| `AdvisorStore` | Advisor list, assigned advisor |
| `PortfolioStore` | Holdings, SIPs, transactions |
| `FundsStore` | Fund catalog, recommendations |

## User Type Detection

```swift
// In FamilyStore
var clientType: String  // "self" or "managed"
var advisor: AdvisorInfo?  // nil for self-service users

// In AdvisorStore
var hasAssignedAdvisor: Bool {
    assignedAdvisorId != nil && assignedAdvisor != nil
}

// In Views - check for managed user
private var isManagedClient: Bool {
    familyStore.clientType == "managed" || advisorStore.hasAssignedAdvisor
}
```

## API Integration

All API calls go through `APIService.shared`:

```swift
// GET request
let response: PortfolioResponse = try await APIService.shared.get("/auth/me/portfolio")

// POST request
let response: TradeRequestResponse = try await APIService.shared.post("/transactions/trade-request", body: request)
```

## Data Loading Pattern

Load data in `.task` modifier on main container views:

```swift
.task {
    await familyStore.loadFromAPI()

    if let advisor = familyStore.advisor {
        advisorStore.setAssignedAdvisor(id: advisor.id, name: advisor.name, email: advisor.email)
    } else {
        advisorStore.removeAssignedAdvisor()
    }
}
```

## Conditional UI Based on User Type

```swift
// Quick actions example
Button("Invest") {
    if isManagedClient {
        showManagedActionSheet = true  // FA flow
    } else {
        showPlatformSheet = true  // Brokerage selection
    }
}
```

## Demo Users

| Email | Password | Type |
|-------|----------|------|
| `amit.verma@demo.com` | `Demo@123` | Self-service |
| `priya.patel@demo.com` | `Demo@123` | Managed (FA) |
| `rajesh.sharma@demo.com` | `Demo@123` | Managed (FA) |

## Design System

See CLAUDE.md for complete iOS Design Checklist. Key points:

- Always use `@Environment(\.colorScheme)` for dark/light mode
- Use `AppTheme.Spacing` and `AppTheme.CornerRadius` constants
- Glass morphism: dark mode uses `.ultraThinMaterial`, light mode uses `Color.white`
- Gradient borders for cards with different opacities per mode

## Common Patterns

### Sheet Presentation
```swift
@State private var showSheet = false

.sheet(isPresented: $showSheet) {
    MySheetView()
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
}
```

### Async Button Action
```swift
@State private var isLoading = false

Button {
    isLoading = true
    Task {
        defer { isLoading = false }
        try await performAction()
    }
} label: {
    if isLoading {
        ProgressView()
    } else {
        Text("Submit")
    }
}
.disabled(isLoading)
```

### Error Handling
```swift
@State private var showError = false
@State private var errorMessage: String?

.alert("Error", isPresented: $showError) {
    Button("OK") { }
} message: {
    Text(errorMessage ?? "An error occurred")
}
```
