import SwiftUI

struct GoalProgressCard: View {
    let goal: Goal

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(goal.icon)
                    .font(.title2)

                VStack(alignment: .leading, spacing: 2) {
                    Text(goal.name)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(AppTheme.textPrimary)
                    Text(goal.timeRemaining)
                        .font(.caption)
                        .foregroundColor(AppTheme.textSecondary)
                }

                Spacer()

                Text("\(Int(goal.progress * 100))%")
                    .font(.headline)
                    .fontWeight(.bold)
                    .foregroundColor(AppTheme.primary)
            }

            // Progress Bar
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(AppTheme.progressBackground)
                        .frame(height: 6)

                    RoundedRectangle(cornerRadius: 4)
                        .fill(
                            LinearGradient(
                                colors: [AppTheme.primary, AppTheme.secondary],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .frame(width: geometry.size.width * goal.progress, height: 6)
                }
            }
            .frame(height: 6)

            HStack {
                Text(goal.currentAmount.currencyFormatted)
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(AppTheme.textPrimary)
                Text("of \(goal.targetAmount.currencyFormatted)")
                    .font(.caption)
                    .foregroundColor(AppTheme.textSecondary)
            }
        }
        .padding()
        .background(AppTheme.cardBackground)
        .cornerRadius(16)
        .shadow(color: AppTheme.shadowColor, radius: 4, x: 0, y: 2)
    }
}

#Preview {
    GoalProgressCard(goal: Goal(
        id: "1",
        name: "Home Down Payment",
        icon: "🏠",
        targetAmount: 500000,
        currentAmount: 310000,
        targetDate: Date().addingTimeInterval(86400 * 365 * 2),
        category: .home,
        linkedFunds: [],
        monthlySIP: 12500,
        createdAt: Date()
    ))
    .padding()
}
