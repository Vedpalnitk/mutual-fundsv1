//
//  DividendIncomeCard.swift
//  SparrowInvest
//
//  iOS 26 Liquid Glass Dividend Income Card
//

import SwiftUI

struct DividendIncomeCard: View {
    let dividendSummary: DividendSummary

    var body: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.medium) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Dividend Income")
                        .font(.system(size: 16, weight: .regular))
                        .foregroundColor(.primary)

                    Text(dividendSummary.financialYear)
                        .font(.system(size: 12, weight: .light))
                        .foregroundColor(.secondary)
                }

                Spacer()

                NavigationLink(destination: Text("Dividend Details")) {
                    HStack(spacing: 4) {
                        Text("View All")
                            .font(.system(size: 13, weight: .light))
                        Image(systemName: "chevron.right")
                            .font(.system(size: 11, weight: .regular))
                    }
                    .foregroundColor(.blue)
                }
            }

            // Stats Row
            HStack(spacing: 0) {
                // Received
                VStack(alignment: .leading, spacing: 4) {
                    Text("Received")
                        .font(.system(size: 12, weight: .light))
                        .foregroundColor(.secondary)
                    Text(dividendSummary.totalReceived.currencyFormatted)
                        .font(.system(size: 18, weight: .light, design: .rounded))
                        .foregroundColor(.green)
                }
                .frame(maxWidth: .infinity, alignment: .leading)

                Divider()
                    .frame(height: 40)

                // Projected
                VStack(alignment: .leading, spacing: 4) {
                    Text("Projected")
                        .font(.system(size: 12, weight: .light))
                        .foregroundColor(.secondary)
                    Text(dividendSummary.projectedAnnual.currencyFormatted)
                        .font(.system(size: 18, weight: .light, design: .rounded))
                        .foregroundColor(.primary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)

                Divider()
                    .frame(height: 40)

                // Yield
                VStack(alignment: .leading, spacing: 4) {
                    Text("Yield")
                        .font(.system(size: 12, weight: .light))
                        .foregroundColor(.secondary)
                    Text("\(String(format: "%.1f", dividendSummary.dividendYield))%")
                        .font(.system(size: 18, weight: .light, design: .rounded))
                        .foregroundColor(.blue)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }

            // Recent Dividends
            if !dividendSummary.recentRecords.isEmpty {
                VStack(alignment: .leading, spacing: AppTheme.Spacing.small) {
                    Text("Recent Dividends")
                        .font(.system(size: 13, weight: .light))
                        .foregroundColor(.secondary)

                    ForEach(dividendSummary.recentRecords.prefix(3)) { record in
                        DividendRecordRow(record: record)
                    }
                }
            }

            // Next Expected
            if let nextDate = dividendSummary.nextExpectedDate {
                HStack(spacing: 8) {
                    Image(systemName: "calendar.badge.clock")
                        .font(.system(size: 14))
                        .foregroundColor(.blue)

                    Text("Next expected: \(formatDate(nextDate))")
                        .font(.system(size: 12, weight: .light))
                        .foregroundColor(.secondary)
                }
                .padding(10)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(
                    Color.blue.opacity(0.1),
                    in: RoundedRectangle(cornerRadius: AppTheme.CornerRadius.small, style: .continuous)
                )
            }
        }
        .padding(AppTheme.Spacing.medium)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: AppTheme.CornerRadius.xLarge, style: .continuous))
    }

    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "d MMM yyyy"
        return formatter.string(from: date)
    }
}

struct DividendRecordRow: View {
    let record: DividendRecord

    var body: some View {
        HStack(spacing: 12) {
            // Fund Icon
            ZStack {
                RoundedRectangle(cornerRadius: AppTheme.CornerRadius.small, style: .continuous)
                    .fill(Color.purple.opacity(0.15))
                    .frame(width: 36, height: 36)

                Text(String(record.fundName.prefix(2)).uppercased())
                    .font(.system(size: 11, weight: .regular))
                    .foregroundColor(.purple)
            }

            // Info
            VStack(alignment: .leading, spacing: 2) {
                Text(record.fundName)
                    .font(.system(size: 13, weight: .light))
                    .foregroundColor(.primary)
                    .lineLimit(1)

                Text(formatPaymentDate(record.paymentDate))
                    .font(.system(size: 11, weight: .regular))
                    .foregroundColor(.secondary)
            }

            Spacer()

            // Amount & Status
            VStack(alignment: .trailing, spacing: 2) {
                Text(record.amount.currencyFormatted)
                    .font(.system(size: 13, weight: .regular))
                    .foregroundColor(.green)

                Text(record.status.rawValue)
                    .font(.system(size: 10, weight: .medium))
                    .foregroundColor(statusColor(record.status))
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(
                        statusColor(record.status).opacity(0.1),
                        in: Capsule()
                    )
            }
        }
        .padding(10)
        .background(
            Color(uiColor: .tertiarySystemFill),
            in: RoundedRectangle(cornerRadius: AppTheme.CornerRadius.small, style: .continuous)
        )
    }

    private func formatPaymentDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "d MMM"
        return formatter.string(from: date)
    }

    private func statusColor(_ status: DividendStatus) -> Color {
        switch status {
        case .announced: return .orange
        case .pending: return .blue
        case .paid: return .green
        }
    }
}

#Preview {
    DividendIncomeCard(dividendSummary: .empty)
        .padding()
}
