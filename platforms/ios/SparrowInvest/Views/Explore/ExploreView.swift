//
//  ExploreView.swift
//  SparrowInvest
//
//  iOS 26 Liquid Glass - Explore Funds
//

import SwiftUI

struct ExploreView: View {
    @EnvironmentObject var fundsStore: FundsStore
    @EnvironmentObject var pointsStore: PointsStore
    @EnvironmentObject var advisorStore: AdvisorStore
    @State private var searchText = ""

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: AppTheme.Spacing.large) {
                    // Search Bar
                    SearchBar(text: $searchText)

                    // Quick Access - Points & Advisors
                    QuickAccessSection()

                    // Categories
                    CategoriesSection()

                    // Top Performing Funds
                    TopFundsSection()
                }
                .padding(AppTheme.Spacing.medium)
            }
            .background(Color(uiColor: .systemGroupedBackground))
            .navigationTitle("Explore")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    NavigationLink(destination: WatchlistView()) {
                        Image(systemName: "heart.fill")
                            .font(.system(size: 16, weight: .light))
                            .foregroundColor(.secondary)
                    }
                }
            }
        }
    }
}

// MARK: - Search Bar

struct SearchBar: View {
    @Binding var text: String
    @Environment(\.colorScheme) private var colorScheme

    private var searchShadow: Color {
        colorScheme == .dark ? Color.clear : Color.black.opacity(0.08)
    }

    var body: some View {
        HStack(spacing: AppTheme.Spacing.compact) {
            Image(systemName: "magnifyingglass")
                .font(.system(size: 16, weight: .light))
                .foregroundColor(Color(uiColor: .tertiaryLabel))
            TextField("Search funds...", text: $text)
                .font(.system(size: 15, weight: .light))
                .textFieldStyle(.plain)
        }
        .padding(AppTheme.Spacing.medium)
        .background(searchBackground)
        .overlay(searchBorder)
        .shadow(color: searchShadow, radius: 12, x: 0, y: 4)
    }

