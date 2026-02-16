import SwiftUI

struct AdaptiveRootView: View {
    @Environment(\.horizontalSizeClass) private var sizeClass
    private var iPad: Bool { sizeClass == .regular }
    @EnvironmentObject var coordinator: NavigationCoordinator
    @EnvironmentObject var authManager: AuthManager
    @EnvironmentObject var deepLinkRouter: DeepLinkRouter

    var body: some View {
        if sizeClass == .regular {
            iPadLayout
        } else {
            MainTabView()
        }
    }

    // MARK: - iPad Layout

    @State private var columnVisibility: NavigationSplitViewVisibility = .doubleColumn

    private var iPadLayout: some View {
        ZStack {
            if coordinator.selectedDestination.hasListDetail {
                // 3-column: sidebar + list + detail (Clients, Transactions, Funds, My Picks)
                NavigationSplitView(columnVisibility: $columnVisibility) {
                    sidebarList
                } content: {
                    listColumn
                        .navigationSplitViewColumnWidth(min: 380, ideal: 420, max: 500)
                } detail: {
                    detailColumn
                }
                .navigationSplitViewStyle(.balanced)
            } else {
                // 2-column: sidebar + full-width content (Dashboard, Settings, etc.)
                NavigationSplitView {
                    sidebarList
                } detail: {
                    fullPageColumn
                }
                .navigationSplitViewStyle(.balanced)
            }

            // Avya FAB
            AvyaFABContainer(showAvyaChat: $coordinator.showAvyaChat)
        }
        .sheet(isPresented: $coordinator.showAvyaChat) {
            AIChatView()
        }
        .onChange(of: coordinator.selectedClientId) { _, val in
            if val != nil { withAnimation { columnVisibility = .doubleColumn } }
        }
        .onChange(of: coordinator.selectedTransactionId) { _, val in
            if val != nil { withAnimation { columnVisibility = .doubleColumn } }
        }
        .onChange(of: coordinator.selectedFundCode) { _, val in
            if val != nil { withAnimation { columnVisibility = .doubleColumn } }
        }
        .onChange(of: coordinator.selectedWhitelistFundCode) { _, val in
            if val != nil { withAnimation { columnVisibility = .doubleColumn } }
        }
        .onChange(of: deepLinkRouter.pendingDestination) { _, destination in
            handleDeepLink(destination)
        }
        .task {
            await loadPendingBadgeCount()
        }
    }

    // MARK: - Sidebar (Native List)

    /// Bridges the non-optional `selectedDestination` to the optional `Binding` that `List(selection:)` requires on iOS.
    private var sidebarSelection: Binding<AppDestination?> {
        Binding(
            get: { coordinator.selectedDestination },
            set: { if let val = $0 { coordinator.navigate(to: val) } }
        )
    }

    private var sidebarList: some View {
        List(selection: sidebarSelection) {
            ForEach(SidebarSection.allCases, id: \.self) { section in
                Section(section.rawValue) {
                    ForEach(section.destinations, id: \.self) { destination in
                        sidebarRow(for: destination)
                            .tag(destination)
                    }

                    // Research section extras: Fund Compare
                    if section == .research {
                        Label(AppDestination.fundCompare.title, systemImage: AppDestination.fundCompare.icon)
                            .font(AppTheme.Typography.body(iPad ? 17 : 15))
                            .tag(AppDestination.fundCompare)
                    }

                }
            }
        }
        .listStyle(.sidebar)
        .navigationTitle("Sparrow FA")
        .safeAreaInset(edge: .bottom) {
            sidebarFooter
        }
    }

    private func sidebarRow(for destination: AppDestination) -> some View {
        HStack {
            Label(destination.title, systemImage: destination.icon)
                .font(AppTheme.Typography.body(iPad ? 17 : 15))

            if destination == .actionCenter && coordinator.pendingBadgeCount > 0 {
                Spacer()
                Text("\(coordinator.pendingBadgeCount)")
                    .font(.caption2.bold())
                    .foregroundColor(.white)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(Capsule().fill(AppTheme.error))
            }
        }
    }

