import SwiftUI

struct RecommendationCard: View {
    let recommendation: FundRecommendation

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 12) {
                // Fund Avatar
                ZStack {
                    RoundedRectangle(cornerRadius: 12)
                        .fill(AppTheme.primary.opacity(0.1))
                        .frame(width: 44, height: 44)

                    Text(recommendation.fund.initials)
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(AppTheme.primary)
                }

                VStack(alignment: .leading, spacing: 2) {
                    Text(recommendation.fund.shortName)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(AppTheme.textPrimary)
                        .lineLimit(1)

                    Text("\(recommendation.fund.assetClass.capitalized) • \(recommendation.fund.category)")
                        .font(.caption)
                        .foregroundColor(AppTheme.textSecondary)
                }

                Spacer()

                // Returns
                VStack(alignment: .trailing, spacing: 2) {
                    Text(recommendation.fund.returns?.threeYear?.percentFormatted ?? "N/A")
                        .font(.headline)
                        .fontWeight(.bold)
                        .foregroundColor(AppTheme.success)
                    Text("3Y")
                        .font(.caption)
                        .foregroundColor(AppTheme.textSecondary)
                }
            }

            // Reason
            HStack(spacing: 8) {
                Image(systemName: "sparkles")
                    .font(.caption)
                    .foregroundColor(AppTheme.primary)
                Text(recommendation.topReason)
                    .font(.caption)
                    .foregroundColor(AppTheme.textSecondary)
                    .lineLimit(1)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(AppTheme.primary.opacity(0.08))
            .cornerRadius(8)

            // Action Button
            NavigationLink(destination: FundDetailView(fund: recommendation.fund)) {
                HStack {
                    Spacer()
                    Text("Invest")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                    Image(systemName: "arrow.right")
                        .font(.caption)
                    Spacer()
                }
                .padding(.vertical, 12)
                .background(AppTheme.primaryGradient)
                .foregroundColor(.white)
                .cornerRadius(12)
            }
        }
        .padding()
        .background(AppTheme.cardBackground)
        .cornerRadius(16)
        .shadow(color: AppTheme.shadowColor, radius: 4, x: 0, y: 2)
    }
}

#Preview {
    RecommendationCard(recommendation: FundRecommendation(
        id: "1",
        fund: Fund(
            id: "119598",
            schemeCode: 119598,
            schemeName: "Parag Parikh Flexi Cap Fund Direct Growth",
            category: "Flexi Cap",
            assetClass: "equity",
            nav: 78.45,
            navDate: Date(),
            returns: FundReturns(oneMonth: 2.5, threeMonth: 5.8, sixMonth: 12.3, oneYear: 22.4, threeYear: 18.7, fiveYear: 19.2),
            aum: 48520,
            expenseRatio: 0.63,
            riskRating: 4,
            minSIP: 1000,
            minLumpSum: 1000,
            fundManager: "Rajeev Thakkar",
            fundHouse: "PPFAS"
        ),
        score: 0.95,
        reasons: ["Excellent risk-adjusted returns", "Low expense ratio"],
        suggestedAllocation: 0.25
    ))
    .padding()
}
