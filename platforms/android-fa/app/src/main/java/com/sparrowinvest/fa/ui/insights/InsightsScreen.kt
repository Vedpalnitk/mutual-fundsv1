package com.sparrowinvest.fa.ui.insights

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.expandVertically
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.TrendingUp
import androidx.compose.material.icons.filled.Analytics
import androidx.compose.material.icons.filled.ArrowUpward
import androidx.compose.material.icons.filled.Balance
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.ExpandLess
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material.icons.filled.Flag
import androidx.compose.material.icons.filled.Lightbulb
import androidx.compose.material.icons.filled.NotificationsActive
import androidx.compose.material.icons.filled.Psychology
import androidx.compose.material.icons.filled.TipsAndUpdates
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
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
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.sparrowinvest.fa.data.model.GoalAlert
import com.sparrowinvest.fa.data.model.PortfolioHealthItem
import com.sparrowinvest.fa.data.model.RebalancingAlert
import com.sparrowinvest.fa.data.model.TaxHarvestingOpportunity
import com.sparrowinvest.fa.ui.components.ErrorState
import com.sparrowinvest.fa.ui.components.GlassCard
import com.sparrowinvest.fa.ui.components.IconContainer
import com.sparrowinvest.fa.ui.components.ListItemCard
import com.sparrowinvest.fa.ui.components.LoadingIndicator
import com.sparrowinvest.fa.ui.theme.CardBorderDark
import com.sparrowinvest.fa.ui.theme.CardBorderLight
import com.sparrowinvest.fa.ui.theme.CornerRadius
import com.sparrowinvest.fa.ui.theme.Error
import com.sparrowinvest.fa.ui.theme.GradientEndCyan
import com.sparrowinvest.fa.ui.theme.GradientStartBlue
import com.sparrowinvest.fa.ui.theme.Info
import com.sparrowinvest.fa.ui.theme.LocalIsDarkTheme
import com.sparrowinvest.fa.ui.theme.Primary
import com.sparrowinvest.fa.ui.theme.Secondary
import com.sparrowinvest.fa.ui.theme.SecondaryFillDark
import com.sparrowinvest.fa.ui.theme.Spacing
import com.sparrowinvest.fa.ui.theme.Success
import com.sparrowinvest.fa.ui.theme.TertiaryFillLight
import com.sparrowinvest.fa.ui.theme.Warning

