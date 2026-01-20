//
//  CreateGoalView.swift
//  SparrowInvest
//
//  Create new investment goal flow
//

import SwiftUI

struct CreateGoalView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.colorScheme) private var colorScheme
    @EnvironmentObject var goalsStore: GoalsStore

    @State private var selectedCategory: GoalCategory = .wealth
    @State private var goalName: String = ""
    @State private var targetAmount: String = ""
    @State private var targetYears: Int = 5
    @State private var monthlySIP: String = ""
    @State private var currentStep: Int = 1

    private let maxSteps = 3

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Progress indicator
                GoalProgressIndicator(currentStep: currentStep, totalSteps: maxSteps)
                    .padding(.horizontal)
                    .padding(.top, 8)

                ScrollView {
                    VStack(spacing: AppTheme.Spacing.xLarge) {
                        switch currentStep {
                        case 1:
                            CategorySelectionStep(selectedCategory: $selectedCategory)
                        case 2:
                            GoalDetailsStep(
                                goalName: $goalName,
                                targetAmount: $targetAmount,
                                targetYears: $targetYears,
                                selectedCategory: selectedCategory
                            )
                        case 3:
                            SIPSetupStep(
                                monthlySIP: $monthlySIP,
                                targetAmount: Double(targetAmount) ?? selectedCategory.defaultTarget,
                                targetYears: targetYears
                            )
                        default:
                            EmptyView()
                        }
                    }
                    .padding(AppTheme.Spacing.medium)
                }

                // Bottom Action Button
                VStack(spacing: 12) {
                    Button {
                        handleNextAction()
                    } label: {
                        Text(currentStep == maxSteps ? "Create Goal" : "Continue")
                            .font(.system(size: 16, weight: .medium))
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(
                                LinearGradient(
                                    colors: [.blue, .cyan],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                ),
                                in: RoundedRectangle(cornerRadius: 14, style: .continuous)
                            )
                    }
                    .disabled(!canProceed)
                    .opacity(canProceed ? 1 : 0.6)

                    if currentStep > 1 {
                        Button {
                            withAnimation(.spring(response: 0.3)) {
                                currentStep -= 1
                            }
                        } label: {
                            Text("Back")
                                .font(.system(size: 14, weight: .medium))
                                .foregroundColor(.secondary)
                        }
                    }
                }
                .padding(AppTheme.Spacing.medium)
                .background(
                    Rectangle()
                        .fill(colorScheme == .dark ? Color.black.opacity(0.3) : Color.white)
                        .shadow(color: .black.opacity(0.05), radius: 10, x: 0, y: -5)
                        .ignoresSafeArea()
                )
            }
            .background(Color(uiColor: .systemGroupedBackground))
            .navigationTitle("Create Goal")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }

    private var canProceed: Bool {
        switch currentStep {
        case 1:
            return true
        case 2:
            return !goalName.isEmpty && !targetAmount.isEmpty && (Double(targetAmount) ?? 0) > 0
        case 3:
            return true
        default:
            return true
        }
    }

    private func handleNextAction() {
        if currentStep < maxSteps {
            withAnimation(.spring(response: 0.3)) {
                currentStep += 1
            }
        } else {
            createGoal()
        }
    }

    private func createGoal() {
        let target = Double(targetAmount) ?? selectedCategory.defaultTarget
        let sip = Double(monthlySIP)

        let goal = Goal(
            id: UUID().uuidString,
            name: goalName.isEmpty ? selectedCategory.rawValue : goalName,
            icon: selectedCategory.icon,
            targetAmount: target,
            currentAmount: 0,
            targetDate: Calendar.current.date(byAdding: .year, value: targetYears, to: Date()) ?? Date(),
            category: selectedCategory,
            linkedFunds: [],
            monthlySIP: sip,
            createdAt: Date()
        )

        goalsStore.addGoal(goal)
        dismiss()
    }
}

// MARK: - Progress Indicator

struct GoalProgressIndicator: View {
    let currentStep: Int
    let totalSteps: Int