    private var sidebarFooter: some View {
        VStack(spacing: 4) {
            Divider()
            if let user = authManager.user {
                HStack(spacing: 8) {
                    ZStack {
                        Circle()
                            .fill(AppTheme.primary.opacity(0.1))
                            .frame(width: 32, height: 32)
                        Text(user.initials)
                            .font(AppTheme.Typography.label(iPad ? 14 : 12))
                            .foregroundColor(AppTheme.primary)
                    }
                    VStack(alignment: .leading, spacing: 1) {
                        Text(user.displayName)
                            .font(AppTheme.Typography.accent(iPad ? 15 : 13))
                            .foregroundColor(.primary)
                            .lineLimit(1)
                        Text(user.email)
                            .font(AppTheme.Typography.label(iPad ? 13 : 11))
                            .foregroundColor(.secondary)
                            .lineLimit(1)
                    }
                    Spacer()
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 6)
            }

            Button(role: .destructive) {
                authManager.logout()
            } label: {
                HStack(spacing: 6) {
                    Image(systemName: "rectangle.portrait.and.arrow.right")
                        .font(.system(size: 13))
                    Text("Logout")
                        .font(AppTheme.Typography.accent(iPad ? 15 : 13))
                }
                .foregroundColor(AppTheme.error)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 16)
                .padding(.vertical, 6)
            }
            .buttonStyle(.plain)
        }
        .padding(.bottom, 8)
        .background(.bar)
    }

    // MARK: - List Column (3-column supplementary for list+detail sections)

    @ViewBuilder
    private var listColumn: some View {
        switch coordinator.selectedDestination {
        case .clients:
            ClientsView()
        case .transactions:
            TransactionsView()
        case .fundUniverse:
            FundUniverseView()
        case .whitelistedFunds:
            WhitelistedFundsView()
        default:
            EmptyView()
        }
    }

    // MARK: - Full Page Column (2-column detail for single-page sections)

    @ViewBuilder
    private var fullPageColumn: some View {
        switch coordinator.selectedDestination {
        case .dashboard:
            DashboardView()
        case .prospects:
            ProspectsView()
        case .communications:
            CommunicationsView()
        case .insights:
            InsightsView()
        case .sipManagement:
            SipListView()
        case .actionCenter:
            ActionCenterView()
        case .calculators:
            CalculatorsView()
        case .reports:
            ReportsView()
        case .settings:
            SettingsView()
        case .fundCompare:
            FundCompareView()
        default:
            EmptyView()
        }
    }

    // MARK: - Detail Column

    @ViewBuilder
    private var detailColumn: some View {
        switch coordinator.selectedDestination {
        case .clients:
            if let clientId = coordinator.selectedClientId {
                ClientDetailView(clientId: clientId)
            } else {
                ContentUnavailableView(
                    "Select a Client",
                    systemImage: "person.2",
                    description: Text("Choose a client from the list to view details")
                )
            }
        case .transactions:
            if let txId = coordinator.selectedTransactionId {
                TransactionDetailView(transactionId: txId)
            } else {
                ContentUnavailableView(
                    "Select a Transaction",
                    systemImage: "arrow.left.arrow.right",
                    description: Text("Choose a transaction from the list to view details")
                )
            }
        case .fundUniverse:
            if let schemeCode = coordinator.selectedFundCode {
                FundDetailView(schemeCode: schemeCode)
            } else {
                ContentUnavailableView(
                    "Select a Fund",
                    systemImage: "globe",
                    description: Text("Choose a fund from the list to view details")
                )
            }
        case .whitelistedFunds:
            if let schemeCode = coordinator.selectedWhitelistFundCode {
                FundDetailView(schemeCode: schemeCode)
            } else {
                ContentUnavailableView(
                    "Select a Fund",
                    systemImage: "star.circle",
                    description: Text("Choose a fund from your picks to view details")
                )
            }
        default:
            // Single-page sections show full content in the content column
            // Detail shows a contextual empty state
            ContentUnavailableView(
                coordinator.selectedDestination.title,
                systemImage: coordinator.selectedDestination.icon,
                description: Text("Use the main panel to interact")
            )
        }
    }

    // MARK: - Deep Link Handling (iPad)

    private func handleDeepLink(_ destination: DeepLinkRouter.DeepLinkDestination?) {
        guard let destination else { return }

        switch destination {
        case .client:
            coordinator.navigate(to: .clients)
        case .transaction:
            coordinator.navigate(to: .transactions)
        case .chat(let query):
            coordinator.openAvyaChat(query: query)
        }

        Task {
            try? await Task.sleep(nanoseconds: 500_000_000)
            deepLinkRouter.clearDestination()
        }
    }

    // MARK: - Badge Count

    private func loadPendingBadgeCount() async {
        do {
            let dashboard: FADashboard = try await APIService.shared.get("/advisor/dashboard")
            coordinator.pendingBadgeCount = dashboard.pendingActions
        } catch {
            coordinator.pendingBadgeCount = 0
        }
    }
}
