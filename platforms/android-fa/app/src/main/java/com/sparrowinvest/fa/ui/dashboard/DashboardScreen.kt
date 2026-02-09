package com.sparrowinvest.fa.ui.dashboard

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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.FloatingActionButtonDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.TrendingDown
import androidx.compose.material.icons.automirrored.filled.TrendingUp
import androidx.compose.material.icons.filled.AccountBalance
import androidx.compose.material.icons.filled.AutoGraph
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Repeat
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Text
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.sparrowinvest.fa.data.model.Client
import com.sparrowinvest.fa.data.model.FADashboard
import com.sparrowinvest.fa.data.model.FASip
import com.sparrowinvest.fa.data.model.FATransaction
import com.sparrowinvest.fa.data.model.KpiGrowth
import com.sparrowinvest.fa.data.model.MarketIndex
import com.sparrowinvest.fa.ui.components.ErrorState
import com.sparrowinvest.fa.ui.components.GlassCard
import com.sparrowinvest.fa.ui.components.IconContainer
import com.sparrowinvest.fa.ui.components.ListItemCard
import com.sparrowinvest.fa.ui.components.LoadingIndicator
import com.sparrowinvest.fa.ui.components.ReturnBadge
import com.sparrowinvest.fa.ui.components.StatusBadge
import com.sparrowinvest.fa.ui.theme.CornerRadius
import com.sparrowinvest.fa.ui.theme.GradientEndCyan
import com.sparrowinvest.fa.ui.theme.GradientStartBlue
import com.sparrowinvest.fa.ui.theme.LocalIsDarkTheme
import com.sparrowinvest.fa.ui.theme.Primary
import com.sparrowinvest.fa.ui.theme.Secondary
import com.sparrowinvest.fa.ui.theme.Spacing
import com.sparrowinvest.fa.ui.theme.Success
import com.sparrowinvest.fa.ui.theme.Warning
import com.sparrowinvest.fa.ui.theme.Error

// Avya gradient colors
private val AvyaGradient = Brush.linearGradient(
    colors = listOf(
        Color(0xFF6366F1), // Purple
        Color(0xFF3B82F6), // Blue
        Color(0xFF06B6D4)  // Cyan
    )
)

// KPI detail type for bottom sheet
enum class KpiDetailType {
    AUM, CLIENTS, SIPS
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    viewModel: DashboardViewModel = hiltViewModel(),
    onNavigateToClient: (String) -> Unit,
    onNavigateToTransactions: () -> Unit,
    onNavigateToClients: () -> Unit,
    onNavigateToAvyaChat: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    val breakdown by viewModel.breakdown.collectAsState()
    val isRefreshing = uiState is DashboardUiState.Loading

    Scaffold(
        containerColor = Color.Transparent
    ) { paddingValues ->
        PullToRefreshBox(
            isRefreshing = isRefreshing,
            onRefresh = { viewModel.refresh() },
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            when (val state = uiState) {
                is DashboardUiState.Loading -> {
                    LoadingIndicator(
                        modifier = Modifier.fillMaxSize(),
                        message = "Loading dashboard..."
                    )
                }
                is DashboardUiState.Error -> {
                    ErrorState(
                        message = state.message,
                        onRetry = { viewModel.refresh() },
                        modifier = Modifier.fillMaxSize()
                    )
                }
                is DashboardUiState.Success -> {
                    DashboardContent(
                        dashboard = state.dashboard,
                        breakdown = breakdown,
                        onNavigateToClient = onNavigateToClient,
                        onNavigateToTransactions = onNavigateToTransactions,
                        onNavigateToClients = onNavigateToClients,
                        onNavigateToAvyaChat = onNavigateToAvyaChat
                    )
                }
            }
        }
    }
}

@Composable
private fun AvyaFab(onClick: () -> Unit) {
    FloatingActionButton(
        onClick = onClick,
        modifier = Modifier
            .size(56.dp),
        shape = CircleShape,
        containerColor = Color.Transparent,
        elevation = FloatingActionButtonDefaults.elevation(
            defaultElevation = 6.dp,
            pressedElevation = 8.dp
        )
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(AvyaGradient, CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "✨",
                style = MaterialTheme.typography.titleLarge
            )
        }
    }
}

