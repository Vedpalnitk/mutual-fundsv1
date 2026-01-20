import Foundation
import SwiftUI

@MainActor
class GoalsStore: ObservableObject {
    @Published var goals: [Goal] = []
    @Published var isLoading = false
    @Published var error: Error?

    private let apiService = APIService.shared

    init() {
        loadMockData()
    }

    func fetchGoals() async {
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

    func createGoal(_ goal: Goal) async throws {
        isLoading = true
        defer { isLoading = false }

        // In real app, post to API
        try await Task.sleep(nanoseconds: 500_000_000)
        goals.append(goal)
    }

    func updateGoal(_ goal: Goal) async throws {
        isLoading = true
        defer { isLoading = false }

        // In real app, put to API
        try await Task.sleep(nanoseconds: 500_000_000)

        if let index = goals.firstIndex(where: { $0.id == goal.id }) {
            goals[index] = goal
        }
    }

    func deleteGoal(_ goalId: String) async throws {
        isLoading = true
        defer { isLoading = false }

        // In real app, delete from API
        try await Task.sleep(nanoseconds: 500_000_000)
        goals.removeAll { $0.id == goalId }
    }

    // Synchronous add for simple UI operations
    func addGoal(_ goal: Goal) {
        goals.append(goal)
    }

    private func loadMockData() {
        goals = [
            Goal(
                id: "1",
                name: "Home Down Payment",
                icon: "house.fill",
                targetAmount: 500000,
                currentAmount: 310000,
                targetDate: Date().addingTimeInterval(86400 * 365 * 2),
                category: .home,
                linkedFunds: ["119598", "119775"],
                monthlySIP: 12500,
                createdAt: Date().addingTimeInterval(-86400 * 365)
            ),
            Goal(
                id: "2",
                name: "Retirement Fund",
                icon: "beach.umbrella",
                targetAmount: 10000000,
                currentAmount: 850000,
                targetDate: Date().addingTimeInterval(86400 * 365 * 25),
                category: .retirement,
                linkedFunds: ["119598", "120503"],
                monthlySIP: 15000,
                createdAt: Date().addingTimeInterval(-86400 * 365 * 2)
            ),
            Goal(
                id: "3",
                name: "Emergency Fund",
                icon: "cross.case.fill",
                targetAmount: 300000,
                currentAmount: 300000,
                targetDate: Date().addingTimeInterval(-86400 * 30),
                category: .emergency,
                linkedFunds: ["119775"],
                monthlySIP: nil,
                createdAt: Date().addingTimeInterval(-86400 * 365)
            )
        ]
    }
}
