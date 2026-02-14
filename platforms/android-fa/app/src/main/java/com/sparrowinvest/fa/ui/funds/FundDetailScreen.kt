package com.sparrowinvest.fa.ui.funds

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBalance
import androidx.compose.material.icons.filled.Assessment
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.PieChart
import androidx.compose.material.icons.automirrored.filled.ShowChart
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.sparrowinvest.fa.data.model.FundDetail
import com.sparrowinvest.fa.data.model.NavHistoryPoint
import com.sparrowinvest.fa.ui.components.ErrorState
import com.sparrowinvest.fa.ui.components.GlassCard
import com.sparrowinvest.fa.ui.components.LoadingIndicator
import com.sparrowinvest.fa.ui.components.ReturnBadge
import com.sparrowinvest.fa.ui.components.StatusBadge
import com.sparrowinvest.fa.ui.components.TopBar
import com.sparrowinvest.fa.ui.theme.CornerRadius
import com.sparrowinvest.fa.ui.theme.Primary
import com.sparrowinvest.fa.ui.theme.Secondary
import com.sparrowinvest.fa.ui.theme.Spacing
import com.sparrowinvest.fa.ui.theme.Success

@OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)
@Composable
fun FundDetailScreen(
    schemeCode: Int,
    onBackClick: () -> Unit,
    viewModel: FundDetailViewModel = hiltViewModel()
) {
    LaunchedEffect(schemeCode) {
        viewModel.loadFund(schemeCode)
    }

    val uiState by viewModel.uiState.collectAsState()
    val navHistory by viewModel.filteredHistory.collectAsState()
    val selectedPeriod by viewModel.selectedPeriod.collectAsState()
    val isRefreshing = uiState is FundDetailUiState.Loading

    Column(modifier = Modifier.fillMaxSize()) {
        TopBar(title = "Fund Details", onBackClick = onBackClick)

        androidx.compose.material3.pulltorefresh.PullToRefreshBox(
            isRefreshing = isRefreshing,
            onRefresh = { viewModel.loadFund(schemeCode) },
            modifier = Modifier.fillMaxSize()
        ) {
            when (val state = uiState) {
                is FundDetailUiState.Loading -> {
                    LoadingIndicator(
                        modifier = Modifier.fillMaxSize(),
                        message = "Loading fund details..."
                    )
                }
                is FundDetailUiState.Error -> {
                    ErrorState(
                        message = state.message,
                        onRetry = { viewModel.loadFund(schemeCode) },
                        modifier = Modifier.fillMaxSize()
                    )
                }
                is FundDetailUiState.Success -> {
                    FundDetailContent(
                        fund = state.fund,
                        navHistory = navHistory,
                        selectedPeriod = selectedPeriod,
                        onPeriodChange = viewModel::onPeriodChange
                    )
                }
            }
        }
    }
}