@Composable
private fun AvyaCard(onClick: () -> Unit) {
    val isDark = LocalIsDarkTheme.current

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(CornerRadius.xLarge))
            .background(AvyaGradient)
            .clickable(onClick = onClick)
            .padding(Spacing.medium)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(Spacing.compact)
            ) {
                // Avya Avatar
                Box(
                    modifier = Modifier
                        .size(48.dp)
                        .clip(CircleShape)
                        .background(Color.White.copy(alpha = 0.2f)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "✨",
                        style = MaterialTheme.typography.titleLarge
                    )
                }

                Column {
                    Text(
                        text = "Avya AI Assistant",
                        style = MaterialTheme.typography.titleMedium,
                        color = Color.White
                    )
                    Text(
                        text = "Ask about your clients",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color.White.copy(alpha = 0.8f)
                    )
                }
            }

            Icon(
                imageVector = Icons.Default.ChevronRight,
                contentDescription = null,
                tint = Color.White.copy(alpha = 0.8f),
                modifier = Modifier.size(24.dp)
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun DashboardContent(
    dashboard: FADashboard,
    breakdown: DashboardBreakdown = DashboardBreakdown(),
    onNavigateToClient: (String) -> Unit,
    onNavigateToTransactions: () -> Unit,
    onNavigateToClients: () -> Unit,
    onNavigateToAvyaChat: () -> Unit
) {
    var showKpiDetailSheet by remember { mutableStateOf(false) }
    var selectedKpiType by remember { mutableStateOf<KpiDetailType?>(null) }
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    // Bottom sheet for KPI details
    val isDark = LocalIsDarkTheme.current
    if (showKpiDetailSheet && selectedKpiType != null) {
        ModalBottomSheet(
            onDismissRequest = {
                showKpiDetailSheet = false
                selectedKpiType = null
            },
            sheetState = sheetState,
            containerColor = if (isDark) Color(0xFF1E293B) else Color.White,
            contentColor = MaterialTheme.colorScheme.onSurface,
            dragHandle = {
                Box(
                    modifier = Modifier
                        .padding(vertical = Spacing.compact)
                        .size(width = 40.dp, height = 4.dp)
                        .clip(RoundedCornerShape(2.dp))
                        .background(
                            Brush.linearGradient(
                                colors = listOf(Primary, Secondary)
                            )
                        )
                )
            },
            scrimColor = Color.Black.copy(alpha = 0.5f)
        ) {
            KpiDetailBottomSheet(
                kpiType = selectedKpiType!!,
                dashboard = dashboard,
                breakdown = breakdown,
                onDismiss = {
                    showKpiDetailSheet = false
                    selectedKpiType = null
                }
            )
        }
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = Spacing.medium),
        verticalArrangement = Arrangement.spacedBy(Spacing.medium)
    ) {
        item {
            Spacer(modifier = Modifier.height(Spacing.medium))

            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Dashboard",
                        style = MaterialTheme.typography.headlineMedium,
                        color = MaterialTheme.colorScheme.onBackground
                    )
                    Text(
                        text = "Welcome back",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                IconButton(onClick = { /* Notifications */ }) {
                    Icon(
                        imageVector = Icons.Default.Notifications,
                        contentDescription = "Notifications",
                        tint = MaterialTheme.colorScheme.onSurface
                    )
                }
            }
        }

        // Avya AI Card (moved to top)
        item {
            AvyaCard(onClick = onNavigateToAvyaChat)
        }

        // Hero KPI Card
        item {
            HeroKpiCard(
                dashboard = dashboard,
                onClick = {
                    selectedKpiType = KpiDetailType.AUM
                    showKpiDetailSheet = true
                }
            )
        }

        // KPI Grid
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(Spacing.compact)
            ) {
                KpiCard(
                    title = "Clients",
                    value = dashboard.totalClients.toString(),
                    icon = Icons.Default.People,
                    iconColor = Primary,
                    modifier = Modifier.weight(1f),
                    growth = dashboard.clientsGrowth,
                    onClick = {
                        selectedKpiType = KpiDetailType.CLIENTS
                        showKpiDetailSheet = true
                    },
                    onLongClick = onNavigateToClients
                )
                KpiCard(
                    title = "Active SIPs",
                    value = dashboard.activeSips.toString(),
                    icon = Icons.Default.Repeat,
                    iconColor = Success,
                    modifier = Modifier.weight(1f),
                    growth = dashboard.sipsGrowth,
                    onClick = {
                        selectedKpiType = KpiDetailType.SIPS
                        showKpiDetailSheet = true
                    }
                )
                KpiCard(
                    title = "Pending",
                    value = dashboard.pendingActions.toString(),
                    icon = Icons.Default.Notifications,
                    iconColor = Warning,
                    modifier = Modifier.weight(1f),
                    onClick = onNavigateToTransactions
                )
            }
        }

        // Top Performers Section
        if (dashboard.topPerformers.isNotEmpty()) {
            item {
                SectionHeader(
                    title = "Top Performers",
                    actionText = "View All",
                    onActionClick = onNavigateToClients
                )
            }

            item {
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(Spacing.compact)
                ) {
                    items(dashboard.topPerformers.take(5)) { client ->
                        TopPerformerCard(
                            client = client,
                            onClick = { onNavigateToClient(client.id) }
                        )
                    }
                }
            }
        }

        // SIP Overview Card (Upcoming + Failed with flip)
        if (dashboard.upcomingSips.isNotEmpty() || dashboard.failedSips.isNotEmpty()) {
            item {
                SipOverviewCard(
                    upcomingSips = dashboard.upcomingSips,
                    failedSips = dashboard.failedSips,
                    onSipClick = { sip -> onNavigateToClient(sip.clientId) }
                )
            }
        }

        // Pending Actions Section
        if (dashboard.pendingTransactions.isNotEmpty()) {
            item {
                SectionHeader(
                    title = "Pending Actions",
                    actionText = "View All",
                    onActionClick = onNavigateToTransactions
                )
            }

            items(dashboard.pendingTransactions.take(3)) { transaction ->
                PendingTransactionItem(
                    transaction = transaction,
                    onClick = { onNavigateToClient(transaction.clientId) }
                )
            }
        }

        // Recent Clients Section
        if (dashboard.recentClients.isNotEmpty()) {
            item {
                SectionHeader(
                    title = "Recent Clients",
                    actionText = "View All",
                    onActionClick = onNavigateToClients
                )
            }

            item {
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(Spacing.compact)
                ) {
                    items(dashboard.recentClients) { client ->
                        ClientCard(
                            client = client,
                            onClick = { onNavigateToClient(client.id) }
                        )
                    }
                }
            }
        }

        // Market Indices Section
        if (dashboard.marketIndices.isNotEmpty()) {
            item {
                SectionHeader(
                    title = "Market Indices",
                    actionText = null,
                    onActionClick = {}
                )
            }

            item {
                MarketIndicesRow(indices = dashboard.marketIndices)
            }
        }

        item {
            Spacer(modifier = Modifier.height(Spacing.large))
        }
    }
}

