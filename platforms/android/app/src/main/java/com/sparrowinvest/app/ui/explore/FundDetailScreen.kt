package com.sparrowinvest.app.ui.explore

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
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.sparrowinvest.app.data.model.FundCategory
import com.sparrowinvest.app.data.model.FundDetail
import com.sparrowinvest.app.ui.components.CurrencyText
import com.sparrowinvest.app.ui.components.FullScreenLoading
import com.sparrowinvest.app.ui.components.GlassCard
import com.sparrowinvest.app.ui.components.PrimaryButton
import com.sparrowinvest.app.ui.components.ReturnText
import com.sparrowinvest.app.ui.components.SecondaryButton
import com.sparrowinvest.app.ui.components.SectionHeader
import com.sparrowinvest.app.ui.components.TopBar
import com.sparrowinvest.app.ui.theme.CornerRadius
import com.sparrowinvest.app.ui.theme.Spacing

@Composable
fun FundDetailScreen(
    schemeCode: Int,
    viewModel: FundDetailViewModel = hiltViewModel(),
    onBackClick: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    val fundDetail by viewModel.fundDetail.collectAsState()

    LaunchedEffect(schemeCode) {
        viewModel.loadFundDetails(schemeCode)
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .statusBarsPadding()
    ) {
        TopBar(
            title = "",
            onBackClick = onBackClick
        )

        when (uiState) {
            is FundDetailUiState.Loading -> {
                FullScreenLoading()
            }
            is FundDetailUiState.Success -> {
                fundDetail?.let { fund ->
                    FundDetailContent(fund = fund)
                }
            }
            is FundDetailUiState.Error -> {
                // Error state
            }
        }
    }
}

@Composable
private fun FundDetailContent(fund: FundDetail) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = Spacing.medium)
    ) {
        // Fund Header
        FundHeader(fund = fund)

        Spacer(modifier = Modifier.height(Spacing.large))

        // NAV Card
        NavCard(fund = fund)

        Spacer(modifier = Modifier.height(Spacing.medium))

        // Returns
        SectionHeader(title = "Returns")
        ReturnsCard(fund = fund)

        Spacer(modifier = Modifier.height(Spacing.medium))

        // Fund Info
        SectionHeader(title = "Fund Information")
        FundInfoCard(fund = fund)

        Spacer(modifier = Modifier.height(Spacing.large))

        // Action Buttons
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(Spacing.medium)
        ) {
            SecondaryButton(
                text = "Start SIP",
                onClick = { /* TODO */ },
                modifier = Modifier.weight(1f)
            )
            PrimaryButton(
                text = "Invest Now",
                onClick = { /* TODO */ },
                modifier = Modifier.weight(1f)
            )
        }

        Spacer(modifier = Modifier.height(Spacing.large))
    }
}

@Composable
private fun FundHeader(fund: FundDetail) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.Top
    ) {
        Box(
            modifier = Modifier
                .size(56.dp)
                .clip(RoundedCornerShape(CornerRadius.medium))
                .background(
                    Color(FundCategory.fromString(fund.assetClass).color).copy(alpha = 0.1f)
                ),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = fund.schemeName.take(2).uppercase(),
                style = MaterialTheme.typography.titleMedium,
                color = Color(FundCategory.fromString(fund.assetClass).color)
            )
        }

        Spacer(modifier = Modifier.width(Spacing.medium))

        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = fund.schemeName,
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurface
            )

            Spacer(modifier = Modifier.height(Spacing.small))

            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(Spacing.small)
            ) {
                Text(
                    text = fund.category,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                fund.riskRating?.let { rating ->
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        repeat(rating.coerceIn(1, 5)) {
                            Icon(
                                imageVector = Icons.Default.Star,
                                contentDescription = null,
                                modifier = Modifier.size(12.dp),
                                tint = Color(0xFFF59E0B)
                            )
                        }
                    }
                }
            }

            fund.fundHouse?.let {
                Text(
                    text = it,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
private fun NavCard(fund: FundDetail) {
    GlassCard {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "Current NAV",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                CurrencyText(
                    amount = fund.nav,
                    style = MaterialTheme.typography.headlineSmall
                )
                fund.navDate?.let {
                    Text(
                        text = "as on $it",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            Column(horizontalAlignment = Alignment.End) {
                Text(
                    text = "Min SIP",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                CurrencyText(
                    amount = fund.minSip,
                    style = MaterialTheme.typography.titleMedium
                )
            }
        }
    }
}

@Composable
private fun ReturnsCard(fund: FundDetail) {
    GlassCard {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            fund.returns?.let { returns ->
                returns.oneYear?.let {
                    ReturnItem(label = "1Y", value = it)
                }
                returns.threeYear?.let {
                    ReturnItem(label = "3Y", value = it)
                }
                returns.fiveYear?.let {
                    ReturnItem(label = "5Y", value = it)
                }
            }
        }
    }
}

@Composable
private fun ReturnItem(label: String, value: Double) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(modifier = Modifier.height(4.dp))
        ReturnText(
            value = value,
            style = MaterialTheme.typography.titleMedium
        )
    }
}

@Composable
private fun FundInfoCard(fund: FundDetail) {
    GlassCard {
        Column(verticalArrangement = Arrangement.spacedBy(Spacing.compact)) {
            fund.aum?.let {
                InfoRow(label = "AUM", value = "₹${String.format("%.0f", it / 10000000)} Cr")
            }
            fund.expenseRatio?.let {
                InfoRow(label = "Expense Ratio", value = "${String.format("%.2f", it)}%")
            }
            fund.fundManager?.let {
                InfoRow(label = "Fund Manager", value = it)
            }
            fund.benchmark?.let {
                InfoRow(label = "Benchmark", value = it)
            }
            fund.inceptionDate?.let {
                InfoRow(label = "Inception Date", value = it)
            }
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
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurface
        )
    }
}
