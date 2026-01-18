//
//  AssetAllocationPieChart.swift
//  SparrowInvest
//
//  iOS 26 Liquid Glass Asset Allocation Chart
//

import SwiftUI
import Charts

struct AllocationSlice: Identifiable {
    let id = UUID()
    let name: String
    let value: Double
    let percentage: Double
    let color: Color
}

struct AssetAllocationPieChart: View {
    let allocation: AssetAllocation

    private var slices: [AllocationSlice] {
        [
            AllocationSlice(
                name: "Equity",
                value: allocation.equity,
                percentage: allocation.equityPercentage,
                color: .blue
            ),
            AllocationSlice(
                name: "Debt",
                value: allocation.debt,
                percentage: allocation.debtPercentage,
                color: .green
            ),
            AllocationSlice(
                name: "Hybrid",
                value: allocation.hybrid,
                percentage: allocation.hybridPercentage,
                color: .purple
            ),
            AllocationSlice(
                name: "Gold",
                value: allocation.gold,
                percentage: allocation.goldPercentage,
                color: .orange
            ),
            AllocationSlice(
                name: "Other",
                value: allocation.other,
                percentage: allocation.otherPercentage,
                color: .gray
            )
        ].filter { $0.value > 0 }
    }

    @State private var selectedSlice: AllocationSlice?

    var body: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.medium) {
            // Header
            Text("Asset Allocation")
                .font(.system(size: 16, weight: .regular))
                .foregroundColor(.primary)

            HStack(spacing: AppTheme.Spacing.large) {
                // Pie Chart
                ZStack {
                    Chart(slices) { slice in
                        SectorMark(
                            angle: .value("Value", slice.value),
                            innerRadius: .ratio(0.6),
                            angularInset: 2
                        )
                        .foregroundStyle(slice.color)
                        .opacity(selectedSlice?.id == slice.id ? 1.0 : 0.9)
                    }
                    .chartBackground { _ in
                        VStack(spacing: 2) {
                            if let selected = selectedSlice {
                                Text(selected.name)
                                    .font(.system(size: 12, weight: .light))
                                    .foregroundColor(.secondary)
                                Text("\(Int(selected.percentage))%")
                                    .font(.system(size: 20, weight: .light, design: .rounded))
                                    .foregroundColor(selected.color)
                            } else {
                                Text("Total")
                                    .font(.system(size: 12, weight: .light))
                                    .foregroundColor(.secondary)
                                Text(allocation.total.compactCurrencyFormatted)
                                    .font(.system(size: 16, weight: .light, design: .rounded))
                                    .foregroundColor(.primary)
                            }
                        }
                    }
                    .frame(width: 140, height: 140)
                }

                // Legend
                VStack(alignment: .leading, spacing: 10) {
                    ForEach(slices) { slice in
                        HStack(spacing: 8) {
                            Circle()
                                .fill(slice.color)
                                .frame(width: 10, height: 10)

                            VStack(alignment: .leading, spacing: 0) {
                                Text(slice.name)
                                    .font(.system(size: 13, weight: .light))
                                    .foregroundColor(.primary)

                                Text(slice.value.compactCurrencyFormatted)
                                    .font(.system(size: 11, weight: .regular))
                                    .foregroundColor(.secondary)
                            }

                            Spacer()

                            Text("\(Int(slice.percentage))%")
                                .font(.system(size: 13, weight: .regular, design: .rounded))
                                .foregroundColor(slice.color)
                        }
                        .onTapGesture {
                            withAnimation(.easeInOut(duration: 0.2)) {
                                if selectedSlice?.id == slice.id {
                                    selectedSlice = nil
                                } else {
                                    selectedSlice = slice
                                }
                            }
                        }
                    }
                }
            }
        }
        .padding(AppTheme.Spacing.medium)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: AppTheme.CornerRadius.xLarge, style: .continuous))
    }
}

#Preview {
    AssetAllocationPieChart(allocation: AssetAllocation(
        equity: 800000,
        debt: 300000,
        hybrid: 150000,
        gold: 50000,
        other: 0
    ))
    .padding()
}
