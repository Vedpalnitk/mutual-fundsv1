package com.sparrowinvest.fa.ui.funds

import androidx.compose.foundation.background
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBalance
import androidx.compose.material.icons.filled.Assessment
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.PieChart
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.sparrowinvest.fa.data.model.FundDetail
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

    Column(modifier = Modifier.fillMaxSize()) {
        TopBar(title = "Fund Details", onBackClick = onBackClick)

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
                FundDetailContent(fund = state.fund)
            }
        }
    }
}

@Composable
private fun FundDetailContent(fund: FundDetail) {
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
                        fund.navDate?.let {
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
