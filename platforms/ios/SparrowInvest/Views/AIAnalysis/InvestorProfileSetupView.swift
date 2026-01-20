//
//  InvestorProfileSetupView.swift
//  SparrowInvest
//
//  Wizard-style view for creating/editing investor profile
//

import SwiftUI

struct InvestorProfileSetupView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.colorScheme) private var colorScheme
    @Environment(AnalysisProfileStore.self) var analysisStore
    @EnvironmentObject var familyStore: FamilyStore
    @State private var profile: InvestorProfile = InvestorProfile.empty
    @State private var currentStep = 0
    var onComplete: ((InvestorProfile) -> Void)?

    // Optional family member context (when creating profile for a family member)
    var familyMemberId: String?
    var familyMemberName: String?

    private let totalSteps = 4

    init(existingProfile: InvestorProfile? = nil, familyMemberId: String? = nil, familyMemberName: String? = nil, onComplete: ((InvestorProfile) -> Void)? = nil) {
        if let existing = existingProfile {
            self._profile = State(initialValue: existing)
        } else if let memberName = familyMemberName {
            // Pre-fill name with family member's name
            var newProfile = InvestorProfile.empty
            newProfile.name = memberName
            self._profile = State(initialValue: newProfile)
        }
        self.familyMemberId = familyMemberId
        self.familyMemberName = familyMemberName
        self.onComplete = onComplete
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Progress Indicator
                ProgressIndicator(current: currentStep, total: totalSteps)
                    .padding(.horizontal, AppTheme.Spacing.medium)
                    .padding(.top, AppTheme.Spacing.medium)

                ScrollView {
                    VStack(spacing: AppTheme.Spacing.large) {
                        // Step Content
                        switch currentStep {
                        case 0:
                            BasicInfoStep(profile: $profile)
                        case 1:
                            ExperienceStep(profile: $profile)
                        case 2:
                            GoalsStep(profile: $profile)
                        case 3:
                            RiskAssessmentStep(profile: $profile)
                        default:
                            EmptyView()
                        }
                    }
                    .padding(AppTheme.Spacing.medium)
                }

                // Navigation Buttons
                HStack(spacing: AppTheme.Spacing.medium) {
                    if currentStep > 0 {
                        Button {
                            withAnimation { currentStep -= 1 }
                        } label: {
                            Text("Back")
                                .font(.system(size: 16, weight: .regular))
                                .foregroundColor(.primary)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 14)
                                .background(buttonBackground)
                                .overlay(buttonBorder)
                        }
                    }

                    Button {
                        if currentStep < totalSteps - 1 {
                            withAnimation { currentStep += 1 }
                        } else {
                            saveProfile()
                        }
                    } label: {
                        Text(currentStep < totalSteps - 1 ? "Continue" : "Complete")
                            .font(.system(size: 16, weight: .regular))
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .background(
                                LinearGradient(
                                    colors: [.blue, .cyan],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                ),
                                in: RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
                            )
                    }
                    .disabled(!isStepValid)
                    .opacity(isStepValid ? 1 : 0.6)
                }
                .padding(AppTheme.Spacing.medium)
            }
            .background(Color(uiColor: .systemGroupedBackground))
            .navigationTitle(navigationTitle)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }

    private var isStepValid: Bool {
        switch currentStep {
        case 0: return !profile.name.isEmpty && profile.age > 0
        default: return true
        }
    }

    private func saveProfile() {
        profile.updatedAt = Date()

        // Save to appropriate store based on context
        if let memberId = familyMemberId {
            // Save to FamilyStore for family member
            familyStore.setProfile(profile, for: memberId)
        } else {
            // Save to AnalysisProfileStore for individual
            analysisStore.createProfile(profile)
        }

        onComplete?(profile)
        dismiss()
    }

    private var navigationTitle: String {
        if let memberName = familyMemberName {
            return "\(memberName)'s Profile"
        }
        return "Create Profile"
    }

    @ViewBuilder
    private var buttonBackground: some View {
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

    private var buttonBorder: some View {
        RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
            .stroke(
                colorScheme == .dark
                    ? LinearGradient(
                        stops: [
                            .init(color: .white.opacity(0.25), location: 0),
                            .init(color: .white.opacity(0.1), location: 0.5),
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

// MARK: - Progress Indicator

struct ProgressIndicator: View {
    let current: Int
    let total: Int

    var body: some View {
        HStack(spacing: 8) {
            ForEach(0..<total, id: \.self) { index in
                RoundedRectangle(cornerRadius: 2)
                    .fill(index <= current ? Color.blue : Color(uiColor: .tertiarySystemFill))
                    .frame(height: 4)
            }
        }
    }
}

// MARK: - Step 1: Basic Info

struct BasicInfoStep: View {
    @Binding var profile: InvestorProfile
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.large) {
            // Header
            VStack(alignment: .leading, spacing: 8) {
                Text("Let's get to know you")
                    .font(.system(size: 24, weight: .light))
                    .foregroundColor(.primary)

                Text("This helps us personalize your investment analysis")
                    .font(.system(size: 14, weight: .light))
                    .foregroundColor(.secondary)
            }

            // Form Fields
            VStack(spacing: AppTheme.Spacing.medium) {
                // Name Field
                VStack(alignment: .leading, spacing: 6) {
                    Text("YOUR NAME")
                        .font(.system(size: 11, weight: .regular))
                        .foregroundColor(.blue)
                        .tracking(1)

                    TextField("Enter your name", text: $profile.name)
                        .font(.system(size: 16, weight: .light))
                        .padding(AppTheme.Spacing.medium)
                        .background(fieldBackground)
                        .overlay(fieldBorder)
                }

                // Age Field
                VStack(alignment: .leading, spacing: 6) {
                    Text("YOUR AGE")
                        .font(.system(size: 11, weight: .regular))
                        .foregroundColor(.blue)
                        .tracking(1)

                    HStack {
                        Text("\(profile.age) years")
                            .font(.system(size: 16, weight: .light))
                            .foregroundColor(.primary)

                        Spacer()

                        Stepper("", value: $profile.age, in: 18...100)
                            .labelsHidden()
                    }
                    .padding(AppTheme.Spacing.medium)
                    .background(fieldBackground)
                    .overlay(fieldBorder)
                }

                // Annual Income
                VStack(alignment: .leading, spacing: 6) {
                    Text("ANNUAL INCOME")
                        .font(.system(size: 11, weight: .regular))
                        .foregroundColor(.blue)
                        .tracking(1)

                    ForEach(IncomeRange.allCases, id: \.self) { range in
                        SelectableRow(
                            title: range.rawValue,
                            isSelected: profile.monthlyIncome == range
                        ) {
                            profile.monthlyIncome = range
                        }
                    }
                }
            }
        }
    }

    @ViewBuilder
    private var fieldBackground: some View {
        if colorScheme == .dark {
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
                .fill(Color.white.opacity(0.06))
        } else {
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
                .fill(Color.white)
        }
    }

    private var fieldBorder: some View {
        RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
            .stroke(
                colorScheme == .dark
                    ? LinearGradient(
                        stops: [
                            .init(color: .white.opacity(0.25), location: 0),
                            .init(color: .white.opacity(0.1), location: 0.5),
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

// MARK: - Step 2: Experience

struct ExperienceStep: View {
    @Binding var profile: InvestorProfile

    var body: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.large) {
            // Header
            VStack(alignment: .leading, spacing: 8) {
                Text("Investment Experience")
                    .font(.system(size: 24, weight: .light))
                    .foregroundColor(.primary)

                Text("How long have you been investing?")
                    .font(.system(size: 14, weight: .light))
                    .foregroundColor(.secondary)
            }

            // Experience Options
            VStack(spacing: AppTheme.Spacing.compact) {
                ForEach(InvestmentExperience.allCases, id: \.self) { experience in
                    SelectableRow(
                        title: experience.rawValue,
                        subtitle: experience.description,
                        isSelected: profile.investmentExperience == experience
                    ) {
                        profile.investmentExperience = experience
                    }
                }
            }

            // Existing Investments
            VStack(alignment: .leading, spacing: 6) {
                Text("EXISTING INVESTMENTS (OPTIONAL)")
                    .font(.system(size: 11, weight: .regular))
                    .foregroundColor(.blue)
                    .tracking(1)

                Text("₹\(Int(profile.existingInvestments).formatted())")
                    .font(.system(size: 16, weight: .light))
                    .foregroundColor(.primary)

                Slider(value: $profile.existingInvestments, in: 0...10000000, step: 100000)
                    .tint(.blue)

                HStack {
                    Text("₹0")
                        .font(.system(size: 11, weight: .light))
                        .foregroundColor(.secondary)
                    Spacer()
                    Text("₹1 Cr")
                        .font(.system(size: 11, weight: .light))
                        .foregroundColor(.secondary)
                }
            }
            .padding(AppTheme.Spacing.medium)
            .listItemCardStyle()
        }
    }
}

// MARK: - Step 3: Goals

struct GoalsStep: View {
    @Binding var profile: InvestorProfile

    var body: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.large) {
            // Header
            VStack(alignment: .leading, spacing: 8) {
                Text("Investment Goals")
                    .font(.system(size: 24, weight: .light))
                    .foregroundColor(.primary)

                Text("What are you investing for?")
                    .font(.system(size: 14, weight: .light))
                    .foregroundColor(.secondary)
            }

            // Goal Options
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: AppTheme.Spacing.compact) {
                ForEach(InvestmentGoal.allCases, id: \.self) { goal in
                    ProfileGoalCard(
                        goal: goal,
                        isSelected: profile.investmentGoal == goal
                    ) {
                        profile.investmentGoal = goal
                    }
                }
            }

            // Investment Horizon
            VStack(alignment: .leading, spacing: AppTheme.Spacing.compact) {
                Text("INVESTMENT HORIZON")
                    .font(.system(size: 11, weight: .regular))
                    .foregroundColor(.blue)
                    .tracking(1)

                ForEach(InvestmentHorizon.allCases, id: \.self) { horizon in
                    SelectableRow(
                        title: horizon.rawValue,
                        subtitle: horizon.description,
                        isSelected: profile.investmentHorizon == horizon
                    ) {
                        profile.investmentHorizon = horizon
                    }
                }
            }
        }
    }
}

struct ProfileGoalCard: View {
    let goal: InvestmentGoal
    let isSelected: Bool
    let action: () -> Void
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                ZStack {
                    Circle()
                        .fill(isSelected ? Color.blue : Color.blue.opacity(0.1))
                        .frame(width: 44, height: 44)

                    Image(systemName: goal.icon)
                        .font(.system(size: 18, weight: .light))
                        .foregroundColor(isSelected ? .white : .blue)
                }

                Text(goal.rawValue)
                    .font(.system(size: 12, weight: .regular))
                    .foregroundColor(.primary)
                    .multilineTextAlignment(.center)
                    .lineLimit(2)
            }
            .frame(maxWidth: .infinity)
            .padding(AppTheme.Spacing.medium)
            .background(cardBackground)
            .overlay(cardBorder)
        }
        .buttonStyle(.plain)
    }

    @ViewBuilder
    private var cardBackground: some View {
        if colorScheme == .dark {
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
                .fill(isSelected ? Color.blue.opacity(0.15) : Color.white.opacity(0.06))
        } else {
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
                .fill(isSelected ? Color.blue.opacity(0.1) : Color.white)
        }
    }

    private var cardBorder: some View {
        RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
            .stroke(isSelected ? Color.blue : Color.clear, lineWidth: 2)
    }
}

