import Foundation
import SwiftUI

@MainActor
class PortfolioStore: ObservableObject {
    @Published var portfolio: Portfolio = .empty
    @Published var holdings: [Holding] = []
    @Published var activeSIPs: [SIP] = []
    @Published var transactions: [Transaction] = []
    @Published var isLoading = false
    @Published var error: Error?

    // Portfolio health score (0-100)
    var portfolioHealth: Int {
        calculatePortfolioHealth()
    }

    private func calculatePortfolioHealth() -> Int {
        var score = 70 // Base score

        // Diversification bonus (if holdings > 3)
        if holdings.count >= 3 {
            score += 10
        }

        // Positive returns bonus
        if portfolio.totalReturns > 0 {
            score += 10
        }

        // Active SIPs bonus
        if activeSIPs.count >= 2 {
            score += 5
        }

        // Asset allocation check (equity between 40-80%)
        let equityPercentage = portfolio.assetAllocation.equityPercentage
        if equityPercentage >= 40 && equityPercentage <= 80 {
            score += 5
        }

        return min(100, max(0, score))
    }

    private let apiService = APIService.shared

    init() {
        // Load mock data for development
        loadMockData()
    }

    func fetchPortfolio() async {
        isLoading = true
        defer { isLoading = false }

        do {
            // In real app, fetch from API
            // let data = try await apiService.get("/portfolio")
            // portfolio = try JSONDecoder().decode(Portfolio.self, from: data)

            // For now, use mock data
            try await Task.sleep(nanoseconds: 500_000_000)
            loadMockData()
        } catch {
            self.error = error
        }
    }

    func fetchTransactions() async {
        isLoading = true
        defer { isLoading = false }

        do {
            try await Task.sleep(nanoseconds: 500_000_000)
            // Mock transactions loaded in loadMockData
        } catch {
            self.error = error
        }
    }

    func addHolding(_ holding: Holding) {
        holdings.append(holding)

        // Update portfolio totals
        portfolio = Portfolio(
            totalValue: portfolio.totalValue + holding.currentValue,
            totalInvested: portfolio.totalInvested + holding.investedAmount,
            totalReturns: portfolio.totalReturns + holding.returns,
            returnsPercentage: ((portfolio.totalInvested + holding.investedAmount) > 0)
                ? ((portfolio.totalReturns + holding.returns) / (portfolio.totalInvested + holding.investedAmount)) * 100
                : 0,
            todayChange: portfolio.todayChange,
            todayChangePercentage: portfolio.todayChangePercentage,
            xirr: portfolio.xirr,
            assetAllocation: recalculateAssetAllocation(),
            holdings: holdings
        )
    }

    private func recalculateAssetAllocation() -> AssetAllocation {
        let totalValue = holdings.reduce(0) { $0 + $1.currentValue }
        guard totalValue > 0 else {
            return AssetAllocation(equity: 0, debt: 0, hybrid: 0, gold: 0)
        }

        var equity: Double = 0
        var debt: Double = 0
        var hybrid: Double = 0
        var gold: Double = 0

        for holding in holdings {
            let percentage = (holding.currentValue / totalValue) * 100
            switch holding.assetClass {
            case .equity: equity += percentage
            case .debt: debt += percentage
            case .hybrid: hybrid += percentage
            case .gold: gold += percentage
            case .other: break // Ignore other asset classes
            }
        }

        return AssetAllocation(
            equity: equity.rounded(),
            debt: debt.rounded(),
            hybrid: hybrid.rounded(),
            gold: gold.rounded()
        )
    }

    private func loadMockData() {
        // Mock Portfolio
        portfolio = Portfolio(
            totalValue: 245680,
            totalInvested: 233230,
            totalReturns: 12450,
            returnsPercentage: 5.34,
            todayChange: 890,
            todayChangePercentage: 0.36,
            xirr: 14.2,
            assetAllocation: AssetAllocation(equity: 72, debt: 18, hybrid: 7, gold: 3),
            holdings: []
        )

        // Mock Holdings
        holdings = [
            Holding(
                id: "1",
                fundCode: "119598",
                fundName: "Parag Parikh Flexi Cap Fund",
                category: "Flexi Cap",
                assetClass: .equity,
                units: 1250.45,
                averageNav: 65.50,
                currentNav: 78.45,
                investedAmount: 81904,
                currentValue: 98110,
                returns: 16206,
                returnsPercentage: 19.78
            ),
            Holding(
                id: "2",
                fundCode: "120503",
                fundName: "HDFC Mid-Cap Opportunities",
                category: "Mid Cap",
                assetClass: .equity,
                units: 850.25,
                averageNav: 95.20,
                currentNav: 112.35,
                investedAmount: 80944,
                currentValue: 95526,
                returns: 14582,
                returnsPercentage: 18.01
            ),
            Holding(
                id: "3",
                fundCode: "119775",
                fundName: "ICICI Pru Corporate Bond",
                category: "Corporate Bond",
                assetClass: .debt,
                units: 2500.00,
                averageNav: 22.50,
                currentNav: 24.10,
                investedAmount: 56250,
                currentValue: 60250,
                returns: 4000,
                returnsPercentage: 7.11
            )
        ]

        portfolio.holdings = holdings

        // Mock SIPs
        activeSIPs = [
            SIP(
                id: "1",
                fundCode: "119598",
                fundName: "Parag Parikh Flexi Cap Fund",
                amount: 10000,
                frequency: .monthly,
                nextDate: Date().addingTimeInterval(86400 * 5),
                status: .active,
                totalInvested: 120000,
                sipCount: 12
            ),
            SIP(
                id: "2",
                fundCode: "120503",
                fundName: "HDFC Mid-Cap Opportunities",
                amount: 5000,
                frequency: .monthly,
                nextDate: Date().addingTimeInterval(86400 * 10),
                status: .active,
                totalInvested: 60000,
                sipCount: 12
            ),
            SIP(
                id: "3",
                fundCode: "119775",
                fundName: "ICICI Pru Corporate Bond",
                amount: 5000,
                frequency: .monthly,
                nextDate: Date().addingTimeInterval(86400 * 15),
                status: .active,
                totalInvested: 56250,
                sipCount: 11
            )
        ]

        // Mock Transactions
        transactions = [
            Transaction(
                id: "1",
                fundCode: "119598",
                fundName: "Parag Parikh Flexi Cap Fund",
                type: .sipInstallment,
                amount: 10000,
                units: 127.55,
                nav: 78.40,
                date: Date().addingTimeInterval(-86400 * 2),
                status: .completed
            ),
            Transaction(
                id: "2",
                fundCode: "120503",
                fundName: "HDFC Mid-Cap Opportunities",
                type: .sipInstallment,
                amount: 5000,
                units: 44.52,
                nav: 112.30,
                date: Date().addingTimeInterval(-86400 * 5),
                status: .completed
            ),
            Transaction(
                id: "3",
                fundCode: "119775",
                fundName: "ICICI Pru Corporate Bond",
                type: .purchase,
                amount: 25000,
                units: 1037.34,
                nav: 24.10,
                date: Date().addingTimeInterval(-86400 * 15),
                status: .completed
            ),
            Transaction(
                id: "4",
                fundCode: "119598",
                fundName: "Parag Parikh Flexi Cap Fund",
                type: .dividend,
                amount: 850,
                units: 0,
                nav: 0,
                date: Date().addingTimeInterval(-86400 * 30),
                status: .completed
            )
        ]
    }
}
