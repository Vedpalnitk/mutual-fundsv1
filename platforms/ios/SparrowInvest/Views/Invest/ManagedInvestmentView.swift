//
//  ManagedInvestmentView.swift
//  SparrowInvest
//
//  Investment flow for FA-managed users
//

import SwiftUI

struct ManagedInvestmentView: View {
    let fund: Fund
    @EnvironmentObject var advisorStore: AdvisorStore
    @Environment(\.dismiss) private var dismiss
    @Environment(\.colorScheme) private var colorScheme

    @State private var investmentType: InvestmentType = .sip
    @State private var amount: String = ""
    @State private var showConfirmation = false
    @State private var isSubmitting = false
    @State private var submitError: String?
    @State private var showError = false
    @State private var confirmationMessage: String = ""

    enum InvestmentType: String, CaseIterable {
        case sip = "SIP"
        case oneTime = "One-time"
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: AppTheme.Spacing.large) {
                    // Fund Info Section
                    fundInfoSection

                    // Investment Type Selector
                    investmentTypeSection

                    // Amount Input
                    amountSection

                    // Order Summary
                    orderSummarySection

                    // Submit Button
                    submitButton
                }
                .padding(AppTheme.Spacing.medium)
            }
            .background(Color(uiColor: .systemGroupedBackground))
            .navigationTitle("Invest")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
            .alert("Order Submitted", isPresented: $showConfirmation) {
                Button("OK") { dismiss() }
            } message: {
                Text(confirmationMessage)
            }
            .alert("Error", isPresented: $showError) {
                Button("OK") { }
            } message: {
                Text(submitError ?? "An error occurred. Please try again.")
            }
        }
    }

    // MARK: - Fund Info Section

    private var fundInfoSection: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.compact) {
            Text("FUND")
                .font(.system(size: 11, weight: .medium))
                .foregroundColor(.blue)
                .tracking(1)

            HStack(spacing: AppTheme.Spacing.medium) {
                // Fund Icon
                ZStack {
                    RoundedRectangle(cornerRadius: AppTheme.CornerRadius.small, style: .continuous)
                        .fill(Color.blue.opacity(colorScheme == .dark ? 0.15 : 0.1))
                        .frame(width: 48, height: 48)

                    Text(fund.initials)
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(.blue)
                }

                VStack(alignment: .leading, spacing: 4) {
                    Text(fund.shortName)
                        .font(.system(size: 15, weight: .medium))
                        .foregroundColor(.primary)

                    HStack(spacing: 8) {
                        Text(fund.category)
                            .font(.system(size: 12))
                            .foregroundColor(.secondary)

                        Text("NAV: \(fund.nav.currencyFormatted)")
                            .font(.system(size: 12))
                            .foregroundColor(.secondary)
                    }
                }

                Spacer()
            }
            .padding(AppTheme.Spacing.medium)
            .background(sectionBackground)
            .overlay(sectionBorder)
            .shadow(color: sectionShadow, radius: 12, x: 0, y: 4)
        }
    }

    // MARK: - Investment Type Section

    private var investmentTypeSection: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.compact) {
            Text("INVESTMENT TYPE")
                .font(.system(size: 11, weight: .medium))
                .foregroundColor(.blue)
                .tracking(1)

            HStack(spacing: 0) {
                ForEach(InvestmentType.allCases, id: \.self) { type in
                    Button {
                        withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                            investmentType = type
                        }
                    } label: {
                        Text(type.rawValue)
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(investmentType == type ? .white : .primary)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 12)
                            .background {
                                if investmentType == type {
                                    Capsule()
                                        .fill(
                                            LinearGradient(
                                                colors: [.blue, .cyan],
                                                startPoint: .leading,
                                                endPoint: .trailing
                                            )
                                        )
                                }
                            }
                    }
                }
            }
            .padding(4)
            .background(segmentBackground)
            .overlay(segmentBorder)
            .shadow(color: segmentShadow, radius: 8, x: 0, y: 2)
        }
    }

    // MARK: - Amount Section

    private var amountSection: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.compact) {
            Text("AMOUNT")
                .font(.system(size: 11, weight: .medium))
                .foregroundColor(.blue)
                .tracking(1)

            VStack(alignment: .leading, spacing: AppTheme.Spacing.compact) {
                HStack {
                    Text("₹")
                        .font(.system(size: 20, weight: .light))
                        .foregroundColor(.secondary)

                    TextField("Enter amount", text: $amount)
                        .font(.system(size: 20, weight: .light, design: .rounded))
                        .keyboardType(.numberPad)
                }
                .padding(AppTheme.Spacing.medium)
                .background(inputBackground)
                .overlay(inputBorder)
                .shadow(color: inputShadow, radius: 8, x: 0, y: 2)

                // Quick amount buttons
                HStack(spacing: AppTheme.Spacing.compact) {
                    ForEach([1000, 5000, 10000, 25000], id: \.self) { quickAmount in
                        Button {
                            amount = "\(quickAmount)"
                        } label: {
                            Text("₹\(quickAmount.formatted())")
                                .font(.system(size: 12, weight: .medium))
                                .foregroundColor(.blue)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 8)
                                .background(
                                    Color.blue.opacity(colorScheme == .dark ? 0.15 : 0.1),
                                    in: Capsule()
                                )
                        }
                    }
                }

                if investmentType == .sip {
                    Text("This amount will be invested monthly via SIP")
                        .font(.system(size: 12))
                        .foregroundColor(.secondary)
                        .padding(.top, 4)
                }
            }
        }
    }

    // MARK: - Order Summary Section

    private var orderSummarySection: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.compact) {
            Text("ORDER SUMMARY")
                .font(.system(size: 11, weight: .medium))
                .foregroundColor(.blue)
                .tracking(1)

            VStack(spacing: 0) {
                SummaryRow(label: "Fund", value: fund.shortName)
                Divider().padding(.leading, 16)
                SummaryRow(label: "Type", value: investmentType.rawValue)
                Divider().padding(.leading, 16)
                SummaryRow(label: "Amount", value: amount.isEmpty ? "—" : "₹\(amount)")

                if let advisor = advisorStore.assignedAdvisor {
                    Divider().padding(.leading, 16)
                    SummaryRow(label: "Advisor", value: advisor.name)
                }
            }
            .background(sectionBackground)
            .overlay(sectionBorder)
            .shadow(color: sectionShadow, radius: 12, x: 0, y: 4)
        }
    }

    // MARK: - Submit Button

    private var submitButton: some View {
        Button(action: submitOrder) {
            HStack {
                if isSubmitting {
                    ProgressView()
                        .tint(.white)
                        .scaleEffect(0.9)
                } else {
                    Image(systemName: "paperplane.fill")
                        .font(.system(size: 14))
                }
                Text(isSubmitting ? "Submitting..." : "Submit to Advisor")
                    .font(.system(size: 16, weight: .semibold))
            }
            .foregroundColor(.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(
                LinearGradient(
                    colors: (amount.isEmpty || isSubmitting) ? [.gray, .gray] : [.blue, .cyan],
                    startPoint: .leading,
                    endPoint: .trailing
                ),
                in: RoundedRectangle(cornerRadius: 14, style: .continuous)
            )
        }
        .disabled(amount.isEmpty || isSubmitting)
        .opacity((amount.isEmpty || isSubmitting) ? 0.6 : 1)
        .padding(.top, AppTheme.Spacing.medium)
    }

    // MARK: - Actions

    private func submitOrder() {
        guard let amountValue = Double(amount), amountValue > 0 else { return }

        isSubmitting = true
        submitError = nil

        Task {
            do {
                // Create trade request
                let request = TradeRequest(
                    fundName: fund.shortName,
                    fundSchemeCode: String(fund.schemeCode),
                    fundCategory: fund.category,
                    type: investmentType == .sip ? .sip : .buy,
                    amount: amountValue,
                    remarks: nil
                )

                let response = try await APIService.shared.submitTradeRequest(request)

                await MainActor.run {
                    isSubmitting = false
                    if response.success {
                        confirmationMessage = response.message.isEmpty
                            ? "Your investment request has been sent to \(advisorStore.assignedAdvisor?.name ?? "your advisor"). You will receive confirmation once processed."
                            : response.message
                        showConfirmation = true
                    } else {
                        submitError = "Failed to submit trade request"
                        showError = true
                    }
                }
            } catch {
                await MainActor.run {
                    isSubmitting = false
                    submitError = error.localizedDescription
                    showError = true
                }
            }
        }
    }

    // MARK: - Styling

    private var sectionShadow: Color {
        colorScheme == .dark ? .clear : .black.opacity(0.08)
    }

    private var segmentShadow: Color {
        colorScheme == .dark ? .clear : .black.opacity(0.04)
    }

    private var inputShadow: Color {
        colorScheme == .dark ? .clear : .black.opacity(0.04)
    }

    @ViewBuilder
    private var sectionBackground: some View {
        if colorScheme == .dark {
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.large, style: .continuous)
                .fill(Color.black.opacity(0.4))
                .background(
                    RoundedRectangle(cornerRadius: AppTheme.CornerRadius.large, style: .continuous)
                        .fill(.ultraThinMaterial)
                )
        } else {
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.large, style: .continuous)
                .fill(Color(uiColor: .white))
        }
    }

    private var sectionBorder: some View {
        RoundedRectangle(cornerRadius: AppTheme.CornerRadius.large, style: .continuous)
            .stroke(
                colorScheme == .dark
                    ? LinearGradient(
                        stops: [
                            .init(color: .white.opacity(0.4), location: 0),
                            .init(color: .white.opacity(0.15), location: 0.3),
                            .init(color: .white.opacity(0.05), location: 0.7),
                            .init(color: .white.opacity(0.1), location: 1)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                      )
                    : LinearGradient(
                        stops: [
                            .init(color: .black.opacity(0.1), location: 0),
                            .init(color: .black.opacity(0.05), location: 0.3),
                            .init(color: .black.opacity(0.03), location: 0.7),
                            .init(color: .black.opacity(0.07), location: 1)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                      ),
                lineWidth: 1
            )
    }

    @ViewBuilder
    private var segmentBackground: some View {
        if colorScheme == .dark {
            Capsule()
                .fill(Color.black.opacity(0.4))
                .background(Capsule().fill(.ultraThinMaterial))
        } else {
            Capsule().fill(Color.white)
        }
    }

    private var segmentBorder: some View {
        Capsule()
            .stroke(
                colorScheme == .dark
                    ? LinearGradient(
                        stops: [
                            .init(color: .white.opacity(0.4), location: 0),
                            .init(color: .white.opacity(0.15), location: 0.3),
                            .init(color: .white.opacity(0.05), location: 0.7),
                            .init(color: .white.opacity(0.1), location: 1)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                      )
                    : LinearGradient(
                        stops: [
                            .init(color: .black.opacity(0.1), location: 0),
                            .init(color: .black.opacity(0.05), location: 0.3),
                            .init(color: .black.opacity(0.03), location: 0.7),
                            .init(color: .black.opacity(0.07), location: 1)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                      ),
                lineWidth: 1
            )
    }

    @ViewBuilder
    private var inputBackground: some View {
        if colorScheme == .dark {
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .fill(Color.black.opacity(0.4))
                .background(
                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .fill(.ultraThinMaterial)
                )
        } else {
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .fill(Color.white)
        }
    }

    private var inputBorder: some View {
        RoundedRectangle(cornerRadius: 14, style: .continuous)
            .stroke(
                colorScheme == .dark
                    ? LinearGradient(
                        stops: [
                            .init(color: .white.opacity(0.4), location: 0),
                            .init(color: .white.opacity(0.15), location: 0.3),
                            .init(color: .white.opacity(0.05), location: 0.7),
                            .init(color: .white.opacity(0.1), location: 1)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                      )
                    : LinearGradient(
                        stops: [
                            .init(color: .black.opacity(0.1), location: 0),
                            .init(color: .black.opacity(0.05), location: 0.3),
                            .init(color: .black.opacity(0.03), location: 0.7),
                            .init(color: .black.opacity(0.07), location: 1)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                      ),
                lineWidth: 1
            )
    }
}

// MARK: - Summary Row

private struct SummaryRow: View {
    let label: String
    let value: String

    var body: some View {
        HStack {
            Text(label)
                .font(.system(size: 14, weight: .regular))
                .foregroundColor(.secondary)
            Spacer()
            Text(value)
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(.primary)
                .lineLimit(1)
        }
        .padding(AppTheme.Spacing.medium)
    }
}

#Preview {
    ManagedInvestmentView(fund: Fund(
        id: "119598",
        schemeCode: 119598,
        schemeName: "Parag Parikh Flexi Cap Fund Direct Growth",
        category: "Flexi Cap",
        assetClass: "equity",
        nav: 78.45,
        navDate: Date(),
        returns: FundReturns(oneMonth: 2.5, threeMonth: 5.8, sixMonth: 12.3, oneYear: 22.4, threeYear: 18.7, fiveYear: 19.2),
        aum: 48520,
        expenseRatio: 0.63,
        riskRating: 4,
        minSIP: 1000,
        minLumpSum: 1000,
        fundManager: "Rajeev Thakkar",
        fundHouse: "PPFAS"
    ))
    .environmentObject(AdvisorStore())
}