// Avya gradient colors
private val AvyaGradient = Brush.linearGradient(
    colors = listOf(
        Color(0xFF6366F1), // Purple
        Color(0xFF3B82F6), // Blue
        Color(0xFF06B6D4)  // Cyan
    )
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun InsightsScreen(
    viewModel: InsightsViewModel = hiltViewModel(),
    onNavigateToClient: (String) -> Unit,
    onNavigateToChat: (String?) -> Unit = {}
) {
    val uiState by viewModel.uiState.collectAsState()
    val isRefreshing = uiState is InsightsUiState.Loading

    PullToRefreshBox(
        isRefreshing = isRefreshing,
        onRefresh = { viewModel.refresh() },
        modifier = Modifier.fillMaxSize()
    ) {
        when (val state = uiState) {
            is InsightsUiState.Loading -> {
                LoadingIndicator(
                    modifier = Modifier.fillMaxSize(),
                    message = "Analyzing portfolios..."
                )
            }
            is InsightsUiState.Error -> {
                ErrorState(
                    message = state.message,
                    onRetry = { viewModel.refresh() },
                    modifier = Modifier.fillMaxSize()
                )
            }
            is InsightsUiState.Success -> {
                InsightsContent(
                    data = state.data,
                    onNavigateToClient = onNavigateToClient,
                    onNavigateToChat = onNavigateToChat
                )
            }
        }
    }
}

private enum class InsightTab(
    val title: String,
    val icon: ImageVector,
    val color: Color
) {
    HEALTH("Health", Icons.Default.Analytics, Primary),
    REBALANCING("Rebalance", Icons.Default.Balance, Warning),
    GOALS("Goals", Icons.Default.Flag, Error),
    TAX("Tax", Icons.Default.TipsAndUpdates, Success)
}

@Composable
private fun InsightsContent(
    data: FAInsightsData,
    onNavigateToClient: (String) -> Unit,
    onNavigateToChat: (String?) -> Unit
) {
    val isDark = LocalIsDarkTheme.current
    var askQuery by remember { mutableStateOf("") }
    val focusManager = LocalFocusManager.current
    var selectedInsightTab by remember { mutableStateOf(InsightTab.HEALTH) }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = Spacing.medium),
        verticalArrangement = Arrangement.spacedBy(Spacing.medium)
    ) {
        item {
            Spacer(modifier = Modifier.height(Spacing.medium))
        }

        // Avya AI Hub Header with integrated Ask Bar
        item {
            AvyaHubHeader(
                askQuery = askQuery,
                onQueryChange = { askQuery = it },
                isDark = isDark,
                onSubmit = {
                    if (askQuery.isNotBlank()) {
                        onNavigateToChat(askQuery)
                        askQuery = ""
                        focusManager.clearFocus()
                    }
                },
                onOpenChat = { onNavigateToChat(null) }
            )
        }

        // Quick Action Chips
        item {
            QuickActionChips(
                onActionClick = { query -> onNavigateToChat(query) }
            )
        }

        // Proactive AI Recommendations
        item {
            ProactiveRecommendationsCard(
                data = data,
                onNavigateToClient = onNavigateToClient,
                onAskAvya = { query -> onNavigateToChat(query) }
            )
        }

        // Insight Tabs
        item {
            InsightTabBar(
                selectedTab = selectedInsightTab,
                onTabSelected = { selectedInsightTab = it },
                counts = mapOf(
                    InsightTab.HEALTH to data.portfolioHealth.size,
                    InsightTab.REBALANCING to data.rebalancingAlerts.size,
                    InsightTab.GOALS to data.goalAlerts.size,
                    InsightTab.TAX to data.taxHarvesting.size
                )
            )
        }

        // Tab Content
        when (selectedInsightTab) {
            InsightTab.HEALTH -> {
                if (data.portfolioHealth.isEmpty()) {
                    item { InsightEmptyState("No portfolio health alerts") }
                } else {
                    items(data.portfolioHealth) { item ->
                        PortfolioHealthCard(
                            item = item,
                            onClick = { onNavigateToClient(item.clientId) }
                        )
                    }
                }
            }
            InsightTab.REBALANCING -> {
                if (data.rebalancingAlerts.isEmpty()) {
                    item { InsightEmptyState("No rebalancing alerts") }
                } else {
                    items(data.rebalancingAlerts) { alert ->
                        RebalancingAlertCard(
                            alert = alert,
                            onClick = { onNavigateToClient(alert.clientId) }
                        )
                    }
                }
            }
            InsightTab.GOALS -> {
                if (data.goalAlerts.isEmpty()) {
                    item { InsightEmptyState("No goals at risk") }
                } else {
                    items(data.goalAlerts) { alert ->
                        GoalAlertCard(
                            alert = alert,
                            onClick = { onNavigateToClient(alert.clientId) }
                        )
                    }
                }
            }
            InsightTab.TAX -> {
                if (data.taxHarvesting.isEmpty()) {
                    item { InsightEmptyState("No tax harvesting opportunities") }
                } else {
                    items(data.taxHarvesting) { opportunity ->
                        TaxHarvestingCard(
                            opportunity = opportunity,
                            onClick = { onNavigateToClient(opportunity.clientId) }
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
private fun InsightTabBar(
    selectedTab: InsightTab,
    onTabSelected: (InsightTab) -> Unit,
    counts: Map<InsightTab, Int>
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .horizontalScroll(rememberScrollState()),
        horizontalArrangement = Arrangement.spacedBy(Spacing.small)
    ) {
        InsightTab.entries.forEach { tab ->
            val isSelected = selectedTab == tab
            val count = counts[tab] ?: 0

            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(CornerRadius.large))
                    .background(
                        if (isSelected) tab.color
                        else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                    )
                    .clickable { onTabSelected(tab) }
                    .padding(horizontal = Spacing.compact, vertical = Spacing.small)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Icon(
                        imageVector = tab.icon,
                        contentDescription = null,
                        modifier = Modifier.size(16.dp),
                        tint = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = tab.title,
                        style = MaterialTheme.typography.labelMedium,
                        color = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    if (count > 0) {
                        Box(
                            modifier = Modifier
                                .size(18.dp)
                                .clip(CircleShape)
                                .background(
                                    if (isSelected) Color.White.copy(alpha = 0.2f)
                                    else tab.color.copy(alpha = 0.2f)
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "$count",
                                style = MaterialTheme.typography.labelSmall,
                                color = if (isSelected) Color.White else tab.color
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun InsightEmptyState(message: String) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = Spacing.xLarge),
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
private fun AvyaHubHeader(
    askQuery: String,
    onQueryChange: (String) -> Unit,
    isDark: Boolean,
    onSubmit: () -> Unit,
    onOpenChat: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(CornerRadius.xLarge))
            .background(AvyaGradient)
            .padding(Spacing.large)
    ) {
        // Decorative circles
        Box(
            modifier = Modifier
                .size(100.dp)
                .align(Alignment.TopEnd)
                .offset(x = 30.dp, y = (-20).dp)
                .background(Color.White.copy(alpha = 0.1f), CircleShape)
        )
        Box(
            modifier = Modifier
                .size(60.dp)
                .align(Alignment.BottomStart)
                .offset(x = (-15).dp, y = 15.dp)
                .background(Color.White.copy(alpha = 0.08f), CircleShape)
        )

        Column(
            modifier = Modifier.fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(Spacing.medium)
        ) {
            // Top row with avatar and chat button
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(Spacing.compact)
                ) {
                    // Avya Avatar (matching FAB style)
                    Box(
                        modifier = Modifier
                            .size(48.dp)
                            .clip(CircleShape)
                            .background(Color.White.copy(alpha = 0.2f))
                            .border(2.dp, Color.White.copy(alpha = 0.3f), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "✨",
                            fontSize = 22.sp
                        )
                    }

                    Column {
                        Text(
                            text = "Avya AI",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                        Text(
                            text = "Your portfolio assistant",
                            style = MaterialTheme.typography.bodySmall,
                            color = Color.White.copy(alpha = 0.8f)
                        )
                    }
                }

                // Open Chat Button
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(50))
                        .background(Color.White.copy(alpha = 0.2f))
                        .clickable(onClick = onOpenChat)
                        .padding(horizontal = Spacing.medium, vertical = Spacing.small)
                ) {
                    Text(
                        text = "Chat",
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.SemiBold,
                        color = Color.White
                    )
                }
            }

            // Integrated Ask Bar
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(50))
                    .background(Color.White.copy(alpha = 0.15f))
                    .border(1.dp, Color.White.copy(alpha = 0.3f), RoundedCornerShape(50))
                    .padding(horizontal = Spacing.medium, vertical = Spacing.small),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(Spacing.compact)
            ) {
                // Text Input
                BasicTextField(
                    value = askQuery,
                    onValueChange = onQueryChange,
                    modifier = Modifier.weight(1f),
                    singleLine = true,
                    textStyle = MaterialTheme.typography.bodyMedium.copy(
                        color = Color.White
                    ),
                    cursorBrush = SolidColor(Color.White),
                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Send),
                    keyboardActions = KeyboardActions(onSend = { onSubmit() }),
                    decorationBox = { innerTextField ->
                        Box {
                            if (askQuery.isEmpty()) {
                                Text(
                                    text = "Ask anything about your clients...",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = Color.White.copy(alpha = 0.6f)
                                )
                            }
                            innerTextField()
                        }
                    }
                )

                // Send Button
                val canSend = askQuery.isNotBlank()
                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .clip(CircleShape)
                        .background(
                            if (canSend) Color.White else Color.White.copy(alpha = 0.3f)
                        )
                        .clickable(enabled = canSend) { onSubmit() },
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.ArrowUpward,
                        contentDescription = "Send",
                        modifier = Modifier.size(16.dp),
                        tint = if (canSend) Color(0xFF6366F1) else Color.White.copy(alpha = 0.5f)
                    )
                }
            }
        }
    }
}

