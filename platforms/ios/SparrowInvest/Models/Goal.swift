import Foundation
import SwiftUI

struct Goal: Codable, Identifiable {
    let id: String
    var name: String
    var icon: String
    var targetAmount: Double
    var currentAmount: Double
    var targetDate: Date
    var category: GoalCategory
    var linkedFunds: [String] // Fund codes
    var monthlySIP: Double?
    var createdAt: Date

    var progress: Double {
        guard targetAmount > 0 else { return 0 }
        return min(currentAmount / targetAmount, 1.0)
    }

    var timeRemaining: String {
        let now = Date()
        let components = Calendar.current.dateComponents([.year, .month], from: now, to: targetDate)

        if let years = components.year, years > 0 {
            if let months = components.month, months > 0 {
                return "\(years) yr \(months) mo left"
            }
            return "\(years) yr left"
        } else if let months = components.month, months > 0 {
            return "\(months) mo left"
        } else {
            return "Due soon"
        }
    }

    var isOnTrack: Bool {
        let monthsRemaining = Calendar.current.dateComponents([.month], from: Date(), to: targetDate).month ?? 0
        guard monthsRemaining > 0 else { return progress >= 1.0 }

        let requiredMonthlyProgress = (targetAmount - currentAmount) / Double(monthsRemaining)
        let expectedProgress = currentAmount / targetAmount
        let timeProgress = 1.0 - (Double(monthsRemaining) / 12.0) // Assuming 1 year goals

        return expectedProgress >= timeProgress * 0.9 // Within 10% of expected
    }
}

enum GoalCategory: String, Codable, CaseIterable {
    case retirement = "Retirement"
    case education = "Education"
    case home = "Home"
    case car = "Car"
    case vacation = "Vacation"
    case wedding = "Wedding"
    case emergency = "Emergency Fund"
    case wealth = "Wealth Creation"
    case custom = "Custom"

    var icon: String {
        switch self {
        case .retirement: return "beach.umbrella"
        case .education: return "graduationcap.fill"
        case .home: return "house.fill"
        case .car: return "car.fill"
        case .vacation: return "airplane"
        case .wedding: return "heart.circle.fill"
        case .emergency: return "cross.case.fill"
        case .wealth: return "chart.line.uptrend.xyaxis"
        case .custom: return "star.fill"
        }
    }

    var color: Color {
        switch self {
        case .retirement: return .orange
        case .education: return .blue
        case .home: return .green
        case .car: return .purple
        case .vacation: return .cyan
        case .wedding: return .pink
        case .emergency: return .red
        case .wealth: return .indigo
        case .custom: return .gray
        }
    }

    var defaultTarget: Double {
        switch self {
        case .retirement: return 10_000_000
        case .education: return 2_500_000
        case .home: return 1_000_000
        case .car: return 500_000
        case .vacation: return 200_000
        case .wedding: return 1_500_000
        case .emergency: return 300_000
        case .wealth: return 5_000_000
        case .custom: return 100_000
        }
    }

    var defaultYears: Int {
        switch self {
        case .retirement: return 25
        case .education: return 15
        case .home: return 5
        case .car: return 3
        case .vacation: return 1
        case .wedding: return 3
        case .emergency: return 1
        case .wealth: return 10
        case .custom: return 5
        }
    }

    var suggestedRiskLevel: RiskCategory {
        switch self {
        case .retirement: return .moderate
        case .education: return .moderatelyConservative
        case .home: return .moderatelyConservative
        case .car: return .conservative
        case .vacation: return .conservative
        case .wedding: return .moderatelyConservative
        case .emergency: return .conservative
        case .wealth: return .moderatelyAggressive
        case .custom: return .moderate
        }
    }
}

// MARK: - Goal Templates
struct GoalTemplate {
    let category: GoalCategory
    let name: String
    let description: String

    static let templates: [GoalTemplate] = [
        GoalTemplate(
            category: .retirement,
            name: "Retirement Fund",
            description: "Build a corpus for a comfortable retirement"
        ),
        GoalTemplate(
            category: .education,
            name: "Child's Education",
            description: "Save for higher education expenses"
        ),
        GoalTemplate(
            category: .home,
            name: "Home Down Payment",
            description: "Save for your dream home"
        ),
        GoalTemplate(
            category: .car,
            name: "New Car",
            description: "Fund your next vehicle purchase"
        ),
        GoalTemplate(
            category: .vacation,
            name: "Dream Vacation",
            description: "Plan your perfect getaway"
        ),
        GoalTemplate(
            category: .emergency,
            name: "Emergency Fund",
            description: "Build a safety net for unexpected expenses"
        ),
        GoalTemplate(
            category: .wealth,
            name: "Wealth Builder",
            description: "Long-term wealth creation"
        )
    ]
}
