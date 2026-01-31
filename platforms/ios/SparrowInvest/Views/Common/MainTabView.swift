import SwiftUI

struct MainTabView: View {
    @EnvironmentObject var navigationStore: NavigationStore
    @EnvironmentObject var familyStore: FamilyStore
    @EnvironmentObject var advisorStore: AdvisorStore
    @State private var showAvyaChat = false

    var body: some View {
        ZStack {
            TabView(selection: $navigationStore.selectedTab) {
                HomeView()
                    .tabItem {
                        Label(NavigationStore.Tab.home.rawValue, systemImage: NavigationStore.Tab.home.icon)
                    }
                    .tag(NavigationStore.Tab.home)

                InvestmentsView()
                    .tabItem {
                        Label(NavigationStore.Tab.investments.rawValue, systemImage: NavigationStore.Tab.investments.icon)
                    }
                    .tag(NavigationStore.Tab.investments)

                AIAnalysisView()
                    .tabItem {
                        Label(NavigationStore.Tab.insights.rawValue, systemImage: NavigationStore.Tab.insights.icon)
                    }
                    .tag(NavigationStore.Tab.insights)

                ExploreView()
                    .tabItem {
                        Label(NavigationStore.Tab.explore.rawValue, systemImage: NavigationStore.Tab.explore.icon)
                    }
                    .tag(NavigationStore.Tab.explore)

                ProfileView()
                    .tabItem {
                        Label(NavigationStore.Tab.profile.rawValue, systemImage: NavigationStore.Tab.profile.icon)
                    }
                    .tag(NavigationStore.Tab.profile)
            }
            .tint(AppTheme.primary)

            // Avya Floating Action Button
            AvyaFABContainer(showAvyaChat: $showAvyaChat)
        }
        .fullScreenCover(isPresented: $showAvyaChat) {
            AIChatView()
        }
        .task {
            // Load family portfolio from API when main view appears
            await familyStore.loadFromAPI()

            // Set or clear the assigned advisor in AdvisorStore based on API response
            if let advisor = familyStore.advisor {
                advisorStore.setAssignedAdvisor(id: advisor.id, name: advisor.name, email: advisor.email)
            } else {
                // Clear assigned advisor for self-service users
                advisorStore.removeAssignedAdvisor()
            }
        }
    }
}

#Preview {
    MainTabView()
        .environmentObject(NavigationStore())
        .environmentObject(AuthManager())
        .environmentObject(PortfolioStore())
        .environmentObject(FundsStore())
        .environmentObject(FamilyStore())
        .environmentObject(AdvisorStore())
}
