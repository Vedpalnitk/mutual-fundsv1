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
                type: .sip,
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
                type: .sip,
                amount: 5000,
                units: 44.52,
                nav: 112.30,
                date: Date().addingTimeInterval(-86400 * 5),
                status: .completed
            )
        ]
    }
}
