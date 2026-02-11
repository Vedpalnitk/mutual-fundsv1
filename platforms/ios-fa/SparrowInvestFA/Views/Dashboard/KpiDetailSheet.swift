import SwiftUI

// MARK: - KPI Detail Sheet

struct KpiDetailSheet: View {
    let title: String
    let value: String
    let icon: String
    let color: Color
    let growth: KpiGrowth?

    @Environment(\.colorScheme) private var colorScheme
    @Environment(\.dismiss) private var dismiss
    @State private var selectedPeriod = "6M"
    @State private var selectedDataIndex: Int? = nil
    @State private var chartDrawProgress: CGFloat = 0

    // Mock allocation data
    private var allocationItems: [AssetAllocationItem] {
        [
            AssetAllocationItem(assetClass: "Equity Funds", value: totalValue * 0.45, percentage: 45.0, color: "3B82F6"),
            AssetAllocationItem(assetClass: "Debt Funds", value: totalValue * 0.25, percentage: 25.0, color: "22C55E"),
            AssetAllocationItem(assetClass: "Hybrid Funds", value: totalValue * 0.18, percentage: 18.0, color: "F97316"),
            AssetAllocationItem(assetClass: "Others", value: totalValue * 0.12, percentage: 12.0, color: "A855F7"),
        ]
    }

    private var totalValue: Double { 24_500_000 }

    private let trendData: [(String, Double)] = [
        ("Sep", 0.6), ("Oct", 0.7), ("Nov", 0.65),
        ("Dec", 0.8), ("Jan", 0.85), ("Feb", 0.9)
    ]

    private var headerGradient: LinearGradient {
        LinearGradient(
            colors: [color, color.opacity(0.8)],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }

    var body: some View {
        ScrollView {
            VStack(spacing: AppTheme.Spacing.medium) {
                headerSection

                if let growth {
                    growthPills(growth)
                }

                trendChartSection

                breakdownSection

                Spacer().frame(height: AppTheme.Spacing.large)
            }
        }
        .background(AppTheme.groupedBackground)
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.hidden)
    }

    // MARK: - Compact Header

    private var headerSection: some View {
        ZStack {
            Rectangle().fill(headerGradient)

            Circle()
                .fill(.white.opacity(0.1))
                .frame(width: 100, height: 100)
                .offset(x: 80, y: -30)
            Circle()
                .fill(.white.opacity(0.05))
                .frame(width: 140, height: 140)
                .offset(x: -100, y: 40)

            HStack(spacing: AppTheme.Spacing.compact) {
                ZStack {
                    Circle()
                        .fill(.white.opacity(0.2))
                        .frame(width: 44, height: 44)

                    Image(systemName: icon)
                        .font(.system(size: 22))
                        .foregroundColor(.white)
                }

                VStack(alignment: .leading, spacing: 2) {
                    Text(title.uppercased())
                        .font(AppTheme.Typography.accent(11))
                        .tracking(1.0)
                        .foregroundColor(.white.opacity(0.7))

                    Text(value)
                        .font(AppTheme.Typography.display(28))
                        .foregroundColor(.white)
                }

                Spacer()
            }
            .padding(.horizontal, AppTheme.Spacing.medium)
        }
        .frame(maxWidth: .infinity)
        .frame(height: 110)
        .clipped()
    }

    // MARK: - Growth Pills

    private func growthPills(_ growth: KpiGrowth) -> some View {
        HStack(spacing: AppTheme.Spacing.compact) {
            growthPill(
                label: "MoM",
                change: growth.momChange,
                absolute: growth.momAbsolute,
                isPositive: growth.isMomPositive
            )

            growthPill(
                label: "YoY",
                change: growth.yoyChange,
                absolute: growth.yoyAbsolute,
                isPositive: growth.yoyChange >= 0
            )
        }
        .glassCard(cornerRadius: AppTheme.CornerRadius.large, padding: AppTheme.Spacing.compact)
        .padding(.horizontal, AppTheme.Spacing.medium)
    }

