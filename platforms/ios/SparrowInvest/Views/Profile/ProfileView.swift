import SwiftUI

struct ProfileView: View {
    @EnvironmentObject var authManager: AuthManager

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
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

                    // Logout Button
                    Button(action: {
                        authManager.logout()
                    }) {
                        HStack {
                            Image(systemName: "rectangle.portrait.and.arrow.right")
                            Text("Logout")
                        }
                        .foregroundColor(AppTheme.error)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(AppTheme.error.opacity(0.1))
                        .cornerRadius(12)
                    }
                    .padding(.top)

                    // Version
                    Text("Version 1.0.0")
                        .font(.caption)
                        .foregroundColor(AppTheme.textTertiary)
                        .padding(.top, 8)
                }
                .padding()
            }
            .background(AppTheme.background)
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
                            colors: [AppTheme.primary, AppTheme.secondary],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 80, height: 80)

                Text(authManager.user?.initials ?? "U")
                    .font(.title)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
            }

            VStack(spacing: 4) {
                Text(authManager.user?.fullName ?? "User")
                    .font(.title3)
                    .fontWeight(.bold)
                    .foregroundColor(AppTheme.textPrimary)

                Text(authManager.user?.email ?? "email@example.com")
                    .font(.subheadline)
                    .foregroundColor(AppTheme.textSecondary)
            }

            // KYC Badge
            HStack(spacing: 4) {
                Image(systemName: "checkmark.seal.fill")
                    .foregroundColor(AppTheme.success)
                Text("KYC Verified")
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundColor(AppTheme.success)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(AppTheme.success.opacity(0.1))
            .cornerRadius(20)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(AppTheme.cardBackground)
        .cornerRadius(16)
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
                .fontWeight(.semibold)
                .foregroundColor(AppTheme.primary)
                .tracking(1)

            VStack(spacing: 0) {
                ForEach(items) { item in
                    NavigationLink(destination: item.destination) {
                        HStack(spacing: 16) {
                            Image(systemName: item.icon)
                                .font(.body)
                                .foregroundColor(AppTheme.primary)
                                .frame(width: 24)

                            Text(item.title)
                                .font(.body)
                                .foregroundColor(AppTheme.textPrimary)

                            Spacer()

                            Image(systemName: "chevron.right")
                                .font(.caption)
                                .foregroundColor(AppTheme.textTertiary)
                        }
                        .padding()
                    }

                    if item.id != items.last?.id {
                        Divider()
                            .padding(.leading, 56)
                    }
                }
            }
            .background(AppTheme.cardBackground)
            .cornerRadius(12)
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
