//
//  PortfolioInputView.swift
//  SparrowInvest
//
//  View for manually inputting/editing portfolio holdings for AI analysis or family members
//

import SwiftUI

// MARK: - Portfolio Target Type

enum PortfolioTargetType: String, CaseIterable {
    case aiAnalysis = "AI Analysis"
    case familyMember = "Family Member"

    var icon: String {
        switch self {
        case .aiAnalysis: return "brain.head.profile"
        case .familyMember: return "person.2.fill"
        }
    }

    var color: Color {
        switch self {
        case .aiAnalysis: return .blue
        case .familyMember: return .cyan
        }
    }
}

struct PortfolioInputView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.colorScheme) private var colorScheme
    @EnvironmentObject var portfolioStore: PortfolioStore
    @EnvironmentObject var familyStore: FamilyStore
    @Environment(AnalysisProfileStore.self) var analysisStore

    @State private var portfolioTarget: PortfolioTargetType = .aiAnalysis
    @State private var selectedMember: FamilyMember?
    @State private var showAddHolding = false
    @State private var showAddFamilyMember = false
    @State private var showMemberPicker = false
    @State private var holdingToEdit: AnalysisHolding?

    // Computed properties for family member holdings
    private var familyMemberHoldings: [Holding] {
        guard let member = selectedMember else { return [] }
        return familyStore.getHoldings(for: member.id)
    }

    private var navigationTitle: String {
        switch portfolioTarget {
        case .aiAnalysis:
            return "Portfolio for Analysis"
        case .familyMember:
            if let member = selectedMember {
                return "\(member.name)'s Portfolio"
            }
            return "Family Portfolio"
        }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: AppTheme.Spacing.large) {
                    // Portfolio Type Selector
                    PortfolioTargetSelector(
                        selectedTarget: $portfolioTarget,
                        onChange: {
                            // Reset member selection when switching to AI Analysis
                            if portfolioTarget == .aiAnalysis {
                                selectedMember = nil
                            }
                        }
                    )

                    // Content based on target type
                    if portfolioTarget == .aiAnalysis {
                        aiAnalysisContent
                    } else {
                        familyMemberContent
                    }
                }
                .padding(AppTheme.Spacing.medium)
            }
            .background(Color(uiColor: .systemGroupedBackground))
            .navigationTitle(navigationTitle)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") { dismiss() }
                }
            }
            .sheet(isPresented: $showAddHolding) {
                if portfolioTarget == .aiAnalysis {
                    AddHoldingView()
                } else if let member = selectedMember {
                    AddHoldingSheet(memberId: member.id)
                }
            }
            .sheet(item: $holdingToEdit) { holding in
                AddHoldingView(existingHolding: holding)
            }
            .sheet(isPresented: $showAddFamilyMember) {
                AddFamilyMemberSheet()
            }
            .sheet(isPresented: $showMemberPicker) {
                FamilyMemberPickerSheet(
                    members: familyStore.familyPortfolio.members,
                    selectedMember: $selectedMember,
                    isPresented: $showMemberPicker,
                    onAddMember: {
                        showMemberPicker = false
                        showAddFamilyMember = true
                    }
                )
            }
        }
    }

    // MARK: - AI Analysis Content

    @ViewBuilder
    private var aiAnalysisContent: some View {
        // Header Card
        PortfolioInputHeader()

        // Import from Existing Portfolio
        if !portfolioStore.holdings.isEmpty {
            ImportFromPortfolioCard(
                holdingsCount: portfolioStore.holdings.count,
                totalValue: portfolioStore.portfolio.totalValue
            ) {
                analysisStore.importFromPortfolio(portfolioStore.holdings)
            }
        }

        // Holdings List
        if let portfolio = analysisStore.analysisPortfolio, !portfolio.holdings.isEmpty {
            HoldingsListSection(
                holdings: portfolio.holdings,
                onEdit: { holding in holdingToEdit = holding },
                onDelete: { id in analysisStore.removeHolding(id: id) }
            )
        } else {
            EmptyAnalysisHoldingsView {
                showAddHolding = true
            }
        }

        // Add Holding Button
        if analysisStore.analysisPortfolio != nil {
            AddHoldingButton {
                showAddHolding = true
            }
        }
    }

    // MARK: - Family Member Content

    @ViewBuilder
    private var familyMemberContent: some View {
        // Member Selection
        FamilyMemberSelectionCard(
            selectedMember: selectedMember,
            onSelectMember: { showMemberPicker = true },
            onAddMember: { showAddFamilyMember = true }
        )

        // Show holdings if member is selected
        if let member = selectedMember {
            // Member Summary
            FamilyMemberSummaryCard(member: member, holdingsCount: familyMemberHoldings.count)

            // Import from main portfolio option
            if !portfolioStore.holdings.isEmpty && familyMemberHoldings.isEmpty {
                ImportToFamilyCard(
                    holdingsCount: portfolioStore.holdings.count,
                    totalValue: portfolioStore.portfolio.totalValue,
                    memberName: member.name
                ) {
                    // Import holdings to family member
                    for holding in portfolioStore.holdings {
                        familyStore.addHolding(holding, to: member.id)
                    }
                }
            }

            // Holdings List
            if !familyMemberHoldings.isEmpty {
                FamilyHoldingsListSection(
                    holdings: familyMemberHoldings,
                    onDelete: { holdingId in
                        familyStore.removeHolding(holdingId, from: member.id)
                    }
                )
            } else {
                EmptyFamilyHoldingsView(memberName: member.name) {
                    showAddHolding = true
                }
            }

            // Add Holding Button
            AddHoldingButton {
                showAddHolding = true
            }
        }
    }
}

