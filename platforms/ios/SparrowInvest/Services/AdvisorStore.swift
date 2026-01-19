//
//  AdvisorStore.swift
//  SparrowInvest
//
//  Created by Claude on 2025.
//

import Foundation
import SwiftUI

@MainActor
class AdvisorStore: ObservableObject {
    @Published var advisors: [Advisor] = []
    @Published var userRegion: String = "Mumbai"
    @Published var callbackRequests: [CallbackRequest] = []
    @Published var isLoading = false
    @Published var error: Error?

    // User's assigned advisor (if any)
    @Published var assignedAdvisorId: String? = "adv_001" // Mock: Rajesh Sharma is assigned
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

    // MARK: - Initialization

    init() {
        loadMockData()
    }

    // MARK: - Data Fetching

    func fetchAdvisors() async {
        isLoading = true
        defer { isLoading = false }

        do {
            try await Task.sleep(nanoseconds: 500_000_000)
            loadMockData()
        } catch {
            self.error = error
        }
    }

    // MARK: - Callback Request

    func submitCallbackRequest(advisorId: String, preferredTime: Date?, notes: String?) {
        let request = CallbackRequest.create(
            advisorId: advisorId,
            preferredTime: preferredTime,
            notes: notes
        )
        callbackRequests.append(request)
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
