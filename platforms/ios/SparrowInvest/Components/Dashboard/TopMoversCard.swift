//
//  TopMoversCard.swift
//  SparrowInvest
//
//  iOS 26 Liquid Glass Top Movers Display
//

import SwiftUI

struct TopMoversCard: View {
    let gainers: [Holding]
    let losers: [Holding]

    @State private var selectedTab: MoverTab = .gainers

    enum MoverTab: String, CaseIterable {
        case gainers = "Top Gainers"
        case losers = "Top Losers"
    }

    var body: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.medium) {
            // Header with Tab Toggle
            HStack {
                Text("Today's Movers")
                    .font(.system(size: 16, weight: .regular))
                    .foregroundColor(.primary)

                Spacer()
            }

            // Tab Toggle
            HStack(spacing: 0) {
                ForEach(MoverTab.allCases, id: \.self) { tab in
                    Button {
                        withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                            selectedTab = tab
                        }
                    } label: {
                        Text(tab.rawValue)
                            .font(.system(size: 12, weight: .regular))
                            .foregroundColor(selectedTab == tab ? .white : .secondary)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 8)
                            .background {
                                if selectedTab == tab {
                                    Capsule()
                                        .fill(tab == .gainers ? Color.green : Color.red)
                                }
                            }
                    }
                }
            }
            .padding(4)
            .background(Color(uiColor: .tertiarySystemFill), in: Capsule())

            // Holdings List
            let holdings = selectedTab == .gainers ? gainers : losers

            if holdings.isEmpty {
                VStack(spacing: 8) {
                    Image(systemName: selectedTab == .gainers ? "chart.line.uptrend.xyaxis" : "chart.line.downtrend.xyaxis")
                        .font(.system(size: 24))
                        .foregroundColor(Color(uiColor: .tertiaryLabel))
                    Text(selectedTab == .gainers ? "No gainers today" : "No losers today")
                        .font(.system(size: 13, weight: .light))
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 20)
            } else {
                VStack(spacing: AppTheme.Spacing.small) {
                    ForEach(holdings.prefix(3)) { holding in
                        MoverRow(holding: holding, isGainer: selectedTab == .gainers)
                    }
                }
            }
        }
        .padding(AppTheme.Spacing.medium)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: AppTheme.CornerRadius.xLarge, style: .continuous))
    }
}

struct MoverRow: View {
    let holding: Holding
    let isGainer: Bool

    var body: some View {
        HStack(spacing: 12) {
            // Fund Icon
            ZStack {
                RoundedRectangle(cornerRadius: AppTheme.CornerRadius.small, style: .continuous)
                    .fill(holding.assetClass.color.opacity(0.15))
                    .frame(width: 36, height: 36)

                Text(String(holding.fundName.prefix(2)).uppercased())
                    .font(.system(size: 12, weight: .light))
                    .foregroundColor(holding.assetClass.color)
            }

            // Fund Info
            VStack(alignment: .leading, spacing: 2) {
                Text(holding.fundName)
                    .font(.system(size: 13, weight: .light))
                    .foregroundColor(.primary)
                    .lineLimit(1)

                Text(holding.assetClass.rawValue.capitalized)
                    .font(.system(size: 11, weight: .regular))
                    .foregroundColor(.secondary)
            }

            Spacer()

            // Change
            VStack(alignment: .trailing, spacing: 2) {
                Text(holding.dayChange.currencyFormatted)
                    .font(.system(size: 13, weight: .regular))
                    .foregroundColor(isGainer ? .green : .red)

                HStack(spacing: 2) {
                    Image(systemName: isGainer ? "arrow.up" : "arrow.down")
                        .font(.system(size: 10, weight: .medium))
                    Text(holding.dayChangePercentage.percentFormatted)
                        .font(.system(size: 11, weight: .regular))
                }
                .foregroundColor(isGainer ? .green : .red)
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
    TopMoversCard(gainers: [], losers: [])
        .padding()
}