// MARK: - Portfolio Input Header

struct PortfolioInputHeader: View {
    @Environment(AnalysisProfileStore.self) var analysisStore
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.medium) {
            HStack(spacing: AppTheme.Spacing.compact) {
                ZStack {
                    Circle()
                        .fill(
                            LinearGradient(
                                colors: [.blue, .cyan],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 48, height: 48)

                    Image(systemName: "chart.pie.fill")
                        .font(.system(size: 20, weight: .light))
                        .foregroundColor(.white)
                }

                VStack(alignment: .leading, spacing: 4) {
                    Text("Portfolio for Analysis")
                        .font(.system(size: 16, weight: .regular))
                        .foregroundColor(.primary)

                    Text("Add your holdings to get AI insights")
                        .font(.system(size: 12, weight: .light))
                        .foregroundColor(.secondary)
                }

                Spacer()
            }

            if let portfolio = analysisStore.analysisPortfolio, !portfolio.holdings.isEmpty {
                Divider()

                // Summary Stats
                HStack(spacing: 0) {
                    PortfolioStatItem(
                        label: "Holdings",
                        value: "\(portfolio.holdings.count)",
                        color: .blue
                    )

                    Divider()
                        .frame(height: 36)

                    PortfolioStatItem(
                        label: "Invested",
                        value: portfolio.totalInvestedAmount.compactCurrencyFormatted,
                        color: .primary
                    )

                    Divider()
                        .frame(height: 36)

                    PortfolioStatItem(
                        label: "Returns",
                        value: portfolio.returnsPercentage.percentFormatted,
                        color: portfolio.returnsPercentage >= 0 ? .green : .red
                    )
                }
            }
        }
        .padding(AppTheme.Spacing.large)
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

struct PortfolioStatItem: View {
    let label: String
    let value: String
    let color: Color

    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.system(size: 16, weight: .light, design: .rounded))
                .foregroundColor(color)

            Text(label)
                .font(.system(size: 11, weight: .light))
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: - Import from Portfolio Card

struct ImportFromPortfolioCard: View {
    let holdingsCount: Int
    let totalValue: Double
    let action: () -> Void
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.compact) {
            HStack(spacing: 4) {
                Image(systemName: "square.and.arrow.down")
                    .font(.system(size: 12, weight: .light))
                    .foregroundColor(.blue)
                Text("IMPORT FROM EXISTING PORTFOLIO")
                    .font(.system(size: 11, weight: .regular))
                    .foregroundColor(.blue)
                    .tracking(1)
            }

            Text("Import your \(holdingsCount) holdings worth \(totalValue.compactCurrencyFormatted) from your connected portfolio")
                .font(.system(size: 13, weight: .light))
                .foregroundColor(.secondary)

            Button(action: action) {
                HStack {
                    Image(systemName: "arrow.down.doc.fill")
                        .font(.system(size: 14, weight: .light))
                    Text("Import Holdings")
                        .font(.system(size: 14, weight: .regular))
                }
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
                .background(
                    LinearGradient(
                        colors: [.blue, .cyan],
                        startPoint: .leading,
                        endPoint: .trailing
                    ),
                    in: RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
                )
            }
        }
        .padding(AppTheme.Spacing.medium)
        .listItemCardStyle(cornerRadius: AppTheme.CornerRadius.large)
    }
}