@Composable
private fun QuickActionChips(
    onActionClick: (String) -> Unit
) {
    val quickActions = listOf(
        "Portfolio risks" to Icons.Default.Warning,
        "Top performers" to Icons.AutoMirrored.Filled.TrendingUp,
        "SIP opportunities" to Icons.Default.NotificationsActive,
        "Tax saving" to Icons.Default.TipsAndUpdates
    )

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .horizontalScroll(rememberScrollState()),
        horizontalArrangement = Arrangement.spacedBy(Spacing.small)
    ) {
        quickActions.forEach { (label, icon) ->
            QuickActionChip(
                label = label,
                icon = icon,
                onClick = { onActionClick("Tell me about $label for my clients") }
            )
        }
    }
}

@Composable
private fun QuickActionChip(
    label: String,
    icon: ImageVector,
    onClick: () -> Unit
) {
    val isDark = LocalIsDarkTheme.current

    Row(
        modifier = Modifier
            .clip(RoundedCornerShape(50))
            .background(if (isDark) SecondaryFillDark else TertiaryFillLight)
            .border(
                width = 1.dp,
                color = if (isDark) CardBorderDark else CardBorderLight,
                shape = RoundedCornerShape(50)
            )
            .clickable(onClick = onClick)
            .padding(horizontal = Spacing.compact, vertical = Spacing.small),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            modifier = Modifier.size(14.dp),
            tint = Primary
        )
        Text(
            text = label,
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.onSurface
        )
    }
}

