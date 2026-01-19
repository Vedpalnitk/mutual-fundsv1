import SwiftUI

struct HomeView: View {
    @EnvironmentObject var portfolioStore: PortfolioStore
    @EnvironmentObject var goalsStore: GoalsStore
    @EnvironmentObject var fundsStore: FundsStore
    @EnvironmentObject var authManager: AuthManager
    @EnvironmentObject var dashboardStore: DashboardStore
    @EnvironmentObject var familyStore: FamilyStore
    @EnvironmentObject var navigationStore: NavigationStore
    @Environment(AnalysisProfileStore.self) private var analysisStore

    // Sheet states for AI Analysis
    @State private var showProfileSetup = false
    @State private var showPortfolioInput = false
    @State private var showAddFamilyMember = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: AppTheme.Spacing.large) {
                    // Greeting
                    GreetingHeader(name: authManager.user?.firstName ?? "Investor")

                    // Portfolio Hero Card with Individual/Family Toggle
                    PortfolioHeroCard(
                        portfolio: portfolioStore.portfolio,
                        viewMode: $dashboardStore.viewMode,
                        familyPortfolio: familyStore.familyPortfolio,
                        onTap: {
                            navigationStore.switchTo(.investments)
                        },
                        onMemberTap: { member in
                            // Set view mode based on selection
                            if let member = member {
                                familyStore.selectMember(member)
                                dashboardStore.viewMode = .individual
                            } else {
                                dashboardStore.viewMode = .family
                            }
                            navigationStore.switchTo(.investments)
                        },
                        onAddMember: {
                            showAddFamilyMember = true
                        }
                    )

                    // Quick Actions
                    QuickActionsRow()

                    // AI Analysis Quick Access
                    AIAnalysisQuickAccessCard(
                        onCreateProfile: { showProfileSetup = true },
                        onCreatePortfolio: { showPortfolioInput = true }
                    )

                    // Asset Allocation Pie Chart with Portfolio Filter
                    AssetAllocationPieChart(
                        allocation: currentPortfolio.assetAllocation,
                        familyAllocation: familyStore.familyAssetAllocation,
                        familyMembers: familyStore.familyPortfolio.members,
                        memberAllocations: familyStore.memberAssetAllocations,
                        onTap: { filter in
                            // Sync view mode based on selected filter
                            if filter.id == "family" {
                                dashboardStore.viewMode = .family
                            } else {
                                dashboardStore.viewMode = .individual
                            }
                            navigationStore.switchTo(.investments)
                        }
                    )

                    // Portfolio Growth Line Chart with Portfolio Filter
                    PortfolioGrowthLineChart(
                        history: dashboardStore.portfolioHistory,
                        familyHistory: familyStore.familyPortfolioHistory,
                        familyMembers: familyStore.familyPortfolio.members,
                        memberHistories: familyStore.memberPortfolioHistories,
                        selectedPeriod: $dashboardStore.selectedHistoryPeriod,
                        onPeriodChange: { period in
                            dashboardStore.loadPortfolioHistory(for: period)
                        }
                    )

                    // Family Portfolio (only show in family mode or if has family members)
                    if dashboardStore.viewMode == .family || !familyStore.familyPortfolio.members.isEmpty {
                        FamilyPortfolioCard(
                            familyPortfolio: familyStore.familyPortfolio,
                            onMemberTap: { member in
                                familyStore.selectMember(member)
                            }
                        )
                    }

                    // SIP Dashboard
                    SIPDashboardCard(activeSIPs: portfolioStore.activeSIPs)

                    // Goal Progress
                    GoalProgressTile(
                        goals: goalsStore.goals,
                        onTapGoal: { goal in
                            // Navigate to goal detail
                        }
                    )

                    // Upcoming Actions
                    UpcomingActionsCard(
                        actions: dashboardStore.upcomingActions,
                        onComplete: { action in
                            dashboardStore.completeAction(action)
                        },
                        onDismiss: { action in
                            dashboardStore.dismissAction(action)
                        }
                    )

                    // Recent Transactions
                    RecentTransactionsCard(transactions: portfolioStore.transactions)

                    // Tax Summary
                    TaxSummaryCard(taxSummary: dashboardStore.taxSummary)
                }
                .padding(.horizontal, AppTheme.Spacing.medium)
                .padding(.bottom, AppTheme.Spacing.xxLarge)
            }
            .background(Color(uiColor: .systemGroupedBackground))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    HStack(spacing: 8) {
                        Image(systemName: "bird.fill")
                            .font(.system(size: 20, weight: .light))
                            .foregroundStyle(
                            LinearGradient(
                                colors: [.blue, .cyan],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        Text("Sparrow")
                            .font(.system(size: 18, weight: .light, design: .rounded))
                            .foregroundColor(.primary)
                    }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    HStack(spacing: 12) {
                        // Notification Bell with Badge
                        Button(action: {}) {
                            ZStack(alignment: .topTrailing) {
                                Image(systemName: "bell.fill")
                                    .font(.system(size: 18))
                                    .foregroundColor(.secondary)
                                if dashboardStore.highPriorityActionCount > 0 {
                                    Text("\(dashboardStore.highPriorityActionCount)")
                                        .font(.system(size: 10, weight: .regular))
                                        .foregroundColor(.white)
                                        .frame(width: 16, height: 16)
                                        .background(Circle().fill(Color.red))
                                        .offset(x: 6, y: -6)
                                }
                            }
                        }
                        NavigationLink(destination: ProfileView()) {
                            Image(systemName: "person.circle.fill")
                                .font(.system(size: 24))
                                .foregroundColor(.secondary)
                        }
                    }
                }
            }
            .refreshable {
                await refreshAllData()
            }
            .sheet(isPresented: $showProfileSetup) {
                InvestorProfileSetupView()
            }
            .sheet(isPresented: $showPortfolioInput) {
                PortfolioInputView()
            }
            .sheet(isPresented: $showAddFamilyMember) {
                AddFamilyMemberSheet()
            }
        }
    }

    // Current portfolio based on view mode
    private var currentPortfolio: Portfolio {
        portfolioStore.portfolio
    }

    private func refreshAllData() async {
        await withTaskGroup(of: Void.self) { group in
            group.addTask {
                await portfolioStore.fetchPortfolio()
            }
            group.addTask {
                await goalsStore.fetchGoals()
            }
            group.addTask {
                await fundsStore.fetchRecommendations()
            }
            group.addTask {
                await dashboardStore.refreshAllData()
            }
            group.addTask {
                await familyStore.refreshData()
            }
        }
    }
}