// MARK: - Holdings List Section

struct HoldingsListSection: View {
    let holdings: [AnalysisHolding]
    let onEdit: (AnalysisHolding) -> Void
    let onDelete: (String) -> Void
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.compact) {
            Text("YOUR HOLDINGS")
                .font(.system(size: 11, weight: .regular))
                .foregroundColor(.blue)
                .tracking(1)

            ForEach(holdings) { holding in
                HoldingInputCard(
                    holding: holding,
                    onEdit: { onEdit(holding) },
                    onDelete: { onDelete(holding.id) }
                )
            }
        }
    }
}

struct HoldingInputCard: View {
    let holding: AnalysisHolding
    let onEdit: () -> Void
    let onDelete: () -> Void
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        HStack(spacing: AppTheme.Spacing.compact) {
            // Fund Icon
            ZStack {
                RoundedRectangle(cornerRadius: AppTheme.CornerRadius.small, style: .continuous)
                    .fill(holding.assetClass.color.opacity(0.15))
                    .frame(width: 40, height: 40)

                Text(String(holding.fundName.prefix(2)).uppercased())
                    .font(.system(size: 12, weight: .light))
                    .foregroundColor(holding.assetClass.color)
            }

            // Fund Details
            VStack(alignment: .leading, spacing: 2) {
                Text(holding.fundName)
                    .font(.system(size: 13, weight: .regular))
                    .foregroundColor(.primary)
                    .lineLimit(1)

                Text("\(holding.category) • \(holding.units.formatted()) units")
                    .font(.system(size: 11, weight: .light))
                    .foregroundColor(.secondary)
            }

            Spacer()

            // Value & Returns
            VStack(alignment: .trailing, spacing: 2) {
                Text(holding.currentValue.currencyFormatted)
                    .font(.system(size: 13, weight: .regular))
                    .foregroundColor(.primary)

                Text(holding.returnsPercentage.percentFormatted)
                    .font(.system(size: 11, weight: .light))
                    .foregroundColor(holding.returnsPercentage >= 0 ? .green : .red)
            }

            // Actions Menu
            Menu {
                Button {
                    onEdit()
                } label: {
                    Label("Edit", systemImage: "pencil")
                }

                Button(role: .destructive) {
                    onDelete()
                } label: {
                    Label("Delete", systemImage: "trash")
                }
            } label: {
                Image(systemName: "ellipsis")
                    .font(.system(size: 16))
                    .foregroundColor(.secondary)
                    .frame(width: 32, height: 32)
            }
        }
        .padding(AppTheme.Spacing.compact)
        .listItemCardStyle()
    }
}

// MARK: - Empty Holdings View

struct EmptyAnalysisHoldingsView: View {
    let action: () -> Void
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        VStack(spacing: AppTheme.Spacing.medium) {
            Image(systemName: "folder.badge.plus")
                .font(.system(size: 40, weight: .light))
                .foregroundColor(Color(uiColor: .tertiaryLabel))

            VStack(spacing: 4) {
                Text("No Holdings Added")
                    .font(.system(size: 16, weight: .regular))
                    .foregroundColor(.primary)

                Text("Add your mutual fund holdings to get AI-powered insights and recommendations")
                    .font(.system(size: 13, weight: .light))
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }

            Button(action: action) {
                HStack(spacing: 6) {
                    Image(systemName: "plus.circle.fill")
                        .font(.system(size: 14))
                    Text("Add Your First Holding")
                        .font(.system(size: 14, weight: .regular))
                }
                .foregroundColor(.white)
                .padding(.horizontal, 24)
                .padding(.vertical, 12)
                .background(
                    LinearGradient(
                        colors: [.blue, .cyan],
                        startPoint: .leading,
                        endPoint: .trailing
                    ),
                    in: Capsule()
                )
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, AppTheme.Spacing.xLarge)
        .padding(.horizontal, AppTheme.Spacing.medium)
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

// MARK: - Add Holding Button

struct AddHoldingButton: View {
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                Image(systemName: "plus.circle.fill")
                    .font(.system(size: 16))
                Text("Add Another Holding")
                    .font(.system(size: 14, weight: .regular))
            }
            .foregroundColor(.blue)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .background(Color.blue.opacity(0.1), in: RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous))
        }
    }
}

// MARK: - Add Holding View

