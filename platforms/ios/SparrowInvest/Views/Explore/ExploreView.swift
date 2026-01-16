import SwiftUI

struct ExploreView: View {
    @EnvironmentObject var fundsStore: FundsStore
    @State private var searchText = ""

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Search Bar
                    SearchBar(text: $searchText)

                    // AI Recommendations Section
                    AIRecommendationsSection()

                    // Categories
                    CategoriesSection()

                    // Top Performing Funds
                    TopFundsSection()
                }
                .padding()
            }
            .background(AppTheme.background)
            .navigationTitle("Explore")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    NavigationLink(destination: WatchlistView()) {
                        Image(systemName: "heart.fill")
                            .foregroundColor(AppTheme.textSecondary)
                    }
                }
            }
        }
    }
}

// MARK: - Search Bar
struct SearchBar: View {
    @Binding var text: String

    var body: some View {
        HStack {
            Image(systemName: "magnifyingglass")
                .foregroundColor(AppTheme.textTertiary)
            TextField("Search funds...", text: $text)
                .textFieldStyle(.plain)
        }
        .padding()
        .background(AppTheme.inputBackground)
        .cornerRadius(12)
    }
}

// MARK: - AI Recommendations
struct AIRecommendationsSection: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "sparkles")
                    .foregroundColor(AppTheme.primary)
                Text("AI RECOMMENDATIONS")
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(AppTheme.primary)
                    .tracking(1)
            }

            Text("Personalized picks based on your profile")
                .font(.subheadline)
                .foregroundColor(AppTheme.textSecondary)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(0..<5, id: \.self) { _ in
                        RecommendedFundCard()
                    }
                }
            }
        }
    }
}

struct RecommendedFundCard: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                RoundedRectangle(cornerRadius: 8)
                    .fill(AppTheme.primary.opacity(0.1))
                    .frame(width: 40, height: 40)
                    .overlay(
                        Text("PP")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(AppTheme.primary)
                    )
                Spacer()
                Image(systemName: "heart")
                    .foregroundColor(AppTheme.textTertiary)
            }

            Text("Parag Parikh Flexi Cap Fund")
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundColor(AppTheme.textPrimary)
                .lineLimit(2)

            Text("Equity - Flexi Cap")
                .font(.caption)
                .foregroundColor(AppTheme.textSecondary)

            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("3Y Returns")
                        .font(.caption2)
                        .foregroundColor(AppTheme.textTertiary)
                    Text("+18.7%")
                        .font(.headline)
                        .fontWeight(.bold)
                        .foregroundColor(AppTheme.success)
                }
                Spacer()
                Button(action: {}) {
                    Text("Invest")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 8)
                        .background(AppTheme.primary)
                        .foregroundColor(.white)
                        .cornerRadius(20)
                }
            }
        }
        .padding()
        .frame(width: 200)
        .background(AppTheme.cardBackground)
        .cornerRadius(16)
        .shadow(color: AppTheme.shadowColor, radius: 4, x: 0, y: 2)
    }
}

// MARK: - Categories
struct CategoriesSection: View {
    let categories = [
        ("Equity", "chart.line.uptrend.xyaxis", Color.blue),
        ("Debt", "shield.fill", Color.green),
        ("Hybrid", "circle.lefthalf.filled", Color.orange),
        ("ELSS", "indianrupeesign.square.fill", Color.purple),
        ("Index", "chart.bar.fill", Color.teal),
        ("Gold", "dollarsign.circle.fill", Color.yellow)
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("BROWSE BY CATEGORY")
                .font(.caption)
                .fontWeight(.semibold)
                .foregroundColor(AppTheme.primary)
                .tracking(1)

            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 12) {
                ForEach(categories, id: \.0) { category in
                    CategoryCard(name: category.0, icon: category.1, color: category.2)
                }
            }
        }
    }
}

struct CategoryCard: View {
    let name: String
    let icon: String
    let color: Color

    var body: some View {
        Button(action: {}) {
            VStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundColor(color)
                Text(name)
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundColor(AppTheme.textPrimary)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(color.opacity(0.1))
            .cornerRadius(12)
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Top Funds
struct TopFundsSection: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("TOP PERFORMERS")
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(AppTheme.primary)
                    .tracking(1)
                Spacer()
                Button(action: {}) {
                    Text("See all")
                        .font(.caption)
                        .foregroundColor(AppTheme.primary)
                }
            }

            ForEach(0..<5, id: \.self) { index in
                FundListItem(rank: index + 1)
            }
        }
    }
}

struct FundListItem: View {
    let rank: Int

    var body: some View {
        HStack(spacing: 12) {
            Text("\(rank)")
                .font(.caption)
                .fontWeight(.bold)
                .foregroundColor(AppTheme.textTertiary)
                .frame(width: 24)

            RoundedRectangle(cornerRadius: 8)
                .fill(AppTheme.primary.opacity(0.1))
                .frame(width: 40, height: 40)
                .overlay(
                    Text("MF")
                        .font(.caption2)
                        .fontWeight(.bold)
                        .foregroundColor(AppTheme.primary)
                )

            VStack(alignment: .leading, spacing: 2) {
                Text("Sample Fund Name")
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(AppTheme.textPrimary)
                Text("Category")
                    .font(.caption)
                    .foregroundColor(AppTheme.textSecondary)
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 2) {
                Text("+25.4%")
                    .font(.subheadline)
                    .fontWeight(.bold)
                    .foregroundColor(AppTheme.success)
                Text("1Y")
                    .font(.caption)
                    .foregroundColor(AppTheme.textSecondary)
            }
        }
        .padding()
        .background(AppTheme.cardBackground)
        .cornerRadius(12)
    }
}

// MARK: - Watchlist View
struct WatchlistView: View {
    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                Text("Your saved funds will appear here")
                    .foregroundColor(AppTheme.textSecondary)
            }
            .padding()
        }
        .background(AppTheme.background)
        .navigationTitle("Watchlist")
    }
}

#Preview {
    ExploreView()
        .environmentObject(FundsStore())
}
