import Foundation
import SwiftUI

// MARK: - Generic API Response

struct ApiResponse<T: Decodable>: Decodable {
    let data: T
}

struct PaginatedResponse<T: Decodable>: Decodable {
    let data: [T]
    let total: Int?
    let page: Int?
    let limit: Int?
    let totalPages: Int?
}

// MARK: - Auth Models

struct LoginRequest: Encodable {
    let email: String
    let password: String
}

struct LoginResponse: Decodable {
    let accessToken: String
    let refreshToken: String?
    let user: FAUser?
    let expiresIn: Int?
}

struct AdvisorProfile: Codable {
    let displayName: String?
    let companyName: String?
    let companyLogoUrl: String?
    let avatarUrl: String?
}

struct MeResponse: Decodable {
    let id: String
    let email: String
    let name: String?
    let phone: String?
    let role: String?
    let createdAt: String?
    let advisorProfile: AdvisorProfile?
}

struct FAUser: Codable, Identifiable {
    let id: String
    let email: String
    let name: String?
    let phone: String?
    let role: String?
    let createdAt: String?

    var displayName: String {
        if let name, !name.isEmpty { return name }
        return email.components(separatedBy: "@").first?
            .replacingOccurrences(of: ".", with: " ")
            .capitalized ?? email
    }

    var initials: String {
        displayName.components(separatedBy: " ")
            .compactMap { $0.first?.uppercased() }
            .prefix(2)
            .joined()
    }
}

// MARK: - Client Models

struct FAClient: Codable, Identifiable {
    let id: String
    let name: String
    let email: String
    let phone: String?
    let aum: Double
    let returns: Double
    let riskProfile: String?
    let kycStatus: String?
    let sipCount: Int
    let familyGroupId: String?
    let familyRole: String?
    let status: String?
    let lastActive: String?
    let joinedDate: String?
    let createdAt: String?

    init(id: String, name: String, email: String, phone: String? = nil,
         aum: Double = 0, returns: Double = 0, riskProfile: String? = nil,
         kycStatus: String? = "PENDING", sipCount: Int = 0,
         familyGroupId: String? = nil, familyRole: String? = nil,
         status: String? = nil, lastActive: String? = nil,
         joinedDate: String? = nil, createdAt: String? = nil) {
        self.id = id; self.name = name; self.email = email; self.phone = phone
        self.aum = aum; self.returns = returns; self.riskProfile = riskProfile
        self.kycStatus = kycStatus; self.sipCount = sipCount
        self.familyGroupId = familyGroupId; self.familyRole = familyRole
        self.status = status; self.lastActive = lastActive
        self.joinedDate = joinedDate; self.createdAt = createdAt
    }

    var initials: String {
        name.components(separatedBy: " ")
            .compactMap { $0.first?.uppercased() }
            .prefix(2)
            .joined()
    }

    var formattedAum: String {
        AppTheme.formatCurrencyWithSymbol(aum)
    }
}

struct FAClientDetail: Codable, Identifiable {
    let id: String
    let name: String
    let email: String
    let phone: String?
    let aum: Double
    let returns: Double
    let riskProfile: String?
    let kycStatus: String?
    let panNumber: String?
    let address: String?
    let holdings: [Holding]
    let sips: [FASip]
    let familyMembers: [FamilyMember]
    let recentTransactions: [FATransaction]
    let goals: [FAGoal]?
    let createdAt: String?
    let nomineeName: String?
    let nomineeRelation: String?

    init(id: String, name: String, email: String, phone: String? = nil,
         aum: Double = 0, returns: Double = 0, riskProfile: String? = nil,
         kycStatus: String? = "PENDING", panNumber: String? = nil,
         address: String? = nil, holdings: [Holding] = [],
         sips: [FASip] = [], familyMembers: [FamilyMember] = [],
         recentTransactions: [FATransaction] = [], goals: [FAGoal]? = nil,
         createdAt: String? = nil, nomineeName: String? = nil,
         nomineeRelation: String? = nil) {
        self.id = id; self.name = name; self.email = email; self.phone = phone
        self.aum = aum; self.returns = returns; self.riskProfile = riskProfile
        self.kycStatus = kycStatus; self.panNumber = panNumber
        self.address = address; self.holdings = holdings; self.sips = sips
        self.familyMembers = familyMembers
        self.recentTransactions = recentTransactions; self.goals = goals
        self.createdAt = createdAt; self.nomineeName = nomineeName
        self.nomineeRelation = nomineeRelation
    }

    var initials: String {
        name.components(separatedBy: " ")
            .compactMap { $0.first?.uppercased() }
            .prefix(2)
            .joined()
    }
}

struct Holding: Codable, Identifiable {
    let id: String
    let schemeCode: Int?
    let fundName: String
    let fundCategory: String?
    let category: String?
    let units: Double
    let currentValue: Double
    let investedValue: Double
    let returns: Double
    let returnsPercentage: Double
    let xirr: Double?