struct AddHoldingView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.colorScheme) private var colorScheme
    @Environment(AnalysisProfileStore.self) var analysisStore
    var existingHolding: AnalysisHolding?

    @State private var fundName: String = ""
    @State private var category: String = "Equity"
    @State private var assetClass: Holding.AssetClass = .equity
    @State private var investedAmount: String = ""
    @State private var currentValue: String = ""
    @State private var units: String = ""

    private let categories = ["Equity", "Debt", "Hybrid", "ELSS", "Index", "Gold"]
    private let assetClasses: [Holding.AssetClass] = [.equity, .debt, .hybrid, .gold, .other]

    init(existingHolding: AnalysisHolding? = nil) {
        self.existingHolding = existingHolding

        if let holding = existingHolding {
            _fundName = State(initialValue: holding.fundName)
            _category = State(initialValue: holding.category)
            _assetClass = State(initialValue: holding.assetClass)
            _investedAmount = State(initialValue: String(format: "%.0f", holding.investedAmount))
            _currentValue = State(initialValue: String(format: "%.0f", holding.currentValue))
            _units = State(initialValue: String(format: "%.3f", holding.units))
        }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: AppTheme.Spacing.large) {
                    // Fund Name
                    VStack(alignment: .leading, spacing: 6) {
                        Text("FUND NAME")
                            .font(.system(size: 11, weight: .regular))
                            .foregroundColor(.blue)
                            .tracking(1)

                        TextField("Enter fund name", text: $fundName)
                            .font(.system(size: 16, weight: .light))
                            .padding(AppTheme.Spacing.medium)
                            .background(fieldBackground)
                            .overlay(fieldBorder)
                    }

                    // Category Selection
                    VStack(alignment: .leading, spacing: 6) {
                        Text("CATEGORY")
                            .font(.system(size: 11, weight: .regular))
                            .foregroundColor(.blue)
                            .tracking(1)

                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                ForEach(categories, id: \.self) { cat in
                                    CategoryChip(
                                        label: cat,
                                        isSelected: category == cat
                                    ) {
                                        category = cat
                                        // Update asset class based on category
                                        switch cat {
                                        case "Equity", "ELSS", "Index": assetClass = .equity
                                        case "Debt": assetClass = .debt
                                        case "Hybrid": assetClass = .hybrid
                                        case "Gold": assetClass = .gold
                                        default: assetClass = .other
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // Investment Details
                    VStack(alignment: .leading, spacing: AppTheme.Spacing.compact) {
                        Text("INVESTMENT DETAILS")
                            .font(.system(size: 11, weight: .regular))
                            .foregroundColor(.blue)
                            .tracking(1)

                        // Amount Invested
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Amount Invested (₹)")
                                .font(.system(size: 12, weight: .light))
                                .foregroundColor(.secondary)

                            TextField("0", text: $investedAmount)
                                .font(.system(size: 16, weight: .light))
                                .keyboardType(.numberPad)
                                .padding(AppTheme.Spacing.medium)
                                .background(fieldBackground)
                                .overlay(fieldBorder)
                        }

                        // Current Value
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Current Value (₹)")
                                .font(.system(size: 12, weight: .light))
                                .foregroundColor(.secondary)

                            TextField("0", text: $currentValue)
                                .font(.system(size: 16, weight: .light))
                                .keyboardType(.numberPad)
                                .padding(AppTheme.Spacing.medium)
                                .background(fieldBackground)
                                .overlay(fieldBorder)
                        }

                        // Units
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Units Held")
                                .font(.system(size: 12, weight: .light))
                                .foregroundColor(.secondary)

                            TextField("0.000", text: $units)
                                .font(.system(size: 16, weight: .light))
                                .keyboardType(.decimalPad)
                                .padding(AppTheme.Spacing.medium)
                                .background(fieldBackground)
                                .overlay(fieldBorder)
                        }
                    }
                }
                .padding(AppTheme.Spacing.medium)
            }
            .background(Color(uiColor: .systemGroupedBackground))
            .navigationTitle(existingHolding == nil ? "Add Holding" : "Edit Holding")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        saveHolding()
                    }
                    .disabled(!isValid)
                }
            }
        }
    }

    private var isValid: Bool {
        !fundName.isEmpty &&
        Double(investedAmount) != nil &&
        Double(currentValue) != nil &&
        Double(units) != nil
    }

    private func saveHolding() {
        let holding = AnalysisHolding(
            id: existingHolding?.id ?? UUID().uuidString,
            fundName: fundName,
            category: category,
            assetClass: assetClass,
            investedAmount: Double(investedAmount) ?? 0,
            currentValue: Double(currentValue) ?? 0,
            units: Double(units) ?? 0
        )

        if existingHolding != nil {
            analysisStore.updateHolding(holding)
        } else {
            analysisStore.addHolding(holding)
        }
        dismiss()
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

struct CategoryChip: View {
    let label: String
    let isSelected: Bool
    let action: () -> Void
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        Button(action: action) {
            Text(label)
                .font(.system(size: 13, weight: .regular))
                .foregroundColor(isSelected ? .white : .primary)
                .padding(.horizontal, 14)
                .padding(.vertical, 8)
                .background(chipBackground)
                .overlay(chipBorder)
        }
    }

    @ViewBuilder
    private var chipBackground: some View {
        if isSelected {
            Capsule()
                .fill(
                    LinearGradient(
                        colors: [.blue, .cyan],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
        } else if colorScheme == .dark {
            Capsule()
                .fill(Color.white.opacity(0.06))
        } else {
            Capsule()
                .fill(Color.white)
        }
    }

    @ViewBuilder
    private var chipBorder: some View {
        if !isSelected {
            Capsule()
                .stroke(
                    colorScheme == .dark ? Color.white.opacity(0.15) : Color.black.opacity(0.1),
                    lineWidth: 1
                )
        }
    }
}

// MARK: - Portfolio Target Selector

struct PortfolioTargetSelector: View {
    @Binding var selectedTarget: PortfolioTargetType
    var onChange: (() -> Void)?
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        HStack(spacing: 0) {
            ForEach(PortfolioTargetType.allCases, id: \.self) { target in
                Button {
                    withAnimation(.easeInOut(duration: 0.2)) {
                        selectedTarget = target
                        onChange?()
                    }
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: target.icon)
                            .font(.system(size: 14, weight: .medium))
                        Text(target.rawValue)
                            .font(.system(size: 13, weight: .medium))
                    }
                    .foregroundColor(selectedTarget == target ? .white : .primary)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background {
                        if selectedTarget == target {
                            Capsule()
                                .fill(
                                    LinearGradient(
                                        colors: [target.color, target.color.opacity(0.8)],
                                        startPoint: .leading,
                                        endPoint: .trailing
                                    )
                                )
                        }
                    }
                }
            }
        }
        .padding(4)
        .background(selectorBackground)
        .overlay(selectorBorder)
        .shadow(color: selectorShadow, radius: 8, x: 0, y: 2)
    }

    private var selectorShadow: Color {
        colorScheme == .dark ? .clear : .black.opacity(0.04)
    }

    @ViewBuilder
    private var selectorBackground: some View {
        if colorScheme == .dark {
            Capsule()
                .fill(Color.black.opacity(0.4))
                .background(Capsule().fill(.ultraThinMaterial))
        } else {
            Capsule().fill(Color.white)
        }
    }

    private var selectorBorder: some View {
        Capsule()
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
}

