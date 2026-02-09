package com.sparrowinvest.fa.ui.sips

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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBalance
import androidx.compose.material.icons.filled.AttachMoney
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Repeat
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
import com.sparrowinvest.fa.ui.theme.Spacing

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreateSipScreen(
    clientId: String,
    onBackClick: () -> Unit,
    onSipCreated: () -> Unit,
    viewModel: CreateSipViewModel = hiltViewModel()
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
            TopBar(title = "Create SIP", onBackClick = onBackClick)

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
                        SipFormSection(
                            title = "Client",
                            subtitle = client.name,
                            icon = Icons.Default.Person
                        ) {
                            Text(
                                text = client.email,
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }

                    // Fund Selection
                    SipFormSection(
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
                    SipFormSection(
                        title = "SIP Amount",
                        subtitle = "Monthly investment amount",
                        icon = Icons.Default.AttachMoney
                    ) {
                        GlassTextField(
                            value = uiState.amount,
                            onValueChange = { viewModel.updateAmount(it) },
                            label = "Amount (₹)",
                            placeholder = "Enter SIP amount",
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
                    }

                    // Frequency
                    SipFormSection(
                        title = "Frequency",
                        subtitle = "How often to invest",
                        icon = Icons.Default.Repeat
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(Spacing.compact)
                        ) {
                            listOf("WEEKLY" to "Weekly", "MONTHLY" to "Monthly", "QUARTERLY" to "Quarterly").forEach { (value, label) ->
                                val isSelected = uiState.frequency == value
                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .clip(RoundedCornerShape(50))
                                        .background(
                                            if (isSelected) Primary.copy(alpha = 0.15f)
                                            else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                                        )
                                        .clickable { viewModel.updateFrequency(value) }
                                        .padding(vertical = Spacing.small),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = label,
                                        style = MaterialTheme.typography.labelMedium,
                                        color = if (isSelected) Primary
                                        else MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                        }
                    }

                    // SIP Date
                    SipFormSection(
                        title = "SIP Date",
                        subtitle = "Day of month for deduction",
                        icon = Icons.Default.CalendarMonth
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(Spacing.compact)
                        ) {
                            listOf(1, 5, 10, 15, 20, 25).forEach { day ->
                                val isSelected = uiState.sipDate == day
                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .clip(RoundedCornerShape(CornerRadius.small))
                                        .background(
                                            if (isSelected) Primary.copy(alpha = 0.15f)
                                            else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                                        )
                                        .clickable { viewModel.updateSipDate(day) }
                                        .padding(vertical = Spacing.small),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = day.toString(),
                                        style = MaterialTheme.typography.labelMedium,
                                        color = if (isSelected) Primary
                                        else MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                        }
                    }

                    PrimaryButton(
                        text = "Create SIP",
                        onClick = { viewModel.createSip(onSipCreated) },
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
private fun SipFormSection(
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
