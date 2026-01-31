//
//  AdvisorStore.swift
//  SparrowInvest
//
//  Created by Claude on 2025.
//

import Foundation
import SwiftUI

// MARK: - API Response Models

/// Advisor response from /api/v1/advisors
struct AdvisorAPIResponse: Decodable {
    let id: String
    let name: String
    let photo: String?
    let region: String
    let phone: String?
    let email: String
    let specializations: [String]
    let experienceYears: Int
    let rating: Double
    let reviewCount: Int
    let languages: [String]
    let isAvailable: Bool

    enum CodingKeys: String, CodingKey {
        case id, name, photo, region, phone, email, specializations
        case experienceYears = "experience_years"
        case rating
        case reviewCount = "review_count"
        case languages
        case isAvailable = "is_available"
    }

    func toAdvisor() -> Advisor {
        let specs = specializations.compactMap { AdvisorSpecialization(rawValue: $0) }
        return Advisor(
            id: id,
            name: name,
            photo: photo,
            region: region,
            phone: phone ?? "",
            email: email,
            specializations: specs,
            experienceYears: experienceYears,
            rating: rating,
            reviewCount: reviewCount,
            languages: languages,
            isAvailable: isAvailable
        )
    }
}

/// Callback request response
struct CallbackRequestAPIResponse: Decodable {
    let id: String
    let advisorId: String
    let advisorName: String?
    let status: String
    let preferredTime: Date?
    let notes: String?
    let scheduledAt: Date?
    let completedAt: Date?
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case advisorId = "advisor_id"
        case advisorName = "advisor_name"
        case status, notes
        case preferredTime = "preferred_time"
        case scheduledAt = "scheduled_at"
        case completedAt = "completed_at"
        case createdAt = "created_at"
    }

    func toCallbackRequest() -> CallbackRequest {
        let statusEnum: RequestStatus = {
            switch status.lowercased() {
            case "scheduled": return .scheduled
            case "completed": return .completed
            case "cancelled": return .cancelled
            default: return .pending
            }
        }()

        return CallbackRequest(
            id: id,
            advisorId: advisorId,
            status: statusEnum,
            preferredTime: preferredTime,
            notes: notes,
            createdAt: createdAt
        )
    }
}

/// Create callback request
struct CreateCallbackRequestBody: Encodable {
    let advisorId: String
    let preferredTime: Date?
    let notes: String?

    enum CodingKeys: String, CodingKey {
        case advisorId = "advisor_id"
        case preferredTime = "preferred_time"
        case notes
    }
}

/// Assigned advisor response wrapper
struct AssignedAdvisorResponse: Decodable {
    let assignedAdvisor: AdvisorAPIResponse?

    enum CodingKeys: String, CodingKey {
        case assignedAdvisor = "assigned_advisor"
    }
}

// MARK: - Advisor Store

@MainActor
class AdvisorStore: ObservableObject {
    @Published var advisors: [Advisor] = []
    @Published var userRegion: String = "Mumbai"
    @Published var callbackRequests: [CallbackRequest] = []
    @Published var isLoading = false
    @Published var error: Error?

    // User's assigned advisor (if any) - fetched from API
    @Published var assignedAdvisorId: String? = nil
    @Published var userRatings: [String: Int] = [:] // advisorId -> rating (1-5)

    // MARK: - Assigned Advisor

    var assignedAdvisor: Advisor? {
        guard let id = assignedAdvisorId else { return nil }
        return advisors.first { $0.id == id }
    }

    var hasAssignedAdvisor: Bool {
        assignedAdvisorId != nil && assignedAdvisor != nil
    }

    func assignAdvisor(_ advisorId: String) {
        assignedAdvisorId = advisorId
    }

