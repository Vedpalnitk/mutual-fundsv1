package com.sparrowinvest.fa.ui.funds

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.sparrowinvest.fa.data.model.Fund
import com.sparrowinvest.fa.ui.components.EmptyState
import com.sparrowinvest.fa.ui.components.ErrorState
import com.sparrowinvest.fa.ui.components.GlassTextField
import com.sparrowinvest.fa.ui.components.ListItemCard
import com.sparrowinvest.fa.ui.components.LoadingIndicator
import com.sparrowinvest.fa.ui.components.ReturnBadge
import com.sparrowinvest.fa.ui.components.TopBar
import com.sparrowinvest.fa.ui.theme.Spacing

@Composable
fun FundSearchScreen(
    viewModel: FundSearchViewModel = hiltViewModel(),
    onBackClick: () -> Unit,
    onSelectFund: (Int) -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    val searchQuery by viewModel.searchQuery.collectAsState()

    Column(modifier = Modifier.fillMaxSize()) {
        TopBar(
            title = "Search Funds",
            onBackClick = onBackClick
        )

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = Spacing.medium)
        ) {
            GlassTextField(
                value = searchQuery,
                onValueChange = { viewModel.setSearchQuery(it) },
                placeholder = "Search by fund name...",
                prefix = {
                    Icon(
                        imageVector = Icons.Default.Search,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            )

            Spacer(modifier = Modifier.height(Spacing.compact))

            when (val state = uiState) {
                is FundSearchUiState.Idle -> {
                    EmptyState(
                        title = "Search for funds",
                        message = "Enter a fund name to search",
                        modifier = Modifier.fillMaxSize()
                    )
                }
                is FundSearchUiState.Loading -> {
                    LoadingIndicator(
                        modifier = Modifier.fillMaxSize(),
                        message = "Searching..."
                    )
                }
                is FundSearchUiState.Error -> {
                    ErrorState(
                        message = state.message,
                        onRetry = { viewModel.search() },
                        modifier = Modifier.fillMaxSize()
                    )
                }
                is FundSearchUiState.Success -> {
                    if (state.funds.isEmpty()) {
                        EmptyState(
                            title = "No funds found",
                            message = "Try a different search term",
                            modifier = Modifier.fillMaxSize()
                        )
                    } else {
                        FundsList(
                            funds = state.funds,
                            onFundClick = { onSelectFund(it.schemeCode) }
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun FundsList(
    funds: List<Fund>,
    onFundClick: (Fund) -> Unit
) {
    LazyColumn(
        verticalArrangement = Arrangement.spacedBy(Spacing.compact)
    ) {
        items(funds, key = { it.schemeCode }) { fund ->
            FundItem(
                fund = fund,
                onClick = { onFundClick(fund) }
            )
        }
        item {
            Spacer(modifier = Modifier.height(Spacing.large))
        }
    }
}

@Composable
private fun FundItem(
    fund: Fund,
    onClick: () -> Unit
) {
    ListItemCard(
        modifier = Modifier.clickable(onClick = onClick)
    ) {
        Column {
            Text(
                text = fund.schemeName,
                style = MaterialTheme.typography.titleSmall,
                color = MaterialTheme.colorScheme.onSurface,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )
            Spacer(modifier = Modifier.height(4.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    fund.schemeCategory?.let {
                        Text(
                            text = it,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    fund.nav?.let {
                        Text(
                            text = "NAV: ₹${String.format("%.2f", it)}",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                Column(horizontalAlignment = Alignment.End) {
                    fund.returns1y?.let {
                        ReturnBadge(returnValue = it)
                    }
                    fund.riskLevel?.let {
                        Text(
                            text = it,
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }
    }
}