// MARK: - Family Member Selection Card

struct FamilyMemberSelectionCard: View {
    let selectedMember: FamilyMember?
    let onSelectMember: () -> Void
    let onAddMember: () -> Void
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        VStack(spacing: AppTheme.Spacing.medium) {
            if let member = selectedMember {
                // Selected member display
                Button(action: onSelectMember) {
                    HStack(spacing: AppTheme.Spacing.compact) {
                        // Avatar
                        ZStack {
                            Circle()
                                .fill(member.relationship.color.opacity(0.15))
                                .frame(width: 48, height: 48)
                            Text(member.name.prefix(1).uppercased())
                                .font(.system(size: 18, weight: .medium))
                                .foregroundColor(member.relationship.color)
                        }

                        VStack(alignment: .leading, spacing: 2) {
                            Text(member.name)
                                .font(.system(size: 16, weight: .medium))
                                .foregroundColor(.primary)
                            Text(member.relationship.displayName)
                                .font(.system(size: 13, weight: .regular))
                                .foregroundColor(.secondary)
                        }

                        Spacer()

                        HStack(spacing: 4) {
                            Text("Change")
                                .font(.system(size: 13, weight: .medium))
                            Image(systemName: "chevron.right")
                                .font(.system(size: 12, weight: .medium))
                        }
                        .foregroundColor(.blue)
                    }
                }
                .buttonStyle(.plain)
            } else {
                // No member selected - show options
                VStack(spacing: AppTheme.Spacing.compact) {
                    Image(systemName: "person.2.fill")
                        .font(.system(size: 32, weight: .light))
                        .foregroundColor(.blue.opacity(0.6))

                    Text("Select a Family Member")
                        .font(.system(size: 15, weight: .medium))
                        .foregroundColor(.primary)

                    Text("Choose an existing family member or add a new one to create their portfolio")
                        .font(.system(size: 13, weight: .light))
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)

                    HStack(spacing: AppTheme.Spacing.compact) {
                        Button(action: onSelectMember) {
                            HStack(spacing: 6) {
                                Image(systemName: "person.crop.circle")
                                Text("Select Member")
                            }
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 12)
                            .background(
                                LinearGradient(
                                    colors: [.blue, .cyan],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                ),
                                in: RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
                            )
                        }

                        Button(action: onAddMember) {
                            HStack(spacing: 6) {
                                Image(systemName: "plus.circle")
                                Text("Add New")
                            }
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(.blue)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 12)
                            .background(
                                Color.blue.opacity(colorScheme == .dark ? 0.15 : 0.08),
                                in: RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
                            )
                            .overlay(
                                RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
                                    .stroke(Color.blue.opacity(0.3), lineWidth: 1)
                            )
                        }
                    }
                    .padding(.top, 8)
                }
                .padding(.vertical, AppTheme.Spacing.medium)
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