    init(id: String, schemeCode: Int? = nil, fundName: String,
         fundCategory: String? = nil, category: String? = nil,
         units: Double = 0, currentValue: Double = 0,
         investedValue: Double = 0, returns: Double = 0,
         returnsPercentage: Double = 0, xirr: Double? = nil) {
        self.id = id; self.schemeCode = schemeCode; self.fundName = fundName
        self.fundCategory = fundCategory; self.category = category
        self.units = units; self.currentValue = currentValue
        self.investedValue = investedValue; self.returns = returns
        self.returnsPercentage = returnsPercentage; self.xirr = xirr
    }
}

struct FamilyMember: Codable, Identifiable {
    let id: String
    let name: String
    let relationship: String
    let aum: Double
    let clientId: String?
    let holdingsCount: Int
    let sipCount: Int
    let returns: Double
    let kycStatus: String?

    init(id: String, name: String, relationship: String, aum: Double = 0,
         clientId: String? = nil, holdingsCount: Int = 0, sipCount: Int = 0,
         returns: Double = 0, kycStatus: String? = nil) {
        self.id = id; self.name = name; self.relationship = relationship
        self.aum = aum; self.clientId = clientId
        self.holdingsCount = holdingsCount; self.sipCount = sipCount
        self.returns = returns; self.kycStatus = kycStatus
    }

    var relationshipLabel: String {
        switch relationship.uppercased() {
        case "SELF": return "Head"
        case "SPOUSE": return "Spouse"
        case "CHILD": return "Child"
        case "PARENT": return "Parent"
        case "SIBLING": return "Sibling"
        default: return relationship
        }
    }

    var initials: String {
        name.components(separatedBy: " ")
            .compactMap { $0.first?.uppercased() }
            .prefix(2)
            .joined()
    }
}

struct AssetAllocationItem: Codable {
    let assetClass: String
    let value: Double
    let percentage: Double
    let color: String
}

struct PortfolioHistoryPoint: Codable {
    let date: String
    let value: Double
    let invested: Double
    let dayChange: Double?
    let dayChangePct: Double?
}

// MARK: - Pending Action Models

enum ActionPriority: String, Codable {
    case high = "HIGH"
    case medium = "MEDIUM"
    case low = "LOW"

    var color: String {
        switch self {
        case .high: return "EF4444"
        case .medium: return "F59E0B"
        case .low: return "3B82F6"
        }
    }

    var icon: String {
        switch self {
        case .high: return "exclamationmark.triangle.fill"
        case .medium: return "clock.fill"
        case .low: return "info.circle.fill"
        }
    }
}

struct PendingAction: Codable, Identifiable {
    let id: String
    let clientId: String
    let clientName: String
    let type: String          // "KYC_PENDING", "SIP_FAILED", "TRADE_PENDING", "REBALANCE"
    let title: String
    let message: String
    let priority: ActionPriority
    let createdAt: String?

    var typeIcon: String {
        switch type {
        case "KYC_PENDING": return "checkmark.shield"
        case "SIP_FAILED": return "xmark.circle"
        case "TRADE_PENDING": return "arrow.left.arrow.right"
        case "REBALANCE": return "arrow.triangle.2.circlepath"
        default: return "bell"
        }
    }
}

// MARK: - Goal Models

struct FAGoal: Codable, Identifiable {
    let id: String
    let clientId: String
    let name: String
    let targetAmount: Double
    let currentAmount: Double
    let targetDate: String
    let status: String        // "ON_TRACK", "AT_RISK", "OFF_TRACK"
    let category: String?     // "Retirement", "Education", "Home", "Emergency", "Custom"
    let monthlyRequired: Double?
    let createdAt: String?

    var progress: Double {
        guard targetAmount > 0 else { return 0 }
        return min(currentAmount / targetAmount, 1.0)
    }

    var statusColor: String {
        switch status {
        case "ON_TRACK": return "10B981"
        case "AT_RISK": return "F59E0B"
        case "OFF_TRACK": return "EF4444"
        default: return "94A3B8"
        }
    }

    var statusLabel: String {
        status.replacingOccurrences(of: "_", with: " ").capitalized
    }

    var categoryIcon: String {
        switch category?.uppercased() {
        case "RETIREMENT": return "figure.walk"
        case "EDUCATION": return "graduationcap"
        case "HOME": return "house"
        case "EMERGENCY": return "cross.case"
        default: return "flag"
        }
    }
}

// MARK: - Meeting Note Models

enum MeetingType: String, Codable, CaseIterable {
    case call = "CALL"
    case inPerson = "IN_PERSON"
    case video = "VIDEO"
    case email = "EMAIL"
    case other = "OTHER"

    var label: String {
        switch self {
        case .call: return "Call"
        case .inPerson: return "In Person"
        case .video: return "Video"
        case .email: return "Email"
        case .other: return "Other"
        }
    }

