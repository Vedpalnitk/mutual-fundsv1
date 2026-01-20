package com.sparrowinvest.app.ui.components

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.sparrowinvest.app.ui.theme.CardBackgroundDark
import com.sparrowinvest.app.ui.theme.LocalIsDarkTheme
import com.sparrowinvest.app.ui.theme.CardBackgroundLight
import com.sparrowinvest.app.ui.theme.LocalIsDarkTheme
import com.sparrowinvest.app.ui.theme.CornerRadius
import com.sparrowinvest.app.ui.theme.LocalIsDarkTheme
import com.sparrowinvest.app.ui.theme.GlassBorderEndDark
import com.sparrowinvest.app.ui.theme.LocalIsDarkTheme
import com.sparrowinvest.app.ui.theme.GlassBorderEndLight
import com.sparrowinvest.app.ui.theme.LocalIsDarkTheme
import com.sparrowinvest.app.ui.theme.GlassBorderMidDark
import com.sparrowinvest.app.ui.theme.LocalIsDarkTheme
import com.sparrowinvest.app.ui.theme.GlassBorderMidLight
import com.sparrowinvest.app.ui.theme.LocalIsDarkTheme
import com.sparrowinvest.app.ui.theme.GlassBorderStartDark
import com.sparrowinvest.app.ui.theme.LocalIsDarkTheme
import com.sparrowinvest.app.ui.theme.GlassBorderStartLight
import com.sparrowinvest.app.ui.theme.LocalIsDarkTheme
import com.sparrowinvest.app.ui.theme.Primary
import com.sparrowinvest.app.ui.theme.LocalIsDarkTheme
import com.sparrowinvest.app.ui.theme.Secondary
import com.sparrowinvest.app.ui.theme.LocalIsDarkTheme
import com.sparrowinvest.app.ui.theme.ShadowColor
import com.sparrowinvest.app.ui.theme.LocalIsDarkTheme
import com.sparrowinvest.app.ui.theme.Spacing
import com.sparrowinvest.app.ui.theme.LocalIsDarkTheme
import com.sparrowinvest.app.ui.theme.Success
import com.sparrowinvest.app.ui.theme.LocalIsDarkTheme

enum class QuickActionType(
    val title: String,
    val icon: ImageVector,
    val color: Color,
    val sheetTitle: String,
    val sheetSubtitle: String
) {
    INVEST(
        title = "Invest",
        icon = Icons.Default.Add,
        color = Primary,
        sheetTitle = "Invest via",
        sheetSubtitle = "Choose a platform to invest in mutual funds"
    ),
    WITHDRAW(
        title = "Withdraw",
        icon = Icons.Default.Remove,
        color = Secondary,
        sheetTitle = "Withdraw via",
        sheetSubtitle = "Choose a platform to withdraw your investments"
    ),
    SIP(
        title = "SIP",
        icon = Icons.Default.Refresh,
        color = Success,
        sheetTitle = "Start SIP via",
        sheetSubtitle = "Choose a platform to start a SIP"
    )
}

data class TradingPlatform(
    val name: String,
    val shortName: String,
    val color: Color,
    val webUrl: String
)

val tradingPlatforms = listOf(
    TradingPlatform(
        name = "Zerodha Coin",
        shortName = "Zerodha",
        color = Color(0xFF26A65B),
        webUrl = "https://coin.zerodha.com"
    ),
    TradingPlatform(
        name = "Groww",
        shortName = "Groww",
        color = Color(0xFF00C78C),
        webUrl = "https://groww.in/mutual-funds"
    ),
    TradingPlatform(
        name = "Kuvera",
        shortName = "Kuvera",
        color = Color(0xFF3366CC),
        webUrl = "https://kuvera.in"
    ),
    TradingPlatform(
        name = "Paytm Money",
        shortName = "Paytm",
        color = Color(0xFF00B0F0),
        webUrl = "https://www.paytmmoney.com/mutual-funds"
    ),
    TradingPlatform(
        name = "ET Money",
        shortName = "ET Money",
        color = Color(0xFF212121),
        webUrl = "https://www.etmoney.com"
    ),
    TradingPlatform(
        name = "MF Central",
        shortName = "MF Central",
        color = Color(0xFF007ACC),
        webUrl = "https://www.mfcentral.com"
    )
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TradingPlatformSheet(
    actionType: QuickActionType,
    onDismiss: () -> Unit
) {
    val context = LocalContext.current
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
                .padding(Spacing.medium)
        ) {
            // Header
            Column(
                modifier = Modifier.fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Box(
                    modifier = Modifier
                        .size(64.dp)
                        .clip(CircleShape)
                        .background(actionType.color.copy(alpha = 0.15f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = actionType.icon,
                        contentDescription = null,
                        tint = actionType.color,
                        modifier = Modifier.size(28.dp)
                    )
                }

                Spacer(modifier = Modifier.height(Spacing.medium))

                Text(
                    text = actionType.sheetTitle,
                    style = MaterialTheme.typography.titleLarge,
                    color = MaterialTheme.colorScheme.onSurface
                )

                Spacer(modifier = Modifier.height(Spacing.small))

                Text(
                    text = actionType.sheetSubtitle,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = TextAlign.Center
                )
            }

            Spacer(modifier = Modifier.height(Spacing.large))

            // Platform Grid
            LazyVerticalGrid(
                columns = GridCells.Fixed(2),
                horizontalArrangement = Arrangement.spacedBy(Spacing.compact),
                verticalArrangement = Arrangement.spacedBy(Spacing.compact),
                contentPadding = PaddingValues(bottom = Spacing.medium)
            ) {
                items(tradingPlatforms) { platform ->
                    PlatformCard(
                        platform = platform,
                        onClick = {
                            openPlatform(context, platform.webUrl)
                            onDismiss()
                        }
                    )
                }
            }

            // Disclaimer
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(CornerRadius.medium))
                    .background(
                        if (isDark) Color.White.copy(alpha = 0.05f)
                        else MaterialTheme.colorScheme.surfaceVariant
                    )
                    .padding(Spacing.compact),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Default.Info,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.size(14.dp)
                )
                Spacer(modifier = Modifier.width(Spacing.small))
                Text(
                    text = "You will be redirected to the selected platform to complete your transaction.",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            Spacer(modifier = Modifier.height(Spacing.xxLarge))
        }
    }
}

@Composable
private fun PlatformCard(
    platform: TradingPlatform,
    onClick: () -> Unit
) {
    val isDark = LocalIsDarkTheme.current
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

    Column(
        modifier = Modifier
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
            .clickable(onClick = onClick)
            .padding(Spacing.medium),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Platform Icon
        Box(
            modifier = Modifier
                .size(48.dp)
                .clip(RoundedCornerShape(CornerRadius.medium))
                .background(platform.color.copy(alpha = 0.15f)),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = platform.shortName.take(1),
                style = MaterialTheme.typography.titleLarge,
                color = platform.color
            )
        }

        Spacer(modifier = Modifier.height(Spacing.small))

        Text(
            text = platform.shortName,
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.onSurface
        )
    }
}

private fun openPlatform(context: Context, url: String) {
    try {
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
        context.startActivity(intent)
    } catch (e: Exception) {
        // Handle error
    }
}