// MARK: - Family Member Summary Card

struct FamilyMemberSummaryCard: View {
    let member: FamilyMember
    let holdingsCount: Int
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        HStack(spacing: 0) {
            SummaryStatItem(label: "Holdings", value: "\(holdingsCount)", color: .blue)
            Divider().frame(height: 36)
            SummaryStatItem(label: "Invested", value: member.investedAmount.compactCurrencyFormatted, color: .primary)
            Divider().frame(height: 36)
            SummaryStatItem(label: "Returns", value: member.returnsPercentage.percentFormatted, color: member.returns >= 0 ? .green : .red)
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

    private var cardBorder: some View {
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

struct SummaryStatItem: View {
    let label: String
    let value: String
    let color: Color

    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.system(size: 16, weight: .light, design: .rounded))
                .foregroundColor(color)
            Text(label)
                .font(.system(size: 11, weight: .light))
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: - Import To Family Card

struct ImportToFamilyCard: View {
    let holdingsCount: Int
    let totalValue: Double
    let memberName: String
    let action: () -> Void
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.compact) {
            HStack(spacing: 4) {
                Image(systemName: "square.and.arrow.down")
                    .font(.system(size: 12, weight: .light))
                    .foregroundColor(.green)
                Text("IMPORT FROM YOUR PORTFOLIO")
                    .font(.system(size: 11, weight: .regular))
                    .foregroundColor(.green)
                    .tracking(1)
            }

            Text("Copy your \(holdingsCount) holdings worth \(totalValue.compactCurrencyFormatted) to \(memberName)'s portfolio")
                .font(.system(size: 13, weight: .light))
                .foregroundColor(.secondary)

            Button(action: action) {
                HStack {
                    Image(systemName: "doc.on.doc.fill")
                        .font(.system(size: 14, weight: .light))
                    Text("Copy Holdings")
                        .font(.system(size: 14, weight: .regular))
                }
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
                .background(
                    LinearGradient(
                        colors: [.green, .mint],
                        startPoint: .leading,
                        endPoint: .trailing
                    ),
                    in: RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
                )
            }
        }
        .padding(AppTheme.Spacing.medium)
        .listItemCardStyle(cornerRadius: AppTheme.CornerRadius.large)
    }
}

// MARK: - Family Holdings List Section

struct FamilyHoldingsListSection: View {
    let holdings: [Holding]
    let onDelete: (String) -> Void
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.compact) {
            HStack {
                Text("HOLDINGS")
                    .font(.system(size: 11, weight: .regular))
                    .foregroundColor(.blue)
                    .tracking(1)

                Spacer()

                Text("\(holdings.count) funds")
                    .font(.system(size: 12, weight: .light))
                    .foregroundColor(.secondary)
            }

            ForEach(holdings) { holding in
                FamilyHoldingInputCard(holding: holding, onDelete: { onDelete(holding.id) })
            }
        }
    }
}

struct FamilyHoldingInputCard: View {
    let holding: Holding
    let onDelete: () -> Void
    @Environment(\.colorScheme) private var colorScheme
    @State private var showDeleteConfirm = false

