package com.sparrowinvest.fa.ui.settings

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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.DarkMode
import androidx.compose.material.icons.automirrored.filled.Help
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.NotificationsActive
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Assessment
import androidx.compose.material.icons.filled.Calculate
import androidx.compose.material.icons.filled.Repeat
import androidx.compose.material.icons.filled.PersonSearch
import androidx.compose.material.icons.filled.Public
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.sparrowinvest.fa.MainActivity
import com.sparrowinvest.fa.core.storage.ThemeMode
import com.sparrowinvest.fa.ui.auth.AuthViewModel
import com.sparrowinvest.fa.ui.components.GlassCard
import com.sparrowinvest.fa.ui.components.ListItemCard
import com.sparrowinvest.fa.ui.theme.CornerRadius
import com.sparrowinvest.fa.ui.theme.Error
import com.sparrowinvest.fa.ui.theme.Spacing

@Composable
fun MoreScreen(
    authViewModel: AuthViewModel = hiltViewModel(),
    onNavigateToSips: () -> Unit,
    onNavigateToCommunications: () -> Unit = {},
    onNavigateToSettings: () -> Unit,
    onNavigateToNotifications: () -> Unit = {},
    onNavigateToSecurity: () -> Unit = {},
    onNavigateToHelp: () -> Unit = {},
    onNavigateToActionCenter: () -> Unit = {},
    onNavigateToReports: () -> Unit = {},
    onNavigateToCalculators: () -> Unit = {},
    onNavigateToProspects: () -> Unit = {},
    onNavigateToFundUniverse: () -> Unit = {},
    onNavigateToWhitelistedFunds: () -> Unit = {},
    onLogout: () -> Unit
) {
    val currentUser by authViewModel.currentUser.collectAsState()
    val advisorProfile by authViewModel.advisorProfile.collectAsState()
    val themeMode by MainActivity.themeModeFlow.collectAsState()
    val darkMode = themeMode == ThemeMode.DARK

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = Spacing.medium)
    ) {
        Spacer(modifier = Modifier.height(Spacing.medium))

        Text(
            text = "More",
            style = MaterialTheme.typography.headlineMedium,
            color = MaterialTheme.colorScheme.onBackground
        )

        Spacer(modifier = Modifier.height(Spacing.medium))

        // User Info Card
        GlassCard(
            cornerRadius = CornerRadius.large
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                val logoUrl = advisorProfile?.companyLogoUrl
                if (!logoUrl.isNullOrBlank()) {
                    AsyncImage(
                        model = ImageRequest.Builder(LocalContext.current)
                            .data(logoUrl)
                            .crossfade(true)
                            .build(),
                        contentDescription = "Company logo",
                        contentScale = ContentScale.Crop,
                        modifier = Modifier
                            .size(48.dp)
                            .clip(CircleShape)
                    )
                } else {
                    Icon(
                        imageVector = Icons.Default.Person,
                        contentDescription = null,
                        modifier = Modifier.size(48.dp),
                        tint = MaterialTheme.colorScheme.primary
                    )
                }
                Spacer(modifier = Modifier.padding(Spacing.compact))
                Column {
                    if (!advisorProfile?.companyName.isNullOrBlank()) {
                        Text(
                            text = advisorProfile!!.companyName!!,
                            style = MaterialTheme.typography.titleMedium,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    }
                    Text(
                        text = advisorProfile?.displayName ?: currentUser?.displayName ?: "Financial Advisor",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = currentUser?.email ?: "",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(Spacing.medium))

        // Menu Items
        GlassCard(
            cornerRadius = CornerRadius.large,
            contentPadding = Spacing.small
        ) {
            Column {
                MenuItem(
                    icon = Icons.Default.NotificationsActive,
                    title = "Action Center",
                    subtitle = "Failed SIPs, pending actions",
                    onClick = onNavigateToActionCenter
                )
                MenuItem(
                    icon = Icons.Default.Repeat,
                    title = "SIP Management",
                    subtitle = "View all SIPs",
                    onClick = onNavigateToSips
                )
                MenuItem(
                    icon = Icons.Default.Email,
                    title = "Communications",
                    subtitle = "Send & track messages",
                    onClick = onNavigateToCommunications
                )
                MenuItem(
                    icon = Icons.Default.Notifications,
                    title = "Notifications",
                    subtitle = "Manage alerts",
                    onClick = onNavigateToNotifications
                )
                MenuItem(
                    icon = Icons.Default.DarkMode,
                    title = "Dark Mode",
                    trailing = {
                        Switch(
                            checked = darkMode,
                            onCheckedChange = { enabled ->
                                val newMode = if (enabled) ThemeMode.DARK else ThemeMode.LIGHT
                                MainActivity.themeModeFlow.value = newMode
                            }
                        )
                    }
                )
            }
        }

        Spacer(modifier = Modifier.height(Spacing.medium))

        // Business Section
        GlassCard(
            cornerRadius = CornerRadius.large,
            contentPadding = Spacing.small
        ) {
            Column {
                MenuItem(
                    icon = Icons.Default.PersonSearch,
                    title = "Prospects",
                    subtitle = "Sales pipeline & leads",
                    onClick = onNavigateToProspects
                )
                MenuItem(
                    icon = Icons.Default.Public,
                    title = "Fund Universe",
                    subtitle = "Browse funds by category",
                    onClick = onNavigateToFundUniverse
                )
                MenuItem(
                    icon = Icons.Default.Star,
                    title = "My Picks",
                    subtitle = "Your whitelisted fund recommendations",
                    onClick = onNavigateToWhitelistedFunds
                )
            }
        }

        Spacer(modifier = Modifier.height(Spacing.medium))

        // Tools Section
        GlassCard(
            cornerRadius = CornerRadius.large,
            contentPadding = Spacing.small
        ) {
            Column {
                MenuItem(
                    icon = Icons.Default.Assessment,
                    title = "Reports",
                    subtitle = "Generate & view reports",
                    onClick = onNavigateToReports
                )
                MenuItem(
                    icon = Icons.Default.Calculate,
                    title = "Calculators",
                    subtitle = "SIP, lumpsum, goal planning",
                    onClick = onNavigateToCalculators
                )
            }
        }

        Spacer(modifier = Modifier.height(Spacing.medium))

        GlassCard(
            cornerRadius = CornerRadius.large,
            contentPadding = Spacing.small
        ) {
            Column {
                MenuItem(
                    icon = Icons.Default.Security,
                    title = "Security",
                    subtitle = "Password & PIN",
                    onClick = onNavigateToSecurity
                )
                MenuItem(
                    icon = Icons.AutoMirrored.Filled.Help,
                    title = "Help & Support",
                    onClick = onNavigateToHelp
                )
                MenuItem(
                    icon = Icons.Default.Settings,
                    title = "Settings",
                    onClick = onNavigateToSettings
                )
            }
        }

        Spacer(modifier = Modifier.height(Spacing.medium))

        // Logout
        ListItemCard(
            modifier = Modifier.clickable(onClick = onLogout)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.Logout,
                    contentDescription = null,
                    modifier = Modifier.size(24.dp),
                    tint = Error
                )
                Spacer(modifier = Modifier.padding(Spacing.compact))
                Text(
                    text = "Logout",
                    style = MaterialTheme.typography.titleSmall,
                    color = Error
                )
            }
        }

        Spacer(modifier = Modifier.height(Spacing.xLarge))

        // Version
        Text(
            text = "Sparrow FA v1.0.0",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.align(Alignment.CenterHorizontally)
        )
    }
}

@Composable
private fun MenuItem(
    icon: ImageVector,
    title: String,
    subtitle: String? = null,
    onClick: (() -> Unit)? = null,
    trailing: @Composable (() -> Unit)? = null
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .then(if (onClick != null) Modifier.clickable(onClick = onClick) else Modifier)
            .padding(Spacing.compact),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(
            modifier = Modifier.weight(1f),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                modifier = Modifier.size(24.dp),
                tint = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.padding(Spacing.compact))
            Column {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleSmall,
                    color = MaterialTheme.colorScheme.onSurface
                )
                subtitle?.let {
                    Text(
                        text = it,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
        if (trailing != null) {
            trailing()
        } else if (onClick != null) {
            Icon(
                imageVector = Icons.Default.ChevronRight,
                contentDescription = null,
                modifier = Modifier.size(20.dp),
                tint = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}
