import SwiftUI

struct InvestView: View {
    @State private var selectedSegment = 0
    let segments = ["Quick Invest", "My SIPs"]

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Segment Control
                Picker("", selection: $selectedSegment) {
                    ForEach(0..<segments.count, id: \.self) { index in
                        Text(segments[index]).tag(index)
                    }
                }
                .pickerStyle(.segmented)
                .padding()

                // Content based on selection
                if selectedSegment == 0 {
                    QuickInvestView()
                } else {
                    MySIPsView()
                }
            }
            .background(AppTheme.background)
            .navigationTitle("Invest")
        }
    }
}

// MARK: - Quick Invest
struct QuickInvestView: View {
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Investment Options
                InvestOptionCard(
                    title: "Start a SIP",
                    subtitle: "Invest monthly in mutual funds",
                    icon: "calendar.badge.plus",
                    color: AppTheme.primary
                )

                InvestOptionCard(
                    title: "Lump Sum",
                    subtitle: "One-time investment",
                    icon: "indianrupeesign.circle",
                    color: AppTheme.success
                )

                InvestOptionCard(
                    title: "Invest in Goal",
                    subtitle: "Add to existing goals",
                    icon: "target",
                    color: AppTheme.warning
                )

                // Recommended for Quick Investment
                VStack(alignment: .leading, spacing: 12) {
                    Text("QUICK PICKS")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundColor(AppTheme.primary)
                        .tracking(1)

                    Text("Top performing funds for you")
                        .font(.subheadline)
                        .foregroundColor(AppTheme.textSecondary)

                    // Placeholder for fund cards
                    ForEach(0..<3, id: \.self) { _ in
                        QuickPickFundCard()
                    }
                }
                .padding(.top)
            }
            .padding()
        }
    }
}

// MARK: - My SIPs
struct MySIPsView: View {
    @EnvironmentObject var portfolioStore: PortfolioStore

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                // SIP Summary
                SIPSummaryCard()

                // Active SIPs
                VStack(alignment: .leading, spacing: 12) {
                    Text("ACTIVE SIPs")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundColor(AppTheme.primary)
                        .tracking(1)

                    if portfolioStore.activeSIPs.isEmpty {
                        EmptySIPsView()
                    } else {
                        ForEach(portfolioStore.activeSIPs) { sip in
                            SIPCard(sip: sip)
                        }
                    }
                }

                // Upcoming SIPs
                VStack(alignment: .leading, spacing: 12) {
                    Text("UPCOMING DEBITS")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundColor(AppTheme.primary)
                        .tracking(1)

                    UpcomingSIPCalendar()
                }
            }
            .padding()
        }
    }
}

// MARK: - Supporting Views
struct InvestOptionCard: View {
    let title: String
    let subtitle: String
    let icon: String
    let color: Color

    var body: some View {
        Button(action: {}) {
            HStack(spacing: 16) {
                ZStack {
                    Circle()
                        .fill(color.opacity(0.1))
                        .frame(width: 50, height: 50)
                    Image(systemName: icon)
                        .font(.title2)
                        .foregroundColor(color)
                }

                VStack(alignment: .leading, spacing: 4) {
                    Text(title)
                        .font(.headline)
                        .foregroundColor(AppTheme.textPrimary)
                    Text(subtitle)
                        .font(.caption)
                        .foregroundColor(AppTheme.textSecondary)
                }

                Spacer()

                Image(systemName: "chevron.right")
                    .foregroundColor(AppTheme.textTertiary)
            }
            .padding()
            .background(AppTheme.cardBackground)
            .cornerRadius(16)
            .shadow(color: AppTheme.shadowColor, radius: 4, x: 0, y: 2)
        }
        .buttonStyle(.plain)
    }
}

struct QuickPickFundCard: View {
    var body: some View {
        HStack(spacing: 12) {
            RoundedRectangle(cornerRadius: 8)
                .fill(AppTheme.primary.opacity(0.1))
                .frame(width: 44, height: 44)
                .overlay(
                    Text("PP")
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(AppTheme.primary)
                )

            VStack(alignment: .leading, spacing: 2) {
                Text("Parag Parikh Flexi Cap")
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(AppTheme.textPrimary)
                Text("Equity - Flexi Cap")
                    .font(.caption)
                    .foregroundColor(AppTheme.textSecondary)
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 2) {
                Text("+18.7%")
                    .font(.subheadline)
                    .fontWeight(.bold)
                    .foregroundColor(AppTheme.success)
                Text("3Y")
                    .font(.caption)
                    .foregroundColor(AppTheme.textSecondary)
            }
        }
        .padding()
        .background(AppTheme.cardBackground)
        .cornerRadius(12)
    }
}

struct SIPSummaryCard: View {
    var body: some View {
        VStack(spacing: 16) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("MONTHLY SIP")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundColor(AppTheme.primary)
                        .tracking(1)
                    Text("25,000".currencyFormatted)
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(AppTheme.textPrimary)
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 4) {
                    Text("ACTIVE SIPs")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundColor(AppTheme.primary)
                        .tracking(1)
                    Text("5")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(AppTheme.textPrimary)
                }
            }
        }
        .padding()
        .background(
            LinearGradient(
                colors: [AppTheme.primary.opacity(0.1), AppTheme.secondary.opacity(0.05)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .cornerRadius(16)
    }
}

struct EmptySIPsView: View {
    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: "calendar.badge.plus")
                .font(.largeTitle)
                .foregroundColor(AppTheme.textTertiary)
            Text("No active SIPs")
                .font(.headline)
                .foregroundColor(AppTheme.textSecondary)
            Text("Start your first SIP today")
                .font(.caption)
                .foregroundColor(AppTheme.textTertiary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 40)
        .background(AppTheme.cardBackground)
        .cornerRadius(12)
    }
}

struct SIPCard: View {
    let sip: SIP

    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                Text(sip.fundName)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(AppTheme.textPrimary)
                Text("Next: \(sip.nextDate.formatted(date: .abbreviated, time: .omitted))")
                    .font(.caption)
                    .foregroundColor(AppTheme.textSecondary)
            }
            Spacer()
            Text(sip.amount.currencyFormatted)
                .font(.headline)
                .fontWeight(.bold)
                .foregroundColor(AppTheme.primary)
        }
        .padding()
        .background(AppTheme.cardBackground)
        .cornerRadius(12)
    }
}

struct UpcomingSIPCalendar: View {
    var body: some View {
        VStack(spacing: 8) {
            HStack {
                Text("Jan 15")
                    .font(.subheadline)
                    .fontWeight(.medium)
                Spacer()
                Text("3 SIPs - 15,000".currencyFormatted)
                    .font(.subheadline)
                    .foregroundColor(AppTheme.textSecondary)
            }
            .padding()
            .background(AppTheme.cardBackground)
            .cornerRadius(8)
        }
    }
}

#Preview {
    InvestView()
        .environmentObject(PortfolioStore())
}
