import SwiftUI

struct ContentView: View {
    @EnvironmentObject var authManager: AuthManager

    var body: some View {
        Group {
            if authManager.isAuthenticated {
                if authManager.hasCompletedOnboarding {
                    MainTabView()
                } else {
                    OnboardingFlow()
                }
            } else {
                AuthFlow()
            }
        }
        .animation(.easeInOut, value: authManager.isAuthenticated)
        .animation(.easeInOut, value: authManager.hasCompletedOnboarding)
    }
}

#Preview {
    ContentView()
        .environmentObject(AuthManager())
        .environmentObject(PortfolioStore())
        .environmentObject(GoalsStore())
        .environmentObject(FundsStore())
}
