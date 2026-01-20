import SwiftUI

struct OnboardingFlow: View {
    @EnvironmentObject var authManager: AuthManager
    @State private var currentStep: OnboardingStep = .riskProfile

    enum OnboardingStep {
        case riskProfile
        case personaResult
        case firstGoal
    }

    var body: some View {
        NavigationStack {
            switch currentStep {
            case .riskProfile:
                RiskAssessmentView(onComplete: { currentStep = .personaResult })
            case .personaResult:
                PersonaResultView(onContinue: { currentStep = .firstGoal })
            case .firstGoal:
                FirstGoalView(onComplete: { authManager.completeOnboarding() })
            }
        }
    }
}

// MARK: - Risk Assessment
struct RiskAssessmentView: View {
    let onComplete: () -> Void
    @State private var currentQuestion = 0
    @State private var answers: [Int] = []

    let questions: [RiskQuestion] = [
        RiskQuestion(
            question: "How would you describe your investment experience?",
            options: [
                "I'm new to investing",
                "I've invested in FDs and savings",
                "I have some mutual fund experience",
                "I'm an experienced investor"
            ]
        ),
        RiskQuestion(
            question: "What is your primary investment goal?",
            options: [
                "Preserve my money safely",
                "Steady growth with low risk",
                "Balance between growth and safety",
                "Maximum growth, I can handle volatility"
            ]
        ),
        RiskQuestion(
            question: "How long can you keep your money invested?",
            options: [
                "Less than 1 year",
                "1-3 years",
                "3-5 years",
                "More than 5 years"
            ]
        ),
        RiskQuestion(
            question: "If your investment drops 20% in one month, what would you do?",
            options: [
                "Sell everything immediately",
                "Sell some to reduce risk",
                "Hold and wait for recovery",
                "Invest more - great opportunity!"
            ]
        ),
        RiskQuestion(
            question: "What portion of your monthly income can you invest?",
            options: [
                "Less than 10%",
                "10-20%",
                "20-30%",
                "More than 30%"
            ]
        )
    ]

    var body: some View {
        VStack(spacing: 24) {
            // Progress
            HStack {
                Text("Risk Assessment")
                    .font(.system(size: 16, weight: .regular))
                    .foregroundColor(.primary)
                Spacer()
                Text("Step \(currentQuestion + 1) of \(questions.count)")
                    .font(.system(size: 12, weight: .regular))
                    .foregroundColor(.secondary)
            }
            .padding(.horizontal)

            // Progress Bar
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(AppTheme.progressBackground)
                        .frame(height: 4)

                    RoundedRectangle(cornerRadius: 4)
                        .fill(AppTheme.primaryGradient)
                        .frame(width: geometry.size.width * CGFloat(currentQuestion + 1) / CGFloat(questions.count), height: 4)
                }
            }
            .frame(height: 4)
            .padding(.horizontal)

            Spacer()

            // Question
            VStack(spacing: 32) {
                Text(questions[currentQuestion].question)
                    .font(.system(size: 18, weight: .regular))
                    .foregroundColor(.primary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)

                // Options
                VStack(spacing: 12) {
                    ForEach(0..<questions[currentQuestion].options.count, id: \.self) { index in
                        OptionButton(
                            text: questions[currentQuestion].options[index],
                            isSelected: answers.count > currentQuestion && answers[currentQuestion] == index
                        ) {
                            selectOption(index)
                        }
                    }
                }
                .padding(.horizontal)
            }

            Spacer()

            // Navigation
            HStack {
                if currentQuestion > 0 {
                    Button(action: previousQuestion) {
                        HStack {
                            Image(systemName: "chevron.left")
                            Text("Back")
                        }
                        .font(.system(size: 14, weight: .regular))
                        .foregroundColor(.secondary)
                    }
                }

                Spacer()

                if currentQuestion < questions.count - 1 {
                    Button(action: nextQuestion) {
                        HStack {
                            Text("Next")
                            Image(systemName: "chevron.right")
                        }
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(answers.count > currentQuestion ? .blue : Color(uiColor: .tertiaryLabel))
                    }
                    .disabled(answers.count <= currentQuestion)
                } else {
                    Button(action: completeAssessment) {
                        Text("Complete")
                            .font(.system(size: 15, weight: .medium))
                            .padding(.horizontal, 24)
                            .padding(.vertical, 12)
                            .background(answers.count > currentQuestion ? AppTheme.primaryGradient : LinearGradient(colors: [Color(uiColor: .tertiaryLabel)], startPoint: .leading, endPoint: .trailing))
                            .foregroundColor(.white)
                            .cornerRadius(24)
                    }
                    .disabled(answers.count <= currentQuestion)
                }
            }
            .padding()
        }
        .background(AppTheme.background)
    }

    private func selectOption(_ index: Int) {
        if answers.count > currentQuestion {
            answers[currentQuestion] = index
        } else {
            answers.append(index)
        }
    }

    private func nextQuestion() {
        if currentQuestion < questions.count - 1 {
            withAnimation {
                currentQuestion += 1
            }
        }
    }

    private func previousQuestion() {
        if currentQuestion > 0 {
            withAnimation {
                currentQuestion -= 1
            }
        }
    }

    private func completeAssessment() {
        onComplete()
    }
}