    /// Set assigned advisor from API response (creates advisor if not in list)
    func setAssignedAdvisor(id: String, name: String, email: String) {
        assignedAdvisorId = id

        // Add advisor to list if not already present
        if !advisors.contains(where: { $0.id == id }) {
            let advisor = Advisor(
                id: id,
                name: name,
                photo: nil,
                region: "Your Region",
                phone: "",
                email: email,
                specializations: [.goalBased, .portfolioReview],
                experienceYears: 5,
                rating: 4.5,
                reviewCount: 0,
                languages: ["English", "Hindi"],
                isAvailable: true
            )
            advisors.append(advisor)
        }
    }

    func removeAssignedAdvisor() {
        assignedAdvisorId = nil
    }

    func rateAdvisor(_ advisorId: String, rating: Int) {
        userRatings[advisorId] = rating
        // In a real app, this would also update the advisor's overall rating on the server
    }

    func getUserRating(for advisorId: String) -> Int? {
        userRatings[advisorId]
    }

    // MARK: - Computed Properties

    var advisorsInUserRegion: [Advisor] {
        advisors.filter { $0.region == userRegion }
    }

    var advisorsInOtherRegions: [Advisor] {
        advisors.filter { $0.region != userRegion }
    }

    var regionCount: Int {
        advisorsInUserRegion.count
    }

    var allRegions: [String] {
        Array(Set(advisors.map { $0.region })).sorted()
    }

    private let apiService = APIService.shared

    // MARK: - Initialization

    init() {
        loadMockData()
    }

    // MARK: - Data Fetching

    func fetchAdvisors() async {
        isLoading = true
        defer { isLoading = false }

        do {
            // Fetch advisors from API
            let response: [AdvisorAPIResponse] = try await apiService.get("/advisors")
            self.advisors = response.map { $0.toAdvisor() }

            // Also fetch callback requests
            await fetchCallbackRequests()

            // Fetch assigned advisor
            await fetchAssignedAdvisor()
        } catch {
            self.error = error
            // Fallback to mock data
            print("Failed to fetch advisors from API: \(error). Using mock data.")
            loadMockData()
        }
    }

    func fetchAdvisorsByRegion(_ region: String) async {
        isLoading = true
        defer { isLoading = false }

        do {
            let response: [AdvisorAPIResponse] = try await apiService.get("/advisors?region=\(region)")
            self.advisors = response.map { $0.toAdvisor() }
        } catch {
            self.error = error
        }
    }

    func fetchAssignedAdvisor() async {
        do {
            let response: AssignedAdvisorResponse = try await apiService.get("/users/advisor")
            if let advisor = response.assignedAdvisor {
                self.assignedAdvisorId = advisor.id
                // Ensure the assigned advisor is in our list
                if !advisors.contains(where: { $0.id == advisor.id }) {
                    advisors.append(advisor.toAdvisor())
                }
            } else {
                self.assignedAdvisorId = nil
            }
        } catch {
            // Not critical - user may not have an assigned advisor
            print("Failed to fetch assigned advisor: \(error)")
        }
    }

    func fetchCallbackRequests() async {
        do {
            let response: [CallbackRequestAPIResponse] = try await apiService.get("/users/callback-requests")
            self.callbackRequests = response.map { $0.toCallbackRequest() }
        } catch {
            print("Failed to fetch callback requests: \(error)")
        }
    }

    // MARK: - Callback Request

    func submitCallbackRequest(advisorId: String, preferredTime: Date?, notes: String?) async throws {
        let body = CreateCallbackRequestBody(
            advisorId: advisorId,
            preferredTime: preferredTime,
            notes: notes
        )

        let response: CallbackRequestAPIResponse = try await apiService.post("/users/callback-requests", body: body)
        callbackRequests.append(response.toCallbackRequest())
    }

