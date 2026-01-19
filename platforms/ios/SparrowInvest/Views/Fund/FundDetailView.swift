import SwiftUI
import Charts

struct FundDetailView: View {
    let fund: Fund
    @EnvironmentObject var fundsStore: FundsStore
    @EnvironmentObject var navigationStore: NavigationStore
    @State private var selectedPeriod = "3Y"
    @State private var selectedChartPoint: FundChartDataPoint?
    @Environment(\.colorScheme) private var colorScheme

    let periods = ["1M", "3M", "6M", "1Y", "3Y", "5Y"]

    // Generate chart data based on selected period and returns
    private var chartData: [FundChartDataPoint] {
        generateChartData(for: selectedPeriod)
    }

    private var returnForPeriod: Double? {
        switch selectedPeriod {
        case "1M": return fund.returns?.oneMonth
        case "3M": return fund.returns?.threeMonth
        case "6M": return fund.returns?.sixMonth
        case "1Y": return fund.returns?.oneYear
        case "3Y": return fund.returns?.threeYear
        case "5Y": return fund.returns?.fiveYear
        default: return nil
        }
    }

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
                FundPeriodSelector(selectedPeriod: $selectedPeriod, periods: periods)
                    .padding(.horizontal)

                // Return Chart
                FundReturnChart(
                    data: chartData,
                    selectedPoint: $selectedChartPoint,
                    returnPercentage: returnForPeriod,
                    period: selectedPeriod
                )
                .padding(.horizontal)

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
                .glassCardStyle(cornerRadius: AppTheme.CornerRadius.large)
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
                .glassCardStyle(cornerRadius: AppTheme.CornerRadius.large)
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
                    .glassCardStyle(cornerRadius: AppTheme.CornerRadius.large)
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
                        .glassCardStyle(cornerRadius: AppTheme.CornerRadius.medium)
                        .foregroundColor(AppTheme.primary)
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
        .listItemCardStyle(cornerRadius: AppTheme.CornerRadius.medium)
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

// MARK: - Chart Data Model

struct FundChartDataPoint: Identifiable {
    let id = UUID()
    let date: Date
    let value: Double
}

// MARK: - Chart Data Generation

extension FundDetailView {
    func generateChartData(for period: String) -> [FundChartDataPoint] {
        let returnValue = returnForPeriod ?? 0
        let baseValue: Double = 10000 // ₹10,000 investment
        let calendar = Calendar.current
        let today = Date()

        var dataPoints: [FundChartDataPoint] = []
        var numMonths: Int
        var dataPointCount: Int

        switch period {
        case "1M":
            numMonths = 1
            dataPointCount = 30 // Daily for 1 month
        case "3M":
            numMonths = 3
            dataPointCount = 12 // Weekly for 3 months
        case "6M":
            numMonths = 6
            dataPointCount = 24 // Weekly for 6 months
        case "1Y":
            numMonths = 12
            dataPointCount = 24 // Bi-weekly
        case "3Y":
            numMonths = 36
            dataPointCount = 36 // Monthly
        case "5Y":
            numMonths = 60
            dataPointCount = 60 // Monthly
        default:
            numMonths = 12
            dataPointCount = 24
        }

        // Calculate final value based on return percentage
        let finalValue = baseValue * (1 + returnValue / 100)

        // Generate smooth curve data points
        for i in 0..<dataPointCount {
            let progress = Double(i) / Double(dataPointCount - 1)
            let daysAgo = Int(Double(numMonths * 30) * (1 - progress))
            let date = calendar.date(byAdding: .day, value: -daysAgo, to: today) ?? today

            // Use a smooth curve with some realistic variation
            let baseGrowth = baseValue + (finalValue - baseValue) * progress

            // Add some realistic fluctuation (more volatility for equity)
            let volatility = returnValue > 0 ? 0.02 : 0.03
            let noise = sin(Double(i) * 0.5) * baseGrowth * volatility * (1 - progress * 0.5)
            let value = max(baseGrowth + noise, baseValue * 0.8)

            dataPoints.append(FundChartDataPoint(date: date, value: value))
        }

        return dataPoints
    }
}

// MARK: - Fund Period Selector

struct FundPeriodSelector: View {
    @Binding var selectedPeriod: String
    let periods: [String]
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        HStack(spacing: 0) {
            ForEach(periods, id: \.self) { period in
                Button {
                    withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                        selectedPeriod = period
                    }
                } label: {
                    Text(period)
                        .font(.system(size: 13, weight: .medium))
                        .foregroundColor(selectedPeriod == period ? .white : .secondary)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
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
        .background(selectorBackground)
        .overlay(selectorBorder)
        .shadow(color: selectorShadow, radius: 8, x: 0, y: 2)
    }

    private var selectorShadow: Color {
        colorScheme == .dark ? .clear : .black.opacity(0.04)
    }

    @ViewBuilder
    private var selectorBackground: some View {
        if colorScheme == .dark {
            Capsule()
                .fill(Color.black.opacity(0.4))
                .background(Capsule().fill(.ultraThinMaterial))
        } else {
            Capsule()
                .fill(Color.white)
        }
    }

    private var selectorBorder: some View {
        Capsule()
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

// MARK: - Fund Return Chart

struct FundReturnChart: View {
    let data: [FundChartDataPoint]
    @Binding var selectedPoint: FundChartDataPoint?
    let returnPercentage: Double?
    let period: String
    @Environment(\.colorScheme) private var colorScheme

    private var minValue: Double {
        data.map(\.value).min() ?? 10000
    }

    private var maxValue: Double {
        data.map(\.value).max() ?? 12000
    }

    private var chartColor: Color {
        (returnPercentage ?? 0) >= 0 ? .green : .red
    }

    var body: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.small) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Growth of ₹10,000")
                        .font(.system(size: 14, weight: .regular))
                        .foregroundColor(.secondary)

                    if let point = selectedPoint {
                        Text(point.value.currencyFormatted)
                            .font(.system(size: 18, weight: .light, design: .rounded))
                            .foregroundColor(.primary)
                    } else if let lastPoint = data.last {
                        Text(lastPoint.value.currencyFormatted)
                            .font(.system(size: 18, weight: .light, design: .rounded))
                            .foregroundColor(.primary)
                    }
                }

                Spacer()

                // Return badge
                if let returnPct = returnPercentage {
                    HStack(spacing: 2) {
                        Image(systemName: returnPct >= 0 ? "arrow.up.right" : "arrow.down.right")
                            .font(.system(size: 10, weight: .regular))
                        Text("\(returnPct >= 0 ? "+" : "")\(String(format: "%.1f", returnPct))%")
                            .font(.system(size: 12, weight: .medium))
                    }
                    .foregroundColor(chartColor)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background(chartColor.opacity(0.1), in: Capsule())
                }
            }

