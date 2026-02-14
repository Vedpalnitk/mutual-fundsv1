package com.sparrowinvest.fa.ui.dashboard

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.offset
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
import androidx.compose.material.icons.filled.Assessment
import androidx.compose.material.icons.filled.Calculate
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.PersonAdd
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.Repeat
import androidx.compose.material.icons.filled.SwapHoriz
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import java.time.LocalDate
import java.time.format.TextStyle as JavaTextStyle
import java.util.Locale
import androidx.hilt.navigation.compose.hiltViewModel
import com.sparrowinvest.fa.data.model.Client
import com.sparrowinvest.fa.data.model.FADashboard
import com.sparrowinvest.fa.ui.actioncenter.shareSipFailure
import com.sparrowinvest.fa.data.model.FASip
import com.sparrowinvest.fa.data.model.FATransaction
import com.sparrowinvest.fa.data.model.KpiGrowth
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
private val AvyaGradientLight = Brush.linearGradient(
    colors = listOf(
        Color(0xFF6366F1), // Purple
        Color(0xFF3B82F6), // Blue
        Color(0xFF06B6D4)  // Cyan
    )
)
private val AvyaGradientDark = Brush.linearGradient(
    colors = listOf(
        Color(0xFF2A2860), // Dark Purple
        Color(0xFF162D54), // Dark Blue
        Color(0xFF0C3545)  // Dark Cyan
    )
)

// KPI detail type for bottom sheet
enum class KpiDetailType {
    AUM, CLIENTS, RETURNS, SIPS
}

// Chart period for trend filters
enum class ChartPeriod(val label: String) {
    ONE_WEEK("1W"),
    ONE_MONTH("1M"),
    THREE_MONTHS("3M"),
    SIX_MONTHS("6M"),
    ONE_YEAR("1Y")
}

private data class TrendDataPoint(
    val label: String,
    val value: Double
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    viewModel: DashboardViewModel = hiltViewModel(),
    onNavigateToClient: (String) -> Unit,
    onNavigateToTransactions: () -> Unit,
    onNavigateToClients: () -> Unit,
    onNavigateToAvyaChat: () -> Unit,
    onNavigateToActionCenter: () -> Unit = {},
    onNavigateToReports: () -> Unit = {},
    onNavigateToCalculators: () -> Unit = {},
    onNavigateToAddClient: () -> Unit = {},
    onBadgeCountChanged: (Int) -> Unit = {}
) {
    val uiState by viewModel.uiState.collectAsState()
    val breakdown by viewModel.breakdown.collectAsState()
    val isRefreshing = uiState is DashboardUiState.Loading

    // Report badge count to parent
    androidx.compose.runtime.LaunchedEffect(uiState) {
        val state = uiState
        if (state is DashboardUiState.Success) {
            onBadgeCountChanged(state.dashboard.pendingActions)
        }
    }

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
                        onNavigateToAvyaChat = onNavigateToAvyaChat,
                        onNavigateToActionCenter = onNavigateToActionCenter,
                        onNavigateToReports = onNavigateToReports,
                        onNavigateToCalculators = onNavigateToCalculators,
                        onNavigateToAddClient = onNavigateToAddClient
                    )
                }
            }
        }
    }
}