// MARK: - Step 4: Risk Assessment

struct RiskAssessmentStep: View {
    @Binding var profile: InvestorProfile

    var body: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.large) {
            // Header
            VStack(alignment: .leading, spacing: 8) {
                Text("Risk Tolerance")
                    .font(.system(size: 24, weight: .light))
                    .foregroundColor(.primary)

                Text("How comfortable are you with market volatility?")
                    .font(.system(size: 14, weight: .light))
                    .foregroundColor(.secondary)
            }

            // Risk Options
            VStack(spacing: AppTheme.Spacing.compact) {
                ForEach(RiskTolerance.allCases, id: \.self) { tolerance in
                    SelectableRow(
                        title: tolerance.rawValue,
                        subtitle: tolerance.description,
                        isSelected: profile.riskTolerance == tolerance
                    ) {
                        profile.riskTolerance = tolerance
                    }
                }
            }

            // Risk Profile Preview
            RiskProfilePreview(profile: profile)
        }
    }
}

struct RiskProfilePreview: View {
    let profile: InvestorProfile
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.medium) {
            HStack(spacing: 4) {
                Image(systemName: "sparkles")
                    .font(.system(size: 12, weight: .light))
                    .foregroundColor(.blue)
                Text("YOUR RISK PROFILE")
                    .font(.system(size: 11, weight: .regular))
                    .foregroundColor(.blue)
                    .tracking(1)
            }

            HStack(spacing: AppTheme.Spacing.medium) {
                // Score Circle
                ZStack {
                    Circle()
                        .stroke(Color.blue.opacity(0.2), lineWidth: 6)
                        .frame(width: 64, height: 64)

                    Circle()
                        .trim(from: 0, to: CGFloat(profile.computedRiskScore) / 100)
                        .stroke(Color.blue, style: StrokeStyle(lineWidth: 6, lineCap: .round))
                        .frame(width: 64, height: 64)
                        .rotationEffect(.degrees(-90))

                    Text("\(profile.computedRiskScore)")
                        .font(.system(size: 18, weight: .light, design: .rounded))
                        .foregroundColor(.blue)
                }

                VStack(alignment: .leading, spacing: 4) {
                    Text(profile.recommendedRiskCategory.rawValue)
                        .font(.system(size: 16, weight: .regular))
                        .foregroundColor(.primary)

                    Text("Based on your responses")
                        .font(.system(size: 12, weight: .light))
                        .foregroundColor(.secondary)
                }

                Spacer()
            }

            // Recommended Allocation
            VStack(alignment: .leading, spacing: 8) {
                Text("Recommended Allocation")
                    .font(.system(size: 12, weight: .regular))
                    .foregroundColor(.secondary)

                let allocation = profile.recommendedRiskCategory.assetAllocation
                HStack(spacing: 4) {
                    ProfileAllocationBar(label: "Equity", percentage: allocation.equity * 100, color: .blue)
                    ProfileAllocationBar(label: "Debt", percentage: allocation.debt * 100, color: .green)
                    ProfileAllocationBar(label: "Other", percentage: allocation.other * 100, color: .orange)
                }
            }
        }
        .padding(AppTheme.Spacing.medium)
        .background(cardBackground)
        .overlay(cardBorder)
        .shadow(color: colorScheme == .dark ? .clear : .black.opacity(0.08), radius: 12, x: 0, y: 4)
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
                            .init(color: .black.opacity(0.15), location: 0),
                            .init(color: .black.opacity(0.08), location: 0.3),
                            .init(color: .black.opacity(0.05), location: 0.7),
                            .init(color: .black.opacity(0.12), location: 1)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                      ),
                lineWidth: 1
            )
    }
}

