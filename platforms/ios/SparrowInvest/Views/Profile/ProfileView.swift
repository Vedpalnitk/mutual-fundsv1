import SwiftUI

struct ProfileView: View {
    @EnvironmentObject var authManager: AuthManager
    @EnvironmentObject var appearanceManager: AppearanceManager
    @EnvironmentObject var advisorStore: AdvisorStore
    @EnvironmentObject var navigationStore: NavigationStore
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: AppTheme.Spacing.xLarge) {
                    // Profile Header - Primary Glass Tile
                    ProfileHeader()

                    // Menu Sections - Primary Glass Tile with List Item Tiles
                    ProfileMenuSection(title: "Account", items: [
                        ProfileMenuItem(icon: "person.fill", title: "Edit Profile", destination: AnyView(EditProfileView())),
                        ProfileMenuItem(icon: "checkmark.shield.fill", title: "KYC Status", destination: AnyView(KYCStatusView())),
                        ProfileMenuItem(icon: "building.columns.fill", title: "Bank Accounts", destination: AnyView(BankAccountsView())),
                        ProfileMenuItem(icon: "chart.bar.fill", title: "Risk Profile", destination: AnyView(RiskProfileView()))
                    ])

                    // Financial Advisor Section
                    FinancialAdvisorSection()

                    // Preferences with Appearance Picker
                    AppearanceSection(appearanceManager: appearanceManager)

                    ProfileMenuSection(title: "Preferences", items: [
                        ProfileMenuItem(icon: "bell.fill", title: "Notifications", destination: AnyView(NotificationsSettingsView())),
                        ProfileMenuItem(icon: "lock.fill", title: "Security", destination: AnyView(SecuritySettingsView()))
                    ])

                    ProfileMenuSection(title: "Support", items: [
                        ProfileMenuItem(icon: "questionmark.circle.fill", title: "Help & FAQ", destination: AnyView(HelpView())),
                        ProfileMenuItem(icon: "doc.text.fill", title: "Tax Reports", destination: AnyView(TaxReportsView()))
                    ])

                    ProfileMenuSection(title: "Developer", items: [
                        ProfileMenuItem(icon: "paintbrush.fill", title: "Design System", destination: AnyView(DesignSystemView()))
                    ])

                    // Logout Button - Styled Tile
                    LogoutButton {
                        authManager.logout()
                    }

                    // Version
                    Text("Version 1.0.0")
                        .font(.system(size: 12, weight: .light))
                        .foregroundColor(Color(uiColor: .tertiaryLabel))
                        .padding(.top, 8)
                }
                .padding(AppTheme.Spacing.medium)
            }
            .background(Color(uiColor: .systemGroupedBackground))
            .navigationTitle("Profile")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}

// MARK: - Profile Header (Primary Glass Tile)

struct ProfileHeader: View {
    @EnvironmentObject var authManager: AuthManager
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        VStack(spacing: AppTheme.Spacing.compact) {
            // Avatar - Icon Container (Large)
            ZStack {
                Circle()
                    .fill(
                        LinearGradient(
                            colors: [.blue, .cyan],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 80, height: 80)

                Text(authManager.user?.initials ?? "U")
                    .font(.system(size: 28, weight: .light))
                    .foregroundColor(.white)
            }

            VStack(spacing: 4) {
                Text(authManager.user?.fullName ?? "User")
                    .font(.system(size: 20, weight: .regular))
                    .foregroundColor(.primary)

                Text(authManager.user?.email ?? "email@example.com")
                    .font(.system(size: 14, weight: .light))
                    .foregroundColor(.secondary)
            }

            // KYC Badge - Stat Badge Tile
            HStack(spacing: 4) {
                Image(systemName: "checkmark.seal.fill")
                    .font(.system(size: 12))
                Text("KYC Verified")
                    .font(.system(size: 12, weight: .medium))
            }
            .foregroundColor(.green)
            .padding(.horizontal, 14)
            .padding(.vertical, 8)
            .background(
                Color.green.opacity(colorScheme == .dark ? 0.15 : 0.12),
                in: Capsule()
            )
        }
        .frame(maxWidth: .infinity)
        .padding(AppTheme.Spacing.large)
        .background(primaryTileBackground)
        .overlay(primaryTileBorder)
        .shadow(color: primaryTileShadow, radius: 12, x: 0, y: 4)
    }