@Composable
private fun HeroKpiCard(
    dashboard: FADashboard,
    onClick: () -> Unit = {}
) {
    val isDark = LocalIsDarkTheme.current

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(CornerRadius.xLarge))
            .background(
                brush = Brush.linearGradient(
                    colors = listOf(GradientStartBlue, GradientEndCyan)
                )
            )
            .clickable(onClick = onClick)
            .padding(Spacing.large)
    ) {
        Column {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Total AUM",
                        style = MaterialTheme.typography.labelMedium,
                        color = Color.White.copy(alpha = 0.8f)
                    )
                    Spacer(modifier = Modifier.height(Spacing.small))
                    Text(
                        text = dashboard.formattedAum,
                        style = MaterialTheme.typography.displaySmall,
                        color = Color.White
                    )
                }
                IconContainer(
                    size = 48.dp,
                    backgroundColor = Color.White.copy(alpha = 0.2f)
                ) {
                    Icon(
                        imageVector = Icons.Default.AccountBalance,
                        contentDescription = null,
                        modifier = Modifier.size(24.dp),
                        tint = Color.White
                    )
                }
            }

            Spacer(modifier = Modifier.height(Spacing.medium))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(
                        text = "Avg. Returns",
                        style = MaterialTheme.typography.labelSmall,
                        color = Color.White.copy(alpha = 0.7f)
                    )
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.TrendingUp,
                            contentDescription = null,
                            modifier = Modifier.size(16.dp),
                            tint = Color.White
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "${"%.1f".format(dashboard.avgReturns)}%",
                            style = MaterialTheme.typography.titleMedium,
                            color = Color.White
                        )
                    }
                }
                Column {
                    Text(
                        text = "Monthly SIP",
                        style = MaterialTheme.typography.labelSmall,
                        color = Color.White.copy(alpha = 0.7f)
                    )
                    Text(
                        text = dashboard.formattedMonthlySip,
                        style = MaterialTheme.typography.titleMedium,
                        color = Color.White
                    )
                }
            }
        }
    }
}

