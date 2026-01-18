//
//  GoalProgressCard.swift
//  SparrowInvest
//
//  iOS 26 Liquid Glass Goal Progress Card
//

import SwiftUI

struct GoalProgressCard: View {
    let goal: Goal

    var body: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.compact) {
            HStack {
                Text(goal.icon)
                    .font(.system(size: 24))

                VStack(alignment: .leading, spacing: 2) {
                    Text(goal.name)
                        .font(.system(size: 14, weight: .regular))
                        .foregroundColor(.primary)
                    Text(goal.timeRemaining)
                        .font(.system(size: 12, weight: .light))
                        .foregroundColor(.secondary)
                }

                Spacer()

                Text("\(Int(goal.progress * 100))%")
                    .font(.system(size: 18, weight: .light, design: .rounded))
                    .foregroundColor(.blue)
            }

            // Progress Bar
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color(uiColor: .tertiarySystemFill))
                        .frame(height: 6)

                    RoundedRectangle(cornerRadius: 4)
                        .fill(
                            LinearGradient(
                                colors: [.blue, .cyan],
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
                    .font(.system(size: 12, weight: .regular))
                    .foregroundColor(.primary)
                Text("of \(goal.targetAmount.currencyFormatted)")
                    .font(.system(size: 12, weight: .regular))
                    .foregroundColor(.secondary)
            }
        }
        .padding(AppTheme.Spacing.medium)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: AppTheme.CornerRadius.large, style: .continuous))
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