    private var primaryTileShadow: Color {
        colorScheme == .dark ? Color.clear : Color.black.opacity(0.08)
    }

    @ViewBuilder
    private var primaryTileBackground: some View {
        if colorScheme == .dark {
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.xxLarge, style: .continuous)
                .fill(Color.black.opacity(0.4))
                .background(
                    RoundedRectangle(cornerRadius: AppTheme.CornerRadius.xxLarge, style: .continuous)
                        .fill(.ultraThinMaterial)
                )
        } else {
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.xxLarge, style: .continuous)
                .fill(Color(uiColor: .white))
        }
    }

    private var primaryTileBorder: some View {
        RoundedRectangle(cornerRadius: AppTheme.CornerRadius.xxLarge, style: .continuous)
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
                            .init(color: .black.opacity(0.1), location: 0),
                            .init(color: .black.opacity(0.05), location: 0.3),
                            .init(color: .black.opacity(0.03), location: 0.7),
                            .init(color: .black.opacity(0.07), location: 1)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                      ),
                lineWidth: 1
            )
    }
}

// MARK: - Menu Section (Primary Glass Tile)

struct ProfileMenuSection: View {
    let title: String
    let items: [ProfileMenuItem]
    @Environment(\.colorScheme) private var colorScheme

    private var sectionShadow: Color {
        colorScheme == .dark ? Color.clear : Color.black.opacity(0.08)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.compact) {
            // Section Title
            Text(title.uppercased())
                .font(.system(size: 11, weight: .medium))
                .foregroundColor(.blue)
                .tracking(1)

            // Menu Items Container - Primary Glass Tile
            VStack(spacing: 0) {
                ForEach(Array(items.enumerated()), id: \.element.id) { index, item in
                    NavigationLink(destination: item.destination) {
                        ProfileMenuRow(item: item)
                    }
                    .buttonStyle(.plain)

                    if index < items.count - 1 {
                        Divider()
                            .padding(.leading, 52)
                    }
                }
            }
            .background(sectionBackground)
            .overlay(sectionBorder)
            .shadow(color: sectionShadow, radius: 12, x: 0, y: 4)
        }
    }

    @ViewBuilder
    private var sectionBackground: some View {
        if colorScheme == .dark {
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.large, style: .continuous)
                .fill(Color.black.opacity(0.4))
                .background(
                    RoundedRectangle(cornerRadius: AppTheme.CornerRadius.large, style: .continuous)
                        .fill(.ultraThinMaterial)
                )
        } else {
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.large, style: .continuous)
                .fill(Color(uiColor: .white))
        }
    }

    private var sectionBorder: some View {
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
                            .init(color: .black.opacity(0.1), location: 0),
                            .init(color: .black.opacity(0.05), location: 0.3),
                            .init(color: .black.opacity(0.03), location: 0.7),
                            .init(color: .black.opacity(0.07), location: 1)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                      ),
                lineWidth: 1
            )
    }
}

// MARK: - Menu Row (List Item Tile style)

struct ProfileMenuRow: View {
    let item: ProfileMenuItem
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        HStack(spacing: AppTheme.Spacing.medium) {
            // Icon Container
            ZStack {
                RoundedRectangle(cornerRadius: 8, style: .continuous)
                    .fill(Color.blue.opacity(0.15))
                    .frame(width: 32, height: 32)

                Image(systemName: item.icon)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(.blue)
            }

            Text(item.title)
                .font(.system(size: 15, weight: .regular))
                .foregroundColor(.primary)

            Spacer()

            Image(systemName: "chevron.right")
                .font(.system(size: 12, weight: .medium))
                .foregroundColor(Color(uiColor: .tertiaryLabel))
        }
        .padding(AppTheme.Spacing.medium)
        .contentShape(Rectangle())
    }
}

struct ProfileMenuItem: Identifiable {
    let id = UUID()
    let icon: String
    let title: String
    let destination: AnyView
}

// MARK: - Logout Button (Quick Access Tile style)

struct LogoutButton: View {
    let action: () -> Void
    @Environment(\.colorScheme) private var colorScheme

    private var logoutShadow: Color {
        colorScheme == .dark ? Color.clear : Color.black.opacity(0.08)
    }