struct RiskQuestion {
    let question: String
    let options: [String]
}

struct OptionButton: View {
    let text: String
    let isSelected: Bool
    let action: () -> Void
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        Button(action: action) {
            HStack {
                Text(text)
                    .font(.system(size: 14, weight: .light))
                    .foregroundColor(isSelected ? .white : .primary)
                Spacer()
                if isSelected {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.white)
                }
            }
            .padding()
            .background(optionBackground)
            .overlay(optionBorder)
            .shadow(color: isSelected ? .clear : (colorScheme == .dark ? .clear : .black.opacity(0.04)), radius: 8, x: 0, y: 2)
        }
    }

    @ViewBuilder
    private var optionBackground: some View {
        if isSelected {
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
                .fill(AppTheme.primaryGradient)
        } else if colorScheme == .dark {
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
                .fill(Color.white.opacity(0.06))
        } else {
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
                .fill(Color.white)
        }
    }

    private var optionBorder: some View {
        RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
            .stroke(
                isSelected
                    ? Color.clear
                    : (colorScheme == .dark
                        ? Color.white.opacity(0.08)
                        : Color.black.opacity(0.06)),
                lineWidth: isSelected ? 0 : 0.5
            )
    }
}

// MARK: - Persona Result
struct PersonaResultView: View {
    @EnvironmentObject var authManager: AuthManager
    let onContinue: () -> Void

    var body: some View {
        VStack(spacing: 32) {
            Spacer()

            // Persona Card
            VStack(spacing: 20) {
                Image(systemName: "chart.pie.fill")
                    .font(.system(size: 60))
                    .foregroundColor(.blue)

                Text("Moderate Investor")
                    .font(.system(size: 22, weight: .regular))
                    .foregroundColor(.primary)

                Text("You balance risk and reward, seeking steady growth while protecting your principal.")
                    .font(.system(size: 14, weight: .light))
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 20)

                // Recommended Allocation
                VStack(alignment: .leading, spacing: 12) {
                    Text("RECOMMENDED ALLOCATION")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(.blue)
                        .tracking(1)

                    AllocationBar(equity: 50, debt: 40, other: 10)

                    HStack {
                        AllocationLegend(color: AppTheme.primary, label: "Equity 50%")
                        AllocationLegend(color: AppTheme.success, label: "Debt 40%")
                        AllocationLegend(color: AppTheme.warning, label: "Other 10%")
                    }
                }
                .padding()
                .background(AppTheme.blueGlassGradient)
                .cornerRadius(16)
            }
            .padding()
            .glassCardStyle(cornerRadius: AppTheme.CornerRadius.xxLarge, shadowRadius: 16)
            .padding(.horizontal)

            Spacer()

            Button(action: onContinue) {
                Text("Continue")
                    .font(.system(size: 15, weight: .medium))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(AppTheme.primaryGradient)
                    .foregroundColor(.white)
                    .cornerRadius(12)
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 40)
        }
        .background(AppTheme.background)
    }
}

struct AllocationBar: View {
    let equity: Double
    let debt: Double
    let other: Double

    var body: some View {
        GeometryReader { geometry in
            HStack(spacing: 2) {
                RoundedRectangle(cornerRadius: 4)
                    .fill(AppTheme.primary)
                    .frame(width: geometry.size.width * equity / 100)

                RoundedRectangle(cornerRadius: 4)
                    .fill(AppTheme.success)
                    .frame(width: geometry.size.width * debt / 100)

                RoundedRectangle(cornerRadius: 4)
                    .fill(AppTheme.warning)
                    .frame(width: geometry.size.width * other / 100)
            }
        }
        .frame(height: 8)
    }
}

struct AllocationLegend: View {
    let color: Color
    let label: String

    var body: some View {
        HStack(spacing: 4) {
            Circle()
                .fill(color)
                .frame(width: 8, height: 8)
            Text(label)
                .font(.system(size: 12, weight: .regular))
                .foregroundColor(.secondary)
        }
    }
}

// MARK: - First Goal
struct FirstGoalView: View {
    let onComplete: () -> Void
    @State private var selectedCategory: GoalCategory?
    @State private var goalName = ""
    @State private var targetAmount = ""
    @State private var targetYears = 3

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                VStack(spacing: 8) {
                    Text("Create Your First Goal")
                        .font(.system(size: 20, weight: .regular))
                        .foregroundColor(.primary)

                    Text("What are you saving for?")
                        .font(.system(size: 14, weight: .light))
                        .foregroundColor(.secondary)
                }
                .padding(.top, 20)