// MARK: - Greeting Header

struct GreetingHeader: View {
    let name: String

    private var greeting: String {
        let hour = Calendar.current.component(.hour, from: Date())
        switch hour {
        case 5..<12: return "Good morning"
        case 12..<17: return "Good afternoon"
        default: return "Good evening"
        }
    }

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text("\(greeting),")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                Text(name)
                    .font(.system(size: 24, weight: .light, design: .rounded))
                    .foregroundColor(.primary)
            }
            Spacer()
        }
        .padding(.top, 8)
    }
}

// MARK: - Quick Actions

enum QuickActionType: String {
    case invest = "Invest"
    case withdraw = "Withdraw"
    case sip = "Start SIP"

    var icon: String {
        switch self {
        case .invest: return "plus.circle.fill"
        case .withdraw: return "arrow.down.circle.fill"
        case .sip: return "repeat.circle.fill"
        }
    }

    var color: Color {
        switch self {
        case .invest: return .blue
        case .withdraw: return .cyan
        case .sip: return .green
        }
    }

    var sheetTitle: String {
        switch self {
        case .invest: return "Invest via"
        case .withdraw: return "Withdraw via"
        case .sip: return "Start SIP via"
        }
    }

    var sheetSubtitle: String {
        switch self {
        case .invest: return "Choose a platform to invest in mutual funds"
        case .withdraw: return "Choose a platform to withdraw your investments"
        case .sip: return "Choose a platform to start a SIP"
        }
    }
}

struct TradingPlatform: Identifiable {
    let id = UUID()
    let name: String
    let shortName: String
    let icon: String // SF Symbol or custom
    let color: Color
    let appScheme: String // URL scheme to open app
    let webURL: String // Fallback web URL

    static let platforms: [TradingPlatform] = [
        TradingPlatform(
            name: "Zerodha Coin",
            shortName: "Zerodha",
            icon: "z.circle.fill",
            color: Color(red: 0.15, green: 0.68, blue: 0.38), // Zerodha green
            appScheme: "zerodha://",
            webURL: "https://coin.zerodha.com"
        ),
        TradingPlatform(
            name: "Groww",
            shortName: "Groww",
            icon: "g.circle.fill",
            color: Color(red: 0.0, green: 0.78, blue: 0.55), // Groww teal
            appScheme: "groww://",
            webURL: "https://groww.in/mutual-funds"
        ),
        TradingPlatform(
            name: "Kuvera",
            shortName: "Kuvera",
            icon: "k.circle.fill",
            color: Color(red: 0.2, green: 0.4, blue: 0.8), // Kuvera blue
            appScheme: "kuvera://",
            webURL: "https://kuvera.in"
        ),
        TradingPlatform(
            name: "Paytm Money",
            shortName: "Paytm",
            icon: "p.circle.fill",
            color: Color(red: 0.0, green: 0.69, blue: 0.94), // Paytm blue
            appScheme: "paytmmoney://",
            webURL: "https://www.paytmmoney.com/mutual-funds"
        ),
        TradingPlatform(
            name: "ET Money",
            shortName: "ET Money",
            icon: "e.circle.fill",
            color: Color(red: 0.13, green: 0.13, blue: 0.13), // ET Money dark
            appScheme: "etmoney://",
            webURL: "https://www.etmoney.com"
        ),
        TradingPlatform(
            name: "MF Central",
            shortName: "MF Central",
            icon: "m.circle.fill",
            color: Color(red: 0.0, green: 0.48, blue: 0.8), // MF Central blue
            appScheme: "mfcentral://",
            webURL: "https://www.mfcentral.com"
        )
    ]
}

