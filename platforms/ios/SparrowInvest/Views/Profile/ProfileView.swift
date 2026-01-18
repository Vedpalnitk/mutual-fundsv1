import SwiftUI

struct ProfileView: View {
    @EnvironmentObject var authManager: AuthManager
    @EnvironmentObject var appearanceManager: AppearanceManager
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
                    HStack(spacing: 4) {
                        ForEach(AppearanceMode.allCases, id: \.self) { mode in
                            Button {
                                appearanceManager.setMode(mode)
                            } label: {
                                HStack(spacing: 4) {
                                    Image(systemName: mode.icon)
                                        .font(.system(size: 11))
                                    Text(mode.rawValue)
                                        .font(.system(size: 11, weight: .medium))
                                }
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
                    .padding(4)
                    .background(
                        Capsule()
                            .fill(colorScheme == .dark ? Color.white.opacity(0.08) : Color(uiColor: .tertiarySystemFill))
                    )
                }
                .padding(AppTheme.Spacing.medium)
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

#Preview {
    ProfileView()
        .environmentObject(AuthManager())
        .environmentObject(AppearanceManager())
}
