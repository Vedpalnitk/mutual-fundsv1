//
//  PortfolioGrowthLineChart.swift
//  SparrowInvest
//
//  iOS 26 Liquid Glass Portfolio Growth Chart
//

import SwiftUI
import Charts

struct PortfolioGrowthLineChart: View {
    let history: PortfolioHistory
    @Binding var selectedPeriod: HistoryPeriod
    var onPeriodChange: ((HistoryPeriod) -> Void)?

    @State private var selectedPoint: PortfolioHistoryPoint?

    var body: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.medium) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Portfolio Growth")
                        .font(.system(size: 16, weight: .regular))
                        .foregroundColor(.primary)

                    if let point = selectedPoint {
                        HStack(spacing: 8) {
                            Text(point.value.currencyFormatted)
                                .font(.system(size: 14, weight: .light))
                                .foregroundColor(.primary)

                            Text(point.returnsPercentage.percentFormatted)
                                .font(.system(size: 12, weight: .light))
                                .foregroundColor(point.returns >= 0 ? .green : .red)
                        }
                    } else {
                        HStack(spacing: 8) {
                            Text(history.periodReturn >= 0 ? "+" : "")
                            Text("\(String(format: "%.1f", history.periodReturn))%")
                                .font(.system(size: 14, weight: .regular))
                                .foregroundColor(history.periodReturn >= 0 ? .green : .red)
                            Text("in \(selectedPeriod.rawValue)")
                                .font(.system(size: 12, weight: .light))
                                .foregroundColor(.secondary)
                        }
                    }
                }

                Spacer()
            }

            // Period Selector
            periodSelector

            // Chart
            if history.dataPoints.isEmpty {
                VStack(spacing: 8) {
                    Image(systemName: "chart.line.uptrend.xyaxis")
                        .font(.system(size: 32))
                        .foregroundColor(Color(uiColor: .tertiaryLabel))
                    Text("No data available")
                        .font(.system(size: 14, weight: .light))
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity)
                .frame(height: 180)
            } else {
                Chart {
                    ForEach(history.dataPoints) { point in
                        // Area fill
                        AreaMark(
                            x: .value("Date", point.date),
                            y: .value("Value", point.value)
                        )
                        .foregroundStyle(
                            LinearGradient(
                                colors: [Color.blue.opacity(0.3), Color.blue.opacity(0.05)],
                                startPoint: .top,
                                endPoint: .bottom
                            )
                        )

                        // Line
                        LineMark(
                            x: .value("Date", point.date),
                            y: .value("Value", point.value)
                        )
                        .foregroundStyle(Color.blue)
                        .lineStyle(StrokeStyle(lineWidth: 2))
                    }

                    // Selection indicator
                    if let selected = selectedPoint {
                        RuleMark(x: .value("Date", selected.date))
                            .foregroundStyle(Color.blue.opacity(0.3))
                            .lineStyle(StrokeStyle(lineWidth: 1, dash: [5, 5]))

                        PointMark(
                            x: .value("Date", selected.date),
                            y: .value("Value", selected.value)
                        )
                        .foregroundStyle(Color.blue)
                        .symbolSize(80)
                    }
                }
                .chartYScale(domain: history.minValue * 0.95...history.maxValue * 1.05)
                .chartXAxis {
                    AxisMarks(values: .automatic(desiredCount: 5)) { value in
                        AxisValueLabel {
                            if let date = value.as(Date.self) {
                                Text(formatAxisDate(date))
                                    .font(.system(size: 10))
                                    .foregroundColor(Color(uiColor: .tertiaryLabel))
                            }
                        }
                    }
                }
                .chartYAxis {
                    AxisMarks(position: .leading, values: .automatic(desiredCount: 4)) { value in
                        AxisValueLabel {
                            if let amount = value.as(Double.self) {
                                Text(amount.compactCurrencyFormatted)
                                    .font(.system(size: 10))
                                    .foregroundColor(Color(uiColor: .tertiaryLabel))
                            }
                        }
                    }
                }
                .chartOverlay { proxy in
                    GeometryReader { geometry in
                        Rectangle()
                            .fill(.clear)
                            .contentShape(Rectangle())
                            .gesture(
                                DragGesture(minimumDistance: 0)
                                    .onChanged { value in
                                        let x = value.location.x
                                        if let date: Date = proxy.value(atX: x) {
                                            if let closest = history.dataPoints.min(by: {
                                                abs($0.date.timeIntervalSince(date)) < abs($1.date.timeIntervalSince(date))
                                            }) {
                                                selectedPoint = closest
                                            }
                                        }
                                    }
                                    .onEnded { _ in
                                        selectedPoint = nil
                                    }
                            )
                    }
                }
                .frame(height: 180)
            }
        }
        .padding(AppTheme.Spacing.medium)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: AppTheme.CornerRadius.xLarge, style: .continuous))
    }

    private var periodSelector: some View {
        HStack(spacing: 0) {
            ForEach(HistoryPeriod.allCases, id: \.self) { period in
                Button {
                    withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                        selectedPeriod = period
                        onPeriodChange?(period)
                    }
                } label: {
                    Text(period.rawValue)
                        .font(.system(size: 12, weight: .regular))
                        .foregroundColor(selectedPeriod == period ? .white : .secondary)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                        .background {
                            if selectedPeriod == period {
                                Capsule()
                                    .fill(
                                        LinearGradient(
                                            colors: [.blue, .cyan],
                                            startPoint: .leading,
                                            endPoint: .trailing
                                        )
                                    )
                            }
                        }
                }
            }
        }
        .padding(4)
        .background(Color(uiColor: .tertiarySystemFill), in: Capsule())
    }

    private func formatAxisDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        switch selectedPeriod {
        case .oneMonth:
            formatter.dateFormat = "d"
        case .threeMonths, .sixMonths:
            formatter.dateFormat = "MMM"
        case .oneYear, .threeYears, .fiveYears, .all:
            formatter.dateFormat = "MMM yy"
        }
        return formatter.string(from: date)
    }
}

#Preview {
    PortfolioGrowthLineChart(
        history: .empty,
        selectedPeriod: .constant(.oneYear)
    )
    .padding()
}
