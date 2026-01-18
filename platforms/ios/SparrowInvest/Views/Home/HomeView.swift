import SwiftUI

struct HomeView: View {
    @EnvironmentObject var portfolioStore: PortfolioStore
    @EnvironmentObject var goalsStore: GoalsStore
    @EnvironmentObject var fundsStore: FundsStore
    @EnvironmentObject var authManager: AuthManager
    @EnvironmentObject var dashboardStore: DashboardStore
    @EnvironmentObject var familyStore: FamilyStore

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
                        familyPortfolio: familyStore.familyPortfolio
                    )

                    // Quick Actions
                    QuickActionsRow()

                    // Portfolio Health Score
                    PortfolioHealthTile(
                        healthScore: portfolioStore.portfolioHealth,
                        onTapAnalysis: {
                            // Navigate to AI Analysis
                        }
                    )

                    // Asset Allocation Pie Chart
                    AssetAllocationPieChart(
                        allocation: currentPortfolio.assetAllocation
                    )

                    // Portfolio Growth Line Chart
                    PortfolioGrowthLineChart(
                        history: dashboardStore.portfolioHistory,
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

struct QuickActionsRow: View {
    var body: some View {
        HStack(spacing: AppTheme.Spacing.compact) {
            HomeQuickActionButton(
                title: "Invest",
                icon: "plus.circle.fill",
                color: .blue
            )

            HomeQuickActionButton(
                title: "Withdraw",
                icon: "arrow.down.circle.fill",
                color: .cyan
            )

            HomeQuickActionButton(
                title: "SIP",
                icon: "repeat.circle.fill",
                color: .green
            )
        }
    }
}

struct HomeQuickActionButton: View {
    let title: String
    let icon: String
    let color: Color

    var body: some View {
        Button(action: {}) {
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
            .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: AppTheme.CornerRadius.large, style: .continuous))
        }
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
}
