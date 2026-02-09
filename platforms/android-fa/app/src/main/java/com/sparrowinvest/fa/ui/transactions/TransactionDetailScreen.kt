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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBalance
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Receipt
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
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
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.sparrowinvest.fa.data.model.FATransaction
import com.sparrowinvest.fa.ui.components.ErrorState
import com.sparrowinvest.fa.ui.components.GlassCard
import com.sparrowinvest.fa.ui.components.LoadingIndicator
import com.sparrowinvest.fa.ui.components.StatusBadge
import com.sparrowinvest.fa.ui.components.TopBar
import com.sparrowinvest.fa.ui.theme.CornerRadius
import com.sparrowinvest.fa.ui.theme.Error
import com.sparrowinvest.fa.ui.theme.Primary
import com.sparrowinvest.fa.ui.theme.Spacing
import com.sparrowinvest.fa.ui.theme.Success
import com.sparrowinvest.fa.ui.theme.Warning

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TransactionDetailScreen(
    transactionId: String,
    onBackClick: () -> Unit,
    onNavigateToClient: (String) -> Unit,
    viewModel: TransactionDetailViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val actionState by viewModel.actionState.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(transactionId) {
        viewModel.loadTransaction(transactionId)
    }

    LaunchedEffect(actionState) {
        when (val state = actionState) {
            is ActionState.Success -> {
                snackbarHostState.showSnackbar(state.message)
                viewModel.clearActionState()
            }
            is ActionState.Error -> {
                snackbarHostState.showSnackbar(state.message)
                viewModel.clearActionState()
            }
            else -> {}
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
            TopBar(title = "Transaction Details", onBackClick = onBackClick)

            when (val state = uiState) {
                is TransactionDetailUiState.Loading -> {
                    LoadingIndicator(
                        modifier = Modifier.fillMaxSize(),
                        message = "Loading transaction..."
                    )
                }
                is TransactionDetailUiState.Error -> {
                    ErrorState(
                        message = state.message,
                        onRetry = { viewModel.loadTransaction(transactionId) },
                        modifier = Modifier.fillMaxSize()
                    )
                }
                is TransactionDetailUiState.Success -> {
                    TransactionDetailContent(
                        transaction = state.transaction,
                        isActionLoading = actionState is ActionState.Loading,
                        onApprove = { viewModel.approveTransaction(state.transaction.id) },
                        onReject = { viewModel.rejectTransaction(state.transaction.id) },
                        onExecute = { viewModel.executeTransaction(state.transaction.id) },
                        onNavigateToClient = onNavigateToClient
                    )
                }
            }
        }
    }
}

