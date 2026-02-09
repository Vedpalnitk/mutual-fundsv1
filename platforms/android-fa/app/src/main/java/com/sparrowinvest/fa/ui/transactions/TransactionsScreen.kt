package com.sparrowinvest.fa.ui.transactions

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
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
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.OpenInNew
import androidx.compose.material.icons.filled.Receipt
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Snackbar
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import kotlinx.coroutines.launch
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.sparrowinvest.fa.data.model.FATransaction
import com.sparrowinvest.fa.ui.components.EmptyState
import com.sparrowinvest.fa.ui.components.ErrorState
import com.sparrowinvest.fa.ui.components.GlassCard
import com.sparrowinvest.fa.ui.components.ListItemCard
import com.sparrowinvest.fa.ui.components.LoadingIndicator
import com.sparrowinvest.fa.ui.components.StatusBadge
import com.sparrowinvest.fa.ui.theme.CornerRadius
import com.sparrowinvest.fa.ui.theme.Error
import com.sparrowinvest.fa.ui.theme.LocalIsDarkTheme
import com.sparrowinvest.fa.ui.theme.Primary
import com.sparrowinvest.fa.ui.theme.Secondary
import com.sparrowinvest.fa.ui.theme.Spacing
import com.sparrowinvest.fa.ui.theme.Success
import com.sparrowinvest.fa.ui.theme.Warning

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TransactionsScreen(
    viewModel: TransactionsViewModel = hiltViewModel(),
    onNavigateToClient: (String) -> Unit,
    onNavigateToPlatform: (String) -> Unit,
    onNavigateToTransaction: (String) -> Unit = {}
) {
    val uiState by viewModel.uiState.collectAsState()
    val selectedFilter by viewModel.selectedFilter.collectAsState()
    val actionError by viewModel.actionError.collectAsState()
    val actionSuccess by viewModel.actionSuccess.collectAsState()
    val isRefreshing = uiState is TransactionsUiState.Loading

    var showPlatformSheet by remember { mutableStateOf(false) }
    val sheetState = rememberModalBottomSheetState()
    val snackbarHostState = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()

    LaunchedEffect(actionSuccess) {
        actionSuccess?.let {
            scope.launch { snackbarHostState.showSnackbar(it) }
            viewModel.clearActionSuccess()
        }
    }

    LaunchedEffect(actionError) {
        actionError?.let {
            scope.launch { snackbarHostState.showSnackbar(it) }
            viewModel.clearActionError()
        }
    }

    Scaffold(
        snackbarHost = {
            SnackbarHost(snackbarHostState) { data ->
                val isError = actionError != null
                Snackbar(
                    snackbarData = data,
                    containerColor = if (isError)
                        Error
                    else
                        Success,
                    contentColor = Color.White
                )
            }
        }
    ) { paddingValues ->
        PullToRefreshBox(
            isRefreshing = isRefreshing,
            onRefresh = { viewModel.refresh() },
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = Spacing.medium)
            ) {
                Spacer(modifier = Modifier.height(Spacing.medium))

                // Header with New Trade Button
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Transactions",
                        style = MaterialTheme.typography.headlineMedium,
                        color = MaterialTheme.colorScheme.onBackground
                    )

                    // New Transaction Button (pill shape per design system)
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(50))
                            .background(MaterialTheme.colorScheme.primary)
                            .clickable { showPlatformSheet = true }
                            .padding(horizontal = Spacing.medium, vertical = Spacing.small),
                    ) {
                        Text(
                            text = "+ Transaction",
                            style = MaterialTheme.typography.labelLarge,
                            color = MaterialTheme.colorScheme.onPrimary
                        )
                    }
                }

                Spacer(modifier = Modifier.height(Spacing.medium))

                when (val state = uiState) {
                    is TransactionsUiState.Loading -> {
                        LoadingIndicator(
                            modifier = Modifier.fillMaxSize(),
                            message = "Loading transactions..."
                        )
                    }
                    is TransactionsUiState.Error -> {
                        ErrorState(
                            message = state.message,
                            onRetry = { viewModel.refresh() },
                            modifier = Modifier.fillMaxSize()
                        )
                    }
                    is TransactionsUiState.Success -> {
                        TransactionsContent(
                            transactions = state.transactions,
                            summary = state.summary,
                            selectedFilter = selectedFilter,
                            onFilterChange = { viewModel.setFilter(it) },
                            onTransactionClick = { onNavigateToTransaction(it.id) },
                            onApprove = { viewModel.approveTransaction(it.id) },
                            onReject = { viewModel.rejectTransaction(it.id) }
                        )
                    }
                }
            }
        }
    }

    // Platform Selection Bottom Sheet
    val isDark = LocalIsDarkTheme.current
    if (showPlatformSheet) {
        ModalBottomSheet(
            onDismissRequest = { showPlatformSheet = false },
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
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = Spacing.medium)
                    .padding(bottom = Spacing.large)
            ) {
                Text(
                    text = "Execute Transaction",
                    style = MaterialTheme.typography.titleLarge,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Spacer(modifier = Modifier.height(Spacing.small))
                Text(
                    text = "Select a platform to execute the transaction on behalf of your client",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(modifier = Modifier.height(Spacing.medium))

                // BSE Star MF Option
                PlatformOption(
                    name = "BSE Star MF",
                    description = "BSE's mutual fund transaction platform for distributors",
                    onClick = {
                        showPlatformSheet = false
                        onNavigateToPlatform("bse")
                    }
                )

                Spacer(modifier = Modifier.height(Spacing.compact))

                // MFU Option
                PlatformOption(
                    name = "MF Utility (MFU)",
                    description = "Industry-wide transaction portal with TransactEezz",
                    onClick = {
                        showPlatformSheet = false
                        onNavigateToPlatform("mfu")
                    }
                )

                Spacer(modifier = Modifier.height(Spacing.large))
            }
        }
    }
}