    var icon: String {
        switch self {
        case .call: return "phone.fill"
        case .inPerson: return "person.2.fill"
        case .video: return "video.fill"
        case .email: return "envelope.fill"
        case .other: return "ellipsis.circle.fill"
        }
    }

    var color: Color {
        switch self {
        case .call: return Color(hex: "3B82F6")
        case .inPerson: return Color(hex: "10B981")
        case .video: return Color(hex: "8B5CF6")
        case .email: return Color(hex: "F59E0B")
        case .other: return Color(hex: "64748B")
        }
    }
}

struct MeetingNote: Codable, Identifiable {
    let id: String
    let clientId: String?
    let prospectId: String?
    let title: String
    let content: String
    let meetingType: MeetingType
    let meetingDate: String
    let createdAt: String?
}

struct CreateNoteRequest: Encodable {
    let title: String
    let content: String
    let meetingType: String
    let meetingDate: String
}

// MARK: - Market Index Models

struct MarketIndex: Codable, Identifiable {
    var id: String { symbol }
    let symbol: String
    let name: String
    let currentValue: Double
    let change: Double
    let changePercent: Double

    var isPositive: Bool { change >= 0 }

    var formattedValue: String {
        String(format: "%.2f", currentValue)
    }

    var formattedChange: String {
        String(format: "%+.2f", change)
    }

    var formattedChangePercent: String {
        String(format: "%+.2f%%", changePercent)
    }
}

// MARK: - Client Request Models

struct CreateClientRequest: Encodable {
    let name: String
    let email: String
    let phone: String?
    let panNumber: String?
    let riskProfile: String?
    let address: String?
}

struct UpdateClientRequest: Encodable {
    let name: String?
    let email: String?
    let phone: String?
    let panNumber: String?
    let riskProfile: String?
    let address: String?
}

// MARK: - Transaction Models

struct FATransaction: Codable, Identifiable {
    let id: String
    let clientId: String
    let clientName: String
    let fundName: String
    let fundSchemeCode: String
    let fundCategory: String
    let type: String       // "Buy", "Sell", "SIP", "SWP", "Switch", "STP"
    let amount: Double
    let units: Double
    let nav: Double
    let status: String     // "Pending", "Completed", "Processing", "Failed", "Cancelled"
    let date: String
    let folioNumber: String
    let orderId: String?
    let paymentMode: String?
    let remarks: String?

    init(id: String, clientId: String, clientName: String, fundName: String,
         fundSchemeCode: String = "", fundCategory: String = "",
         type: String, amount: Double, units: Double = 0, nav: Double = 0,
         status: String, date: String, folioNumber: String = "",
         orderId: String? = nil, paymentMode: String? = nil, remarks: String? = nil) {
        self.id = id; self.clientId = clientId; self.clientName = clientName
        self.fundName = fundName; self.fundSchemeCode = fundSchemeCode
        self.fundCategory = fundCategory; self.type = type
        self.amount = amount; self.units = units; self.nav = nav
        self.status = status; self.date = date; self.folioNumber = folioNumber
        self.orderId = orderId; self.paymentMode = paymentMode; self.remarks = remarks
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(String.self, forKey: .id)
        clientId = try c.decode(String.self, forKey: .clientId)
        clientName = try c.decode(String.self, forKey: .clientName)
        fundName = try c.decode(String.self, forKey: .fundName)
        fundSchemeCode = try c.decodeIfPresent(String.self, forKey: .fundSchemeCode) ?? ""
        fundCategory = try c.decodeIfPresent(String.self, forKey: .fundCategory) ?? ""
        type = try c.decode(String.self, forKey: .type)
        amount = try c.decode(Double.self, forKey: .amount)
        units = try c.decodeIfPresent(Double.self, forKey: .units) ?? 0
        nav = try c.decodeIfPresent(Double.self, forKey: .nav) ?? 0
        status = try c.decode(String.self, forKey: .status)
        date = try c.decode(String.self, forKey: .date)
        folioNumber = try c.decodeIfPresent(String.self, forKey: .folioNumber) ?? ""
        orderId = try c.decodeIfPresent(String.self, forKey: .orderId)
        paymentMode = try c.decodeIfPresent(String.self, forKey: .paymentMode)
        remarks = try c.decodeIfPresent(String.self, forKey: .remarks)
    }

    private enum CodingKeys: String, CodingKey {
        case id, clientId, clientName, fundName, fundSchemeCode, fundCategory
        case type, amount, units, nav, status, date, folioNumber
        case orderId, paymentMode, remarks
    }

    var formattedAmount: String { amount.formattedCurrency }
    var isPending: Bool { status == "Pending" }
}

// MARK: - SIP Models

