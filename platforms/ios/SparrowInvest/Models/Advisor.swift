//
//  Advisor.swift
//  SparrowInvest
//
//  Created by Claude on 2025.
//

import Foundation
import SwiftUI

// MARK: - Advisor Model

struct Advisor: Codable, Identifiable {
    let id: String
    var name: String
    var photo: String?
    var region: String
    var phone: String
    var email: String
    var specializations: [AdvisorSpecialization]
    var experienceYears: Int
    var rating: Double
    var reviewCount: Int
    var languages: [String]
    var isAvailable: Bool

    var initials: String {
        let components = name.split(separator: " ")
        if components.count >= 2 {
            return String(components[0].prefix(1) + components[1].prefix(1)).uppercased()
        } else if let first = components.first {
            return String(first.prefix(2)).uppercased()
        }
        return "AD"
    }

    var formattedExperience: String {
        "\(experienceYears) \(experienceYears == 1 ? "year" : "years")"
    }

    var formattedLanguages: String {
        languages.joined(separator: ", ")
    }
}

// MARK: - Advisor Specialization

enum AdvisorSpecialization: String, Codable, CaseIterable {
    case retirement
    case taxPlanning
    case goalBased
    case sipPlanning
    case portfolioReview
    case nriServices
    case hni

    var displayName: String {
        switch self {
        case .retirement: return "Retirement"
        case .taxPlanning: return "Tax Planning"
        case .goalBased: return "Goal Based"
        case .sipPlanning: return "SIP Planning"
        case .portfolioReview: return "Portfolio Review"
        case .nriServices: return "NRI Services"
        case .hni: return "HNI Services"
        }
    }

    var icon: String {
        switch self {
        case .retirement: return "figure.walk"
        case .taxPlanning: return "percent"
        case .goalBased: return "target"
        case .sipPlanning: return "calendar.badge.plus"
        case .portfolioReview: return "chart.pie"
        case .nriServices: return "globe"
        case .hni: return "crown"
        }
    }

    var color: Color {
        switch self {
        case .retirement: return .purple
        case .taxPlanning: return .green
        case .goalBased: return .blue
        case .sipPlanning: return .orange
        case .portfolioReview: return .cyan
        case .nriServices: return .indigo
        case .hni: return .yellow
        }
    }
}

// MARK: - Callback Request

enum RequestStatus: String, Codable {
    case pending
    case scheduled
    case completed
    case cancelled

    var displayName: String {
        switch self {
        case .pending: return "Pending"
        case .scheduled: return "Scheduled"
        case .completed: return "Completed"
        case .cancelled: return "Cancelled"
        }
    }

    var color: Color {
        switch self {
        case .pending: return .orange
        case .scheduled: return .blue
        case .completed: return .green
        case .cancelled: return .gray
        }
    }
}

struct CallbackRequest: Codable, Identifiable {
    let id: String
    let advisorId: String
    var status: RequestStatus
    var preferredTime: Date?
    var notes: String?
    var createdAt: Date

    static func create(advisorId: String, preferredTime: Date?, notes: String?) -> CallbackRequest {
        CallbackRequest(
            id: UUID().uuidString,
            advisorId: advisorId,
            status: .pending,
            preferredTime: preferredTime,
            notes: notes,
            createdAt: Date()
        )
    }
}