@Composable
private fun PlatformOption(
    name: String,
    description: String,
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
                    text = name,
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
            Icon(
                imageVector = Icons.Default.OpenInNew,
                contentDescription = "Open",
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(20.dp)
            )
        }
    }
}

@Composable
private fun TransactionsContent(
    transactions: List<FATransaction>,
    summary: TransactionSummary,
    selectedFilter: TransactionFilter,
    onFilterChange: (TransactionFilter) -> Unit,
    onTransactionClick: (FATransaction) -> Unit,
    onApprove: (FATransaction) -> Unit,
    onReject: (FATransaction) -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.spacedBy(Spacing.medium)
    ) {
        // Summary Card
        item {
            TransactionSummaryCard(summary = summary)
        }

        // Filter chips
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(Spacing.small)
            ) {
                TransactionFilter.entries.forEach { filter ->
                    FilterChip(
                        selected = selectedFilter == filter,
                        onClick = { onFilterChange(filter) },
                        label = { Text(filter.label) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.1f),
                            selectedLabelColor = MaterialTheme.colorScheme.primary
                        )
                    )
                }
            }
        }

        // Transactions List
        if (transactions.isEmpty()) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(200.dp),
                    contentAlignment = Alignment.Center
                ) {
                    EmptyState(
                        title = "No transactions",
                        message = "Transaction requests will appear here"
                    )
                }
            }
        } else {
            items(transactions, key = { it.id }) { transaction ->
                TransactionItem(
                    transaction = transaction,
                    onClick = { onTransactionClick(transaction) },
                    onApprove = { onApprove(transaction) },
                    onReject = { onReject(transaction) }
                )
            }
        }

        item {
            Spacer(modifier = Modifier.height(Spacing.large))
        }
    }
}

