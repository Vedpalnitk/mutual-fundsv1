import SwiftUI

struct ProfileView: View {
    @EnvironmentObject var authManager: AuthManager

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: AppTheme.Spacing.xLarge) {
                    // Profile Header
                    ProfileHeader()

                    // Menu Sections
                    ProfileMenuSection(title: "Account", items: [
                        ProfileMenuItem(icon: "person.fill", title: "Edit Profile", destination: AnyView(EditProfileView())),
                        ProfileMenuItem(icon: "checkmark.shield.fill", title: "KYC Status", destination: AnyView(KYCStatusView())),
                        ProfileMenuItem(icon: "building.columns.fill", title: "Bank Accounts", destination: AnyView(BankAccountsView())),
                        ProfileMenuItem(icon: "chart.bar.fill", title: "Risk Profile", destination: AnyView(RiskProfileView()))
                    ])

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

                    // Logout Button
                    Button(action: {
                        authManager.logout()
                    }) {
                        HStack {
                            Image(systemName: "rectangle.portrait.and.arrow.right")
                            Text("Logout")
                        }
                        .foregroundColor(.red)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(
                            Color.red.opacity(0.1),
                            in: RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
                        )
                    }
                    .padding(.top)

                    // Version
                    Text("Version 1.0.0")
                        .font(.caption)
                        .foregroundColor(Color(uiColor: .tertiaryLabel))
                        .padding(.top, 8)
                }
                .padding()
            }
            .background(Color(uiColor: .systemGroupedBackground))
            .navigationTitle("Profile")
        }
    }
}

// MARK: - Profile Header
struct ProfileHeader: View {
    @EnvironmentObject var authManager: AuthManager

    var body: some View {
        VStack(spacing: 12) {
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
                    .frame(width: 80, height: 80)

                Text(authManager.user?.initials ?? "U")
                    .font(.title)
                    .fontWeight(.light)
                    .foregroundColor(.white)
            }

            VStack(spacing: 4) {
                Text(authManager.user?.fullName ?? "User")
                    .font(.title3)
                    .fontWeight(.light)
                    .foregroundColor(.primary)

                Text(authManager.user?.email ?? "email@example.com")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }

            // KYC Badge
            HStack(spacing: 4) {
                Image(systemName: "checkmark.seal.fill")
                    .foregroundColor(.green)
                Text("KYC Verified")
                    .font(.caption)
                    .fontWeight(.light)
                    .foregroundColor(.green)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(Color.green.opacity(0.1), in: Capsule())
        }
        .frame(maxWidth: .infinity)
        .padding(AppTheme.Spacing.medium)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: AppTheme.CornerRadius.xLarge, style: .continuous))
    }
}

// MARK: - Menu Section
struct ProfileMenuSection: View {
    let title: String
    let items: [ProfileMenuItem]

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title.uppercased())
                .font(.caption)
                .fontWeight(.regular)
                .foregroundColor(.blue)
                .tracking(1)

            VStack(spacing: 0) {
                ForEach(items) { item in
                    NavigationLink(destination: item.destination) {
                        HStack(spacing: 16) {
                            Image(systemName: item.icon)
                                .font(.body)
                                .foregroundColor(.blue)
                                .frame(width: 24)

                            Text(item.title)
                                .font(.body)
                                .foregroundColor(.primary)

                            Spacer()

                            Image(systemName: "chevron.right")
                                .font(.caption)
                                .foregroundColor(Color(uiColor: .tertiaryLabel))
                        }
                        .padding()
                    }

                    if item.id != items.last?.id {
                        Divider()
                            .padding(.leading, 56)
                    }
                }
            }
            .background(.regularMaterial, in: RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous))
        }
    }
}

struct ProfileMenuItem: Identifiable {
    let id = UUID()
    let icon: String
    let title: String
    let destination: AnyView
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

#Preview {
    ProfileView()
        .environmentObject(AuthManager())
}
