import Foundation

struct Portfolio: Codable {
    var totalValue: Double
    var totalInvested: Double
    var totalReturns: Double
    var returnsPercentage: Double
    var todayChange: Double
    var todayChangePercentage: Double
    var xirr: Double?
    var assetAllocation: AssetAllocation
    var holdings: [Holding]

    static var empty: Portfolio {
        Portfolio(
            totalValue: 0,
            totalInvested: 0,
            totalReturns: 0,
            returnsPercentage: 0,
            todayChange: 0,
            todayChangePercentage: 0,
            xirr: nil,
            assetAllocation: AssetAllocation(equity: 0, debt: 0, hybrid: 0, gold: 0),
            holdings: []
        )
    }
}

struct AssetAllocation: Codable {
    var equity: Double
    var debt: Double
    var hybrid: Double
    var gold: Double
}

struct Holding: Codable, Identifiable {
    let id: String
    let fundCode: String
    let fundName: String
    let category: String
    let assetClass: AssetClass
    var units: Double
    var averageNav: Double
    var currentNav: Double
    var investedAmount: Double
    var currentValue: Double
    var returns: Double
    var returnsPercentage: Double

    enum AssetClass: String, Codable {
        case equity = "equity"
        case debt = "debt"
        case hybrid = "hybrid"
        case gold = "gold"
        case other = "other"
    }
}

struct SIP: Codable, Identifiable {
    let id: String
    let fundCode: String
    let fundName: String
    var amount: Double
    let frequency: SIPFrequency
    var nextDate: Date
    var status: SIPStatus
    var totalInvested: Double
    var sipCount: Int

    enum SIPFrequency: String, Codable {
        case monthly = "monthly"
        case quarterly = "quarterly"
        case weekly = "weekly"
    }

    enum SIPStatus: String, Codable {
        case active = "active"
        case paused = "paused"
        case completed = "completed"
        case cancelled = "cancelled"
    }
}

struct Transaction: Codable, Identifiable {
    let id: String
    let fundCode: String
    let fundName: String
    let type: TransactionType
    let amount: Double
    let units: Double
    let nav: Double
    let date: Date
    let status: TransactionStatus

    enum TransactionType: String, Codable {
        case purchase = "purchase"
        case redemption = "redemption"
        case sip = "sip"
        case switchIn = "switch_in"
        case switchOut = "switch_out"
    }

    enum TransactionStatus: String, Codable {
        case pending = "pending"
        case processing = "processing"
        case completed = "completed"
        case failed = "failed"
    }
}
