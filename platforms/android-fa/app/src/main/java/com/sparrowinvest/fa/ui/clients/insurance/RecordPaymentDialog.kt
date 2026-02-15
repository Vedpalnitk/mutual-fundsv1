package com.sparrowinvest.fa.ui.clients.insurance

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.sparrowinvest.fa.data.model.InsurancePolicy
import com.sparrowinvest.fa.data.model.RecordPremiumPaymentRequest
import com.sparrowinvest.fa.ui.theme.Primary

private val PAYMENT_MODES = listOf(
    "BANK_TRANSFER" to "Bank Transfer",
    "CHEQUE" to "Cheque",
    "UPI" to "UPI",
    "AUTO_DEBIT" to "Auto Debit",
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RecordPaymentDialog(
    policy: InsurancePolicy,
    isSaving: Boolean,
    onDismiss: () -> Unit,
    onSave: (RecordPremiumPaymentRequest) -> Unit
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    var amount by remember { mutableStateOf("%.0f".format(policy.premiumAmount)) }
    var paymentDate by remember { mutableStateOf("") }
    var paymentMode by remember { mutableStateOf("BANK_TRANSFER") }
    var receiptNumber by remember { mutableStateOf("") }
    var notes by remember { mutableStateOf("") }

    val isValid = (amount.toDoubleOrNull() ?: 0.0) > 0 && paymentDate.isNotBlank()

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState
    ) {
        Column(
            modifier = Modifier
                .padding(horizontal = 24.dp)
                .padding(bottom = 32.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = "Record Payment",
                style = MaterialTheme.typography.titleLarge,
                color = MaterialTheme.colorScheme.onSurface
            )

            Text(
                text = "${policy.provider} · ${policy.typeLabel} · ${policy.policyNumber}",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            OutlinedTextField(
                value = amount,
                onValueChange = { amount = it },
                label = { Text("Amount (₹)") },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )

            OutlinedTextField(
                value = paymentDate,
                onValueChange = { paymentDate = it },
                label = { Text("Payment Date (YYYY-MM-DD)") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                placeholder = { Text("e.g. 2026-03-15") }
            )

            Text(
                text = "Payment Mode",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurface
            )

            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                items(PAYMENT_MODES) { (value, label) ->
                    FilterChip(
                        selected = paymentMode == value,
                        onClick = { paymentMode = value },
                        label = { Text(label, style = MaterialTheme.typography.labelSmall) }
                    )
                }
            }

            OutlinedTextField(
                value = receiptNumber,
                onValueChange = { receiptNumber = it },
                label = { Text("Receipt Number (optional)") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )

            OutlinedTextField(
                value = notes,
                onValueChange = { notes = it },
                label = { Text("Notes (optional)") },
                modifier = Modifier.fillMaxWidth(),
                minLines = 2,
                maxLines = 3
            )

            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End
            ) {
                TextButton(onClick = onDismiss) {
                    Text("Cancel")
                }

                TextButton(
                    onClick = {
                        onSave(
                            RecordPremiumPaymentRequest(
                                amountPaid = amount.toDoubleOrNull() ?: policy.premiumAmount,
                                paymentDate = paymentDate.trim(),
                                paymentMode = paymentMode,
                                receiptNumber = receiptNumber.trim().ifBlank { null },
                                notes = notes.trim().ifBlank { null }
                            )
                        )
                    },
                    enabled = isValid && !isSaving
                ) {
                    Text(
                        text = if (isSaving) "Saving..." else "Save",
                        color = if (isValid && !isSaving) Primary else MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}
