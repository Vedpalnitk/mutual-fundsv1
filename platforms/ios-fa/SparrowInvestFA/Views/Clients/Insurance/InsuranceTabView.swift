import SwiftUI

struct InsuranceTabView: View {
    let clientId: String
    @StateObject private var store = InsuranceStore()
    @Environment(\.colorScheme) private var colorScheme
    @Environment(\.horizontalSizeClass) private var sizeClass
    private var iPad: Bool { sizeClass == .regular }
    @State private var showAddPolicy = false
    @State private var selectedPolicyForPayment: InsurancePolicy?
    @State private var selectedPolicyForHistory: InsurancePolicy?
    @State private var selectedPolicyForDocuments: InsurancePolicy?

    var body: some View {
        VStack(spacing: AppTheme.Spacing.small) {
            // Gap Analysis Card
            GapAnalysisCard(gapAnalysis: store.gapAnalysis)

            // Header with count + add button
            HStack {
                Text("Insurance Policies (\(store.policies.count))")
                    .font(AppTheme.Typography.accent(iPad ? 18 : 15))
                    .foregroundColor(.primary)

                Spacer()

                Button {
                    showAddPolicy = true
                } label: {
                    HStack(spacing: 4) {
                        Image(systemName: "plus")
                            .font(.system(size: 12, weight: .semibold))
                        Text("Add Policy")
                            .font(AppTheme.Typography.accent(iPad ? 15 : 13))
                    }
                    .foregroundColor(.white)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 7)
                    .background(AppTheme.primaryGradient)
                    .clipShape(Capsule())
                }
            }
            .padding(.horizontal, AppTheme.Spacing.medium)

            if store.isLoading {
                ProgressView()
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, AppTheme.Spacing.xxxLarge)
            } else if store.policies.isEmpty {
                emptyState
            } else {
                ForEach(store.policies) { policy in
                    policyCard(policy)
                }
            }
        }
        .padding(.horizontal, AppTheme.Spacing.medium)
        .sheet(isPresented: $showAddPolicy) {
            AddInsurancePolicySheet(clientId: clientId, store: store)
        }
        .sheet(item: $selectedPolicyForPayment) { policy in
            RecordPaymentSheet(clientId: clientId, policy: policy, store: store)
                .presentationDetents([.medium, .large])
                .presentationDragIndicator(.visible)
        }
        .sheet(item: $selectedPolicyForHistory) { policy in
            PaymentHistorySheet(clientId: clientId, policy: policy, store: store)
                .presentationDetents([.medium, .large])
                .presentationDragIndicator(.visible)
        }
        .sheet(item: $selectedPolicyForDocuments) { policy in
            PolicyDocumentsSheet(clientId: clientId, policy: policy, store: store)
                .presentationDetents([.medium, .large])
                .presentationDragIndicator(.visible)
        }
        .task {
            await store.loadPolicies(clientId: clientId)
            await store.loadGapAnalysis(clientId: clientId)
        }
    }

    // MARK: - Policy Card

    private func policyCard(_ policy: InsurancePolicy) -> some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.compact) {
            HStack(alignment: .top, spacing: AppTheme.Spacing.small) {
                // Type icon
                ZStack {
                    Circle()
                        .fill(policy.statusColor.opacity(0.12))
                        .frame(width: 36, height: 36)

                    Image(systemName: policy.typeIcon)
                        .font(.system(size: 15))
                        .foregroundColor(policy.statusColor)
                }

                VStack(alignment: .leading, spacing: 2) {
                    Text(policy.provider)
                        .font(AppTheme.Typography.accent(iPad ? 17 : 14))
                        .foregroundColor(.primary)
                        .lineLimit(1)

                    Text(policy.typeLabel)
                        .font(AppTheme.Typography.body(iPad ? 14 : 12))
                        .foregroundColor(.secondary)
                }

                Spacer()

                // Status badge
                Text(policy.statusLabel)
                    .font(AppTheme.Typography.label(iPad ? 12 : 10))
                    .foregroundColor(policy.statusColor)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 2)
                    .background(policy.statusColor.opacity(0.1))
                    .clipShape(Capsule())
            }

            // Details grid
            HStack(spacing: AppTheme.Spacing.small) {
                detailItem(label: "Sum Assured", value: policy.formattedSumAssured)
                detailItem(label: "Premium", value: "\(policy.formattedPremium)/\(policy.premiumFrequency.prefix(1).lowercased() == "a" ? "yr" : policy.premiumFrequency.prefix(1).lowercased() == "m" ? "mo" : "qtr")")
                detailItem(label: "Policy #", value: policy.policyNumber)
            }

            // Next Due Date
            if let days = policy.daysUntilDue {
                HStack(spacing: 6) {
                    Image(systemName: "calendar.badge.clock")
                        .font(.system(size: 11))
                        .foregroundColor(policy.dueStatusColor)

                    Text("Next Due: \(formatDueDate(policy.nextPremiumDate))")
                        .font(AppTheme.Typography.label(iPad ? 13 : 11))
                        .foregroundColor(policy.dueStatusColor)

                    Text("(\(dueDateLabel(days)))")
                        .font(AppTheme.Typography.label(iPad ? 12 : 10))
                        .foregroundColor(policy.dueStatusColor)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 1)
                        .background(policy.dueStatusColor.opacity(0.1))
                        .clipShape(Capsule())

                    Spacer()
                }
            }

            // Nominees if present
            if let nominees = policy.nominees, !nominees.isEmpty {
                HStack(spacing: 4) {
                    Image(systemName: "person.2")
                        .font(.system(size: 10))
                        .foregroundColor(.secondary)
                    Text(nominees)
                        .font(AppTheme.Typography.label(iPad ? 13 : 11))
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                }
            }

            // Action buttons
            HStack(spacing: 8) {
                Button {
                    selectedPolicyForPayment = policy
                } label: {
                    HStack(spacing: 4) {
                        Image(systemName: "indianrupeesign.circle")
                            .font(.system(size: 11))
                        Text("Record Payment")
                            .font(AppTheme.Typography.label(iPad ? 13 : 11))
                    }
                    .foregroundColor(AppTheme.primary)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .background(AppTheme.primary.opacity(0.08))
                    .clipShape(Capsule())
                }

                Button {
                    selectedPolicyForHistory = policy
                } label: {
                    HStack(spacing: 4) {
                        Image(systemName: "clock.arrow.circlepath")
                            .font(.system(size: 11))
                        Text("History")
                            .font(AppTheme.Typography.label(iPad ? 13 : 11))
                    }
                    .foregroundColor(.secondary)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .background(Color.secondary.opacity(0.08))
                    .clipShape(Capsule())
                }

                Button {
                    selectedPolicyForDocuments = policy
                } label: {
                    HStack(spacing: 4) {
                        Image(systemName: "doc.text")
                            .font(.system(size: 11))
                        Text("Documents")
                            .font(AppTheme.Typography.label(iPad ? 13 : 11))
                    }
                    .foregroundColor(.secondary)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .background(Color.secondary.opacity(0.08))
                    .clipShape(Capsule())
                }

                Spacer()
            }
        }
        .padding(.leading, 4)
        .overlay(alignment: .leading) {
            RoundedRectangle(cornerRadius: 2)
                .fill(policy.isLifeCover ? AppTheme.primary : (policy.isHealthCover ? Color(hex: "10B981") : Color(hex: "F59E0B")))
                .frame(width: 4)
        }
        .glassCard(cornerRadius: AppTheme.CornerRadius.large, padding: AppTheme.Spacing.compact)
        .swipeActions(edge: .trailing) {
            Button(role: .destructive) {
                Task {
                    _ = await store.deletePolicy(clientId: clientId, policyId: policy.id)
                    await store.loadGapAnalysis(clientId: clientId)
                }
            } label: {
                Label("Delete", systemImage: "trash")
            }
        }
    }

    // MARK: - Helpers

    private func detailItem(label: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label)
                .font(AppTheme.Typography.label(iPad ? 11 : 9))
                .foregroundColor(.secondary)
            Text(value)
                .font(AppTheme.Typography.accent(iPad ? 14 : 12))
                .foregroundColor(.primary)
                .lineLimit(1)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func formatDueDate(_ dateStr: String?) -> String {
        guard let dateStr = dateStr else { return "-" }
        let formatters: [DateFormatter] = {
            let iso = DateFormatter()
            iso.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSSZ"
            let simple = DateFormatter()
            simple.dateFormat = "yyyy-MM-dd"
            return [iso, simple]
        }()
        let display = DateFormatter()
        display.dateFormat = "dd MMM yyyy"

        for fmt in formatters {
            if let date = fmt.date(from: dateStr) {
                return display.string(from: date)
            }
        }
        return dateStr
    }

    private func dueDateLabel(_ days: Int) -> String {
        if days < 0 { return "\(abs(days))d overdue" }
        if days == 0 { return "Today" }
        if days == 1 { return "Tomorrow" }
        return "\(days) days"
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: AppTheme.Spacing.medium) {
            Image(systemName: "shield")
                .font(.system(size: 48))
                .foregroundColor(.secondary)

            Text("No insurance policies")
                .font(AppTheme.Typography.headline(iPad ? 20 : 17))
                .foregroundColor(.primary)

            Text("Tap \"Add Policy\" to record your client's insurance coverage")
                .font(AppTheme.Typography.body(iPad ? 16 : 14))
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, AppTheme.Spacing.xxxLarge)
    }
}
