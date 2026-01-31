package com.sparrowinvest.app.ui.home

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBalanceWallet
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.ArrowDropUp
import androidx.compose.material.icons.filled.Insights
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Savings
import androidx.compose.material.icons.filled.TrendingUp
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.sparrowinvest.app.ui.components.AssetAllocationCard
import com.sparrowinvest.app.ui.components.Avatar
import com.sparrowinvest.app.ui.components.CurrencyText
import com.sparrowinvest.app.ui.components.FullScreenLoading
import com.sparrowinvest.app.ui.components.GlassCard
import com.sparrowinvest.app.ui.components.ProfileCompletionCard
import com.sparrowinvest.app.ui.components.QuickActionType
import com.sparrowinvest.app.ui.components.ManagedQuickActionSheet
import com.sparrowinvest.app.ui.components.RecentTransactionsCard
import com.sparrowinvest.app.ui.components.ReturnBadge
import com.sparrowinvest.app.ui.components.SIPDashboardCard
import com.sparrowinvest.app.ui.components.SectionHeader
import com.sparrowinvest.app.ui.components.SegmentedControl
import com.sparrowinvest.app.ui.components.TradingPlatformSheet
import com.sparrowinvest.app.ui.components.UpcomingActionsCard
import com.sparrowinvest.app.ui.components.formatCompactCurrency
import com.sparrowinvest.app.ui.components.AvyaHomeCard
import com.sparrowinvest.app.ui.theme.AppColors
import com.sparrowinvest.app.ui.theme.CornerRadius
import com.sparrowinvest.app.ui.theme.Primary
import com.sparrowinvest.app.ui.theme.Secondary
import com.sparrowinvest.app.ui.theme.Spacing
import com.sparrowinvest.app.ui.theme.Success
import java.util.Locale

