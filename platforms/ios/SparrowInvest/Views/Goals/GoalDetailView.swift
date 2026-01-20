import SwiftUI

struct GoalDetailView: View {
    let goal: Goal
    @EnvironmentObject var goalsStore: GoalsStore
    @State private var showEditGoal = false

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Progress Card
                VStack(spacing: 16) {
                    // Goal Icon
                    ZStack {
                        RoundedRectangle(cornerRadius: AppTheme.CornerRadius.large, style: .continuous)
                            .fill(goal.category.color.opacity(0.15))
                            .frame(width: 72, height: 72)

                        Image(systemName: goal.category.icon)
                            .font(.system(size: 32))
                            .foregroundColor(goal.category.color)
                    }

                    Text(goal.name)
                        .font(.system(size: 20, weight: .semibold))
                        .foregroundColor(AppTheme.textPrimary)

                    // Progress Ring
                    ZStack {
                        Circle()
                            .stroke(AppTheme.progressBackground, lineWidth: 12)
                            .frame(width: 150, height: 150)

                        Circle()
                            .trim(from: 0, to: goal.progress)
                            .stroke(
                                LinearGradient(
                                    colors: [AppTheme.primary, AppTheme.secondary],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                ),
                                style: StrokeStyle(lineWidth: 12, lineCap: .round)
                            )
                            .frame(width: 150, height: 150)
                            .rotationEffect(.degrees(-90))

                        VStack(spacing: 4) {
                            Text("\(Int(goal.progress * 100))%")
                                .font(.title)
                                .fontWeight(.bold)
                                .foregroundColor(AppTheme.primary)
                            Text("Complete")
                                .font(.caption)
                                .foregroundColor(AppTheme.textSecondary)
                        }
                    }

                    HStack(spacing: 24) {
                        VStack(spacing: 4) {
                            Text(goal.currentAmount.currencyFormatted)
                                .font(.headline)
                                .fontWeight(.bold)
                                .foregroundColor(AppTheme.textPrimary)
                            Text("Current")
                                .font(.caption)
                                .foregroundColor(AppTheme.textSecondary)
                        }

                        Rectangle()
                            .fill(AppTheme.cardBorder)
                            .frame(width: 1, height: 40)

                        VStack(spacing: 4) {
                            Text(goal.targetAmount.currencyFormatted)
                                .font(.headline)
                                .fontWeight(.bold)
                                .foregroundColor(AppTheme.textPrimary)
                            Text("Target")
                                .font(.caption)
                                .foregroundColor(AppTheme.textSecondary)
                        }
                    }

                    // Timeline
                    HStack {
                        Image(systemName: "calendar")
                            .foregroundColor(AppTheme.primary)
                        Text("Target: \(goal.targetDate.formatted(date: .abbreviated, time: .omitted))")
                            .font(.subheadline)
                            .foregroundColor(AppTheme.textSecondary)
                        Text("• \(goal.timeRemaining)")
                            .font(.subheadline)
                            .foregroundColor(AppTheme.textSecondary)
                    }
                }
                .padding()
                .glassCardStyle(cornerRadius: AppTheme.CornerRadius.xLarge)
                .padding(.horizontal)

                // Monthly SIP
                if let sip = goal.monthlySIP {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("MONTHLY SIP")
                            .font(.caption)
                            .fontWeight(.semibold)
                            .foregroundColor(AppTheme.primary)
                            .tracking(1)

                        HStack {
                            Text(sip.currencyFormatted)
                                .font(.title2)
                                .fontWeight(.bold)
                                .foregroundColor(AppTheme.textPrimary)

                            Spacer()

                            Button(action: {}) {
                                Text("Modify")
                                    .font(.subheadline)
                                    .fontWeight(.semibold)
                                    .foregroundColor(AppTheme.primary)
                            }
                        }
                    }
                    .padding()
                    .background(AppTheme.blueGlassGradient)
                    .cornerRadius(16)
                    .padding(.horizontal)
                }

                // Linked Funds
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        Text("LINKED INVESTMENTS")
                            .font(.caption)
                            .fontWeight(.semibold)
                            .foregroundColor(AppTheme.primary)
                            .tracking(1)

                        Spacer()

                        Button(action: {}) {
                            Text("Add Fund")
                                .font(.caption)
                                .foregroundColor(AppTheme.primary)
                        }
                    }

                    if goal.linkedFunds.isEmpty {
                        Text("No funds linked to this goal yet")
                            .font(.subheadline)
                            .foregroundColor(AppTheme.textSecondary)
                            .frame(maxWidth: .infinity, alignment: .center)
                            .padding()
                    } else {
                        ForEach(goal.linkedFunds, id: \.self) { fundCode in
                            LinkedFundRow(fundCode: fundCode)
                        }
                    }
                }
                .padding()
                .glassCardStyle(cornerRadius: AppTheme.CornerRadius.large)
                .padding(.horizontal)

                // Actions
                VStack(spacing: 12) {
                    Button(action: {}) {
                        HStack {
                            Image(systemName: "plus")
                            Text("Add Investment")
                        }
                        .fontWeight(.semibold)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(AppTheme.primaryGradient)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                    }

                    Button(action: { showEditGoal = true }) {
                        HStack {
                            Image(systemName: "pencil")
                            Text("Edit Goal")
                        }
                        .fontWeight(.semibold)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .glassCardStyle(cornerRadius: AppTheme.CornerRadius.medium)
                        .foregroundColor(AppTheme.textPrimary)
                    }
                }
                .padding(.horizontal)

                Spacer(minLength: 40)
            }
            .padding(.top)
        }
        .background(AppTheme.background)
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showEditGoal) {
            EditGoalView(goal: goal)
        }
    }
}

struct LinkedFundRow: View {
    let fundCode: String

    var body: some View {
        HStack(spacing: 12) {
            RoundedRectangle(cornerRadius: 8)
                .fill(AppTheme.primary.opacity(0.1))
                .frame(width: 40, height: 40)
                .overlay(
                    Text("PP")
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(AppTheme.primary)
                )

            VStack(alignment: .leading, spacing: 2) {
                Text("Parag Parikh Flexi Cap")
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(AppTheme.textPrimary)
                Text("Flexi Cap")
                    .font(.caption)
                    .foregroundColor(AppTheme.textSecondary)
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 2) {
                Text("+18.7%")
                    .font(.subheadline)
                    .fontWeight(.bold)
                    .foregroundColor(AppTheme.success)
                Text("3Y")
                    .font(.caption)
                    .foregroundColor(AppTheme.textSecondary)
            }
        }
        .padding()
        .listItemCardStyle(cornerRadius: AppTheme.CornerRadius.medium)
    }
}

struct EditGoalView: View {
    let goal: Goal
    @Environment(\.dismiss) var dismiss

    var body: some View {
        NavigationStack {
            VStack {
                Text("Edit Goal")
                // Form fields would go here
                Spacer()
            }
            .navigationTitle("Edit Goal")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") { dismiss() }
                }
            }
        }
    }
}

#Preview {
    NavigationStack {
        GoalDetailView(goal: Goal(
            id: "1",
            name: "Home Down Payment",
            icon: "house.fill",
            targetAmount: 500000,
            currentAmount: 310000,
            targetDate: Date().addingTimeInterval(86400 * 365 * 2),
            category: .home,
            linkedFunds: ["119598"],
            monthlySIP: 12500,
            createdAt: Date()
        ))
        .environmentObject(GoalsStore())
    }
}
