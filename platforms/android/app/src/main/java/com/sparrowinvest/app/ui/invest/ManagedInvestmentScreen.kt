package com.sparrowinvest.app.ui.invest

import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Divider
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.sparrowinvest.app.data.model.Fund
import com.sparrowinvest.app.ui.theme.CardBackgroundDark
import com.sparrowinvest.app.ui.theme.CardBackgroundLight
import com.sparrowinvest.app.ui.theme.CornerRadius
import com.sparrowinvest.app.ui.theme.GlassBorderEndDark
import com.sparrowinvest.app.ui.theme.GlassBorderEndLight
import com.sparrowinvest.app.ui.theme.GlassBorderMidDark
import com.sparrowinvest.app.ui.theme.GlassBorderMidLight
import com.sparrowinvest.app.ui.theme.GlassBorderStartDark
import com.sparrowinvest.app.ui.theme.GlassBorderStartLight
import com.sparrowinvest.app.ui.theme.LocalIsDarkTheme
import com.sparrowinvest.app.ui.theme.Primary
import com.sparrowinvest.app.ui.theme.Secondary
import com.sparrowinvest.app.ui.theme.ShadowColor
import com.sparrowinvest.app.ui.theme.Spacing
import java.text.NumberFormat
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ManagedInvestmentScreen(
    fund: Fund,
    onNavigateBack: () -> Unit,
    viewModel: ManagedInvestmentViewModel = hiltViewModel()
) {
    val isDark = LocalIsDarkTheme.current
    val uiState by viewModel.uiState.collectAsState()
    val investmentType by viewModel.investmentType.collectAsState()
    val amount by viewModel.amount.collectAsState()
    val remarks by viewModel.remarks.collectAsState()
    val advisor by viewModel.advisor.collectAsState()

    // Handle success/error dialogs
    when (val state = uiState) {
        is ManagedInvestmentUiState.Success -> {
            AlertDialog(
                onDismissRequest = { },
                title = { Text("Order Submitted") },
                text = { Text(state.message) },
                confirmButton = {
                    TextButton(onClick = {
                        viewModel.resetState()
                        onNavigateBack()
                    }) {
                        Text("OK")
                    }
                }
            )
        }
        is ManagedInvestmentUiState.Error -> {
            AlertDialog(
                onDismissRequest = { viewModel.clearError() },
                title = { Text("Error") },
                text = { Text(state.message) },
                confirmButton = {
                    TextButton(onClick = { viewModel.clearError() }) {
                        Text("OK")
                    }
                }
            )
        }
        else -> { }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Invest") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background
                )
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(Spacing.medium)
        ) {
            // Fund Info Section
            SectionLabel("FUND")
            FundInfoCard(fund = fund, isDark = isDark)

            Spacer(modifier = Modifier.height(Spacing.large))

            // Investment Type Section
            SectionLabel("INVESTMENT TYPE")
            InvestmentTypeSelector(
                selected = investmentType,
                onSelect = viewModel::setInvestmentType,
                isDark = isDark
            )

            Spacer(modifier = Modifier.height(Spacing.large))

            // Amount Section
            SectionLabel("AMOUNT")
            AmountInputSection(
                amount = amount,
                onAmountChange = viewModel::setAmount,
                onQuickAmountSelect = viewModel::setQuickAmount,
                investmentType = investmentType,
                isDark = isDark
            )

            Spacer(modifier = Modifier.height(Spacing.large))

            // Order Summary Section
            SectionLabel("ORDER SUMMARY")
            OrderSummaryCard(
                fund = fund,
                investmentType = investmentType,
                amount = amount,
                advisorName = advisor?.name,
                isDark = isDark
            )

            Spacer(modifier = Modifier.height(Spacing.large))

            // Submit Button
            SubmitButton(
                isLoading = uiState is ManagedInvestmentUiState.Submitting,
                isEnabled = amount.isNotBlank() && (amount.toDoubleOrNull() ?: 0.0) > 0,
                onClick = { viewModel.submitTradeRequest(fund) }
            )

            Spacer(modifier = Modifier.height(Spacing.large))
        }
    }
}

