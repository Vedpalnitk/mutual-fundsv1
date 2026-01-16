import Foundation

struct Fund: Codable, Identifiable {
    let id: String
    let schemeCode: Int
    let schemeName: String
    let category: String
    let assetClass: String
    var nav: Double
    var navDate: Date?
    var returns: FundReturns?
    var aum: Double?
    var expenseRatio: Double?
    var riskRating: Int? // 1-5
    var minSIP: Double
    var minLumpSum: Double
    var fundManager: String?
    var fundHouse: String?

    var shortName: String {
        // Extract a shorter version of the fund name
        let words = schemeName.components(separatedBy: " ")
        if words.count > 4 {
            return words.prefix(4).joined(separator: " ")
        }
        return schemeName
    }

    var initials: String {
        let words = schemeName.components(separatedBy: " ")
        return words.prefix(2).compactMap { $0.first }.map(String.init).joined()
    }
}

struct FundReturns: Codable {
    var oneMonth: Double?
    var threeMonth: Double?
    var sixMonth: Double?
    var oneYear: Double?
    var threeYear: Double?
    var fiveYear: Double?

    enum CodingKeys: String, CodingKey {
        case oneMonth = "1m"
        case threeMonth = "3m"
        case sixMonth = "6m"
        case oneYear = "1y"
        case threeYear = "3y"
        case fiveYear = "5y"
    }
}

struct FundRecommendation: Codable, Identifiable {
    let id: String
    let fund: Fund
    let score: Double
    let reasons: [String]
    let suggestedAllocation: Double

    var topReason: String {
        reasons.first ?? "Matches your profile"
    }
}

// MARK: - Fund Categories
enum FundCategory: String, CaseIterable {
    case equity = "Equity"
    case debt = "Debt"
    case hybrid = "Hybrid"
    case elss = "ELSS"
    case index = "Index"
    case gold = "Gold"

    var description: String {
        switch self {
        case .equity: return "High growth potential, higher risk"
        case .debt: return "Stable returns, lower risk"
        case .hybrid: return "Balanced mix of equity and debt"
        case .elss: return "Tax saving with 3-year lock-in"
        case .index: return "Track market indices passively"
        case .gold: return "Hedge against inflation"
        }
    }

    var icon: String {
        switch self {
        case .equity: return "chart.line.uptrend.xyaxis"
        case .debt: return "shield.fill"
        case .hybrid: return "circle.lefthalf.filled"
        case .elss: return "indianrupeesign.square.fill"
        case .index: return "chart.bar.fill"
        case .gold: return "dollarsign.circle.fill"
        }
    }

    var color: String {
        switch self {
        case .equity: return "#2563EB"
        case .debt: return "#10B981"
        case .hybrid: return "#F59E0B"
        case .elss: return "#8B5CF6"
        case .index: return "#14B8A6"
        case .gold: return "#EAB308"
        }
    }
}