struct QuickActionsRow: View {
    @State private var selectedAction: QuickActionType?
    @State private var showPlatformSheet = false

    var body: some View {
        HStack(spacing: AppTheme.Spacing.compact) {
            HomeQuickActionButton(
                title: "Invest",
                icon: "plus.circle.fill",
                color: .blue
            ) {
                selectedAction = .invest
                showPlatformSheet = true
            }

            HomeQuickActionButton(
                title: "Withdraw",
                icon: "arrow.down.circle.fill",
                color: .cyan
            ) {
                selectedAction = .withdraw
                showPlatformSheet = true
            }

            HomeQuickActionButton(
                title: "SIP",
                icon: "repeat.circle.fill",
                color: .green
            ) {
                selectedAction = .sip
                showPlatformSheet = true
            }
        }
        .sheet(isPresented: $showPlatformSheet) {
            if let action = selectedAction {
                TradingPlatformSheet(actionType: action)
            }
        }
    }
}

struct HomeQuickActionButton: View {
    let title: String
    let icon: String
    let color: Color
    let action: () -> Void
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        Button(action: action) {
            VStack(spacing: 10) {
                Image(systemName: icon)
                    .font(.system(size: 28, weight: .light))
                    .foregroundColor(color)
                Text(title)
                    .font(.system(size: 13, weight: .regular))
                    .foregroundColor(.primary)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(buttonBackground)
            .overlay(buttonBorder)
            .shadow(color: buttonShadow, radius: 8, x: 0, y: 2)
        }
    }

    private var buttonShadow: Color {
        colorScheme == .dark ? .clear : .black.opacity(0.06)
    }

    @ViewBuilder
    private var buttonBackground: some View {
        if colorScheme == .dark {
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.large, style: .continuous)
                .fill(Color.black.opacity(0.4))
                .background(
                    RoundedRectangle(cornerRadius: AppTheme.CornerRadius.large, style: .continuous)
                        .fill(.ultraThinMaterial)
                )
        } else {
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.large, style: .continuous)
                .fill(Color.white)
        }
    }

    private var buttonBorder: some View {
        RoundedRectangle(cornerRadius: AppTheme.CornerRadius.large, style: .continuous)
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
                            .init(color: .black.opacity(0.15), location: 0),
                            .init(color: .black.opacity(0.08), location: 0.3),
                            .init(color: .black.opacity(0.05), location: 0.7),
                            .init(color: .black.opacity(0.12), location: 1)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                      ),
                lineWidth: 1
            )
    }
}

// MARK: - Trading Platform Sheet

struct TradingPlatformSheet: View {
    let actionType: QuickActionType
    @Environment(\.dismiss) private var dismiss
    @Environment(\.colorScheme) private var colorScheme
    @Environment(\.openURL) private var openURL

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: AppTheme.Spacing.large) {
                    // Header
                    VStack(spacing: AppTheme.Spacing.small) {
                        ZStack {
                            Circle()
                                .fill(actionType.color.opacity(0.15))
                                .frame(width: 64, height: 64)
                            Image(systemName: actionType.icon)
                                .font(.system(size: 28, weight: .light))
                                .foregroundColor(actionType.color)
                        }

                        Text(actionType.sheetTitle)
                            .font(.system(size: 20, weight: .semibold))
                            .foregroundColor(.primary)

                        Text(actionType.sheetSubtitle)
                            .font(.system(size: 14, weight: .light))
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    .padding(.top, AppTheme.Spacing.medium)

                    // Platform Grid
                    LazyVGrid(columns: [
                        GridItem(.flexible(), spacing: AppTheme.Spacing.compact),
                        GridItem(.flexible(), spacing: AppTheme.Spacing.compact)
                    ], spacing: AppTheme.Spacing.compact) {
                        ForEach(TradingPlatform.platforms) { platform in
                            PlatformCard(platform: platform) {
                                openPlatform(platform)
                            }
                        }
                    }

                    // Disclaimer
                    HStack(spacing: 8) {
                        Image(systemName: "info.circle")
                            .font(.system(size: 14))
                            .foregroundColor(.secondary)
                        Text("You will be redirected to the selected platform to complete your transaction.")
                            .font(.system(size: 12, weight: .light))
                            .foregroundColor(.secondary)
                    }
                    .padding(AppTheme.Spacing.compact)
                    .background(
                        RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
                            .fill(colorScheme == .dark ? Color.white.opacity(0.05) : Color(uiColor: .tertiarySystemFill))
                    )
                }
                .padding(AppTheme.Spacing.medium)
            }
            .background(Color(uiColor: .systemGroupedBackground))
            .navigationTitle("Choose Platform")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") { dismiss() }
                }
            }
        }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
    }

    private func openPlatform(_ platform: TradingPlatform) {
        // Try to open the app first
        if let appURL = URL(string: platform.appScheme) {
            UIApplication.shared.open(appURL) { success in
                if !success {
                    // Fallback to web URL
                    if let webURL = URL(string: platform.webURL) {
                        openURL(webURL)
                    }
                }
            }
        } else if let webURL = URL(string: platform.webURL) {
            openURL(webURL)
        }
        dismiss()
    }
}

