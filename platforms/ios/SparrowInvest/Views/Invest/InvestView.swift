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
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(.blue)
                        .tracking(1)

                    Text("Top performing funds for you")
                        .font(.system(size: 14, weight: .light))
                        .foregroundColor(.secondary)

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
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(.blue)
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
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(.blue)
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
                        .font(.system(size: 20))
                        .foregroundColor(color)
                }

                VStack(alignment: .leading, spacing: 4) {
                    Text(title)
                        .font(.system(size: 16, weight: .light))
                        .foregroundColor(.primary)
                    Text(subtitle)
                        .font(.system(size: 12, weight: .regular))
                        .foregroundColor(.secondary)
                }

                Spacer()

                Image(systemName: "chevron.right")
                    .foregroundColor(Color(uiColor: .tertiaryLabel))
            }
            .padding()
            .glassCardStyle(cornerRadius: AppTheme.CornerRadius.large)
        }
        .buttonStyle(.plain)
    }
}

struct QuickPickFundCard: View {
    var body: some View {
        HStack(spacing: 12) {
            RoundedRectangle(cornerRadius: 8)
                .fill(Color.blue.opacity(0.1))
                .frame(width: 44, height: 44)
                .overlay(
                    Text("PP")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(.blue)
                )

            VStack(alignment: .leading, spacing: 2) {
                Text("Parag Parikh Flexi Cap")
                    .font(.system(size: 14, weight: .light))
                    .foregroundColor(.primary)
                Text("Equity - Flexi Cap")
                    .font(.system(size: 12, weight: .regular))
                    .foregroundColor(.secondary)
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 2) {
                Text("+18.7%")
                    .font(.system(size: 14, weight: .light, design: .rounded))
                    .foregroundColor(.green)
                Text("3Y")
                    .font(.system(size: 12, weight: .regular))
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .listItemCardStyle(cornerRadius: AppTheme.CornerRadius.medium)
    }
}

struct SIPSummaryCard: View {
    var body: some View {
        VStack(spacing: 16) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("MONTHLY SIP")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(.blue)
                        .tracking(1)
                    Text("25,000".currencyFormatted)
                        .font(.system(size: 22, weight: .light, design: .rounded))
                        .foregroundColor(.primary)
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 4) {
                    Text("ACTIVE SIPs")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(.blue)
                        .tracking(1)
                    Text("5")
                        .font(.system(size: 22, weight: .light, design: .rounded))
                        .foregroundColor(.primary)
                }
            }
        }
        .padding()
        .background(
            LinearGradient(
                colors: [Color.blue.opacity(0.1), Color.cyan.opacity(0.05)],
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
                .font(.system(size: 32))
                .foregroundColor(Color(uiColor: .tertiaryLabel))
            Text("No active SIPs")
                .font(.system(size: 16, weight: .regular))
                .foregroundColor(.secondary)
            Text("Start your first SIP today")
                .font(.system(size: 12, weight: .regular))
                .foregroundColor(Color(uiColor: .tertiaryLabel))
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 40)
        .glassCardStyle(cornerRadius: AppTheme.CornerRadius.medium)
    }
}

struct SIPCard: View {
    let sip: SIP

    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                Text(sip.fundName)
                    .font(.system(size: 14, weight: .light))
                    .foregroundColor(.primary)
                Text("Next: \(sip.nextDate.formatted(date: .abbreviated, time: .omitted))")
                    .font(.system(size: 12, weight: .regular))
                    .foregroundColor(.secondary)
            }
            Spacer()
            Text(sip.amount.currencyFormatted)
                .font(.system(size: 16, weight: .light, design: .rounded))
                .foregroundColor(.blue)
        }
        .padding()
        .listItemCardStyle(cornerRadius: AppTheme.CornerRadius.medium)
    }
}

struct UpcomingSIPCalendar: View {
    var body: some View {
        VStack(spacing: 8) {
            HStack {
                Text("Jan 15")
                    .font(.system(size: 14, weight: .light))
                    .foregroundColor(.primary)
                Spacer()
                Text("3 SIPs - 15,000".currencyFormatted)
                    .font(.system(size: 14, weight: .light))
                    .foregroundColor(.secondary)
            }
            .padding()
            .listItemCardStyle(cornerRadius: AppTheme.CornerRadius.small)
        }
    }
}

#Preview {
    InvestView()
        .environmentObject(PortfolioStore())
}
