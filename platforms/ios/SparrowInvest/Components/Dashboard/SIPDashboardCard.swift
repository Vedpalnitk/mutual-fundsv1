//
//  SIPDashboardCard.swift
//  SparrowInvest
//
//  iOS 26 Liquid Glass SIP Dashboard
//

import SwiftUI

struct SIPDashboardCard: View {
    let activeSIPs: [SIP]

    private var totalMonthlyAmount: Double {
        activeSIPs.filter { $0.isActive }.reduce(0) { $0 + $1.amount }
    }

    private var nextSIPDate: Date? {
        activeSIPs
            .filter { $0.isActive }
            .compactMap { $0.nextInstallmentDate }
            .min()
    }

    private var nextSIPFormatted: String {
        guard let date = nextSIPDate else { return "No upcoming" }
        let formatter = DateFormatter()
        let calendar = Calendar.current

        if calendar.isDateInToday(date) {
            return "Today"
        } else if calendar.isDateInTomorrow(date) {
            return "Tomorrow"
        } else {
            formatter.dateFormat = "d MMM"
            return formatter.string(from: date)
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.medium) {
            // Header
            HStack {
                Text("SIP Dashboard")
                    .font(.system(size: 16, weight: .regular))
                    .foregroundColor(.primary)

                Spacer()

                NavigationLink(destination: Text("SIP Details")) {
                    HStack(spacing: 4) {
                        Text("Manage")
                            .font(.system(size: 13, weight: .light))
                        Image(systemName: "chevron.right")
                            .font(.system(size: 11, weight: .regular))
                    }
                    .foregroundColor(.blue)
                }
            }

            // Stats Grid
            HStack(spacing: 0) {
                // Active SIPs
                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 6) {
                        Image(systemName: "repeat.circle.fill")
                            .font(.system(size: 14))
                            .foregroundColor(.blue)
                        Text("Active")
                            .font(.system(size: 12, weight: .light))
                            .foregroundColor(.secondary)
                    }
                    Text("\(activeSIPs.filter { $0.isActive }.count)")
                        .font(.system(size: 22, weight: .light, design: .rounded))
                        .foregroundColor(.primary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)

                Divider()
                    .frame(height: 44)

                // Monthly Amount
                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 6) {
                        Image(systemName: "indianrupeesign.circle.fill")
                            .font(.system(size: 14))
                            .foregroundColor(.green)
                        Text("Monthly")
                            .font(.system(size: 12, weight: .light))
                            .foregroundColor(.secondary)
                    }
                    Text(totalMonthlyAmount.currencyFormatted)
                        .font(.system(size: 16, weight: .light, design: .rounded))
                        .foregroundColor(.primary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)

                Divider()
                    .frame(height: 44)

                // Next SIP
                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 6) {
                        Image(systemName: "calendar.badge.clock")
                            .font(.system(size: 14))
                            .foregroundColor(.orange)
                        Text("Next")
                            .font(.system(size: 12, weight: .light))
                            .foregroundColor(.secondary)
                    }
                    Text(nextSIPFormatted)
                        .font(.system(size: 16, weight: .light, design: .rounded))
                        .foregroundColor(.primary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }

            // Upcoming SIPs List
            let upcomingSIPs = Array(getUpcomingSIPs().prefix(2))
            if !upcomingSIPs.isEmpty {
                VStack(spacing: AppTheme.Spacing.small) {
                    ForEach(upcomingSIPs) { sip in
                        UpcomingSIPRow(sip: sip)
                    }
                }
            }
        }
        .padding(AppTheme.Spacing.medium)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: AppTheme.CornerRadius.xLarge, style: .continuous))
    }

    private func getUpcomingSIPs() -> [SIP] {
        activeSIPs
            .filter { $0.isActive && $0.nextInstallmentDate != nil }
            .sorted { ($0.nextInstallmentDate ?? Date()) < ($1.nextInstallmentDate ?? Date()) }
    }
}

struct UpcomingSIPRow: View {
    let sip: SIP

    var body: some View {
        HStack(spacing: 12) {
            // Fund Icon
            ZStack {
                RoundedRectangle(cornerRadius: AppTheme.CornerRadius.small, style: .continuous)
                    .fill(Color.blue.opacity(0.1))
                    .frame(width: 36, height: 36)

                Text(String(sip.fundName.prefix(2)).uppercased())
                    .font(.system(size: 11, weight: .regular))
                    .foregroundColor(.blue)
            }

            // Info
            VStack(alignment: .leading, spacing: 2) {
                Text(sip.fundName)
                    .font(.system(size: 13, weight: .light))
                    .foregroundColor(.primary)
                    .lineLimit(1)

                if let date = sip.nextInstallmentDate {
                    Text(formatDate(date))
                        .font(.system(size: 11, weight: .regular))
                        .foregroundColor(.secondary)
                }
            }

            Spacer()

            // Amount
            Text(sip.amount.currencyFormatted)
                .font(.system(size: 14, weight: .regular))
                .foregroundColor(.primary)
        }
        .padding(10)
        .background(
            Color(uiColor: .tertiarySystemFill),
            in: RoundedRectangle(cornerRadius: AppTheme.CornerRadius.small, style: .continuous)
        )
    }

    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "d MMM"
        return formatter.string(from: date)
    }
}

#Preview {
    SIPDashboardCard(activeSIPs: [])
        .padding()
}