@Composable
private fun AvyaFab(onClick: () -> Unit) {
    val isDark = LocalIsDarkTheme.current

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
                .background(if (isDark) AvyaGradientDark else AvyaGradientLight, CircleShape),
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
            .background(if (isDark) AvyaGradientDark else AvyaGradientLight)
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

@Composable
private fun QuickActionsRow(
    onNavigateToTransactions: () -> Unit,
    onNavigateToAddClient: () -> Unit,
    onNavigateToReports: () -> Unit,
    onNavigateToCalculators: () -> Unit
) {
    val isDark = LocalIsDarkTheme.current

    LazyRow(
        horizontalArrangement = Arrangement.spacedBy(Spacing.small)
    ) {
        item {
            QuickActionPill(
                icon = Icons.Default.SwapHoriz,
                label = "New Transaction",
                onClick = onNavigateToTransactions
            )
        }
        item {
            QuickActionPill(
                icon = Icons.Default.PersonAdd,
                label = "Add Client",
                onClick = onNavigateToAddClient
            )
        }
        item {
            QuickActionPill(
                icon = Icons.Default.Assessment,
                label = "View Reports",
                onClick = onNavigateToReports
            )
        }
        item {
            QuickActionPill(
                icon = Icons.Default.Calculate,
                label = "Calculators",
                onClick = onNavigateToCalculators
            )
        }
    }
}

@Composable
private fun QuickActionPill(
    icon: ImageVector,
    label: String,
    onClick: () -> Unit
) {
    val isDark = LocalIsDarkTheme.current

    Row(
        modifier = Modifier
            .clip(RoundedCornerShape(50))
            .background(
                if (isDark) Color.White.copy(alpha = 0.08f)
                else Primary.copy(alpha = 0.06f)
            )
            .border(
                width = 1.dp,
                color = if (isDark) Color.White.copy(alpha = 0.12f) else Primary.copy(alpha = 0.12f),
                shape = RoundedCornerShape(50)
            )
            .clickable(onClick = onClick)
            .padding(horizontal = Spacing.compact, vertical = Spacing.small),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(Spacing.small)
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            modifier = Modifier.size(16.dp),
            tint = Primary
        )
        Text(
            text = label,
            style = MaterialTheme.typography.labelMedium,
            color = if (isDark) Color.White.copy(alpha = 0.9f) else Primary,
            fontWeight = androidx.compose.ui.text.font.FontWeight.Medium
        )
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
    onNavigateToAvyaChat: () -> Unit,
    onNavigateToActionCenter: () -> Unit = {},
    onNavigateToReports: () -> Unit = {},
    onNavigateToCalculators: () -> Unit = {},
    onNavigateToAddClient: () -> Unit = {}
) {
    val context = LocalContext.current
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

        // Hero KPI Cards - 2x2 grid matching web portal
        item {
            Column(verticalArrangement = Arrangement.spacedBy(Spacing.compact)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(Spacing.compact)
                ) {
                    HeroStatCard(
                        label = "TOTAL AUM",
                        value = dashboard.formattedAum,
                        gradientColors = if (isDark) listOf(Color(0xFF1E3A6E), Color(0xFF152C54))
                            else listOf(Color(0xFF3B82F6), Color(0xFF2563EB)),
                        growth = dashboard.aumGrowth,
                        modifier = Modifier.weight(1f),
                        onClick = {
                            selectedKpiType = KpiDetailType.AUM
                            showKpiDetailSheet = true
                        }
                    )
                    HeroStatCard(
                        label = "TOTAL CLIENTS",
                        value = dashboard.totalClients.toString(),
                        gradientColors = if (isDark) listOf(Color(0xFF164E6E), Color(0xFF1A3A5C))
                            else listOf(Color(0xFF38BDF8), Color(0xFF3B82F6)),
                        growth = dashboard.clientsGrowth,
                        modifier = Modifier.weight(1f),
                        onClick = {
                            selectedKpiType = KpiDetailType.CLIENTS
                            showKpiDetailSheet = true
                        }
                    )
                }
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(Spacing.compact)
                ) {
                    HeroStatCard(
                        label = "AVG. RETURNS",
                        value = "${"%.1f".format(dashboard.avgReturns)}%",
                        gradientColors = if (isDark) listOf(Color(0xFF0B4D38), Color(0xFF073D2C))
                            else listOf(Color(0xFF10B981), Color(0xFF047857)),
                        growthText = "+0.8% MoM",
                        modifier = Modifier.weight(1f),
                        onClick = {
                            selectedKpiType = KpiDetailType.RETURNS
                            showKpiDetailSheet = true
                        }
                    )
                    HeroStatCard(
                        label = "MONTHLY SIP",
                        value = dashboard.formattedMonthlySip,
                        gradientColors = if (isDark) listOf(Color(0xFF1A3560), Color(0xFF144260))
                            else listOf(Color(0xFF2563EB), Color(0xFF38BDF8)),
                        growth = dashboard.sipsGrowth,
                        modifier = Modifier.weight(1f),
                        onClick = {
                            selectedKpiType = KpiDetailType.SIPS
                            showKpiDetailSheet = true
                        }
                    )
                }
            }
        }

        // Quick Actions Row (below hero tiles)
        item {
            QuickActionsRow(
                onNavigateToTransactions = onNavigateToTransactions,
                onNavigateToAddClient = onNavigateToAddClient,
                onNavigateToReports = onNavigateToReports,
                onNavigateToCalculators = onNavigateToCalculators
            )
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
                    onSipClick = { sip -> onNavigateToClient(sip.clientId) },
                    onShareFailedSip = { sip -> shareSipFailure(context, sip) }
                )
            }
        }

        // Pending Actions Section
        if (dashboard.pendingTransactions.isNotEmpty()) {
            item {
                SectionHeader(
                    title = "Pending Actions",
                    actionText = "View All",
                    onActionClick = onNavigateToActionCenter
                )
            }

            item {
                GlassCard(
                    cornerRadius = CornerRadius.large,
                    contentPadding = Spacing.small
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(Spacing.small)) {
                        dashboard.pendingTransactions.take(3).forEach { transaction ->
                            PendingTransactionItem(
                                transaction = transaction,
                                onClick = { onNavigateToClient(transaction.clientId) }
                            )
                        }
                    }
                }
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
private fun HeroStatCard(
    label: String,
    value: String,
    gradientColors: List<Color>,
    modifier: Modifier = Modifier,
    growth: KpiGrowth? = null,
    growthText: String? = null,
    onClick: (() -> Unit)? = null
) {
    val displayGrowthText = growthText ?: growth?.let {
        "${it.formattedMomChange} MoM"
    }

    Box(
        modifier = modifier
            .clip(RoundedCornerShape(CornerRadius.large))
            .background(brush = Brush.linearGradient(gradientColors))
            .then(if (onClick != null) Modifier.clickable(onClick = onClick) else Modifier)
            .padding(Spacing.medium)
    ) {
        // Decorative circles
        Box(
            modifier = Modifier
                .size(64.dp)
                .align(Alignment.TopEnd)
                .offset(x = 16.dp, y = (-16).dp)
                .clip(CircleShape)
                .background(Color.White.copy(alpha = 0.1f))
        )
        Box(
            modifier = Modifier
                .size(80.dp)
                .align(Alignment.BottomStart)
                .offset(x = (-24).dp, y = 24.dp)
                .clip(CircleShape)
                .background(Color.White.copy(alpha = 0.05f))
        )

        Column {
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall,
                color = Color.White.copy(alpha = 0.7f),
                letterSpacing = 1.sp
            )
            Spacer(modifier = Modifier.height(Spacing.small))
            Text(
                text = value,
                style = MaterialTheme.typography.titleLarge,
                color = Color.White
            )
            if (displayGrowthText != null) {
                Spacer(modifier = Modifier.height(Spacing.small))
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(50))
                        .background(Color.White.copy(alpha = 0.2f))
                        .border(
                            width = 1.dp,
                            color = Color.White.copy(alpha = 0.3f),
                            shape = RoundedCornerShape(50)
                        )
                        .padding(horizontal = 8.dp, vertical = 2.dp)
                ) {
                    Text(
                        text = displayGrowthText,
                        style = MaterialTheme.typography.labelSmall,
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
        modifier = modifier,
        cornerRadius = CornerRadius.large,
        contentPadding = Spacing.compact,
        onClick = onClick
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
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(CornerRadius.small))
            .background(Warning.copy(alpha = 0.05f))
            .clickable(onClick = onClick)
            .padding(Spacing.compact),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.weight(1f)
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(RoundedCornerShape(CornerRadius.small))
                    .background(Warning.copy(alpha = 0.1f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.Notifications,
                    contentDescription = null,
                    modifier = Modifier.size(20.dp),
                    tint = Warning
                )
            }
            Spacer(modifier = Modifier.width(Spacing.compact))
            Column {
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
        }
        Column(horizontalAlignment = Alignment.End) {
            Text(
                text = transaction.formattedAmount,
                style = MaterialTheme.typography.titleSmall,
                color = Warning
            )
            StatusBadge(status = transaction.status)
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
    onSipClick: (FASip) -> Unit,
    onShareFailedSip: (FASip) -> Unit = {}
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
                            onClick = { onSipClick(sip) },
                            onShareClick = { onShareFailedSip(sip) }
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
    onClick: () -> Unit,
    onShareClick: (() -> Unit)? = null
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
        horizontalArrangement = Arrangement.spacedBy(Spacing.small),
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
        // Share button for failed SIPs
        if (isFailed && onShareClick != null) {
            IconButton(
                onClick = onShareClick,
                modifier = Modifier.size(32.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Share,
                    contentDescription = "Share with client",
                    tint = Primary,
                    modifier = Modifier.size(18.dp)
                )
            }
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
    var chartPeriod by remember { mutableStateOf(ChartPeriod.THREE_MONTHS) }

    val title = when (kpiType) {
        KpiDetailType.AUM -> "AUM Growth Trend"
        KpiDetailType.CLIENTS -> "Client Growth Trend"
        KpiDetailType.RETURNS -> "Returns Trend"
        KpiDetailType.SIPS -> "SIP Value Trend"
    }

    val currentValue = when (kpiType) {
        KpiDetailType.AUM -> dashboard.formattedAum
        KpiDetailType.CLIENTS -> "${dashboard.totalClients} clients"
        KpiDetailType.RETURNS -> "${"%.1f".format(dashboard.avgReturns)}%"
        KpiDetailType.SIPS -> dashboard.formattedMonthlySip
    }

    val currentNumericValue = when (kpiType) {
        KpiDetailType.AUM -> dashboard.totalAum
        KpiDetailType.CLIENTS -> dashboard.totalClients.toDouble()
        KpiDetailType.RETURNS -> dashboard.avgReturns
        KpiDetailType.SIPS -> dashboard.monthlySipValue
    }

    // Growth data — synthesized for returns
    val growth: KpiGrowth? = when (kpiType) {
        KpiDetailType.AUM -> dashboard.aumGrowth
        KpiDetailType.CLIENTS -> dashboard.clientsGrowth
        KpiDetailType.RETURNS -> KpiGrowth(
            momChange = 0.8, momAbsolute = 0.2,
            yoyChange = 4.5, yoyAbsolute = 1.8,
            prevMonthValue = dashboard.avgReturns - 0.2,
            prevYearValue = dashboard.avgReturns - 1.8
        )
        KpiDetailType.SIPS -> dashboard.sipsGrowth
    }

    // Synthesize period-aware trend data
    val trendData = remember(kpiType, chartPeriod) {
        if (growth != null && currentNumericValue > 0) {
            synthesizePeriodTrend(growth.momChange, currentNumericValue, chartPeriod)
        } else emptyList()
    }

    val breakdownData: List<BreakdownItem> = when (kpiType) {
        KpiDetailType.AUM -> breakdown.aumBreakdown
        KpiDetailType.CLIENTS -> breakdown.clientsBreakdown
        KpiDetailType.SIPS -> breakdown.sipsBreakdown
        KpiDetailType.RETURNS -> emptyList()
    }

    val breakdownColors = listOf(Primary, Secondary, Success, Warning)

    // Gradient colors matching each hero card
    val headerGradient = when (kpiType) {
        KpiDetailType.AUM -> if (isDark) listOf(Color(0xFF1E3A6E), Color(0xFF152C54))
            else listOf(Color(0xFF3B82F6), Color(0xFF2563EB))
        KpiDetailType.CLIENTS -> if (isDark) listOf(Color(0xFF164E6E), Color(0xFF1A3A5C))
            else listOf(Color(0xFF38BDF8), Color(0xFF3B82F6))
        KpiDetailType.RETURNS -> if (isDark) listOf(Color(0xFF0B4D38), Color(0xFF073D2C))
            else listOf(Color(0xFF10B981), Color(0xFF047857))
        KpiDetailType.SIPS -> if (isDark) listOf(Color(0xFF1A3560), Color(0xFF144260))
            else listOf(Color(0xFF2563EB), Color(0xFF38BDF8))
    }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(if (isDark) Color(0xFF1E293B) else Color(0xFFF8FAFC))
    ) {
        // Gradient Header Bar
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(brush = Brush.linearGradient(headerGradient))
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
                        color = Color.White.copy(alpha = 0.85f)
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = currentValue,
                        style = MaterialTheme.typography.headlineSmall,
                        color = Color.White
                    )
                }
                IconButton(
                    onClick = onDismiss,
                    modifier = Modifier.size(32.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Close,
                        contentDescription = "Close",
                        modifier = Modifier.size(18.dp),
                        tint = Color.White.copy(alpha = 0.8f)
                    )
                }
            }
        }

        // Period Filters below header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = Spacing.large, vertical = Spacing.compact),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Spacer(modifier = Modifier.weight(1f))
            PeriodFilterPills(
                selectedPeriod = chartPeriod,
                onPeriodSelected = { chartPeriod = it }
            )
        }

        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = Spacing.large)
                .padding(bottom = Spacing.xLarge)
        ) {
            // Stat Pills Row
            if (growth != null) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(Spacing.small)
                ) {
                    StatPill(
                        label = "MoM",
                        value = growth.formattedMomChange,
                        valueColor = if (growth.isMomPositive) Success else Error,
                        modifier = Modifier.weight(1f)
                    )
                    StatPill(
                        label = "YoY",
                        value = growth.formattedYoyChange,
                        valueColor = if (growth.isYoyPositive) Success else Error,
                        modifier = Modifier.weight(1f)
                    )
                    StatPill(
                        label = "Prev Month",
                        value = formatGrowthValue(growth.prevMonthValue, kpiType),
                        modifier = Modifier.weight(1f)
                    )
                    StatPill(
                        label = "Current",
                        value = currentValue,
                        valueColor = Primary,
                        modifier = Modifier.weight(1f)
                    )
                }
                Spacer(modifier = Modifier.height(Spacing.medium))
            }

            // Area Chart
            if (trendData.size >= 2) {
                AreaChart(data = trendData)
            } else {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(80.dp)
                        .clip(RoundedCornerShape(CornerRadius.large))
                        .background(if (isDark) Color.White.copy(alpha = 0.08f) else Color.White),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "No trend data available",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            // Top Performers — only for Returns KPI
            if (kpiType == KpiDetailType.RETURNS && dashboard.topPerformers.isNotEmpty()) {
                Spacer(modifier = Modifier.height(Spacing.medium))
                HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
                Spacer(modifier = Modifier.height(Spacing.compact))

                Text(
                    text = "TOP PERFORMERS",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    letterSpacing = 1.sp
                )
                Spacer(modifier = Modifier.height(Spacing.small))

                dashboard.topPerformers.take(3).forEachIndexed { index, client ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(CornerRadius.medium))
                            .background(Success.copy(alpha = 0.06f))
                            .padding(horizontal = Spacing.compact, vertical = Spacing.small),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(Spacing.small)
                        ) {
                            Text(
                                text = "#${index + 1}",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Text(
                                text = client.name,
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                        }
                        Text(
                            text = "${if (client.returns >= 0) "+" else ""}${"%.1f".format(client.returns)}%",
                            style = MaterialTheme.typography.titleSmall,
                            color = if (client.returns >= 0) Success else Error
                        )
                    }
                    if (index < 2 && index < dashboard.topPerformers.size - 1) {
                        Spacer(modifier = Modifier.height(Spacing.small))
                    }
                }
            }

            // Breakdown Section — for non-returns KPIs
            if (breakdownData.isNotEmpty()) {
                Spacer(modifier = Modifier.height(Spacing.medium))
                HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
                Spacer(modifier = Modifier.height(Spacing.compact))

                Text(
                    text = "BREAKDOWN",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    letterSpacing = 1.sp
                )
                Spacer(modifier = Modifier.height(Spacing.small))

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
            }
        }
    }
}