@Composable
private fun KpiCard(
    title: String,
    value: String,
    icon: ImageVector,
    iconColor: Color,
    modifier: Modifier = Modifier,
    growth: KpiGrowth? = null,
    onClick: (() -> Unit)? = null,
    onLongClick: (() -> Unit)? = null
) {
    GlassCard(
        modifier = modifier.then(
            if (onClick != null) Modifier.clickable(onClick = onClick) else Modifier
        ),
        cornerRadius = CornerRadius.large,
        contentPadding = Spacing.compact
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            IconContainer(
                size = 36.dp,
                backgroundColor = iconColor.copy(alpha = 0.1f)
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    modifier = Modifier.size(18.dp),
                    tint = iconColor
                )
            }
            Spacer(modifier = Modifier.height(Spacing.small))
            Text(
                text = value,
                style = MaterialTheme.typography.titleLarge,
                color = MaterialTheme.colorScheme.onSurface
            )
            Text(
                text = title,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            // Show growth indicator if available
            if (growth != null) {
                Spacer(modifier = Modifier.height(4.dp))
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(2.dp)
                ) {
                    Icon(
                        imageVector = if (growth.isMomPositive)
                            Icons.AutoMirrored.Filled.TrendingUp
                        else
                            Icons.AutoMirrored.Filled.TrendingDown,
                        contentDescription = null,
                        modifier = Modifier.size(12.dp),
                        tint = if (growth.isMomPositive) Success else Error
                    )
                    Text(
                        text = growth.formattedMomChange,
                        style = MaterialTheme.typography.labelSmall,
                        color = if (growth.isMomPositive) Success else Error
                    )
                }
            }
        }
    }
}

@Composable
private fun SectionHeader(
    title: String,
    actionText: String? = null,
    onActionClick: (() -> Unit)? = null
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = Spacing.small),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.titleMedium,
            color = MaterialTheme.colorScheme.onBackground
        )
        if (actionText != null && onActionClick != null) {
            Row(
                modifier = Modifier.clickable(onClick = onActionClick),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = actionText,
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.primary
                )
                Icon(
                    imageVector = Icons.Default.ChevronRight,
                    contentDescription = null,
                    modifier = Modifier.size(16.dp),
                    tint = MaterialTheme.colorScheme.primary
                )
            }
        }
    }
}

@Composable
private fun PendingTransactionItem(
    transaction: FATransaction,
    onClick: () -> Unit
) {
    ListItemCard(
        modifier = Modifier.clickable(onClick = onClick)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = transaction.clientName,
                    style = MaterialTheme.typography.titleSmall,
                    color = MaterialTheme.colorScheme.onSurface,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    text = "${transaction.type} - ${transaction.fundName}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
            Column(horizontalAlignment = Alignment.End) {
                Text(
                    text = transaction.formattedAmount,
                    style = MaterialTheme.typography.titleSmall,
                    color = MaterialTheme.colorScheme.onSurface
                )
                StatusBadge(status = transaction.status)
            }
        }
    }
}

@Composable
private fun ClientCard(
    client: Client,
    onClick: () -> Unit
) {
    GlassCard(
        modifier = Modifier
            .width(160.dp)
            .clickable(onClick = onClick),
        cornerRadius = CornerRadius.large,
        contentPadding = Spacing.compact
    ) {
        Column {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(CircleShape)
                        .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.1f)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = client.initials,
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
                Spacer(modifier = Modifier.width(Spacing.small))
                Column {
                    Text(
                        text = client.name,
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurface,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    ReturnBadge(returnValue = client.returns)
                }
            }
            Spacer(modifier = Modifier.height(Spacing.small))
            Text(
                text = "₹${client.formattedAum}",
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurface
            )
            Text(
                text = "${client.sipCount} Active SIPs",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun MarketIndicesRow(indices: List<MarketIndex>) {
    LazyRow(
        horizontalArrangement = Arrangement.spacedBy(Spacing.compact)
    ) {
        items(indices) { index ->
            MarketIndexCard(index = index)
        }
    }
}

@Composable
private fun MarketIndexCard(index: MarketIndex) {
    val changeColor = if (index.isPositive) Success else com.sparrowinvest.fa.ui.theme.Error

    GlassCard(
        modifier = Modifier.width(140.dp),
        cornerRadius = CornerRadius.large,
        contentPadding = Spacing.compact
    ) {
        Column {
            Text(
                text = index.name,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.height(Spacing.small))
            Text(
                text = index.formattedValue,
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurface
            )
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Icon(
                    imageVector = if (index.isPositive)
                        Icons.AutoMirrored.Filled.TrendingUp
                    else
                        Icons.AutoMirrored.Filled.TrendingDown,
                    contentDescription = null,
                    modifier = Modifier.size(14.dp),
                    tint = changeColor
                )
                Text(
                    text = index.formattedChangePercent,
                    style = MaterialTheme.typography.labelSmall,
                    color = changeColor
                )
            }
        }
    }
}

@Composable
private fun TopPerformerCard(
    client: Client,
    onClick: () -> Unit
) {
    GlassCard(
        modifier = Modifier
            .width(140.dp)
            .clickable(onClick = onClick),
        cornerRadius = CornerRadius.large,
        contentPadding = Spacing.compact
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(CircleShape)
                    .background(Success.copy(alpha = 0.1f)),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = client.initials,
                    style = MaterialTheme.typography.titleMedium,
                    color = Success
                )
            }
            Spacer(modifier = Modifier.height(Spacing.small))
            Text(
                text = client.name,
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurface,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.TrendingUp,
                    contentDescription = null,
                    modifier = Modifier.size(14.dp),
                    tint = Success
                )
                Text(
                    text = "+${"%.1f".format(client.returns)}%",
                    style = MaterialTheme.typography.labelMedium,
                    color = Success
                )
            }
        }
    }
}

