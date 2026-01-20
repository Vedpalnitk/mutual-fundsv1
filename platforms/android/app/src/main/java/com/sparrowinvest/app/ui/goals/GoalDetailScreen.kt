package com.sparrowinvest.app.ui.goals

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.TrendingUp
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.filled.Savings
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.sparrowinvest.app.data.model.Goal
import com.sparrowinvest.app.ui.components.CurrencyText
import com.sparrowinvest.app.ui.components.FullScreenLoading
import com.sparrowinvest.app.ui.components.GlassCard
import com.sparrowinvest.app.ui.components.ReturnText
import com.sparrowinvest.app.ui.components.SectionHeader
import com.sparrowinvest.app.ui.components.TopBar
import com.sparrowinvest.app.ui.components.formatCompactCurrency
import com.sparrowinvest.app.ui.theme.CornerRadius
import com.sparrowinvest.app.ui.theme.LocalIsDarkTheme
import com.sparrowinvest.app.ui.theme.Error
import com.sparrowinvest.app.ui.theme.LocalIsDarkTheme
import com.sparrowinvest.app.ui.theme.Primary
import com.sparrowinvest.app.ui.theme.LocalIsDarkTheme
import com.sparrowinvest.app.ui.theme.Spacing
import com.sparrowinvest.app.ui.theme.LocalIsDarkTheme
import com.sparrowinvest.app.ui.theme.Success
import com.sparrowinvest.app.ui.theme.LocalIsDarkTheme
import com.sparrowinvest.app.ui.theme.Warning
import com.sparrowinvest.app.ui.theme.LocalIsDarkTheme
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GoalDetailScreen(
    viewModel: GoalDetailViewModel = hiltViewModel(),
    onNavigateToFund: (Int) -> Unit,
    onBackClick: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    val goal by viewModel.goal.collectAsState()
    val linkedFunds by viewModel.linkedFunds.collectAsState()
    val contributions by viewModel.contributions.collectAsState()
    val milestones by viewModel.milestones.collectAsState()
    val projection by viewModel.projection.collectAsState()
    val totalContributions by viewModel.totalContributions.collectAsState()
    val totalReturns by viewModel.totalReturns.collectAsState()

    var showDeleteDialog by remember { mutableStateOf(false) }
    var showMenu by remember { mutableStateOf(false) }

    LaunchedEffect(uiState) {
        if (uiState is GoalDetailUiState.Deleted) {
            onBackClick()
        }
    }

    if (showDeleteDialog) {
        AlertDialog(
            onDismissRequest = { showDeleteDialog = false },
            title = { Text("Delete Goal") },
            text = { Text("Are you sure you want to delete this goal? This action cannot be undone.") },
            confirmButton = {
                TextButton(
                    onClick = {
                        showDeleteDialog = false
                        viewModel.deleteGoal()
                    },
                    colors = ButtonDefaults.textButtonColors(contentColor = Error)
                ) {
                    Text("Delete")
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }

    Scaffold(
        topBar = {
            TopBar(
                title = goal?.name ?: "Goal Details",
                onBackClick = onBackClick,
                modifier = Modifier.statusBarsPadding(),
                actions = {
                    Box {
                        IconButton(onClick = { showMenu = true }) {
                            Icon(
                                imageVector = Icons.Default.MoreVert,
                                contentDescription = "More options"
                            )
                        }
                        DropdownMenu(
                            expanded = showMenu,
                            onDismissRequest = { showMenu = false }
                        ) {
                            DropdownMenuItem(
                                text = { Text("Edit Goal") },
                                onClick = {
                                    showMenu = false
                                    // Navigate to edit
                                },
                                leadingIcon = {
                                    Icon(Icons.Default.Edit, contentDescription = null)
                                }
                            )
                            DropdownMenuItem(
                                text = { Text("Delete Goal", color = Error) },
                                onClick = {
                                    showMenu = false
                                    showDeleteDialog = true
                                },
                                leadingIcon = {
                                    Icon(Icons.Default.Delete, contentDescription = null, tint = Error)
                                }
                            )
                        }
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { /* Add contribution */ },
                containerColor = Primary
            ) {
                Icon(
                    imageVector = Icons.Default.Add,
                    contentDescription = "Add Contribution",
                    tint = Color.White
                )
            }
        }
    ) { paddingValues ->
        when (uiState) {
            is GoalDetailUiState.Loading -> {
                FullScreenLoading(modifier = Modifier.padding(paddingValues))
            }
            is GoalDetailUiState.Success -> {
                goal?.let { g ->
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(paddingValues),
                        contentPadding = PaddingValues(bottom = 100.dp),
                        verticalArrangement = Arrangement.spacedBy(Spacing.medium)
                    ) {
                        // Progress Header
                        item {
                            GoalProgressHeader(goal = g)
                        }

                        // Summary Card
                        item {
                            GoalSummaryCard(
                                goal = g,
                                totalContributions = totalContributions,
                                totalReturns = totalReturns
                            )
                        }

                        // Projection Card
                        item {
                            projection?.let { proj ->
                                ProjectionCard(projection = proj, goal = g)
                            }
                        }

                        // Milestones Section
                        if (milestones.isNotEmpty()) {
                            item {
                                SectionHeader(title = "Milestones")
                            }
                            item {
                                MilestonesTimeline(milestones = milestones, goal = g)
                            }
                        }

                        // Linked Funds Section
                        if (linkedFunds.isNotEmpty()) {
                            item {
                                SectionHeader(
                                    title = "Linked Funds",
                                    action = {
                                        TextButton(onClick = { /* Link fund */ }) {
                                            Icon(
                                                imageVector = Icons.Default.Add,
                                                contentDescription = null,
                                                modifier = Modifier.size(16.dp)
                                            )
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text("Link Fund")
                                        }
                                    }
                                )
                            }
                            items(linkedFunds) { fund ->
                                LinkedFundCard(
                                    fund = fund,
                                    onClick = { onNavigateToFund(fund.schemeCode) }
                                )
                            }
                        }

                        // Recent Contributions
                        if (contributions.isNotEmpty()) {
                            item {
                                SectionHeader(
                                    title = "Recent Contributions",
                                    action = {
                                        TextButton(onClick = { /* View all */ }) {
                                            Text("View All")
                                        }
                                    }
                                )
                            }
                            items(contributions.take(5)) { contribution ->
                                ContributionItem(contribution = contribution)
                            }
                        }

                        // Quick Actions
                        item {
                            Spacer(modifier = Modifier.height(Spacing.medium))
                            QuickActionsSection()
                        }
                    }
                }
            }
            else -> {}
        }
    }
}

@Composable
private fun GoalProgressHeader(goal: Goal) {
    val isDark = LocalIsDarkTheme.current
    val goalColor = Color(goal.category.color)

    GlassCard(
        modifier = Modifier.padding(horizontal = Spacing.medium)
    ) {
        Column(
            modifier = Modifier.fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Progress Ring
            Box(
                modifier = Modifier.size(180.dp),
                contentAlignment = Alignment.Center
            ) {
                AnimatedProgressRing(
                    progress = (goal.progressPercentage / 100f).toFloat(),
                    color = goalColor,
                    backgroundColor = goalColor.copy(alpha = 0.15f)
                )

                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = "${String.format(Locale.US, "%.1f", goal.progressPercentage)}%",
                        style = MaterialTheme.typography.headlineLarge,
                        fontWeight = FontWeight.Bold,
                        color = goalColor
                    )
                    Text(
                        text = "achieved",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            Spacer(modifier = Modifier.height(Spacing.medium))

            // Goal icon and name
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center
            ) {
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .clip(RoundedCornerShape(CornerRadius.small))
                        .background(goalColor.copy(alpha = 0.15f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = goal.category.icon,
                        contentDescription = null,
                        tint = goalColor,
                        modifier = Modifier.size(20.dp)
                    )
                }
                Spacer(modifier = Modifier.width(Spacing.small))
                Text(
                    text = goal.category.displayName,
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            Spacer(modifier = Modifier.height(Spacing.large))

            // Amount progress
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(
                        text = "Current Value",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    CurrencyText(
                        amount = goal.currentAmount,
                        style = MaterialTheme.typography.titleLarge,
                        color = goalColor,
                        compact = true
                    )
                }

                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        text = "Target",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    CurrencyText(
                        amount = goal.targetAmount,
                        style = MaterialTheme.typography.titleLarge,
                        compact = true
                    )
                }
            }

            Spacer(modifier = Modifier.height(Spacing.small))

            // Progress bar
            LinearProgressIndicator(
                progress = { (goal.progressPercentage / 100).toFloat().coerceIn(0f, 1f) },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(8.dp)
                    .clip(RoundedCornerShape(4.dp)),
                color = goalColor,
                trackColor = goalColor.copy(alpha = 0.15f)
            )

            Spacer(modifier = Modifier.height(Spacing.compact))

            // Remaining
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "Remaining: ${formatCompactCurrency(goal.remainingAmount)}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = "Target: ${goal.targetDate.take(4)}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
private fun AnimatedProgressRing(
    progress: Float,
    color: Color,
    backgroundColor: Color
) {
    var animatedProgress by remember { mutableStateOf(0f) }
    val animatedValue by animateFloatAsState(
        targetValue = animatedProgress,
        animationSpec = tween(durationMillis = 1000),
        label = "progress"
    )

    LaunchedEffect(progress) {
        animatedProgress = progress
    }

    Canvas(modifier = Modifier.fillMaxSize()) {
        val strokeWidth = 16.dp.toPx()
        val radius = (size.minDimension - strokeWidth) / 2
        val center = Offset(size.width / 2, size.height / 2)

        // Background arc
        drawArc(
            color = backgroundColor,
            startAngle = -90f,
            sweepAngle = 360f,
            useCenter = false,
            topLeft = Offset(center.x - radius, center.y - radius),
            size = Size(radius * 2, radius * 2),
            style = Stroke(width = strokeWidth, cap = StrokeCap.Round)
        )

        // Progress arc
        drawArc(
            color = color,
            startAngle = -90f,
            sweepAngle = 360f * animatedValue,
            useCenter = false,
            topLeft = Offset(center.x - radius, center.y - radius),
            size = Size(radius * 2, radius * 2),
            style = Stroke(width = strokeWidth, cap = StrokeCap.Round)
        )
    }
}

@Composable
private fun GoalSummaryCard(
    goal: Goal,
    totalContributions: Double,
    totalReturns: Double
) {
    GlassCard(modifier = Modifier.padding(horizontal = Spacing.medium)) {
        Column {
            Text(
                text = "Investment Summary",
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurface
            )

            Spacer(modifier = Modifier.height(Spacing.medium))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                SummaryItem(
                    label = "Total Invested",
                    value = formatCompactCurrency(totalContributions),
                    icon = Icons.Default.Savings
                )
                SummaryItem(
                    label = "Returns",
                    value = formatCompactCurrency(totalReturns),
                    icon = Icons.AutoMirrored.Filled.TrendingUp,
                    valueColor = Success
                )
            }

            Spacer(modifier = Modifier.height(Spacing.medium))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                SummaryItem(
                    label = "Monthly SIP",
                    value = formatCompactCurrency(goal.monthlySip ?: 0.0),
                    icon = Icons.Default.Schedule
                )
                SummaryItem(
                    label = "Returns %",
                    value = String.format(Locale.US, "%.1f%%", (totalReturns / totalContributions * 100).takeIf { !it.isNaN() } ?: 0.0),
                    icon = Icons.Default.Info,
                    valueColor = Success
                )
            }
        }
    }
}

@Composable
private fun SummaryItem(
    label: String,
    value: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    valueColor: Color = MaterialTheme.colorScheme.onSurface
) {
    Column {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                modifier = Modifier.size(14.dp),
                tint = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.width(4.dp))
            Text(
                text = label,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
        Spacer(modifier = Modifier.height(2.dp))
        Text(
            text = value,
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.SemiBold,
            color = valueColor
        )
    }
}

@Composable
private fun ProjectionCard(projection: GoalProjection, goal: Goal) {
    val isDark = LocalIsDarkTheme.current
    val goalColor = Color(goal.category.color)

    GlassCard(modifier = Modifier.padding(horizontal = Spacing.medium)) {
        Column {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Goal Projection",
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onSurface
                )

                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(CornerRadius.small))
                        .background(if (projection.isOnTrack) Success.copy(alpha = 0.15f) else Warning.copy(alpha = 0.15f))
                        .padding(horizontal = Spacing.small, vertical = Spacing.micro)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = if (projection.isOnTrack) Icons.Default.Check else Icons.Default.Warning,
                            contentDescription = null,
                            modifier = Modifier.size(14.dp),
                            tint = if (projection.isOnTrack) Success else Warning
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = if (projection.isOnTrack) "On Track" else "Needs Attention",
                            style = MaterialTheme.typography.labelSmall,
                            color = if (projection.isOnTrack) Success else Warning
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(Spacing.medium))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(
                        text = "Projected Value",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    CurrencyText(
                        amount = projection.projectedValue,
                        style = MaterialTheme.typography.titleLarge,
                        color = goalColor,
                        compact = true
                    )
                }

                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        text = "By ${projection.projectedDate}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = "at 12% returns",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            if (!projection.isOnTrack && projection.shortfall != null) {
                Spacer(modifier = Modifier.height(Spacing.medium))

                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(CornerRadius.small))
                        .background(Warning.copy(alpha = 0.1f))
                        .padding(Spacing.small)
                ) {
                    Column {
                        Text(
                            text = "Shortfall: ${formatCompactCurrency(projection.shortfall)}",
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.Medium,
                            color = Warning
                        )
                        projection.recommendedSipIncrease?.let { increase ->
                            Text(
                                text = "Increase SIP by ${formatCompactCurrency(increase)}/month to meet target",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun MilestonesTimeline(milestones: List<Milestone>, goal: Goal) {
    val goalColor = Color(goal.category.color)

    GlassCard(modifier = Modifier.padding(horizontal = Spacing.medium)) {
        Column {
            milestones.forEachIndexed { index, milestone ->
                Row(modifier = Modifier.fillMaxWidth()) {
                    // Timeline indicator
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier.width(40.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(24.dp)
                                .clip(CircleShape)
                                .background(
                                    if (milestone.isCompleted) goalColor
                                    else goalColor.copy(alpha = 0.2f)
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            if (milestone.isCompleted) {
                                Icon(
                                    imageVector = Icons.Default.Check,
                                    contentDescription = null,
                                    modifier = Modifier.size(14.dp),
                                    tint = Color.White
                                )
                            }
                        }

                        if (index < milestones.lastIndex) {
                            Box(
                                modifier = Modifier
                                    .width(2.dp)
                                    .height(48.dp)
                                    .background(
                                        if (milestone.isCompleted) goalColor.copy(alpha = 0.5f)
                                        else goalColor.copy(alpha = 0.2f)
                                    )
                            )
                        }
                    }

                    Spacer(modifier = Modifier.width(Spacing.small))

                    // Milestone content
                    Column(
                        modifier = Modifier
                            .weight(1f)
                            .padding(bottom = if (index < milestones.lastIndex) Spacing.medium else 0.dp)
                    ) {
                        Text(
                            text = milestone.title,
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.Medium,
                            color = if (milestone.isCompleted)
                                MaterialTheme.colorScheme.onSurface
                            else
                                MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = if (milestone.isCompleted)
                                "Completed ${milestone.completedDate}"
                            else
                                "Target: ${milestone.targetDate}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    // Amount
                    CurrencyText(
                        amount = milestone.targetAmount,
                        style = MaterialTheme.typography.bodyMedium,
                        color = if (milestone.isCompleted) goalColor else MaterialTheme.colorScheme.onSurfaceVariant,
                        compact = true
                    )
                }
            }
        }
    }
}

@Composable
private fun LinkedFundCard(
    fund: LinkedFund,
    onClick: () -> Unit
) {
    GlassCard(
        modifier = Modifier
            .padding(horizontal = Spacing.medium)
            .clickable(onClick = onClick)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = fund.fundName,
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Medium,
                    color = MaterialTheme.colorScheme.onSurface,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )

                Spacer(modifier = Modifier.height(Spacing.micro))

                Row(
                    horizontalArrangement = Arrangement.spacedBy(Spacing.medium)
                ) {
                    Column {
                        Text(
                            text = "Current",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        CurrencyText(
                            amount = fund.currentValue,
                            style = MaterialTheme.typography.bodyMedium,
                            compact = true
                        )
                    }

                    Column {
                        Text(
                            text = "Returns",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        ReturnText(
                            value = fund.returnsPercentage,
                            style = MaterialTheme.typography.bodyMedium
                        )
                    }

                    fund.sipAmount?.let { sip ->
                        Column {
                            Text(
                                text = "SIP",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            CurrencyText(
                                amount = sip,
                                style = MaterialTheme.typography.bodyMedium,
                                compact = true
                            )
                        }
                    }
                }
            }

            Icon(
                imageVector = Icons.Default.ChevronRight,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun ContributionItem(contribution: Contribution) {
    GlassCard(modifier = Modifier.padding(horizontal = Spacing.medium)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Type indicator
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(RoundedCornerShape(CornerRadius.small))
                    .background(
                        when (contribution.type) {
                            ContributionType.SIP -> Primary.copy(alpha = 0.15f)
                            ContributionType.LUMPSUM -> Success.copy(alpha = 0.15f)
                            ContributionType.RETURNS -> Color(0xFF8B5CF6).copy(alpha = 0.15f)
                        }
                    ),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = when (contribution.type) {
                        ContributionType.SIP -> Icons.Default.Schedule
                        ContributionType.LUMPSUM -> Icons.Default.Add
                        ContributionType.RETURNS -> Icons.AutoMirrored.Filled.TrendingUp
                    },
                    contentDescription = null,
                    tint = when (contribution.type) {
                        ContributionType.SIP -> Primary
                        ContributionType.LUMPSUM -> Success
                        ContributionType.RETURNS -> Color(0xFF8B5CF6)
                    },
                    modifier = Modifier.size(20.dp)
                )
            }

            Spacer(modifier = Modifier.width(Spacing.small))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = when (contribution.type) {
                        ContributionType.SIP -> "SIP Installment"
                        ContributionType.LUMPSUM -> "Lump Sum"
                        ContributionType.RETURNS -> "Investment Returns"
                    },
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Medium,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = contribution.fundName ?: contribution.date,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }

            Column(horizontalAlignment = Alignment.End) {
                CurrencyText(
                    amount = contribution.amount,
                    style = MaterialTheme.typography.bodyMedium,
                    color = when (contribution.type) {
                        ContributionType.RETURNS -> Success
                        else -> MaterialTheme.colorScheme.onSurface
                    },
                    compact = true
                )
                Text(
                    text = contribution.date,
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
private fun QuickActionsSection() {
    Column(modifier = Modifier.padding(horizontal = Spacing.medium)) {
        Text(
            text = "Quick Actions",
            style = MaterialTheme.typography.titleMedium,
            color = MaterialTheme.colorScheme.onSurface
        )

        Spacer(modifier = Modifier.height(Spacing.small))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(Spacing.small)
        ) {
            OutlinedButton(
                onClick = { /* Add lump sum */ },
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(CornerRadius.medium)
            ) {
                Icon(
                    imageVector = Icons.Default.Add,
                    contentDescription = null,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text("Add Lump Sum")
            }

            OutlinedButton(
                onClick = { /* Modify SIP */ },
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(CornerRadius.medium)
            ) {
                Icon(
                    imageVector = Icons.Default.Edit,
                    contentDescription = null,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text("Modify SIP")
            }
        }
    }
}
