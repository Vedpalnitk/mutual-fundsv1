//
//  PortfolioHeroCard.swift
//  SparrowInvest
//
//  iOS 26 Liquid Glass Portfolio Hero - SF Pro Light
//

import SwiftUI

struct PortfolioHeroCard: View {
    let portfolio: Portfolio
    @Binding var viewMode: PortfolioViewMode
    var familyPortfolio: FamilyPortfolio?

    private var currentValue: Double {
        viewMode == .family ? (familyPortfolio?.totalValue ?? portfolio.currentValue) : portfolio.currentValue
    }

    private var investedValue: Double {
        viewMode == .family ? (familyPortfolio?.totalInvested ?? portfolio.totalInvested) : portfolio.totalInvested
    }

    private var returns: Double {
        viewMode == .family ? (familyPortfolio?.totalReturns ?? portfolio.totalReturns) : portfolio.totalReturns
    }

    private var returnsPercentage: Double {
        viewMode == .family ? (familyPortfolio?.returnsPercentage ?? portfolio.absoluteReturnsPercentage) : portfolio.absoluteReturnsPercentage
    }

    private var xirrValue: Double {
        viewMode == .family ? (familyPortfolio?.familyXIRR ?? portfolio.xirr ?? 0) : (portfolio.xirr ?? 0)
    }

    var body: some View {
        VStack(spacing: AppTheme.Spacing.large) {
            // View Mode Toggle
            viewModeToggle

            // Main Value Display
            VStack(spacing: 8) {
                Text("Total Portfolio Value")
                    .font(.system(size: 14, weight: .light))
                    .foregroundColor(.secondary)

                Text(currentValue.currencyFormatted)
                    .font(.system(size: 38, weight: .light, design: .rounded))
                    .foregroundColor(.primary)

                // Returns Badge
                HStack(spacing: 6) {
                    Image(systemName: returns >= 0 ? "arrow.up.right" : "arrow.down.right")
                        .font(.system(size: 12, weight: .regular))
                    Text("\(returns >= 0 ? "+" : "")\(returns.compactCurrencyFormatted)")
                        .font(.system(size: 14, weight: .regular))
                    Text("(\(returnsPercentage.percentFormatted))")
                        .font(.system(size: 14, weight: .light))
                }
                .foregroundColor(returns >= 0 ? .green : .red)
                .padding(.horizontal, 14)
                .padding(.vertical, 8)
                .background(
                    (returns >= 0 ? Color.green : Color.red).opacity(0.12),
                    in: Capsule()
                )
            }

            // Stats Row
            HStack(spacing: 0) {
                HeroStatItem(
                    label: "Invested",
                    value: investedValue.compactCurrencyFormatted,
                    icon: "arrow.down.circle.fill",
                    color: .blue
                )

                Divider()
                    .frame(height: 40)

                HeroStatItem(
                    label: "Day Change",
                    value: "+₹2,450",
                    icon: "chart.line.uptrend.xyaxis",
                    color: .green
                )

                Divider()
                    .frame(height: 40)

                HeroStatItem(
                    label: "XIRR",
                    value: xirrValue.percentFormatted,
                    icon: "percent",
                    color: xirrValue >= 0 ? .green : .red
                )
            }
            .padding(.top, 8)
        }
        .padding(AppTheme.Spacing.large)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: AppTheme.CornerRadius.xxLarge, style: .continuous))
    }

    private var viewModeToggle: some View {
        HStack(spacing: 4) {
            ForEach(PortfolioViewMode.allCases, id: \.self) { mode in
                Button {
                    withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                        viewMode = mode
                    }
                } label: {
                    Text(mode.rawValue)
                        .font(.system(size: 13, weight: .regular))
                        .foregroundColor(viewMode == mode ? .white : .secondary)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 8)
                        .background {
                            if viewMode == mode {
                                Capsule()
                                    .fill(Color.blue)
                            }
                        }
                }
            }
        }
        .padding(4)
        .background(Color(uiColor: .tertiarySystemFill), in: Capsule())
    }
}

// MARK: - Hero Stat Item

private struct HeroStatItem: View {
    let label: String
    let value: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(spacing: 6) {
            Image(systemName: icon)
                .font(.system(size: 16, weight: .light))
                .foregroundColor(color)

            Text(value)
                .font(.system(size: 15, weight: .regular, design: .rounded))
                .foregroundColor(.primary)

            Text(label)
                .font(.system(size: 11, weight: .light))
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}

#Preview {
    PortfolioHeroCard(
        portfolio: .empty,
        viewMode: .constant(.individual)
    )
    .padding()
    .background(Color(uiColor: .systemGroupedBackground))
}