@Composable
private fun UpcomingSipItem(
    sip: FASip,
    onClick: () -> Unit
) {
    ListItemCard(
        modifier = Modifier.clickable(onClick = onClick)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.weight(1f)
            ) {
                // Calendar icon with date
                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .clip(RoundedCornerShape(CornerRadius.small))
                        .background(Primary.copy(alpha = 0.1f)),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = "${sip.sipDate}",
                            style = MaterialTheme.typography.titleMedium,
                            color = Primary
                        )
                        Text(
                            text = "th",
                            style = MaterialTheme.typography.labelSmall,
                            color = Primary
                        )
                    }
                }
                Spacer(modifier = Modifier.width(Spacing.compact))
                Column {
                    Text(
                        text = sip.clientName ?: "Client",
                        style = MaterialTheme.typography.titleSmall,
                        color = MaterialTheme.colorScheme.onSurface,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(
                        text = sip.fundName,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }
            Column(horizontalAlignment = Alignment.End) {
                Text(
                    text = sip.formattedAmount,
                    style = MaterialTheme.typography.titleSmall,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = sip.frequency.lowercase().replaceFirstChar { it.uppercase() },
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
private fun SipOverviewCard(
    upcomingSips: List<FASip>,
    failedSips: List<FASip>,
    onSipClick: (FASip) -> Unit
) {
    var showFailed by remember { mutableStateOf(failedSips.isNotEmpty()) }

    GlassCard(
        cornerRadius = CornerRadius.large
    ) {
        Column {
            // Header with toggle
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(Spacing.small)
                ) {
                    IconContainer(
                        size = 36.dp,
                        backgroundColor = if (showFailed) Error.copy(alpha = 0.1f) else Primary.copy(alpha = 0.1f)
                    ) {
                        Icon(
                            imageVector = if (showFailed) Icons.Default.Notifications else Icons.Default.Repeat,
                            contentDescription = null,
                            modifier = Modifier.size(18.dp),
                            tint = if (showFailed) Error else Primary
                        )
                    }
                    Column {
                        Text(
                            text = if (showFailed) "Failed SIPs" else "Upcoming SIPs",
                            style = MaterialTheme.typography.titleSmall,
                            color = if (showFailed) Error else MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = if (showFailed) "${failedSips.size} require attention" else "${upcomingSips.size} this week",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                // Toggle button
                Row(
                    modifier = Modifier
                        .clip(RoundedCornerShape(CornerRadius.small))
                        .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
                        .padding(4.dp),
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    SipToggleButton(
                        text = "Upcoming",
                        count = upcomingSips.size,
                        isSelected = !showFailed,
                        color = Primary,
                        onClick = { showFailed = false }
                    )
                    SipToggleButton(
                        text = "Failed",
                        count = failedSips.size,
                        isSelected = showFailed,
                        color = Error,
                        onClick = { showFailed = true }
                    )
                }
            }

            Spacer(modifier = Modifier.height(Spacing.compact))

            // Content based on toggle
            if (showFailed) {
                if (failedSips.isEmpty()) {
                    EmptySipState(message = "No failed SIPs")
                } else {
                    failedSips.take(3).forEach { sip ->
                        SipListItem(
                            sip = sip,
                            isFailed = true,
                            onClick = { onSipClick(sip) }
                        )
                        if (sip != failedSips.take(3).last()) {
                            Spacer(modifier = Modifier.height(Spacing.small))
                        }
                    }
                }
            } else {
                if (upcomingSips.isEmpty()) {
                    EmptySipState(message = "No upcoming SIPs")
                } else {
                    upcomingSips.take(3).forEach { sip ->
                        SipListItem(
                            sip = sip,
                            isFailed = false,
                            onClick = { onSipClick(sip) }
                        )
                        if (sip != upcomingSips.take(3).last()) {
                            Spacer(modifier = Modifier.height(Spacing.small))
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun SipToggleButton(
    text: String,
    count: Int,
    isSelected: Boolean,
    color: Color,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(CornerRadius.small))
            .background(if (isSelected) color else Color.Transparent)
            .clickable(onClick = onClick)
            .padding(horizontal = Spacing.compact, vertical = Spacing.small)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Text(
                text = text,
                style = MaterialTheme.typography.labelSmall,
                color = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurfaceVariant
            )
            if (count > 0) {
                Box(
                    modifier = Modifier
                        .size(16.dp)
                        .clip(CircleShape)
                        .background(if (isSelected) Color.White.copy(alpha = 0.2f) else color.copy(alpha = 0.2f)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "$count",
                        style = MaterialTheme.typography.labelSmall,
                        color = if (isSelected) Color.White else color
                    )
                }
            }
        }
    }
}

@Composable
private fun SipListItem(
    sip: FASip,
    isFailed: Boolean,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(CornerRadius.small))
            .background(
                if (isFailed) Error.copy(alpha = 0.05f)
                else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f)
            )
            .clickable(onClick = onClick)
            .padding(Spacing.compact),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.weight(1f)
        ) {
            // Date badge for upcoming, warning icon for failed
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(RoundedCornerShape(CornerRadius.small))
                    .background(if (isFailed) Error.copy(alpha = 0.1f) else Primary.copy(alpha = 0.1f)),
                contentAlignment = Alignment.Center
            ) {
                if (isFailed) {
                    Icon(
                        imageVector = Icons.Default.Notifications,
                        contentDescription = null,
                        modifier = Modifier.size(20.dp),
                        tint = Error
                    )
                } else {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = "${sip.sipDate}",
                            style = MaterialTheme.typography.titleSmall,
                            color = Primary
                        )
                        Text(
                            text = "th",
                            style = MaterialTheme.typography.labelSmall,
                            color = Primary
                        )
                    }
                }
            }
            Spacer(modifier = Modifier.width(Spacing.compact))
            Column {
                Text(
                    text = sip.clientName ?: "Client",
                    style = MaterialTheme.typography.titleSmall,
                    color = MaterialTheme.colorScheme.onSurface,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    text = sip.fundName,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
        }
        Column(horizontalAlignment = Alignment.End) {
            Text(
                text = sip.formattedAmount,
                style = MaterialTheme.typography.titleSmall,
                color = if (isFailed) Error else MaterialTheme.colorScheme.onSurface
            )
            Text(
                text = if (isFailed) "Failed" else sip.frequency.lowercase().replaceFirstChar { it.uppercase() },
                style = MaterialTheme.typography.labelSmall,
                color = if (isFailed) Error else MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun EmptySipState(message: String) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(Spacing.medium),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = message,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
private fun KpiDetailBottomSheet(
    kpiType: KpiDetailType,
    dashboard: FADashboard,
    breakdown: DashboardBreakdown = DashboardBreakdown(),
    onDismiss: () -> Unit
) {
    val isDark = LocalIsDarkTheme.current

    val (title, currentValue, iconColor) = when (kpiType) {
        KpiDetailType.AUM -> Triple("Assets Under Management", dashboard.formattedAum, Primary)
        KpiDetailType.CLIENTS -> Triple("Total Clients", dashboard.totalClients.toString(), Primary)
        KpiDetailType.SIPS -> Triple("Active SIPs", dashboard.activeSips.toString(), Success)
    }

    // Get real growth data from dashboard model
    val growth: KpiGrowth? = when (kpiType) {
        KpiDetailType.AUM -> dashboard.aumGrowth
        KpiDetailType.CLIENTS -> dashboard.clientsGrowth
        KpiDetailType.SIPS -> dashboard.sipsGrowth
    }

    // Get computed breakdown data
    val breakdownData: List<BreakdownItem> = when (kpiType) {
        KpiDetailType.AUM -> breakdown.aumBreakdown
        KpiDetailType.CLIENTS -> breakdown.clientsBreakdown
        KpiDetailType.SIPS -> breakdown.sipsBreakdown
    }

    val breakdownColors = listOf(Primary, Secondary, Success, Warning)

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(if (isDark) Color(0xFF1E293B) else Color(0xFFF8FAFC))
    ) {
        // Gradient Header
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    brush = Brush.linearGradient(
                        colors = listOf(GradientStartBlue, GradientEndCyan)
                    )
                )
                .padding(horizontal = Spacing.large, vertical = Spacing.medium)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = title,
                        style = MaterialTheme.typography.titleMedium,
                        color = Color.White.copy(alpha = 0.9f)
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = currentValue,
                        style = MaterialTheme.typography.headlineLarge,
                        color = Color.White
                    )
                }
                IconButton(onClick = onDismiss) {
                    Icon(
                        imageVector = Icons.Default.Close,
                        contentDescription = "Close",
                        tint = Color.White.copy(alpha = 0.8f)
                    )
                }
            }
        }

        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = Spacing.large)
                .padding(top = Spacing.medium, bottom = Spacing.xLarge)
        ) {
            // Growth Cards — only show if backend provides real data
            if (growth != null) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(Spacing.compact)
                ) {
                    // Month-over-Month
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(CornerRadius.large))
                            .background(if (isDark) Color.White.copy(alpha = 0.08f) else Color.White)
                            .padding(Spacing.compact)
                    ) {
                        Column {
                            Text(
                                text = "Month-over-Month",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Spacer(modifier = Modifier.height(Spacing.small))
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = if (growth.isMomPositive)
                                        Icons.AutoMirrored.Filled.TrendingUp
                                    else Icons.AutoMirrored.Filled.TrendingDown,
                                    contentDescription = null,
                                    modifier = Modifier.size(20.dp),
                                    tint = if (growth.isMomPositive) Success else Error
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(
                                    text = growth.formattedMomChange,
                                    style = MaterialTheme.typography.titleLarge,
                                    color = if (growth.isMomPositive) Success else Error
                                )
                            }
                        }
                    }

                    // Year-over-Year
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(CornerRadius.large))
                            .background(if (isDark) Color.White.copy(alpha = 0.08f) else Color.White)
                            .padding(Spacing.compact)
                    ) {
                        Column {
                            Text(
                                text = "Year-over-Year",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Spacer(modifier = Modifier.height(Spacing.small))
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = if (growth.isYoyPositive)
                                        Icons.AutoMirrored.Filled.TrendingUp
                                    else Icons.AutoMirrored.Filled.TrendingDown,
                                    contentDescription = null,
                                    modifier = Modifier.size(20.dp),
                                    tint = if (growth.isYoyPositive) Success else Error
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(
                                    text = growth.formattedYoyChange,
                                    style = MaterialTheme.typography.titleLarge,
                                    color = if (growth.isYoyPositive) Success else Error
                                )
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(Spacing.medium))
            } else {
                // No historical data placeholder
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(CornerRadius.large))
                        .background(if (isDark) Color.White.copy(alpha = 0.08f) else Color.White)
                        .padding(Spacing.medium),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "No historical growth data available",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                Spacer(modifier = Modifier.height(Spacing.medium))
            }

            // Breakdown Section
            if (breakdownData.isNotEmpty()) {
                Text(
                    text = "Breakdown",
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onSurface
                )

                Spacer(modifier = Modifier.height(Spacing.compact))

                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(CornerRadius.large))
                        .background(if (isDark) Color.White.copy(alpha = 0.08f) else Color.White)
                        .padding(Spacing.medium)
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(Spacing.compact)) {
                        breakdownData.forEachIndexed { index, item ->
                            val colorIndex = index % breakdownColors.size
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(10.dp)
                                            .clip(CircleShape)
                                            .background(breakdownColors[colorIndex])
                                    )
                                    Spacer(modifier = Modifier.width(Spacing.small))
                                    Text(
                                        text = item.label,
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                }
                                Text(
                                    text = item.value,
                                    style = MaterialTheme.typography.titleSmall,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                            }
                            // Progress bar
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(6.dp)
                                    .clip(RoundedCornerShape(3.dp))
                                    .background(breakdownColors[colorIndex].copy(alpha = 0.15f))
                            ) {
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth(item.progress.coerceIn(0f, 1f))
                                        .height(6.dp)
                                        .clip(RoundedCornerShape(3.dp))
                                        .background(
                                            Brush.linearGradient(
                                                colors = listOf(
                                                    breakdownColors[colorIndex],
                                                    breakdownColors[colorIndex].copy(alpha = 0.7f)
                                                )
                                            )
                                        )
                                )
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(Spacing.medium))
            }

            // Trend Chart — only render when real trend data is available
            if (growth?.trend?.isNotEmpty() == true) {
                Text(
                    text = "6-Month Trend",
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onSurface
                )

                Spacer(modifier = Modifier.height(Spacing.compact))

                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(120.dp)
                        .clip(RoundedCornerShape(CornerRadius.large))
                        .background(if (isDark) Color.White.copy(alpha = 0.08f) else Color.White)
                        .padding(Spacing.medium)
                ) {
                    TrendChart(trend = growth.trend, kpiType = kpiType)
                }
            } else {
                // Trend data unavailable placeholder
                Text(
                    text = "Trend",
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onSurface
                )

                Spacer(modifier = Modifier.height(Spacing.compact))

                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(80.dp)
                        .clip(RoundedCornerShape(CornerRadius.large))
                        .background(if (isDark) Color.White.copy(alpha = 0.08f) else Color.White),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "Trend data unavailable",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}

