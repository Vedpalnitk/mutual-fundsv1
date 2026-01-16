import SwiftUI

struct GoalsView: View {
    @EnvironmentObject var goalsStore: GoalsStore
    @State private var showCreateGoal = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    if goalsStore.goals.isEmpty {
                        EmptyGoalsView(onCreateTapped: { showCreateGoal = true })
                    } else {
                        ForEach(goalsStore.goals) { goal in
                            NavigationLink(destination: GoalDetailView(goal: goal)) {
                                GoalCard(goal: goal)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
                .padding()
            }
            .background(AppTheme.background)
            .navigationTitle("Goals")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showCreateGoal = true }) {
                        Image(systemName: "plus.circle.fill")
                            .foregroundColor(AppTheme.primary)
                    }
                }
            }
            .sheet(isPresented: $showCreateGoal) {
                CreateGoalView()
            }
        }
    }
}

// MARK: - Empty State
struct EmptyGoalsView: View {
    let onCreateTapped: () -> Void

    var body: some View {
        VStack(spacing: 20) {
            Spacer()

            Image(systemName: "target")
                .font(.system(size: 60))
                .foregroundColor(AppTheme.primary.opacity(0.5))

            Text("No goals yet")
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(AppTheme.textPrimary)

            Text("Create your first investment goal\nand start building your wealth")
                .font(.subheadline)
                .foregroundColor(AppTheme.textSecondary)
                .multilineTextAlignment(.center)

            Button(action: onCreateTapped) {
                HStack {
                    Image(systemName: "plus")
                    Text("Create Goal")
                }
                .fontWeight(.semibold)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .background(AppTheme.primary)
                .foregroundColor(.white)
                .cornerRadius(12)
            }
            .padding(.horizontal, 40)

            Spacer()
        }
        .frame(minHeight: 400)
    }
}

// MARK: - Goal Card
struct GoalCard: View {
    let goal: Goal

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(goal.icon)
                    .font(.title2)

                VStack(alignment: .leading, spacing: 2) {
                    Text(goal.name)
                        .font(.headline)
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
                        .frame(height: 8)

                    RoundedRectangle(cornerRadius: 4)
                        .fill(
                            LinearGradient(
                                colors: [AppTheme.primary, AppTheme.secondary],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .frame(width: geometry.size.width * goal.progress, height: 8)
                }
            }
            .frame(height: 8)

            HStack {
                Text(goal.currentAmount.currencyFormatted)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(AppTheme.textPrimary)
                Text("of \(goal.targetAmount.currencyFormatted)")
                    .font(.subheadline)
                    .foregroundColor(AppTheme.textSecondary)
                Spacer()
            }
        }
        .padding()
        .background(AppTheme.cardBackground)
        .cornerRadius(16)
        .shadow(color: AppTheme.shadowColor, radius: 8, x: 0, y: 4)
    }
}

#Preview {
    GoalsView()
        .environmentObject(GoalsStore())
}
