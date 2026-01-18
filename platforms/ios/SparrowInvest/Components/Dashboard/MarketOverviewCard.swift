//
//  MarketOverviewCard.swift
//  SparrowInvest
//
//  iOS 26 Liquid Glass Market Overview - SF Pro Light
//

import SwiftUI

struct MarketOverviewCard: View {
    let marketOverview: MarketOverview

    var body: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.medium) {
            // Header
            HStack {
                Text("Market Overview")
                    .font(.system(size: 16, weight: .regular))
                    .foregroundColor(.primary)

                Spacer()

                // Market Status Badge
                HStack(spacing: 6) {
                    Circle()
                        .fill(marketOverview.status.color)
                        .frame(width: 8, height: 8)
                    Text(marketOverview.status.rawValue)
                        .font(.system(size: 12, weight: .light))
                        .foregroundColor(marketOverview.status.color)
                }
                .padding(.horizontal, 10)
                .padding(.vertical, 5)
                .background(
                    marketOverview.status.color.opacity(0.12),
                    in: Capsule()
                )
            }

            // Primary Indices
            HStack(spacing: AppTheme.Spacing.compact) {
                ForEach(marketOverview.primaryIndices) { index in
                    MarketIndexTile(index: index)
                }
            }

            // Other Indices (if any)
            if !marketOverview.otherIndices.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: AppTheme.Spacing.compact) {
                        ForEach(marketOverview.otherIndices) { index in
                            CompactIndexTile(index: index)
                        }
                    }
                }
            }

            // Last Updated
            HStack {
                Image(systemName: "clock")
                    .font(.system(size: 11, weight: .light))
                Text("Updated \(formatLastUpdated(marketOverview.lastUpdated))")
                    .font(.system(size: 11, weight: .light))
            }
            .foregroundColor(Color(uiColor: .tertiaryLabel))
        }
        .padding(AppTheme.Spacing.medium)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: AppTheme.CornerRadius.xLarge, style: .continuous))
    }

    private func formatLastUpdated(_ date: Date) -> String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .abbreviated
        return formatter.localizedString(for: date, relativeTo: Date())
    }
}

struct MarketIndexTile: View {
    let index: MarketIndex

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(index.name)
                .font(.system(size: 12, weight: .light))
                .foregroundColor(.secondary)

            Text(index.formattedValue)
                .font(.system(size: 18, weight: .light, design: .rounded))
                .foregroundColor(.primary)

            HStack(spacing: 4) {
                Image(systemName: index.isPositive ? "arrow.up" : "arrow.down")
                    .font(.system(size: 10, weight: .regular))
                Text(index.formattedChange)
                    .font(.system(size: 12, weight: .light))
            }
            .foregroundColor(index.isPositive ? .green : .red)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(AppTheme.Spacing.compact)
        .background(
            (index.isPositive ? Color.green : Color.red).opacity(0.1),
            in: RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
        )
    }
}

struct CompactIndexTile: View {
    let index: MarketIndex

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(index.name)
                .font(.system(size: 11, weight: .light))
                .foregroundColor(.secondary)

            HStack(spacing: 4) {
                Text(String(format: "%.0f", index.value))
                    .font(.system(size: 13, weight: .regular, design: .rounded))
                    .foregroundColor(.primary)

                Text("\(index.isPositive ? "+" : "")\(String(format: "%.1f", index.changePercentage))%")
                    .font(.system(size: 11, weight: .light))
                    .foregroundColor(index.isPositive ? .green : .red)
            }
        }
        .padding(10)
        .background(
            Color(uiColor: .tertiarySystemFill),
            in: RoundedRectangle(cornerRadius: AppTheme.CornerRadius.small, style: .continuous)
        )
    }
}

#Preview {
    MarketOverviewCard(marketOverview: .empty)
        .padding()
}
