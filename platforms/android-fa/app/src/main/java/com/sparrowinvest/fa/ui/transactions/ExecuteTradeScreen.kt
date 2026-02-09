package com.sparrowinvest.fa.ui.transactions

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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBalance
import androidx.compose.material.icons.filled.AttachMoney
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.sparrowinvest.fa.ui.components.GlassCard
import com.sparrowinvest.fa.ui.components.GlassTextField
import com.sparrowinvest.fa.ui.components.ListItemCard
import com.sparrowinvest.fa.ui.components.LoadingIndicator
import com.sparrowinvest.fa.ui.components.PrimaryButton
import com.sparrowinvest.fa.ui.components.ReturnBadge
import com.sparrowinvest.fa.ui.components.TopBar
import com.sparrowinvest.fa.ui.theme.CornerRadius
import com.sparrowinvest.fa.ui.theme.Primary
import com.sparrowinvest.fa.ui.theme.Secondary
import com.sparrowinvest.fa.ui.theme.Spacing

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ExecuteTradeScreen(
    clientId: String,
    onBackClick: () -> Unit,
    onTradeSuccess: () -> Unit,
    viewModel: ExecuteTradeViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val searchQuery by viewModel.searchQuery.collectAsState()
    val searchResults by viewModel.searchResults.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(clientId) {
        viewModel.loadClient(clientId)
    }

    LaunchedEffect(uiState.error) {
        uiState.error?.let { error ->
            snackbarHostState.showSnackbar(error)
            viewModel.clearError()
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            TopBar(title = "Execute Trade", onBackClick = onBackClick)

            if (uiState.isLoadingClient) {
                LoadingIndicator(
                    modifier = Modifier.fillMaxSize(),
                    message = "Loading client..."
                )
            } else {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(horizontal = Spacing.medium)
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(Spacing.medium)
                ) {
                    Spacer(modifier = Modifier.height(Spacing.compact))

                    // Client Info
                    uiState.client?.let { client ->
                        TradeFormSection(
                            title = "Client",
                            subtitle = client.name,
                            icon = Icons.Default.Person
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(
                                    text = client.email,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                Text(
                                    text = "AUM: ₹${"%,.0f".format(client.aum)}",
                                    style = MaterialTheme.typography.labelMedium,
                                    color = Primary
                                )
                            }
                        }
                    }

                    // Trade Type
                    TradeFormSection(
                        title = "Trade Type",
                        subtitle = "Select buy or sell",
                        icon = Icons.Default.AttachMoney
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(Spacing.compact)
                        ) {
                            TradeType.entries.forEach { type ->
                                val isSelected = uiState.tradeType == type
                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .clip(RoundedCornerShape(50))
                                        .background(
                                            if (isSelected) Primary.copy(alpha = 0.15f)
                                            else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                                        )
                                        .clickable { viewModel.updateTradeType(type) }
                                        .padding(vertical = Spacing.small),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = type.label,
                                        style = MaterialTheme.typography.labelLarge,
                                        color = if (isSelected) Primary
                                        else MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                        }
                    }

                    // Fund Selection
                    TradeFormSection(
                        title = "Fund",
                        subtitle = "Search and select a fund",
                        icon = Icons.Default.AccountBalance
                    ) {
                        if (uiState.selectedFund != null) {
                            ListItemCard {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = uiState.selectedFund!!.schemeName,
                                            style = MaterialTheme.typography.titleSmall,
                                            maxLines = 2,
                                            overflow = TextOverflow.Ellipsis
                                        )
                                        uiState.selectedFund!!.nav?.let {
                                            Text(
                                                text = "NAV: ₹${"%.2f".format(it)}",
                                                style = MaterialTheme.typography.bodySmall,
                                                color = MaterialTheme.colorScheme.onSurfaceVariant
                                            )
                                        }
                                    }
                                    IconButton(onClick = { viewModel.clearFund() }) {
                                        Icon(
                                            imageVector = Icons.Default.Close,
                                            contentDescription = "Clear",
                                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                }
                            }
                        } else {
                            GlassTextField(
                                value = searchQuery,
                                onValueChange = { viewModel.setSearchQuery(it) },
                                placeholder = "Search fund name...",
                                prefix = {
                                    Icon(
                                        imageVector = Icons.Default.Search,
                                        contentDescription = null,
                                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            )
                            if (searchResults.isNotEmpty()) {
                                Spacer(modifier = Modifier.height(Spacing.compact))
                                Column(
                                    verticalArrangement = Arrangement.spacedBy(Spacing.micro)
                                ) {
                                    searchResults.take(5).forEach { fund ->
                                        ListItemCard(
                                            modifier = Modifier.clickable { viewModel.selectFund(fund) }
                                        ) {
                                            Column {
                                                Text(
                                                    text = fund.schemeName,
                                                    style = MaterialTheme.typography.bodySmall,
                                                    maxLines = 2,
                                                    overflow = TextOverflow.Ellipsis
                                                )
                                                Row(
                                                    modifier = Modifier.fillMaxWidth(),
                                                    horizontalArrangement = Arrangement.SpaceBetween
                                                ) {
                                                    fund.nav?.let {
                                                        Text(
                                                            text = "NAV: ₹${"%.2f".format(it)}",
                                                            style = MaterialTheme.typography.labelSmall,
                                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                                        )
                                                    }
                                                    fund.returns1y?.let {
                                                        ReturnBadge(returnValue = it)
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // Amount
                    TradeFormSection(
                        title = "Amount",
                        subtitle = "Enter trade amount",
                        icon = Icons.Default.AttachMoney
                    ) {
                        GlassTextField(
                            value = uiState.amount,
                            onValueChange = { viewModel.updateAmount(it) },
                            label = "Amount (₹)",
                            placeholder = "Enter amount",
                            keyboardType = KeyboardType.Number,
                            isError = uiState.amountError != null,
                            errorMessage = uiState.amountError,
                            prefix = {
                                Text(
                                    text = "₹",
                                    style = MaterialTheme.typography.bodyLarge,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        )
                        Spacer(modifier = Modifier.height(Spacing.small))
                        GlassTextField(
                            value = uiState.notes,
                            onValueChange = { viewModel.updateNotes(it) },
                            label = "Notes (Optional)",
                            placeholder = "Add any notes...",
                            singleLine = false
                        )
                    }

                    PrimaryButton(
                        text = "Execute ${uiState.tradeType.label}",
                        onClick = { viewModel.executeTrade(onTradeSuccess) },
                        isLoading = uiState.isSubmitting,
                        enabled = !uiState.isSubmitting && uiState.selectedFund != null
                    )

                    Spacer(modifier = Modifier.height(Spacing.large))
                }
            }
        }
    }
}

@Composable
private fun TradeFormSection(
    title: String,
    subtitle: String,
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
                        .size(40.dp)
                        .clip(RoundedCornerShape(CornerRadius.small))
                        .background(Primary.copy(alpha = 0.1f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = icon,
                        contentDescription = null,
                        tint = Primary,
                        modifier = Modifier.size(20.dp)
                    )
                }
                Column {
                    Text(
                        text = title,
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = subtitle,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            Spacer(modifier = Modifier.height(Spacing.medium))
            content()
        }
    }
}
