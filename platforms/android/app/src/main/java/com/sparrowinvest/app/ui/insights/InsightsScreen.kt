package com.sparrowinvest.app.ui.insights

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Error
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Lightbulb
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.TrendingDown
import androidx.compose.material.icons.filled.TrendingUp
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.sparrowinvest.app.data.model.ActionItem
import com.sparrowinvest.app.data.model.ActionPriority
import com.sparrowinvest.app.data.model.ActionType
import com.sparrowinvest.app.data.model.FamilyMember
import com.sparrowinvest.app.ui.components.PrimaryButton
import com.sparrowinvest.app.ui.components.SegmentedControl
import com.sparrowinvest.app.ui.components.formatCompactCurrency
import com.sparrowinvest.app.ui.theme.CardBackgroundDark
import com.sparrowinvest.app.ui.theme.LocalIsDarkTheme
import com.sparrowinvest.app.ui.theme.CardBackgroundLight
import com.sparrowinvest.app.ui.theme.LocalIsDarkTheme
import com.sparrowinvest.app.ui.theme.CornerRadius
import com.sparrowinvest.app.ui.theme.LocalIsDarkTheme
import com.sparrowinvest.app.ui.theme.Error
import com.sparrowinvest.app.ui.theme.LocalIsDarkTheme
import com.sparrowinvest.app.ui.theme.GlassBorderEndDark
import com.sparrowinvest.app.ui.theme.LocalIsDarkTheme
import com.sparrowinvest.app.ui.theme.GlassBorderEndLight
import com.sparrowinvest.app.ui.theme.LocalIsDarkTheme
import com.sparrowinvest.app.ui.theme.GlassBorderMidDark
import com.sparrowinvest.app.ui.theme.LocalIsDarkTheme
import com.sparrowinvest.app.ui.theme.GlassBorderMidLight
import com.sparrowinvest.app.ui.theme.LocalIsDarkTheme
import com.sparrowinvest.app.ui.theme.GlassBorderStartDark
import com.sparrowinvest.app.ui.theme.LocalIsDarkTheme
import com.sparrowinvest.app.ui.theme.GlassBorderStartLight
import com.sparrowinvest.app.ui.theme.LocalIsDarkTheme
import com.sparrowinvest.app.ui.theme.Primary
import com.sparrowinvest.app.ui.theme.LocalIsDarkTheme
import com.sparrowinvest.app.ui.theme.ShadowColor
import com.sparrowinvest.app.ui.theme.LocalIsDarkTheme
import com.sparrowinvest.app.ui.theme.Spacing
import com.sparrowinvest.app.ui.theme.LocalIsDarkTheme
import com.sparrowinvest.app.ui.theme.Success
import com.sparrowinvest.app.ui.theme.LocalIsDarkTheme
import com.sparrowinvest.app.ui.theme.Warning
import com.sparrowinvest.app.ui.theme.LocalIsDarkTheme

