import SwiftUI

struct PaymentHistorySheet: View {
    let clientId: String
    let policy: InsurancePolicy
    @ObservedObject var store: InsuranceStore
    @Environment(\.dismiss) private var dismiss
    @Environment(\.colorScheme) private var colorScheme
    @Environment(\.horizontalSizeClass) private var sizeClass
    private var iPad: Bool { sizeClass == .regular }

    var body: some View {
        NavigationStack {
            Group {
                if store.paymentHistory.isEmpty {
                    VStack(spacing: AppTheme.Spacing.medium) {
                        Image(systemName: "clock.arrow.circlepath")
                            .font(.system(size: 48))
                            .foregroundColor(.secondary)

                        Text("No payments recorded")
                            .font(AppTheme.Typography.headline(iPad ? 20 : 17))
                            .foregroundColor(.primary)

                        Text("Record a premium payment to start tracking history")
                            .font(AppTheme.Typography.body(iPad ? 16 : 14))
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, AppTheme.Spacing.xxxLarge)
                } else {
                    ScrollView {
                        VStack(spacing: AppTheme.Spacing.compact) {
                            ForEach(store.paymentHistory) { payment in
                                paymentRow(payment)
                            }
                        }
                        .padding(AppTheme.Spacing.medium)
                    }
                }
            }
            .navigationTitle("Payment History")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                }
            }
        }
        .task {
            await store.loadPaymentHistory(clientId: clientId, policyId: policy.id)
        }
    }

    private func paymentRow(_ payment: PremiumPayment) -> some View {
        HStack(spacing: AppTheme.Spacing.small) {
            // Date indicator
            VStack(spacing: 2) {
                Circle()
                    .fill(AppTheme.primary)
                    .frame(width: 10, height: 10)
            }

            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(formatDate(payment.paymentDate))
                        .font(AppTheme.Typography.accent(iPad ? 15 : 13))
                        .foregroundColor(.primary)

                    Spacer()

                    Text(formatAmount(payment.amountPaid))
                        .font(AppTheme.Typography.accent(iPad ? 17 : 14))
                        .foregroundColor(AppTheme.primary)
                }

                HStack(spacing: 8) {
                    if let mode = payment.paymentMode {
                        Text(modeLabel(mode))
                            .font(AppTheme.Typography.label(iPad ? 12 : 10))
                            .foregroundColor(.secondary)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.secondary.opacity(0.08))
                            .clipShape(Capsule())
                    }

                    if let receipt = payment.receiptNumber, !receipt.isEmpty {
                        Text(receipt)
                            .font(AppTheme.Typography.label(iPad ? 12 : 10))
                            .foregroundColor(.secondary)
                    }
                }

                if let notes = payment.notes, !notes.isEmpty {
                    Text(notes)
                        .font(AppTheme.Typography.body(iPad ? 14 : 12))
                        .foregroundColor(.secondary)
                        .lineLimit(2)
                }
            }
        }
        .glassCard(cornerRadius: AppTheme.CornerRadius.large, padding: AppTheme.Spacing.compact)
    }

    private func formatDate(_ dateStr: String) -> String {
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

    private func formatAmount(_ amount: Double) -> String {
        if amount >= 100000 {
            return String(format: "₹%.1f L", amount / 100000)
        }
        return String(format: "₹%,.0f", amount)
    }

    private func modeLabel(_ mode: String) -> String {
        switch mode {
        case "BANK_TRANSFER": return "Bank Transfer"
        case "CHEQUE": return "Cheque"
        case "UPI": return "UPI"
        case "AUTO_DEBIT": return "Auto Debit"
        default: return mode
        }
    }
}