struct FASip: Codable, Identifiable {
    let id: String
    let clientId: String
    let clientName: String?
    let schemeCode: Int
    let fundName: String
    let amount: Double
    let frequency: String     // "MONTHLY", "WEEKLY", "QUARTERLY"
    let sipDate: Int
    let nextDate: String?
    let status: String        // "ACTIVE", "PAUSED", "CANCELLED"
    let totalInvested: Double
    let totalUnits: Double
    let installmentsPaid: Int
    let startDate: String?
    let createdAt: String?

    init(id: String, clientId: String = "", clientName: String? = nil,
         schemeCode: Int = 0, fundName: String, amount: Double,
         frequency: String = "MONTHLY", sipDate: Int = 1,
         nextDate: String? = nil, status: String = "ACTIVE",
         totalInvested: Double = 0, totalUnits: Double = 0,
         installmentsPaid: Int = 0, startDate: String? = nil, createdAt: String? = nil) {
        self.id = id; self.clientId = clientId; self.clientName = clientName
        self.schemeCode = schemeCode; self.fundName = fundName
        self.amount = amount; self.frequency = frequency; self.sipDate = sipDate
        self.nextDate = nextDate; self.status = status
        self.totalInvested = totalInvested; self.totalUnits = totalUnits
        self.installmentsPaid = installmentsPaid; self.startDate = startDate
        self.createdAt = createdAt
    }

    var formattedAmount: String { amount.formattedCurrency }
    var isActive: Bool { status == "ACTIVE" }
    var isPaused: Bool { status == "PAUSED" }
}

struct CreateSipRequest: Encodable {
    let clientId: String
    let schemeCode: Int
    let amount: Double
    let frequency: String
    let sipDate: Int
    let familyMemberId: String?

    init(clientId: String, schemeCode: Int, amount: Double,
         frequency: String = "MONTHLY", sipDate: Int = 1,
         familyMemberId: String? = nil) {
        self.clientId = clientId; self.schemeCode = schemeCode
        self.amount = amount; self.frequency = frequency
        self.sipDate = sipDate; self.familyMemberId = familyMemberId
    }
}

// MARK: - Dashboard Models

struct FADashboard: Decodable {
    let totalAum: Double
    let totalClients: Int
    let activeSips: Int
    let pendingActions: Int
    let avgReturns: Double
    let monthlySipValue: Double
    let recentClients: [FAClient]
    let pendingTransactions: [FATransaction]
    let topPerformers: [FAClient]
    let upcomingSips: [FASip]
    let failedSips: [FASip]
    let aumGrowth: KpiGrowth?
    let clientsGrowth: KpiGrowth?
    let sipsGrowth: KpiGrowth?

    var formattedAum: String { AppTheme.formatCurrencyWithSymbol(totalAum) }
    var formattedMonthlySip: String { AppTheme.formatCurrencyWithSymbol(monthlySipValue) }
}

struct GrowthDataPoint: Decodable {
    let month: String
    let value: Double

    private enum CodingKeys: String, CodingKey {
        case date, month, value
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        value = try container.decode(Double.self, forKey: .value)
        // API may send "date" or "month"
        if let m = try container.decodeIfPresent(String.self, forKey: .month) {
            month = m
        } else if let d = try container.decodeIfPresent(String.self, forKey: .date) {
            // Extract short month label from date string (e.g. "2026-02-12" -> "Feb")
            let formatter = DateFormatter()
            formatter.dateFormat = "yyyy-MM-dd"
            if let parsed = formatter.date(from: d) {
                formatter.dateFormat = "MMM"
                month = formatter.string(from: parsed)
            } else {
                month = String(d.prefix(7)) // fallback: "2026-02"
            }
        } else {
            month = ""
        }
    }

    init(month: String, value: Double) {
        self.month = month; self.value = value
    }
}

struct BreakdownItem: Decodable, Identifiable {
    var id: String { label }
    let label: String
    let value: Int
    let percentage: Double
}

struct KpiGrowth: Decodable {
    let momChange: Double
    let momAbsolute: Double
    let yoyChange: Double
    let yoyAbsolute: Double
    let trend: [GrowthDataPoint]
    let breakdown: [BreakdownItem]

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        momChange = try container.decode(Double.self, forKey: .momChange)
        momAbsolute = try container.decode(Double.self, forKey: .momAbsolute)
        yoyChange = try container.decode(Double.self, forKey: .yoyChange)
        yoyAbsolute = try container.decode(Double.self, forKey: .yoyAbsolute)
        trend = try container.decodeIfPresent([GrowthDataPoint].self, forKey: .trend) ?? []
        breakdown = try container.decodeIfPresent([BreakdownItem].self, forKey: .breakdown) ?? []
    }

    init(momChange: Double, momAbsolute: Double, yoyChange: Double, yoyAbsolute: Double,
         trend: [GrowthDataPoint] = [], breakdown: [BreakdownItem] = []) {
        self.momChange = momChange; self.momAbsolute = momAbsolute
        self.yoyChange = yoyChange; self.yoyAbsolute = yoyAbsolute
        self.trend = trend; self.breakdown = breakdown
    }

    private enum CodingKeys: String, CodingKey {
        case momChange, momAbsolute, yoyChange, yoyAbsolute, trend, breakdown
    }

    var isMomPositive: Bool { momChange >= 0 }
    var formattedMomChange: String { String(format: "%+.1f%%", momChange) }
}