                // Goal Templates
                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                    ForEach(GoalCategory.allCases.filter { $0 != .custom }, id: \.self) { category in
                        GoalTemplateCard(
                            category: category,
                            isSelected: selectedCategory == category
                        ) {
                            selectedCategory = category
                            goalName = category.rawValue
                            targetAmount = String(Int(category.defaultTarget))
                            targetYears = category.defaultYears
                        }
                    }
                }
                .padding(.horizontal)

                // Goal Details
                if selectedCategory != nil {
                    VStack(spacing: 16) {
                        FormField(label: "GOAL NAME", text: $goalName)
                        FormField(label: "TARGET AMOUNT (₹)", text: $targetAmount, keyboardType: .numberPad)

                        VStack(alignment: .leading, spacing: 8) {
                            Text("TIMELINE")
                                .font(.system(size: 11, weight: .medium))
                                .foregroundColor(.blue)
                                .tracking(1)

                            HStack {
                                Text("\(targetYears) years")
                                    .font(.system(size: 16, weight: .light))
                                    .foregroundColor(.primary)
                                Spacer()
                                Stepper("", value: $targetYears, in: 1...30)
                            }
                            .padding()
                            .background(AppTheme.inputBackground)
                            .cornerRadius(12)
                        }

                        // Estimated SIP
                        if let amount = Double(targetAmount) {
                            let monthlySIP = calculateSIP(target: amount, years: targetYears)
                            VStack(spacing: 8) {
                                Text("RECOMMENDED SIP")
                                    .font(.system(size: 11, weight: .medium))
                                    .foregroundColor(.blue)
                                    .tracking(1)

                                Text(monthlySIP.currencyFormatted + "/month")
                                    .font(.system(size: 22, weight: .light, design: .rounded))
                                    .foregroundColor(.blue)

                                Text("Based on 12% expected returns")
                                    .font(.system(size: 12, weight: .regular))
                                    .foregroundColor(.secondary)
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(AppTheme.blueGlassGradient)
                            .cornerRadius(16)
                        }
                    }
                    .padding(.horizontal)
                }

                Spacer(minLength: 100)
            }
        }
        .background(AppTheme.background)
        .safeAreaInset(edge: .bottom) {
            VStack {
                Button(action: onComplete) {
                    Text("Create Goal")
                        .font(.system(size: 15, weight: .medium))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(selectedCategory != nil ? AppTheme.primaryGradient : LinearGradient(colors: [Color(uiColor: .tertiaryLabel)], startPoint: .leading, endPoint: .trailing))
                        .foregroundColor(.white)
                        .cornerRadius(12)
                }
                .disabled(selectedCategory == nil)
                .padding(.horizontal, 24)

                Button(action: onComplete) {
                    Text("Skip for now")
                        .font(.system(size: 14, weight: .regular))
                        .foregroundColor(.secondary)
                }
                .padding(.top, 8)
            }
            .padding(.vertical)
            .background(AppTheme.background)
        }
    }

    private func calculateSIP(target: Double, years: Int) -> Double {
        let rate = 0.12 / 12 // 12% annual, monthly
        let months = Double(years * 12)
        // PMT formula: P = FV * r / ((1 + r)^n - 1)
        let sip = target * rate / (pow(1 + rate, months) - 1)
        return sip
    }
}

struct GoalTemplateCard: View {
    let category: GoalCategory
    let isSelected: Bool
    let action: () -> Void
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Image(systemName: category.icon)
                    .font(.system(size: 24))
                    .foregroundColor(isSelected ? .white : category.color)
                Text(category.rawValue)
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(isSelected ? .white : .primary)
                    .lineLimit(1)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(templateBackground)
            .overlay(templateBorder)
            .shadow(color: isSelected ? .clear : (colorScheme == .dark ? .clear : .black.opacity(0.04)), radius: 8, x: 0, y: 2)
        }
    }

    @ViewBuilder
    private var templateBackground: some View {
        if isSelected {
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
                .fill(AppTheme.primaryGradient)
        } else if colorScheme == .dark {
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
                .fill(Color.white.opacity(0.06))
        } else {
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
                .fill(Color.white)
        }
    }

    private var templateBorder: some View {
        RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
            .stroke(
                isSelected
                    ? Color.clear
                    : (colorScheme == .dark
                        ? Color.white.opacity(0.08)
                        : Color.black.opacity(0.06)),
                lineWidth: isSelected ? 0 : 0.5
            )
    }
}

#Preview {
    OnboardingFlow()
        .environmentObject(AuthManager())
}