@Composable
private fun FundDetailContent(
    fund: FundDetail,
    navHistory: List<NavHistoryPoint>,
    selectedPeriod: String,
    onPeriodChange: (String) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = Spacing.medium)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(Spacing.medium)
    ) {
        Spacer(modifier = Modifier.height(Spacing.compact))

        // Fund Name & Category
        GlassCard {
            Column(modifier = Modifier.fillMaxWidth()) {
                Text(
                    text = fund.schemeName,
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Spacer(modifier = Modifier.height(Spacing.small))
                Row(
                    horizontalArrangement = Arrangement.spacedBy(Spacing.compact)
                ) {
                    fund.schemeCategory?.let {
                        StatusBadge(status = it)
                    }
                    fund.riskLevel?.let {
                        StatusBadge(status = it)
                    }
                }
                Spacer(modifier = Modifier.height(Spacing.medium))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column {
                        Text(
                            text = "NAV",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = fund.nav?.let { "₹${"%.4f".format(it)}" } ?: "-",
                            style = MaterialTheme.typography.titleLarge,
                            color = Primary
                        )
                        fund.formattedNavDate?.let {
                            Text(
                                text = it,
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                    fund.returns1y?.let {
                        Column(horizontalAlignment = Alignment.End) {
                            Text(
                                text = "1Y Return",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            ReturnBadge(returnValue = it)
                        }
                    }
                }
            }
        }

        // NAV History Chart
        FundSection(
            title = "NAV History",
            icon = Icons.AutoMirrored.Filled.ShowChart
        ) {
            NavHistoryChart(
                historyData = navHistory,
                selectedPeriod = selectedPeriod,
                onPeriodChange = onPeriodChange
            )
        }

        // Returns
        FundSection(
            title = "Performance",
            icon = Icons.Default.Assessment
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                ReturnColumn("1 Year", fund.returns1y)
                ReturnColumn("3 Year", fund.returns3y)
                ReturnColumn("5 Year", fund.returns5y)
            }
        }

        // Fund Info
        FundSection(
            title = "Fund Information",
            icon = Icons.Default.Info
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(Spacing.small)) {
                fund.fundHouse?.let { InfoRow("Fund House", it) }
                fund.fundManager?.let { InfoRow("Fund Manager", it) }
                fund.aum?.let { InfoRow("AUM", "₹${"%,.0f".format(it)} Cr") }
                fund.expenseRatio?.let { InfoRow("Expense Ratio", "${"%.2f".format(it)}%") }
                fund.benchmark?.let { InfoRow("Benchmark", it) }
                fund.launchDate?.let { InfoRow("Launch Date", it) }
                fund.exitLoad?.let { InfoRow("Exit Load", it) }
            }
        }

        // Investment Limits
        if (fund.minSipAmount != null || fund.minLumpsumAmount != null) {
            FundSection(
                title = "Investment Details",
                icon = Icons.Default.AccountBalance
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(Spacing.small)) {
                    fund.minSipAmount?.let { InfoRow("Min SIP Amount", "₹${"%,.0f".format(it)}") }
                    fund.minLumpsumAmount?.let { InfoRow("Min Lumpsum", "₹${"%,.0f".format(it)}") }
                }
            }
        }

        // Holdings
        if (!fund.holdings.isNullOrEmpty()) {
            FundSection(
                title = "Top Holdings",
                icon = Icons.Default.PieChart
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(Spacing.small)) {
                    fund.holdings.take(10).forEach { holding ->
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = holding.name,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                                holding.sector?.let {
                                    Text(
                                        text = it,
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                            Text(
                                text = "${"%.2f".format(holding.percentage)}%",
                                style = MaterialTheme.typography.labelMedium,
                                color = Primary
                            )
                        }
                        LinearProgressIndicator(
                            progress = { (holding.percentage.toFloat() / 100f).coerceIn(0f, 1f) },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(4.dp)
                                .clip(RoundedCornerShape(2.dp)),
                            color = Primary,
                            trackColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f)
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(Spacing.large))
    }
}

@Composable
private fun FundSection(
    title: String,
    icon: ImageVector,
    content: @Composable () -> Unit
) {
    GlassCard {
        Column(modifier = Modifier.fillMaxWidth()) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(Spacing.compact)
            ) {
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .clip(RoundedCornerShape(CornerRadius.small))
                        .background(Primary.copy(alpha = 0.1f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = icon,
                        contentDescription = null,
                        tint = Primary,
                        modifier = Modifier.size(18.dp)
                    )
                }
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onSurface
                )
            }
            Spacer(modifier = Modifier.height(Spacing.medium))
            content()
        }
    }
}

@Composable
private fun ReturnColumn(period: String, value: Double?) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            text = period,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(modifier = Modifier.height(Spacing.micro))
        if (value != null) {
            ReturnBadge(returnValue = value)
        } else {
            Text(
                text = "-",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun InfoRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurface
        )
    }
}