    private func growthPill(label: String, change: Double, absolute: Double, isPositive: Bool) -> some View {
        HStack(spacing: AppTheme.Spacing.micro) {
            Image(systemName: isPositive ? "arrow.up.right" : "arrow.down.right")
                .font(.system(size: 12))
                .foregroundColor(isPositive ? AppTheme.success : AppTheme.error)

            Text(String(format: "%+.1f%%", change))
                .font(AppTheme.Typography.accent(13))
                .foregroundColor(isPositive ? AppTheme.success : AppTheme.error)

            Text(label)
                .font(AppTheme.Typography.label(11))
                .foregroundColor(.secondary)

            Text(AppTheme.formatCurrencyWithSymbol(abs(absolute)))
                .font(AppTheme.Typography.label(11))
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
    }

    // MARK: - Trend Chart with Integrated Period Selector

    private var trendChartSection: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.compact) {
            HStack {
                Text("Trend")
                    .font(AppTheme.Typography.accent(15))
                    .foregroundColor(.primary)

                Spacer()

                periodPills
            }

            interactiveAreaChart
        }
        .glassCard(cornerRadius: AppTheme.CornerRadius.large, padding: AppTheme.Spacing.compact)
        .padding(.horizontal, AppTheme.Spacing.medium)
    }

    // MARK: - Interactive Area Chart

    private var interactiveAreaChart: some View {
        let data = trendDataForPeriod(selectedPeriod)

        return GeometryReader { geo in
            let chartWidth = geo.size.width
            let chartHeight = geo.size.height - 24
            let values = data.map(\.1)
            let maxVal = values.max() ?? 1
            let minVal = (values.min() ?? 0) * 0.85
            let range = max(maxVal - minVal, 0.01)

            let points: [CGPoint] = data.enumerated().map { i, item in
                let x = data.count > 1
                    ? chartWidth * CGFloat(i) / CGFloat(data.count - 1)
                    : chartWidth / 2
                let normalized = CGFloat((item.1 - minVal) / range)
                let y = (chartHeight - 16) * (1 - normalized) + 8
                return CGPoint(x: x, y: y)
            }

            ZStack(alignment: .topLeading) {
                // Gradient area fill (revealed left-to-right)
                makeAreaPath(points: points, bottomY: chartHeight)
                    .fill(
                        LinearGradient(
                            colors: [color.opacity(0.35), color.opacity(0.02)],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )
                    .mask(alignment: .leading) {
                        Color.black
                            .frame(width: max(1, chartWidth * chartDrawProgress))
                    }

                // Smooth curve line
                makeSmoothPath(through: points)
                    .trim(from: 0, to: chartDrawProgress)
                    .stroke(
                        LinearGradient(
                            colors: [color, color.opacity(0.7)],
                            startPoint: .leading,
                            endPoint: .trailing
                        ),
                        style: StrokeStyle(lineWidth: 2.5, lineCap: .round, lineJoin: .round)
                    )

                // Data point dots (appear sequentially as line draws)
                ForEach(Array(points.enumerated()), id: \.offset) { i, point in
                    let fraction = data.count > 1 ? CGFloat(i) / CGFloat(data.count - 1) : 0
                    Circle()
                        .fill(.white)
                        .frame(width: 6, height: 6)
                        .overlay(Circle().stroke(color, lineWidth: 2))
                        .position(point)
                        .opacity(chartDrawProgress > fraction + 0.05 && selectedDataIndex != i ? 1 : 0)
                }

                // Selected point indicator + tooltip
                if let idx = selectedDataIndex, idx < points.count {
                    let point = points[idx]
                    let item = data[idx]

                    // Vertical dashed indicator
                    Path { p in
                        p.move(to: CGPoint(x: point.x, y: 0))
                        p.addLine(to: CGPoint(x: point.x, y: chartHeight))
                    }
                    .stroke(color.opacity(0.25), style: StrokeStyle(lineWidth: 1, dash: [4, 3]))

                    // Glow dot
                    Circle()
                        .fill(color)
                        .frame(width: 10, height: 10)
                        .shadow(color: color.opacity(0.4), radius: 6)
                        .position(point)

                    // Floating tooltip
                    tooltipView(label: item.0, value: item.1)
                        .position(
                            x: clampTooltipX(point.x, in: chartWidth),
                            y: max(20, point.y - 34)
                        )
                }

                // X-axis labels
                HStack {
                    ForEach(Array(data.enumerated()), id: \.offset) { i, item in
                        if i > 0 { Spacer() }
                        Text(item.0)
                            .font(AppTheme.Typography.label(10))
                            .foregroundColor(selectedDataIndex == i ? color : .secondary)
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottom)
            }
            .contentShape(Rectangle())
            .gesture(
                DragGesture(minimumDistance: 0)
                    .onChanged { gesture in
                        let x = gesture.location.x
                        let nearest = points.enumerated().min(by: {
                            abs($0.element.x - x) < abs($1.element.x - x)
                        })?.offset
                        if nearest != selectedDataIndex {
                            selectedDataIndex = nearest
                            UIImpactFeedbackGenerator(style: .light).impactOccurred()
                        }
                    }
                    .onEnded { _ in
                        withAnimation(.easeOut(duration: 0.2)) {
                            selectedDataIndex = nil
                        }
                    }
            )
        }
        .frame(height: 160)
        .onAppear {
            chartDrawProgress = 0
            withAnimation(.easeOut(duration: 0.8).delay(0.2)) {
                chartDrawProgress = 1
            }
        }
        .onChange(of: selectedPeriod) {
            selectedDataIndex = nil
            chartDrawProgress = 0
            withAnimation(.easeOut(duration: 0.8)) {
                chartDrawProgress = 1
            }
        }
    }

    // MARK: - Chart Path Helpers

    private func makeSmoothPath(through points: [CGPoint]) -> Path {
        var path = Path()
        guard points.count >= 2 else { return path }

        path.move(to: points[0])

        if points.count == 2 {
            path.addLine(to: points[1])
            return path
        }

        for i in 1..<points.count {
            let p0 = i > 1 ? points[i - 2] : points[i - 1]
            let p1 = points[i - 1]
            let p2 = points[i]
            let p3 = i < points.count - 1 ? points[i + 1] : points[i]

            let tension: CGFloat = 0.3
            let cp1 = CGPoint(
                x: p1.x + (p2.x - p0.x) * tension,
                y: p1.y + (p2.y - p0.y) * tension
            )
            let cp2 = CGPoint(
                x: p2.x - (p3.x - p1.x) * tension,
                y: p2.y - (p3.y - p1.y) * tension
            )

            path.addCurve(to: p2, control1: cp1, control2: cp2)
        }

        return path
    }

    private func makeAreaPath(points: [CGPoint], bottomY: CGFloat) -> Path {
        var path = makeSmoothPath(through: points)

        if let last = points.last {
            path.addLine(to: CGPoint(x: last.x, y: bottomY))
        }
        if let first = points.first {
            path.addLine(to: CGPoint(x: first.x, y: bottomY))
        }
        path.closeSubpath()

        return path
    }

    private func tooltipView(label: String, value: Double) -> some View {
        VStack(spacing: 1) {
            Text(label)
                .font(AppTheme.Typography.label(10))
                .foregroundColor(.secondary)
            Text(String(format: "%.0f%%", value * 100))
                .font(AppTheme.Typography.accent(13))
                .foregroundColor(.primary)
        }
        .padding(.horizontal, AppTheme.Spacing.small)
        .padding(.vertical, AppTheme.Spacing.micro)
        .background(
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.small)
                .fill(colorScheme == .dark ? Color(.systemGray5) : .white)
                .shadow(color: .black.opacity(0.1), radius: 4, y: 2)
        )
    }

    private func clampTooltipX(_ x: CGFloat, in width: CGFloat) -> CGFloat {
        min(max(x, 40), width - 40)
    }

    // MARK: - Period Pills

    private var periodPills: some View {
        HStack(spacing: AppTheme.Spacing.small) {
            ForEach(["1M", "3M", "6M", "1Y"], id: \.self) { period in
                Button {
                    withAnimation(.easeInOut(duration: 0.3)) {
                        selectedPeriod = period
                    }
                } label: {
                    Text(period)
                        .font(AppTheme.Typography.accent(11))
                        .foregroundColor(selectedPeriod == period ? .white : .secondary)
                        .padding(.horizontal, AppTheme.Spacing.compact)
                        .padding(.vertical, AppTheme.Spacing.micro + 2)
                        .background(
                            Capsule()
                                .fill(
                                    selectedPeriod == period
                                        ? AnyShapeStyle(AppTheme.primaryGradient)
                                        : AnyShapeStyle(
                                            colorScheme == .dark
                                                ? Color.white.opacity(0.08)
                                                : Color(UIColor.tertiarySystemFill)
                                        )
                                )
                        )
                }
                .buttonStyle(.plain)
            }
        }
    }

    private func trendDataForPeriod(_ period: String) -> [(String, Double)] {
        switch period {
        case "1M":  return [("W1", 0.82), ("W2", 0.85), ("W3", 0.83), ("W4", 0.9)]
        case "3M":  return [("Dec", 0.8), ("Jan", 0.85), ("Feb", 0.9)]
        case "6M":  return [("Sep", 0.6), ("Oct", 0.7), ("Nov", 0.65), ("Dec", 0.8), ("Jan", 0.85), ("Feb", 0.9)]
        case "1Y":  return [("Mar", 0.4), ("May", 0.52), ("Jul", 0.58), ("Sep", 0.6), ("Nov", 0.65), ("Feb", 0.9)]
        default:    return trendData
        }
    }

    // MARK: - Breakdown Section (Donut Chart)

    private var breakdownSection: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.compact) {
            Text("Breakdown")
                .font(AppTheme.Typography.accent(15))
                .foregroundColor(.primary)
                .padding(.horizontal, AppTheme.Spacing.medium)

            AllocationDonutChart(data: allocationItems, totalValue: totalValue)
                .glassCard(cornerRadius: AppTheme.CornerRadius.large, padding: AppTheme.Spacing.compact)
                .padding(.horizontal, AppTheme.Spacing.medium)
        }
    }
}

// MARK: - Preview

#Preview {
    Color.clear
        .sheet(isPresented: .constant(true)) {
            KpiDetailSheet(
                title: "Total AUM",
                value: "\u{20B9}24.5 Cr",
                icon: "indianrupeesign.circle.fill",
                color: AppTheme.primary,
                growth: KpiGrowth(
                    momChange: 3.2,
                    momAbsolute: 750000,
                    yoyChange: 18.5,
                    yoyAbsolute: 3800000
                )
            )
        }
}