    @ViewBuilder
    private var searchBackground: some View {
        if colorScheme == .dark {
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.large, style: .continuous)
                .fill(Color.black.opacity(0.4))
                .background(
                    RoundedRectangle(cornerRadius: AppTheme.CornerRadius.large, style: .continuous)
                        .fill(.ultraThinMaterial)
                )
        } else {
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.large, style: .continuous)
                .fill(Color(uiColor: .white))
        }
    }

    private var searchBorder: some View {
        RoundedRectangle(cornerRadius: AppTheme.CornerRadius.large, style: .continuous)
            .stroke(
                colorScheme == .dark
                    ? LinearGradient(
                        stops: [
                            .init(color: .white.opacity(0.4), location: 0),
                            .init(color: .white.opacity(0.15), location: 0.3),
                            .init(color: .white.opacity(0.05), location: 0.7),
                            .init(color: .white.opacity(0.1), location: 1)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                      )
                    : LinearGradient(
                        stops: [
                            .init(color: .black.opacity(0.1), location: 0),
                            .init(color: .black.opacity(0.05), location: 0.3),
                            .init(color: .black.opacity(0.03), location: 0.7),
                            .init(color: .black.opacity(0.07), location: 1)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                      ),
                lineWidth: 1
            )
    }
}

// MARK: - Quick Access Section

struct QuickAccessSection: View {
    @EnvironmentObject var pointsStore: PointsStore
    @EnvironmentObject var advisorStore: AdvisorStore

    var body: some View {
        HStack(spacing: AppTheme.Spacing.compact) {
            NavigationLink(destination: PointsView()) {
                QuickAccessCard(
                    icon: "star.fill",
                    iconColor: pointsStore.points.tier.color,
                    title: "Points",
                    value: "\(pointsStore.points.totalPoints.formatted()) pts",
                    subtitle: "\(pointsStore.points.tier.displayName) Tier"
                )
            }
            .buttonStyle(.plain)

            NavigationLink(destination: AdvisorsView()) {
                QuickAccessCard(
                    icon: "person.2.fill",
                    iconColor: .blue,
                    title: "Find Advisor",
                    value: "\(advisorStore.regionCount) nearby",
                    subtitle: "Browse All →"
                )
            }
            .buttonStyle(.plain)
        }
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
        VStack(alignment: .leading, spacing: AppTheme.Spacing.compact) {
            Text("BROWSE BY CATEGORY")
                .font(.system(size: 11, weight: .regular))
                .foregroundColor(.blue)
                .tracking(1)

            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: AppTheme.Spacing.compact) {
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
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        Button(action: {}) {
            VStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.system(size: 22, weight: .light))
                    .foregroundColor(color)
                Text(name)
                    .font(.system(size: 12, weight: .regular))
                    .foregroundColor(.primary)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(
                color.opacity(colorScheme == .dark ? 0.15 : 0.1),
                in: RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
            )
            .overlay(
                RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
                    .stroke(colorScheme == .dark ? color.opacity(0.2) : Color.clear, lineWidth: 0.5)
            )
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Top Funds

struct TopFundsSection: View {
    var body: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.compact) {
            HStack {
                Text("TOP PERFORMERS")
                    .font(.system(size: 11, weight: .regular))
                    .foregroundColor(.blue)
                    .tracking(1)
                Spacer()
                Button(action: {}) {
                    Text("See all")
                        .font(.system(size: 12, weight: .regular))
                        .foregroundColor(.blue)
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
    @Environment(\.colorScheme) private var colorScheme

    private var itemShadow: Color {
        colorScheme == .dark ? Color.clear : Color.black.opacity(0.08)
    }

    var body: some View {
        HStack(spacing: AppTheme.Spacing.compact) {
            Text("\(rank)")
                .font(.system(size: 12, weight: .regular))
                .foregroundColor(Color(uiColor: .tertiaryLabel))
                .frame(width: 24)

            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.small, style: .continuous)
                .fill(Color.blue.opacity(colorScheme == .dark ? 0.15 : 0.1))
                .frame(width: 40, height: 40)
                .overlay(
                    Text("MF")
                        .font(.system(size: 10, weight: .light))
                        .foregroundColor(.blue)
                )

            VStack(alignment: .leading, spacing: 2) {
                Text("Sample Fund Name")
                    .font(.system(size: 14, weight: .regular))
                    .foregroundColor(.primary)
                Text("Category")
                    .font(.system(size: 12, weight: .light))
                    .foregroundColor(.secondary)
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 2) {
                Text("+25.4%")
                    .font(.system(size: 14, weight: .light, design: .rounded))
                    .foregroundColor(.green)
                Text("1Y")
                    .font(.system(size: 11, weight: .light))
                    .foregroundColor(.secondary)
            }
        }
        .padding(AppTheme.Spacing.medium)
        .background(itemBackground)
        .overlay(itemBorder)
        .shadow(color: itemShadow, radius: 12, x: 0, y: 4)
    }

    @ViewBuilder
    private var itemBackground: some View {
        if colorScheme == .dark {
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
                .fill(Color.black.opacity(0.4))
                .background(
                    RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
                        .fill(.ultraThinMaterial)
                )
        } else {
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
                .fill(Color(uiColor: .white))
        }
    }

    private var itemBorder: some View {
        RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
            .stroke(
                colorScheme == .dark
                    ? LinearGradient(
                        stops: [
                            .init(color: .white.opacity(0.4), location: 0),
                            .init(color: .white.opacity(0.15), location: 0.3),
                            .init(color: .white.opacity(0.05), location: 0.7),
                            .init(color: .white.opacity(0.1), location: 1)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                      )
                    : LinearGradient(
                        stops: [
                            .init(color: .black.opacity(0.1), location: 0),
                            .init(color: .black.opacity(0.05), location: 0.3),
                            .init(color: .black.opacity(0.03), location: 0.7),
                            .init(color: .black.opacity(0.07), location: 1)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                      ),
                lineWidth: 1
            )
    }
}

// MARK: - Watchlist View

struct WatchlistView: View {
    var body: some View {
        ScrollView {
            VStack(spacing: AppTheme.Spacing.medium) {
                VStack(spacing: AppTheme.Spacing.compact) {
                    Image(systemName: "heart.slash")
                        .font(.system(size: 48, weight: .ultraLight))
                        .foregroundColor(Color(uiColor: .tertiaryLabel))

                    Text("No saved funds")
                        .font(.system(size: 16, weight: .light))
                        .foregroundColor(.secondary)

                    Text("Your saved funds will appear here")
                        .font(.system(size: 14, weight: .light))
                        .foregroundColor(Color(uiColor: .tertiaryLabel))
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 60)
            }
            .padding(AppTheme.Spacing.medium)
        }
        .background(Color(uiColor: .systemGroupedBackground))
        .navigationTitle("Watchlist")
    }
}

#Preview {
    ExploreView()
        .environmentObject(FundsStore())
        .environmentObject(PointsStore())
        .environmentObject(AdvisorStore())
}