struct PlatformCard: View {
    let platform: TradingPlatform
    let action: () -> Void
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        Button(action: action) {
            VStack(spacing: AppTheme.Spacing.small) {
                // Platform Icon
                ZStack {
                    RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
                        .fill(platform.color.opacity(0.15))
                        .frame(width: 48, height: 48)
                    Image(systemName: platform.icon)
                        .font(.system(size: 22, weight: .medium))
                        .foregroundColor(platform.color)
                }

                Text(platform.shortName)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(.primary)
                    .lineLimit(1)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, AppTheme.Spacing.medium)
            .background(cardBackground)
            .overlay(cardBorder)
            .shadow(color: cardShadow, radius: 8, x: 0, y: 2)
        }
        .buttonStyle(.plain)
    }

    private var cardShadow: Color {
        colorScheme == .dark ? .clear : .black.opacity(0.06)
    }

    @ViewBuilder
    private var cardBackground: some View {
        if colorScheme == .dark {
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.large, style: .continuous)
                .fill(Color.black.opacity(0.4))
                .background(
                    RoundedRectangle(cornerRadius: AppTheme.CornerRadius.large, style: .continuous)
                        .fill(.ultraThinMaterial)
                )
        } else {
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.large, style: .continuous)
                .fill(Color.white)
        }
    }

    private var cardBorder: some View {
        RoundedRectangle(cornerRadius: AppTheme.CornerRadius.large, style: .continuous)
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
                            .init(color: .black.opacity(0.12), location: 0),
                            .init(color: .black.opacity(0.06), location: 0.3),
                            .init(color: .black.opacity(0.04), location: 0.7),
                            .init(color: .black.opacity(0.10), location: 1)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                      ),
                lineWidth: 1
            )
    }
}

// MARK: - AI Analysis Quick Access Card

struct AIAnalysisQuickAccessCard: View {
    let onCreateProfile: () -> Void
    let onCreatePortfolio: () -> Void
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.medium) {
            // Header
            HStack {
                ZStack {
                    RoundedRectangle(cornerRadius: AppTheme.CornerRadius.small, style: .continuous)
                        .fill(Color.purple.opacity(0.15))
                        .frame(width: 32, height: 32)
                    Image(systemName: "brain.head.profile")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(.purple)
                }

                Text("AI Portfolio Analysis")
                    .font(.system(size: 16, weight: .regular))
                    .foregroundColor(.primary)

                Spacer()
            }

            Text("Set up your investor profile and portfolio to get personalized AI-powered insights and recommendations.")
                .font(.system(size: 13, weight: .light))
                .foregroundColor(.secondary)
                .lineLimit(2)

            // Action Buttons
            HStack(spacing: AppTheme.Spacing.compact) {
                AIAnalysisActionButton(
                    title: "Create Profile",
                    icon: "person.crop.circle.badge.plus",
                    color: .blue,
                    action: onCreateProfile
                )

                AIAnalysisActionButton(
                    title: "Create Portfolio",
                    icon: "chart.pie.fill",
                    color: .green,
                    action: onCreatePortfolio
                )
            }
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

struct AIAnalysisActionButton: View {
    let title: String
    let icon: String
    let color: Color
    let action: () -> Void
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(color)
                Text(title)
                    .font(.system(size: 13, weight: .medium))
                    .foregroundColor(.primary)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(buttonBackground)
            .overlay(buttonBorder)
        }
    }

    @ViewBuilder
    private var buttonBackground: some View {
        if colorScheme == .dark {
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
                .fill(color.opacity(0.15))
        } else {
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
                .fill(color.opacity(0.08))
        }
    }

    private var buttonBorder: some View {
        RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
            .stroke(
                colorScheme == .dark
                    ? color.opacity(0.3)
                    : color.opacity(0.2),
                lineWidth: 1
            )
    }
}

// MARK: - Add Family Member Sheet

