//
//  InvestmentsView.swift
//  SparrowInvest
//
//  iOS 26 Liquid Glass - Tabbed Investments View
//

import SwiftUI

// MARK: - Investment Tab Enum

enum InvestmentTab: String, CaseIterable {
    case portfolio = "Portfolio"
    case sips = "SIPs"
    case transactions = "Transactions"
}

// MARK: - Portfolio Selection Mode

enum PortfolioSelectionMode: Equatable {
    case myPortfolio
    case familyMember(FamilyMember)

    var id: String {
        switch self {
        case .myPortfolio:
            return "my_portfolio"
        case .familyMember(let member):
            return member.id
        }
    }

    var name: String {
        switch self {
        case .myPortfolio:
            return "My Portfolio"
        case .familyMember(let member):
            return member.name
        }
    }

    static func == (lhs: PortfolioSelectionMode, rhs: PortfolioSelectionMode) -> Bool {
        lhs.id == rhs.id
    }
}

// MARK: - Main View

struct InvestmentsView: View {
    @EnvironmentObject var portfolioStore: PortfolioStore
    @EnvironmentObject var fundsStore: FundsStore
    @EnvironmentObject var familyStore: FamilyStore
    @EnvironmentObject var navigationStore: NavigationStore
    @State private var selectedTab: InvestmentTab = .portfolio
    @State private var selectedMode: PortfolioSelectionMode = .myPortfolio
    @State private var viewMode: PortfolioViewMode = .individual
    @State private var selectedFamilyMember: FamilyMember? = nil // nil = All (combined family)
    @State private var showAddHolding = false
    @State private var showAddFamilyMember = false
    @State private var showAddFundToMyPortfolio = false
    @State private var selectedFilter: Holding.AssetClass? = nil

    private var currentPortfolioValue: Double {
        if viewMode == .individual {
            return portfolioStore.portfolio.totalValue
        } else {
            // Family mode
            if let member = selectedFamilyMember {
                return member.portfolioValue
            } else {
                // All family combined
                return familyStore.familyPortfolio.totalValue
            }
        }
    }

    private var currentHoldings: [Holding] {
        if viewMode == .individual {
            return portfolioStore.holdings
        } else {
            // Family mode
            if let member = selectedFamilyMember {
                return familyStore.getHoldings(for: member.id)
            } else {
                // All family combined - get holdings from all members
                return familyStore.familyPortfolio.members.flatMap { member in
                    familyStore.getHoldings(for: member.id)
                }
            }
        }
    }

    var filteredHoldings: [Holding] {
        if let filter = selectedFilter {
            return currentHoldings.filter { $0.assetClass == filter }
        }
        return currentHoldings
    }

    private var currentPortfolio: Portfolio {
        if viewMode == .individual {
            return portfolioStore.portfolio
        } else {
            // Family mode
            if let member = selectedFamilyMember {
                // Individual family member
                let holdings = familyStore.getHoldings(for: member.id)
                let totalValue = holdings.reduce(0) { $0 + $1.currentValue }
                let totalInvested = holdings.reduce(0) { $0 + $1.investedAmount }
                let totalReturns = totalValue - totalInvested
                let returnsPercentage = totalInvested > 0 ? (totalReturns / totalInvested) * 100 : 0

                return Portfolio(
                    totalValue: totalValue,
                    totalInvested: totalInvested,
                    totalReturns: totalReturns,
                    returnsPercentage: returnsPercentage,
                    todayChange: 0,
                    todayChangePercentage: 0,
                    xirr: member.xirr,
                    assetAllocation: familyStore.memberAssetAllocations[member.id] ?? AssetAllocation(equity: 0, debt: 0, hybrid: 0, gold: 0, other: 0),
                    holdings: holdings
                )
            } else {
                // Combined family portfolio
                let familyPortfolio = familyStore.familyPortfolio
                let allHoldings = familyPortfolio.members.flatMap { member in
                    familyStore.getHoldings(for: member.id)
                }
                return Portfolio(
                    totalValue: familyPortfolio.totalValue,
                    totalInvested: familyPortfolio.totalInvested,
                    totalReturns: familyPortfolio.totalReturns,
                    returnsPercentage: familyPortfolio.returnsPercentage,
                    todayChange: 0,
                    todayChangePercentage: 0,
                    xirr: familyPortfolio.familyXIRR,
                    assetAllocation: AssetAllocation(equity: 60, debt: 25, hybrid: 10, gold: 5, other: 0),
                    holdings: allHoldings
                )
            }
        }
    }

    // Helper to check if viewing a specific family member (for edit mode)
    private var isViewingFamilyMember: Bool {
        viewMode == .family && selectedFamilyMember != nil
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Portfolio View Selector (Individual/Family toggle + family member chips)
                PortfolioViewSelector(
                    viewMode: $viewMode,
                    selectedFamilyMember: $selectedFamilyMember,
                    familyMembers: familyStore.familyPortfolio.members,
                    familyPortfolioValue: familyStore.familyPortfolio.totalValue,
                    onMemberChange: {
                        // Reset filter when changing member
                        selectedFilter = nil
                    }
                )
                .padding(.horizontal, AppTheme.Spacing.medium)
                .padding(.top, AppTheme.Spacing.small)

                // Tab Selector
                InvestmentTabSelector(selectedTab: $selectedTab)
                    .padding(.horizontal, AppTheme.Spacing.medium)
                    .padding(.top, AppTheme.Spacing.medium)

                // Tab Content
                ScrollView {
                    VStack(spacing: AppTheme.Spacing.large) {
                        switch selectedTab {
                        case .portfolio:
                            PortfolioTabContent(
                                portfolio: currentPortfolio,
                                holdings: filteredHoldings,
                                selectedFilter: $selectedFilter,
                                canEdit: isViewingFamilyMember,
                                isMyPortfolio: viewMode == .individual,
                                onAddHolding: {
                                    showAddHolding = true
                                },
                                onAddToMyPortfolio: {
                                    showAddFundToMyPortfolio = true
                                },
                                onDeleteHolding: { holding in
                                    if let member = selectedFamilyMember {
                                        familyStore.removeHolding(holding.id, from: member.id)
                                    }
                                }
                            )
                        case .sips:
                            SIPsTabContent(sips: portfolioStore.activeSIPs)
                        case .transactions:
                            TransactionsTabContent(transactions: portfolioStore.transactions)
                        }
                    }
                    .padding(AppTheme.Spacing.medium)
                    .padding(.bottom, AppTheme.Spacing.xxLarge)
                }
            }
            .background(Color(uiColor: .systemGroupedBackground))
            .navigationTitle("Investments")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                // Toolbar intentionally empty - Buy More button is shown inline
            }
            .refreshable {
                await portfolioStore.fetchPortfolio()
                await familyStore.refreshData()
            }
            .sheet(isPresented: $showAddHolding) {
                if let member = selectedFamilyMember {
                    AddHoldingSheet(memberId: member.id)
                }
            }
            .sheet(isPresented: $showAddFamilyMember) {
                AddFamilyMemberSheet()
            }
            .sheet(isPresented: $showAddFundToMyPortfolio) {
                AddHoldingSheet()
            }
        }
    }
}

// MARK: - Add Holding Sheet (Unified)

