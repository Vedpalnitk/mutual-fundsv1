import SwiftUI

// MARK: - App Destination

enum AppDestination: Hashable, Identifiable {
    // Overview
    case dashboard

    // Client Management
    case clients
    case prospects
    case transactions
    case communications
    case insights

    // Research
    case fundUniverse
    case whitelistedFunds
    case sipManagement
    case actionCenter
    case calculators
    case reports

    // Account
    case settings

    // iPad-only
    case fundCompare

    /// Whether this destination uses a list+detail pattern (3-column content+detail)
    var hasListDetail: Bool {
        switch self {
        case .clients, .transactions, .fundUniverse, .whitelistedFunds:
            return true
        default:
            return false
        }
    }

    var id: String {
        switch self {
        case .dashboard: return "dashboard"
        case .clients: return "clients"
        case .prospects: return "prospects"
        case .transactions: return "transactions"
        case .communications: return "communications"
        case .insights: return "insights"
        case .fundUniverse: return "fundUniverse"
        case .whitelistedFunds: return "whitelistedFunds"
        case .sipManagement: return "sipManagement"
        case .actionCenter: return "actionCenter"
        case .calculators: return "calculators"
        case .reports: return "reports"
        case .settings: return "settings"
        case .fundCompare: return "fundCompare"
        }
    }

    var title: String {
        switch self {
        case .dashboard: return "Dashboard"
        case .clients: return "Clients"
        case .prospects: return "Prospects"
        case .transactions: return "Transactions"
        case .communications: return "Communications"
        case .insights: return "Insights"
        case .fundUniverse: return "Fund Universe"
        case .whitelistedFunds: return "My Picks"
        case .sipManagement: return "SIP Management"
        case .actionCenter: return "Action Center"
        case .calculators: return "Calculators"
        case .reports: return "Reports"
        case .settings: return "Settings"
        case .fundCompare: return "Compare Funds"
        }
    }

    var icon: String {
        switch self {
        case .dashboard: return "square.grid.2x2"
        case .clients: return "person.2"
        case .prospects: return "person.crop.circle.badge.questionmark"
        case .transactions: return "arrow.left.arrow.right"
        case .communications: return "envelope"
        case .insights: return "sparkles"
        case .fundUniverse: return "globe"
        case .whitelistedFunds: return "star.circle"
        case .sipManagement: return "arrow.triangle.2.circlepath"
        case .actionCenter: return "bell.badge"
        case .calculators: return "function"
        case .reports: return "chart.bar.doc.horizontal"
        case .settings: return "gearshape"
        case .fundCompare: return "rectangle.split.2x1"
        }
    }
}

// MARK: - Sidebar Section

enum SidebarSection: String, CaseIterable {
    case overview = "Overview"
    case clientManagement = "Client Management"
    case operations = "Operations"
    case research = "Research"
    case tools = "Tools"
    case account = "Account"

    var destinations: [AppDestination] {
        switch self {
        case .overview:
            return [.dashboard]
        case .clientManagement:
            return [.clients, .prospects, .transactions, .communications, .insights]
        case .operations:
            return [.actionCenter, .sipManagement]
        case .research:
            return [.fundUniverse, .whitelistedFunds]
        case .tools:
            return [.reports, .calculators]
        case .account:
            return [.settings]
        }
    }

    var icon: String {
        switch self {
        case .overview: return "house"
        case .clientManagement: return "person.2.circle"
        case .operations: return "bell.badge.circle"
        case .research: return "magnifyingglass.circle"
        case .tools: return "wrench.and.screwdriver"
        case .account: return "person.circle"
        }
    }
}

// MARK: - Navigation Coordinator

@MainActor
class NavigationCoordinator: ObservableObject {
    @Published var selectedDestination: AppDestination = .dashboard
    @Published var detailPath = NavigationPath()
    @Published var showAvyaChat = false
    @Published var avyaInitialQuery: String?
    @Published var pendingBadgeCount = 0

    // Per-section selected item IDs (for 3-column detail)
    @Published var selectedClientId: String?
    @Published var selectedTransactionId: String?
    @Published var selectedFundCode: Int?
    @Published var selectedWhitelistFundCode: Int?

    func navigate(to destination: AppDestination) {
        if selectedDestination != destination {
            // Clear selections when switching sections
            selectedClientId = nil
            selectedTransactionId = nil
            selectedFundCode = nil
            selectedWhitelistFundCode = nil
        }
        selectedDestination = destination
        detailPath = NavigationPath()
    }

    func openAvyaChat(query: String? = nil) {
        avyaInitialQuery = query
        showAvyaChat = true
    }
}