// MARK: - Insights Models

struct FAInsights: Decodable {
    let portfolioHealth: [PortfolioHealthItem]
    let rebalancingAlerts: [RebalancingAlert]
    let taxHarvesting: [TaxHarvestingOpportunity]
    let goalAlerts: [GoalAlert]
    let marketInsights: [MarketInsight]
}

struct PortfolioHealthItem: Decodable, Identifiable {
    var id: String { clientId }
    let clientId: String
    let clientName: String
    let score: Int
    let issues: [String]
    let recommendations: [String]?
}

struct RebalancingAlert: Decodable, Identifiable {
    var id: String { "\(clientId)-\(assetClass)" }
    let clientId: String
    let clientName: String
    let assetClass: String
    let currentAllocation: Double
    let targetAllocation: Double
    let deviation: Double
    let action: String
}

struct TaxHarvestingOpportunity: Decodable, Identifiable {
    var id: String { "\(clientId)-\(fundName)" }
    let clientId: String
    let clientName: String
    let fundName: String
    let unrealizedLoss: Double
    let potentialSavings: Double
}

struct GoalAlert: Decodable, Identifiable {
    var id: String { "\(clientId)-\(goalName)" }
    let clientId: String
    let clientName: String
    let goalName: String
    let status: String
    let message: String
}

struct MarketInsight: Decodable, Identifiable {
    var id: String { title }
    let title: String
    let summary: String
    let category: String
    let impact: String
    let createdAt: String?
}

// MARK: - Fund Models

struct FAFund: Codable, Identifiable {
    var id: Int { schemeCode }
    let schemeCode: Int
    let schemeName: String
    let schemeType: String?
    let schemeCategory: String?
    let nav: Double?
    let navDate: String?
    let aum: Double?
    let expenseRatio: Double?
    let returns1y: Double?
    let returns3y: Double?
    let returns5y: Double?
    let riskRating: Int?
    let fundRating: Int?

    private enum CodingKeys: String, CodingKey {
        case schemeCode, schemeName, schemeType
        case schemeCategory = "category"
        case nav = "currentNav"
        case navDate, aum, expenseRatio
        case returns1y = "return1Y"
        case returns3y = "return3Y"
        case returns5y = "return5Y"
        case riskRating, fundRating
    }

    var riskLevel: String? {
        switch riskRating {
        case 1: return "Low"
        case 2: return "Low to Moderate"
        case 3: return "Moderate"
        case 4: return "Moderately High"
        case 5: return "High"
        default: return nil
        }
    }

    var formattedNavDate: String? {
        guard let navDate else { return nil }
        let isoFormatter = ISO8601DateFormatter()
        isoFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = isoFormatter.date(from: navDate) {
            let out = DateFormatter()
            out.dateFormat = "dd MMM yyyy"
            return out.string(from: date)
        }
        // Fallback: try date-only
        let dateOnly = DateFormatter()
        dateOnly.dateFormat = "yyyy-MM-dd"
        if let date = dateOnly.date(from: String(navDate.prefix(10))) {
            let out = DateFormatter()
            out.dateFormat = "dd MMM yyyy"
            return out.string(from: date)
        }
        return navDate
    }
}

struct FAFundDetail: Codable, Identifiable {
    var id: Int { schemeCode }
    let schemeCode: Int
    let schemeName: String
    let schemeType: String?
    let schemeCategory: String?
    let nav: Double?
    let navDate: String?
    let aum: Double?
    let expenseRatio: Double?
    let returns1y: Double?
    let returns3y: Double?
    let returns5y: Double?
    let riskRating: Int?
    let fundRating: Int?
    let minSipAmount: Double?
    let minLumpsumAmount: Double?
    let exitLoad: String?
    let fundManager: String?
    let fundHouse: String?
    let launchDate: String?
    let benchmark: String?
    let holdings: [FundHolding]?

    private enum CodingKeys: String, CodingKey {
        case schemeCode, schemeName, schemeType
        case schemeCategory = "category"
        case nav = "currentNav"
        case navDate, aum, expenseRatio
        case returns1y = "return1Y"
        case returns3y = "return3Y"
        case returns5y = "return5Y"
        case riskRating, fundRating
        case minSipAmount, minLumpsumAmount, exitLoad
        case fundManager, fundHouse, launchDate, benchmark, holdings
    }

    var riskLevel: String? {
        switch riskRating {
        case 1: return "Low"
        case 2: return "Low to Moderate"
        case 3: return "Moderate"
        case 4: return "Moderately High"
        case 5: return "High"
        default: return nil
        }
    }