struct AddHoldingSheet: View {
    // Optional memberId for family member portfolios, nil for My Portfolio
    var memberId: String? = nil

    @Environment(\.dismiss) private var dismiss
    @Environment(\.colorScheme) private var colorScheme
    @EnvironmentObject var fundsStore: FundsStore
    @EnvironmentObject var portfolioStore: PortfolioStore
    @EnvironmentObject var familyStore: FamilyStore

    @State private var fundSearchText = ""
    @State private var fundCode = ""
    @State private var selectedFund: Fund?
    @State private var units = ""
    @State private var investedAmount = ""
    @State private var currentNav = ""
    @State private var selectedAssetClass: Holding.AssetClass = .equity
    @State private var showSuggestions = false
    @FocusState private var isFundFieldFocused: Bool

    private var filteredFunds: [Fund] {
        guard !fundSearchText.isEmpty else { return [] }
        let searchTerm = fundSearchText.lowercased()
        return fundsStore.funds
            .filter { $0.schemeName.lowercased().contains(searchTerm) }
            .prefix(8)
            .map { $0 }
    }

    private var isValid: Bool {
        !fundSearchText.isEmpty &&
        Double(units) ?? 0 > 0 &&
        Double(investedAmount) ?? 0 > 0 &&
        Double(currentNav) ?? 0 > 0
    }

    private var calculatedValues: (currentValue: Double, returns: Double, returnsPercentage: Double) {
        let unitsVal = Double(units) ?? 0
        let navVal = Double(currentNav) ?? 0
        let investedVal = Double(investedAmount) ?? 0

        let currentValue = unitsVal * navVal
        let returns = currentValue - investedVal
        let returnsPercentage = investedVal > 0 ? (returns / investedVal) * 100 : 0

        return (currentValue, returns, returnsPercentage)
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: AppTheme.Spacing.large) {
                    fundSearchCard
                    investmentDetailsCard
                    calculatedSummaryCard
                    addButton
                }
                .padding(AppTheme.Spacing.medium)
            }
            .background(Color(uiColor: .systemGroupedBackground))
            .navigationTitle("Add Holding")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }
            }
            .onTapGesture {
                isFundFieldFocused = false
                showSuggestions = false
            }
        }
    }

    // MARK: - Fund Search Card

    private var fundSearchCard: some View {
        VStack(spacing: AppTheme.Spacing.medium) {
            fundNameField
            fundCodeField
            assetClassPicker
        }
        .padding(AppTheme.Spacing.medium)
        .background(cardBackground)
        .overlay(cardBorder)
    }

    private var fundCodeField: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("FUND CODE (OPTIONAL)")
                .font(.system(size: 11, weight: .regular))
                .foregroundColor(.secondary)
                .tracking(0.5)

            TextField("e.g., 119598", text: $fundCode)
                .font(.system(size: 15, weight: .regular))
                .keyboardType(.numberPad)
                .padding(AppTheme.Spacing.compact)
                .background(
                    colorScheme == .dark ? Color.white.opacity(0.06) : Color(uiColor: .tertiarySystemFill),
                    in: RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
                )
        }
    }

    private var fundNameField: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("FUND NAME")
                .font(.system(size: 11, weight: .regular))
                .foregroundColor(.secondary)
                .tracking(0.5)

            TextField("Search fund name...", text: $fundSearchText)
                .font(.system(size: 15, weight: .regular))
                .focused($isFundFieldFocused)
                .padding(AppTheme.Spacing.compact)
                .background(
                    colorScheme == .dark ? Color.white.opacity(0.06) : Color(uiColor: .tertiarySystemFill),
                    in: RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
                )
                .onChange(of: fundSearchText) { _, newValue in
                    showSuggestions = !newValue.isEmpty && isFundFieldFocused
                    if newValue.isEmpty { selectedFund = nil }
                }
                .onChange(of: isFundFieldFocused) { _, focused in
                    showSuggestions = focused && !fundSearchText.isEmpty
                }

            fundSuggestionsList
            selectedFundInfo
        }
    }

    @ViewBuilder
    private var fundSuggestionsList: some View {
        if showSuggestions && !filteredFunds.isEmpty {
            VStack(spacing: 0) {
                ForEach(filteredFunds) { fund in
                    FundSuggestionRow(fund: fund) { selectFund(fund) }
                    if fund.id != filteredFunds.last?.id { Divider() }
                }
            }
            .background(
                colorScheme == .dark ? Color.black.opacity(0.6) : Color.white,
                in: RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
            )
            .overlay(
                RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
                    .stroke(colorScheme == .dark ? Color.white.opacity(0.15) : Color.black.opacity(0.1), lineWidth: 1)
            )
            .shadow(color: colorScheme == .dark ? .clear : .black.opacity(0.1), radius: 8, y: 4)
        }
    }

    @ViewBuilder
    private var selectedFundInfo: some View {
        if let fund = selectedFund {
            HStack(spacing: 8) {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundColor(.green)
                    .font(.system(size: 14))
                Text(fund.fundHouse ?? fund.category ?? "")
                    .font(.system(size: 12, weight: .light))
                    .foregroundColor(.secondary)
                Spacer()
                Text("NAV: ₹\(String(format: "%.2f", fund.nav))")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(.blue)
            }
            .padding(.top, 4)
        }
    }

    private var assetClassPicker: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("ASSET CLASS")
                .font(.system(size: 11, weight: .regular))
                .foregroundColor(.secondary)
                .tracking(0.5)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: AppTheme.Spacing.small) {
                    ForEach([Holding.AssetClass.equity, .debt, .hybrid, .gold], id: \.self) { assetClass in
                        assetClassChip(assetClass)
                    }
                }
            }
        }
    }

    // MARK: - Investment Details Card

    private var investmentDetailsCard: some View {
        VStack(spacing: AppTheme.Spacing.medium) {
            formField(title: "Units", placeholder: "e.g., 150.254", text: $units, keyboardType: .decimalPad)
            formField(title: "Invested Amount", placeholder: "e.g., 50000", text: $investedAmount, keyboardType: .decimalPad)
            formField(title: "Current NAV", placeholder: "e.g., 425.50", text: $currentNav, keyboardType: .decimalPad)
        }
        .padding(AppTheme.Spacing.medium)
        .background(cardBackground)
        .overlay(cardBorder)
    }

    // MARK: - Calculated Summary Card

    @ViewBuilder
    private var calculatedSummaryCard: some View {
        if isValid {
            let calc = calculatedValues
            let returnsColor: Color = calc.returns >= 0 ? .green : .red
            VStack(spacing: AppTheme.Spacing.compact) {
                HStack {
                    Text("CALCULATED VALUES")
                        .font(.system(size: 11, weight: .regular))
                        .foregroundColor(.secondary)
                        .tracking(0.5)
                    Spacer()
                }

                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Current Value")
                            .font(.system(size: 12, weight: .regular))
                            .foregroundColor(.secondary)
                        Text(calc.currentValue.currencyFormatted)
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(.primary)
                    }
                    Spacer()
                    VStack(alignment: .trailing, spacing: 4) {
                        Text("Returns")
                            .font(.system(size: 12, weight: .regular))
                            .foregroundColor(.secondary)
                        HStack(spacing: 4) {
                            Text(calc.returns.currencyFormatted)
                                .font(.system(size: 16, weight: .semibold))
                            Text("(\(calc.returnsPercentage.percentFormatted))")
                                .font(.system(size: 13, weight: .medium))
                        }
                        .foregroundColor(returnsColor)
                    }
                }
            }
            .padding(AppTheme.Spacing.medium)
            .background(
                RoundedRectangle(cornerRadius: AppTheme.CornerRadius.large, style: .continuous)
                    .fill(returnsColor.opacity(0.08))
            )
            .overlay(
                RoundedRectangle(cornerRadius: AppTheme.CornerRadius.large, style: .continuous)
                    .stroke(returnsColor.opacity(0.2), lineWidth: 1)
            )
        }
    }

    // MARK: - Add Button

    private var addButton: some View {
        Button { addHolding() } label: {
            Text("Add Holding")
                .font(.system(size: 16, weight: .semibold))
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .background(
                    LinearGradient(colors: [.blue, .cyan], startPoint: .leading, endPoint: .trailing),
                    in: RoundedRectangle(cornerRadius: 14, style: .continuous)
                )
        }
        .disabled(!isValid)
        .opacity(isValid ? 1 : 0.6)
    }

    private func selectFund(_ fund: Fund) {
        selectedFund = fund
        fundSearchText = fund.schemeName
        fundCode = fund.id
        currentNav = String(format: "%.2f", fund.nav)
        showSuggestions = false
        isFundFieldFocused = false

        // Auto-select asset class based on fund
        let category = (fund.category ?? "").lowercased()
        if category.contains("debt") || category.contains("liquid") || category.contains("money market") {
            selectedAssetClass = .debt
        } else if category.contains("hybrid") || category.contains("balanced") {
            selectedAssetClass = .hybrid
        } else if category.contains("gold") || category.contains("commodity") {
            selectedAssetClass = .gold
        } else {
            selectedAssetClass = .equity
        }
    }

    private func formField(title: String, placeholder: String, text: Binding<String>, keyboardType: UIKeyboardType = .default) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title.uppercased())
                .font(.system(size: 11, weight: .regular))
                .foregroundColor(.secondary)
                .tracking(0.5)

            TextField(placeholder, text: text)
                .font(.system(size: 15, weight: .regular))
                .keyboardType(keyboardType)
                .padding(AppTheme.Spacing.compact)
                .background(
                    colorScheme == .dark
                        ? Color.white.opacity(0.06)
                        : Color(uiColor: .tertiarySystemFill),
                    in: RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
                )
        }
    }

    private func assetClassChip(_ assetClass: Holding.AssetClass) -> some View {
        Button {
            selectedAssetClass = assetClass
        } label: {
            HStack(spacing: 6) {
                Circle()
                    .fill(assetClass.color)
                    .frame(width: 8, height: 8)
                Text(assetClass.rawValue.capitalized)
                    .font(.system(size: 13, weight: .regular))
            }
            .foregroundColor(selectedAssetClass == assetClass ? .white : .primary)
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .background(
                selectedAssetClass == assetClass
                    ? AnyShapeStyle(assetClass.color)
                    : AnyShapeStyle(colorScheme == .dark ? Color.white.opacity(0.08) : Color(uiColor: .tertiarySystemFill)),
                in: Capsule()
            )
        }
    }

    private func addHolding() {
        let unitsVal = Double(units) ?? 0
        let investedVal = Double(investedAmount) ?? 0
        let navVal = Double(currentNav) ?? 0
        let calc = calculatedValues

        let fundName = selectedFund?.schemeName ?? fundSearchText
        // Use user-entered fundCode if provided, otherwise use selectedFund?.id or generate UUID
        let resolvedFundCode = !fundCode.isEmpty ? fundCode : (selectedFund?.id ?? UUID().uuidString)

        let holding = Holding(
            id: UUID().uuidString,
            fundCode: resolvedFundCode,
            fundName: fundName,
            category: selectedFund?.category ?? selectedAssetClass.rawValue.capitalized,
            assetClass: selectedAssetClass,
            units: unitsVal,
            averageNav: investedVal / unitsVal,
            currentNav: navVal,
            investedAmount: investedVal,
            currentValue: calc.currentValue,
            returns: calc.returns,
            returnsPercentage: calc.returnsPercentage
        )

        // Route to correct store based on memberId
        if let memberId = memberId {
            familyStore.addHolding(holding, to: memberId)
        } else {
            portfolioStore.addHolding(holding)
        }
        dismiss()
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

// MARK: - Fund Suggestion Row

struct FundSuggestionRow: View {
    let fund: Fund
    let onSelect: () -> Void

    var body: some View {
        Button(action: onSelect) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(fund.schemeName)
                        .font(.system(size: 14, weight: .regular))
                        .foregroundColor(.primary)
                        .lineLimit(1)
                    Text(fund.category ?? fund.assetClass.capitalized)
                        .font(.system(size: 11, weight: .light))
                        .foregroundColor(.secondary)
                }
                Spacer()
                Text("₹\(String(format: "%.2f", fund.nav))")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(.blue)
            }
            .padding(.vertical, 10)
            .padding(.horizontal, 12)
        }
    }
}