@Composable
fun InsightsScreen(
    viewModel: InsightsViewModel = hiltViewModel(),
    onNavigateToRecommendations: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    val analysisResult by viewModel.analysisResult.collectAsState()
    val alerts by viewModel.alerts.collectAsState()
    val actionItems by viewModel.actionItems.collectAsState()
    val insightCards by viewModel.insightCards.collectAsState()
    val lastAnalyzedDate by viewModel.lastAnalyzedDate.collectAsState()
    val portfolioViewMode by viewModel.portfolioViewMode.collectAsState()
    val familyPortfolio by viewModel.familyPortfolio.collectAsState()
    val selectedFamilyMember by viewModel.selectedFamilyMember.collectAsState()
    val analysisRequirements by viewModel.analysisRequirements.collectAsState()

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .statusBarsPadding(),
        contentPadding = PaddingValues(bottom = Spacing.xLarge)
    ) {
        // Header with Portfolio Selector
        item {
            InsightsHeader(
                lastAnalyzedDate = lastAnalyzedDate,
                portfolioViewMode = portfolioViewMode,
                onViewModeChange = { viewModel.setPortfolioViewMode(it) }
            )
        }

        // Family Member Selector (only in family mode)
        if (portfolioViewMode == PortfolioViewMode.FAMILY) {
            item {
                familyPortfolio?.let { family ->
                    FamilyMemberSelector(
                        members = family.members,
                        selectedMember = selectedFamilyMember,
                        onMemberSelected = { viewModel.selectFamilyMember(it) }
                    )
                }
            }
        }

        // Requirements Status Indicators
        item {
            RequirementsStatusCard(
                hasProfile = analysisRequirements.hasProfile,
                hasHoldings = analysisRequirements.hasHoldings,
                portfolioViewMode = portfolioViewMode,
                selectedMemberName = selectedFamilyMember?.name
            )
        }

        // AI Analysis Card
        item {
            AIAnalysisHeader(
                onAnalyze = { viewModel.analyzePortfolio() },
                isLoading = uiState is InsightsUiState.Analyzing,
                canAnalyze = analysisRequirements.canRunAnalysis
            )
            Spacer(modifier = Modifier.height(Spacing.medium))
        }

        when (uiState) {
            is InsightsUiState.Idle -> {
                item { AnalysisPlaceholder() }
            }
            is InsightsUiState.Analyzing -> {
                item { AnalyzingState() }
            }
            is InsightsUiState.Success -> {
                // Health Score Card
                analysisResult?.let { result ->
                    item {
                        HealthScoreCard(
                            overallScore = result.analysis.overallScore,
                            diversificationScore = result.analysis.diversificationScore,
                            riskAlignmentScore = result.analysis.riskAlignmentScore,
                            costEfficiencyScore = result.analysis.costEfficiencyScore
                        )
                        Spacer(modifier = Modifier.height(Spacing.medium))
                    }

                    // Alerts Section
                    if (alerts.isNotEmpty()) {
                        item {
                            SectionHeader(
                                title = "Alerts",
                                count = alerts.size
                            )
                        }
                        items(alerts, key = { it.id }) { alert ->
                            AlertCard(
                                alert = alert,
                                onDismiss = { viewModel.dismissAlert(alert.id) },
                                onAction = { }
                            )
                        }
                        item { Spacer(modifier = Modifier.height(Spacing.medium)) }
                    }

                    // Action Items Section
                    if (actionItems.isNotEmpty()) {
                        item {
                            SectionHeader(
                                title = "Recommended Actions",
                                count = actionItems.size
                            )
                        }
                        items(actionItems) { action ->
                            ActionItemCard(
                                actionItem = action,
                                onClick = { }
                            )
                        }
                        item { Spacer(modifier = Modifier.height(Spacing.medium)) }
                    }

                    // Insight Cards
                    if (insightCards.isNotEmpty()) {
                        item {
                            SectionHeader(title = "Portfolio Insights")
                            LazyRow(
                                contentPadding = PaddingValues(horizontal = Spacing.medium),
                                horizontalArrangement = Arrangement.spacedBy(Spacing.compact)
                            ) {
                                items(insightCards) { card ->
                                    InsightMetricCard(insightCard = card)
                                }
                            }
                            Spacer(modifier = Modifier.height(Spacing.medium))
                        }
                    }

                    // Strengths & Weaknesses
                    if (result.analysis.strengths.isNotEmpty()) {
                        item {
                            SectionHeader(title = "Strengths")
                            StrengthsWeaknessesCard(
                                items = result.analysis.strengths,
                                isStrength = true
                            )
                            Spacer(modifier = Modifier.height(Spacing.medium))
                        }
                    }

                    if (result.analysis.weaknesses.isNotEmpty()) {
                        item {
                            SectionHeader(title = "Areas for Improvement")
                            StrengthsWeaknessesCard(
                                items = result.analysis.weaknesses,
                                isStrength = false
                            )
                            Spacer(modifier = Modifier.height(Spacing.medium))
                        }
                    }

                    // Risk Assessment
                    result.riskAssessment?.let { risk ->
                        item {
                            SectionHeader(title = "Risk Assessment")
                            RiskAssessmentCard(
                                currentRisk = risk.currentRiskLevel,
                                recommendedRisk = risk.recommendedRiskLevel,
                                aligned = risk.aligned,
                                explanation = risk.explanation
                            )
                        }
                    }
                }
            }
            is InsightsUiState.Error -> {
                item { ErrorState(message = (uiState as InsightsUiState.Error).message) }
            }
        }
    }
}