    var formattedNavDate: String? {
        guard let navDate else { return nil }
        let isoFormatter = ISO8601DateFormatter()
        isoFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = isoFormatter.date(from: navDate) {
            let out = DateFormatter()
            out.dateFormat = "dd MMM yyyy"
            return out.string(from: date)
        }
        let dateOnly = DateFormatter()
        dateOnly.dateFormat = "yyyy-MM-dd"
        if let date = dateOnly.date(from: String(navDate.prefix(10))) {
            let out = DateFormatter()
            out.dateFormat = "dd MMM yyyy"
            return out.string(from: date)
        }
        return navDate
    }
}

struct FundHolding: Codable {
    let name: String
    let sector: String?
    let percentage: Double
}

struct NavHistoryPoint: Codable {
    let date: String
    let nav: Double
}

// MARK: - Transaction Request Models

struct ExecuteTradeRequest: Encodable {
    let clientId: String
    let schemeCode: String
    let amount: Double
    let familyMemberId: String?
    let notes: String?
}

struct UpdateStatusRequest: Encodable {
    let status: String      // "Approved", "Rejected", "Executed"
    let notes: String?
}

struct CreateTransactionRequest: Encodable {
    let clientId: String
    let fundName: String
    let fundSchemeCode: String
    let fundCategory: String
    let type: String           // "Buy", "Sell"
    let amount: Double
    let nav: Double
    let folioNumber: String
    let date: String?
    let paymentMode: String?
    let remarks: String?
}

// MARK: - Communication Models

struct CommunicationTemplate: Codable, Identifiable {
    var id: String { type }
    let type: String
    let label: String
    let description: String
}

struct CommunicationPreview: Codable {
    let emailSubject: String
    let emailBody: String
    let whatsappBody: String
}

struct CommunicationSendResult: Codable {
    let success: Bool
    let logId: String
    let waLink: String?
    let error: String?
}

struct CommunicationLogClient: Codable {
    let id: String
    let name: String
    let email: String?
    let phone: String?
}

struct CommunicationLog: Codable, Identifiable {
    let id: String
    let advisorId: String
    let clientId: String
    let channel: String
    let type: String
    let subject: String?
    let body: String
    let status: String
    let error: String?
    let sentAt: String?
    let createdAt: String
    let client: CommunicationLogClient?
}

struct CommunicationStats: Codable {
    let totalSent: Int
    let emailCount: Int
    let whatsappCount: Int
    let thisMonthCount: Int
}

struct PreviewCommunicationRequest: Encodable {
    let clientId: String
    let type: String
}

struct SendCommunicationRequest: Encodable {
    let clientId: String
    let channel: String
    let type: String
    let subject: String
    let body: String
}

struct BulkSendRequest: Encodable {
    let clientIds: [String]
    let channel: String
    let type: String
    let subject: String?
    let customBody: String?
}

struct BulkSendResultItem: Codable {
    let clientId: String
    let clientName: String
    let success: Bool
    let error: String?
    let logId: String?
    let waLink: String?
}

struct BulkSendResult: Codable {
    let total: Int
    let sent: Int
    let failed: Int
    let results: [BulkSendResultItem]
}

struct PaginatedCommunicationResponse: Codable {
    let data: [CommunicationLog]
    let total: Int
    let page: Int
    let limit: Int
    let totalPages: Int
}

// MARK: - Prospect Models

enum ProspectStage: String, CaseIterable {
    case discovery = "Discovery"
    case analysis = "Analysis"
    case proposal = "Proposal"
    case negotiation = "Negotiation"
    case closedWon = "Closed Won"
    case closedLost = "Closed Lost"

    var label: String { rawValue }
}

enum LeadSource: String, CaseIterable {
    case referral = "Referral"
    case website = "Website"
    case linkedin = "LinkedIn"
    case event = "Event"
    case coldCall = "Cold Call"
    case socialMedia = "Social Media"
    case other = "Other"

    var label: String { rawValue }
}

struct FAProspect: Identifiable {
    let id: String
    let name: String
    let email: String
    let phone: String
    let potentialAum: Double
    let stage: ProspectStage
    let source: LeadSource
    let nextAction: String
    let nextActionDate: String
    let notes: String
    let probability: Int
    let meetingNotes: [MeetingNote]

    init(id: String, name: String, email: String, phone: String,
         potentialAum: Double, stage: ProspectStage, source: LeadSource,
         nextAction: String, nextActionDate: String, notes: String,
         probability: Int, meetingNotes: [MeetingNote] = []) {
        self.id = id; self.name = name; self.email = email; self.phone = phone
        self.potentialAum = potentialAum; self.stage = stage; self.source = source
        self.nextAction = nextAction; self.nextActionDate = nextActionDate
        self.notes = notes; self.probability = probability
        self.meetingNotes = meetingNotes
    }
}