@Composable
fun HomeScreen(
    viewModel: HomeViewModel = hiltViewModel(),
    onNavigateToInvestments: () -> Unit,
    onNavigateToFund: (Int) -> Unit,
    onNavigateToGoals: () -> Unit,
    onNavigateToAnalysis: () -> Unit,
    onNavigateToAvya: () -> Unit = {},
    onNavigateToExplore: () -> Unit = {}
) {
    val uiState by viewModel.uiState.collectAsState()
    val currentUser by viewModel.currentUser.collectAsState()
    val isGuest by viewModel.isGuest.collectAsState()
    val portfolio by viewModel.portfolio.collectAsState()
    val goals by viewModel.goals.collectAsState()
    val activeSIPs by viewModel.activeSIPs.collectAsState()
    val recentTransactions by viewModel.recentTransactions.collectAsState()
    val upcomingActions by viewModel.upcomingActions.collectAsState()
    val portfolioViewMode by viewModel.portfolioViewMode.collectAsState()
    val profileCompletion by viewModel.profileCompletion.collectAsState()
    val advisor by viewModel.advisor.collectAsState()
    val clientType by viewModel.clientType.collectAsState()

    // Determine if user is managed by FA
    val isManagedClient = viewModel.isManagedClient

    var showTradingSheet by remember { mutableStateOf(false) }
    var showManagedSheet by remember { mutableStateOf(false) }
    var selectedActionType by remember { mutableStateOf(QuickActionType.INVEST) }

    when (uiState) {
        is HomeUiState.Loading -> {
            FullScreenLoading()
        }
        is HomeUiState.Success -> {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .background(MaterialTheme.colorScheme.background)
                    .statusBarsPadding()
                    .verticalScroll(rememberScrollState())
            ) {
                // Header
                HomeHeader(
                    greeting = viewModel.getGreeting(),
                    userName = currentUser?.firstName ?: "Investor",
                    userInitials = currentUser?.initials ?: "U"
                )

                // Profile Completion Card (show for incomplete profiles or guests)
                if (isGuest || profileCompletion < 100) {
                    ProfileCompletionCard(
                        completion = profileCompletion,
                        isGuest = isGuest,
                        onClick = { /* Navigate to profile */ },
                        modifier = Modifier.padding(horizontal = Spacing.medium)
                    )
                    Spacer(modifier = Modifier.height(Spacing.medium))
                }

                // Avya AI Assistant Card
                AvyaHomeCard(
                    onStartChat = onNavigateToAvya,
                    modifier = Modifier.padding(horizontal = Spacing.medium)
                )
                Spacer(modifier = Modifier.height(Spacing.medium))

                // Portfolio View Mode Toggle
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = Spacing.medium),
                    horizontalArrangement = Arrangement.Center
                ) {
                    SegmentedControl(
                        options = PortfolioViewMode.entries,
                        selectedOption = portfolioViewMode,
                        onOptionSelected = { viewModel.setPortfolioViewMode(it) },
                        optionLabel = { it.name.lowercase().replaceFirstChar { c -> c.uppercase() } }
                    )
                }

                Spacer(modifier = Modifier.height(Spacing.medium))

                // Portfolio Card
                portfolio?.let { p ->
                    PortfolioCard(
                        portfolio = p,
                        onViewDetails = onNavigateToInvestments
                    )
                }

                Spacer(modifier = Modifier.height(Spacing.medium))

                // Quick Actions - show different sheet based on user type
                QuickActionsRow(
                    onInvest = {
                        selectedActionType = QuickActionType.INVEST
                        if (isManagedClient) {
                            showManagedSheet = true
                        } else {
                            showTradingSheet = true
                        }
                    },
                    onWithdraw = {
                        selectedActionType = QuickActionType.WITHDRAW
                        if (isManagedClient) {
                            showManagedSheet = true
                        } else {
                            showTradingSheet = true
                        }
                    },
                    onSip = {
                        selectedActionType = QuickActionType.SIP
                        if (isManagedClient) {
                            showManagedSheet = true
                        } else {
                            showTradingSheet = true
                        }
                    }
                )

                // Asset Allocation Chart
                portfolio?.let { p ->
                    if (p.assetAllocation.total > 0) {
                        AssetAllocationCard(
                            allocation = p.assetAllocation,
                            modifier = Modifier.padding(horizontal = Spacing.medium)
                        )
                        Spacer(modifier = Modifier.height(Spacing.medium))
                    }
                }

                // AI Analysis Card
                AIAnalysisCard(
                    onClick = onNavigateToAnalysis
                )

                Spacer(modifier = Modifier.height(Spacing.medium))

                // SIP Dashboard
                if (activeSIPs.isNotEmpty()) {
                    SIPDashboardCard(
                        activeSIPs = activeSIPs,
                        modifier = Modifier.padding(horizontal = Spacing.medium),
                        onViewAll = onNavigateToInvestments
                    )
                    Spacer(modifier = Modifier.height(Spacing.medium))
                }

                // Recent Transactions
                if (recentTransactions.isNotEmpty()) {
                    RecentTransactionsCard(
                        transactions = recentTransactions,
                        modifier = Modifier.padding(horizontal = Spacing.medium),
                        onViewAll = onNavigateToInvestments
                    )
                    Spacer(modifier = Modifier.height(Spacing.medium))
                }

                // Upcoming Actions
                if (upcomingActions.isNotEmpty()) {
                    UpcomingActionsCard(
                        actions = upcomingActions,
                        modifier = Modifier.padding(horizontal = Spacing.medium)
                    )
                    Spacer(modifier = Modifier.height(Spacing.medium))
                }

                // Goals Section
                if (goals.isNotEmpty()) {
                    SectionHeader(
                        title = "Your Goals",
                        action = {
                            Text(
                                text = "View All",
                                style = MaterialTheme.typography.labelMedium,
                                color = Primary,
                                modifier = Modifier.clickable { onNavigateToGoals() }
                            )
                        }
                    )
                    GoalsSummaryCard(
                        goals = goals,
                        onClick = onNavigateToGoals
                    )
                }

                Spacer(modifier = Modifier.height(Spacing.large))
            }
        }
        is HomeUiState.Error -> {
            // Error state
        }
    }

    // Trading Platform Sheet (for self-service users)
    if (showTradingSheet) {
        TradingPlatformSheet(
            actionType = selectedActionType,
            onDismiss = { showTradingSheet = false }
        )
    }

    // Managed Quick Action Sheet (for FA-managed users)
    if (showManagedSheet) {
        ManagedQuickActionSheet(
            actionType = selectedActionType,
            advisor = advisor,
            onBrowseFunds = {
                showManagedSheet = false
                onNavigateToExplore()
            },
            onDismiss = { showManagedSheet = false }
        )
    }
}

