package com.sparrowinvest.fa.ui.settings

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.NotificationsActive
import androidx.compose.material.icons.filled.NotificationsOff
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import com.sparrowinvest.fa.ui.components.GlassCard
import com.sparrowinvest.fa.ui.components.TopBar
import com.sparrowinvest.fa.ui.theme.CornerRadius
import com.sparrowinvest.fa.ui.theme.Spacing
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Icon
import androidx.compose.ui.Alignment
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp

@Composable
fun NotificationsScreen(
    onBackClick: () -> Unit
) {
    var tradeAlerts by remember { mutableStateOf(true) }
    var sipReminders by remember { mutableStateOf(true) }
    var clientRequests by remember { mutableStateOf(true) }
    var marketUpdates by remember { mutableStateOf(false) }
    var emailDigest by remember { mutableStateOf(true) }

    Column(modifier = Modifier.fillMaxSize()) {
        TopBar(title = "Notifications", onBackClick = onBackClick)

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = Spacing.medium)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(Spacing.medium)
        ) {
            Spacer(modifier = Modifier.height(Spacing.compact))

            Text(
                text = "PUSH NOTIFICATIONS",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.primary,
                modifier = Modifier.padding(start = Spacing.compact)
            )
            GlassCard(cornerRadius = CornerRadius.large, contentPadding = Spacing.small) {
                Column {
                    NotificationToggle(
                        icon = Icons.Default.NotificationsActive,
                        title = "Trade Alerts",
                        subtitle = "Get notified when trades are executed",
                        checked = tradeAlerts,
                        onCheckedChange = { tradeAlerts = it }
                    )
                    NotificationToggle(
                        icon = Icons.Default.Notifications,
                        title = "SIP Reminders",
                        subtitle = "Upcoming SIP installment reminders",
                        checked = sipReminders,
                        onCheckedChange = { sipReminders = it }
                    )
                    NotificationToggle(
                        icon = Icons.Default.Notifications,
                        title = "Client Requests",
                        subtitle = "New trade requests from clients",
                        checked = clientRequests,
                        onCheckedChange = { clientRequests = it }
                    )
                    NotificationToggle(
                        icon = Icons.Default.NotificationsOff,
                        title = "Market Updates",
                        subtitle = "Daily market summary and NAV updates",
                        checked = marketUpdates,
                        onCheckedChange = { marketUpdates = it }
                    )
                }
            }

            Text(
                text = "EMAIL",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.primary,
                modifier = Modifier.padding(start = Spacing.compact)
            )
            GlassCard(cornerRadius = CornerRadius.large, contentPadding = Spacing.small) {
                Column {
                    NotificationToggle(
                        icon = Icons.Default.Notifications,
                        title = "Daily Digest",
                        subtitle = "Summary of portfolio changes and pending actions",
                        checked = emailDigest,
                        onCheckedChange = { emailDigest = it }
                    )
                }
            }

            Spacer(modifier = Modifier.height(Spacing.large))
        }
    }
}

@Composable
private fun NotificationToggle(
    icon: ImageVector,
    title: String,
    subtitle: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onCheckedChange(!checked) }
            .padding(horizontal = Spacing.medium, vertical = Spacing.small),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(Spacing.medium)
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.primary,
            modifier = Modifier.size(22.dp)
        )
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurface
            )
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
        Switch(checked = checked, onCheckedChange = onCheckedChange)
    }
}