@Composable
private fun ProactiveRecommendationsCard(
    data: FAInsightsData,
    onNavigateToClient: (String) -> Unit,
    onAskAvya: (String) -> Unit
) {
    val isDark = LocalIsDarkTheme.current
    var expanded by remember { mutableStateOf(true) }

    // Generate proactive recommendations based on data
    val priorityClient = data.portfolioHealth.minByOrNull { it.score }
    val topOpportunity = data.taxHarvesting.maxByOrNull { it.potentialSavings }
    val sipOpportunity = data.sipOpportunities.firstOrNull()

    val recommendationCount = listOfNotNull(priorityClient, topOpportunity, sipOpportunity).size

    if (priorityClient != null || topOpportunity != null || sipOpportunity != null) {
        GlassCard(
            cornerRadius = CornerRadius.large
        ) {
            Column {
                // Header row (clickable to expand/collapse)
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { expanded = !expanded },
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(Spacing.small)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(28.dp)
                                .clip(CircleShape)
                                .background(AvyaGradient),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Lightbulb,
                                contentDescription = null,
                                modifier = Modifier.size(14.dp),
                                tint = Color.White
                            )
                        }
                        Column {
                            Text(
                                text = "AVYA RECOMMENDS",
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = FontWeight.SemiBold,
                                color = Primary,
                                letterSpacing = 1.sp
                            )
                            Text(
                                text = "$recommendationCount action items",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }

                    Icon(
                        imageVector = if (expanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                        contentDescription = if (expanded) "Collapse" else "Expand",
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                // Collapsible content
                AnimatedVisibility(
                    visible = expanded,
                    enter = expandVertically(),
                    exit = shrinkVertically()
                ) {
                    Column(
                        modifier = Modifier.padding(top = Spacing.compact),
                        verticalArrangement = Arrangement.spacedBy(Spacing.compact)
                    ) {
                        // Priority recommendation
                        priorityClient?.let { client ->
                            RecommendationItem(
                                title = "Priority: ${client.clientName}",
                                description = "Health score ${client.score}/100. ${client.issues.firstOrNull() ?: "Needs review"}",
                                actionLabel = "View Client",
                                accentColor = if (client.score < 60) Error else Warning,
                                onAction = { onNavigateToClient(client.clientId) },
                                onAskAvya = { onAskAvya("What should I do about ${client.clientName}'s portfolio?") }
                            )
                        }

                        // SIP Opportunity - clients without SIPs
                        sipOpportunity?.let { opp ->
                            RecommendationItem(
                                title = "SIP Opportunity: ${opp.clientName}",
                                description = "No active SIPs. Suggest ₹${"%,.0f".format(opp.suggestedSipAmount)}/month to build wealth.",
                                actionLabel = "Create SIP",
                                accentColor = Info,
                                onAction = { onNavigateToClient(opp.clientId) },
                                onAskAvya = { onAskAvya("What SIP should I recommend for ${opp.clientName}?") }
                            )
                        }

                        // Tax opportunity
                        topOpportunity?.let { opp ->
                            RecommendationItem(
                                title = "Tax Opportunity: ${opp.clientName}",
                                description = "Potential savings of ₹${"%,.0f".format(opp.potentialSavings)} via tax harvesting",
                                actionLabel = "View Details",
                                accentColor = Success,
                                onAction = { onNavigateToClient(opp.clientId) },
                                onAskAvya = { onAskAvya("Explain the tax harvesting opportunity for ${opp.clientName}") }
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun RecommendationItem(
    title: String,
    description: String,
    actionLabel: String,
    accentColor: Color,
    onAction: () -> Unit,
    onAskAvya: () -> Unit
) {
    val isDark = LocalIsDarkTheme.current

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(CornerRadius.medium))
            .background(accentColor.copy(alpha = if (isDark) 0.15f else 0.08f))
            .padding(Spacing.compact),
        verticalArrangement = Arrangement.spacedBy(Spacing.small)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = description,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }

        Row(
            horizontalArrangement = Arrangement.spacedBy(Spacing.small)
        ) {
            // Action button
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(50))
                    .background(accentColor)
                    .clickable(onClick = onAction)
                    .padding(horizontal = Spacing.compact, vertical = 6.dp)
            ) {
                Text(
                    text = actionLabel,
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.SemiBold,
                    color = Color.White
                )
            }

            // Ask Avya button
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(50))
                    .background(AvyaGradient)
                    .clickable(onClick = onAskAvya)
                    .padding(horizontal = Spacing.compact, vertical = 6.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Psychology,
                        contentDescription = null,
                        modifier = Modifier.size(12.dp),
                        tint = Color.White
                    )
                    Text(
                        text = "Ask Avya",
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.SemiBold,
                        color = Color.White
                    )
                }
            }
        }
    }
}


@Composable
private fun PortfolioHealthCard(
    item: PortfolioHealthItem,
    onClick: () -> Unit
) {
    val scoreColor = when {
        item.score >= 80 -> Success
        item.score >= 60 -> Warning
        else -> Error
    }
    val statusLabel = when {
        item.score >= 80 -> "In-form"
        item.score >= 60 -> "On-track"
        item.score >= 40 -> "Off-track"
        else -> "Out-of-form"
    }

    ListItemCard(
        modifier = Modifier.clickable(onClick = onClick)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Circular progress health score
            Box(
                modifier = Modifier.size(56.dp),
                contentAlignment = Alignment.Center
            ) {
                androidx.compose.foundation.Canvas(modifier = Modifier.size(56.dp)) {
                    val strokeW = 5.dp.toPx()
                    val r = (size.minDimension - strokeW) / 2
                    val tl = androidx.compose.ui.geometry.Offset(
                        (size.width - r * 2) / 2,
                        (size.height - r * 2) / 2
                    )
                    val arcSize = androidx.compose.ui.geometry.Size(r * 2, r * 2)
                    // Background track
                    drawArc(
                        color = scoreColor.copy(alpha = 0.15f),
                        startAngle = -90f,
                        sweepAngle = 360f,
                        useCenter = false,
                        topLeft = tl,
                        size = arcSize,
                        style = androidx.compose.ui.graphics.drawscope.Stroke(width = strokeW, cap = androidx.compose.ui.graphics.StrokeCap.Round)
                    )
                    // Progress arc
                    drawArc(
                        color = scoreColor,
                        startAngle = -90f,
                        sweepAngle = (item.score / 100f) * 360f,
                        useCenter = false,
                        topLeft = tl,
                        size = arcSize,
                        style = androidx.compose.ui.graphics.drawscope.Stroke(width = strokeW, cap = androidx.compose.ui.graphics.StrokeCap.Round)
                    )
                }
                Text(
                    text = "${item.score}",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold,
                    color = scoreColor
                )
            }

            Spacer(modifier = Modifier.width(Spacing.compact))

            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = item.clientName,
                        style = MaterialTheme.typography.titleSmall,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = statusLabel,
                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.SemiBold),
                        color = scoreColor,
                        modifier = Modifier
                            .background(
                                color = scoreColor.copy(alpha = 0.1f),
                                shape = RoundedCornerShape(4.dp)
                            )
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    )
                }
                if (item.issues.isNotEmpty()) {
                    Text(
                        text = item.issues.first(),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
                if (item.recommendations.isNotEmpty()) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Lightbulb,
                            contentDescription = null,
                            modifier = Modifier.size(12.dp),
                            tint = Info
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = item.recommendations.first(),
                            style = MaterialTheme.typography.labelSmall,
                            color = Info,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }
            }

            Icon(
                imageVector = Icons.Default.ChevronRight,
                contentDescription = null,
                modifier = Modifier.size(20.dp),
                tint = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun RebalancingAlertCard(
    alert: RebalancingAlert,
    onClick: () -> Unit
) {
    val actionColor = if (alert.action == "INCREASE") Success else Error

    ListItemCard(
        modifier = Modifier.clickable(onClick = onClick)
    ) {
        Column(modifier = Modifier.fillMaxWidth()) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconContainer(
                    size = 44.dp,
                    backgroundColor = Warning.copy(alpha = 0.1f)
                ) {
                    Icon(
                        imageVector = Icons.Default.Balance,
                        contentDescription = null,
                        modifier = Modifier.size(22.dp),
                        tint = Warning
                    )
                }

                Spacer(modifier = Modifier.width(Spacing.compact))

                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = alert.clientName,
                        style = MaterialTheme.typography.titleSmall,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = "${alert.assetClass} • ${alert.action} by ${"%.1f".format(kotlin.math.abs(alert.deviation))}%",
                        style = MaterialTheme.typography.labelSmall,
                        color = actionColor
                    )
                }

                Icon(
                    imageVector = Icons.Default.ChevronRight,
                    contentDescription = null,
                    modifier = Modifier.size(20.dp),
                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Allocation drift bars
            val maxAlloc = maxOf(alert.currentAllocation, alert.targetAllocation, 1.0).toFloat()

            // Current allocation bar
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Current",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.width(52.dp)
                )
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .height(8.dp)
                        .clip(RoundedCornerShape(4.dp))
                        .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth(fraction = (alert.currentAllocation / maxAlloc).toFloat().coerceIn(0f, 1f))
                            .fillMaxHeight()
                            .clip(RoundedCornerShape(4.dp))
                            .background(
                                Brush.horizontalGradient(
                                    listOf(actionColor.copy(alpha = 0.7f), actionColor)
                                )
                            )
                    )
                }
                Text(
                    text = "${"%.1f".format(alert.currentAllocation)}%",
                    style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.SemiBold),
                    color = actionColor,
                    modifier = Modifier.width(42.dp),
                    textAlign = androidx.compose.ui.text.style.TextAlign.End
                )
            }

            Spacer(modifier = Modifier.height(4.dp))

            // Target allocation bar
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Target",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.width(52.dp)
                )
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .height(8.dp)
                        .clip(RoundedCornerShape(4.dp))
                        .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth(fraction = (alert.targetAllocation / maxAlloc).toFloat().coerceIn(0f, 1f))
                            .fillMaxHeight()
                            .clip(RoundedCornerShape(4.dp))
                            .background(
                                Brush.horizontalGradient(
                                    listOf(Primary.copy(alpha = 0.7f), Primary)
                                )
                            )
                    )
                }
                Text(
                    text = "${"%.1f".format(alert.targetAllocation)}%",
                    style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.SemiBold),
                    color = Primary,
                    modifier = Modifier.width(42.dp),
                    textAlign = androidx.compose.ui.text.style.TextAlign.End
                )
            }
        }
    }
}