    var body: some View {
        HStack(spacing: AppTheme.Spacing.compact) {
            // Fund Icon
            ZStack {
                RoundedRectangle(cornerRadius: AppTheme.CornerRadius.small, style: .continuous)
                    .fill(holding.assetClass.color.opacity(0.15))
                    .frame(width: 40, height: 40)

                Text(String(holding.fundName.prefix(2)).uppercased())
                    .font(.system(size: 12, weight: .light))
                    .foregroundColor(holding.assetClass.color)
            }

            // Fund Details
            VStack(alignment: .leading, spacing: 2) {
                Text(holding.fundName)
                    .font(.system(size: 13, weight: .regular))
                    .foregroundColor(.primary)
                    .lineLimit(1)

                Text("\(holding.category) • \(String(format: "%.3f", holding.units)) units")
                    .font(.system(size: 11, weight: .light))
                    .foregroundColor(.secondary)
            }

            Spacer()

            // Value & Returns
            VStack(alignment: .trailing, spacing: 2) {
                Text(holding.currentValue.currencyFormatted)
                    .font(.system(size: 13, weight: .regular))
                    .foregroundColor(.primary)

                Text(holding.returnsPercentage.percentFormatted)
                    .font(.system(size: 11, weight: .light))
                    .foregroundColor(holding.returnsPercentage >= 0 ? .green : .red)
            }

            // Delete Button
            Button {
                showDeleteConfirm = true
            } label: {
                Image(systemName: "trash")
                    .font(.system(size: 14))
                    .foregroundColor(.red.opacity(0.7))
                    .frame(width: 32, height: 32)
            }
        }
        .padding(AppTheme.Spacing.compact)
        .listItemCardStyle()
        .confirmationDialog("Delete Holding", isPresented: $showDeleteConfirm) {
            Button("Delete", role: .destructive, action: onDelete)
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("Are you sure you want to delete this holding?")
        }
    }
}

// MARK: - Empty Family Holdings View

struct EmptyFamilyHoldingsView: View {
    let memberName: String
    let action: () -> Void
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        VStack(spacing: AppTheme.Spacing.medium) {
            Image(systemName: "chart.pie")
                .font(.system(size: 40, weight: .light))
                .foregroundColor(Color(uiColor: .tertiaryLabel))

            VStack(spacing: 4) {
                Text("No Holdings Added")
                    .font(.system(size: 16, weight: .regular))
                    .foregroundColor(.primary)

                Text("Add mutual fund holdings to track \(memberName)'s portfolio")
                    .font(.system(size: 13, weight: .light))
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }

            Button(action: action) {
                HStack(spacing: 6) {
                    Image(systemName: "plus.circle.fill")
                        .font(.system(size: 14))
                    Text("Add First Holding")
                        .font(.system(size: 14, weight: .regular))
                }
                .foregroundColor(.white)
                .padding(.horizontal, 24)
                .padding(.vertical, 12)
                .background(
                    LinearGradient(
                        colors: [.blue, .cyan],
                        startPoint: .leading,
                        endPoint: .trailing
                    ),
                    in: Capsule()
                )
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, AppTheme.Spacing.xLarge)
        .padding(.horizontal, AppTheme.Spacing.medium)
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

// MARK: - Family Member Picker Sheet

struct FamilyMemberPickerSheet: View {
    let members: [FamilyMember]
    @Binding var selectedMember: FamilyMember?
    @Binding var isPresented: Bool
    var onAddMember: (() -> Void)?
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: AppTheme.Spacing.medium) {
                    if members.isEmpty {
                        // Empty state
                        VStack(spacing: AppTheme.Spacing.medium) {
                            Image(systemName: "person.2.slash")
                                .font(.system(size: 48, weight: .light))
                                .foregroundColor(Color(uiColor: .tertiaryLabel))

                            Text("No Family Members")
                                .font(.system(size: 17, weight: .medium))
                                .foregroundColor(.primary)

                            Text("Add a family member to create their portfolio")
                                .font(.system(size: 14, weight: .light))
                                .foregroundColor(.secondary)
                                .multilineTextAlignment(.center)

                            Button {
                                onAddMember?()
                            } label: {
                                HStack(spacing: 6) {
                                    Image(systemName: "plus.circle.fill")
                                    Text("Add Family Member")
                                }
                                .font(.system(size: 15, weight: .semibold))
                                .foregroundColor(.white)
                                .padding(.horizontal, 24)
                                .padding(.vertical, 14)
                                .background(
                                    LinearGradient(
                                        colors: [.blue, .cyan],
                                        startPoint: .leading,
                                        endPoint: .trailing
                                    ),
                                    in: Capsule()
                                )
                            }
                            .padding(.top, 8)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 48)
                    } else {
                        // Member list
                        ForEach(members) { member in
                            MemberPickerRow(
                                member: member,
                                isSelected: selectedMember?.id == member.id,
                                onSelect: {
                                    selectedMember = member
                                    isPresented = false
                                }
                            )
                        }

                        // Add member button
                        Button {
                            onAddMember?()
                        } label: {
                            HStack(spacing: 8) {
                                ZStack {
                                    Circle()
                                        .fill(Color.blue.opacity(0.15))
                                        .frame(width: 44, height: 44)
                                    Image(systemName: "plus")
                                        .font(.system(size: 18, weight: .medium))
                                        .foregroundColor(.blue)
                                }

                                Text("Add New Family Member")
                                    .font(.system(size: 15, weight: .medium))
                                    .foregroundColor(.blue)

                                Spacer()
                            }
                            .padding(AppTheme.Spacing.compact)
                            .background(addMemberBackground)
                            .overlay(addMemberBorder)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(AppTheme.Spacing.medium)
            }
            .background(Color(uiColor: .systemGroupedBackground))
            .navigationTitle("Select Family Member")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        isPresented = false
                    }
                    .font(.system(size: 16, weight: .regular))
                }
            }
        }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
    }

    @ViewBuilder
    private var addMemberBackground: some View {
        if colorScheme == .dark {
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.large, style: .continuous)
                .fill(Color.blue.opacity(0.1))
        } else {
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.large, style: .continuous)
                .fill(Color.blue.opacity(0.05))
        }
    }

    private var addMemberBorder: some View {
        RoundedRectangle(cornerRadius: AppTheme.CornerRadius.large, style: .continuous)
            .stroke(Color.blue.opacity(0.2), lineWidth: 1)
    }
}