    var body: some View {
        HStack(spacing: 8) {
            ForEach(1...totalSteps, id: \.self) { step in
                if step < currentStep {
                    // Completed step
                    Circle()
                        .fill(Color.green)
                        .frame(width: 24, height: 24)
                        .overlay(
                            Image(systemName: "checkmark")
                                .font(.system(size: 12, weight: .bold))
                                .foregroundColor(.white)
                        )
                } else if step == currentStep {
                    // Current step
                    Circle()
                        .fill(Color.blue)
                        .frame(width: 24, height: 24)
                        .overlay(
                            Text("\(step)")
                                .font(.system(size: 12, weight: .bold))
                                .foregroundColor(.white)
                        )
                } else {
                    // Future step
                    Circle()
                        .stroke(Color(uiColor: .tertiaryLabel), lineWidth: 1.5)
                        .frame(width: 24, height: 24)
                        .overlay(
                            Text("\(step)")
                                .font(.system(size: 12, weight: .medium))
                                .foregroundColor(.secondary)
                        )
                }

                if step < totalSteps {
                    Rectangle()
                        .fill(step < currentStep ? Color.green : Color(uiColor: .tertiaryLabel))
                        .frame(height: 2)
                }
            }
        }
        .padding(.vertical, 16)
    }
}

// MARK: - Step 1: Category Selection

struct CategorySelectionStep: View {
    @Binding var selectedCategory: GoalCategory
    @Environment(\.colorScheme) private var colorScheme

    let columns = [
        GridItem(.flexible()),
        GridItem(.flexible()),
        GridItem(.flexible())
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.medium) {
            Text("What are you saving for?")
                .font(.system(size: 22, weight: .regular))
                .foregroundColor(.primary)

            Text("Choose a goal category to get started")
                .font(.system(size: 14, weight: .regular))
                .foregroundColor(.secondary)

            LazyVGrid(columns: columns, spacing: 12) {
                ForEach(GoalCategory.allCases, id: \.self) { category in
                    GoalCategoryCard(
                        category: category,
                        isSelected: selectedCategory == category,
                        onTap: { selectedCategory = category }
                    )
                }
            }
            .padding(.top, 8)
        }
    }
}

struct GoalCategoryCard: View {
    let category: GoalCategory
    let isSelected: Bool
    let onTap: () -> Void
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        Button(action: onTap) {
            VStack(spacing: 10) {
                ZStack {
                    RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
                        .fill(category.color.opacity(isSelected ? 0.2 : 0.1))
                        .frame(width: 48, height: 48)

                    Image(systemName: category.icon)
                        .font(.system(size: 20))
                        .foregroundColor(category.color)
                }

                Text(category.rawValue)
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(.primary)
                    .multilineTextAlignment(.center)
                    .lineLimit(2)
                    .minimumScaleFactor(0.8)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(cardBackground)
            .overlay(cardBorder)
        }
        .buttonStyle(.plain)
    }

    @ViewBuilder
    private var cardBackground: some View {
        if isSelected {
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
                .fill(category.color.opacity(colorScheme == .dark ? 0.15 : 0.08))
        } else if colorScheme == .dark {
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
                .fill(Color.white.opacity(0.06))
        } else {
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
                .fill(Color.white)
        }
    }

    private var cardBorder: some View {
        RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
            .stroke(
                isSelected
                    ? category.color
                    : (colorScheme == .dark ? Color.white.opacity(0.1) : Color.black.opacity(0.08)),
                lineWidth: isSelected ? 2 : 1
            )
    }
}

// MARK: - Step 2: Goal Details

