import Foundation
import SwiftUI

@MainActor
class AuthManager: ObservableObject {
    @Published var isAuthenticated = false
    @Published var hasCompletedOnboarding = false
    @Published var user: User?
    @Published var isLoading = false

    private let userDefaults = UserDefaults.standard
    private let authKey = "isAuthenticated"
    private let onboardingKey = "hasCompletedOnboarding"
    private let userKey = "currentUser"

    init() {
        loadStoredAuth()
    }

    private func loadStoredAuth() {
        isAuthenticated = userDefaults.bool(forKey: authKey)
        hasCompletedOnboarding = userDefaults.bool(forKey: onboardingKey)

        if let userData = userDefaults.data(forKey: userKey) {
            user = try? JSONDecoder().decode(User.self, from: userData)
        }

        // For development - auto-login with mock user
        #if DEBUG
        if !isAuthenticated {
            // Uncomment to auto-login for testing
            // mockLogin()
        }
        #endif
    }

    func login(phone: String) async throws {
        isLoading = true
        defer { isLoading = false }

        // Simulate API call
        try await Task.sleep(nanoseconds: 1_000_000_000)

        // In real app, this would call the auth API
        // For now, just store the phone and wait for OTP
    }

    func verifyOTP(otp: String) async throws {
        isLoading = true
        defer { isLoading = false }

        // Simulate OTP verification
        try await Task.sleep(nanoseconds: 1_000_000_000)

        // Mock user for development
        let mockUser = User(
            id: UUID().uuidString,
            firstName: "Priya",
            lastName: "Sharma",
            email: "priya@example.com",
            phone: "+91 98765 43210",
            panNumber: "ABCDE1234F",
            kycStatus: .verified,
            riskProfile: RiskProfile(
                score: 6,
                category: .moderate,
                assessedAt: Date()
            ),
            createdAt: Date()
        )

        self.user = mockUser
        self.isAuthenticated = true

        // Save to UserDefaults
        saveAuth()
    }

    func completeOnboarding() {
        hasCompletedOnboarding = true
        userDefaults.set(true, forKey: onboardingKey)
    }

    func logout() {
        isAuthenticated = false
        hasCompletedOnboarding = false
        user = nil

        userDefaults.removeObject(forKey: authKey)
        userDefaults.removeObject(forKey: onboardingKey)
        userDefaults.removeObject(forKey: userKey)
    }

    private func saveAuth() {
        userDefaults.set(isAuthenticated, forKey: authKey)
        userDefaults.set(hasCompletedOnboarding, forKey: onboardingKey)

        if let user = user, let userData = try? JSONEncoder().encode(user) {
            userDefaults.set(userData, forKey: userKey)
        }
    }

    #if DEBUG
    func mockLogin() {
        let mockUser = User(
            id: UUID().uuidString,
            firstName: "Priya",
            lastName: "Sharma",
            email: "priya@example.com",
            phone: "+91 98765 43210",
            panNumber: "ABCDE1234F",
            kycStatus: .verified,
            riskProfile: RiskProfile(
                score: 6,
                category: .moderate,
                assessedAt: Date()
            ),
            createdAt: Date()
        )

        self.user = mockUser
        self.isAuthenticated = true
        self.hasCompletedOnboarding = true
        saveAuth()
    }
    #endif
}