@Composable
private fun InsightsHeader(
    lastAnalyzedDate: String?,
    portfolioViewMode: PortfolioViewMode,
    onViewModeChange: (PortfolioViewMode) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = Spacing.medium, vertical = Spacing.compact)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "AI Insights",
                    style = MaterialTheme.typography.headlineMedium,
                    color = MaterialTheme.colorScheme.onSurface,
                    fontWeight = FontWeight.Bold
                )
                lastAnalyzedDate?.let {
                    Text(
                        text = "Last analyzed: $it",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .background(Primary.copy(alpha = 0.1f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.AutoAwesome,
                    contentDescription = null,
                    tint = Primary,
                    modifier = Modifier.size(20.dp)
                )
            }
        }

        Spacer(modifier = Modifier.height(Spacing.compact))

        // Portfolio View Mode Selector
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.Center
        ) {
            SegmentedControl(
                options = listOf(PortfolioViewMode.INDIVIDUAL, PortfolioViewMode.FAMILY),
                selectedOption = portfolioViewMode,
                onOptionSelected = onViewModeChange,
                optionLabel = { mode ->
                    when (mode) {
                        PortfolioViewMode.INDIVIDUAL -> "Individual"
                        PortfolioViewMode.FAMILY -> "Family"
                    }
                }
            )
        }
    }
}

@Composable
private fun FamilyMemberSelector(
    members: List<FamilyMember>,
    selectedMember: FamilyMember?,
    onMemberSelected: (FamilyMember?) -> Unit
) {
    LazyRow(
        modifier = Modifier.fillMaxWidth(),
        contentPadding = PaddingValues(horizontal = Spacing.medium),
        horizontalArrangement = Arrangement.spacedBy(Spacing.small)
    ) {
        // "All" option
        item {
            val isSelected = selectedMember == null
            FamilyMemberChip(
                text = "All",
                isSelected = isSelected,
                color = Primary,
                onClick = { onMemberSelected(null) }
            )
        }

        items(members) { member ->
            val isSelected = selectedMember?.id == member.id
            FamilyMemberChip(
                text = member.name.split(" ").first(),
                isSelected = isSelected,
                color = Color(member.relationship.color),
                onClick = { onMemberSelected(member) }
            )
        }
    }

    Spacer(modifier = Modifier.height(Spacing.compact))
}

@Composable
private fun FamilyMemberChip(
    text: String,
    isSelected: Boolean,
    color: Color,
    onClick: () -> Unit
) {
    val isDark = LocalIsDarkTheme.current
    val backgroundColor by animateColorAsState(
        targetValue = if (isSelected) color else if (isDark) CardBackgroundDark else CardBackgroundLight,
        label = "chipBackground"
    )
    val textColor by animateColorAsState(
        targetValue = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurface,
        label = "chipText"
    )

    Box(
        modifier = Modifier
            .clip(CircleShape)
            .background(backgroundColor)
            .clickable(onClick = onClick)
            .padding(horizontal = Spacing.medium, vertical = Spacing.small)
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.labelMedium,
            color = textColor
        )
    }
}

@Composable
private fun RequirementsStatusCard(
    hasProfile: Boolean,
    hasHoldings: Boolean,
    portfolioViewMode: PortfolioViewMode,
    selectedMemberName: String?
) {
    val isDark = LocalIsDarkTheme.current
    val shape = RoundedCornerShape(CornerRadius.large)
    val backgroundColor = if (isDark) CardBackgroundDark else CardBackgroundLight

    val targetLabel = when {
        portfolioViewMode == PortfolioViewMode.INDIVIDUAL -> "Your portfolio"
        selectedMemberName != null -> "$selectedMemberName's portfolio"
        else -> "Family portfolio"
    }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = Spacing.medium, vertical = Spacing.small)
            .clip(shape)
            .background(backgroundColor)
            .padding(Spacing.compact)
    ) {
        Text(
            text = "Analysis Target: $targetLabel",
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.onSurface,
            fontWeight = FontWeight.Medium
        )

        Spacer(modifier = Modifier.height(Spacing.small))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(Spacing.medium)
        ) {
            // Profile Status
            RequirementItem(
                label = "Profile",
                isComplete = hasProfile,
                modifier = Modifier.weight(1f)
            )

            // Holdings Status
            RequirementItem(
                label = "Holdings",
                isComplete = hasHoldings,
                modifier = Modifier.weight(1f)
            )
        }
    }

    Spacer(modifier = Modifier.height(Spacing.small))
}