enum MockProspects {
    static let prospects: [FAProspect] = [
        FAProspect(
            id: "p1", name: "Vikram Malhotra", email: "vikram.malhotra@gmail.com",
            phone: "+91 98765 43210", potentialAum: 5_000_000,
            stage: .proposal, source: .referral,
            nextAction: "Send investment proposal", nextActionDate: "2025-02-15",
            notes: "Interested in equity-heavy portfolio. Currently with ICICI Direct.",
            probability: 70
        ),
        FAProspect(
            id: "p2", name: "Anita Desai", email: "anita.desai@outlook.com",
            phone: "+91 87654 32109", potentialAum: 12_000_000,
            stage: .discovery, source: .linkedin,
            nextAction: "Schedule intro call", nextActionDate: "2025-02-12",
            notes: "Senior executive at TCS. Looking for retirement planning.",
            probability: 30
        ),
        FAProspect(
            id: "p3", name: "Rahul Kapoor", email: "rahul.kapoor@yahoo.com",
            phone: "+91 76543 21098", potentialAum: 3_500_000,
            stage: .negotiation, source: .event,
            nextAction: "Finalize fee structure", nextActionDate: "2025-02-10",
            notes: "Met at Mumbai wealth management conference. Wants tax-efficient portfolio.",
            probability: 85
        ),
        FAProspect(
            id: "p4", name: "Sneha Iyer", email: "sneha.iyer@gmail.com",
            phone: "+91 65432 10987", potentialAum: 8_000_000,
            stage: .analysis, source: .website,
            nextAction: "Review current portfolio", nextActionDate: "2025-02-18",
            notes: "Doctor running her own clinic. Needs SIP strategy for children's education.",
            probability: 50
        ),
        FAProspect(
            id: "p5", name: "Deepak Joshi", email: "deepak.joshi@hotmail.com",
            phone: "+91 54321 09876", potentialAum: 2_000_000,
            stage: .closedWon, source: .referral,
            nextAction: "Onboard client", nextActionDate: "2025-02-08",
            notes: "Referred by Rajesh Sharma. Signed agreement last week.",
            probability: 100
        ),
        FAProspect(
            id: "p6", name: "Meera Reddy", email: "meera.reddy@gmail.com",
            phone: "+91 43210 98765", potentialAum: 15_000_000,
            stage: .proposal, source: .coldCall,
            nextAction: "Present goal-based plan", nextActionDate: "2025-02-20",
            notes: "Family business owner. Looking to diversify from real estate.",
            probability: 60
        ),
        FAProspect(
            id: "p7", name: "Arjun Nair", email: "arjun.nair@company.com",
            phone: "+91 32109 87654", potentialAum: 4_500_000,
            stage: .closedLost, source: .socialMedia,
            nextAction: "Follow up in 6 months", nextActionDate: "2025-08-01",
            notes: "Chose to go with a robo-advisor instead. May reconsider later.",
            probability: 0
        ),
        FAProspect(
            id: "p8", name: "Kavita Menon", email: "kavita.menon@gmail.com",
            phone: "+91 21098 76543", potentialAum: 6_000_000,
            stage: .discovery, source: .referral,
            nextAction: "Send introductory email", nextActionDate: "2025-02-14",
            notes: "Referred by Priya Patel. NRI returning to India, needs investment guidance.",
            probability: 25
        )
    ]
}

// MARK: - Whitelist Models

struct WhitelistedFund: Codable, Identifiable {
    let id: String
    let schemeCode: Int
    let schemeName: String
    let schemeCategory: String?
    let nav: Double?
    let returns1y: Double?
    let returns3y: Double?
    let returns5y: Double?
    let riskRating: Int?
    let fundRating: Int?
    let aum: Double?
    let year: Int
    let notes: String?
    let addedAt: String

    var riskLevel: String? {
        switch riskRating {
        case 1: return "Low"
        case 2: return "Low to Moderate"
        case 3: return "Moderate"
        case 4: return "Moderately High"
        case 5: return "High"
        default: return nil
        }
    }
}

struct AddToWhitelistRequest: Encodable {
    let schemeCode: Int
    let year: Int
    let notes: String?
}

// MARK: - Insurance Models

struct PremiumPayment: Codable, Identifiable {
    let id: String
    let policyId: String
    let amountPaid: Double
    let paymentDate: String
    var paymentMode: String?
    var receiptNumber: String?
    var notes: String?
    var createdAt: String?
}

struct RecordPremiumPaymentRequest: Encodable {
    let amountPaid: Double
    let paymentDate: String
    var paymentMode: String?
    var receiptNumber: String?
    var notes: String?
}

struct InsurancePolicy: Codable, Identifiable {
    let id: String
    let clientId: String
    let policyNumber: String
    let provider: String
    let type: String
    let status: String
    let sumAssured: Double
    let premiumAmount: Double
    let premiumFrequency: String
    let startDate: String
    let maturityDate: String?
    var nextPremiumDate: String?
    var lastPremiumDate: String?
    let nominees: String?
    let notes: String?
    let createdAt: String?
    let updatedAt: String?

