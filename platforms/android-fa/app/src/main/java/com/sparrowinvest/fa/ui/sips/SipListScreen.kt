package com.sparrowinvest.fa.ui.sips

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
import androidx.compose.material.icons.filled.Cancel
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Snackbar
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.sparrowinvest.fa.data.model.FASip
import com.sparrowinvest.fa.ui.components.EmptyState
import com.sparrowinvest.fa.ui.components.ErrorState
import com.sparrowinvest.fa.ui.components.ListItemCard
import com.sparrowinvest.fa.ui.components.LoadingIndicator
import com.sparrowinvest.fa.ui.components.StatusBadge
import com.sparrowinvest.fa.ui.components.TopBar
import com.sparrowinvest.fa.ui.theme.CornerRadius
import com.sparrowinvest.fa.ui.theme.Error
import com.sparrowinvest.fa.ui.theme.Spacing
import com.sparrowinvest.fa.ui.theme.Success
import com.sparrowinvest.fa.ui.theme.Warning
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SipListScreen(
    viewModel: SipListViewModel = hiltViewModel(),
    onBackClick: () -> Unit,
    onNavigateToClient: (String) -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    val selectedFilter by viewModel.selectedFilter.collectAsState()
    val actionError by viewModel.actionError.collectAsState()
    val actionSuccess by viewModel.actionSuccess.collectAsState()
    val isRefreshing = uiState is SipListUiState.Loading

    val snackbarHostState = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()

    var showCancelDialog by remember { mutableStateOf<FASip?>(null) }

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

    // Cancel confirmation dialog
    showCancelDialog?.let { sip ->
        AlertDialog(
            onDismissRequest = { showCancelDialog = null },
            title = { Text("Cancel SIP") },
            text = {
                Text("Are you sure you want to cancel the SIP for ${sip.fundName}? This action cannot be undone.")
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        viewModel.cancelSip(sip.id)
                        showCancelDialog = null
                    }
                ) {
                    Text("Cancel SIP", color = Error)
                }
            },
            dismissButton = {
                TextButton(onClick = { showCancelDialog = null }) {
                    Text("Keep")
                }
            }
        )
    }

    Scaffold(
        snackbarHost = {
            SnackbarHost(snackbarHostState) { data ->
                val isError = actionError != null
                Snackbar(
                    snackbarData = data,
                    containerColor = if (isError) Error else Success,
                    contentColor = Color.White
                )
            }
        }
    ) { scaffoldPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(scaffoldPadding)
        ) {
            TopBar(
                title = "All SIPs",
                onBackClick = onBackClick
            )

            PullToRefreshBox(
                isRefreshing = isRefreshing,
                onRefresh = { viewModel.refresh() },
                modifier = Modifier.fillMaxSize()
            ) {
                when (val state = uiState) {
                    is SipListUiState.Loading -> {
                        LoadingIndicator(
                            modifier = Modifier.fillMaxSize(),
                            message = "Loading SIPs..."
                        )
                    }
                    is SipListUiState.Error -> {
                        ErrorState(
                            message = state.message,
                            onRetry = { viewModel.refresh() },
                            modifier = Modifier.fillMaxSize()
                        )
                    }
                    is SipListUiState.Success -> {
                        SipsContent(
                            sips = state.sips,
                            summary = state.summary,
                            selectedFilter = selectedFilter,
                            onFilterChange = { viewModel.setFilter(it) },
                            onSipClick = { onNavigateToClient(it.clientId) },
                            onPause = { viewModel.pauseSip(it.id) },
                            onResume = { viewModel.resumeSip(it.id) },
                            onCancel = { showCancelDialog = it }
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun SipsContent(
    sips: List<FASip>,
    summary: SipSummary,
    selectedFilter: SipFilter,
    onFilterChange: (SipFilter) -> Unit,
    onSipClick: (FASip) -> Unit,
    onPause: (FASip) -> Unit,
    onResume: (FASip) -> Unit,
    onCancel: (FASip) -> Unit
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = Spacing.medium),
        verticalArrangement = Arrangement.spacedBy(Spacing.compact)
    ) {
        // Summary
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = Spacing.compact),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "${sips.size} SIPs",
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onBackground
                )
                Text(
                    text = "₹${formatAmount(summary.totalMonthlyValue)}/month",
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.primary
                )
            }
        }

        // Filter chips
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(Spacing.small)
            ) {
                SipFilter.entries.forEach { filter ->
                    val count = when (filter) {
                        SipFilter.All -> summary.totalCount
                        SipFilter.Active -> summary.activeCount
                        SipFilter.Paused -> summary.pausedCount
                        SipFilter.Cancelled -> summary.cancelledCount
                    }
                    FilterChip(
                        selected = selectedFilter == filter,
                        onClick = { onFilterChange(filter) },
                        label = { Text("${filter.label} ($count)") },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.1f),
                            selectedLabelColor = MaterialTheme.colorScheme.primary
                        )
                    )
                }
            }
        }

        // SIP list
        if (sips.isEmpty()) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(200.dp),
                    contentAlignment = Alignment.Center
                ) {
                    EmptyState(
                        title = "No SIPs found",
                        message = "No SIPs match the selected filter"
                    )
                }
            }
        } else {
            items(sips, key = { it.id }) { sip ->
                SipItem(
                    sip = sip,
                    onClick = { onSipClick(sip) },
                    onPause = { onPause(sip) },
                    onResume = { onResume(sip) },
                    onCancel = { onCancel(sip) }
                )
            }
        }

        item {
            Spacer(modifier = Modifier.height(Spacing.large))
        }
    }
}

