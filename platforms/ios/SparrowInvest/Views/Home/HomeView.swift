import SwiftUI

struct HomeView: View {
    @EnvironmentObject var portfolioStore: PortfolioStore
    @EnvironmentObject var goalsStore: GoalsStore
    @EnvironmentObject var fundsStore: FundsStore
    @EnvironmentObject var authManager: AuthManager

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Greeting
                    GreetingHeader(name: authManager.user?.firstName ?? "Investor")

                    // Portfolio Summary Card
                    PortfolioSummaryCard(portfolio: portfolioStore.portfolio)

                    // Quick Actions
                    QuickActionsRow()

                    // Goals Section
                    if !goalsStore.goals.isEmpty {
                        GoalsSectionView(goals: goalsStore.goals)
                    }

                    // Recommendations
                    RecommendationsSectionView(recommendations: fundsStore.recommendations)
                }
                .padding()
            }
            .background(AppTheme.background)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    HStack {
                        Image(systemName: "bird.fill")
                            .foregroundColor(AppTheme.primary)
                        Text("Sparrow Invest")
                            .font(.headline)
                            .fontWeight(.bold)
                    }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    HStack(spacing: 16) {
                        Button(action: {}) {
                            Image(systemName: "bell.fill")
                                .foregroundColor(AppTheme.textSecondary)
                        }
                        NavigationLink(destination: ProfileView()) {
                            Image(systemName: "person.circle.fill")
                                .foregroundColor(AppTheme.textSecondary)
                        }
                    }
                }
            }
            .refreshable {
                await refreshData()
            }
        }
    }

    private func refreshData() async {
        await portfolioStore.fetchPortfolio()
        await goalsStore.fetchGoals()
        await fundsStore.fetchRecommendations()
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
                    .foregroundColor(AppTheme.textSecondary)
                Text(name)
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(AppTheme.textPrimary)
            }
            Spacer()
        }
    }
}

// MARK: - Quick Actions
struct QuickActionsRow: View {
    var body: some View {
        HStack(spacing: 12) {
            QuickActionButton(
                title: "Invest",
                icon: "plus.circle.fill",
                color: AppTheme.primary
            )

            QuickActionButton(
                title: "Withdraw",
                icon: "arrow.down.circle.fill",
                color: AppTheme.secondary
            )
        }
    }
}

struct QuickActionButton: View {
    let title: String
    let icon: String
    let color: Color

    var body: some View {
        Button(action: {}) {
            HStack {
                Image(systemName: icon)
                Text(title)
                    .fontWeight(.semibold)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .background(color)
            .foregroundColor(.white)
            .cornerRadius(12)
        }
    }
}

// MARK: - Goals Section
struct GoalsSectionView: View {
    let goals: [Goal]

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("MY GOALS")
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(AppTheme.primary)
                    .tracking(1)
                Spacer()
                NavigationLink(destination: GoalsView()) {
                    Text("See all")
                        .font(.caption)
                        .foregroundColor(AppTheme.primary)
                }
            }

            ForEach(goals.prefix(2)) { goal in
                GoalProgressCard(goal: goal)
            }
        }
    }
}

// MARK: - Recommendations Section
struct RecommendationsSectionView: View {
    let recommendations: [FundRecommendation]

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("RECOMMENDED FOR YOU")
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(AppTheme.primary)
                    .tracking(1)
                Spacer()
                NavigationLink(destination: ExploreView()) {
                    Text("See all")
                        .font(.caption)
                        .foregroundColor(AppTheme.primary)
                }
            }

            ForEach(recommendations.prefix(3)) { recommendation in
                RecommendationCard(recommendation: recommendation)
            }
        }
    }
}

#Preview {
    HomeView()
        .environmentObject(AuthManager())
        .environmentObject(PortfolioStore())
        .environmentObject(GoalsStore())
        .environmentObject(FundsStore())
}