@Composable
private fun NavHistoryChart(
    historyData: List<NavHistoryPoint>,
    selectedPeriod: String,
    onPeriodChange: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val periods = listOf("1M", "6M", "1Y", "3Y", "ALL")
    val isDark = com.sparrowinvest.fa.ui.theme.LocalIsDarkTheme.current
    val primaryColor = if (isDark) Color(0xFF93C5FD) else Color(0xFF3B82F6)
    val gradientTop = primaryColor.copy(alpha = if (isDark) 0.20f else 0.15f)
    val gradientBottom = primaryColor.copy(alpha = 0f)

    var animationPlayed by remember { mutableStateOf(false) }
    val animationProgress by animateFloatAsState(
        targetValue = if (animationPlayed) 1f else 0f,
        animationSpec = tween(durationMillis = 600),
        label = "navLineAnimation"
    )

    LaunchedEffect(historyData) {
        animationPlayed = false
        animationPlayed = true
    }

    val periodReturn = remember(historyData) {
        if (historyData.size < 2) null
        else {
            val start = historyData.first().nav
            val end = historyData.last().nav
            if (start > 0) ((end - start) / start) * 100 else null
        }
    }

    Column(modifier = modifier) {
        // Period selector + return badge
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            periodReturn?.let { ret ->
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = "${if (ret >= 0) "+" else ""}${"%.2f".format(ret)}%",
                        style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.SemiBold),
                        color = if (ret >= 0) Color(0xFF10B981) else Color(0xFFEF4444),
                        modifier = Modifier
                            .background(
                                color = if (ret >= 0) Color(0xFF10B981).copy(alpha = 0.1f) else Color(0xFFEF4444).copy(alpha = 0.1f),
                                shape = RoundedCornerShape(12.dp)
                            )
                            .padding(horizontal = 10.dp, vertical = 4.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = if (selectedPeriod == "ALL") "All time" else "$selectedPeriod return",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            } ?: Spacer(modifier = Modifier)

            Row(
                modifier = Modifier
                    .background(
                        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                        shape = RoundedCornerShape(8.dp)
                    )
                    .padding(2.dp),
                horizontalArrangement = Arrangement.spacedBy(2.dp)
            ) {
                periods.forEach { period ->
                    Text(
                        text = period,
                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Medium),
                        color = if (selectedPeriod == period) Color.White else MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(
                                if (selectedPeriod == period)
                                    Brush.linearGradient(
                                        if (isDark) listOf(Color(0xFF1E3A6E), Color(0xFF152C54))
                                        else listOf(Color(0xFF3B82F6), Color(0xFF2563EB))
                                    )
                                else
                                    Brush.linearGradient(listOf(Color.Transparent, Color.Transparent))
                            )
                            .clickable { onPeriodChange(period) }
                            .padding(horizontal = 10.dp, vertical = 6.dp)
                    )
                }
            }
        }

        // Chart area
        if (historyData.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(180.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "No data for this period",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        } else {
            Canvas(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(180.dp)
            ) {
                val values = historyData.map { it.nav.toFloat() }
                val minVal = values.min()
                val maxVal = values.max()
                val range = if (maxVal - minVal > 0) maxVal - minVal else 1f

                val padding = 8.dp.toPx()
                val chartWidth = size.width - padding * 2
                val chartHeight = size.height - padding * 2

                val animatedCount = (values.size * animationProgress).toInt().coerceAtLeast(1)
                val points = values.take(animatedCount).mapIndexed { index, value ->
                    val x = padding + (index.toFloat() / (values.size - 1).coerceAtLeast(1)) * chartWidth
                    val y = padding + chartHeight - ((value - minVal) / range) * chartHeight
                    Offset(x, y)
                }

                if (points.size >= 2) {
                    val fillPath = Path().apply {
                        moveTo(points.first().x, size.height)
                        points.forEach { lineTo(it.x, it.y) }
                        lineTo(points.last().x, size.height)
                        close()
                    }
                    drawPath(
                        path = fillPath,
                        brush = Brush.verticalGradient(
                            colors = listOf(gradientTop, gradientBottom),
                            startY = points.minOf { it.y },
                            endY = size.height
                        )
                    )

                    val linePath = Path().apply {
                        moveTo(points.first().x, points.first().y)
                        for (i in 1 until points.size) {
                            val prev = points[i - 1]
                            val curr = points[i]
                            val cx1 = (prev.x + curr.x) / 2
                            cubicTo(cx1, prev.y, cx1, curr.y, curr.x, curr.y)
                        }
                    }
                    drawPath(
                        path = linePath,
                        brush = Brush.horizontalGradient(
                            colors = if (isDark) listOf(Color(0xFF93C5FD), Color(0xFF7DD3FC))
                            else listOf(Color(0xFF3B82F6), Color(0xFF38BDF8))
                        ),
                        style = Stroke(width = 3.dp.toPx(), cap = StrokeCap.Round)
                    )

                    if (animationProgress >= 1f) {
                        drawCircle(
                            color = primaryColor,
                            radius = 5.dp.toPx(),
                            center = points.last()
                        )
                        drawCircle(
                            color = Color.White,
                            radius = 3.dp.toPx(),
                            center = points.last()
                        )
                    }
                }
            }
        }
    }
}
