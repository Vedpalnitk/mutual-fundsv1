import SwiftUI

struct PortfolioSummaryCard: View {
    let portfolio: Portfolio

    var body: some View {
        VStack(spacing: 16) {
            // Header
            HStack {
                Text("YOUR PORTFOLIO")
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(AppTheme.primary)
                    .tracking(1)
                Spacer()
            }

            // Main Value
            VStack(alignment: .leading, spacing: 4) {
                Text(portfolio.totalValue.currencyFormatted)
                    .font(.system(size: 32, weight: .bold))
                    .foregroundColor(AppTheme.textPrimary)

                HStack(spacing: 8) {
                    HStack(spacing: 4) {
                        Image(systemName: portfolio.totalReturns >= 0 ? "arrow.up.right" : "arrow.down.right")
                        Text(portfolio.totalReturns.currencyFormatted)
                    }
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(portfolio.totalReturns >= 0 ? AppTheme.success : AppTheme.error)

                    Text("(\(portfolio.returnsPercentage.percentFormatted)) all time")
                        .font(.subheadline)
                        .foregroundColor(AppTheme.textSecondary)
                }
            }

            Divider()

            // Today's Change
            HStack {
                Text("Today")
                    .font(.subheadline)
                    .foregroundColor(AppTheme.textSecondary)
                Spacer()
                HStack(spacing: 4) {
                    Image(systemName: portfolio.todayChange >= 0 ? "arrow.up" : "arrow.down")
                        .font(.caption)
                    Text("\(portfolio.todayChange.currencyFormatted) (\(portfolio.todayChangePercentage.percentFormatted))")
                        .font(.subheadline)
                        .fontWeight(.medium)
                }
                .foregroundColor(portfolio.todayChange >= 0 ? AppTheme.success : AppTheme.error)
            }
        }
        .padding()
        .background(
            LinearGradient(
                colors: [AppTheme.primary.opacity(0.08), AppTheme.secondary.opacity(0.04)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .cornerRadius(20)
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .stroke(AppTheme.cardBorder, lineWidth: 1)
        )
    }
}

#Preview {
    PortfolioSummaryCard(portfolio: Portfolio(
        totalValue: 245680,
        totalInvested: 233230,
        totalReturns: 12450,
        returnsPercentage: 5.34,
        todayChange: 890,
        todayChangePercentage: 0.36,
        xirr: 14.2,
        assetAllocation: AssetAllocation(equity: 72, debt: 18, hybrid: 7, gold: 3),
        holdings: []
    ))
    .padding()
}
