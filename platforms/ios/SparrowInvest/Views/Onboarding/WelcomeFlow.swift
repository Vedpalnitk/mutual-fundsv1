import SwiftUI

struct WelcomeFlow: View {
    @EnvironmentObject var authManager: AuthManager
    @State private var currentPage = 0
    @Environment(\.colorScheme) private var colorScheme

    private let pages: [IntroPage] = [
        IntroPage(
            icon: "sparkles",
            iconColor: .blue,
            title: "AI-Powered Recommendations",
            description: "Get personalized mutual fund recommendations based on your goals, risk profile, and market conditions.",
            features: [
                "Goal-based portfolio allocation",
                "Real-time market insights",
                "Risk-adjusted recommendations"
            ]
        ),
        IntroPage(
            icon: "person.3.fill",
            iconColor: .cyan,
            title: "Family Portfolio Management",
            description: "Track and manage investments for your entire family in one place with a consolidated view.",
            features: [
                "Individual & family portfolios",
                "Joint investment tracking",
                "Financial goal planning for all"
            ]
        ),
        IntroPage(
            icon: "person.badge.shield.checkmark.fill",
            iconColor: .green,
            title: "Expert Fund Advisors",
            description: "Connect with SEBI-registered investment advisors for personalized guidance and tax planning.",
            features: [
                "Certified advisors",
                "One-on-one consultations",
                "Tax-optimized strategies"
            ]
        )
    ]

    var body: some View {
        VStack(spacing: 0) {
            // Skip button
            HStack {
                Spacer()
                Button(action: skipToLogin) {
                    Text("Skip")
                        .font(AppTheme.Typography.body())
                        .foregroundColor(AppTheme.textSecondary)
                }
                .padding(.trailing, 24)
            }
            .padding(.top, 16)

            Spacer()

            // Logo
            HStack(spacing: 8) {
                Image(systemName: "bird.fill")
                    .font(.system(size: 32))
                    .foregroundStyle(AppTheme.primaryGradient)
                Text("Sparrow Invest")
                    .font(AppTheme.Typography.title(28))
                    .foregroundColor(AppTheme.textPrimary)
            }
            .padding(.bottom, 32)

            // Page Content
            TabView(selection: $currentPage) {
                ForEach(0..<pages.count, id: \.self) { index in
                    IntroPageView(page: pages[index])
                        .tag(index)
                }
            }
            .tabViewStyle(.page(indexDisplayMode: .never))
            .frame(height: 420)

            // Page Indicators
            HStack(spacing: 8) {
                ForEach(0..<pages.count, id: \.self) { index in
                    Circle()
                        .fill(index == currentPage ? AppTheme.primary : (colorScheme == .dark ? Color.white.opacity(0.2) : Color.black.opacity(0.1)))
                        .frame(width: 8, height: 8)
                        .scaleEffect(index == currentPage ? 1.2 : 1.0)
                        .animation(.spring(response: 0.3), value: currentPage)
                }
            }
            .padding(.top, 16)

            Spacer()

            // Action Button
            Button(action: handleAction) {
                HStack(spacing: 8) {
                    Text(currentPage == pages.count - 1 ? "Get Started" : "Next")
                        .font(AppTheme.Typography.accent(17))
                    if currentPage < pages.count - 1 {
                        Image(systemName: "arrow.right")
                            .font(.system(size: 14, weight: .medium))
                    }
                }
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .background(AppTheme.primaryGradient)
                .cornerRadius(12)
            }
            .padding(.horizontal, 24)

            // Login Link
            Button(action: skipToLogin) {
                Text("Already have an account? ")
                    .foregroundColor(AppTheme.textSecondary)
                +
                Text("Log In")
                    .foregroundColor(AppTheme.primary)
                    .fontWeight(.medium)
            }
            .font(AppTheme.Typography.caption())
            .padding(.top, 16)
            .padding(.bottom, 40)
        }
        .background(AppTheme.background)
    }

    private func handleAction() {
        if currentPage < pages.count - 1 {
            withAnimation(.spring(response: 0.4)) {
                currentPage += 1
            }
        } else {
            skipToLogin()
        }
    }

    private func skipToLogin() {
        authManager.completeWelcome()
    }
}

// MARK: - Intro Page Model
struct IntroPage {
    let icon: String
    let iconColor: Color
    let title: String
    let description: String
    let features: [String]
}

// MARK: - Intro Page View
struct IntroPageView: View {
    let page: IntroPage
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        VStack(spacing: 24) {
            // Icon
            ZStack {
                RoundedRectangle(cornerRadius: AppTheme.CornerRadius.xLarge, style: .continuous)
                    .fill(page.iconColor.opacity(colorScheme == .dark ? 0.15 : 0.1))
                    .frame(width: 80, height: 80)

                Image(systemName: page.icon)
                    .font(.system(size: 36))
                    .foregroundColor(page.iconColor)
            }

            // Text Content
            VStack(spacing: 12) {
                Text(page.title)
                    .font(AppTheme.Typography.headline(20))
                    .foregroundColor(AppTheme.textPrimary)
                    .multilineTextAlignment(.center)

                Text(page.description)
                    .font(AppTheme.Typography.body(15))
                    .foregroundColor(AppTheme.textSecondary)
                    .multilineTextAlignment(.center)
                    .lineSpacing(4)
                    .padding(.horizontal, 32)
            }

            // Features List
            VStack(spacing: 12) {
                ForEach(page.features, id: \.self) { feature in
                    HStack(spacing: 12) {
                        ZStack {
                            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.small, style: .continuous)
                                .fill(page.iconColor.opacity(colorScheme == .dark ? 0.15 : 0.1))
                                .frame(width: 28, height: 28)
                            Image(systemName: "checkmark")
                                .font(.system(size: 12, weight: .semibold))
                                .foregroundColor(page.iconColor)
                        }
                        Text(feature)
                            .font(AppTheme.Typography.caption())
                            .foregroundColor(AppTheme.textPrimary)
                        Spacer()
                    }
                }
            }
            .padding(.horizontal, 48)
            .padding(.top, 8)
        }
    }
}

#Preview {
    WelcomeFlow()
        .environmentObject(AuthManager())
}