    var body: some View {
        Button(action: action) {
            HStack(spacing: AppTheme.Spacing.compact) {
                ZStack {
                    RoundedRectangle(cornerRadius: 8, style: .continuous)
                        .fill(Color.red.opacity(0.15))
                        .frame(width: 32, height: 32)

                    Image(systemName: "rectangle.portrait.and.arrow.right")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(.red)
                }

                Text("Logout")
                    .font(.system(size: 15, weight: .medium))
                    .foregroundColor(.red)

                Spacer()
            }
            .padding(AppTheme.Spacing.medium)
            .frame(maxWidth: .infinity)
            .background(logoutBackground)
            .overlay(logoutBorder)
            .shadow(color: logoutShadow, radius: 12, x: 0, y: 4)
        }
        .buttonStyle(.plain)
    }

    @ViewBuilder
    private var logoutBackground: some View {
        if colorScheme == .dark {
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.large, style: .continuous)
                .fill(Color.black.opacity(0.4))
                .background(
                    RoundedRectangle(cornerRadius: AppTheme.CornerRadius.large, style: .continuous)
                        .fill(.ultraThinMaterial)
                )
                .overlay(
                    RoundedRectangle(cornerRadius: AppTheme.CornerRadius.large, style: .continuous)
                        .fill(Color.red.opacity(0.05))
                )
        } else {
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.large, style: .continuous)
                .fill(Color(uiColor: .white))
        }
    }

    private var logoutBorder: some View {
        RoundedRectangle(cornerRadius: AppTheme.CornerRadius.large, style: .continuous)
            .stroke(
                colorScheme == .dark
                    ? LinearGradient(
                        stops: [
                            .init(color: .red.opacity(0.4), location: 0),
                            .init(color: .red.opacity(0.2), location: 0.3),
                            .init(color: .red.opacity(0.1), location: 0.7),
                            .init(color: .red.opacity(0.15), location: 1)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                      )
                    : LinearGradient(
                        stops: [
                            .init(color: .red.opacity(0.2), location: 0),
                            .init(color: .red.opacity(0.15), location: 0.3),
                            .init(color: .red.opacity(0.1), location: 0.7),
                            .init(color: .red.opacity(0.15), location: 1)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                      ),
                lineWidth: 1
            )
    }
}

// MARK: - Placeholder Views

struct EditProfileView: View {
    var body: some View {
        Text("Edit Profile")
            .navigationTitle("Edit Profile")
    }
}

struct KYCStatusView: View {
    var body: some View {
        Text("KYC Status")
            .navigationTitle("KYC Status")
    }
}

struct BankAccountsView: View {
    var body: some View {
        Text("Bank Accounts")
            .navigationTitle("Bank Accounts")
    }
}

struct RiskProfileView: View {
    var body: some View {
        Text("Risk Profile")
            .navigationTitle("Risk Profile")
    }
}

struct NotificationsSettingsView: View {
    var body: some View {
        Text("Notifications")
            .navigationTitle("Notifications")
    }
}

struct SecuritySettingsView: View {
    var body: some View {
        Text("Security")
            .navigationTitle("Security")
    }
}

struct HelpView: View {
    var body: some View {
        Text("Help & FAQ")
            .navigationTitle("Help & FAQ")
    }
}

struct TaxReportsView: View {
    var body: some View {
        Text("Tax Reports")
            .navigationTitle("Tax Reports")
    }
}

// MARK: - Appearance Section

struct AppearanceSection: View {
    @ObservedObject var appearanceManager: AppearanceManager
    @Environment(\.colorScheme) private var colorScheme

    private var sectionShadow: Color {
        colorScheme == .dark ? Color.clear : Color.black.opacity(0.08)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.compact) {
            Text("APPEARANCE")
                .font(.system(size: 11, weight: .medium))
                .foregroundColor(.blue)
                .tracking(1)

            VStack(spacing: 0) {
                // Appearance mode picker
                HStack(spacing: AppTheme.Spacing.medium) {
                    ZStack {
                        RoundedRectangle(cornerRadius: 8, style: .continuous)
                            .fill(Color.blue.opacity(0.15))
                            .frame(width: 32, height: 32)

                        Image(systemName: appearanceManager.currentMode.icon)
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(.blue)
                    }

                    Text("Theme")
                        .font(.system(size: 15, weight: .regular))
                        .foregroundColor(.primary)

                    Spacer()

                    // Segmented picker for appearance modes
                    HStack(spacing: 2) {
                        ForEach(AppearanceMode.allCases, id: \.self) { mode in
                            Button {
                                appearanceManager.setMode(mode)
                            } label: {
                                Text(mode.rawValue)
                                    .font(.system(size: 12, weight: .medium))
                                    .foregroundColor(appearanceManager.currentMode == mode ? .white : .secondary)
                                    .padding(.horizontal, 10)
                                    .padding(.vertical, 6)
                                    .background {
                                        if appearanceManager.currentMode == mode {
                                            Capsule()
                                                .fill(Color.blue)
                                        }
                                    }
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(3)
                    .background(pickerBackground)
                    .overlay(pickerBorder)
                    .shadow(color: colorScheme == .dark ? .clear : .black.opacity(0.04), radius: 8, x: 0, y: 2)
                }
                .padding(AppTheme.Spacing.medium)
            }
            .background(sectionBackground)
            .overlay(sectionBorder)
            .shadow(color: sectionShadow, radius: 12, x: 0, y: 4)
        }
    }

    @ViewBuilder
    private var pickerBackground: some View {
        if colorScheme == .dark {
            Capsule()
                .fill(Color.black.opacity(0.4))
                .background(Capsule().fill(.ultraThinMaterial))
        } else {
            Capsule().fill(Color.white)
        }
    }

    private var pickerBorder: some View {
        Capsule()
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
                            .init(color: .black.opacity(0.1), location: 0),
                            .init(color: .black.opacity(0.05), location: 0.3),
                            .init(color: .black.opacity(0.03), location: 0.7),
                            .init(color: .black.opacity(0.07), location: 1)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                      ),
                lineWidth: 1
            )
    }

    @ViewBuilder
    private var sectionBackground: some View {
        if colorScheme == .dark {
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.large, style: .continuous)
                .fill(Color.black.opacity(0.4))
                .background(
                    RoundedRectangle(cornerRadius: AppTheme.CornerRadius.large, style: .continuous)
                        .fill(.ultraThinMaterial)
                )
        } else {
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.large, style: .continuous)
                .fill(Color(uiColor: .white))
        }
    }

    private var sectionBorder: some View {
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
                            .init(color: .black.opacity(0.1), location: 0),
                            .init(color: .black.opacity(0.05), location: 0.3),
                            .init(color: .black.opacity(0.03), location: 0.7),
                            .init(color: .black.opacity(0.07), location: 1)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                      ),
                lineWidth: 1
            )
    }
}

