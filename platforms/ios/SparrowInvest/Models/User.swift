import Foundation

struct User: Codable, Identifiable {
    let id: String
    var firstName: String
    var lastName: String
    var email: String
    var phone: String
    var panNumber: String?
    var kycStatus: KYCStatus
    var riskProfile: RiskProfile?
    var createdAt: Date

    var fullName: String {
        "\(firstName) \(lastName)"
    }

    var initials: String {
        let firstInitial = firstName.first.map(String.init) ?? ""
        let lastInitial = lastName.first.map(String.init) ?? ""
        return "\(firstInitial)\(lastInitial)".uppercased()
    }

    enum KYCStatus: String, Codable {
        case pending = "pending"
        case inProgress = "in_progress"
        case verified = "verified"
        case rejected = "rejected"
    }
}

struct RiskProfile: Codable {
    let score: Int // 1-10
    let category: RiskCategory
    let assessedAt: Date

    var description: String {
        switch category {
        case .conservative: return "You prefer stability over high returns"
        case .moderatelyConservative: return "You accept some risk for better returns"
        case .moderate: return "You balance risk and reward"
        case .moderatelyAggressive: return "You're comfortable with market volatility"
        case .aggressive: return "You seek maximum growth potential"
        }
    }
}

enum RiskCategory: String, Codable {
    case conservative = "Conservative"
    case moderatelyConservative = "Moderately Conservative"
    case moderate = "Moderate"
    case moderatelyAggressive = "Moderately Aggressive"
    case aggressive = "Aggressive"

    var assetAllocation: (equity: Double, debt: Double, other: Double) {
        switch self {
        case .conservative: return (0.20, 0.70, 0.10)
        case .moderatelyConservative: return (0.35, 0.55, 0.10)
        case .moderate: return (0.50, 0.40, 0.10)
        case .moderatelyAggressive: return (0.70, 0.20, 0.10)
        case .aggressive: return (0.85, 0.10, 0.05)
        }
    }
}