@Composable
private fun SectionLabel(text: String) {
    Text(
        text = text,
        style = MaterialTheme.typography.labelSmall,
        color = Primary,
        letterSpacing = 1.sp,
        fontWeight = FontWeight.Medium,
        modifier = Modifier.padding(bottom = Spacing.small)
    )
}

@Composable
private fun FundInfoCard(fund: Fund, isDark: Boolean) {
    val shape = RoundedCornerShape(CornerRadius.large)
    val backgroundColor = if (isDark) CardBackgroundDark else CardBackgroundLight
    val borderBrush = glassBorderBrush(isDark)

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .then(if (!isDark) Modifier.shadow(8.dp, shape, spotColor = ShadowColor) else Modifier)
            .clip(shape)
            .background(backgroundColor)
            .border(1.dp, borderBrush, shape)
            .padding(Spacing.medium),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Fund Icon
        Box(
            modifier = Modifier
                .size(48.dp)
                .clip(RoundedCornerShape(CornerRadius.small))
                .background(Primary.copy(alpha = if (isDark) 0.15f else 0.1f)),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = fund.schemeName.take(2).uppercase(),
                style = MaterialTheme.typography.titleSmall,
                color = Primary
            )
        }

        Spacer(modifier = Modifier.width(Spacing.medium))

        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = fund.schemeName.take(40) + if (fund.schemeName.length > 40) "..." else "",
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Medium,
                color = MaterialTheme.colorScheme.onSurface
            )
            Row(horizontalArrangement = Arrangement.spacedBy(Spacing.small)) {
                Text(
                    text = fund.category,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = "NAV: ₹${String.format(Locale.US, "%.2f", fund.nav)}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
private fun InvestmentTypeSelector(
    selected: InvestmentType,
    onSelect: (InvestmentType) -> Unit,
    isDark: Boolean
) {
    val shape = RoundedCornerShape(50)
    val backgroundColor = if (isDark) CardBackgroundDark else CardBackgroundLight
    val borderBrush = glassBorderBrush(isDark)

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .then(if (!isDark) Modifier.shadow(4.dp, shape, spotColor = ShadowColor) else Modifier)
            .clip(shape)
            .background(backgroundColor)
            .border(1.dp, borderBrush, shape)
            .padding(4.dp)
    ) {
        InvestmentType.entries.forEach { type ->
            val isSelected = selected == type
            Box(
                modifier = Modifier
                    .weight(1f)
                    .clip(RoundedCornerShape(50))
                    .background(
                        if (isSelected) {
                            Brush.horizontalGradient(listOf(Primary, Secondary))
                        } else {
                            Brush.horizontalGradient(listOf(Color.Transparent, Color.Transparent))
                        }
                    )
                    .clickable { onSelect(type) }
                    .padding(vertical = 12.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = type.displayName,
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Medium,
                    color = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurface
                )
            }
        }
    }
}

@Composable
private fun AmountInputSection(
    amount: String,
    onAmountChange: (String) -> Unit,
    onQuickAmountSelect: (Int) -> Unit,
    investmentType: InvestmentType,
    isDark: Boolean
) {
    Column {
        // Amount Input
        OutlinedTextField(
            value = amount,
            onValueChange = onAmountChange,
            modifier = Modifier.fillMaxWidth(),
            placeholder = { Text("Enter amount") },
            prefix = { Text("₹", style = MaterialTheme.typography.titleMedium) },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            singleLine = true,
            shape = RoundedCornerShape(14.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = Primary,
                unfocusedBorderColor = if (isDark) Color.White.opacity(0.1f) else Color.Black.opacity(0.1f)
            )
        )

        Spacer(modifier = Modifier.height(Spacing.compact))

        // Quick Amount Buttons
        Row(
            horizontalArrangement = Arrangement.spacedBy(Spacing.small)
        ) {
            listOf(1000, 5000, 10000, 25000).forEach { quickAmount ->
                QuickAmountChip(
                    amount = quickAmount,
                    onClick = { onQuickAmountSelect(quickAmount) },
                    isDark = isDark
                )
            }
        }

        if (investmentType == InvestmentType.SIP) {
            Spacer(modifier = Modifier.height(Spacing.small))
            Text(
                text = "This amount will be invested monthly via SIP",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun QuickAmountChip(
    amount: Int,
    onClick: () -> Unit,
    isDark: Boolean
) {
    val formatter = NumberFormat.getNumberInstance(Locale("en", "IN"))
    Text(
        text = "₹${formatter.format(amount)}",
        style = MaterialTheme.typography.labelMedium,
        color = Primary,
        modifier = Modifier
            .clip(RoundedCornerShape(50))
            .background(Primary.copy(alpha = if (isDark) 0.15f else 0.1f))
            .clickable(onClick = onClick)
            .padding(horizontal = 12.dp, vertical = 8.dp)
    )
}

@Composable
private fun OrderSummaryCard(
    fund: Fund,
    investmentType: InvestmentType,
    amount: String,
    advisorName: String?,
    isDark: Boolean
) {
    val shape = RoundedCornerShape(CornerRadius.large)
    val backgroundColor = if (isDark) CardBackgroundDark else CardBackgroundLight
    val borderBrush = glassBorderBrush(isDark)

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .then(if (!isDark) Modifier.shadow(8.dp, shape, spotColor = ShadowColor) else Modifier)
            .clip(shape)
            .background(backgroundColor)
            .border(1.dp, borderBrush, shape)
    ) {
        SummaryRow(label = "Fund", value = fund.schemeName.take(30))
        Divider(modifier = Modifier.padding(start = 16.dp))
        SummaryRow(label = "Type", value = investmentType.displayName)
        Divider(modifier = Modifier.padding(start = 16.dp))
        SummaryRow(label = "Amount", value = if (amount.isBlank()) "—" else "₹$amount")
        advisorName?.let {
            Divider(modifier = Modifier.padding(start = 16.dp))
            SummaryRow(label = "Advisor", value = it)
        }
    }
}

@Composable
private fun SummaryRow(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(Spacing.medium),
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
            fontWeight = FontWeight.Medium,
            color = MaterialTheme.colorScheme.onSurface,
            maxLines = 1
        )
    }
}

@Composable
private fun SubmitButton(
    isLoading: Boolean,
    isEnabled: Boolean,
    onClick: () -> Unit
) {
    Button(
        onClick = onClick,
        modifier = Modifier
            .fillMaxWidth()
            .height(52.dp),
        enabled = isEnabled && !isLoading,
        shape = RoundedCornerShape(14.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = Primary,
            disabledContainerColor = Color.Gray
        )
    ) {
        if (isLoading) {
            CircularProgressIndicator(
                color = Color.White,
                modifier = Modifier.size(20.dp),
                strokeWidth = 2.dp
            )
            Spacer(modifier = Modifier.width(Spacing.small))
            Text("Submitting...", color = Color.White)
        } else {
            Icon(
                imageVector = Icons.Default.Send,
                contentDescription = null,
                modifier = Modifier.size(18.dp)
            )
            Spacer(modifier = Modifier.width(Spacing.small))
            Text(
                text = "Submit to Advisor",
                style = MaterialTheme.typography.titleMedium,
                color = Color.White
            )
        }
    }
}

@Composable
private fun glassBorderBrush(isDark: Boolean): Brush {
    return if (isDark) {
        Brush.linearGradient(
            colors = listOf(
                GlassBorderStartDark,
                GlassBorderMidDark,
                GlassBorderEndDark
            )
        )
    } else {
        Brush.linearGradient(
            colors = listOf(
                GlassBorderStartLight,
                GlassBorderMidLight,
                GlassBorderEndLight
            )
        )
    }
}

private fun Color.Companion.opacity(alpha: Float): Color = Color.White.copy(alpha = alpha)
