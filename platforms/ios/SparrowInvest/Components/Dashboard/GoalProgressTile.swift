//
//  GoalProgressTile.swift
//  SparrowInvest
//
//  iOS 26 Liquid Glass Goal Progress Tile
//

import SwiftUI

struct GoalProgressTile: View {
    let goals: [Goal]
    var onTapGoal: ((Goal) -> Void)?
    @Environment(\.colorScheme) private var colorScheme
    @State private var isExpanded: Bool = true

    private var displayGoals: [Goal] {
        Array(goals.sorted { $0.progress > $1.progress }.prefix(2))
    }

    private var totalGoals: Int {
        goals.count
    }

    private var averageProgress: Int {
        guard !goals.isEmpty else { return 0 }
        let totalProgress = goals.reduce(0.0) { $0 + $1.progress }
        return Int((totalProgress / Double(goals.count)) * 100)
    }

    private var totalTargetAmount: Double {
        goals.reduce(0.0) { $0 + $1.targetAmount }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.medium) {
            // Header
            HStack {
                Text("Goal Progress")
                    .font(.system(size: 16, weight: .regular))
                    .foregroundColor(.primary)

                Spacer()

                NavigationLink(destination: GoalsView()) {
                    HStack(spacing: 4) {
                        Text("View All")
                            .font(.system(size: 13, weight: .light))
                        Image(systemName: "chevron.right")
                            .font(.system(size: 11, weight: .regular))
                    }
                    .foregroundColor(.blue)
                }
            }

            // Stats Grid with expand/collapse
            VStack(spacing: 0) {
                HStack(spacing: 0) {
                    // Total Goals
                    VStack(spacing: 4) {
                        HStack(spacing: 6) {
                            Image(systemName: "target")
                                .font(.system(size: 14))
                                .foregroundColor(.blue)
                            Text("Goals")
                                .font(.system(size: 12, weight: .light))
                                .foregroundColor(.secondary)
                        }
                        Text("\(totalGoals)")
                            .font(.system(size: 22, weight: .light, design: .rounded))
                            .foregroundColor(.primary)
                    }
                    .frame(maxWidth: .infinity)

                    Divider()
                        .frame(height: 44)

                    // Average Progress
                    VStack(spacing: 4) {
                        HStack(spacing: 6) {
                            Image(systemName: "chart.bar.fill")
                                .font(.system(size: 14))
                                .foregroundColor(.green)
                            Text("Progress")
                                .font(.system(size: 12, weight: .light))
                                .foregroundColor(.secondary)
                        }
                        Text("\(averageProgress)%")
                            .font(.system(size: 22, weight: .light, design: .rounded))
                            .foregroundColor(.primary)
                    }
                    .frame(maxWidth: .infinity)

                    Divider()
                        .frame(height: 44)

                    // Total Target
                    VStack(spacing: 4) {
                        HStack(spacing: 6) {
                            Image(systemName: "indianrupeesign.circle.fill")
                                .font(.system(size: 14))
                                .foregroundColor(.orange)
                            Text("Target")
                                .font(.system(size: 12, weight: .light))
                                .foregroundColor(.secondary)
                        }
                        Text(totalTargetAmount.compactCurrencyFormatted)
                            .font(.system(size: 16, weight: .light, design: .rounded))
                            .foregroundColor(.primary)
                    }
                    .frame(maxWidth: .infinity)
                }

                // Expand/Collapse toggle - minimal chevron
                if !goals.isEmpty {
                    Button {
                        withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) {
                            isExpanded.toggle()
                        }
                    } label: {
                        Image(systemName: "chevron.compact.down")
                            .font(.system(size: 16, weight: .medium))
                            .foregroundColor(Color(uiColor: .tertiaryLabel))
                            .rotationEffect(.degrees(isExpanded ? 180 : 0))
                            .frame(maxWidth: .infinity)
                            .padding(.top, 10)
                            .contentShape(Rectangle())
                    }
                }
            }

