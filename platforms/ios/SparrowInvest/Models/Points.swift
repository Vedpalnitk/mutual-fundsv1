//
//  Points.swift
//  SparrowInvest
//
//  Created by Claude on 2025.
//

import Foundation
import SwiftUI

// MARK: - Points Model

struct Points: Codable {
    var totalPoints: Int
    var tier: RewardTier
    var lifetimePoints: Int
    var expiringPoints: Int
    var expiryDate: Date?

    static var empty: Points {
        Points(
            totalPoints: 0,
            tier: .bronze,
            lifetimePoints: 0,
            expiringPoints: 0,
            expiryDate: nil
        )
    }
}

// MARK: - Reward Tier

enum RewardTier: String, Codable, CaseIterable {
    case bronze
    case silver
    case gold
    case platinum

    var displayName: String {
        switch self {
        case .bronze: return "Bronze"
        case .silver: return "Silver"
        case .gold: return "Gold"
        case .platinum: return "Platinum"
        }
    }

    var icon: String {
        switch self {
        case .bronze: return "star"
        case .silver: return "star.fill"
        case .gold: return "star.circle.fill"
        case .platinum: return "sparkles"
        }
    }

    var color: Color {
        switch self {
        case .bronze: return Color(red: 0.8, green: 0.5, blue: 0.2)
        case .silver: return Color(red: 0.75, green: 0.75, blue: 0.75)
        case .gold: return Color(red: 1.0, green: 0.84, blue: 0.0)
        case .platinum: return Color(red: 0.9, green: 0.9, blue: 0.98)
        }
    }

    var minPoints: Int {
        switch self {
        case .bronze: return 0
        case .silver: return 1000
        case .gold: return 2500
        case .platinum: return 5000
        }
    }

    var benefits: [String] {
        switch self {
        case .bronze:
            return [
                "Access to basic fund recommendations",
                "Monthly portfolio insights",
                "Email support"
            ]
        case .silver:
            return [
                "Priority customer support",
                "Weekly market insights",
                "Reduced transaction fees (0.1%)",
                "Early access to new features"
            ]
        case .gold:
            return [
                "Dedicated relationship manager",
                "Free portfolio health checkups",
                "Reduced transaction fees (0.25%)",
                "Exclusive webinars & events",
                "Priority callback from advisors"
            ]
        case .platinum:
            return [
                "Personal wealth advisor",
                "Zero transaction fees",
                "Premium research reports",
                "VIP event invitations",
                "Concierge support 24/7",
                "Exclusive investment opportunities"
            ]
        }
    }

    var nextTier: RewardTier? {
        switch self {
        case .bronze: return .silver
        case .silver: return .gold
        case .gold: return .platinum
        case .platinum: return nil
        }
    }
}

// MARK: - Points Transaction

enum PointsTransactionType: String, Codable {
    case earned
    case redeemed
    case expired
    case bonus

    var icon: String {
        switch self {
        case .earned: return "plus.circle.fill"
        case .redeemed: return "gift.fill"
        case .expired: return "clock.fill"
        case .bonus: return "star.fill"
        }
    }

    var color: Color {
        switch self {
        case .earned: return .green
        case .redeemed: return .blue
        case .expired: return .gray
        case .bonus: return .orange
        }
    }
}

struct PointsTransaction: Codable, Identifiable {
    let id: String
    let type: PointsTransactionType
    let points: Int
    let description: String
    let date: Date

    var displayPoints: String {
        switch type {
        case .earned, .bonus:
            return "+\(points)"
        case .redeemed, .expired:
            return "-\(points)"
        }
    }
}
