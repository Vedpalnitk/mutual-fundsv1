//
//  PointsStore.swift
//  SparrowInvest
//
//  Created by Claude on 2025.
//

import Foundation
import SwiftUI

@MainActor
class PointsStore: ObservableObject {
    @Published var points: Points = .empty
    @Published var transactions: [PointsTransaction] = []
    @Published var isLoading = false
    @Published var error: Error?

    // MARK: - Computed Properties

    var pointsToNextTier: Int {
        guard let nextTier = points.tier.nextTier else { return 0 }
        return max(0, nextTier.minPoints - points.totalPoints)
    }

    var progressToNextTier: Double {
        guard let nextTier = points.tier.nextTier else { return 1.0 }
        let currentTierMin = points.tier.minPoints
        let nextTierMin = nextTier.minPoints
        let range = nextTierMin - currentTierMin
        let progress = points.totalPoints - currentTierMin
        return min(1.0, max(0.0, Double(progress) / Double(range)))
    }

    var formattedTotalPoints: String {
        points.totalPoints.formatted()
    }

    var formattedLifetimePoints: String {
        points.lifetimePoints.formatted()
    }

    var formattedExpiringPoints: String {
        points.expiringPoints.formatted()
    }

    var expiryDateFormatted: String? {
        guard let date = points.expiryDate else { return nil }
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        return formatter.string(from: date)
    }

    // MARK: - Initialization

    init() {
        loadMockData()
    }

    // MARK: - Data Fetching

    func fetchPoints() async {
        isLoading = true
        defer { isLoading = false }

        do {
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
            try await Task.sleep(nanoseconds: 300_000_000)
            // Transactions already loaded via mock data
        } catch {
            self.error = error
        }
    }

    // MARK: - Mock Data

    private func loadMockData() {
        // Points data per plan spec
        points = Points(
            totalPoints: 2450,
            tier: .gold,
            lifetimePoints: 5200,
            expiringPoints: 350,
            expiryDate: Calendar.current.date(byAdding: .month, value: 2, to: Date())
        )

        // Sample transactions
        let calendar = Calendar.current
        transactions = [
            PointsTransaction(
                id: "txn_001",
                type: .earned,
                points: 150,
                description: "SIP investment - HDFC Flexi Cap Fund",
                date: calendar.date(byAdding: .day, value: -2, to: Date())!
            ),
            PointsTransaction(
                id: "txn_002",
                type: .earned,
                points: 200,
                description: "Lump sum investment - Axis Bluechip Fund",
                date: calendar.date(byAdding: .day, value: -5, to: Date())!
            ),
            PointsTransaction(
                id: "txn_003",
                type: .bonus,
                points: 500,
                description: "Gold tier bonus reward",
                date: calendar.date(byAdding: .day, value: -10, to: Date())!
            ),
            PointsTransaction(
                id: "txn_004",
                type: .redeemed,
                points: 100,
                description: "Redeemed for ₹100 fee waiver",
                date: calendar.date(byAdding: .day, value: -15, to: Date())!
            ),
            PointsTransaction(
                id: "txn_005",
                type: .earned,
                points: 75,
                description: "SIP investment - Parag Parikh Flexi Cap",
                date: calendar.date(byAdding: .day, value: -18, to: Date())!
            ),
            PointsTransaction(
                id: "txn_006",
                type: .earned,
                points: 125,
                description: "New goal created - Retirement fund",
                date: calendar.date(byAdding: .day, value: -25, to: Date())!
            ),
            PointsTransaction(
                id: "txn_007",
                type: .expired,
                points: 50,
                description: "Points expired",
                date: calendar.date(byAdding: .day, value: -30, to: Date())!
            ),
            PointsTransaction(
                id: "txn_008",
                type: .earned,
                points: 300,
                description: "Referral bonus - Friend joined",
                date: calendar.date(byAdding: .day, value: -35, to: Date())!
            )
        ]
    }
}
