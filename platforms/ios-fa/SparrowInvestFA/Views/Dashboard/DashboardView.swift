import SwiftUI

struct DashboardView: View {
    @StateObject private var store = DashboardStore()
    @Environment(\.colorScheme) private var colorScheme
    @State private var showAvyaChat = false
    @State private var avyaInitialQuery: String?
    @State private var showActionCenter = false
    @State private var navigateToClientId: String?
    @State private var navigateToTransactionId: String?
    @State private var showKpiDetail = false
    @State private var selectedKpiTitle = ""
    @State private var selectedKpiValue = ""
    @State private var selectedKpiIcon = ""
    @State private var selectedKpiColor = AppTheme.primary
    @State private var selectedKpiGrowth: KpiGrowth?


    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: AppTheme.Spacing.large) {
                    // Header
                    HStack {
                        Text("Dashboard")
                            .font(AppTheme.Typography.title(24))
                            .foregroundColor(.primary)
                        Spacer()
                    }
                    .padding(.horizontal, AppTheme.Spacing.medium)

                    // 1. Hero AUM Card
                    heroCard

                    // 2. Avya AI Card
                    avyaAICard

                    // 3. KPI Grid
                    kpiGrid

                    // 4. Top Performers
                    if !store.topPerformers.isEmpty {
                        sectionHeader("Top Performers")
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: AppTheme.Spacing.compact) {
                                ForEach(store.topPerformers) { client in
                                    NavigationLink {
                                        ClientDetailView(clientId: client.id)
                                    } label: {
                                        topPerformerCard(client)
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                            .padding(.horizontal, AppTheme.Spacing.medium)
                        }
                    }

                    // 6. SIP Overview
                    SipOverviewCard(
                        upcomingSips: store.upcomingSips,
                        failedSips: store.failedSips
                    )
                    .padding(.horizontal, AppTheme.Spacing.medium)

                    // 7. Pending Actions
                    if !store.pendingTransactions.filter({ $0.isPending }).isEmpty {
                        sectionHeader("Pending Actions")
                        VStack(spacing: AppTheme.Spacing.small) {
                            ForEach(store.pendingTransactions.filter { $0.isPending }.prefix(5)) { tx in
                                NavigationLink {
                                    TransactionDetailView(transactionId: tx.id)
                                } label: {
                                    pendingTransactionItem(tx)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                        .padding(.horizontal, AppTheme.Spacing.medium)
                    }

                    // 8. Recent Clients
                    if !store.recentClients.isEmpty {
                        sectionHeader("Recent Clients")
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: AppTheme.Spacing.compact) {
                                ForEach(store.recentClients) { client in
                                    NavigationLink {
                                        ClientDetailView(clientId: client.id)
                                    } label: {
                                        recentClientCard(client)
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                            .padding(.horizontal, AppTheme.Spacing.medium)
                        }
                    }

                    Spacer().frame(height: AppTheme.Spacing.xxxLarge)
                }
            }
            .refreshable { await store.loadDashboard() }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    HStack(spacing: AppTheme.Spacing.small) {
                        Image(systemName: "bird.fill")
                            .font(.system(size: 18))
                            .foregroundColor(AppTheme.primary)

                        Text("Sparrow")
                            .font(AppTheme.Typography.accent(17))
                            .foregroundColor(.primary)
                    }
                }

                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        // Profile action
                    } label: {
                        Image(systemName: "person.circle")
                            .font(.system(size: 22))
                            .foregroundColor(.secondary)
                    }
                }
            }
            .task { await store.loadDashboard() }
            .overlay {
                if store.isLoading && store.clients.isEmpty {
                    ProgressView("Loading dashboard...")
                }
            }
            .sheet(isPresented: $showAvyaChat) {
                AIChatView(initialQuery: avyaInitialQuery)
            }
            .fullScreenCover(isPresented: $showActionCenter) {
                ActionCenterView()
            }
            .sheet(isPresented: $showKpiDetail) {
                KpiDetailSheet(
                    title: selectedKpiTitle,
                    value: selectedKpiValue,
                    icon: selectedKpiIcon,
                    color: selectedKpiColor,
                    growth: selectedKpiGrowth
                )
                .presentationDetents([.medium, .large])
                .presentationDragIndicator(.hidden)
            }
        }
    }

    // MARK: - Hero Card

    private var heroCard: some View {
        Button {
            selectedKpiTitle = "Total AUM"
            selectedKpiValue = AppTheme.formatCurrencyWithSymbol(store.totalAum)
            selectedKpiIcon = "indianrupeesign.circle.fill"
            selectedKpiColor = AppTheme.primary
            selectedKpiGrowth = store.aumGrowth
            showKpiDetail = true
        } label: {
            VStack(spacing: AppTheme.Spacing.compact) {
                // Top: Total AUM + icon
                HStack {
                    VStack(alignment: .leading, spacing: AppTheme.Spacing.micro) {
                        Text("TOTAL AUM")
                            .font(AppTheme.Typography.DashboardText.heroLabel)
                            .foregroundColor(.white.opacity(0.8))

                        Text(AppTheme.formatCurrencyWithSymbol(store.totalAum))
                            .font(AppTheme.Typography.DashboardText.heroValue)
                            .foregroundColor(.white)
                    }

                    Spacer()

                    ZStack {
                        Circle()
                            .fill(.white.opacity(0.2))
                            .frame(width: 48, height: 48)

                        Image(systemName: "indianrupeesign.circle")
                            .font(.system(size: 22))
                            .foregroundColor(.white)
                    }
                }

                // Bottom: stat blocks
                HStack(spacing: AppTheme.Spacing.small) {
                    // Avg Returns block
                    HStack(spacing: AppTheme.Spacing.micro) {
                        Image(systemName: "arrow.up.right")
                            .font(.system(size: 11))
                            .foregroundColor(.white.opacity(0.9))

                        VStack(alignment: .leading, spacing: 1) {
                            Text("Avg Returns")
                                .font(AppTheme.Typography.label(9))
                                .foregroundColor(.white.opacity(0.7))
                            Text(store.avgReturns.formattedPercent)
                                .font(AppTheme.Typography.accent(13))
                                .foregroundColor(.white)
                        }
                    }
                    .padding(.horizontal, AppTheme.Spacing.compact)
                    .padding(.vertical, AppTheme.Spacing.small)
                    .background(
                        RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
                            .fill(.white.opacity(0.12))
                    )

                    // Monthly SIP block
                    HStack(spacing: AppTheme.Spacing.micro) {
                        Image(systemName: "arrow.triangle.2.circlepath")
                            .font(.system(size: 11))
                            .foregroundColor(.white.opacity(0.9))

                        VStack(alignment: .leading, spacing: 1) {
                            Text("Monthly SIP")
                                .font(AppTheme.Typography.label(9))
                                .foregroundColor(.white.opacity(0.7))
                            Text(AppTheme.formatCurrencyWithSymbol(store.monthlySipValue))
                                .font(AppTheme.Typography.accent(13))
                                .foregroundColor(.white)
                        }
                    }
                    .padding(.horizontal, AppTheme.Spacing.compact)
                    .padding(.vertical, AppTheme.Spacing.small)
                    .background(
                        RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
                            .fill(.white.opacity(0.12))
                    )

                    // Active SIPs block
                    HStack(spacing: AppTheme.Spacing.micro) {
                        Image(systemName: "chart.bar.fill")
                            .font(.system(size: 11))
                            .foregroundColor(.white.opacity(0.9))

                        VStack(alignment: .leading, spacing: 1) {
                            Text("Active SIPs")
                                .font(AppTheme.Typography.label(9))
                                .foregroundColor(.white.opacity(0.7))
                            Text("\(store.activeSipCount)")
                                .font(AppTheme.Typography.accent(13))
                                .foregroundColor(.white)
                        }
                    }
                    .padding(.horizontal, AppTheme.Spacing.compact)
                    .padding(.vertical, AppTheme.Spacing.small)
                    .background(
                        RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
                            .fill(.white.opacity(0.12))
                    )
                }
            }
            .padding(AppTheme.Spacing.large)
            .background(
                RoundedRectangle(cornerRadius: AppTheme.CornerRadius.xLarge, style: .continuous)
                    .fill(
                        LinearGradient(
                            colors: [Color(hex: "2563EB"), Color(hex: "06B6D4")],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .shadow(color: Color(hex: "2563EB").opacity(0.3), radius: 12, y: 6)
            )
            .overlay(
                ZStack {
                    Circle()
                        .fill(.white.opacity(0.08))
                        .frame(width: 100, height: 100)
                        .offset(x: 50, y: -30)
                    Circle()
                        .fill(.white.opacity(0.04))
                        .frame(width: 130, height: 130)
                        .offset(x: -60, y: 40)
                }
                .clipShape(RoundedRectangle(cornerRadius: AppTheme.CornerRadius.xLarge, style: .continuous))
            )
        }
        .buttonStyle(.plain)
        .padding(.horizontal, AppTheme.Spacing.medium)
    }

    // MARK: - Avya AI Card

    private var avyaAICard: some View {
        Button {
            avyaInitialQuery = nil
            showAvyaChat = true
        } label: {
            HStack(spacing: AppTheme.Spacing.compact) {
                // Avatar
                ZStack {
                    Circle()
                        .fill(.white.opacity(0.2))
                        .frame(width: 48, height: 48)

                    Image(systemName: "sparkles")
                        .font(.system(size: 22))
                        .foregroundColor(.white)
                }

                VStack(alignment: .leading, spacing: 2) {
                    Text("Avya AI Assistant")
                        .font(AppTheme.Typography.headline(16))
                        .foregroundColor(.white)

                    Text("Ask about your clients & portfolios")
                        .font(AppTheme.Typography.label(12))
                        .foregroundColor(.white.opacity(0.8))
                }

                Spacer()

                Image(systemName: "chevron.right")
                    .font(.system(size: 14))
                    .foregroundColor(.white.opacity(0.8))
            }
            .padding(AppTheme.Spacing.medium)
            .background(
                RoundedRectangle(cornerRadius: AppTheme.CornerRadius.xLarge, style: .continuous)
                    .fill(
                        LinearGradient(
                            colors: [Color(hex: "6366F1"), Color(hex: "3B82F6"), Color(hex: "06B6D4")],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .shadow(color: Color(hex: "6366F1").opacity(0.3), radius: 12, y: 6)
            )
            .overlay(
                ZStack {
                    Circle()
                        .fill(.white.opacity(0.1))
                        .frame(width: 80, height: 80)
                        .offset(x: 30, y: -20)
                    Circle()
                        .fill(.white.opacity(0.06))
                        .frame(width: 50, height: 50)
                        .offset(x: -40, y: 20)
                }
                .clipShape(RoundedRectangle(cornerRadius: AppTheme.CornerRadius.xLarge, style: .continuous))
            )
        }
        .buttonStyle(.plain)
        .padding(.horizontal, AppTheme.Spacing.medium)
    }

    // MARK: - KPI Grid

    private var kpiGrid: some View {
        HStack(spacing: AppTheme.Spacing.compact) {
            Button {
                selectedKpiTitle = "Clients"
                selectedKpiValue = "\(store.clients.count)"
                selectedKpiIcon = "person.2.fill"
                selectedKpiColor = AppTheme.primary
                selectedKpiGrowth = store.clientsGrowth
                showKpiDetail = true
            } label: {
                kpiCard(
                    title: "Clients",
                    value: "\(store.clients.count)",
                    icon: "person.2.fill",
                    color: AppTheme.primary
                )
            }
            .buttonStyle(.plain)

            Button {
                selectedKpiTitle = "Active SIPs"
                selectedKpiValue = "\(store.activeSipCount)"
                selectedKpiIcon = "arrow.triangle.2.circlepath"
                selectedKpiColor = AppTheme.success
                selectedKpiGrowth = store.sipsGrowth
                showKpiDetail = true
            } label: {
                kpiCard(
                    title: "Active SIPs",
                    value: "\(store.activeSipCount)",
                    icon: "arrow.triangle.2.circlepath",
                    color: AppTheme.success
                )
            }
            .buttonStyle(.plain)

            Button {
                selectedKpiTitle = "Pending"
                selectedKpiValue = "\(store.pendingCount)"
                selectedKpiIcon = "clock.fill"
                selectedKpiColor = AppTheme.warning
                selectedKpiGrowth = nil
                showKpiDetail = true
            } label: {
                kpiCard(
                    title: "Pending",
                    value: "\(store.pendingCount)",
                    icon: "clock.fill",
                    color: AppTheme.warning
                )
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, AppTheme.Spacing.medium)
    }

    private func kpiCard(title: String, value: String, icon: String, color: Color) -> some View {
        VStack(spacing: AppTheme.Spacing.small) {
            ZStack {
                RoundedRectangle(cornerRadius: AppTheme.CornerRadius.small, style: .continuous)
                    .fill(color.opacity(0.1))
                    .frame(width: 36, height: 36)

                Image(systemName: icon)
                    .font(.system(size: 16))
                    .foregroundColor(color)
            }

            Text(value)
                .font(AppTheme.Typography.DashboardText.kpiValue)
                .foregroundColor(.primary)

            Text(title)
                .font(AppTheme.Typography.DashboardText.kpiLabel)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .glassCard(cornerRadius: AppTheme.CornerRadius.large, padding: AppTheme.Spacing.compact)
    }

    // MARK: - Section Header

    private func sectionHeader(_ title: String) -> some View {
        HStack {
            Text(title)
                .font(AppTheme.Typography.DashboardText.sectionTitle)
                .foregroundColor(.primary)
            Spacer()
        }
        .padding(.horizontal, AppTheme.Spacing.medium)
        .padding(.top, AppTheme.Spacing.compact)
    }

    // MARK: - Top Performer Card

    private func topPerformerCard(_ client: FAClient) -> some View {
        VStack(spacing: AppTheme.Spacing.small) {
            ZStack {
                Circle()
                    .fill(AppTheme.primary.opacity(0.1))
                    .frame(width: 44, height: 44)

                Text(client.initials)
                    .font(AppTheme.Typography.accent(15))
                    .foregroundColor(AppTheme.primary)
            }

            Text(client.name)
                .font(AppTheme.Typography.DashboardText.cardName)
                .foregroundColor(.primary)
                .lineLimit(1)

            Text(client.formattedAum)
                .font(AppTheme.Typography.DashboardText.cardSubtext)
                .foregroundColor(.secondary)

            Text(client.returns.formattedPercent)
                .font(AppTheme.Typography.DashboardText.cardValue)
                .foregroundColor(AppTheme.returnColor(client.returns))
                .padding(.horizontal, 8)
                .padding(.vertical, 3)
                .background(
                    Capsule()
                        .fill(AppTheme.returnColor(client.returns).opacity(0.1))
                )
        }
        .frame(width: 160)
        .glassCard(cornerRadius: AppTheme.CornerRadius.large, padding: AppTheme.Spacing.compact)
    }

    // MARK: - Pending Transaction

    private func pendingTransactionItem(_ tx: FATransaction) -> some View {
        HStack(spacing: AppTheme.Spacing.compact) {
            ZStack {
                RoundedRectangle(cornerRadius: AppTheme.CornerRadius.small, style: .continuous)
                    .fill(AppTheme.warning.opacity(0.1))
                    .frame(width: 40, height: 40)

                Image(systemName: "clock.fill")
                    .font(.system(size: 16))
                    .foregroundColor(AppTheme.warning)
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(tx.clientName)
                    .font(AppTheme.Typography.accent(14))
                    .foregroundColor(.primary)

                Text("\(tx.type) - \(tx.fundName)")
                    .font(AppTheme.Typography.label(12))
                    .foregroundColor(.secondary)
                    .lineLimit(1)
            }

            Spacer()

            Text(tx.formattedAmount)
                .font(AppTheme.Typography.numeric(14))
                .foregroundColor(AppTheme.warning)
        }
        .glassCard(cornerRadius: AppTheme.CornerRadius.medium, padding: AppTheme.Spacing.compact)
    }

    // MARK: - Recent Client Card

    private func recentClientCard(_ client: FAClient) -> some View {
        VStack(spacing: AppTheme.Spacing.small) {
            ZStack {
                Circle()
                    .fill(AppTheme.secondary.opacity(0.1))
                    .frame(width: 44, height: 44)

                Text(client.initials)
                    .font(AppTheme.Typography.accent(15))
                    .foregroundColor(AppTheme.secondary)
            }

            Text(client.name)
                .font(AppTheme.Typography.DashboardText.cardName)
                .foregroundColor(.primary)
                .lineLimit(1)

            Text(client.formattedAum)
                .font(AppTheme.Typography.DashboardText.cardSubtext)
                .foregroundColor(.secondary)

            if let lastActive = client.lastActive {
                Text(lastActive)
                    .font(AppTheme.Typography.label(10))
                    .foregroundColor(AppTheme.info)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(
                        Capsule()
                            .fill(AppTheme.info.opacity(0.1))
                    )
            }
        }
        .frame(width: 160)
        .glassCard(cornerRadius: AppTheme.CornerRadius.large, padding: AppTheme.Spacing.compact)
    }
}