@Composable
private fun StatPill(
    label: String,
    value: String,
    modifier: Modifier = Modifier,
    valueColor: Color? = null
) {
    val isDark = LocalIsDarkTheme.current
    val pillBg = if (valueColor == Success || valueColor == Error) {
        valueColor.copy(alpha = 0.08f)
    } else {
        if (isDark) Color.White.copy(alpha = 0.06f) else Color(0xFF3B82F6).copy(alpha = 0.04f)
    }
    val pillBorder = if (valueColor == Success || valueColor == Error) {
        valueColor.copy(alpha = 0.2f)
    } else {
        if (isDark) Color.White.copy(alpha = 0.1f) else Color(0xFF3B82F6).copy(alpha = 0.1f)
    }

    Column(
        modifier = modifier
            .clip(RoundedCornerShape(CornerRadius.large))
            .background(pillBg)
            .border(1.dp, pillBorder, RoundedCornerShape(CornerRadius.large))
            .padding(horizontal = Spacing.small, vertical = Spacing.small),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            fontSize = 9.sp,
            maxLines = 1
        )
        Text(
            text = value,
            style = MaterialTheme.typography.labelMedium,
            color = valueColor ?: MaterialTheme.colorScheme.onSurface,
            maxLines = 1
        )
    }
}

@Composable
private fun PeriodFilterPills(
    selectedPeriod: ChartPeriod,
    onPeriodSelected: (ChartPeriod) -> Unit
) {
    val isDark = LocalIsDarkTheme.current

    Row(
        modifier = Modifier
            .clip(RoundedCornerShape(CornerRadius.medium))
            .background(
                if (isDark) Color.White.copy(alpha = 0.06f)
                else Color(0xFF3B82F6).copy(alpha = 0.04f)
            )
            .padding(2.dp),
        horizontalArrangement = Arrangement.spacedBy(2.dp)
    ) {
        ChartPeriod.entries.forEach { period ->
            val isSelected = period == selectedPeriod
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(6.dp))
                    .background(
                        if (isSelected) Brush.linearGradient(
                            listOf(
                                if (isDark) Color(0xFF93C5FD) else Color(0xFF3B82F6),
                                if (isDark) Color(0xFF60A5FA) else Color(0xFF2563EB)
                            )
                        ) else Brush.linearGradient(listOf(Color.Transparent, Color.Transparent))
                    )
                    .clickable { onPeriodSelected(period) }
                    .padding(horizontal = 8.dp, vertical = 4.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = period.label,
                    style = MaterialTheme.typography.labelSmall,
                    color = if (isSelected) Color.White
                        else if (isDark) Color(0xFF94A3B8) else Color(0xFF64748B),
                    fontSize = 10.sp
                )
            }
        }
    }
}