struct GoalDetailsStep: View {
    @Binding var goalName: String
    @Binding var targetAmount: String
    @Binding var targetYears: Int
    let selectedCategory: GoalCategory
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.large) {
            // Category Preview
            HStack(spacing: 12) {
                ZStack {
                    RoundedRectangle(cornerRadius: AppTheme.CornerRadius.small, style: .continuous)
                        .fill(selectedCategory.color.opacity(0.15))
                        .frame(width: 44, height: 44)

                    Image(systemName: selectedCategory.icon)
                        .font(.system(size: 20))
                        .foregroundColor(selectedCategory.color)
                }

                VStack(alignment: .leading, spacing: 2) {
                    Text(selectedCategory.rawValue)
                        .font(.system(size: 16, weight: .regular))
                        .foregroundColor(.primary)
                    Text("Configure your goal")
                        .font(.system(size: 13, weight: .regular))
                        .foregroundColor(.secondary)
                }

                Spacer()
            }
            .padding(AppTheme.Spacing.medium)
            .background(sectionBackground)
            .overlay(sectionBorder)

            // Goal Name
            VStack(alignment: .leading, spacing: 8) {
                Text("GOAL NAME")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(.blue)
                    .tracking(1)

                TextField("e.g., Retirement Fund", text: $goalName)
                    .font(.system(size: 16))
                    .padding(AppTheme.Spacing.medium)
                    .background(inputBackground)
                    .overlay(inputBorder)
            }

            // Target Amount
            VStack(alignment: .leading, spacing: 8) {
                Text("TARGET AMOUNT")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(.blue)
                    .tracking(1)

                HStack {
                    Text("₹")
                        .font(.system(size: 18, weight: .medium))
                        .foregroundColor(.secondary)

                    TextField("0", text: $targetAmount)
                        .font(.system(size: 24, weight: .light, design: .rounded))
                        .keyboardType(.numberPad)
                }
                .padding(AppTheme.Spacing.medium)
                .background(inputBackground)
                .overlay(inputBorder)

                // Quick amount buttons
                HStack(spacing: 8) {
                    ForEach(["5L", "10L", "25L", "50L", "1Cr"], id: \.self) { label in
                        Button {
                            targetAmount = amountFromLabel(label)
                        } label: {
                            Text(label)
                                .font(.system(size: 12, weight: .medium))
                                .foregroundColor(targetAmount == amountFromLabel(label) ? .white : .blue)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 6)
                                .background(
                                    targetAmount == amountFromLabel(label)
                                        ? Color.blue
                                        : Color.blue.opacity(colorScheme == .dark ? 0.15 : 0.1),
                                    in: Capsule()
                                )
                        }
                    }
                }
            }

            // Target Years
            VStack(alignment: .leading, spacing: 8) {
                Text("TIMELINE")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(.blue)
                    .tracking(1)

                VStack(spacing: 12) {
                    HStack {
                        Text("\(targetYears) years")
                            .font(.system(size: 20, weight: .light, design: .rounded))
                            .foregroundColor(.primary)

                        Spacer()

                        Text(targetDateFormatted)
                            .font(.system(size: 14, weight: .regular))
                            .foregroundColor(.secondary)
                    }

                    Slider(value: Binding(
                        get: { Double(targetYears) },
                        set: { targetYears = Int($0) }
                    ), in: 1...30, step: 1)
                    .tint(.blue)
                }
                .padding(AppTheme.Spacing.medium)
                .background(inputBackground)
                .overlay(inputBorder)
            }
        }
    }

    private var targetDateFormatted: String {
        let date = Calendar.current.date(byAdding: .year, value: targetYears, to: Date()) ?? Date()
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM yyyy"
        return formatter.string(from: date)
    }

    private func amountFromLabel(_ label: String) -> String {
        switch label {
        case "5L": return "500000"
        case "10L": return "1000000"
        case "25L": return "2500000"
        case "50L": return "5000000"
        case "1Cr": return "10000000"
        default: return ""
        }
    }

    @ViewBuilder
    private var sectionBackground: some View {
        if colorScheme == .dark {
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
                .fill(Color.black.opacity(0.4))
                .background(
                    RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
                        .fill(.ultraThinMaterial)
                )
        } else {
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
                .fill(Color.white)
        }
    }

    private var sectionBorder: some View {
        RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
            .stroke(colorScheme == .dark ? Color.white.opacity(0.1) : Color.black.opacity(0.08), lineWidth: 1)
    }

    @ViewBuilder
    private var inputBackground: some View {
        if colorScheme == .dark {
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
                .fill(Color.white.opacity(0.06))
        } else {
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
                .fill(Color.white)
        }
    }

    private var inputBorder: some View {
        RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
            .stroke(colorScheme == .dark ? Color.white.opacity(0.1) : Color.black.opacity(0.08), lineWidth: 1)
    }
}

// MARK: - Step 3: SIP Setup