// MARK: - Portfolio View Selector (Pill Toggle + Family Member Chips)

struct PortfolioViewSelector: View {
    @Binding var viewMode: PortfolioViewMode
    @Binding var selectedFamilyMember: FamilyMember?
    let familyMembers: [FamilyMember]
    let familyPortfolioValue: Double
    let onMemberChange: () -> Void

    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        VStack(spacing: AppTheme.Spacing.compact) {
            // Individual/Family Toggle (pill style)
            viewModeToggle

            // Family Member Selector (when Family mode)
            if viewMode == .family {
                familyMemberScroll
            }
        }
    }

    // MARK: - View Mode Toggle

    private var viewModeToggle: some View {
        HStack(spacing: 4) {
            ForEach(PortfolioViewMode.allCases, id: \.self) { mode in
                Button {
                    withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                        viewMode = mode
                        if mode == .individual {
                            selectedFamilyMember = nil
                        }
                        onMemberChange()
                    }
                } label: {
                    Text(mode.rawValue)
                        .font(.system(size: 13, weight: .regular))
                        .foregroundColor(viewMode == mode ? .white : .secondary)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 8)
                        .background {
                            if viewMode == mode {
                                Capsule()
                                    .fill(Color.blue)
                            }
                        }
                }
            }
        }
        .padding(4)
        .background(toggleBackground)
        .overlay(toggleBorder)
        .shadow(color: toggleShadow, radius: 8, x: 0, y: 2)
    }

    // MARK: - Family Member Scroll

    private var familyMemberScroll: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: AppTheme.Spacing.small) {
                // "All" option (combined family portfolio)
                FamilyMemberChip(
                    member: nil,
                    isSelected: selectedFamilyMember == nil,
                    onTap: {
                        withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                            selectedFamilyMember = nil
                            onMemberChange()
                        }
                    }
                )

                // Individual family members
                ForEach(familyMembers) { member in
                    FamilyMemberChip(
                        member: member,
                        isSelected: selectedFamilyMember?.id == member.id,
                        onTap: {
                            withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                                selectedFamilyMember = member
                                onMemberChange()
                            }
                        }
                    )
                }
            }
            .padding(.horizontal, 2)
        }
        .padding(.top, AppTheme.Spacing.small)
    }

    // MARK: - Toggle Styling

    private var toggleShadow: Color {
        colorScheme == .dark ? .clear : .black.opacity(0.04)
    }

    @ViewBuilder
    private var toggleBackground: some View {
        if colorScheme == .dark {
            Capsule()
                .fill(Color.black.opacity(0.4))
                .background(Capsule().fill(.ultraThinMaterial))
        } else {
            Capsule().fill(Color.white)
        }
    }

    private var toggleBorder: some View {
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

// MARK: - Family Member Chip

struct FamilyMemberChip: View {
    let member: FamilyMember? // nil = "All"
    let isSelected: Bool
    let onTap: () -> Void

    @Environment(\.colorScheme) private var colorScheme

    private var chipColor: Color {
        if let member = member {
            return member.relationship.color
        }
        return .purple // Color for "All" option
    }

    private var displayName: String {
        if let member = member {
            // Use short name (first name or nickname)
            let components = member.name.components(separatedBy: " ")
            return components.first ?? member.name
        }
        return "All"
    }

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 6) {
                // Icon or initial
                if member == nil {
                    Image(systemName: "person.3.fill")
                        .font(.system(size: 12, weight: .regular))
                } else {
                    Text(displayName.prefix(1).uppercased())
                        .font(.system(size: 12, weight: .medium))
                }

                Text(displayName)
                    .font(.system(size: 13, weight: .regular))
            }
            .foregroundColor(isSelected ? .white : (colorScheme == .dark ? .primary : chipColor))
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .background(chipBackground)
            .overlay(chipBorder)
            .shadow(color: chipShadow, radius: 6, x: 0, y: 2)
        }
        .buttonStyle(.plain)
    }

    private var chipShadow: Color {
        if isSelected { return .clear }
        return colorScheme == .dark ? .clear : .black.opacity(0.04)
    }

    @ViewBuilder
    private var chipBackground: some View {
        if isSelected {
            Capsule().fill(chipColor)
        } else if colorScheme == .dark {
            Capsule()
                .fill(Color.black.opacity(0.4))
                .background(Capsule().fill(.ultraThinMaterial))
        } else {
            Capsule().fill(Color.white)
        }
    }

    @ViewBuilder
    private var chipBorder: some View {
        if isSelected {
            Capsule().stroke(Color.clear, lineWidth: 0)
        } else {
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
}

// MARK: - Portfolio Member Selector Button (Legacy - kept for reference)

struct PortfolioMemberSelectorButton: View {
    let selectedMode: PortfolioSelectionMode
    let portfolioValue: Double
    let onTap: () -> Void
    @Environment(\.colorScheme) private var colorScheme

    private var relationshipColor: Color {
        switch selectedMode {
        case .myPortfolio:
            return .blue
        case .familyMember(let member):
            return member.relationship.color
        }
    }

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: AppTheme.Spacing.compact) {
                // Avatar
                ZStack {
                    Circle()
                        .fill(relationshipColor.opacity(0.15))
                        .frame(width: 40, height: 40)
                    if case .familyMember(let member) = selectedMode {
                        Text(member.name.prefix(1).uppercased())
                            .font(.system(size: 16, weight: .medium))
                            .foregroundColor(relationshipColor)
                    } else {
                        Image(systemName: "person.fill")
                            .font(.system(size: 16, weight: .medium))
                            .foregroundColor(relationshipColor)
                    }
                }

                VStack(alignment: .leading, spacing: 2) {
                    Text("VIEWING")
                        .font(.system(size: 10, weight: .regular))
                        .foregroundColor(.secondary)
                        .tracking(1)

                    Text(selectedMode.name)
                        .font(.system(size: 16, weight: .light))
                        .foregroundColor(.primary)
                }

                Spacer()

                Text(portfolioValue.currencyFormatted)
                    .font(.system(size: 14, weight: .light, design: .rounded))
                    .foregroundColor(.blue)

                Image(systemName: "chevron.down")
                    .font(.system(size: 12, weight: .light))
                    .foregroundColor(.secondary)
            }
            .padding(.horizontal, AppTheme.Spacing.medium)
            .padding(.vertical, AppTheme.Spacing.compact)
            .background(selectorBackground)
            .overlay(selectorBorder)
            .shadow(color: selectorShadow, radius: 8, x: 0, y: 2)
        }
        .buttonStyle(.plain)
    }

    private var selectorShadow: Color {
        colorScheme == .dark ? .clear : .black.opacity(0.06)
    }

    @ViewBuilder
    private var selectorBackground: some View {
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

    private var selectorBorder: some View {
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

// MARK: - Investment Tab Selector

struct InvestmentTabSelector: View {
    @Binding var selectedTab: InvestmentTab
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        HStack(spacing: 0) {
            ForEach(InvestmentTab.allCases, id: \.self) { tab in
                Button(action: {
                    withAnimation(.easeInOut(duration: 0.2)) {
                        selectedTab = tab
                    }
                }) {
                    VStack(spacing: 6) {
                        Text(tab.rawValue)
                            .font(.system(size: 14, weight: selectedTab == tab ? .regular : .light))
                            .foregroundColor(selectedTab == tab ? .blue : .secondary)

                        // Indicator
                        RoundedRectangle(cornerRadius: 1.5)
                            .fill(selectedTab == tab ? Color.blue : Color.clear)
                            .frame(height: 2)
                    }
                }
                .frame(maxWidth: .infinity)
            }
        }
        .padding(.vertical, AppTheme.Spacing.small)
        .background(tabBackground)
        .overlay(tabBorder)
        .shadow(color: tabShadow, radius: 8, x: 0, y: 2)
    }

    private var tabShadow: Color {
        colorScheme == .dark ? .clear : .black.opacity(0.04)
    }

    @ViewBuilder
    private var tabBackground: some View {
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

    private var tabBorder: some View {
        RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
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

// MARK: - Portfolio Tab Content

struct PortfolioTabContent: View {
    let portfolio: Portfolio
    let holdings: [Holding]
    @Binding var selectedFilter: Holding.AssetClass?
    var canEdit: Bool = false
    var isMyPortfolio: Bool = false
    var onAddHolding: (() -> Void)?
    var onAddToMyPortfolio: (() -> Void)?
    var onDeleteHolding: ((Holding) -> Void)?

    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        VStack(spacing: AppTheme.Spacing.large) {
            // Portfolio Summary Card
            InvestmentSummaryCard(portfolio: portfolio)

            // Asset Filter Pills
            AssetFilterPills(selectedFilter: $selectedFilter)

            // Holdings List
            VStack(alignment: .leading, spacing: AppTheme.Spacing.compact) {
                HStack {
                    Text("HOLDINGS")
                        .font(.system(size: 11, weight: .regular))
                        .foregroundColor(.blue)
                        .tracking(1)

                    Spacer()

                    if canEdit {
                        Button {
                            onAddHolding?()
                        } label: {
                            HStack(spacing: 4) {
                                Image(systemName: "plus.circle.fill")
                                    .font(.system(size: 12))
                                Text("Add")
                                    .font(.system(size: 12, weight: .medium))
                            }
                            .foregroundColor(.blue)
                        }
                    } else {
                        Text("\(holdings.count) funds")
                            .font(.system(size: 12, weight: .light))
                            .foregroundColor(.secondary)
                    }
                }

                if holdings.isEmpty {
                    if canEdit {
                        EditableEmptyHoldingsView(onAddHolding: onAddHolding)
                    } else if isMyPortfolio {
                        EmptyHoldingsViewWithAction(onAddHolding: onAddToMyPortfolio)
                    } else {
                        EmptyHoldingsView()
                    }
                } else {
                    ForEach(holdings) { holding in
                        if canEdit {
                            EditableHoldingCard(
                                holding: holding,
                                onDelete: {
                                    onDeleteHolding?(holding)
                                }
                            )
                        } else {
                            NavigationLink(destination: FundDetailView(fund: holding.toFund())) {
                                HoldingCard(holding: holding)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
            }

            // Buy More Button for My Portfolio or Family Member
            if (isMyPortfolio || canEdit) && !holdings.isEmpty {
                Button(action: {
                    if canEdit {
                        onAddHolding?()
                    } else {
                        onAddToMyPortfolio?()
                    }
                }) {
                    HStack {
                        Image(systemName: "plus.circle.fill")
                            .font(.system(size: 18, weight: .light))
                        Text("Buy More")
                            .font(.system(size: 14, weight: .regular))
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(
                        LinearGradient(
                            colors: [.blue, .cyan],
                            startPoint: .leading,
                            endPoint: .trailing
                        ),
                        in: RoundedRectangle(cornerRadius: AppTheme.CornerRadius.large, style: .continuous)
                    )
                    .foregroundColor(.white)
                }
            }
        }
    }
}

// MARK: - Editable Holding Card

struct EditableHoldingCard: View {
    let holding: Holding
    var onDelete: (() -> Void)?

    @Environment(\.colorScheme) private var colorScheme
    @State private var showDeleteConfirm = false

    var body: some View {
        VStack(spacing: AppTheme.Spacing.compact) {
            HStack(alignment: .top, spacing: AppTheme.Spacing.compact) {
                // Fund Icon
                ZStack {
                    RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
                        .fill(holding.assetClass.color.opacity(0.1))
                        .frame(width: 48, height: 48)

                    Text(holding.fundName.prefix(2).uppercased())
                        .font(.system(size: 12, weight: .light))
                        .foregroundColor(holding.assetClass.color)
                }

                // Fund Info
                VStack(alignment: .leading, spacing: 4) {
                    Text(holding.fundName)
                        .font(.system(size: 14, weight: .regular))
                        .foregroundColor(.primary)
                        .lineLimit(1)

                    HStack(spacing: 6) {
                        Text(holding.category)
                            .font(.system(size: 12, weight: .light))
                            .foregroundColor(.secondary)

                        Text("•")
                            .foregroundColor(Color(uiColor: .tertiaryLabel))

                        Text("\(String(format: "%.3f", holding.units)) units")
                            .font(.system(size: 12, weight: .light))
                            .foregroundColor(.secondary)
                    }
                }

                Spacer()

                // Returns
                VStack(alignment: .trailing, spacing: 4) {
                    Text(holding.currentValue.currencyFormatted)
                        .font(.system(size: 14, weight: .light))
                        .foregroundColor(.primary)

                    HStack(spacing: 2) {
                        Image(systemName: holding.returns >= 0 ? "arrow.up.right" : "arrow.down.right")
                            .font(.system(size: 10, weight: .regular))
                        Text(holding.returnsPercentage.percentFormatted)
                            .font(.system(size: 12, weight: .regular))
                    }
                    .foregroundColor(holding.returns >= 0 ? .green : .red)
                }

                // Delete button
                Button {
                    showDeleteConfirm = true
                } label: {
                    Image(systemName: "trash")
                        .font(.system(size: 14))
                        .foregroundColor(.red.opacity(0.7))
                        .padding(8)
                }
            }
        }
        .padding(AppTheme.Spacing.medium)
        .background(cardBackground)
        .overlay(cardBorder)
        .shadow(color: cardShadow, radius: 12, x: 0, y: 4)
        .confirmationDialog("Delete Holding", isPresented: $showDeleteConfirm) {
            Button("Delete", role: .destructive) {
                onDelete?()
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("Are you sure you want to delete this holding?")
        }
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

// MARK: - Editable Empty Holdings View

struct EditableEmptyHoldingsView: View {
    var onAddHolding: (() -> Void)?
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        VStack(spacing: AppTheme.Spacing.medium) {
            Image(systemName: "chart.pie")
                .font(.system(size: 48, weight: .ultraLight))
                .foregroundColor(Color(uiColor: .tertiaryLabel))

            Text("No holdings yet")
                .font(.system(size: 16, weight: .light))
                .foregroundColor(.secondary)

            Text("Add mutual fund holdings to track this portfolio")
                .font(.system(size: 14, weight: .light))
                .foregroundColor(Color(uiColor: .tertiaryLabel))
                .multilineTextAlignment(.center)

            Button {
                onAddHolding?()
            } label: {
                HStack(spacing: 6) {
                    Image(systemName: "plus.circle.fill")
                    Text("Add First Holding")
                }
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(.white)
                .padding(.horizontal, 20)
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
            .padding(.top, 8)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 48)
        .background(emptyBackground)
        .overlay(emptyBorder)
        .shadow(color: emptyShadow, radius: 12, x: 0, y: 4)
    }

    private var emptyShadow: Color {
        colorScheme == .dark ? .clear : .black.opacity(0.08)
    }

    @ViewBuilder
    private var emptyBackground: some View {
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

    private var emptyBorder: some View {
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

// MARK: - SIPs Tab Content

struct SIPsTabContent: View {
    let sips: [SIP]

    private var totalMonthlyAmount: Double {
        sips.filter { $0.isActive }.reduce(0) { $0 + $1.amount }
    }

    private var activeSIPsCount: Int {
        sips.filter { $0.isActive }.count
    }

    var body: some View {
        VStack(spacing: AppTheme.Spacing.large) {
            // SIP Summary
            VStack(spacing: AppTheme.Spacing.medium) {
                HStack(spacing: AppTheme.Spacing.medium) {
                    SIPStatCard(
                        title: "Active SIPs",
                        value: "\(activeSIPsCount)",
                        icon: "repeat.circle.fill",
                        color: .green
                    )

                    SIPStatCard(
                        title: "Monthly",
                        value: totalMonthlyAmount.currencyFormatted,
                        icon: "calendar",
                        color: .blue
                    )
                }
            }

            // SIP List
            VStack(alignment: .leading, spacing: AppTheme.Spacing.compact) {
                Text("YOUR SIPS")
                    .font(.system(size: 11, weight: .regular))
                    .foregroundColor(.blue)
                    .tracking(1)

                if sips.isEmpty {
                    InvestmentsEmptySIPsView()
                } else {
                    ForEach(sips) { sip in
                        InvestmentSIPCard(sip: sip)
                    }
                }
            }

            // Start New SIP Button
            Button(action: {}) {
                HStack {
                    Image(systemName: "plus.circle.fill")
                        .font(.system(size: 18, weight: .light))
                    Text("Start New SIP")
                        .font(.system(size: 14, weight: .regular))
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .background(
                    LinearGradient(
                        colors: [.blue, .cyan],
                        startPoint: .leading,
                        endPoint: .trailing
                    ),
                    in: RoundedRectangle(cornerRadius: AppTheme.CornerRadius.large, style: .continuous)
                )
                .foregroundColor(.white)
            }
        }
    }
}

// MARK: - SIP Stat Card

struct SIPStatCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.small) {
            Image(systemName: icon)
                .font(.system(size: 20, weight: .light))
                .foregroundColor(color)

            Text(title)
                .font(.system(size: 11, weight: .regular))
                .foregroundColor(.secondary)

            Text(value)
                .font(.system(size: 18, weight: .light, design: .rounded))
                .foregroundColor(.primary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
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

// MARK: - Investment SIP Card

struct InvestmentSIPCard: View {
    let sip: SIP
    @Environment(\.colorScheme) private var colorScheme

    private var nextDateFormatted: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "d MMM"
        return formatter.string(from: sip.nextDate)
    }

    var body: some View {
        VStack(spacing: AppTheme.Spacing.compact) {
            HStack(alignment: .top, spacing: AppTheme.Spacing.compact) {
                // Fund Icon
                ZStack {
                    RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
                        .fill(Color.green.opacity(0.1))
                        .frame(width: 44, height: 44)

                    Image(systemName: "repeat.circle.fill")
                        .font(.system(size: 18, weight: .light))
                        .foregroundColor(.green)
                }

                VStack(alignment: .leading, spacing: 2) {
                    Text(sip.fundName)
                        .font(.system(size: 14, weight: .regular))
                        .foregroundColor(.primary)
                        .lineLimit(1)

                    Text("\(sip.frequency.rawValue.capitalized) • \(sip.sipCount) installments")
                        .font(.system(size: 12, weight: .light))
                        .foregroundColor(.secondary)
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 2) {
                    Text(sip.amount.currencyFormatted)
                        .font(.system(size: 14, weight: .light, design: .rounded))
                        .foregroundColor(.primary)

                    Text("Next: \(nextDateFormatted)")
                        .font(.system(size: 11, weight: .light))
                        .foregroundColor(.blue)
                }
            }

            // Status Badge
            HStack {
                Spacer()

                Text(sip.status.rawValue.uppercased())
                    .font(.system(size: 10, weight: .regular))
                    .foregroundColor(sip.isActive ? .green : .secondary)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(
                        Capsule()
                            .fill(sip.isActive ? Color.green.opacity(0.1) : Color.secondary.opacity(0.1))
                    )
            }
        }
        .padding(AppTheme.Spacing.medium)
        .background(sipCardBackground)
        .overlay(sipCardBorder)
        .shadow(color: sipCardShadow, radius: 12, x: 0, y: 4)
    }

    private var sipCardShadow: Color {
        colorScheme == .dark ? .clear : .black.opacity(0.08)
    }

    @ViewBuilder
    private var sipCardBackground: some View {
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

    private var sipCardBorder: some View {
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

// MARK: - Transactions Tab Content

struct TransactionsTabContent: View {
    let transactions: [Transaction]

    private var groupedTransactions: [(String, [Transaction])] {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMMM yyyy"

        let grouped = Dictionary(grouping: transactions) { transaction in
            formatter.string(from: transaction.date)
        }

        return grouped.sorted { $0.key > $1.key }
    }

    var body: some View {
        VStack(spacing: AppTheme.Spacing.large) {
            if transactions.isEmpty {
                EmptyTransactionsView()
            } else {
                ForEach(groupedTransactions, id: \.0) { month, monthTransactions in
                    VStack(alignment: .leading, spacing: AppTheme.Spacing.compact) {
                        Text(month.uppercased())
                            .font(.system(size: 11, weight: .regular))
                            .foregroundColor(.blue)
                            .tracking(1)

                        ForEach(monthTransactions) { transaction in
                            TransactionCard(transaction: transaction)
                        }
                    }
                }
            }
        }
    }
}

// MARK: - Transaction Card

struct TransactionCard: View {
    let transaction: Transaction
    @Environment(\.colorScheme) private var colorScheme

    private var dateFormatted: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "d MMM"
        return formatter.string(from: transaction.date)
    }

    private var typeIcon: String {
        switch transaction.type {
        case .purchase, .sipInstallment:
            return "arrow.down.circle.fill"
        case .redemption:
            return "arrow.up.circle.fill"
        case .switchIn:
            return "arrow.right.circle.fill"
        case .switchOut:
            return "arrow.left.circle.fill"
        case .dividend:
            return "indianrupeesign.circle.fill"
        }
    }

    private var typeColor: Color {
        switch transaction.type {
        case .purchase, .sipInstallment, .dividend, .switchIn:
            return .green
        case .redemption, .switchOut:
            return .orange
        }
    }

    var body: some View {
        HStack(spacing: AppTheme.Spacing.compact) {
            // Type Icon
            ZStack {
                RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
                    .fill(typeColor.opacity(0.1))
                    .frame(width: 44, height: 44)

                Image(systemName: typeIcon)
                    .font(.system(size: 18, weight: .light))
                    .foregroundColor(typeColor)
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(transaction.fundName)
                    .font(.system(size: 14, weight: .regular))
                    .foregroundColor(.primary)
                    .lineLimit(1)

                HStack(spacing: 4) {
                    Text(transaction.type.displayName)
                        .font(.system(size: 12, weight: .light))
                        .foregroundColor(typeColor)

                    Text("•")
                        .foregroundColor(Color(uiColor: .tertiaryLabel))

                    Text(dateFormatted)
                        .font(.system(size: 12, weight: .light))
                        .foregroundColor(.secondary)
                }
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 2) {
                Text(transaction.type == .redemption ? "-\(transaction.amount.currencyFormatted)" : "+\(transaction.amount.currencyFormatted)")
                    .font(.system(size: 14, weight: .light, design: .rounded))
                    .foregroundColor(transaction.type == .redemption ? .orange : .green)

                if transaction.units > 0 {
                    Text("\(String(format: "%.2f", transaction.units)) units")
                        .font(.system(size: 11, weight: .light))
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding(AppTheme.Spacing.medium)
        .background(txCardBackground)
        .overlay(txCardBorder)
        .shadow(color: txCardShadow, radius: 12, x: 0, y: 4)
    }

    private var txCardShadow: Color {
        colorScheme == .dark ? .clear : .black.opacity(0.08)
    }

    @ViewBuilder
    private var txCardBackground: some View {
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

    private var txCardBorder: some View {
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

// MARK: - Empty States

struct InvestmentsEmptySIPsView: View {
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        VStack(spacing: AppTheme.Spacing.medium) {
            Image(systemName: "repeat.circle")
                .font(.system(size: 48, weight: .ultraLight))
                .foregroundColor(Color(uiColor: .tertiaryLabel))

            Text("No active SIPs")
                .font(.system(size: 16, weight: .light))
                .foregroundColor(.secondary)

            Text("Start a SIP to build wealth systematically")
                .font(.system(size: 14, weight: .light))
                .foregroundColor(Color(uiColor: .tertiaryLabel))
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 48)
        .background(emptySIPBackground)
        .overlay(emptySIPBorder)
        .shadow(color: emptySIPShadow, radius: 12, x: 0, y: 4)
    }

    private var emptySIPShadow: Color {
        colorScheme == .dark ? .clear : .black.opacity(0.08)
    }

    @ViewBuilder
    private var emptySIPBackground: some View {
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

    private var emptySIPBorder: some View {
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

struct EmptyTransactionsView: View {
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        VStack(spacing: AppTheme.Spacing.medium) {
            Image(systemName: "list.bullet.rectangle")
                .font(.system(size: 48, weight: .ultraLight))
                .foregroundColor(Color(uiColor: .tertiaryLabel))

            Text("No transactions yet")
                .font(.system(size: 16, weight: .light))
                .foregroundColor(.secondary)

            Text("Your transaction history will appear here")
                .font(.system(size: 14, weight: .light))
                .foregroundColor(Color(uiColor: .tertiaryLabel))
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 48)
        .background(emptyTxBackground)
        .overlay(emptyTxBorder)
        .shadow(color: emptyTxShadow, radius: 12, x: 0, y: 4)
    }

    private var emptyTxShadow: Color {
        colorScheme == .dark ? .clear : .black.opacity(0.08)
    }

    @ViewBuilder
    private var emptyTxBackground: some View {
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

    private var emptyTxBorder: some View {
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

// MARK: - Existing Components (Updated)

struct InvestmentSummaryCard: View {
    let portfolio: Portfolio
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        VStack(spacing: AppTheme.Spacing.medium) {
            // Current Value
            VStack(spacing: 4) {
                Text("Current Value")
                    .font(.system(size: 14, weight: .light))
                    .foregroundColor(.secondary)

                Text(portfolio.totalValue.currencyFormatted)
                    .font(.system(size: 32, weight: .light, design: .rounded))
                    .foregroundColor(.primary)

                HStack(spacing: 4) {
                    Image(systemName: portfolio.totalReturns >= 0 ? "arrow.up.right" : "arrow.down.right")
                        .font(.system(size: 12, weight: .regular))
                    Text("\(portfolio.totalReturns.currencyFormatted) (\(portfolio.returnsPercentage.percentFormatted))")
                        .font(.system(size: 14, weight: .regular))
                }
                .foregroundColor(portfolio.totalReturns >= 0 ? .green : .red)
            }

            Divider()

            // Stats Row
            HStack(spacing: 0) {
                StatItem(title: "Invested", value: portfolio.totalInvested.currencyFormatted)
                Divider().frame(height: 40)
                StatItem(title: "Today", value: portfolio.todayChange >= 0 ? "+\(portfolio.todayChange.currencyFormatted)" : portfolio.todayChange.currencyFormatted, color: portfolio.todayChange >= 0 ? .green : .red)
                Divider().frame(height: 40)
                StatItem(title: "XIRR", value: "\((portfolio.xirr ?? 0).percentFormatted)", color: .blue)
            }
        }
        .padding(AppTheme.Spacing.large)
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

struct StatItem: View {
    let title: String
    let value: String
    var color: Color = .primary

    var body: some View {
        VStack(spacing: 4) {
            Text(title)
                .font(.system(size: 11, weight: .regular))
                .foregroundColor(.secondary)
            Text(value)
                .font(.system(size: 14, weight: .light))
                .foregroundColor(color)
        }
        .frame(maxWidth: .infinity)
    }
}

struct AssetFilterPills: View {
    @Binding var selectedFilter: Holding.AssetClass?

    let filters: [(Holding.AssetClass?, String)] = [
        (nil, "All"),
        (.equity, "Equity"),
        (.debt, "Debt"),
        (.hybrid, "Hybrid"),
        (.gold, "Gold")
    ]

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 10) {
                ForEach(filters, id: \.1) { filter in
                    FilterPill(
                        title: filter.1,
                        isSelected: selectedFilter == filter.0,
                        action: { selectedFilter = filter.0 }
                    )
                }
            }
        }
    }
}

struct FilterPill: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: 14, weight: isSelected ? .medium : .light))
                .foregroundColor(isSelected ? .white : .primary)
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(pillBackground)
                .overlay(pillBorder)
                .shadow(color: pillShadow, radius: 6, x: 0, y: 2)
        }
    }

    private var pillShadow: Color {
        if isSelected { return .clear }
        return colorScheme == .dark ? .clear : .black.opacity(0.04)
    }

    @ViewBuilder
    private var pillBackground: some View {
        if isSelected {
            Capsule().fill(Color.blue)
        } else if colorScheme == .dark {
            Capsule()
                .fill(Color.black.opacity(0.4))
                .background(Capsule().fill(.ultraThinMaterial))
        } else {
            Capsule().fill(Color.white)
        }
    }

    @ViewBuilder
    private var pillBorder: some View {
        if isSelected {
            Capsule().stroke(Color.clear, lineWidth: 0)
        } else {
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
}

struct HoldingCard: View {
    let holding: Holding
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        VStack(spacing: AppTheme.Spacing.compact) {
            HStack(alignment: .top, spacing: AppTheme.Spacing.compact) {
                // Fund Icon
                ZStack {
                    RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
                        .fill(holding.assetClass.color.opacity(0.1))
                        .frame(width: 48, height: 48)

                    Text(holding.fundName.prefix(2).uppercased())
                        .font(.system(size: 12, weight: .light))
                        .foregroundColor(holding.assetClass.color)
                }

                // Fund Info
                VStack(alignment: .leading, spacing: 4) {
                    Text(holding.fundName)
                        .font(.system(size: 14, weight: .regular))
                        .foregroundColor(.primary)
                        .lineLimit(1)

                    HStack(spacing: 6) {
                        Text(holding.category)
                            .font(.system(size: 12, weight: .light))
                            .foregroundColor(.secondary)

                        Text("•")
                            .foregroundColor(Color(uiColor: .tertiaryLabel))

                        Text(holding.assetClass.rawValue.capitalized)
                            .font(.system(size: 12, weight: .light))
                            .foregroundColor(holding.assetClass.color)
                    }
                }

                Spacer()

                // Returns
                VStack(alignment: .trailing, spacing: 4) {
                    Text(holding.currentValue.currencyFormatted)
                        .font(.system(size: 14, weight: .light))
                        .foregroundColor(.primary)

                    HStack(spacing: 2) {
                        Image(systemName: holding.returns >= 0 ? "arrow.up.right" : "arrow.down.right")
                            .font(.system(size: 10, weight: .regular))
                        Text(holding.returnsPercentage.percentFormatted)
                            .font(.system(size: 12, weight: .regular))
                    }
                    .foregroundColor(holding.returns >= 0 ? .green : .red)
                }

                // Navigation indicator
                Image(systemName: "chevron.right")
                    .font(.system(size: 12, weight: .light))
                    .foregroundColor(Color(uiColor: .tertiaryLabel))
            }

            // Progress bar showing allocation
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 2)
                        .fill(holding.assetClass.color.opacity(0.2))
                        .frame(height: 4)

                    RoundedRectangle(cornerRadius: 2)
                        .fill(holding.assetClass.color)
                        .frame(width: geo.size.width * 0.3, height: 4)
                }
            }
            .frame(height: 4)
        }
        .padding(AppTheme.Spacing.medium)
        .background(holdingCardBackground)
        .overlay(holdingCardBorder)
        .shadow(color: holdingCardShadow, radius: 12, x: 0, y: 4)
    }

    private var holdingCardShadow: Color {
        colorScheme == .dark ? .clear : .black.opacity(0.08)
    }

    @ViewBuilder
    private var holdingCardBackground: some View {
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

    private var holdingCardBorder: some View {
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

struct EmptyHoldingsView: View {
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        VStack(spacing: AppTheme.Spacing.medium) {
            Image(systemName: "chart.pie")
                .font(.system(size: 48, weight: .ultraLight))
                .foregroundColor(Color(uiColor: .tertiaryLabel))

            Text("No holdings found")
                .font(.system(size: 16, weight: .light))
                .foregroundColor(.secondary)

            Text("Start investing to build your portfolio")
                .font(.system(size: 14, weight: .light))
                .foregroundColor(Color(uiColor: .tertiaryLabel))
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 48)
        .background(emptyHoldingsBackground)
        .overlay(emptyHoldingsBorder)
        .shadow(color: emptyHoldingsShadow, radius: 12, x: 0, y: 4)
    }

    private var emptyHoldingsShadow: Color {
        colorScheme == .dark ? .clear : .black.opacity(0.08)
    }

    @ViewBuilder
    private var emptyHoldingsBackground: some View {
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

    private var emptyHoldingsBorder: some View {
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

// MARK: - Empty Holdings View With Action

struct EmptyHoldingsViewWithAction: View {
    var onAddHolding: (() -> Void)?
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        VStack(spacing: AppTheme.Spacing.medium) {
            Image(systemName: "chart.pie")
                .font(.system(size: 48, weight: .ultraLight))
                .foregroundColor(Color(uiColor: .tertiaryLabel))

            Text("No holdings yet")
                .font(.system(size: 16, weight: .light))
                .foregroundColor(.secondary)

            Text("Add your first investment to start tracking your portfolio")
                .font(.system(size: 14, weight: .light))
                .foregroundColor(Color(uiColor: .tertiaryLabel))
                .multilineTextAlignment(.center)
                .padding(.horizontal)

            Button(action: { onAddHolding?() }) {
                HStack {
                    Image(systemName: "plus.circle.fill")
                        .font(.system(size: 16, weight: .light))
                    Text("Add Holding")
                        .font(.system(size: 14, weight: .regular))
                }
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
                .foregroundColor(.white)
            }
            .padding(.top, 8)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 48)
        .background(emptyHoldingsBackground)
        .overlay(emptyHoldingsBorder)
        .shadow(color: emptyHoldingsShadow, radius: 12, x: 0, y: 4)
    }

    private var emptyHoldingsShadow: Color {
        colorScheme == .dark ? .clear : .black.opacity(0.08)
    }

    @ViewBuilder
    private var emptyHoldingsBackground: some View {
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

    private var emptyHoldingsBorder: some View {
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

// MARK: - Family Portfolio Picker Sheet

struct FamilyPortfolioPickerSheet: View {
    let familyMembers: [FamilyMember]
    @Binding var selectedMode: PortfolioSelectionMode
    @Binding var isPresented: Bool
    var onAddMember: (() -> Void)?

    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: AppTheme.Spacing.medium) {
                    // My Portfolio Option
                    PortfolioOptionRow(
                        name: "My Portfolio",
                        relationship: nil,
                        isSelected: selectedMode == .myPortfolio,
                        onTap: {
                            selectedMode = .myPortfolio
                            isPresented = false
                        }
                    )

                    // Family Members Section
                    if !familyMembers.isEmpty {
                        VStack(alignment: .leading, spacing: AppTheme.Spacing.small) {
                            Text("FAMILY MEMBERS")
                                .font(.system(size: 11, weight: .regular))
                                .foregroundColor(.secondary)
                                .tracking(0.5)
                                .padding(.top, AppTheme.Spacing.small)

                            ForEach(familyMembers) { member in
                                PortfolioOptionRow(
                                    name: member.name,
                                    relationship: member.relationship,
                                    value: member.portfolioValue,
                                    holdingsCount: member.holdings,
                                    isSelected: selectedMode.id == member.id,
                                    onTap: {
                                        selectedMode = .familyMember(member)
                                        isPresented = false
                                    }
                                )
                            }
                        }
                    }

                    // Add Family Member Button
                    Button {
                        onAddMember?()
                    } label: {
                        HStack(spacing: 8) {
                            ZStack {
                                Circle()
                                    .fill(Color.blue.opacity(0.15))
                                    .frame(width: 40, height: 40)
                                Image(systemName: "plus")
                                    .font(.system(size: 16, weight: .medium))
                                    .foregroundColor(.blue)
                            }

                            Text("Add Family Member")
                                .font(.system(size: 15, weight: .medium))
                                .foregroundColor(.blue)

                            Spacer()
                        }
                        .padding(AppTheme.Spacing.compact)
                        .background(addMemberBackground)
                        .overlay(addMemberBorder)
                    }
                    .buttonStyle(.plain)
                    .padding(.top, AppTheme.Spacing.small)
                }
                .padding(AppTheme.Spacing.medium)
            }
            .background(Color(uiColor: .systemGroupedBackground))
            .navigationTitle("Select Portfolio")
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

// MARK: - Portfolio Option Row

struct PortfolioOptionRow: View {
    let name: String
    var relationship: FamilyRelationship?
    var value: Double = 0
    var holdingsCount: Int = 0
    let isSelected: Bool
    let onTap: () -> Void

    @Environment(\.colorScheme) private var colorScheme

    private var displayColor: Color {
        relationship?.color ?? .blue
    }

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: AppTheme.Spacing.compact) {
                // Avatar
                ZStack {
                    Circle()
                        .fill(displayColor.opacity(0.15))
                        .frame(width: 44, height: 44)
                    if let relationship = relationship {
                        Text(name.prefix(1).uppercased())
                            .font(.system(size: 18, weight: .medium))
                            .foregroundColor(displayColor)
                    } else {
                        Image(systemName: "person.fill")
                            .font(.system(size: 18, weight: .medium))
                            .foregroundColor(displayColor)
                    }
                }

                VStack(alignment: .leading, spacing: 2) {
                    Text(name)
                        .font(.system(size: 15, weight: .medium))
                        .foregroundColor(.primary)

                    if let relationship = relationship {
                        HStack(spacing: 6) {
                            Text(relationship.displayName)
                                .font(.system(size: 12, weight: .regular))
                                .foregroundColor(.secondary)

                            if holdingsCount > 0 {
                                Text("•")
                                    .foregroundColor(Color(uiColor: .tertiaryLabel))
                                Text("\(holdingsCount) holdings")
                                    .font(.system(size: 12, weight: .regular))
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                }

                Spacer()

                if value > 0 {
                    Text(value.currencyFormatted)
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

// MARK: - Preview

#Preview {
    InvestmentsView()
        .environmentObject(PortfolioStore())
        .environmentObject(FundsStore())
        .environmentObject(FamilyStore())
        .environmentObject(NavigationStore())
}