@Composable
private fun GrowthMetricCard(
    title: String,
    change: String,
    isPositive: Boolean,
    previousValue: String,
    modifier: Modifier = Modifier
) {
    val changeColor = if (isPositive) Success else Error

    GlassCard(
        modifier = modifier,
        cornerRadius = CornerRadius.large,
        contentPadding = Spacing.compact
    ) {
        Column {
            Text(
                text = title,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.height(Spacing.small))
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Icon(
                    imageVector = if (isPositive)
                        Icons.AutoMirrored.Filled.TrendingUp
                    else
                        Icons.AutoMirrored.Filled.TrendingDown,
                    contentDescription = null,
                    modifier = Modifier.size(20.dp),
                    tint = changeColor
                )
                Text(
                    text = change,
                    style = MaterialTheme.typography.titleLarge,
                    color = changeColor
                )
            }
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "from $previousValue",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun TrendChart(
    trend: List<com.sparrowinvest.fa.data.model.GrowthDataPoint>,
    kpiType: KpiDetailType
) {
    val maxValue = trend.maxOfOrNull { it.value } ?: 1.0
    val minValue = trend.minOfOrNull { it.value } ?: 0.0
    val range = if (maxValue > minValue) maxValue - minValue else 1.0

    Column(modifier = Modifier.fillMaxWidth()) {
        // Simple bar chart
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(100.dp),
            horizontalArrangement = Arrangement.SpaceEvenly,
            verticalAlignment = Alignment.Bottom
        ) {
            trend.forEach { dataPoint ->
                val normalizedHeight = ((dataPoint.value - minValue) / range).coerceIn(0.1, 1.0)

                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier.weight(1f)
                ) {
                    Box(
                        modifier = Modifier
                            .width(24.dp)
                            .height((normalizedHeight * 80).dp)
                            .clip(RoundedCornerShape(topStart = 4.dp, topEnd = 4.dp))
                            .background(
                                brush = Brush.verticalGradient(
                                    colors = listOf(GradientStartBlue, GradientEndCyan)
                                )
                            )
                    )
                }
            }
        }

        HorizontalDivider(
            color = MaterialTheme.colorScheme.outlineVariant,
            thickness = 1.dp
        )

        // Month labels
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = Spacing.small),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            trend.forEach { dataPoint ->
                Text(
                    text = dataPoint.month,
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.weight(1f),
                    textAlign = androidx.compose.ui.text.style.TextAlign.Center
                )
            }
        }
    }
}

private fun formatGrowthValue(value: Double, kpiType: KpiDetailType): String {
    return when (kpiType) {
        KpiDetailType.AUM -> when {
            value >= 10000000 -> "₹%.2f Cr".format(value / 10000000)
            value >= 100000 -> "₹%.2f L".format(value / 100000)
            value >= 1000 -> "₹%.2f K".format(value / 1000)
            else -> "₹%.0f".format(value)
        }
        KpiDetailType.CLIENTS, KpiDetailType.SIPS -> "%.0f".format(value)
    }
}