@Composable
private fun RequirementItem(
    label: String,
    isComplete: Boolean,
    modifier: Modifier = Modifier
) {
    val statusColor = if (isComplete) Success else Warning
    val statusIcon = if (isComplete) Icons.Default.CheckCircle else Icons.Default.Warning
    val statusText = if (isComplete) "Ready" else "Required"

    Row(
        modifier = modifier,
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(Spacing.small)
    ) {
        Icon(
            imageVector = statusIcon,
            contentDescription = null,
            tint = statusColor,
            modifier = Modifier.size(18.dp)
        )
        Column {
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                text = statusText,
                style = MaterialTheme.typography.labelMedium,
                color = statusColor,
                fontWeight = FontWeight.Medium
            )
        }
    }
}

@Composable
private fun AIAnalysisHeader(
    onAnalyze: () -> Unit,
    isLoading: Boolean,
    canAnalyze: Boolean
) {
    val isDark = LocalIsDarkTheme.current
    val shape = RoundedCornerShape(CornerRadius.xLarge)

    val backgroundColor = if (isDark) CardBackgroundDark else CardBackgroundLight
    val borderBrush = if (isDark) {
        Brush.linearGradient(colors = listOf(GlassBorderStartDark, GlassBorderMidDark, GlassBorderEndDark))
    } else {
        Brush.linearGradient(colors = listOf(GlassBorderStartLight, GlassBorderMidLight, GlassBorderEndLight))
    }

    // Gradient background for AI card
    val gradientBrush = Brush.linearGradient(
        colors = listOf(
            Primary.copy(alpha = 0.1f),
            Color(0xFF8B5CF6).copy(alpha = 0.1f)
        )
    )

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = Spacing.medium)
            .then(
                if (!isDark) {
                    Modifier.shadow(elevation = 12.dp, shape = shape, spotColor = ShadowColor, ambientColor = ShadowColor)
                } else Modifier
            )
            .clip(shape)
            .background(backgroundColor)
            .background(gradientBrush)
            .border(width = 1.dp, brush = borderBrush, shape = shape)
            .padding(Spacing.medium),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(56.dp)
                .clip(RoundedCornerShape(CornerRadius.medium))
                .background(
                    Brush.linearGradient(
                        colors = if (canAnalyze) {
                            listOf(Primary, Color(0xFF8B5CF6))
                        } else {
                            listOf(Color.Gray.copy(alpha = 0.5f), Color.Gray.copy(alpha = 0.3f))
                        }
                    )
                ),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.AutoAwesome,
                contentDescription = null,
                tint = Color.White,
                modifier = Modifier.size(28.dp)
            )
        }

        Spacer(modifier = Modifier.width(Spacing.medium))

        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = "AI Portfolio Analysis",
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurface,
                fontWeight = FontWeight.SemiBold
            )
            Text(
                text = if (canAnalyze) {
                    "Get personalized insights powered by AI"
                } else {
                    "Complete requirements to run analysis"
                },
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        // Compact pill button
        Box(
            modifier = Modifier
                .clip(CircleShape)
                .background(
                    if (canAnalyze && !isLoading) {
                        Brush.linearGradient(colors = listOf(Primary, Color(0xFF8B5CF6)))
                    } else {
                        Brush.linearGradient(colors = listOf(Color.Gray.copy(alpha = 0.4f), Color.Gray.copy(alpha = 0.3f)))
                    }
                )
                .clickable(enabled = canAnalyze && !isLoading, onClick = onAnalyze)
                .padding(horizontal = Spacing.medium, vertical = Spacing.small),
            contentAlignment = Alignment.Center
        ) {
            if (isLoading) {
                CircularProgressIndicator(
                    modifier = Modifier.size(18.dp),
                    color = Color.White,
                    strokeWidth = 2.dp
                )
            } else {
                Text(
                    text = "Analyze",
                    style = MaterialTheme.typography.labelMedium,
                    color = Color.White,
                    fontWeight = FontWeight.SemiBold
                )
            }
        }
    }
}

