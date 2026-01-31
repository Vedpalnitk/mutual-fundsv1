//
//  TradeRequest.swift
//  SparrowInvest
//
//  Trade request models for FA-managed users
//

import Foundation

// MARK: - Trade Request

struct TradeRequest: Codable {
    let fundName: String
    let fundSchemeCode: String
    let fundCategory: String
    let type: TradeType
    let amount: Double
    let remarks: String?

    enum TradeType: String, Codable {
        case buy = "BUY"
        case sell = "SELL"
        case sip = "SIP"
    }
}

// MARK: - Trade Request Response

struct TradeRequestResponse: Codable {
    let success: Bool
    let message: String
    let transaction: TransactionSummary?
    let advisorId: String?

    struct TransactionSummary: Codable {
        let id: String
        let fundName: String
        let type: String
        let amount: Double
        let status: String
        let date: String
        let orderId: String?
    }
}

// MARK: - My Trade Requests Response

struct MyTradeRequest: Codable, Identifiable {
    let id: String
    let fundName: String
    let fundCategory: String
    let type: String
    let amount: Double
    let units: Double
    let nav: Double
    let status: String
    let date: String
    let folioNumber: String
    let orderId: String?
    let remarks: String?

    var statusColor: String {
        switch status.lowercased() {
        case "completed": return "#10B981"
        case "pending": return "#F59E0B"
        case "processing": return "#3B82F6"
        case "failed", "cancelled": return "#EF4444"
        default: return "#64748B"
        }
    }

    var isCompleted: Bool {
        status.lowercased() == "completed"
    }

    var isPending: Bool {
        status.lowercased() == "pending"
    }
}