            // Goals List (collapsible)
            if isExpanded {
                if goals.isEmpty {
                    VStack(spacing: 12) {
                        Image(systemName: "target")
                            .font(.system(size: 32))
                            .foregroundColor(Color(uiColor: .tertiaryLabel))
                        Text("No goals set yet")
                            .font(.system(size: 14, weight: .light))
                            .foregroundColor(.secondary)
                        Button {
                            // Create goal action
                        } label: {
                            Text("Create Your First Goal")
                                .font(.system(size: 13, weight: .regular))
                                .foregroundColor(.white)
                                .padding(.horizontal, 20)
                                .padding(.vertical, 10)
                                .background(
                                    Capsule()
                                        .fill(
                                            LinearGradient(
                                                colors: [.blue, .cyan],
                                                startPoint: .leading,
                                                endPoint: .trailing
                                            )
                                        )
                                )
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 20)
                    .transition(.opacity.combined(with: .move(edge: .top)))
                } else {
                    VStack(spacing: AppTheme.Spacing.compact) {
                        ForEach(displayGoals) { goal in
                            GoalProgressRow(goal: goal)
                                .onTapGesture {
                                    onTapGoal?(goal)
                                }
                        }
                    }
                    .transition(.opacity.combined(with: .move(edge: .top)))
                }
            }
        }
        .padding(AppTheme.Spacing.medium)
        .background(cardBackground)
        .overlay(cardBorder)
        .shadow(color: cardShadow, radius: 12, x: 0, y: 4)
    }

    private var cardShadow: Color {
        colorScheme == .dark ? .clear : .black.opacity(0.08)
    }

    @ViewBuilder
    private var cardBackground: some View {
        if colorScheme == .dark {
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.xLarge, style: .continuous)
                .fill(Color.black.opacity(0.4))
                .background(
                    RoundedRectangle(cornerRadius: AppTheme.CornerRadius.xLarge, style: .continuous)
                        .fill(.ultraThinMaterial)
                )
        } else {
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.xLarge, style: .continuous)
                .fill(Color.white)
        }
    }

    private var cardBorder: some View {
        RoundedRectangle(cornerRadius: AppTheme.CornerRadius.xLarge, style: .continuous)
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
                            .init(color: .black.opacity(0.08), location: 0),
                            .init(color: .black.opacity(0.04), location: 0.3),
                            .init(color: .black.opacity(0.02), location: 0.7),
                            .init(color: .black.opacity(0.06), location: 1)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                      ),
                lineWidth: 1
            )
    }
}

struct GoalProgressRow: View {
    let goal: Goal
    @Environment(\.colorScheme) private var colorScheme

    private var progressPercentage: Double {
        goal.progress * 100
    }

    private var progressColor: Color {
        if progressPercentage >= 80 {
            return .green
        } else if progressPercentage >= 50 {
            return .blue
        } else {
            return .orange
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                // Goal Icon
                ZStack {
                    RoundedRectangle(cornerRadius: AppTheme.CornerRadius.small, style: .continuous)
                        .fill(progressColor.opacity(0.15))
                        .frame(width: 36, height: 36)

                    Image(systemName: goal.category.icon)
                        .font(.system(size: 16))
                        .foregroundColor(progressColor)
                }

                VStack(alignment: .leading, spacing: 2) {
                    Text(goal.name)
                        .font(.system(size: 14, weight: .light))
                        .foregroundColor(.primary)

                    Text(goal.timeRemaining)
                        .font(.system(size: 12, weight: .regular))
                        .foregroundColor(.secondary)
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 2) {
                    Text("\(Int(progressPercentage))%")
                        .font(.system(size: 14, weight: .light, design: .rounded))
                        .foregroundColor(progressColor)

                    Text(goal.currentAmount.compactCurrencyFormatted)
                        .font(.system(size: 12, weight: .light))
                        .foregroundColor(.secondary)
                }
            }

            // Progress Bar
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(progressColor.opacity(0.2))
                        .frame(height: 6)

                    RoundedRectangle(cornerRadius: 4)
                        .fill(progressColor)
                        .frame(width: geometry.size.width * goal.progress, height: 6)
                }
            }
            .frame(height: 6)
        }
        .padding(AppTheme.Spacing.compact)
        .background(rowBackground)
        .overlay(rowBorder)
        .shadow(color: colorScheme == .dark ? .clear : .black.opacity(0.04), radius: 8, x: 0, y: 2)
    }

    @ViewBuilder
    private var rowBackground: some View {
        if colorScheme == .dark {
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
                .fill(Color.white.opacity(0.06))
        } else {
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
                .fill(Color.white)
        }
    }

    private var rowBorder: some View {
        RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
            .stroke(
                colorScheme == .dark
                    ? LinearGradient(
                        stops: [
                            .init(color: .white.opacity(0.25), location: 0),
                            .init(color: .white.opacity(0.1), location: 0.3),
                            .init(color: .white.opacity(0.05), location: 0.7),
                            .init(color: .white.opacity(0.15), location: 1)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                      )
                    : LinearGradient(
                        stops: [
                            .init(color: .black.opacity(0.12), location: 0),
                            .init(color: .black.opacity(0.06), location: 0.5),
                            .init(color: .black.opacity(0.10), location: 1)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                      ),
                lineWidth: 1
            )
    }
}

#Preview {
    GoalProgressTile(goals: [])
        .padding()
}
