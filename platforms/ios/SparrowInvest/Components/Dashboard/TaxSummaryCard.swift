//
//  TaxSummaryCard.swift
//  SparrowInvest
//
//  iOS 26 Liquid Glass Tax Summary Card
//

import SwiftUI

struct TaxSummaryCard: View {
    let taxSummary: TaxSummary

    var body: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.medium) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Tax Summary")
                        .font(.system(size: 16, weight: .regular))
                        .foregroundColor(.primary)

                    Text(taxSummary.financialYear)
                        .font(.system(size: 12, weight: .light))
                        .foregroundColor(.secondary)
                }

                Spacer()

                NavigationLink(destination: Text("Tax Details")) {
                    HStack(spacing: 4) {
                        Text("Details")
                            .font(.system(size: 13, weight: .light))
                        Image(systemName: "chevron.right")
                            .font(.system(size: 11, weight: .regular))
                    }
                    .foregroundColor(.blue)
                }
            }

            // Capital Gains
            HStack(spacing: AppTheme.Spacing.compact) {
                // LTCG
                VStack(alignment: .leading, spacing: 6) {
                    HStack(spacing: 4) {
                        Text("LTCG")
                            .font(.system(size: 12, weight: .light))
                            .foregroundColor(.secondary)
                        Image(systemName: "info.circle")
                            .font(.system(size: 10))
                            .foregroundColor(Color(uiColor: .tertiaryLabel))
                    }
                    Text(taxSummary.totalLTCG.currencyFormatted)
                        .font(.system(size: 16, weight: .light, design: .rounded))
                        .foregroundColor(taxSummary.totalLTCG >= 0 ? .green : .red)

                    Text("Tax: \(taxSummary.ltcgTaxLiability.currencyFormatted)")
                        .font(.system(size: 11, weight: .regular))
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(AppTheme.Spacing.compact)
                .background(
                    Color.green.opacity(0.1),
                    in: RoundedRectangle(cornerRadius: AppTheme.CornerRadius.small, style: .continuous)
                )

                // STCG
                VStack(alignment: .leading, spacing: 6) {
                    HStack(spacing: 4) {
                        Text("STCG")
                            .font(.system(size: 12, weight: .light))
                            .foregroundColor(.secondary)
                        Image(systemName: "info.circle")
                            .font(.system(size: 10))
                            .foregroundColor(Color(uiColor: .tertiaryLabel))
                    }
                    Text(taxSummary.totalSTCG.currencyFormatted)
                        .font(.system(size: 16, weight: .light, design: .rounded))
                        .foregroundColor(taxSummary.totalSTCG >= 0 ? .green : .red)

                    Text("Tax: \(taxSummary.stcgTaxLiability.currencyFormatted)")
                        .font(.system(size: 11, weight: .regular))
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(AppTheme.Spacing.compact)
                .background(
                    Color.blue.opacity(0.1),
                    in: RoundedRectangle(cornerRadius: AppTheme.CornerRadius.small, style: .continuous)
                )
            }

            // 80C ELSS Progress
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text("80C ELSS Investment")
                        .font(.system(size: 13, weight: .light))
                        .foregroundColor(.primary)

                    Spacer()

                    Text("\(taxSummary.elssInvestment.compactCurrencyFormatted) / \(taxSummary.elss80CLimit.compactCurrencyFormatted)")
                        .font(.system(size: 12, weight: .light))
                        .foregroundColor(.secondary)
                }

                GeometryReader { geometry in
                    ZStack(alignment: .leading) {
                        RoundedRectangle(cornerRadius: 4)
                            .fill(Color.blue.opacity(0.2))
                            .frame(height: 8)

                        RoundedRectangle(cornerRadius: 4)
                            .fill(
                                LinearGradient(
                                    colors: [.blue, .cyan],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .frame(width: geometry.size.width * taxSummary.elss80CProgress, height: 8)
                    }
                }
                .frame(height: 8)

                HStack {
                    Text("Tax Saved: \(taxSummary.totalTaxSaved.currencyFormatted)")
                        .font(.system(size: 12, weight: .regular))
                        .foregroundColor(.green)

                    Spacer()

                    if taxSummary.elss80CRemaining > 0 {
                        Text("Remaining: \(taxSummary.elss80CRemaining.compactCurrencyFormatted)")
                            .font(.system(size: 11, weight: .regular))
                            .foregroundColor(.secondary)
                    }
                }
            }
            .padding(AppTheme.Spacing.compact)
            .background(
                Color(uiColor: .tertiarySystemFill),
                in: RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
            )
        }
        .padding(AppTheme.Spacing.medium)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: AppTheme.CornerRadius.xLarge, style: .continuous))
    }
}

#Preview {
    TaxSummaryCard(taxSummary: .empty)
        .padding()
}