@Composable
private fun AreaChart(
    data: List<TrendDataPoint>,
    modifier: Modifier = Modifier
) {
    if (data.size < 2) return

    val isDark = LocalIsDarkTheme.current
    val lineColor = if (isDark) Color(0xFF93C5FD) else Color(0xFF3B82F6)
    val areaStartColor = lineColor.copy(alpha = if (isDark) 0.25f else 0.18f)
    val areaEndColor = lineColor.copy(alpha = 0f)
    val gridColor = if (isDark) Color.White.copy(alpha = 0.06f) else Color(0xFF3B82F6).copy(alpha = 0.06f)
    val labelColor = if (isDark) Color(0xFF94A3B8) else Color(0xFF64748B)

    Column(modifier = modifier) {
        Canvas(
            modifier = Modifier
                .fillMaxWidth()
                .height(200.dp)
        ) {
            val canvasWidth = size.width
            val canvasHeight = size.height

            val values = data.map { it.value }
            val minVal = values.min()
            val maxVal = values.max()
            val range = if (maxVal > minVal) maxVal - minVal else 1.0
            val vPadding = range * 0.1
            val adjustedMin = minVal - vPadding
            val adjustedRange = (maxVal + vPadding) - adjustedMin

            val points = data.mapIndexed { i, dp ->
                val x = (i.toFloat() / (data.size - 1).coerceAtLeast(1)) * canvasWidth
                val y = canvasHeight - ((dp.value - adjustedMin) / adjustedRange * canvasHeight).toFloat()
                Offset(x, y)
            }

            // Dashed grid lines
            for (i in 0..3) {
                val y = canvasHeight * (1f - i / 3f)
                drawLine(
                    color = gridColor,
                    start = Offset(0f, y),
                    end = Offset(canvasWidth, y),
                    strokeWidth = 1f,
                    pathEffect = PathEffect.dashPathEffect(floatArrayOf(6f, 4f))
                )
            }

            // Smooth bezier path
            val linePath = Path().apply {
                moveTo(points[0].x, points[0].y)
                for (i in 1 until points.size) {
                    val prev = points[i - 1]
                    val curr = points[i]
                    val cpx = (prev.x + curr.x) / 2f
                    cubicTo(cpx, prev.y, cpx, curr.y, curr.x, curr.y)
                }
            }

            // Area fill
            val areaPath = Path().apply {
                addPath(linePath)
                lineTo(points.last().x, canvasHeight)
                lineTo(points.first().x, canvasHeight)
                close()
            }

            drawPath(
                path = areaPath,
                brush = Brush.verticalGradient(
                    colors = listOf(areaStartColor, areaEndColor),
                    startY = 0f,
                    endY = canvasHeight
                )
            )

            // Line stroke with glow
            drawPath(
                path = linePath,
                color = lineColor,
                style = Stroke(
                    width = 2.5.dp.toPx(),
                    cap = StrokeCap.Round,
                    join = StrokeJoin.Round
                )
            )

            // Dot at latest point
            drawCircle(
                color = Color.White,
                radius = 4.dp.toPx(),
                center = points.last()
            )
            drawCircle(
                color = lineColor,
                radius = 3.dp.toPx(),
                center = points.last()
            )
        }

        // X-axis labels
        Spacer(modifier = Modifier.height(4.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            val indices = selectLabelIndices(data.size, 6)
            indices.forEach { i ->
                Text(
                    text = data[i].label,
                    style = MaterialTheme.typography.labelSmall,
                    color = labelColor,
                    fontSize = 10.sp
                )
            }
        }
    }
}

private fun selectLabelIndices(total: Int, maxLabels: Int): List<Int> {
    if (total <= maxLabels) return (0 until total).toList()
    val step = (total - 1).toFloat() / (maxLabels - 1)
    return (0 until maxLabels).map { (it * step).toInt().coerceAtMost(total - 1) }
}

private fun synthesizePeriodTrend(
    momChange: Double,
    currentValue: Double,
    period: ChartPeriod
): List<TrendDataPoint> {
    val now = LocalDate.now()
    val monthlyRate = momChange / 100.0
    val dailyRate = Math.pow(1 + monthlyRate, 1.0 / 30.0) - 1
    val weeklyRate = Math.pow(1 + monthlyRate, 7.0 / 30.0) - 1
    val isFlat = Math.abs(monthlyRate) < 0.001

    data class PeriodConfig(
        val points: Int,
        val getDate: (Int) -> LocalDate,
        val formatLabel: (LocalDate) -> String,
        val rate: Double
    )

    val config = when (period) {
        ChartPeriod.ONE_WEEK -> PeriodConfig(
            points = 7,
            getDate = { i -> now.minusDays((6 - i).toLong()) },
            formatLabel = { d -> d.dayOfWeek.getDisplayName(JavaTextStyle.SHORT, Locale.ENGLISH) },
            rate = dailyRate
        )
        ChartPeriod.ONE_MONTH -> PeriodConfig(
            points = 30,
            getDate = { i -> now.minusDays((29 - i).toLong()) },
            formatLabel = { d -> "${d.dayOfMonth} ${d.month.getDisplayName(JavaTextStyle.SHORT, Locale.ENGLISH)}" },
            rate = dailyRate
        )
        ChartPeriod.THREE_MONTHS -> PeriodConfig(
            points = 12,
            getDate = { i -> now.minusDays(((11 - i) * 7).toLong()) },
            formatLabel = { d -> "${d.dayOfMonth} ${d.month.getDisplayName(JavaTextStyle.SHORT, Locale.ENGLISH)}" },
            rate = weeklyRate
        )
        ChartPeriod.SIX_MONTHS -> PeriodConfig(
            points = 6,
            getDate = { i -> now.minusMonths((5 - i).toLong()) },
            formatLabel = { d -> d.month.getDisplayName(JavaTextStyle.SHORT, Locale.ENGLISH) },
            rate = monthlyRate
        )
        ChartPeriod.ONE_YEAR -> PeriodConfig(
            points = 12,
            getDate = { i -> now.minusMonths((11 - i).toLong()) },
            formatLabel = { d -> "${d.month.getDisplayName(JavaTextStyle.SHORT, Locale.ENGLISH)} '${d.year % 100}" },
            rate = monthlyRate
        )
    }

    var seed = currentValue * 13.7 + period.label.first().code
    fun pseudoRandom(): Double {
        seed = (seed * 9301 + 49297) % 233280
        return seed / 233280.0
    }

    return (0 until config.points).map { i ->
        val d = config.getDate(i)
        val stepsFromEnd = config.points - 1 - i
        val factor = Math.pow(1 + config.rate, stepsFromEnd.toDouble())
        var value = if (factor > 0) currentValue / factor else currentValue
        if (!isFlat) {
            value *= 1 + (pseudoRandom() - 0.5) * 0.03
        } else {
            value = currentValue + Math.sin(
                (i.toDouble() / (config.points - 1).coerceAtLeast(1)) * Math.PI * 2
            ) * currentValue * 0.015
        }
        TrendDataPoint(label = config.formatLabel(d), value = value)
    }
}

private fun formatGrowthValue(value: Double, kpiType: KpiDetailType): String {
    return when (kpiType) {
        KpiDetailType.AUM, KpiDetailType.SIPS -> when {
            value >= 10000000 -> "₹%.1fCr".format(value / 10000000)
            value >= 100000 -> "₹%.1fL".format(value / 100000)
            value >= 1000 -> "₹%.1fK".format(value / 1000)
            else -> "₹%.0f".format(value)
        }
        KpiDetailType.CLIENTS -> "%.0f".format(value)
        KpiDetailType.RETURNS -> "%.1f%%".format(value)
    }
}