// MARK: - Financial Advisor Section

struct FinancialAdvisorSection: View {
    @EnvironmentObject var advisorStore: AdvisorStore
    @EnvironmentObject var navigationStore: NavigationStore
    @Environment(\.colorScheme) private var colorScheme

    @State private var showRatingSheet = false

    private var sectionShadow: Color {
        colorScheme == .dark ? Color.clear : Color.black.opacity(0.08)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.compact) {
            Text("FINANCIAL ADVISOR")
                .font(.system(size: 11, weight: .medium))
                .foregroundColor(.blue)
                .tracking(1)

            if let advisor = advisorStore.assignedAdvisor {
                // Has assigned advisor
                assignedAdvisorCard(advisor)
            } else {
                // No advisor assigned
                noAdvisorCard
            }
        }
        .sheet(isPresented: $showRatingSheet) {
            if let advisor = advisorStore.assignedAdvisor {
                AdvisorRatingSheet(advisor: advisor)
            }
        }
    }

    // MARK: - Assigned Advisor Card

    private func assignedAdvisorCard(_ advisor: Advisor) -> some View {
        VStack(spacing: 0) {
            // Advisor Info Row
            HStack(spacing: AppTheme.Spacing.medium) {
                // Avatar
                ZStack {
                    Circle()
                        .fill(
                            LinearGradient(
                                colors: [.blue, .cyan],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 56, height: 56)

                    Text(advisor.initials)
                        .font(.system(size: 18, weight: .medium))
                        .foregroundColor(.white)
                }

                VStack(alignment: .leading, spacing: 4) {
                    Text(advisor.name)
                        .font(.system(size: 16, weight: .medium))
                        .foregroundColor(.primary)

                    HStack(spacing: 4) {
                        Image(systemName: "star.fill")
                            .font(.system(size: 11))
                            .foregroundColor(.orange)
                        Text(String(format: "%.1f", advisor.rating))
                            .font(.system(size: 12, weight: .medium))
                            .foregroundColor(.primary)
                        Text("•")
                            .foregroundColor(.secondary)
                        Text(advisor.formattedExperience + " exp")
                            .font(.system(size: 12, weight: .regular))
                            .foregroundColor(.secondary)
                    }

                    // Specializations
                    HStack(spacing: 4) {
                        ForEach(advisor.specializations.prefix(2), id: \.self) { spec in
                            Text(spec.displayName)
                                .font(.system(size: 10, weight: .medium))
                                .foregroundColor(spec.color)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 3)
                                .background(
                                    spec.color.opacity(colorScheme == .dark ? 0.2 : 0.1),
                                    in: Capsule()
                                )
                        }
                    }
                }

                Spacer()
            }
            .padding(AppTheme.Spacing.medium)

            Divider()

            // Action Buttons
            HStack(spacing: 0) {
                // Call Button
                Button {
                    if let url = URL(string: "tel:\(advisor.phone.replacingOccurrences(of: " ", with: ""))") {
                        UIApplication.shared.open(url)
                    }
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: "phone.fill")
                            .font(.system(size: 14))
                        Text("Call")
                            .font(.system(size: 13, weight: .medium))
                    }
                    .foregroundColor(.green)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                }

                Divider()
                    .frame(height: 24)

                // Message Button
                Button {
                    if let url = URL(string: "mailto:\(advisor.email)") {
                        UIApplication.shared.open(url)
                    }
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: "envelope.fill")
                            .font(.system(size: 14))
                        Text("Email")
                            .font(.system(size: 13, weight: .medium))
                    }
                    .foregroundColor(.blue)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                }

                Divider()
                    .frame(height: 24)

                // Rate Button
                Button {
                    showRatingSheet = true
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: advisorStore.getUserRating(for: advisor.id) != nil ? "star.fill" : "star")
                            .font(.system(size: 14))
                        Text("Rate")
                            .font(.system(size: 13, weight: .medium))
                    }
                    .foregroundColor(.orange)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                }
            }
        }
        .background(sectionBackground)
        .overlay(sectionBorder)
        .shadow(color: sectionShadow, radius: 12, x: 0, y: 4)
    }

    // MARK: - No Advisor Card

    private var noAdvisorCard: some View {
        VStack(spacing: AppTheme.Spacing.medium) {
            // Icon
            ZStack {
                Circle()
                    .fill(Color.blue.opacity(0.1))
                    .frame(width: 64, height: 64)

                Image(systemName: "person.badge.plus")
                    .font(.system(size: 24, weight: .medium))
                    .foregroundColor(.blue)
            }

            VStack(spacing: 4) {
                Text("No Advisor Assigned")
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(.primary)

                Text("Connect with an expert to get personalized investment guidance")
                    .font(.system(size: 13, weight: .regular))
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }

            Button {
                navigationStore.selectedTab = .explore
                // In a real app, would navigate to AdvisorsView
            } label: {
                Text("Find an Advisor")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.white)
                    .padding(.horizontal, 24)
                    .padding(.vertical, 10)
                    .background(
                        LinearGradient(
                            colors: [.blue, .cyan],
                            startPoint: .leading,
                            endPoint: .trailing
                        ),
                        in: Capsule()
                    )
            }
        }
        .frame(maxWidth: .infinity)
        .padding(AppTheme.Spacing.large)
        .background(sectionBackground)
        .overlay(sectionBorder)
        .shadow(color: sectionShadow, radius: 12, x: 0, y: 4)
    }

    // MARK: - Background & Border

    @ViewBuilder
    private var sectionBackground: some View {
        if colorScheme == .dark {
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.large, style: .continuous)
                .fill(Color.black.opacity(0.4))
                .background(
                    RoundedRectangle(cornerRadius: AppTheme.CornerRadius.large, style: .continuous)
                        .fill(.ultraThinMaterial)
                )
        } else {
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.large, style: .continuous)
                .fill(Color(uiColor: .white))
        }
    }

    private var sectionBorder: some View {
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
                            .init(color: .black.opacity(0.1), location: 0),
                            .init(color: .black.opacity(0.05), location: 0.3),
                            .init(color: .black.opacity(0.03), location: 0.7),
                            .init(color: .black.opacity(0.07), location: 1)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                      ),
                lineWidth: 1
            )
    }
}

