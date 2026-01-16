import SwiftUI

struct MainTabView: View {
    @State private var selectedTab: Tab = .home

    enum Tab: String, CaseIterable {
        case home = "Home"
        case goals = "Goals"
        case invest = "Invest"
        case explore = "Explore"
        case profile = "Profile"

        var icon: String {
            switch self {
            case .home: return "house.fill"
            case .goals: return "target"
            case .invest: return "indianrupeesign.circle.fill"
            case .explore: return "magnifyingglass"
            case .profile: return "person.fill"
            }
        }
    }

    var body: some View {
        TabView(selection: $selectedTab) {
            HomeView()
                .tabItem {
                    Label(Tab.home.rawValue, systemImage: Tab.home.icon)
                }
                .tag(Tab.home)

            GoalsView()
                .tabItem {
                    Label(Tab.goals.rawValue, systemImage: Tab.goals.icon)
                }
                .tag(Tab.goals)

            InvestView()
                .tabItem {
                    Label(Tab.invest.rawValue, systemImage: Tab.invest.icon)
                }
                .tag(Tab.invest)

            ExploreView()
                .tabItem {
                    Label(Tab.explore.rawValue, systemImage: Tab.explore.icon)
                }
                .tag(Tab.explore)

            ProfileView()
                .tabItem {
                    Label(Tab.profile.rawValue, systemImage: Tab.profile.icon)
                }
                .tag(Tab.profile)
        }
        .tint(AppTheme.primary)
    }
}

#Preview {
    MainTabView()
        .environmentObject(AuthManager())
        .environmentObject(PortfolioStore())
        .environmentObject(GoalsStore())
        .environmentObject(FundsStore())
}
