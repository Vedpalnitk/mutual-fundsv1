import SwiftUI

struct FundDetailView: View {
    let fund: Fund
    @EnvironmentObject var fundsStore: FundsStore
    @State private var selectedPeriod = "3Y"

    let periods = ["1M", "3M", "6M", "1Y", "3Y", "5Y"]

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Header
                VStack(spacing: 8) {
                    Text(fund.schemeName)
                        .font(.title3)
                        .fontWeight(.bold)
                        .foregroundColor(AppTheme.textPrimary)
                        .multilineTextAlignment(.center)

                    Text(fund.fundHouse ?? "")
                        .font(.subheadline)
                        .foregroundColor(AppTheme.textSecondary)

                    HStack(spacing: 8) {
                        Text("NAV: \(String(format: "₹%.2f", fund.nav))")
                            .font(.subheadline)
                            .fontWeight(.medium)
                            .foregroundColor(AppTheme.textPrimary)

                        if let navDate = fund.navDate {
                            Text("• \(navDate.formatted(date: .abbreviated, time: .omitted))")
                                .font(.caption)
                                .foregroundColor(AppTheme.textSecondary)
                        }
                    }
                }
                .padding()

                // Period Selector
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(periods, id: \.self) { period in
                            Button(action: { selectedPeriod = period }) {
                                Text(period)
                                    .font(.caption)
                                    .fontWeight(.medium)
                                    .padding(.horizontal, 16)
                                    .padding(.vertical, 8)
                                    .background(selectedPeriod == period ? AppTheme.primary : AppTheme.inputBackground)
                                    .foregroundColor(selectedPeriod == period ? .white : AppTheme.textSecondary)
                                    .cornerRadius(20)
                            }
                        }
                    }
                    .padding(.horizontal)
                }

                // Returns Section
                VStack(alignment: .leading, spacing: 12) {
                    Text("RETURNS")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundColor(AppTheme.primary)
                        .tracking(1)

                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                        ReturnTile(period: "1Y", value: fund.returns?.oneYear)
                        ReturnTile(period: "3Y", value: fund.returns?.threeYear)
                        ReturnTile(period: "5Y", value: fund.returns?.fiveYear)
                    }
                }
                .padding()
                .background(AppTheme.cardBackground)
                .cornerRadius(16)
                .padding(.horizontal)

                // Fund Details
                VStack(alignment: .leading, spacing: 12) {
                    Text("FUND DETAILS")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundColor(AppTheme.primary)
                        .tracking(1)

                    DetailRow(label: "Category", value: fund.category)
                    DetailRow(label: "AUM", value: fund.aum != nil ? "₹\(Int(fund.aum!)) Cr" : "N/A")
                    DetailRow(label: "Expense Ratio", value: fund.expenseRatio != nil ? "\(String(format: "%.2f", fund.expenseRatio!))%" : "N/A")
                    DetailRow(label: "Fund Manager", value: fund.fundManager ?? "N/A")
                    DetailRow(label: "Min SIP", value: fund.minSIP.currencyFormatted)
                    DetailRow(label: "Min Lump Sum", value: fund.minLumpSum.currencyFormatted)
                }
                .padding()
                .background(AppTheme.cardBackground)
                .cornerRadius(16)
                .padding(.horizontal)

                // Risk Rating
                if let rating = fund.riskRating {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("RISK LEVEL")
                            .font(.caption)
                            .fontWeight(.semibold)
                            .foregroundColor(AppTheme.primary)
                            .tracking(1)

                        RiskRatingView(rating: rating)
                    }
                    .padding()
                    .background(AppTheme.cardBackground)
                    .cornerRadius(16)
                    .padding(.horizontal)
                }

                Spacer(minLength: 100)
            }
        }
        .background(AppTheme.background)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button(action: { toggleWatchlist() }) {
                    Image(systemName: fundsStore.isInWatchlist(fund.id) ? "heart.fill" : "heart")
                        .foregroundColor(fundsStore.isInWatchlist(fund.id) ? AppTheme.error : AppTheme.textSecondary)
                }
            }
        }
        .safeAreaInset(edge: .bottom) {
            HStack(spacing: 12) {
                Button(action: {}) {
                    Text("Start SIP")
                        .fontWeight(.semibold)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(AppTheme.primaryGradient)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                }

                Button(action: {}) {
                    Text("One-time")
                        .fontWeight(.semibold)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(AppTheme.cardBackground)
                        .foregroundColor(AppTheme.primary)
                        .cornerRadius(12)
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(AppTheme.primary, lineWidth: 1)
                        )
                }
            }
            .padding()
            .background(AppTheme.background)
        }
    }

    private func toggleWatchlist() {
        if fundsStore.isInWatchlist(fund.id) {
            fundsStore.removeFromWatchlist(fund.id)
        } else {
            fundsStore.addToWatchlist(fund)
        }
    }
}

// MARK: - Supporting Views
struct ReturnTile: View {
    let period: String
    let value: Double?

    var body: some View {
        VStack(spacing: 4) {
            Text(period)
                .font(.caption)
                .foregroundColor(AppTheme.textSecondary)
            Text(value != nil ? "\(String(format: "%.1f", value!))%" : "N/A")
                .font(.headline)
                .fontWeight(.bold)
                .foregroundColor(value != nil && value! >= 0 ? AppTheme.success : AppTheme.error)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(AppTheme.inputBackground)
        .cornerRadius(12)
    }
}

struct DetailRow: View {
    let label: String
    let value: String

    var body: some View {
        HStack {
            Text(label)
                .font(.subheadline)
                .foregroundColor(AppTheme.textSecondary)
            Spacer()
            Text(value)
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundColor(AppTheme.textPrimary)
        }
        .padding(.vertical, 4)
    }
}

struct RiskRatingView: View {
    let rating: Int

    var body: some View {
        HStack(spacing: 4) {
            ForEach(1...5, id: \.self) { level in
                RoundedRectangle(cornerRadius: 4)
                    .fill(level <= rating ? ratingColor(for: rating) : AppTheme.progressBackground)
                    .frame(height: 8)
            }
        }

        Text(ratingLabel(for: rating))
            .font(.caption)
            .foregroundColor(ratingColor(for: rating))
    }

    private func ratingColor(for rating: Int) -> Color {
        switch rating {
        case 1, 2: return AppTheme.success
        case 3: return AppTheme.warning
        case 4, 5: return AppTheme.error
        default: return AppTheme.textSecondary
        }
    }

    private func ratingLabel(for rating: Int) -> String {
        switch rating {
        case 1: return "Very Low Risk"
        case 2: return "Low Risk"
        case 3: return "Moderate Risk"
        case 4: return "High Risk"
        case 5: return "Very High Risk"
        default: return "Unknown"
        }
    }
}

#Preview {
    NavigationStack {
        FundDetailView(fund: Fund(
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
        ))
        .environmentObject(FundsStore())
    }
}