@Composable
private fun GoalAlertCard(
    alert: GoalAlert,
    onClick: () -> Unit
) {
    val statusColor = when (alert.status) {
        "ON_TRACK" -> Success
        "AT_RISK" -> Warning
        else -> Error
    }
    val statusLabel = when (alert.status) {
        "ON_TRACK" -> "On Track"
        "AT_RISK" -> "At Risk"
        else -> "Off Track"
    }

    ListItemCard(
        modifier = Modifier.clickable(onClick = onClick)
    ) {
        Column(modifier = Modifier.fillMaxWidth()) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconContainer(
                    size = 44.dp,
                    backgroundColor = statusColor.copy(alpha = 0.1f)
                ) {
                    Icon(
                        imageVector = Icons.Default.Flag,
                        contentDescription = null,
                        modifier = Modifier.size(22.dp),
                        tint = statusColor
                    )
                }

                Spacer(modifier = Modifier.width(Spacing.compact))

                Column(modifier = Modifier.weight(1f)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = alert.clientName,
                            style = MaterialTheme.typography.titleSmall,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = statusLabel,
                            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.SemiBold),
                            color = statusColor,
                            modifier = Modifier
                                .background(
                                    color = statusColor.copy(alpha = 0.1f),
                                    shape = RoundedCornerShape(4.dp)
                                )
                                .padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                    }
                    Text(
                        text = alert.goalName,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                Icon(
                    imageVector = Icons.Default.ChevronRight,
                    contentDescription = null,
                    modifier = Modifier.size(20.dp),
                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Message with status-colored left accent
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(
                        color = statusColor.copy(alpha = 0.05f),
                        shape = RoundedCornerShape(6.dp)
                    )
                    .padding(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .width(3.dp)
                        .height(24.dp)
                        .clip(RoundedCornerShape(2.dp))
                        .background(statusColor)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = alert.message,
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
            }
        }
    }
}