@Composable
private fun HealthScoreCard(
    overallScore: Int,
    diversificationScore: Int,
    riskAlignmentScore: Int,
    costEfficiencyScore: Int
) {
    val isDark = LocalIsDarkTheme.current
    val shape = RoundedCornerShape(CornerRadius.xLarge)

    val backgroundColor = if (isDark) CardBackgroundDark else CardBackgroundLight
    val borderBrush = if (isDark) {
        Brush.linearGradient(colors = listOf(GlassBorderStartDark, GlassBorderMidDark, GlassBorderEndDark))
    } else {
        Brush.linearGradient(colors = listOf(GlassBorderStartLight, GlassBorderMidLight, GlassBorderEndLight))
    }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = Spacing.medium)
            .then(
                if (!isDark) {
                    Modifier.shadow(elevation = 12.dp, shape = shape, spotColor = ShadowColor, ambientColor = ShadowColor)
                } else Modifier
            )
            .clip(shape)
            .background(backgroundColor)
            .border(width = 1.dp, brush = borderBrush, shape = shape)
            .padding(Spacing.medium)
    ) {
        Text(
            text = "Portfolio Health Score",
            style = MaterialTheme.typography.titleMedium,
            color = MaterialTheme.colorScheme.onSurface,
            fontWeight = FontWeight.SemiBold
        )

        Spacer(modifier = Modifier.height(Spacing.medium))

        // Main Score with animated ring
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceEvenly,
            verticalAlignment = Alignment.CenterVertically
        ) {
            AnimatedScoreRing(
                score = overallScore,
                label = "Overall",
                size = 100.dp,
                strokeWidth = 10.dp
            )

            Column(
                verticalArrangement = Arrangement.spacedBy(Spacing.small)
            ) {
                MiniScoreItem(
                    label = "Diversification",
                    score = diversificationScore,
                    icon = Icons.Default.Shield
                )
                MiniScoreItem(
                    label = "Risk Alignment",
                    score = riskAlignmentScore,
                    icon = Icons.AutoMirrored.Filled.TrendingUp
                )
                MiniScoreItem(
                    label = "Cost Efficiency",
                    score = costEfficiencyScore,
                    icon = Icons.Default.CheckCircle
                )
            }
        }
    }
}

@Composable
private fun AnimatedScoreRing(
    score: Int,
    label: String,
    size: androidx.compose.ui.unit.Dp,
    strokeWidth: androidx.compose.ui.unit.Dp
) {
    var animatedProgress by remember { mutableFloatStateOf(0f) }
    val animatedValue by animateFloatAsState(
        targetValue = animatedProgress,
        animationSpec = tween(durationMillis = 1000),
        label = "scoreAnimation"
    )

    LaunchedEffect(score) {
        animatedProgress = score / 100f
    }

    val scoreColor = scoreColor(score)

    Box(contentAlignment = Alignment.Center) {
        Canvas(modifier = Modifier.size(size)) {
            val strokeWidthPx = strokeWidth.toPx()
            val radius = (this.size.minDimension - strokeWidthPx) / 2

            // Background ring
            drawArc(
                color = scoreColor.copy(alpha = 0.2f),
                startAngle = -90f,
                sweepAngle = 360f,
                useCenter = false,
                topLeft = Offset(strokeWidthPx / 2, strokeWidthPx / 2),
                size = Size(radius * 2, radius * 2),
                style = Stroke(width = strokeWidthPx, cap = StrokeCap.Round)
            )

            // Progress ring
            drawArc(
                color = scoreColor,
                startAngle = -90f,
                sweepAngle = 360f * animatedValue,
                useCenter = false,
                topLeft = Offset(strokeWidthPx / 2, strokeWidthPx / 2),
                size = Size(radius * 2, radius * 2),
                style = Stroke(width = strokeWidthPx, cap = StrokeCap.Round)
            )
        }

        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = score.toString(),
                style = MaterialTheme.typography.headlineLarge,
                color = scoreColor,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun MiniScoreItem(
    label: String,
    score: Int,
    icon: ImageVector
) {
    val scoreColor = scoreColor(score)

    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier.width(150.dp)
    ) {
        Box(
            modifier = Modifier
                .size(32.dp)
                .clip(RoundedCornerShape(CornerRadius.small))
                .background(scoreColor.copy(alpha = 0.1f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = scoreColor,
                modifier = Modifier.size(16.dp)
            )
        }

        Spacer(modifier = Modifier.width(Spacing.small))

        Column {
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                text = "$score/100",
                style = MaterialTheme.typography.labelMedium,
                color = scoreColor,
                fontWeight = FontWeight.SemiBold
            )
        }
    }
}

@Composable
private fun SectionHeader(
    title: String,
    count: Int? = null
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = Spacing.medium, vertical = Spacing.small),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.titleSmall,
            color = MaterialTheme.colorScheme.onSurface,
            fontWeight = FontWeight.SemiBold
        )
        count?.let {
            Box(
                modifier = Modifier
                    .clip(CircleShape)
                    .background(Primary.copy(alpha = 0.1f))
                    .padding(horizontal = 8.dp, vertical = 2.dp)
            ) {
                Text(
                    text = it.toString(),
                    style = MaterialTheme.typography.labelSmall,
                    color = Primary
                )
            }
        }
    }
}