@Composable
private fun SipItem(
    sip: FASip,
    onClick: () -> Unit,
    onPause: () -> Unit,
    onResume: () -> Unit,
    onCancel: () -> Unit
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
                        text = sip.fundName,
                        style = MaterialTheme.typography.titleSmall,
                        color = MaterialTheme.colorScheme.onSurface,
                        maxLines = 2
                    )
                    sip.clientName?.let {
                        Text(
                            text = it,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        text = sip.formattedAmount,
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    StatusBadge(status = sip.status)
                }
            }
            Spacer(modifier = Modifier.height(Spacing.small))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "${sip.frequency} - Day ${sip.sipDate}",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                // Action buttons based on status
                Row(
                    horizontalArrangement = Arrangement.spacedBy(Spacing.small)
                ) {
                    if (sip.isActive) {
                        SipActionButton(
                            icon = Icons.Default.Pause,
                            label = "Pause",
                            color = Warning,
                            onClick = onPause
                        )
                        SipActionButton(
                            icon = Icons.Default.Cancel,
                            label = "Cancel",
                            color = Error,
                            onClick = onCancel
                        )
                    } else if (sip.isPaused) {
                        SipActionButton(
                            icon = Icons.Default.PlayArrow,
                            label = "Resume",
                            color = Success,
                            onClick = onResume
                        )
                        SipActionButton(
                            icon = Icons.Default.Cancel,
                            label = "Cancel",
                            color = Error,
                            onClick = onCancel
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun SipActionButton(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    color: Color,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(CornerRadius.small))
            .background(color.copy(alpha = 0.1f))
            .clickable(onClick = onClick)
            .padding(horizontal = Spacing.compact, vertical = Spacing.small)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Icon(
                imageVector = icon,
                contentDescription = label,
                tint = color,
                modifier = Modifier.size(14.dp)
            )
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall,
                color = color
            )
        }
    }
}

private fun formatAmount(amount: Double): String {
    return when {
        amount >= 100000 -> "%.2f L".format(amount / 100000)
        amount >= 1000 -> "%.2f K".format(amount / 1000)
        else -> "%.0f".format(amount)
    }
}