struct MemberPickerRow: View {
    let member: FamilyMember
    let isSelected: Bool
    let onSelect: () -> Void
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        Button(action: onSelect) {
            HStack(spacing: AppTheme.Spacing.compact) {
                // Avatar
                ZStack {
                    Circle()
                        .fill(member.relationship.color.opacity(0.15))
                        .frame(width: 44, height: 44)
                    Text(member.name.prefix(1).uppercased())
                        .font(.system(size: 18, weight: .medium))
                        .foregroundColor(member.relationship.color)
                }

                VStack(alignment: .leading, spacing: 2) {
                    Text(member.name)
                        .font(.system(size: 15, weight: .medium))
                        .foregroundColor(.primary)

                    HStack(spacing: 6) {
                        Text(member.relationship.displayName)
                            .font(.system(size: 12, weight: .regular))
                            .foregroundColor(.secondary)

                        if member.holdings > 0 {
                            Text("•")
                                .foregroundColor(Color(uiColor: .tertiaryLabel))
                            Text("\(member.holdings) holdings")
                                .font(.system(size: 12, weight: .regular))
                                .foregroundColor(.secondary)
                        }
                    }
                }

                Spacer()

                if member.portfolioValue > 0 {
                    Text(member.portfolioValue.currencyFormatted)
                        .font(.system(size: 14, weight: .light, design: .rounded))
                        .foregroundColor(.secondary)
                }

                if isSelected {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 20))
                        .foregroundColor(.blue)
                }
            }
            .padding(AppTheme.Spacing.compact)
            .background(rowBackground)
            .overlay(rowBorder)
            .shadow(color: rowShadow, radius: 8, x: 0, y: 2)
        }
        .buttonStyle(.plain)
    }

    private var rowShadow: Color {
        colorScheme == .dark ? .clear : .black.opacity(0.06)
    }

    @ViewBuilder
    private var rowBackground: some View {
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

    private var rowBorder: some View {
        RoundedRectangle(cornerRadius: AppTheme.CornerRadius.large, style: .continuous)
            .stroke(
                isSelected
                    ? Color.blue.opacity(0.5)
                    : (colorScheme == .dark
                        ? Color.white.opacity(0.1)
                        : Color.black.opacity(0.08)),
                lineWidth: isSelected ? 2 : 1
            )
    }
}

#Preview {
    PortfolioInputView()
        .environmentObject(PortfolioStore())
        .environmentObject(FamilyStore())
        .environment(AnalysisProfileStore())
}
