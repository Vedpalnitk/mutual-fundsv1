import Foundation
import SwiftUI

@MainActor
class FundsStore: ObservableObject {
    @Published var funds: [Fund] = []
    @Published var recommendations: [FundRecommendation] = []
    @Published var watchlist: [Fund] = []
    @Published var searchResults: [Fund] = []
    @Published var isLoading = false
    @Published var error: Error?

    private let apiService = APIService.shared

    init() {
        loadMockData()
    }

    func fetchFunds() async {
        isLoading = true
        defer { isLoading = false }

        do {
            // In real app, fetch from API
            try await Task.sleep(nanoseconds: 500_000_000)
            loadMockData()
        } catch {
            self.error = error
        }
    }

    func fetchRecommendations() async {
        isLoading = true
        defer { isLoading = false }

        do {
            // In real app, fetch from ML service via backend
            try await Task.sleep(nanoseconds: 500_000_000)
            loadMockRecommendations()
        } catch {
            self.error = error
        }
    }

    func searchFunds(query: String) async {
        guard !query.isEmpty else {
            searchResults = []
            return
        }

        isLoading = true
        defer { isLoading = false }

        do {
            try await Task.sleep(nanoseconds: 300_000_000)
            searchResults = funds.filter {
                $0.schemeName.localizedCaseInsensitiveContains(query) ||
                $0.category.localizedCaseInsensitiveContains(query)
            }
        } catch {
            self.error = error
        }
    }

    func addToWatchlist(_ fund: Fund) {
        if !watchlist.contains(where: { $0.id == fund.id }) {
            watchlist.append(fund)
        }
    }

    func removeFromWatchlist(_ fundId: String) {
        watchlist.removeAll { $0.id == fundId }
    }

    func isInWatchlist(_ fundId: String) -> Bool {
        watchlist.contains { $0.id == fundId }
    }

    private func loadMockData() {
        funds = [
            Fund(
                id: "119598",
                schemeCode: 119598,
                schemeName: "Parag Parikh Flexi Cap Fund Direct Growth",
                category: "Flexi Cap",
                assetClass: "equity",
                nav: 78.45,
                navDate: Date(),
                returns: FundReturns(
                    oneMonth: 2.5,
                    threeMonth: 5.8,
                    sixMonth: 12.3,
                    oneYear: 22.4,
                    threeYear: 18.7,
                    fiveYear: 19.2
                ),
                aum: 48520,
                expenseRatio: 0.63,
                riskRating: 4,
                minSIP: 1000,
                minLumpSum: 1000,
                fundManager: "Rajeev Thakkar",
                fundHouse: "PPFAS"
            ),
            Fund(
                id: "120503",
                schemeCode: 120503,
                schemeName: "HDFC Mid-Cap Opportunities Direct Growth",
                category: "Mid Cap",
                assetClass: "equity",
                nav: 112.35,
                navDate: Date(),
                returns: FundReturns(
                    oneMonth: 3.2,
                    threeMonth: 8.5,
                    sixMonth: 15.2,
                    oneYear: 28.5,
                    threeYear: 22.3,
                    fiveYear: 18.9
                ),
                aum: 45890,
                expenseRatio: 0.85,
                riskRating: 5,
                minSIP: 500,
                minLumpSum: 5000,
                fundManager: "Chirag Setalvad",
                fundHouse: "HDFC"
            ),
            Fund(
                id: "119775",
                schemeCode: 119775,
                schemeName: "ICICI Prudential Corporate Bond Fund Direct Growth",
                category: "Corporate Bond",
                assetClass: "debt",
                nav: 24.10,
                navDate: Date(),
                returns: FundReturns(
                    oneMonth: 0.6,
                    threeMonth: 1.8,
                    sixMonth: 3.5,
                    oneYear: 7.2,
                    threeYear: 6.8,
                    fiveYear: 7.5
                ),
                aum: 22450,
                expenseRatio: 0.36,
                riskRating: 2,
                minSIP: 500,
                minLumpSum: 5000,
                fundManager: "Manish Banthia",
                fundHouse: "ICICI Prudential"
            ),
            Fund(
                id: "135781",
                schemeCode: 135781,
                schemeName: "Mirae Asset Large Cap Fund Direct Growth",
                category: "Large Cap",
                assetClass: "equity",
                nav: 89.25,
                navDate: Date(),
                returns: FundReturns(
                    oneMonth: 1.8,
                    threeMonth: 4.5,
                    sixMonth: 10.2,
                    oneYear: 18.5,
                    threeYear: 15.2,
                    fiveYear: 16.8
                ),
                aum: 38920,
                expenseRatio: 0.53,
                riskRating: 4,
                minSIP: 500,
                minLumpSum: 5000,
                fundManager: "Neelesh Surana",
                fundHouse: "Mirae Asset"
            ),
            Fund(
                id: "140251",
                schemeCode: 140251,
                schemeName: "Axis Bluechip Fund Direct Growth",
                category: "Large Cap",
                assetClass: "equity",
                nav: 52.80,
                navDate: Date(),
                returns: FundReturns(
                    oneMonth: 1.5,
                    threeMonth: 3.8,
                    sixMonth: 8.5,
                    oneYear: 15.2,
                    threeYear: 12.8,
                    fiveYear: 14.5
                ),
                aum: 35670,
                expenseRatio: 0.45,
                riskRating: 3,
                minSIP: 500,
                minLumpSum: 5000,
                fundManager: "Shreyash Devalkar",
                fundHouse: "Axis"
            )
        ]
    }

    private func loadMockRecommendations() {
        recommendations = funds.prefix(3).enumerated().map { index, fund in
            FundRecommendation(
                id: "rec-\(fund.id)",
                fund: fund,
                score: 0.95 - Double(index) * 0.05,
                reasons: [
                    "Excellent risk-adjusted returns (Sharpe: 1.1)",
                    "Consistent outperformance over 5+ years",
                    "Low expense ratio - 37% below category average",
                    "Matches your moderate risk profile"
                ],
                suggestedAllocation: 0.25 - Double(index) * 0.05
            )
        }
    }
}