// MARK: - Advisor Rating Sheet

struct AdvisorRatingSheet: View {
    let advisor: Advisor

    @Environment(\.dismiss) private var dismiss
    @Environment(\.colorScheme) private var colorScheme
    @EnvironmentObject var advisorStore: AdvisorStore

    @State private var selectedRating: Int = 0
    @State private var feedbackText: String = ""
    @FocusState private var isFeedbackFocused: Bool

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: AppTheme.Spacing.xLarge) {
                    // Advisor Info
                    VStack(spacing: AppTheme.Spacing.compact) {
                        ZStack {
                            Circle()
                                .fill(
                                    LinearGradient(
                                        colors: [.blue, .cyan],
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    )
                                )
                                .frame(width: 72, height: 72)

                            Text(advisor.initials)
                                .font(.system(size: 24, weight: .medium))
                                .foregroundColor(.white)
                        }

                        Text(advisor.name)
                            .font(.system(size: 18, weight: .medium))
                            .foregroundColor(.primary)

                        Text("Your Financial Advisor")
                            .font(.system(size: 13, weight: .regular))
                            .foregroundColor(.secondary)
                    }

                    // Rating Stars
                    VStack(spacing: AppTheme.Spacing.compact) {
                        Text("How would you rate your experience?")
                            .font(.system(size: 15, weight: .regular))
                            .foregroundColor(.primary)

                        HStack(spacing: 12) {
                            ForEach(1...5, id: \.self) { rating in
                                Button {
                                    withAnimation(.spring(response: 0.3)) {
                                        selectedRating = rating
                                    }
                                } label: {
                                    Image(systemName: rating <= selectedRating ? "star.fill" : "star")
                                        .font(.system(size: 36))
                                        .foregroundColor(rating <= selectedRating ? .orange : Color(uiColor: .tertiaryLabel))
                                        .scaleEffect(rating <= selectedRating ? 1.1 : 1.0)
                                }
                            }
                        }
                        .padding(.vertical, 8)

                        if selectedRating > 0 {
                            Text(ratingDescription)
                                .font(.system(size: 14, weight: .medium))
                                .foregroundColor(ratingColor)
                                .transition(.opacity)
                        }
                    }

                    // Feedback Text
                    VStack(alignment: .leading, spacing: 8) {
                        Text("ADDITIONAL FEEDBACK (OPTIONAL)")
                            .font(.system(size: 11, weight: .regular))
                            .foregroundColor(.secondary)
                            .tracking(0.5)

                        TextEditor(text: $feedbackText)
                            .font(.system(size: 15, weight: .regular))
                            .frame(height: 100)
                            .focused($isFeedbackFocused)
                            .padding(AppTheme.Spacing.compact)
                            .background(
                                colorScheme == .dark
                                    ? Color.white.opacity(0.06)
                                    : Color(uiColor: .tertiarySystemFill),
                                in: RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
                            )
                            .overlay(
                                RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
                                    .stroke(colorScheme == .dark ? Color.white.opacity(0.1) : Color.clear, lineWidth: 1)
                            )
                    }

                    // Submit Button
                    Button {
                        advisorStore.rateAdvisor(advisor.id, rating: selectedRating)
                        dismiss()
                    } label: {
                        Text("Submit Rating")
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
                    .disabled(selectedRating == 0)
                    .opacity(selectedRating == 0 ? 0.6 : 1)
                }
                .padding(AppTheme.Spacing.medium)
            }
            .background(Color(uiColor: .systemGroupedBackground))
            .navigationTitle("Rate Your Advisor")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }
            }
            .onAppear {
                // Pre-fill with existing rating if any
                if let existingRating = advisorStore.getUserRating(for: advisor.id) {
                    selectedRating = existingRating
                }
            }
            .onTapGesture {
                isFeedbackFocused = false
            }
        }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
    }

    private var ratingDescription: String {
        switch selectedRating {
        case 1: return "Poor"
        case 2: return "Fair"
        case 3: return "Good"
        case 4: return "Very Good"
        case 5: return "Excellent"
        default: return ""
        }
    }

    private var ratingColor: Color {
        switch selectedRating {
        case 1...2: return .red
        case 3: return .orange
        case 4...5: return .green
        default: return .secondary
        }
    }
}

#Preview {
    ProfileView()
        .environmentObject(AuthManager())
        .environmentObject(AppearanceManager())
        .environmentObject(AdvisorStore())
        .environmentObject(NavigationStore())
}