    var formattedSumAssured: String {
        if sumAssured >= 10000000 {
            return String(format: "₹%.1f Cr", sumAssured / 10000000)
        } else if sumAssured >= 100000 {
            return String(format: "₹%.1f L", sumAssured / 100000)
        }
        return String(format: "₹%.0f", sumAssured)
    }

    var formattedPremium: String {
        if premiumAmount >= 100000 {
            return String(format: "₹%.1f L", premiumAmount / 100000)
        }
        return String(format: "₹%,.0f", premiumAmount)
    }

    var typeLabel: String {
        switch type {
        case "TERM_LIFE": return "Term Life"
        case "WHOLE_LIFE": return "Whole Life"
        case "ENDOWMENT": return "Endowment"
        case "ULIP": return "ULIP"
        case "HEALTH": return "Health"
        case "CRITICAL_ILLNESS": return "Critical Illness"
        case "PERSONAL_ACCIDENT": return "Personal Accident"
        default: return "Other"
        }
    }

    var typeIcon: String {
        switch type {
        case "TERM_LIFE", "WHOLE_LIFE": return "shield.checkered"
        case "ENDOWMENT", "ULIP": return "chart.line.uptrend.xyaxis"
        case "HEALTH": return "heart.text.square"
        case "CRITICAL_ILLNESS": return "cross.case"
        case "PERSONAL_ACCIDENT": return "figure.fall"
        default: return "doc.text"
        }
    }

    var statusColor: Color {
        switch status {
        case "ACTIVE": return Color(hex: "10B981")
        case "LAPSED": return Color(hex: "EF4444")
        case "SURRENDERED": return Color(hex: "F59E0B")
        case "MATURED": return Color(hex: "3B82F6")
        case "CLAIMED": return Color(hex: "8B5CF6")
        default: return Color(hex: "94A3B8")
        }
    }

    var statusLabel: String {
        status.capitalized
    }

    var isLifeCover: Bool {
        ["TERM_LIFE", "WHOLE_LIFE", "ENDOWMENT", "ULIP"].contains(type)
    }

    var isHealthCover: Bool {
        ["HEALTH", "CRITICAL_ILLNESS"].contains(type)
    }

    var daysUntilDue: Int? {
        guard let dateStr = nextPremiumDate else { return nil }
        let formatters: [DateFormatter] = {
            let iso = DateFormatter()
            iso.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSSZ"
            let simple = DateFormatter()
            simple.dateFormat = "yyyy-MM-dd"
            return [iso, simple]
        }()
        for fmt in formatters {
            if let date = fmt.date(from: dateStr) {
                return Calendar.current.dateComponents([.day], from: Date(), to: date).day
            }
        }
        return nil
    }

    var isDueSoon: Bool {
        guard let days = daysUntilDue else { return false }
        return days <= 7
    }

    var dueStatusColor: Color {
        guard let days = daysUntilDue else { return Color(hex: "94A3B8") }
        if days < 0 { return Color(hex: "EF4444") }
        if days <= 7 { return Color(hex: "F59E0B") }
        return Color(hex: "10B981")
    }
}

struct GapAnalysis: Codable {
    let life: CoverageGap
    let health: CoverageGap
    let policies: [InsurancePolicy]
}

struct CoverageGap: Codable {
    let recommended: Double
    let current: Double
    let gap: Double
    let adequate: Bool
}

struct PolicyDocument: Codable, Identifiable {
    let id: String
    let policyId: String
    let fileName: String
    let mimeType: String
    let fileSize: Int
    let uploadedAt: String

    var formattedFileSize: String {
        if fileSize >= 1_048_576 {
            return String(format: "%.1f MB", Double(fileSize) / 1_048_576)
        }
        return String(format: "%.0f KB", Double(fileSize) / 1024)
    }

    var isPDF: Bool { mimeType == "application/pdf" }
    var isImage: Bool { mimeType.hasPrefix("image/") }
}

struct DocumentDownloadResponse: Codable {
    let url: String
    let fileName: String
    let mimeType: String
}

struct CreateInsurancePolicyRequest: Encodable {
    let policyNumber: String
    let provider: String
    let type: String
    let status: String?
    let sumAssured: Double
    let premiumAmount: Double
    let premiumFrequency: String?
    let startDate: String
    let maturityDate: String?
    let nominees: String?
    let notes: String?
}

struct UpdateInsurancePolicyRequest: Encodable {
    let policyNumber: String?
    let provider: String?
    let type: String?
    let status: String?
    let sumAssured: Double?
    let premiumAmount: Double?
    let premiumFrequency: String?
    let startDate: String?
    let maturityDate: String?
    let nominees: String?
    let notes: String?
}