    /// Legacy synchronous method for UI compatibility
    func submitCallbackRequest(advisorId: String, preferredTime: Date?, notes: String?) {
        let request = CallbackRequest.create(
            advisorId: advisorId,
            preferredTime: preferredTime,
            notes: notes
        )
        callbackRequests.append(request)

        // Fire and forget API call
        Task {
            do {
                let body = CreateCallbackRequestBody(
                    advisorId: advisorId,
                    preferredTime: preferredTime,
                    notes: notes
                )
                let _: CallbackRequestAPIResponse = try await apiService.post("/users/callback-requests", body: body)
            } catch {
                print("Failed to submit callback request to API: \(error)")
            }
        }
    }

    func cancelCallbackRequest(_ requestId: String) async throws {
        try await apiService.delete("/users/callback-requests/\(requestId)")
        callbackRequests.removeAll { $0.id == requestId }
    }

    func getAdvisor(byId id: String) -> Advisor? {
        advisors.first { $0.id == id }
    }

    func getCallbackRequests(forAdvisorId advisorId: String) -> [CallbackRequest] {
        callbackRequests.filter { $0.advisorId == advisorId }
    }

    func hasActiveRequest(forAdvisorId advisorId: String) -> Bool {
        callbackRequests.contains { $0.advisorId == advisorId && $0.status == .pending }
    }

    // MARK: - Mock Data

    private func loadMockData() {
        advisors = [
            // Mumbai Advisors (3)
            Advisor(
                id: "adv_001",
                name: "Rajesh Sharma",
                photo: nil,
                region: "Mumbai",
                phone: "+91 98765 43210",
                email: "rajesh.sharma@sparrowinvest.com",
                specializations: [.retirement, .taxPlanning, .hni],
                experienceYears: 15,
                rating: 4.9,
                reviewCount: 156,
                languages: ["Hindi", "English", "Marathi"],
                isAvailable: true
            ),
            Advisor(
                id: "adv_002",
                name: "Priya Desai",
                photo: nil,
                region: "Mumbai",
                phone: "+91 98765 43211",
                email: "priya.desai@sparrowinvest.com",
                specializations: [.goalBased, .sipPlanning, .portfolioReview],
                experienceYears: 8,
                rating: 4.7,
                reviewCount: 89,
                languages: ["Hindi", "English", "Gujarati"],
                isAvailable: true
            ),
            Advisor(
                id: "adv_003",
                name: "Amit Mehta",
                photo: nil,
                region: "Mumbai",
                phone: "+91 98765 43212",
                email: "amit.mehta@sparrowinvest.com",
                specializations: [.nriServices, .taxPlanning, .hni],
                experienceYears: 12,
                rating: 4.8,
                reviewCount: 124,
                languages: ["Hindi", "English"],
                isAvailable: false
            ),

            // Delhi Advisors (2)
            Advisor(
                id: "adv_004",
                name: "Neha Gupta",
                photo: nil,
                region: "Delhi",
                phone: "+91 98765 43213",
                email: "neha.gupta@sparrowinvest.com",
                specializations: [.retirement, .goalBased, .portfolioReview],
                experienceYears: 10,
                rating: 4.6,
                reviewCount: 78,
                languages: ["Hindi", "English", "Punjabi"],
                isAvailable: true
            ),
            Advisor(
                id: "adv_005",
                name: "Vikram Singh",
                photo: nil,
                region: "Delhi",
                phone: "+91 98765 43214",
                email: "vikram.singh@sparrowinvest.com",
                specializations: [.sipPlanning, .taxPlanning],
                experienceYears: 5,
                rating: 4.2,
                reviewCount: 42,
                languages: ["Hindi", "English"],
                isAvailable: true
            ),

            // Bangalore Advisor (1)
            Advisor(
                id: "adv_006",
                name: "Lakshmi Rao",
                photo: nil,
                region: "Bangalore",
                phone: "+91 98765 43215",
                email: "lakshmi.rao@sparrowinvest.com",
                specializations: [.nriServices, .hni, .portfolioReview, .retirement],
                experienceYears: 14,
                rating: 4.8,
                reviewCount: 132,
                languages: ["English", "Kannada", "Telugu", "Hindi"],
                isAvailable: true
            )
        ]
    }
}