struct ProfileAllocationBar: View {
    let label: String
    let percentage: Double
    let color: Color

    var body: some View {
        VStack(spacing: 4) {
            RoundedRectangle(cornerRadius: 4)
                .fill(color)
                .frame(height: 8)

            Text("\(Int(percentage))%")
                .font(.system(size: 10, weight: .regular))
                .foregroundColor(.secondary)

            Text(label)
                .font(.system(size: 10, weight: .light))
                .foregroundColor(Color(uiColor: .tertiaryLabel))
        }
    }
}

// MARK: - Reusable Selectable Row

struct SelectableRow: View {
    let title: String
    var subtitle: String? = nil
    let isSelected: Bool
    let action: () -> Void
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        Button(action: action) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.system(size: 14, weight: .regular))
                        .foregroundColor(.primary)

                    if let subtitle = subtitle {
                        Text(subtitle)
                            .font(.system(size: 12, weight: .light))
                            .foregroundColor(.secondary)
                    }
                }

                Spacer()

                Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                    .font(.system(size: 20))
                    .foregroundColor(isSelected ? .blue : Color(uiColor: .tertiaryLabel))
            }
            .padding(AppTheme.Spacing.medium)
            .background(rowBackground)
            .overlay(rowBorder)
        }
        .buttonStyle(.plain)
    }

    @ViewBuilder
    private var rowBackground: some View {
        if colorScheme == .dark {
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
                .fill(isSelected ? Color.blue.opacity(0.15) : Color.white.opacity(0.06))
        } else {
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
                .fill(isSelected ? Color.blue.opacity(0.08) : Color.white)
        }
    }

    private var rowBorder: some View {
        RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
            .stroke(
                isSelected ? Color.blue.opacity(0.5) : (colorScheme == .dark ? Color.white.opacity(0.08) : Color.black.opacity(0.06)),
                lineWidth: isSelected ? 1.5 : 1
            )
    }
}

#Preview {
    InvestorProfileSetupView()
        .environment(AnalysisProfileStore())
}
