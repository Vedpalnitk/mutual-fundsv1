package com.sparrowinvest.fa.ui.clients.insurance

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.History
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.sparrowinvest.fa.data.model.PremiumPayment
import com.sparrowinvest.fa.ui.components.GlassCard
import com.sparrowinvest.fa.ui.theme.Primary
import com.sparrowinvest.fa.ui.theme.Spacing

private fun formatPaymentDate(dateStr: String): String {
    return try {
        val formats = listOf("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", "yyyy-MM-dd")
        var parsed: java.util.Date? = null
        for (fmt in formats) {
            try {
                parsed = java.text.SimpleDateFormat(fmt, java.util.Locale.US).parse(dateStr)
                if (parsed != null) break
            } catch (_: Exception) {}
        }
        if (parsed == null) return dateStr
        java.text.SimpleDateFormat("dd MMM yyyy", java.util.Locale.US).format(parsed)
    } catch (_: Exception) { dateStr }
}

private fun formatAmount(amount: Double): String = when {
    amount >= 100000 -> "₹${"%.1f".format(amount / 100000)} L"
    else -> "₹${"%,.0f".format(amount)}"
}

private fun paymentModeLabel(mode: String?): String = when (mode) {
    "BANK_TRANSFER" -> "Bank Transfer"
    "CHEQUE" -> "Cheque"
    "UPI" -> "UPI"
    "AUTO_DEBIT" -> "Auto Debit"
    else -> mode ?: ""
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PaymentHistoryDialog(
    payments: List<PremiumPayment>,
    onDismiss: () -> Unit
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState
    ) {
        Column(
            modifier = Modifier
                .padding(horizontal = 24.dp)
                .padding(bottom = 32.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Payment History",
                    style = MaterialTheme.typography.titleLarge,
                    color = MaterialTheme.colorScheme.onSurface
                )
                TextButton(onClick = onDismiss) {
                    Text("Done")
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            if (payments.isEmpty()) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = Spacing.large),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(Spacing.small)
                ) {
                    Icon(
                        imageVector = Icons.Default.History,
                        contentDescription = null,
                        modifier = Modifier.size(48.dp),
                        tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f)
                    )
                    Text(
                        text = "No payments recorded",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            } else {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(Spacing.compact)
                ) {
                    items(payments, key = { it.id }) { payment ->
                        GlassCard {
                            Column(
                                verticalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(
                                        text = formatPaymentDate(payment.paymentDate),
                                        style = MaterialTheme.typography.titleSmall,
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                    Text(
                                        text = formatAmount(payment.amountPaid),
                                        style = MaterialTheme.typography.titleSmall,
                                        color = Primary
                                    )
                                }

                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    if (!payment.paymentMode.isNullOrBlank()) {
                                        Text(
                                            text = paymentModeLabel(payment.paymentMode),
                                            style = MaterialTheme.typography.labelSmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                    if (!payment.receiptNumber.isNullOrBlank()) {
                                        Text(
                                            text = payment.receiptNumber,
                                            style = MaterialTheme.typography.labelSmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                }

                                if (!payment.notes.isNullOrBlank()) {
                                    Text(
                                        text = payment.notes,
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        maxLines = 2
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
