import SwiftUI

struct MainTabView: View {
    @State private var selectedTab = 0
    @State private var showAvyaChat = false
    @State private var pendingActionCount = 0
    @EnvironmentObject var authManager: AuthManager
    @EnvironmentObject var deepLinkRouter: DeepLinkRouter
    @Environment(\.colorScheme) private var colorScheme

    init() {
        let appearance = UITabBarAppearance()
        appearance.configureWithDefaultBackground()
        appearance.backgroundColor = .clear
        appearance.backgroundEffect = UIBlurEffect(style: .systemThinMaterial)
        appearance.shadowColor = .clear

        // Softer unselected items in dark mode
        let unselectedColor = UIColor { traits in
            traits.userInterfaceStyle == .dark
                ? UIColor(hex: "4A5568")
                : UIColor.secondaryLabel
        }
        let normalAttrs: [NSAttributedString.Key: Any] = [.foregroundColor: unselectedColor]
        appearance.stackedLayoutAppearance.normal.iconColor = unselectedColor
        appearance.stackedLayoutAppearance.normal.titleTextAttributes = normalAttrs
        appearance.inlineLayoutAppearance.normal.iconColor = unselectedColor
        appearance.inlineLayoutAppearance.normal.titleTextAttributes = normalAttrs
        appearance.compactInlineLayoutAppearance.normal.iconColor = unselectedColor
        appearance.compactInlineLayoutAppearance.normal.titleTextAttributes = normalAttrs

        UITabBar.appearance().standardAppearance = appearance
        UITabBar.appearance().scrollEdgeAppearance = appearance
        UITabBar.appearance().unselectedItemTintColor = unselectedColor
    }

    var body: some View {
        ZStack {
            if #available(iOS 26.0, *) {
                TabView(selection: $selectedTab) {
                    Tab("Dashboard", systemImage: "square.grid.2x2", value: 0) {
                        DashboardView()
                    }
                    .badge(pendingActionCount > 0 ? pendingActionCount : 0)

                    Tab("Clients", systemImage: "person.2", value: 1) {
                        ClientsView()
                    }
                    Tab("Insights", systemImage: "sparkles", value: 2) {
                        InsightsView()
                    }
                    Tab("Transactions", systemImage: "arrow.left.arrow.right", value: 3) {
                        TransactionsView()
                    }
                    Tab("More", systemImage: "line.3.horizontal", value: 4) {
                        MoreView()
                    }
                }
                .tint(AppTheme.primary)
            } else {
                TabView(selection: $selectedTab) {
                    DashboardView()
                        .tabItem {
                            Label("Dashboard", systemImage: "square.grid.2x2")
                        }
                        .tag(0)
                        .badge(pendingActionCount > 0 ? pendingActionCount : 0)

                    ClientsView()
                        .tabItem {
                            Label("Clients", systemImage: "person.2")
                        }
                        .tag(1)

                    InsightsView()
                        .tabItem {
                            Label("Insights", systemImage: "sparkles")
                        }
                        .tag(2)

                    TransactionsView()
                        .tabItem {
                            Label("Transactions", systemImage: "arrow.left.arrow.right")
                        }
                        .tag(3)

                    MoreView()
                        .tabItem {
                            Label("More", systemImage: "line.3.horizontal")
                        }
                        .tag(4)
                }
                .tint(AppTheme.primary)
            }

            // Avya FAB — hidden on Insights tab (has its own Avya hub)
            if selectedTab != 2 {
                AvyaFABContainer(showAvyaChat: $showAvyaChat)
            }
        }
        .sheet(isPresented: $showAvyaChat) {
            AIChatView()
        }
        .task {
            await loadPendingActionCount()
        }
        .onChange(of: deepLinkRouter.pendingDestination) { _, destination in
            handleDeepLink(destination)
        }
        .onReceive(NotificationCenter.default.publisher(for: .deepLinkNavigate)) { notification in
            if let dest = notification.userInfo?["destination"] as? String {
                switch dest {
                case "client":
                    selectedTab = 1
                case "transaction":
                    selectedTab = 3
                case "reports":
                    selectedTab = 4
                case "chat":
                    showAvyaChat = true
                default:
                    break
                }
            }
        }
    }

    // MARK: - Pending Action Count

    private func loadPendingActionCount() async {
        do {
            let dashboard: FADashboard = try await APIService.shared.get("/advisor/dashboard")
            pendingActionCount = dashboard.pendingActions
        } catch {
            pendingActionCount = 0
        }
    }

    // MARK: - Deep Link Handling

    private func handleDeepLink(_ destination: DeepLinkRouter.DeepLinkDestination?) {
        guard let destination else { return }

        switch destination {
        case .client:
            selectedTab = 1
        case .transaction:
            selectedTab = 3
        case .chat:
            showAvyaChat = true
        }

        // Clear after a short delay to allow view transition
        Task {
            try? await Task.sleep(nanoseconds: 500_000_000)
            deepLinkRouter.clearDestination()
        }
    }
}