@Composable
private fun TransactionDetailContent(
    transaction: FATransaction,
    isActionLoading: Boolean,
    onApprove: () -> Unit,
    onReject: () -> Unit,
    onExecute: () -> Unit,
    onNavigateToClient: (String) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = Spacing.medium)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(Spacing.medium)
    ) {
        Spacer(modifier = Modifier.height(Spacing.compact))

        // Amount & Status Header
        GlassCard {
            Column(
                modifier = Modifier.fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = transaction.formattedAmount,
                    style = MaterialTheme.typography.headlineLarge,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Spacer(modifier = Modifier.height(Spacing.compact))
                Row(
                    horizontalArrangement = Arrangement.spacedBy(Spacing.compact),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    StatusBadge(status = transaction.status)
                    Text(
                        text = transaction.type,
                        style = MaterialTheme.typography.labelMedium,
                        color = if (transaction.type == "Buy" || transaction.type == "SIP") Success else Error
                    )
                }
                if (transaction.isClientRequest) {
                    Spacer(modifier = Modifier.height(Spacing.small))
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(CornerRadius.small))
                            .background(Warning.copy(alpha = 0.1f))
                            .padding(horizontal = Spacing.small, vertical = Spacing.micro)
                    ) {
                        Text(
                            text = "Client Request",
                            style = MaterialTheme.typography.labelSmall,
                            color = Warning
                        )
                    }
                }
            }
        }

        // Client Info
        DetailSection(title = "Client", icon = Icons.Default.Person) {
            DetailRow("Name", transaction.clientName)
            DetailRow("Client ID", transaction.clientId)
        }

        // Fund Info
        DetailSection(title = "Fund", icon = Icons.Default.AccountBalance) {
            DetailRow("Fund Name", transaction.fundName)
            DetailRow("Scheme Code", transaction.fundSchemeCode)
            DetailRow("Category", transaction.fundCategory)
        }

        // Transaction Details
        DetailSection(title = "Details", icon = Icons.Default.Receipt) {
            DetailRow("Amount", transaction.formattedAmount)
            if (transaction.units > 0) {
                DetailRow("Units", transaction.formattedUnits)
            }
            if (transaction.nav > 0) {
                DetailRow("NAV", "₹${"%.4f".format(transaction.nav)}")
            }
            DetailRow("Date", transaction.date)
            DetailRow("Folio", transaction.folioNumber)
            transaction.orderId?.let { DetailRow("Order ID", it) }
            transaction.paymentMode?.let { DetailRow("Payment Mode", it) }
        }

        // Remarks
        transaction.remarks?.let { remarks ->
            DetailSection(title = "Remarks", icon = Icons.Default.Info) {
                Text(
                    text = remarks,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }

        // Action Buttons for pending transactions
        if (transaction.isPending) {
            GlassCard {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(Spacing.small)
                ) {
                    Text(
                        text = "ACTIONS",
                        style = MaterialTheme.typography.labelSmall,
                        color = Primary
                    )
                    Spacer(modifier = Modifier.height(Spacing.micro))

                    if (isActionLoading) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = Spacing.medium),
                            contentAlignment = Alignment.Center
                        ) {
                            CircularProgressIndicator(modifier = Modifier.size(24.dp))
                        }
                    } else {
                        // Execute Button
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(50))
                                .background(
                                    androidx.compose.ui.graphics.Brush.linearGradient(
                                        listOf(Primary, Primary.copy(alpha = 0.8f))
                                    )
                                )
                                .clickable(onClick = onExecute)
                                .padding(vertical = Spacing.small),
                            contentAlignment = Alignment.Center
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(Spacing.compact)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.PlayArrow,
                                    contentDescription = null,
                                    tint = androidx.compose.ui.graphics.Color.White,
                                    modifier = Modifier.size(18.dp)
                                )
                                Text(
                                    text = "Execute Trade",
                                    style = MaterialTheme.typography.labelLarge,
                                    color = androidx.compose.ui.graphics.Color.White
                                )
                            }
                        }

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(Spacing.compact)
                        ) {
                            // Reject
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(50))
                                    .background(Error.copy(alpha = 0.1f))
                                    .clickable(onClick = onReject)
                                    .padding(vertical = Spacing.small),
                                contentAlignment = Alignment.Center
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Close,
                                        contentDescription = null,
                                        tint = Error,
                                        modifier = Modifier.size(16.dp)
                                    )
                                    Text(
                                        text = "Reject",
                                        style = MaterialTheme.typography.labelLarge,
                                        color = Error
                                    )
                                }
                            }
                            // Approve
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(50))
                                    .background(Success.copy(alpha = 0.1f))
                                    .clickable(onClick = onApprove)
                                    .padding(vertical = Spacing.small),
                                contentAlignment = Alignment.Center
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Check,
                                        contentDescription = null,
                                        tint = Success,
                                        modifier = Modifier.size(16.dp)
                                    )
                                    Text(
                                        text = "Approve",
                                        style = MaterialTheme.typography.labelLarge,
                                        color = Success
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

        // Navigate to Client
        GlassCard {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onNavigateToClient(transaction.clientId) }
                    .padding(vertical = Spacing.micro),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "View Client Profile",
                    style = MaterialTheme.typography.labelLarge,
                    color = Primary
                )
                Icon(
                    imageVector = Icons.Default.Person,
                    contentDescription = null,
                    tint = Primary,
                    modifier = Modifier.size(20.dp)
                )
            }
        }

        Spacer(modifier = Modifier.height(Spacing.large))
    }
}

@Composable
private fun DetailSection(
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
private fun DetailRow(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = Spacing.micro),
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