@Composable
private fun HomeHeader(
    greeting: String,
    userName: String,
    userInitials: String
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(Spacing.medium),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Avatar(
                initials = userInitials,
                size = 44,
                backgroundColor = Primary
            )
            Spacer(modifier = Modifier.width(Spacing.compact))
            Column {
                Text(
                    text = greeting,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = userName,
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onSurface
                )
            }
        }

        IconButton(onClick = { /* TODO: Notifications */ }) {
            Icon(
                imageVector = Icons.Default.Notifications,
                contentDescription = "Notifications",
                tint = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun PortfolioCard(
    portfolio: com.sparrowinvest.app.data.model.Portfolio,
    onViewDetails: () -> Unit
) {
    GlassCard(
        modifier = Modifier.padding(horizontal = Spacing.medium)
    ) {
        Column(modifier = Modifier.fillMaxWidth()) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Portfolio Value",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                ReturnBadge(value = portfolio.returnsPercentage)
            }

            Spacer(modifier = Modifier.height(Spacing.small))

            CurrencyText(
                amount = portfolio.totalValue,
                style = MaterialTheme.typography.displaySmall,
                color = MaterialTheme.colorScheme.onSurface
            )

            Spacer(modifier = Modifier.height(Spacing.compact))

            // Today's change
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = if (portfolio.todayChange >= 0)
                        Icons.Default.ArrowDropUp else Icons.Default.ArrowDropDown,
                    contentDescription = null,
                    tint = AppColors.returnColor(portfolio.todayChange),
                    modifier = Modifier.size(20.dp)
                )
                Text(
                    text = "${formatCompactCurrency(kotlin.math.abs(portfolio.todayChange))} today",
                    style = MaterialTheme.typography.bodySmall,
                    color = AppColors.returnColor(portfolio.todayChange)
                )
            }

            Spacer(modifier = Modifier.height(Spacing.medium))

            // Stats row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                PortfolioStat(
                    label = "Invested",
                    value = formatCompactCurrency(portfolio.totalInvested)
                )
                PortfolioStat(
                    label = "Returns",
                    value = formatCompactCurrency(portfolio.totalReturns),
                    valueColor = AppColors.returnColor(portfolio.totalReturns)
                )
                portfolio.xirr?.let {
                    PortfolioStat(
                        label = "XIRR",
                        value = String.format(Locale.US, "%.1f%%", it),
                        valueColor = AppColors.returnColor(it)
                    )
                }
            }
        }
    }
}

@Composable
private fun PortfolioStat(
    label: String,
    value: String,
    valueColor: Color = MaterialTheme.colorScheme.onSurface
) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = value,
            style = MaterialTheme.typography.titleSmall,
            color = valueColor
        )
    }
}

@Composable
private fun QuickActionsRow(
    onInvest: () -> Unit,
    onWithdraw: () -> Unit,
    onSip: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(Spacing.medium),
        horizontalArrangement = Arrangement.spacedBy(Spacing.compact)
    ) {
        QuickActionItem(
            icon = Icons.Default.Add,
            label = "Invest",
            color = Primary,
            onClick = onInvest,
            modifier = Modifier.weight(1f)
        )
        QuickActionItem(
            icon = Icons.Default.AccountBalanceWallet,
            label = "Withdraw",
            color = Secondary,
            onClick = onWithdraw,
            modifier = Modifier.weight(1f)
        )
        QuickActionItem(
            icon = Icons.Default.TrendingUp,
            label = "SIP",
            color = Success,
            onClick = onSip,
            modifier = Modifier.weight(1f)
        )
    }
}

@Composable
private fun QuickActionItem(
    icon: ImageVector,
    label: String,
    color: Color,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(CornerRadius.medium))
            .background(color.copy(alpha = 0.1f))
            .clickable(onClick = onClick)
            .padding(Spacing.medium),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Box(
            modifier = Modifier
                .size(40.dp)
                .clip(CircleShape)
                .background(color),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = label,
                tint = Color.White,
                modifier = Modifier.size(20.dp)
            )
        }
        Spacer(modifier = Modifier.height(Spacing.small))
        Text(
            text = label,
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.onSurface
        )
    }
}

@Composable
private fun AIAnalysisCard(onClick: () -> Unit) {
    GlassCard(
        modifier = Modifier
            .padding(horizontal = Spacing.medium)
            .clickable(onClick = onClick)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(RoundedCornerShape(CornerRadius.medium))
                    .background(Primary.copy(alpha = 0.1f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.Insights,
                    contentDescription = null,
                    tint = Primary,
                    modifier = Modifier.size(24.dp)
                )
            }

            Spacer(modifier = Modifier.width(Spacing.medium))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "AI Portfolio Analysis",
                    style = MaterialTheme.typography.titleSmall,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = "Get personalized insights and recommendations",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
private fun GoalsSummaryCard(
    goals: List<com.sparrowinvest.app.data.model.Goal>,
    onClick: () -> Unit
) {
    GlassCard(
        modifier = Modifier
            .padding(horizontal = Spacing.medium)
            .clickable(onClick = onClick)
    ) {
        Column(modifier = Modifier.fillMaxWidth()) {
            goals.take(2).forEach { goal ->
                GoalItem(goal = goal)
                if (goal != goals.last()) {
                    Spacer(modifier = Modifier.height(Spacing.compact))
                }
            }
        }
    }
}

@Composable
private fun GoalItem(goal: com.sparrowinvest.app.data.model.Goal) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(40.dp)
                .clip(RoundedCornerShape(CornerRadius.small))
                .background(Color(goal.category.color).copy(alpha = 0.1f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.Savings,
                contentDescription = null,
                tint = Color(goal.category.color),
                modifier = Modifier.size(20.dp)
            )
        }

        Spacer(modifier = Modifier.width(Spacing.compact))

        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = goal.name,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurface
            )
            Text(
                text = "${String.format(Locale.US, "%.0f", goal.progressPercentage)}% complete",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        CurrencyText(
            amount = goal.currentAmount,
            style = MaterialTheme.typography.titleSmall,
            compact = true
        )
    }
}
