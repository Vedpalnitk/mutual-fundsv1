import SwiftUI

@MainActor
class InsuranceStore: ObservableObject {
    @Published var policies: [InsurancePolicy] = []
    @Published var gapAnalysis: GapAnalysis?
    @Published var paymentHistory: [PremiumPayment] = []
    @Published var isLoading = false
    @Published var errorMessage: String?

    func loadPolicies(clientId: String) async {
        isLoading = true
        errorMessage = nil

        do {
            policies = try await APIService.shared.get("/clients/\(clientId)/insurance")
        } catch {
            #if DEBUG
            if policies.isEmpty {
                policies = synthesizePolicies(clientId: clientId)
            }
            #else
            errorMessage = error.localizedDescription
            #endif
        }

        isLoading = false
    }

    func loadGapAnalysis(clientId: String, annualIncome: Double? = nil, age: Int? = nil, familySize: Int? = nil) async {
        var params: [String] = []
        if let income = annualIncome { params.append("annualIncome=\(Int(income))") }
        if let age = age { params.append("age=\(age)") }
        if let size = familySize { params.append("familySize=\(size)") }
        let query = params.isEmpty ? "" : "?\(params.joined(separator: "&"))"

        do {
            gapAnalysis = try await APIService.shared.get("/clients/\(clientId)/insurance/gap-analysis\(query)")
        } catch {
            #if DEBUG
            gapAnalysis = synthesizeGapAnalysis()
            #else
            errorMessage = error.localizedDescription
            #endif
        }
    }

    func createPolicy(clientId: String, request: CreateInsurancePolicyRequest) async -> Bool {
        do {
            let policy: InsurancePolicy = try await APIService.shared.post("/clients/\(clientId)/insurance", body: request)
            policies.insert(policy, at: 0)
            return true
        } catch {
            #if DEBUG
            let policy = InsurancePolicy(
                id: UUID().uuidString, clientId: clientId,
                policyNumber: request.policyNumber, provider: request.provider,
                type: request.type, status: request.status ?? "ACTIVE",
                sumAssured: request.sumAssured, premiumAmount: request.premiumAmount,
                premiumFrequency: request.premiumFrequency ?? "ANNUAL",
                startDate: request.startDate, maturityDate: request.maturityDate,
                nominees: request.nominees, notes: request.notes,
                createdAt: ISO8601DateFormatter().string(from: Date()), updatedAt: nil
            )
            policies.insert(policy, at: 0)
            return true
            #else
            errorMessage = error.localizedDescription
            return false
            #endif
        }
    }

    func deletePolicy(clientId: String, policyId: String) async -> Bool {
        do {
            try await APIService.shared.delete("/clients/\(clientId)/insurance/\(policyId)")
            policies.removeAll { $0.id == policyId }
            return true
        } catch {
            #if DEBUG
            policies.removeAll { $0.id == policyId }
            return true
            #else
            errorMessage = error.localizedDescription
            return false
            #endif
        }
    }

    // MARK: - Premium Payments

    func recordPayment(clientId: String, policyId: String, payment: RecordPremiumPaymentRequest) async -> Bool {
        do {
            let _: PremiumPayment = try await APIService.shared.post("/clients/\(clientId)/insurance/\(policyId)/payments", body: payment)
            // Reload policies to get updated nextPremiumDate
            await loadPolicies(clientId: clientId)
            return true
        } catch {
            #if DEBUG
            let mock = PremiumPayment(
                id: UUID().uuidString, policyId: policyId,
                amountPaid: payment.amountPaid, paymentDate: payment.paymentDate,
                paymentMode: payment.paymentMode, receiptNumber: payment.receiptNumber,
                notes: payment.notes, createdAt: ISO8601DateFormatter().string(from: Date())
            )
            paymentHistory.insert(mock, at: 0)
            return true
            #else
            errorMessage = error.localizedDescription
            return false
            #endif
        }
    }

    func loadPaymentHistory(clientId: String, policyId: String) async {
        do {
            paymentHistory = try await APIService.shared.get("/clients/\(clientId)/insurance/\(policyId)/payments")
        } catch {
            #if DEBUG
            paymentHistory = []
            #else
            errorMessage = error.localizedDescription
            #endif
        }
    }

    // MARK: - Demo Synthesis

    private func synthesizePolicies(clientId: String) -> [InsurancePolicy] {
        [
            InsurancePolicy(
                id: "ins-1", clientId: clientId,
                policyNumber: "LIC-87654321", provider: "LIC",
                type: "TERM_LIFE", status: "ACTIVE",
                sumAssured: 10000000, premiumAmount: 12000,
                premiumFrequency: "ANNUAL",
                startDate: "2022-03-15T00:00:00Z", maturityDate: "2052-03-15T00:00:00Z",
                nominees: "Spouse - 100%", notes: "Online term plan",
                createdAt: "2022-03-15T10:00:00Z", updatedAt: nil
            ),
            InsurancePolicy(
                id: "ins-2", clientId: clientId,
                policyNumber: "HDFC-LIFE-456", provider: "HDFC Life",
                type: "ENDOWMENT", status: "ACTIVE",
                sumAssured: 2500000, premiumAmount: 50000,
                premiumFrequency: "ANNUAL",
                startDate: "2020-06-01T00:00:00Z", maturityDate: "2040-06-01T00:00:00Z",
                nominees: "Spouse - 50%, Child - 50%", notes: nil,
                createdAt: "2020-06-01T10:00:00Z", updatedAt: nil
            ),
            InsurancePolicy(
                id: "ins-3", clientId: clientId,
                policyNumber: "STAR-HEALTH-789", provider: "Star Health",
                type: "HEALTH", status: "ACTIVE",
                sumAssured: 1000000, premiumAmount: 18000,
                premiumFrequency: "ANNUAL",
                startDate: "2023-01-01T00:00:00Z", maturityDate: nil,
                nominees: nil, notes: "Family floater - 4 members",
                createdAt: "2023-01-01T10:00:00Z", updatedAt: nil
            ),
        ]
    }

    private func synthesizeGapAnalysis() -> GapAnalysis {
        GapAnalysis(
            life: CoverageGap(recommended: 30000000, current: 12500000, gap: 17500000, adequate: false),
            health: CoverageGap(recommended: 1500000, current: 1000000, gap: 500000, adequate: false),
            policies: []
        )
    }
}
