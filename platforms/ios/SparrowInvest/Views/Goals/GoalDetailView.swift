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
                        .font(.system(size: 18, weight: .regular))
                        .foregroundColor(.primary)

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
                                .font(.system(size: 28, weight: .light, design: .rounded))
                                .foregroundColor(.blue)
                            Text("Complete")
                                .font(.system(size: 12, weight: .regular))
                                .foregroundColor(.secondary)
                        }
                    }

                    HStack(spacing: 24) {
                        VStack(spacing: 4) {
                            Text(goal.currentAmount.currencyFormatted)
                                .font(.system(size: 16, weight: .light, design: .rounded))
                                .foregroundColor(.primary)
                            Text("Current")
                                .font(.system(size: 12, weight: .regular))
                                .foregroundColor(.secondary)
                        }

                        Rectangle()
                            .fill(Color(uiColor: .separator))
                            .frame(width: 1, height: 40)

                        VStack(spacing: 4) {
                            Text(goal.targetAmount.currencyFormatted)
                                .font(.system(size: 16, weight: .light, design: .rounded))
                                .foregroundColor(.primary)
                            Text("Target")
                                .font(.system(size: 12, weight: .regular))
                                .foregroundColor(.secondary)
                        }
                    }

                    // Timeline
                    HStack {
                        Image(systemName: "calendar")
                            .font(.system(size: 14))
                            .foregroundColor(.blue)
                        Text("Target: \(goal.targetDate.formatted(date: .abbreviated, time: .omitted))")
                            .font(.system(size: 13, weight: .regular))
                            .foregroundColor(.secondary)
                        Text("• \(goal.timeRemaining)")
                            .font(.system(size: 13, weight: .regular))
                            .foregroundColor(.secondary)
                    }
                }
                .padding()
                .glassCardStyle(cornerRadius: AppTheme.CornerRadius.xLarge)
                .padding(.horizontal)

                // Monthly SIP
                if let sip = goal.monthlySIP {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("MONTHLY SIP")
                            .font(.system(size: 11, weight: .medium))
                            .foregroundColor(.blue)
                            .tracking(1)

                        HStack {
                            Text(sip.currencyFormatted)
                                .font(.system(size: 22, weight: .light, design: .rounded))
                                .foregroundColor(.primary)

                            Spacer()

                            Button(action: {}) {
                                Text("Modify")
                                    .font(.system(size: 13, weight: .medium))
                                    .foregroundColor(.blue)
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
                            .font(.system(size: 11, weight: .medium))
                            .foregroundColor(.blue)
                            .tracking(1)

                        Spacer()

                        Button(action: {}) {
                            Text("Add Fund")
                                .font(.system(size: 12, weight: .regular))
                                .foregroundColor(.blue)
                        }
                    }

                    if goal.linkedFunds.isEmpty {
                        Text("No funds linked to this goal yet")
                            .font(.system(size: 14, weight: .light))
                            .foregroundColor(.secondary)
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
                        .font(.system(size: 15, weight: .medium))
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
                        .font(.system(size: 15, weight: .medium))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .glassCardStyle(cornerRadius: AppTheme.CornerRadius.medium)
                        .foregroundColor(.primary)
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
                .fill(Color.blue.opacity(0.1))
                .frame(width: 40, height: 40)
                .overlay(
                    Text("PP")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(.blue)
                )

            VStack(alignment: .leading, spacing: 2) {
                Text("Parag Parikh Flexi Cap")
                    .font(.system(size: 14, weight: .light))
                    .foregroundColor(.primary)
                Text("Flexi Cap")
                    .font(.system(size: 12, weight: .regular))
                    .foregroundColor(.secondary)
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 2) {
                Text("+18.7%")
                    .font(.system(size: 14, weight: .light, design: .rounded))
                    .foregroundColor(.green)
                Text("3Y")
                    .font(.system(size: 12, weight: .regular))
                    .foregroundColor(.secondary)
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
                    .font(.system(size: 16, weight: .regular))
                // Form fields would go here
                Spacer()
            }
            .navigationTitle("Edit Goal")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                        .font(.system(size: 15, weight: .regular))
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") { dismiss() }
                        .font(.system(size: 15, weight: .medium))
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
