import SwiftUI

struct WelcomeFlow: View {
    @EnvironmentObject var authManager: AuthManager
    @State private var currentPage = 0
    @State private var logoAppeared = false
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
                        .font(.system(size: 14, weight: .light))
                        .foregroundColor(.secondary)
                }
                .padding(.trailing, 24)
            }
            .padding(.top, 16)

            Spacer()

            // Logo with entrance animation
            HStack(spacing: 8) {
                Image(systemName: "bird.fill")
                    .font(.system(size: 32))
                    .foregroundStyle(AppTheme.primaryGradient)
                Text("Sparrow Invest")
                    .font(.system(size: 28, weight: .regular))
                    .foregroundColor(.primary)
            }
            .scaleEffect(logoAppeared ? 1 : 0.8)
            .opacity(logoAppeared ? 1 : 0)
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
                        .font(.system(size: 17, weight: .medium))
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
                    .foregroundColor(.secondary)
                +
                Text("Log In")
                    .foregroundColor(AppTheme.primary)
                    .fontWeight(.medium)
            }
            .font(.system(size: 12, weight: .regular))
            .padding(.top, 16)
            .padding(.bottom, 40)
        }
        .background(AppTheme.background)
        .onAppear {
            withAnimation(.spring(response: 0.7, dampingFraction: 0.8)) {
                logoAppeared = true
            }
        }
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

    // Animation states
    @State private var iconAppeared = false
    @State private var titleAppeared = false
    @State private var descriptionAppeared = false
    @State private var featuresAppeared = false
    @State private var floatOffset: CGFloat = 0
    @State private var glowOpacity: Double = 0.3
    @State private var particlePhase: CGFloat = 0

    var body: some View {
        VStack(spacing: 24) {
            // Icon with floating animation and particles
            ZStack {
                // Particle effects
                ForEach(0..<6, id: \.self) { index in
                    ParticleView(
                        color: page.iconColor,
                        index: index,
                        phase: particlePhase
                    )
                }

                // Glow effect
                RoundedRectangle(cornerRadius: AppTheme.CornerRadius.xLarge + 8, style: .continuous)
                    .fill(page.iconColor.opacity(glowOpacity * 0.3))
                    .frame(width: 96, height: 96)
                    .blur(radius: 20)

                // Icon background
                RoundedRectangle(cornerRadius: AppTheme.CornerRadius.xLarge, style: .continuous)
                    .fill(page.iconColor.opacity(colorScheme == .dark ? 0.15 : 0.1))
                    .frame(width: 80, height: 80)

                Image(systemName: page.icon)
                    .font(.system(size: 36))
                    .foregroundColor(page.iconColor)
            }
            .offset(y: floatOffset)
            .scaleEffect(iconAppeared ? 1 : 0.5)
            .opacity(iconAppeared ? 1 : 0)

            // Text Content
            VStack(spacing: 12) {
                Text(page.title)
                    .font(.system(size: 20, weight: .regular))
                    .foregroundColor(.primary)
                    .multilineTextAlignment(.center)
                    .offset(y: titleAppeared ? 0 : 20)
                    .opacity(titleAppeared ? 1 : 0)

                Text(page.description)
                    .font(.system(size: 15, weight: .light))
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .lineSpacing(4)
                    .padding(.horizontal, 32)
                    .offset(y: descriptionAppeared ? 0 : 20)
                    .opacity(descriptionAppeared ? 1 : 0)
            }

            // Features List
            VStack(spacing: 12) {
                ForEach(Array(page.features.enumerated()), id: \.offset) { index, feature in
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
                            .font(.system(size: 12, weight: .regular))
                            .foregroundColor(.primary)
                        Spacer()
                    }
                    .offset(x: featuresAppeared ? 0 : -30)
                    .opacity(featuresAppeared ? 1 : 0)
                    .animation(
                        .spring(response: 0.5, dampingFraction: 0.7)
                        .delay(Double(index) * 0.1),
                        value: featuresAppeared
                    )
                }
            }
            .padding(.horizontal, 48)
            .padding(.top, 8)
        }
        .onAppear {
            startAnimations()
        }
        .onDisappear {
            resetAnimations()
        }
    }

    private func startAnimations() {
        // Staggered entrance animations
        withAnimation(.spring(response: 0.6, dampingFraction: 0.7)) {
            iconAppeared = true
        }

        withAnimation(.spring(response: 0.5, dampingFraction: 0.8).delay(0.15)) {
            titleAppeared = true
        }

        withAnimation(.spring(response: 0.5, dampingFraction: 0.8).delay(0.25)) {
            descriptionAppeared = true
        }

        withAnimation(.spring(response: 0.5, dampingFraction: 0.8).delay(0.35)) {
            featuresAppeared = true
        }

        // Floating animation (continuous)
        withAnimation(
            .easeInOut(duration: 2.0)
            .repeatForever(autoreverses: true)
        ) {
            floatOffset = -8
        }

        // Glow pulsing
        withAnimation(
            .easeInOut(duration: 1.5)
            .repeatForever(autoreverses: true)
        ) {
            glowOpacity = 0.6
        }

        // Particle animation
        withAnimation(
            .linear(duration: 4.0)
            .repeatForever(autoreverses: false)
        ) {
            particlePhase = 1
        }
    }

    private func resetAnimations() {
        iconAppeared = false
        titleAppeared = false
        descriptionAppeared = false
        featuresAppeared = false
        floatOffset = 0
        glowOpacity = 0.3
        particlePhase = 0
    }
}

// MARK: - Particle View
struct ParticleView: View {
    let color: Color
    let index: Int
    let phase: CGFloat

    private var angle: Double {
        Double(index) * (360.0 / 6.0)
    }

    private var radius: CGFloat {
        55 + CGFloat(index % 2) * 15
    }

    private var size: CGFloat {
        CGFloat([4, 5, 6, 4, 5, 3][index % 6])
    }

    private var currentAngle: Double {
        angle + Double(phase) * 360
    }

    var body: some View {
        Circle()
            .fill(color.opacity(0.4 + Double(index % 3) * 0.15))
            .frame(width: size, height: size)
            .blur(radius: 1)
            .offset(
                x: CGFloat(cos(currentAngle * Double.pi / 180.0)) * radius,
                y: CGFloat(sin(currentAngle * Double.pi / 180.0)) * radius
            )
            .opacity(0.3 + sin(Double(phase) * Double.pi * 2.0 + Double(index)) * 0.3)
    }
}

#Preview {
    WelcomeFlow()
        .environmentObject(AuthManager())
}
