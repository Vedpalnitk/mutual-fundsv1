import Foundation
import SwiftUI

@MainActor
class AuthManager: ObservableObject {
    @Published var isAuthenticated = false
    @Published var hasCompletedOnboarding = false
    @Published var hasSeenWelcome = false
    @Published var isGuestUser = false
    @Published var user: User?
    @Published var isLoading = false

    private let userDefaults = UserDefaults.standard
    private let authKey = "isAuthenticated"
    private let onboardingKey = "hasCompletedOnboarding"
    private let welcomeKey = "hasSeenWelcome"
    private let guestKey = "isGuestUser"
    private let userKey = "currentUser"

    /// Profile completion percentage (0-100)
    var profileCompletion: Int {
        guard let user = user else { return 0 }
        var completed = 0
        let total = 7

        if !user.firstName.isEmpty { completed += 1 }
        if !user.lastName.isEmpty { completed += 1 }
        if !user.email.isEmpty { completed += 1 }
        if !user.phone.isEmpty { completed += 1 }
        if user.panNumber != nil { completed += 1 }
        if user.kycStatus == .verified { completed += 1 }
        if user.riskProfile != nil { completed += 1 }

        return Int((Double(completed) / Double(total)) * 100)
    }

    var isProfileComplete: Bool {
        profileCompletion >= 100
    }

    init() {
        loadStoredAuth()
    }

    private func loadStoredAuth() {
        isAuthenticated = userDefaults.bool(forKey: authKey)
        hasCompletedOnboarding = userDefaults.bool(forKey: onboardingKey)
        hasSeenWelcome = userDefaults.bool(forKey: welcomeKey)
        isGuestUser = userDefaults.bool(forKey: guestKey)

        if let userData = userDefaults.data(forKey: userKey) {
            user = try? JSONDecoder().decode(User.self, from: userData)
        }

        // For development - auto-login with mock user
        // Uncomment the lines below to auto-login (skips welcome flow)
        // #if DEBUG
        // if !isAuthenticated {
        //     mockLogin()
        // }
        // #endif
    }

    /// Continue as guest without phone verification
    func continueAsGuest() {
        let guestUser = User(
            id: UUID().uuidString,
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            panNumber: nil,
            kycStatus: .pending,
            riskProfile: nil,
            createdAt: Date()
        )

        self.user = guestUser
        self.isAuthenticated = true
        self.isGuestUser = true
        self.hasCompletedOnboarding = true

        userDefaults.set(true, forKey: authKey)
        userDefaults.set(true, forKey: guestKey)
        userDefaults.set(true, forKey: onboardingKey)
        saveAuth()
    }

    func completeWelcome() {
        hasSeenWelcome = true
        userDefaults.set(true, forKey: welcomeKey)
    }

    enum ResetMethod {
        case email
        case phone
    }

    func login(phone: String) async throws {
        isLoading = true
        defer { isLoading = false }

        // Simulate API call
        try await Task.sleep(nanoseconds: 1_000_000_000)

        // In real app, this would call the auth API
        // For now, just store the phone and wait for OTP
    }

    func loginWithEmail(email: String, password: String) async throws {
        isLoading = true
        defer { isLoading = false }

        // Simulate API call
        try await Task.sleep(nanoseconds: 1_000_000_000)

        // Mock user for development
        let mockUser = User(
            id: UUID().uuidString,
            firstName: "Priya",
            lastName: "Sharma",
            email: email,
            phone: "",
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

    func sendPasswordResetOTP(to identifier: String, method: ResetMethod) async throws {
        isLoading = true
        defer { isLoading = false }

        // Simulate API call to send reset OTP
        try await Task.sleep(nanoseconds: 1_000_000_000)

        // In real app, this would send OTP via email or SMS
    }

    func verifyPasswordResetOTP(otp: String) async throws {
        isLoading = true
        defer { isLoading = false }

        // Simulate OTP verification
        try await Task.sleep(nanoseconds: 1_000_000_000)

        // In real app, this would verify the OTP with backend
    }

    func resetPassword(newPassword: String) async throws {
        isLoading = true
        defer { isLoading = false }

        // Simulate password reset
        try await Task.sleep(nanoseconds: 1_000_000_000)

        // In real app, this would update the password on backend
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
        hasSeenWelcome = false
        isGuestUser = false
        user = nil

        userDefaults.removeObject(forKey: authKey)
        userDefaults.removeObject(forKey: onboardingKey)
        userDefaults.removeObject(forKey: welcomeKey)
        userDefaults.removeObject(forKey: guestKey)
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
        self.hasSeenWelcome = true
        saveAuth()
    }

    func resetToWelcome() {
        // Debug helper to reset and show welcome flow
        isAuthenticated = false
        hasCompletedOnboarding = false
        hasSeenWelcome = false
        user = nil
        userDefaults.removeObject(forKey: authKey)
        userDefaults.removeObject(forKey: onboardingKey)
        userDefaults.removeObject(forKey: welcomeKey)
        userDefaults.removeObject(forKey: userKey)
    }
    #endif
}