struct AddFamilyMemberSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.colorScheme) private var colorScheme
    @EnvironmentObject var familyStore: FamilyStore

    @State private var name = ""
    @State private var email = ""
    @State private var phone = ""
    @State private var selectedRelationship: FamilyRelationship = .spouse
    @State private var showMemberHoldings = false
    @State private var newMemberId: String?

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: AppTheme.Spacing.large) {
                    // Info Card
                    infoCard

                    // Form Fields
                    VStack(spacing: AppTheme.Spacing.medium) {
                        formField(title: "Name", placeholder: "Enter name", text: $name)
                        formField(title: "Email", placeholder: "Enter email (optional)", text: $email)
                        formField(title: "Phone", placeholder: "Enter phone (optional)", text: $phone)

                        // Relationship Picker
                        VStack(alignment: .leading, spacing: 8) {
                            Text("RELATIONSHIP")
                                .font(.system(size: 11, weight: .regular))
                                .foregroundColor(.secondary)
                                .tracking(0.5)

                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: AppTheme.Spacing.small) {
                                    ForEach([FamilyRelationship.spouse, .child, .parent, .sibling, .other], id: \.self) { relationship in
                                        relationshipChip(relationship)
                                    }
                                }
                            }
                        }
                    }
                    .padding(AppTheme.Spacing.medium)
                    .background(cardBackground)
                    .overlay(cardBorder)

                    // Add Button
                    Button {
                        addMember()
                    } label: {
                        Text("Add Family Member")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(
                                LinearGradient(
                                    colors: [.blue, .cyan],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                ),
                                in: RoundedRectangle(cornerRadius: 14, style: .continuous)
                            )
                    }
                    .disabled(name.isEmpty)
                    .opacity(name.isEmpty ? 0.6 : 1)
                }
                .padding(AppTheme.Spacing.medium)
            }
            .background(Color(uiColor: .systemGroupedBackground))
            .navigationTitle("Add Family Member")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
            .navigationDestination(isPresented: $showMemberHoldings) {
                if let memberId = newMemberId,
                   let member = familyStore.familyPortfolio.members.first(where: { $0.id == memberId }) {
                    MemberHoldingsView(member: member, isNewMember: true, onDismiss: { dismiss() })
                }
            }
        }
    }

    private var infoCard: some View {
        HStack(spacing: AppTheme.Spacing.compact) {
            ZStack {
                Circle()
                    .fill(Color.blue.opacity(0.15))
                    .frame(width: 44, height: 44)
                Image(systemName: "info.circle.fill")
                    .font(.system(size: 20, weight: .regular))
                    .foregroundColor(.blue)
            }

            VStack(alignment: .leading, spacing: 4) {
                Text("Link Family Portfolio")
                    .font(.system(size: 15, weight: .regular))
                    .foregroundColor(.primary)
                Text("Add a family member to track their investments alongside yours.")
                    .font(.system(size: 13, weight: .light))
                    .foregroundColor(.secondary)
            }
        }
        .padding(AppTheme.Spacing.medium)
        .background(cardBackground)
        .overlay(cardBorder)
    }

    private func formField(title: String, placeholder: String, text: Binding<String>) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title.uppercased())
                .font(.system(size: 11, weight: .regular))
                .foregroundColor(.secondary)
                .tracking(0.5)

            TextField(placeholder, text: text)
                .font(.system(size: 15, weight: .regular))
                .padding(AppTheme.Spacing.compact)
                .background(
                    colorScheme == .dark
                        ? Color.white.opacity(0.06)
                        : Color(uiColor: .tertiarySystemFill),
                    in: RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
                )
        }
    }

    private func relationshipChip(_ relationship: FamilyRelationship) -> some View {
        Button {
            selectedRelationship = relationship
        } label: {
            Text(relationship.displayName)
                .font(.system(size: 13, weight: .regular))
                .foregroundColor(selectedRelationship == relationship ? .white : .primary)
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
                .background(
                    selectedRelationship == relationship
                        ? AnyShapeStyle(relationship.color)
                        : AnyShapeStyle(colorScheme == .dark ? Color.white.opacity(0.08) : Color(uiColor: .tertiarySystemFill)),
                    in: Capsule()
                )
        }
    }

    private func addMember() {
        let newMember = FamilyMember(
            name: name,
            relationship: selectedRelationship,
            email: email.isEmpty ? nil : email,
            phone: phone.isEmpty ? nil : phone,
            portfolioValue: 0,
            investedAmount: 0,
            returns: 0,
            returnsPercentage: 0,
            xirr: 0,
            contribution: 0,
            holdings: 0,
            activeSIPs: 0,
            isLinked: false
        )
        familyStore.addMember(newMember)
        newMemberId = newMember.id
        showMemberHoldings = true
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

// MARK: - Member Holdings View

struct MemberHoldingsView: View {
    let member: FamilyMember
    var isNewMember: Bool = false
    var onDismiss: (() -> Void)?

    @Environment(\.dismiss) private var dismiss
    @Environment(\.colorScheme) private var colorScheme
    @EnvironmentObject var familyStore: FamilyStore

    @State private var showAddHolding = false

    private var holdings: [Holding] {
        familyStore.getHoldings(for: member.id)
    }

    var body: some View {
        ScrollView {
            VStack(spacing: AppTheme.Spacing.large) {
                // Member Info Card
                memberInfoCard

                // Holdings Section
                VStack(alignment: .leading, spacing: AppTheme.Spacing.medium) {
                    HStack {
                        Text("HOLDINGS")
                            .font(.system(size: 11, weight: .regular))
                            .foregroundColor(.secondary)
                            .tracking(0.5)

                        Spacer()

                        Button {
                            showAddHolding = true
                        } label: {
                            HStack(spacing: 4) {
                                Image(systemName: "plus.circle.fill")
                                    .font(.system(size: 14))
                                Text("Add Holding")
                                    .font(.system(size: 13, weight: .medium))
                            }
                            .foregroundColor(.blue)
                        }
                    }

                    if holdings.isEmpty {
                        emptyHoldingsView
                    } else {
                        VStack(spacing: AppTheme.Spacing.small) {
                            ForEach(holdings) { holding in
                                HoldingRow(holding: holding, onDelete: {
                                    familyStore.removeHolding(holding.id, from: member.id)
                                })
                            }
                        }
                    }
                }
                .padding(AppTheme.Spacing.medium)
                .background(cardBackground)
                .overlay(cardBorder)
                .shadow(color: cardShadow, radius: 12, x: 0, y: 4)

                // Done Button (for new members)
                if isNewMember {
                    Button {
                        onDismiss?()
                    } label: {
                        Text(holdings.isEmpty ? "Skip for Now" : "Done")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(
                                LinearGradient(
                                    colors: [.blue, .cyan],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                ),
                                in: RoundedRectangle(cornerRadius: 14, style: .continuous)
                            )
                    }
                }
            }
            .padding(AppTheme.Spacing.medium)
        }
        .background(Color(uiColor: .systemGroupedBackground))
        .navigationTitle("\(member.name)'s Portfolio")
        .navigationBarTitleDisplayMode(.inline)
        .navigationBarBackButtonHidden(isNewMember)
        .toolbar {
            if !isNewMember {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        showAddHolding = true
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
        }
        .sheet(isPresented: $showAddHolding) {
            FamilyMemberAddHoldingView(memberId: member.id)
        }
    }

    private var memberInfoCard: some View {
        HStack(spacing: AppTheme.Spacing.compact) {
            // Avatar
            ZStack {
                Circle()
                    .fill(member.relationship.color.opacity(0.15))
                    .frame(width: 56, height: 56)
                Text(member.name.prefix(1).uppercased())
                    .font(.system(size: 22, weight: .medium))
                    .foregroundColor(member.relationship.color)
            }

            VStack(alignment: .leading, spacing: 4) {
                Text(member.name)
                    .font(.system(size: 17, weight: .medium))
                    .foregroundColor(.primary)

                Text(member.relationship.displayName)
                    .font(.system(size: 13, weight: .regular))
                    .foregroundColor(.secondary)

                if member.portfolioValue > 0 {
                    Text(member.portfolioValue.currencyFormatted)
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(.blue)
                }
            }

            Spacer()

            // Holdings count badge
            VStack(alignment: .trailing, spacing: 4) {
                Text("\(holdings.count)")
                    .font(.system(size: 20, weight: .semibold))
                    .foregroundColor(.primary)
                Text("Holdings")
                    .font(.system(size: 11, weight: .regular))
                    .foregroundColor(.secondary)
            }
        }
        .padding(AppTheme.Spacing.medium)
        .background(cardBackground)
        .overlay(cardBorder)
        .shadow(color: cardShadow, radius: 12, x: 0, y: 4)
    }

    private var emptyHoldingsView: some View {
        VStack(spacing: AppTheme.Spacing.compact) {
            Image(systemName: "chart.pie")
                .font(.system(size: 40, weight: .light))
                .foregroundColor(Color(uiColor: .tertiaryLabel))

            Text("No Holdings Yet")
                .font(.system(size: 15, weight: .medium))
                .foregroundColor(.primary)

            Text("Add mutual fund holdings to track \(member.name)'s portfolio")
                .font(.system(size: 13, weight: .light))
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)

            Button {
                showAddHolding = true
            } label: {
                HStack(spacing: 6) {
                    Image(systemName: "plus.circle.fill")
                    Text("Add First Holding")
                }
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(.white)
                .padding(.horizontal, 20)
                .padding(.vertical, 12)
                .background(
                    LinearGradient(
                        colors: [.blue, .cyan],
                        startPoint: .leading,
                        endPoint: .trailing
                    ),
                    in: Capsule()
                )
            }
            .padding(.top, 8)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, AppTheme.Spacing.xLarge)
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

// MARK: - Holding Row

struct HoldingRow: View {
    let holding: Holding
    var onDelete: (() -> Void)?

    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        HStack(spacing: AppTheme.Spacing.compact) {
            // Asset class indicator
            ZStack {
                RoundedRectangle(cornerRadius: AppTheme.CornerRadius.small, style: .continuous)
                    .fill(holding.assetClass.color.opacity(0.15))
                    .frame(width: 40, height: 40)
                Image(systemName: assetClassIcon)
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(holding.assetClass.color)
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(holding.fundName)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(.primary)
                    .lineLimit(1)

                Text("\(String(format: "%.3f", holding.units)) units")
                    .font(.system(size: 12, weight: .regular))
                    .foregroundColor(.secondary)
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 2) {
                Text(holding.currentValue.currencyFormatted)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.primary)

                HStack(spacing: 4) {
                    Image(systemName: holding.returns >= 0 ? "arrow.up.right" : "arrow.down.right")
                        .font(.system(size: 10, weight: .medium))
                    Text(holding.returnsPercentage.percentFormatted)
                        .font(.system(size: 12, weight: .medium))
                }
                .foregroundColor(holding.returns >= 0 ? .green : .red)
            }

            if onDelete != nil {
                Button {
                    onDelete?()
                } label: {
                    Image(systemName: "trash")
                        .font(.system(size: 14))
                        .foregroundColor(.red.opacity(0.8))
                }
                .padding(.leading, 8)
            }
        }
        .padding(AppTheme.Spacing.compact)
        .background(
            colorScheme == .dark ? Color.white.opacity(0.06) : Color(uiColor: .tertiarySystemFill),
            in: RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
        )
        .overlay(
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
                .stroke(colorScheme == .dark ? Color.white.opacity(0.08) : Color.clear, lineWidth: 0.5)
        )
    }

    private var assetClassIcon: String {
        switch holding.assetClass {
        case .equity: return "chart.line.uptrend.xyaxis"
        case .debt: return "banknote"
        case .hybrid: return "chart.pie"
        case .gold: return "bitcoinsign.circle"
        case .other: return "square.grid.2x2"
        }
    }
}

// MARK: - Family Member Add Holding View

struct FamilyMemberAddHoldingView: View {
    let memberId: String

    @Environment(\.dismiss) private var dismiss
    @Environment(\.colorScheme) private var colorScheme
    @EnvironmentObject var familyStore: FamilyStore

    @State private var fundName = ""
    @State private var fundCode = ""
    @State private var units = ""
    @State private var investedAmount = ""
    @State private var currentNav = ""
    @State private var selectedAssetClass: Holding.AssetClass = .equity

    private var isValid: Bool {
        !fundName.isEmpty &&
        Double(units) ?? 0 > 0 &&
        Double(investedAmount) ?? 0 > 0 &&
        Double(currentNav) ?? 0 > 0
    }

    private var calculatedValues: (currentValue: Double, returns: Double, returnsPercentage: Double) {
        let unitsVal = Double(units) ?? 0
        let navVal = Double(currentNav) ?? 0
        let investedVal = Double(investedAmount) ?? 0

        let currentValue = unitsVal * navVal
        let returns = currentValue - investedVal
        let returnsPercentage = investedVal > 0 ? (returns / investedVal) * 100 : 0

        return (currentValue, returns, returnsPercentage)
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: AppTheme.Spacing.large) {
                    // Fund Details Card
                    VStack(spacing: AppTheme.Spacing.medium) {
                        formField(title: "Fund Name", placeholder: "e.g., HDFC Mid-Cap Opportunities", text: $fundName)
                        formField(title: "Fund Code (Optional)", placeholder: "e.g., 100101", text: $fundCode)

                        // Asset Class Picker
                        VStack(alignment: .leading, spacing: 8) {
                            Text("ASSET CLASS")
                                .font(.system(size: 11, weight: .regular))
                                .foregroundColor(.secondary)
                                .tracking(0.5)

                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: AppTheme.Spacing.small) {
                                    ForEach([Holding.AssetClass.equity, .debt, .hybrid, .gold], id: \.self) { assetClass in
                                        assetClassChip(assetClass)
                                    }
                                }
                            }
                        }
                    }
                    .padding(AppTheme.Spacing.medium)
                    .background(cardBackground)
                    .overlay(cardBorder)

                    // Investment Details Card
                    VStack(spacing: AppTheme.Spacing.medium) {
                        formField(title: "Units", placeholder: "e.g., 150.254", text: $units, keyboardType: .decimalPad)
                        formField(title: "Invested Amount", placeholder: "e.g., 50000", text: $investedAmount, keyboardType: .decimalPad)
                        formField(title: "Current NAV", placeholder: "e.g., 425.50", text: $currentNav, keyboardType: .decimalPad)
                    }
                    .padding(AppTheme.Spacing.medium)
                    .background(cardBackground)
                    .overlay(cardBorder)

                    // Calculated Summary Card
                    if isValid {
                        let calc = calculatedValues
                        VStack(spacing: AppTheme.Spacing.compact) {
                            HStack {
                                Text("CALCULATED VALUES")
                                    .font(.system(size: 11, weight: .regular))
                                    .foregroundColor(.secondary)
                                    .tracking(0.5)
                                Spacer()
                            }

                            HStack {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text("Current Value")
                                        .font(.system(size: 12, weight: .regular))
                                        .foregroundColor(.secondary)
                                    Text(calc.currentValue.currencyFormatted)
                                        .font(.system(size: 16, weight: .semibold))
                                        .foregroundColor(.primary)
                                }

                                Spacer()

                                VStack(alignment: .trailing, spacing: 4) {
                                    Text("Returns")
                                        .font(.system(size: 12, weight: .regular))
                                        .foregroundColor(.secondary)
                                    HStack(spacing: 4) {
                                        Text(calc.returns.currencyFormatted)
                                            .font(.system(size: 16, weight: .semibold))
                                        Text("(\(calc.returnsPercentage.percentFormatted))")
                                            .font(.system(size: 13, weight: .medium))
                                    }
                                    .foregroundColor(calc.returns >= 0 ? .green : .red)
                                }
                            }
                        }
                        .padding(AppTheme.Spacing.medium)
                        .background(
                            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.large, style: .continuous)
                                .fill(calc.returns >= 0 ? Color.green.opacity(0.08) : Color.red.opacity(0.08))
                        )
                        .overlay(
                            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.large, style: .continuous)
                                .stroke(calc.returns >= 0 ? Color.green.opacity(0.2) : Color.red.opacity(0.2), lineWidth: 1)
                        )
                    }

                    // Add Button
                    Button {
                        addHolding()
                    } label: {
                        Text("Add Holding")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(
                                LinearGradient(
                                    colors: [.blue, .cyan],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                ),
                                in: RoundedRectangle(cornerRadius: 14, style: .continuous)
                            )
                    }
                    .disabled(!isValid)
                    .opacity(isValid ? 1 : 0.6)
                }
                .padding(AppTheme.Spacing.medium)
            }
            .background(Color(uiColor: .systemGroupedBackground))
            .navigationTitle("Add Holding")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
        }
    }

    private func formField(title: String, placeholder: String, text: Binding<String>, keyboardType: UIKeyboardType = .default) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title.uppercased())
                .font(.system(size: 11, weight: .regular))
                .foregroundColor(.secondary)
                .tracking(0.5)

            TextField(placeholder, text: text)
                .font(.system(size: 15, weight: .regular))
                .keyboardType(keyboardType)
                .padding(AppTheme.Spacing.compact)
                .background(
                    colorScheme == .dark
                        ? Color.white.opacity(0.06)
                        : Color(uiColor: .tertiarySystemFill),
                    in: RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
                )
        }
    }

    private func assetClassChip(_ assetClass: Holding.AssetClass) -> some View {
        Button {
            selectedAssetClass = assetClass
        } label: {
            HStack(spacing: 6) {
                Circle()
                    .fill(assetClass.color)
                    .frame(width: 8, height: 8)
                Text(assetClass.rawValue.capitalized)
                    .font(.system(size: 13, weight: .regular))
            }
            .foregroundColor(selectedAssetClass == assetClass ? .white : .primary)
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .background(
                selectedAssetClass == assetClass
                    ? AnyShapeStyle(assetClass.color)
                    : AnyShapeStyle(colorScheme == .dark ? Color.white.opacity(0.08) : Color(uiColor: .tertiarySystemFill)),
                in: Capsule()
            )
        }
    }

    private func addHolding() {
        let unitsVal = Double(units) ?? 0
        let investedVal = Double(investedAmount) ?? 0
        let navVal = Double(currentNav) ?? 0
        let calc = calculatedValues

        let holding = Holding(
            id: UUID().uuidString,
            fundCode: fundCode.isEmpty ? UUID().uuidString : fundCode,
            fundName: fundName,
            category: selectedAssetClass.rawValue.capitalized,
            assetClass: selectedAssetClass,
            units: unitsVal,
            averageNav: investedVal / unitsVal,
            currentNav: navVal,
            investedAmount: investedVal,
            currentValue: calc.currentValue,
            returns: calc.returns,
            returnsPercentage: calc.returnsPercentage
        )

        familyStore.addHolding(holding, to: memberId)
        dismiss()
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

#Preview {
    HomeView()
        .environmentObject(AuthManager())
        .environmentObject(PortfolioStore())
        .environmentObject(GoalsStore())
        .environmentObject(FundsStore())
        .environmentObject(DashboardStore())
        .environmentObject(FamilyStore())
        .environmentObject(NavigationStore())
        .environment(AnalysisProfileStore())
}