struct SIPSetupStep: View {
    @Binding var monthlySIP: String
    let targetAmount: Double
    let targetYears: Int
    @Environment(\.colorScheme) private var colorScheme

    private var suggestedSIP: Double {
        // Simple calculation assuming 12% annual return
        let monthlyRate = 0.12 / 12
        let months = Double(targetYears * 12)
        let factor = (pow(1 + monthlyRate, months) - 1) / monthlyRate
        return targetAmount / factor
    }

    var body: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.large) {
            // Summary Card
            VStack(spacing: 16) {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("TARGET")
                            .font(.system(size: 11, weight: .medium))
                            .foregroundColor(.secondary)
                        Text(targetAmount.compactCurrencyFormatted)
                            .font(.system(size: 20, weight: .light, design: .rounded))
                            .foregroundColor(.primary)
                    }

                    Spacer()

                    VStack(alignment: .trailing, spacing: 4) {
                        Text("TIMELINE")
                            .font(.system(size: 11, weight: .medium))
                            .foregroundColor(.secondary)
                        Text("\(targetYears) years")
                            .font(.system(size: 20, weight: .light, design: .rounded))
                            .foregroundColor(.primary)
                    }
                }

                Divider()

                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("SUGGESTED MONTHLY SIP")
                            .font(.system(size: 11, weight: .medium))
                            .foregroundColor(.secondary)
                        Text(suggestedSIP.currencyFormatted)
                            .font(.system(size: 22, weight: .light, design: .rounded))
                            .foregroundColor(.blue)
                    }

                    Spacer()

                    Button {
                        monthlySIP = String(Int(suggestedSIP))
                    } label: {
                        Text("Use this")
                            .font(.system(size: 12, weight: .medium))
                            .foregroundColor(.white)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 8)
                            .background(Color.blue, in: Capsule())
                    }
                }
            }
            .padding(AppTheme.Spacing.medium)
            .background(summaryBackground)
            .overlay(summaryBorder)

            // Custom SIP Amount
            VStack(alignment: .leading, spacing: 8) {
                Text("OR SET YOUR OWN SIP")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(.blue)
                    .tracking(1)

                HStack {
                    Text("₹")
                        .font(.system(size: 18, weight: .medium))
                        .foregroundColor(.secondary)

                    TextField("Monthly SIP amount", text: $monthlySIP)
                        .font(.system(size: 20, weight: .light, design: .rounded))
                        .keyboardType(.numberPad)

                    Text("/month")
                        .font(.system(size: 14, weight: .regular))
                        .foregroundColor(.secondary)
                }
                .padding(AppTheme.Spacing.medium)
                .background(inputBackground)
                .overlay(inputBorder)
            }

            // Info card
            HStack(spacing: 12) {
                Image(systemName: "info.circle.fill")
                    .font(.system(size: 20))
                    .foregroundColor(.blue)

                Text("You can start a SIP later or modify this amount anytime from your goal dashboard.")
                    .font(.system(size: 13, weight: .regular))
                    .foregroundColor(.secondary)
            }
            .padding(AppTheme.Spacing.medium)
            .background(
                Color.blue.opacity(colorScheme == .dark ? 0.1 : 0.05),
                in: RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
            )
        }
    }

    @ViewBuilder
    private var summaryBackground: some View {
        if colorScheme == .dark {
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.large, style: .continuous)
                .fill(Color.black.opacity(0.4))
                .background(
                    RoundedRectangle(cornerRadius: AppTheme.CornerRadius.large, style: .continuous)
                        .fill(.ultraThinMaterial)
                )
        } else {
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.large, style: .continuous)
                .fill(Color.white)
        }
    }

    private var summaryBorder: some View {
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
    private var inputBackground: some View {
        if colorScheme == .dark {
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
                .fill(Color.white.opacity(0.06))
        } else {
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
                .fill(Color.white)
        }
    }

    private var inputBorder: some View {
        RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
            .stroke(colorScheme == .dark ? Color.white.opacity(0.1) : Color.black.opacity(0.08), lineWidth: 1)
    }
}

#Preview {
    CreateGoalView()
        .environmentObject(GoalsStore())
}