@Composable
private fun AlertCard(
    alert: PortfolioAlert,
    onDismiss: () -> Unit,
    onAction: () -> Unit
) {
    val isDark = LocalIsDarkTheme.current
    val shape = RoundedCornerShape(CornerRadius.large)

    val (alertColor, alertIcon) = when (alert.type) {
        AlertType.WARNING -> Warning to Icons.Default.Warning
        AlertType.INFO -> Primary to Icons.Default.Info
        AlertType.SUCCESS -> Success to Icons.Default.CheckCircle
        AlertType.ACTION_REQUIRED -> Error to Icons.Default.Notifications
    }

    val backgroundColor = if (isDark) CardBackgroundDark else CardBackgroundLight

    AnimatedVisibility(
        visible = true,
        enter = slideInVertically() + fadeIn(),
        exit = slideOutHorizontally() + fadeOut()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = Spacing.medium, vertical = Spacing.small / 2)
                .clip(shape)
                .background(backgroundColor)
                .border(
                    width = 1.dp,
                    color = alertColor.copy(alpha = 0.3f),
                    shape = shape
                )
                .padding(Spacing.compact),
            verticalAlignment = Alignment.Top
        ) {
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .clip(RoundedCornerShape(CornerRadius.small))
                    .background(alertColor.copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = alertIcon,
                    contentDescription = null,
                    tint = alertColor,
                    modifier = Modifier.size(18.dp)
                )
            }

            Spacer(modifier = Modifier.width(Spacing.compact))

            Column(modifier = Modifier.weight(1f)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = alert.title,
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurface,
                        fontWeight = FontWeight.SemiBold
                    )
                    if (alert.priority == AlertPriority.HIGH) {
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(4.dp))
                                .background(Error.copy(alpha = 0.1f))
                                .padding(horizontal = 4.dp, vertical = 1.dp)
                        ) {
                            Text(
                                text = "HIGH",
                                style = MaterialTheme.typography.labelSmall,
                                color = Error
                            )
                        }
                    }
                }

                Text(
                    text = alert.message,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                alert.actionLabel?.let { label ->
                    Spacer(modifier = Modifier.height(Spacing.small))
                    Text(
                        text = label,
                        style = MaterialTheme.typography.labelMedium,
                        color = alertColor,
                        modifier = Modifier.clickable(onClick = onAction)
                    )
                }
            }

            IconButton(
                onClick = onDismiss,
                modifier = Modifier.size(24.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Close,
                    contentDescription = "Dismiss",
                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.size(16.dp)
                )
            }
        }
    }
}