@Composable
private fun TransactionSummaryCard(summary: TransactionSummary) {
    GlassCard {
        Column(
            modifier = Modifier.fillMaxWidth()
        ) {
            // Header
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
                        imageVector = Icons.Default.Receipt,
                        contentDescription = null,
                        tint = Primary,
                        modifier = Modifier.size(20.dp)
                    )
                }

                Column {
                    Text(
                        text = "Transaction Summary",
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = "Overview of all transactions",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            Spacer(modifier = Modifier.height(Spacing.medium))

            // Stats Grid - 2x2
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(Spacing.compact)
            ) {
                StatTile(
                    label = "Pending",
                    value = summary.pending.toString(),
                    color = Warning,
                    modifier = Modifier.weight(1f)
                )
                StatTile(
                    label = "Executed",
                    value = summary.executed.toString(),
                    color = Success,
                    modifier = Modifier.weight(1f)
                )
            }

            Spacer(modifier = Modifier.height(Spacing.compact))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(Spacing.compact)
            ) {
                StatTile(
                    label = "Rejected",
                    value = summary.rejected.toString(),
                    color = Error,
                    modifier = Modifier.weight(1f)
                )
                StatTile(
                    label = "Pending Value",
                    value = formatAmount(summary.pendingValue),
                    color = Primary,
                    modifier = Modifier.weight(1f)
                )
            }
        }
    }
}

@Composable
private fun StatTile(
    label: String,
    value: String,
    color: Color,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(CornerRadius.medium))
            .background(color.copy(alpha = 0.08f))
            .padding(Spacing.compact)
    ) {
        Column(
            modifier = Modifier.fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = value,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold,
                color = color
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
private fun TransactionItem(
    transaction: FATransaction,
    onClick: () -> Unit,
    onApprove: () -> Unit,
    onReject: () -> Unit
) {
    ListItemCard(
        modifier = Modifier.clickable(onClick = onClick)
    ) {
        Column {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = transaction.clientName,
                        style = MaterialTheme.typography.titleSmall,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = transaction.fundName,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 2
                    )
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = transaction.type,
                            style = MaterialTheme.typography.labelSmall,
                            color = if (transaction.type == "Buy" || transaction.type == "SIP") Success else Error
                        )
                        if (transaction.isClientRequest) {
                            Text(
                                text = " • Client Request",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        text = transaction.formattedAmount,
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    StatusBadge(status = transaction.status)
                }
            }

            // Action buttons for pending transactions
            if (transaction.isPending) {
                Spacer(modifier = Modifier.height(Spacing.small))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Reject Button
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(CornerRadius.small))
                            .background(Error.copy(alpha = 0.1f))
                            .clickable(onClick = onReject)
                            .padding(horizontal = Spacing.compact, vertical = Spacing.small)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Close,
                                contentDescription = "Reject",
                                tint = Error,
                                modifier = Modifier.size(16.dp)
                            )
                            Text(
                                text = "Reject",
                                style = MaterialTheme.typography.labelMedium,
                                color = Error
                            )
                        }
                    }

                    Spacer(modifier = Modifier.width(Spacing.small))

                    // Approve Button
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(CornerRadius.small))
                            .background(Success.copy(alpha = 0.1f))
                            .clickable(onClick = onApprove)
                            .padding(horizontal = Spacing.compact, vertical = Spacing.small)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Check,
                                contentDescription = "Approve",
                                tint = Success,
                                modifier = Modifier.size(16.dp)
                            )
                            Text(
                                text = "Execute",
                                style = MaterialTheme.typography.labelMedium,
                                color = Success
                            )
                        }
                    }
                }
            }
        }
    }
}

private fun formatAmount(amount: Double): String {
    return when {
        amount >= 10000000 -> "₹%.1f Cr".format(amount / 10000000)
        amount >= 100000 -> "₹%.1f L".format(amount / 100000)
        amount >= 1000 -> "₹%.1f K".format(amount / 1000)
        else -> "₹%.0f".format(amount)
    }
}
