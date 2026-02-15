import SwiftUI

struct RecordPaymentSheet: View {
    let clientId: String
    let policy: InsurancePolicy
    @ObservedObject var store: InsuranceStore
    @Environment(\.dismiss) private var dismiss
    @Environment(\.colorScheme) private var colorScheme
    @Environment(\.horizontalSizeClass) private var sizeClass
    private var iPad: Bool { sizeClass == .regular }

    @State private var amountText: String = ""
    @State private var paymentDate = Date()
    @State private var paymentMode = "BANK_TRANSFER"
    @State private var receiptNumber = ""
    @State private var notes = ""
    @State private var isSaving = false

    private let paymentModes = [
        ("BANK_TRANSFER", "Bank Transfer"),
        ("CHEQUE", "Cheque"),
        ("UPI", "UPI"),
        ("AUTO_DEBIT", "Auto Debit"),
    ]

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: AppTheme.Spacing.medium) {
                    // Policy Info
                    VStack(alignment: .leading, spacing: 4) {
                        Text(policy.provider)
                            .font(AppTheme.Typography.accent(iPad ? 18 : 15))
                            .foregroundColor(.primary)
                        Text("\(policy.typeLabel) · \(policy.policyNumber)")
                            .font(AppTheme.Typography.body(iPad ? 15 : 13))
                            .foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)

                    // Amount
                    formSection(icon: "indianrupeesign.circle", title: "Payment Amount") {
                        TextField("Amount", text: $amountText)
                            .keyboardType(.decimalPad)
                            .textFieldStyle(.roundedBorder)
                    }

                    // Date
                    formSection(icon: "calendar", title: "Payment Date") {
                        DatePicker("", selection: $paymentDate, displayedComponents: .date)
                            .datePickerStyle(.compact)
                            .labelsHidden()
                    }

                    // Payment Mode
                    formSection(icon: "creditcard", title: "Payment Mode") {
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                ForEach(paymentModes, id: \.0) { mode in
                                    Button {
                                        paymentMode = mode.0
                                    } label: {
                                        Text(mode.1)
                                            .font(AppTheme.Typography.label(iPad ? 14 : 12))
                                            .padding(.horizontal, 12)
                                            .padding(.vertical, 6)
                                            .background(paymentMode == mode.0 ? AppTheme.primary.opacity(0.15) : Color.secondary.opacity(0.08))
                                            .foregroundColor(paymentMode == mode.0 ? AppTheme.primary : .secondary)
                                            .clipShape(Capsule())
                                    }
                                }
                            }
                        }
                    }

                    // Receipt Number
                    formSection(icon: "doc.text", title: "Receipt Number (Optional)") {
                        TextField("e.g. REC-2026-001", text: $receiptNumber)
                            .textFieldStyle(.roundedBorder)
                    }

                    // Notes
                    formSection(icon: "note.text", title: "Notes (Optional)") {
                        TextField("Additional notes", text: $notes, axis: .vertical)
                            .lineLimit(2...4)
                            .textFieldStyle(.roundedBorder)
                    }

                    // Save Button
                    Button {
                        isSaving = true
                        Task {
                            defer { isSaving = false }
                            let formatter = DateFormatter()
                            formatter.dateFormat = "yyyy-MM-dd"

                            let request = RecordPremiumPaymentRequest(
                                amountPaid: Double(amountText) ?? policy.premiumAmount,
                                paymentDate: formatter.string(from: paymentDate),
                                paymentMode: paymentMode,
                                receiptNumber: receiptNumber.isEmpty ? nil : receiptNumber,
                                notes: notes.isEmpty ? nil : notes
                            )

                            let success = await store.recordPayment(
                                clientId: clientId,
                                policyId: policy.id,
                                payment: request
                            )
                            if success { dismiss() }
                        }
                    } label: {
                        if isSaving {
                            ProgressView()
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 12)
                        } else {
                            Text("Record Payment")
                                .font(AppTheme.Typography.accent(iPad ? 18 : 15))
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 12)
                                .background(AppTheme.primaryGradient)
                                .clipShape(Capsule())
                        }
                    }
                    .disabled(isSaving || !isValid)
                    .opacity(isValid ? 1.0 : 0.5)
                }
                .padding(AppTheme.Spacing.medium)
            }
            .navigationTitle("Record Payment")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
        .onAppear {
            amountText = String(format: "%.0f", policy.premiumAmount)
        }
    }

    private var isValid: Bool {
        (Double(amountText) ?? 0) > 0
    }

    private func formSection<Content: View>(icon: String, title: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                Image(systemName: icon)
                    .font(.system(size: 12))
                    .foregroundColor(AppTheme.primary)
                Text(title)
                    .font(AppTheme.Typography.label(iPad ? 13 : 11))
                    .foregroundColor(AppTheme.primary)
            }
            content()
        }
        .glassCard(cornerRadius: AppTheme.CornerRadius.large, padding: AppTheme.Spacing.compact)
    }
}
