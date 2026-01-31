package com.sparrowinvest.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.sparrowinvest.app.data.model.AdvisorInfo
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
import com.sparrowinvest.app.ui.theme.Success

/**
 * Bottom sheet for managed clients when clicking quick action buttons.
 * Shows advisor info and directs user to browse funds for trade request.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ManagedQuickActionSheet(
    actionType: QuickActionType,
    advisor: AdvisorInfo?,
    onBrowseFunds: () -> Unit,
    onDismiss: () -> Unit
) {
    val sheetState = rememberModalBottomSheetState()
    val isDark = LocalIsDarkTheme.current

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = if (isDark) Color(0xFF1E293B) else Color.White
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(Spacing.medium),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Header Icon
            Box(
                modifier = Modifier
                    .size(72.dp)
                    .clip(CircleShape)
                    .background(actionType.color.copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = actionType.icon,
                    contentDescription = null,
                    tint = actionType.color,
                    modifier = Modifier.size(32.dp)
                )
            }

            Spacer(modifier = Modifier.height(Spacing.medium))

            // Title
            Text(
                text = actionType.title,
                style = MaterialTheme.typography.headlineSmall,
                color = MaterialTheme.colorScheme.onSurface
            )

            Spacer(modifier = Modifier.height(Spacing.small))

            // Subtitle
            Text(
                text = "Your advisor will process your request",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(Spacing.large))

            // Advisor Card
            advisor?.let { adv ->
                AdvisorInfoCard(advisor = adv, isDark = isDark)
                Spacer(modifier = Modifier.height(Spacing.medium))
            }

            // Info Message
            InfoMessageCard(actionType = actionType, isDark = isDark)

            Spacer(modifier = Modifier.height(Spacing.large))

            // Browse Funds Button
            Button(
                onClick = onBrowseFunds,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Primary
                )
            ) {
                Icon(
                    imageVector = Icons.Default.Search,
                    contentDescription = null,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(Spacing.small))
                Text(
                    text = "Browse Funds",
                    style = MaterialTheme.typography.titleMedium,
                    color = Color.White
                )
            }

            Spacer(modifier = Modifier.height(Spacing.compact))

            // Cancel Button
            TextButton(
                onClick = onDismiss,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = "Cancel",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            Spacer(modifier = Modifier.height(Spacing.medium))
        }
    }
}

@Composable
private fun AdvisorInfoCard(
    advisor: AdvisorInfo,
    isDark: Boolean
) {
    val shape = RoundedCornerShape(CornerRadius.large)
    val backgroundColor = if (isDark) CardBackgroundDark else CardBackgroundLight
    val borderBrush = if (isDark) {
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

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .then(
                if (!isDark) {
                    Modifier.shadow(
                        elevation = 8.dp,
                        shape = shape,
                        spotColor = ShadowColor,
                        ambientColor = ShadowColor
                    )
                } else Modifier
            )
            .clip(shape)
            .background(backgroundColor)
            .border(
                width = 1.dp,
                brush = borderBrush,
                shape = shape
            )
            .padding(Spacing.medium),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Avatar
        Box(
            modifier = Modifier
                .size(48.dp)
                .clip(CircleShape)
                .background(Primary.copy(alpha = 0.15f)),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = advisor.name.take(1).uppercase(),
                style = MaterialTheme.typography.titleMedium,
                color = Primary
            )
        }

        Spacer(modifier = Modifier.width(Spacing.compact))

        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = "Your Advisor",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                text = advisor.name,
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurface
            )
        }

        Icon(
            imageVector = Icons.Default.CheckCircle,
            contentDescription = "Verified",
            tint = Success,
            modifier = Modifier.size(24.dp)
        )
    }
}

@Composable
private fun InfoMessageCard(
    actionType: QuickActionType,
    isDark: Boolean
) {
    val message = if (actionType == QuickActionType.SIP) {
        "Select a fund to submit your SIP request to your advisor for execution."
    } else {
        "Select a fund to submit your investment request to your advisor for execution."
    }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(CornerRadius.medium))
            .background(Primary.copy(alpha = if (isDark) 0.15f else 0.08f))
            .padding(Spacing.medium),
        verticalAlignment = Alignment.Top,
        horizontalArrangement = Arrangement.Start
    ) {
        Icon(
            imageVector = Icons.Default.Info,
            contentDescription = null,
            tint = Primary,
            modifier = Modifier.size(20.dp)
        )

        Spacer(modifier = Modifier.width(Spacing.small))

        Text(
            text = message,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}