@Composable
private fun TaxHarvestingCard(
    opportunity: TaxHarvestingOpportunity,
    onClick: () -> Unit
) {
    ListItemCard(
        modifier = Modifier.clickable(onClick = onClick)
    ) {
        Column(modifier = Modifier.fillMaxWidth()) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconContainer(
                    size = 44.dp,
                    backgroundColor = Success.copy(alpha = 0.1f)
                ) {
                    Icon(
                        imageVector = Icons.Default.TipsAndUpdates,
                        contentDescription = null,
                        modifier = Modifier.size(22.dp),
                        tint = Success
                    )
                }

                Spacer(modifier = Modifier.width(Spacing.compact))

                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = opportunity.clientName,
                        style = MaterialTheme.typography.titleSmall,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = opportunity.fundName,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }

                Icon(
                    imageVector = Icons.Default.ChevronRight,
                    contentDescription = null,
                    modifier = Modifier.size(20.dp),
                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Loss and savings visual bar
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(8.dp)
                            .clip(CircleShape)
                            .background(Error)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "Loss: ₹${"%,.0f".format(opportunity.unrealizedLoss)}",
                        style = MaterialTheme.typography.labelSmall,
                        color = Error
                    )
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(8.dp)
                            .clip(CircleShape)
                            .background(Success)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "Tax Saved: ₹${"%,.0f".format(opportunity.potentialSavings)}",
                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.SemiBold),
                        color = Success
                    )
                }
            }

            Spacer(modifier = Modifier.height(6.dp))

            // Savings ratio bar
            val savingsRatio = if (opportunity.unrealizedLoss > 0)
                (opportunity.potentialSavings / opportunity.unrealizedLoss).toFloat().coerceIn(0f, 1f)
            else 0f

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(6.dp)
                    .clip(RoundedCornerShape(3.dp))
                    .background(Error.copy(alpha = 0.15f))
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth(fraction = savingsRatio)
                        .fillMaxHeight()
                        .clip(RoundedCornerShape(3.dp))
                        .background(
                            Brush.horizontalGradient(
                                listOf(Success.copy(alpha = 0.7f), Success)
                            )
                        )
                )
            }
        }
    }
}