@Composable
private fun ActionItemCard(
    actionItem: ActionItem,
    onClick: () -> Unit
) {
    val isDark = LocalIsDarkTheme.current
    val shape = RoundedCornerShape(CornerRadius.large)

    val backgroundColor = if (isDark) CardBackgroundDark else CardBackgroundLight
    val actionColor = Color(actionItem.action.color)

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = Spacing.medium, vertical = Spacing.small / 2)
            .clip(shape)
            .background(backgroundColor)
            .clickable(onClick = onClick)
            .padding(Spacing.compact),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(44.dp)
                .clip(RoundedCornerShape(CornerRadius.medium))
                .background(actionColor.copy(alpha = 0.15f)),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = actionItem.action.displayName.first().toString(),
                style = MaterialTheme.typography.titleMedium,
                color = actionColor,
                fontWeight = FontWeight.Bold
            )
        }

        Spacer(modifier = Modifier.width(Spacing.compact))

        Column(modifier = Modifier.weight(1f)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(4.dp))
                        .background(actionColor.copy(alpha = 0.1f))
                        .padding(horizontal = 4.dp, vertical = 1.dp)
                ) {
                    Text(
                        text = actionItem.action.displayName,
                        style = MaterialTheme.typography.labelSmall,
                        color = actionColor
                    )
                }
                Text(
                    text = actionItem.fundName,
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurface,
                    fontWeight = FontWeight.Medium
                )
            }
            Text(
                text = actionItem.reason,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                maxLines = 2
            )
        }

        actionItem.amount?.let { amount ->
            Column(horizontalAlignment = Alignment.End) {
                Text(
                    text = formatCompactCurrency(amount),
                    style = MaterialTheme.typography.labelMedium,
                    color = actionColor,
                    fontWeight = FontWeight.SemiBold
                )
                Text(
                    text = actionItem.priority.displayName,
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
private fun InsightMetricCard(insightCard: InsightCard) {
    val isDark = LocalIsDarkTheme.current
    val shape = RoundedCornerShape(CornerRadius.large)

    val backgroundColor = if (isDark) CardBackgroundDark else CardBackgroundLight

    val (iconColor, icon) = when (insightCard.type) {
        InsightType.DIVERSIFICATION -> Primary to Icons.Default.Shield
        InsightType.RISK_ADJUSTED_RETURNS -> Success to Icons.Default.TrendingUp
        InsightType.EXPENSE_RATIO -> Warning to Icons.Default.Info
        InsightType.TAX_EFFICIENCY -> Color(0xFF8B5CF6) to Icons.Default.CheckCircle
        InsightType.GOAL_PROGRESS -> Primary to Icons.Default.Lightbulb
    }

    Column(
        modifier = Modifier
            .width(140.dp)
            .clip(shape)
            .background(backgroundColor)
            .padding(Spacing.compact)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = iconColor,
                modifier = Modifier.size(16.dp)
            )
            insightCard.trend?.let { trend ->
                Icon(
                    imageVector = if (trend >= 0) Icons.Default.TrendingUp else Icons.Default.TrendingDown,
                    contentDescription = null,
                    tint = if (trend >= 0) Success else Error,
                    modifier = Modifier.size(12.dp)
                )
            }
        }

        Spacer(modifier = Modifier.height(Spacing.small))

        Text(
            text = insightCard.title,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        insightCard.value?.let { value ->
            Text(
                text = value,
                style = MaterialTheme.typography.titleMedium,
                color = iconColor,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

@Composable
private fun StrengthsWeaknessesCard(
    items: List<String>,
    isStrength: Boolean
) {
    val isDark = LocalIsDarkTheme.current
    val shape = RoundedCornerShape(CornerRadius.large)

    val backgroundColor = if (isDark) CardBackgroundDark else CardBackgroundLight
    val itemColor = if (isStrength) Success else Warning
    val itemIcon = if (isStrength) Icons.Default.CheckCircle else Icons.Default.Warning

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = Spacing.medium)
            .clip(shape)
            .background(backgroundColor)
            .padding(Spacing.compact),
        verticalArrangement = Arrangement.spacedBy(Spacing.small)
    ) {
        items.forEach { item ->
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.Top
            ) {
                Icon(
                    imageVector = itemIcon,
                    contentDescription = null,
                    modifier = Modifier.size(18.dp),
                    tint = itemColor
                )
                Spacer(modifier = Modifier.width(Spacing.small))
                Text(
                    text = item,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface
                )
            }
        }
    }
}

@Composable
private fun RiskAssessmentCard(
    currentRisk: String,
    recommendedRisk: String,
    aligned: Boolean,
    explanation: String
) {
    val isDark = LocalIsDarkTheme.current
    val shape = RoundedCornerShape(CornerRadius.large)

    val backgroundColor = if (isDark) CardBackgroundDark else CardBackgroundLight
    val statusColor = if (aligned) Success else Warning

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = Spacing.medium)
            .clip(shape)
            .background(backgroundColor)
            .padding(Spacing.compact)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column {
                Text(
                    text = "Current Risk",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = currentRisk,
                    style = MaterialTheme.typography.titleSmall,
                    color = MaterialTheme.colorScheme.onSurface,
                    fontWeight = FontWeight.SemiBold
                )
            }

            Box(
                modifier = Modifier
                    .clip(CircleShape)
                    .background(statusColor.copy(alpha = 0.1f))
                    .padding(horizontal = 8.dp, vertical = 4.dp)
            ) {
                Text(
                    text = if (aligned) "Aligned" else "Misaligned",
                    style = MaterialTheme.typography.labelSmall,
                    color = statusColor
                )
            }

            Column(horizontalAlignment = Alignment.End) {
                Text(
                    text = "Recommended",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = recommendedRisk,
                    style = MaterialTheme.typography.titleSmall,
                    color = MaterialTheme.colorScheme.onSurface,
                    fontWeight = FontWeight.SemiBold
                )
            }
        }

        Spacer(modifier = Modifier.height(Spacing.small))

        Text(
            text = explanation,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
private fun AnalysisPlaceholder() {
    val isDark = LocalIsDarkTheme.current
    val shape = RoundedCornerShape(CornerRadius.xLarge)
    val backgroundColor = if (isDark) CardBackgroundDark else CardBackgroundLight

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = Spacing.medium)
            .clip(shape)
            .background(backgroundColor)
            .padding(Spacing.large),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Icon(
            imageVector = Icons.Default.AutoAwesome,
            contentDescription = null,
            modifier = Modifier.size(64.dp),
            tint = Primary.copy(alpha = 0.5f)
        )
        Spacer(modifier = Modifier.height(Spacing.medium))
        Text(
            text = "Analyze Your Portfolio",
            style = MaterialTheme.typography.titleLarge,
            color = MaterialTheme.colorScheme.onSurface,
            fontWeight = FontWeight.SemiBold
        )
        Spacer(modifier = Modifier.height(Spacing.small))
        Text(
            text = "Get AI-powered insights, recommendations, and alerts tailored to your investment goals.",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center
        )
    }
}

@Composable
private fun AnalyzingState() {
    val isDark = LocalIsDarkTheme.current
    val shape = RoundedCornerShape(CornerRadius.xLarge)
    val backgroundColor = if (isDark) CardBackgroundDark else CardBackgroundLight

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = Spacing.medium)
            .clip(shape)
            .background(backgroundColor)
            .padding(Spacing.large),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        CircularProgressIndicator(
            modifier = Modifier.size(64.dp),
            color = Primary,
            strokeWidth = 4.dp,
            strokeCap = StrokeCap.Round
        )
        Spacer(modifier = Modifier.height(Spacing.medium))
        Text(
            text = "Analyzing Your Portfolio",
            style = MaterialTheme.typography.titleLarge,
            color = MaterialTheme.colorScheme.onSurface,
            fontWeight = FontWeight.SemiBold
        )
        Spacer(modifier = Modifier.height(Spacing.small))
        Text(
            text = "Our AI is evaluating your investments across multiple dimensions...",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center
        )
    }
}

@Composable
private fun ErrorState(message: String) {
    val isDark = LocalIsDarkTheme.current
    val shape = RoundedCornerShape(CornerRadius.xLarge)
    val backgroundColor = if (isDark) CardBackgroundDark else CardBackgroundLight

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = Spacing.medium)
            .clip(shape)
            .background(backgroundColor)
            .padding(Spacing.large),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Icon(
            imageVector = Icons.Default.Error,
            contentDescription = null,
            modifier = Modifier.size(64.dp),
            tint = Error
        )
        Spacer(modifier = Modifier.height(Spacing.medium))
        Text(
            text = "Analysis Failed",
            style = MaterialTheme.typography.titleLarge,
            color = MaterialTheme.colorScheme.onSurface,
            fontWeight = FontWeight.SemiBold
        )
        Spacer(modifier = Modifier.height(Spacing.small))
        Text(
            text = message,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center
        )
    }
}

private fun scoreColor(score: Int): Color {
    return when {
        score >= 80 -> Success
        score >= 60 -> Warning
        else -> Error
    }
}