            // Chart
            if data.isEmpty {
                VStack(spacing: 8) {
                    Image(systemName: "chart.line.uptrend.xyaxis")
                        .font(.system(size: 32))
                        .foregroundColor(Color(uiColor: .tertiaryLabel))
                    Text("No data available")
                        .font(.system(size: 14, weight: .light))
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity)
                .frame(height: 160)
            } else {
                Chart {
                    ForEach(data) { point in
                        // Area fill
                        AreaMark(
                            x: .value("Date", point.date),
                            y: .value("Value", point.value)
                        )
                        .foregroundStyle(
                            LinearGradient(
                                colors: [chartColor.opacity(0.3), chartColor.opacity(0.05)],
                                startPoint: .top,
                                endPoint: .bottom
                            )
                        )

                        // Line
                        LineMark(
                            x: .value("Date", point.date),
                            y: .value("Value", point.value)
                        )
                        .foregroundStyle(chartColor)
                        .lineStyle(StrokeStyle(lineWidth: 2))
                    }

                    // Selection indicator
                    if let selected = selectedPoint {
                        RuleMark(x: .value("Date", selected.date))
                            .foregroundStyle(chartColor.opacity(0.3))
                            .lineStyle(StrokeStyle(lineWidth: 1, dash: [5, 5]))

                        PointMark(
                            x: .value("Date", selected.date),
                            y: .value("Value", selected.value)
                        )
                        .foregroundStyle(chartColor)
                        .symbolSize(80)
                    }
                }
                .chartYScale(domain: minValue * 0.95...maxValue * 1.05)
                .chartPlotStyle { plotArea in
                    plotArea.clipped()
                }
                .chartXAxis {
                    AxisMarks(values: .automatic(desiredCount: 4)) { value in
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
                                            if let closest = data.min(by: {
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
                .frame(height: 160)
            }
        }
        .padding(AppTheme.Spacing.medium)
        .background(cardBackground)
        .overlay(cardBorder)
        .shadow(color: cardShadow, radius: 12, x: 0, y: 4)
    }

    private var cardShadow: Color {
        colorScheme == .dark ? .clear : .black.opacity(0.08)
    }

    @ViewBuilder
    private var cardBackground: some View {
        if colorScheme == .dark {
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.xLarge, style: .continuous)
                .fill(Color.black.opacity(0.4))
                .background(
                    RoundedRectangle(cornerRadius: AppTheme.CornerRadius.xLarge, style: .continuous)
                        .fill(.ultraThinMaterial)
                )
        } else {
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.xLarge, style: .continuous)
                .fill(Color.white)
        }
    }

    private var cardBorder: some View {
        RoundedRectangle(cornerRadius: AppTheme.CornerRadius.xLarge, style: .continuous)
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
                            .init(color: .black.opacity(0.08), location: 0),
                            .init(color: .black.opacity(0.04), location: 0.3),
                            .init(color: .black.opacity(0.02), location: 0.7),
                            .init(color: .black.opacity(0.06), location: 1)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                      ),
                lineWidth: 1
            )
    }

    private func formatAxisDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        switch period {
        case "1M":
            formatter.dateFormat = "d"
        case "3M", "6M":
            formatter.dateFormat = "MMM"
        default:
            formatter.dateFormat = "MMM yy"
        }
        return formatter.string(from: date)
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
        .environmentObject(NavigationStore())
    }
}
