package com.sparrowinvest.app.ui.profile

import androidx.compose.animation.animateColorAsState
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
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.AccountBalance
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Help
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Link
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material.icons.filled.WorkspacePremium
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.sparrowinvest.app.data.model.FamilyMember
import com.sparrowinvest.app.data.model.User
import com.sparrowinvest.app.ui.components.Avatar
import com.sparrowinvest.app.ui.components.formatCompactCurrency
import com.sparrowinvest.app.ui.theme.CardBackgroundDark
import com.sparrowinvest.app.ui.theme.LocalIsDarkTheme
import com.sparrowinvest.app.ui.theme.CardBackgroundLight
import com.sparrowinvest.app.ui.theme.LocalIsDarkTheme
import com.sparrowinvest.app.ui.theme.CornerRadius
import com.sparrowinvest.app.ui.theme.LocalIsDarkTheme
import com.sparrowinvest.app.ui.theme.Error
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
import com.sparrowinvest.app.ui.theme.ShadowColor
import com.sparrowinvest.app.ui.theme.LocalIsDarkTheme
import com.sparrowinvest.app.ui.theme.Spacing
import com.sparrowinvest.app.ui.theme.LocalIsDarkTheme
import com.sparrowinvest.app.ui.theme.Success
import com.sparrowinvest.app.ui.theme.LocalIsDarkTheme
import com.sparrowinvest.app.ui.theme.Warning
import com.sparrowinvest.app.ui.theme.LocalIsDarkTheme

@Composable
fun ProfileScreen(
    viewModel: ProfileViewModel = hiltViewModel(),
    onLogout: () -> Unit,
    onNavigateToSettings: () -> Unit,
    onNavigateToGoals: () -> Unit
) {
    val currentUser by viewModel.currentUser.collectAsState()
    val userPoints by viewModel.userPoints.collectAsState()
    val familyMembers by viewModel.familyMembers.collectAsState()
    val connectedAccounts by viewModel.connectedAccounts.collectAsState()
    val linkedBanks by viewModel.linkedBanks.collectAsState()
    val documents by viewModel.documents.collectAsState()
    val assignedAdvisor by viewModel.assignedAdvisor.collectAsState()
    val isPremium by viewModel.isPremium.collectAsState()
    val profileCompletion by viewModel.profileCompletion.collectAsState()

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .statusBarsPadding(),
        contentPadding = PaddingValues(bottom = Spacing.xxLarge)
    ) {
        // Header
        item {
            Text(
                text = "Profile",
                style = MaterialTheme.typography.headlineMedium,
                color = MaterialTheme.colorScheme.onSurface,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(Spacing.medium)
            )
        }

        // User Info Card
        item {
            currentUser?.let { user ->
                UserInfoCard(
                    user = user,
                    profileCompletion = profileCompletion,
                    onEditClick = { }
                )
                Spacer(modifier = Modifier.height(Spacing.medium))
            }
        }

        // Points Card
        item {
            PointsCard(
                points = userPoints,
                onViewRewards = { }
            )
            Spacer(modifier = Modifier.height(Spacing.medium))
        }

        // Premium Upgrade Card (if not premium)
        if (!isPremium) {
            item {
                PremiumUpgradeCard(
                    onUpgrade = { viewModel.upgradeToPremium() }
                )
                Spacer(modifier = Modifier.height(Spacing.medium))
            }
        }

        // Advisor Card
        item {
            assignedAdvisor?.let { advisor ->
                AdvisorCard(
                    advisor = advisor,
                    onChat = { },
                    onCall = { }
                )
            } ?: run {
                FindAdvisorCard(
                    onFindAdvisor = { }
                )
            }
            Spacer(modifier = Modifier.height(Spacing.medium))
        }

        // Family Members Section
        item {
            SectionHeader(
                title = "Family Members",
                actionText = "Add",
                onAction = { viewModel.addFamilyMember() }
            )
            FamilyMembersCard(
                members = familyMembers,
                onMemberClick = { }
            )
            Spacer(modifier = Modifier.height(Spacing.medium))
        }

        // Connected Accounts Section
        item {
            SectionHeader(title = "Connected Accounts")
            ConnectedAccountsCard(
                accounts = connectedAccounts,
                onConnect = { viewModel.connectAccount(it) },
                onDisconnect = { viewModel.disconnectAccount(it) }
            )
            Spacer(modifier = Modifier.height(Spacing.medium))
        }

        // Linked Banks Section
        item {
            SectionHeader(
                title = "Bank Accounts",
                actionText = "Add",
                onAction = { }
            )
            LinkedBanksCard(
                banks = linkedBanks,
                onBankClick = { }
            )
            Spacer(modifier = Modifier.height(Spacing.medium))
        }

        // Documents Section
        item {
            SectionHeader(title = "Documents")
            DocumentsCard(
                documents = documents,
                onDocumentClick = { }
            )
            Spacer(modifier = Modifier.height(Spacing.medium))
        }

        // Settings Section
        item {
            SectionHeader(title = "Settings")
            SettingsCard(
                currentUser = currentUser,
                onNavigateToGoals = onNavigateToGoals,
                onNavigateToSettings = onNavigateToSettings
            )
            Spacer(modifier = Modifier.height(Spacing.medium))
        }

        // Support Section
        item {
            SectionHeader(title = "Support")
            SupportCard()
            Spacer(modifier = Modifier.height(Spacing.medium))
        }

        // Logout
        item {
            LogoutButton(onLogout = onLogout)
        }
    }
}

@Composable
private fun UserInfoCard(
    user: User,
    profileCompletion: Int,
    onEditClick: () -> Unit
) {
    val isDark = LocalIsDarkTheme.current
    val shape = RoundedCornerShape(CornerRadius.xLarge)

    val backgroundColor = if (isDark) CardBackgroundDark else CardBackgroundLight
    val borderBrush = if (isDark) {
        Brush.linearGradient(colors = listOf(GlassBorderStartDark, GlassBorderMidDark, GlassBorderEndDark))
    } else {
        Brush.linearGradient(colors = listOf(GlassBorderStartLight, GlassBorderMidLight, GlassBorderEndLight))
    }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = Spacing.medium)
            .then(
                if (!isDark) {
                    Modifier.shadow(elevation = 12.dp, shape = shape, spotColor = ShadowColor, ambientColor = ShadowColor)
                } else Modifier
            )
            .clip(shape)
            .background(backgroundColor)
            .border(width = 1.dp, brush = borderBrush, shape = shape)
            .padding(Spacing.medium)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Avatar(
                initials = user.initials,
                size = 72,
                backgroundColor = Primary
            )

            Spacer(modifier = Modifier.width(Spacing.medium))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = user.fullName,
                    style = MaterialTheme.typography.titleLarge,
                    color = MaterialTheme.colorScheme.onSurface,
                    fontWeight = FontWeight.SemiBold
                )
                Text(
                    text = user.email,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = user.phone,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            IconButton(onClick = onEditClick) {
                Icon(
                    imageVector = Icons.Default.Edit,
                    contentDescription = "Edit",
                    tint = Primary
                )
            }
        }

        Spacer(modifier = Modifier.height(Spacing.medium))

        // Profile Completion
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Profile Completion",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                text = "$profileCompletion%",
                style = MaterialTheme.typography.labelMedium,
                color = Primary,
                fontWeight = FontWeight.SemiBold
            )
        }

        Spacer(modifier = Modifier.height(Spacing.small))

        LinearProgressIndicator(
            progress = { profileCompletion / 100f },
            modifier = Modifier
                .fillMaxWidth()
                .height(6.dp)
                .clip(CircleShape),
            color = Primary,
            trackColor = Primary.copy(alpha = 0.2f),
            strokeCap = StrokeCap.Round
        )
    }
}

@Composable
private fun PointsCard(
    points: UserPoints,
    onViewRewards: () -> Unit
) {
    val isDark = LocalIsDarkTheme.current
    val shape = RoundedCornerShape(CornerRadius.xLarge)

    val backgroundColor = if (isDark) CardBackgroundDark else CardBackgroundLight
    val tierColor = Color(points.tier.color)

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = Spacing.medium)
            .clip(shape)
            .background(backgroundColor)
            .clickable(onClick = onViewRewards)
            .padding(Spacing.medium)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(RoundedCornerShape(CornerRadius.small))
                        .background(tierColor.copy(alpha = 0.15f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Star,
                        contentDescription = null,
                        tint = tierColor,
                        modifier = Modifier.size(20.dp)
                    )
                }
                Spacer(modifier = Modifier.width(Spacing.compact))
                Column {
                    Text(
                        text = "${points.tier.displayName} Member",
                        style = MaterialTheme.typography.titleSmall,
                        color = tierColor,
                        fontWeight = FontWeight.SemiBold
                    )
                    Text(
                        text = "${points.pointsToNextTier} pts to next tier",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            Column(horizontalAlignment = Alignment.End) {
                Text(
                    text = "${points.totalPoints}",
                    style = MaterialTheme.typography.headlineSmall,
                    color = tierColor,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "points",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
private fun PremiumUpgradeCard(
    onUpgrade: () -> Unit
) {
    val isDark = LocalIsDarkTheme.current
    val shape = RoundedCornerShape(CornerRadius.xLarge)

    val gradientBrush = Brush.linearGradient(
        colors = listOf(
            Color(0xFF8B5CF6),
            Primary
        )
    )

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = Spacing.medium)
            .clip(shape)
            .background(gradientBrush)
            .clickable(onClick = onUpgrade)
            .padding(Spacing.medium),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = Icons.Default.WorkspacePremium,
            contentDescription = null,
            tint = Color.White,
            modifier = Modifier.size(40.dp)
        )

        Spacer(modifier = Modifier.width(Spacing.compact))

        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = "Upgrade to Premium",
                style = MaterialTheme.typography.titleMedium,
                color = Color.White,
                fontWeight = FontWeight.SemiBold
            )
            Text(
                text = "Get unlimited AI insights & priority advisor access",
                style = MaterialTheme.typography.bodySmall,
                color = Color.White.copy(alpha = 0.8f)
            )
        }

        Icon(
            imageVector = Icons.AutoMirrored.Filled.KeyboardArrowRight,
            contentDescription = null,
            tint = Color.White
        )
    }
}

@Composable
private fun AdvisorCard(
    advisor: Advisor,
    onChat: () -> Unit,
    onCall: () -> Unit
) {
    val isDark = LocalIsDarkTheme.current
    val shape = RoundedCornerShape(CornerRadius.xLarge)

    val backgroundColor = if (isDark) CardBackgroundDark else CardBackgroundLight

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = Spacing.medium)
            .clip(shape)
            .background(backgroundColor)
            .padding(Spacing.medium)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Your Advisor",
                style = MaterialTheme.typography.titleSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Box(
                modifier = Modifier
                    .clip(CircleShape)
                    .background(Success.copy(alpha = 0.1f))
                    .padding(horizontal = 8.dp, vertical = 2.dp)
            ) {
                Text(
                    text = "Assigned",
                    style = MaterialTheme.typography.labelSmall,
                    color = Success
                )
            }
        }

        Spacer(modifier = Modifier.height(Spacing.compact))

        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Avatar(
                initials = advisor.name.split(" ").take(2).mapNotNull { it.firstOrNull()?.uppercase() }.joinToString(""),
                size = 56,
                backgroundColor = Primary
            )

            Spacer(modifier = Modifier.width(Spacing.compact))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = advisor.name,
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onSurface,
                    fontWeight = FontWeight.SemiBold
                )
                Text(
                    text = advisor.firm,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.Star,
                        contentDescription = null,
                        tint = Color(0xFFF59E0B),
                        modifier = Modifier.size(14.dp)
                    )
                    Spacer(modifier = Modifier.width(2.dp))
                    Text(
                        text = "${advisor.rating} • ${advisor.specialization}",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}

@Composable
private fun FindAdvisorCard(
    onFindAdvisor: () -> Unit
) {
    val isDark = LocalIsDarkTheme.current
    val shape = RoundedCornerShape(CornerRadius.xLarge)

    val backgroundColor = if (isDark) CardBackgroundDark else CardBackgroundLight

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = Spacing.medium)
            .clip(shape)
            .background(backgroundColor)
            .clickable(onClick = onFindAdvisor)
            .padding(Spacing.medium),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(48.dp)
                .clip(RoundedCornerShape(CornerRadius.medium))
                .background(Primary.copy(alpha = 0.1f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.Person,
                contentDescription = null,
                tint = Primary,
                modifier = Modifier.size(24.dp)
            )
        }

        Spacer(modifier = Modifier.width(Spacing.compact))

        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = "Find an Advisor",
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurface,
                fontWeight = FontWeight.SemiBold
            )
            Text(
                text = "Get personalized investment guidance",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        Icon(
            imageVector = Icons.AutoMirrored.Filled.KeyboardArrowRight,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
private fun SectionHeader(
    title: String,
    actionText: String? = null,
    onAction: (() -> Unit)? = null
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = Spacing.medium, vertical = Spacing.small),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.titleSmall,
            color = MaterialTheme.colorScheme.onSurface,
            fontWeight = FontWeight.SemiBold
        )
        actionText?.let { text ->
            Text(
                text = text,
                style = MaterialTheme.typography.labelMedium,
                color = Primary,
                modifier = Modifier.clickable { onAction?.invoke() }
            )
        }
    }
}

@Composable
private fun FamilyMembersCard(
    members: List<FamilyMember>,
    onMemberClick: (FamilyMember) -> Unit
) {
    val isDark = LocalIsDarkTheme.current
    val shape = RoundedCornerShape(CornerRadius.large)
    val backgroundColor = if (isDark) CardBackgroundDark else CardBackgroundLight

    if (members.isEmpty()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = Spacing.medium)
                .clip(shape)
                .background(backgroundColor)
                .padding(Spacing.medium),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Default.People,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.size(40.dp)
            )
            Spacer(modifier = Modifier.width(Spacing.compact))
            Text(
                text = "No family members added yet",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    } else {
        LazyRow(
            contentPadding = PaddingValues(horizontal = Spacing.medium),
            horizontalArrangement = Arrangement.spacedBy(Spacing.compact)
        ) {
            items(members) { member ->
                FamilyMemberChip(
                    member = member,
                    onClick = { onMemberClick(member) }
                )
            }
        }
    }
}

@Composable
private fun FamilyMemberChip(
    member: FamilyMember,
    onClick: () -> Unit
) {
    val isDark = LocalIsDarkTheme.current
    val shape = RoundedCornerShape(CornerRadius.large)
    val backgroundColor = if (isDark) CardBackgroundDark else CardBackgroundLight
    val relationColor = Color(member.relationship.color)

    Column(
        modifier = Modifier
            .width(120.dp)
            .clip(shape)
            .background(backgroundColor)
            .clickable(onClick = onClick)
            .padding(Spacing.compact),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Avatar(
            initials = member.initials,
            size = 48,
            backgroundColor = relationColor
        )
        Spacer(modifier = Modifier.height(Spacing.small))
        Text(
            text = member.name.split(" ").first(),
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.onSurface,
            fontWeight = FontWeight.Medium
        )
        Text(
            text = member.relationship.displayName,
            style = MaterialTheme.typography.labelSmall,
            color = relationColor
        )
    }
}

@Composable
private fun ConnectedAccountsCard(
    accounts: List<ConnectedAccount>,
    onConnect: (TradingPlatform) -> Unit,
    onDisconnect: (String) -> Unit
) {
    val isDark = LocalIsDarkTheme.current
    val shape = RoundedCornerShape(CornerRadius.large)
    val backgroundColor = if (isDark) CardBackgroundDark else CardBackgroundLight

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = Spacing.medium)
            .clip(shape)
            .background(backgroundColor)
    ) {
        accounts.forEach { account ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable {
                        if (account.isConnected) onDisconnect(account.id)
                        else onConnect(account.platform)
                    }
                    .padding(Spacing.compact),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(RoundedCornerShape(CornerRadius.small))
                        .background(Color(account.platform.color).copy(alpha = 0.1f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Link,
                        contentDescription = null,
                        tint = Color(account.platform.color),
                        modifier = Modifier.size(20.dp)
                    )
                }

                Spacer(modifier = Modifier.width(Spacing.compact))

                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = account.platform.displayName,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    if (account.isConnected && account.lastSynced != null) {
                        Text(
                            text = "Last synced: ${account.lastSynced}",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                if (account.isConnected) {
                    Box(
                        modifier = Modifier
                            .clip(CircleShape)
                            .background(Success.copy(alpha = 0.1f))
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.Check,
                                contentDescription = null,
                                tint = Success,
                                modifier = Modifier.size(12.dp)
                            )
                            Spacer(modifier = Modifier.width(2.dp))
                            Text(
                                text = "Connected",
                                style = MaterialTheme.typography.labelSmall,
                                color = Success
                            )
                        }
                    }
                } else {
                    Text(
                        text = "Connect",
                        style = MaterialTheme.typography.labelMedium,
                        color = Primary
                    )
                }
            }
        }
    }
}

@Composable
private fun LinkedBanksCard(
    banks: List<LinkedBank>,
    onBankClick: (LinkedBank) -> Unit
) {
    val isDark = LocalIsDarkTheme.current
    val shape = RoundedCornerShape(CornerRadius.large)
    val backgroundColor = if (isDark) CardBackgroundDark else CardBackgroundLight

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = Spacing.medium)
            .clip(shape)
            .background(backgroundColor)
    ) {
        banks.forEach { bank ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onBankClick(bank) }
                    .padding(Spacing.compact),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(RoundedCornerShape(CornerRadius.small))
                        .background(Primary.copy(alpha = 0.1f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.AccountBalance,
                        contentDescription = null,
                        tint = Primary,
                        modifier = Modifier.size(20.dp)
                    )
                }

                Spacer(modifier = Modifier.width(Spacing.compact))

                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = bank.bankName,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = "****${bank.accountNumber}",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                if (bank.isPrimary) {
                    Box(
                        modifier = Modifier
                            .clip(CircleShape)
                            .background(Primary.copy(alpha = 0.1f))
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Text(
                            text = "Primary",
                            style = MaterialTheme.typography.labelSmall,
                            color = Primary
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun DocumentsCard(
    documents: List<Document>,
    onDocumentClick: (Document) -> Unit
) {
    val isDark = LocalIsDarkTheme.current
    val shape = RoundedCornerShape(CornerRadius.large)
    val backgroundColor = if (isDark) CardBackgroundDark else CardBackgroundLight

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = Spacing.medium)
            .clip(shape)
            .background(backgroundColor)
    ) {
        documents.forEach { document ->
            val (statusColor, statusText) = when (document.status) {
                DocumentStatus.VERIFIED -> Success to "Verified"
                DocumentStatus.PENDING -> Warning to "Pending"
                DocumentStatus.REJECTED -> Error to "Rejected"
                DocumentStatus.NOT_UPLOADED -> MaterialTheme.colorScheme.onSurfaceVariant to "Upload"
            }

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onDocumentClick(document) }
                    .padding(Spacing.compact),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(RoundedCornerShape(CornerRadius.small))
                        .background(statusColor.copy(alpha = 0.1f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = if (document.status == DocumentStatus.VERIFIED) Icons.Default.CheckCircle else Icons.Default.Description,
                        contentDescription = null,
                        tint = statusColor,
                        modifier = Modifier.size(20.dp)
                    )
                }

                Spacer(modifier = Modifier.width(Spacing.compact))

                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = document.type.displayName,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    document.uploadedAt?.let {
                        Text(
                            text = "Uploaded: $it",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                Text(
                    text = statusText,
                    style = MaterialTheme.typography.labelMedium,
                    color = statusColor
                )
            }
        }
    }
}

@Composable
private fun SettingsCard(
    currentUser: User?,
    onNavigateToGoals: () -> Unit,
    onNavigateToSettings: () -> Unit
) {
    val isDark = LocalIsDarkTheme.current
    val shape = RoundedCornerShape(CornerRadius.large)
    val backgroundColor = if (isDark) CardBackgroundDark else CardBackgroundLight

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = Spacing.medium)
            .clip(shape)
            .background(backgroundColor)
    ) {
        ProfileMenuItem(
            icon = Icons.Default.Person,
            title = "Personal Information",
            onClick = { }
        )
        ProfileMenuItem(
            icon = Icons.Default.Security,
            title = "KYC Status",
            badge = currentUser?.kycStatus?.name?.replace("_", " ")?.lowercase()?.replaceFirstChar { it.uppercase() },
            badgeColor = when (currentUser?.kycStatus?.name) {
                "VERIFIED" -> Success
                "IN_PROGRESS" -> Warning
                else -> Error
            },
            onClick = { }
        )
        ProfileMenuItem(
            icon = Icons.Default.Star,
            title = "Goals",
            onClick = onNavigateToGoals
        )
        ProfileMenuItem(
            icon = Icons.Default.Notifications,
            title = "Notifications",
            onClick = { }
        )
        ProfileMenuItem(
            icon = Icons.Default.Settings,
            title = "App Settings",
            onClick = onNavigateToSettings
        )
    }
}

@Composable
private fun SupportCard() {
    val isDark = LocalIsDarkTheme.current
    val shape = RoundedCornerShape(CornerRadius.large)
    val backgroundColor = if (isDark) CardBackgroundDark else CardBackgroundLight

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = Spacing.medium)
            .clip(shape)
            .background(backgroundColor)
    ) {
        ProfileMenuItem(
            icon = Icons.Default.Help,
            title = "Help & FAQ",
            onClick = { }
        )
        ProfileMenuItem(
            icon = Icons.Default.Info,
            title = "About",
            subtitle = "Version 1.0.0",
            onClick = { }
        )
    }
}

@Composable
private fun ProfileMenuItem(
    icon: ImageVector,
    title: String,
    subtitle: String? = null,
    badge: String? = null,
    badgeColor: Color = Primary,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(Spacing.compact),
        verticalAlignment = Alignment.CenterVertically
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

        Spacer(modifier = Modifier.width(Spacing.compact))

        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurface
            )
            subtitle?.let {
                Text(
                    text = it,
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }

        badge?.let {
            Box(
                modifier = Modifier
                    .clip(CircleShape)
                    .background(badgeColor.copy(alpha = 0.1f))
                    .padding(horizontal = 8.dp, vertical = 4.dp)
            ) {
                Text(
                    text = it,
                    style = MaterialTheme.typography.labelSmall,
                    color = badgeColor
                )
            }
        } ?: Icon(
            imageVector = Icons.AutoMirrored.Filled.KeyboardArrowRight,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
private fun LogoutButton(onLogout: () -> Unit) {
    val isDark = LocalIsDarkTheme.current
    val shape = RoundedCornerShape(CornerRadius.large)
    val backgroundColor = if (isDark) CardBackgroundDark else CardBackgroundLight

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = Spacing.medium)
            .clip(shape)
            .background(backgroundColor)
            .clickable(onClick = onLogout)
            .padding(Spacing.compact),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(40.dp)
                .clip(RoundedCornerShape(CornerRadius.small))
                .background(Error.copy(alpha = 0.1f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.AutoMirrored.Filled.Logout,
                contentDescription = null,
                tint = Error,
                modifier = Modifier.size(20.dp)
            )
        }

        Spacer(modifier = Modifier.width(Spacing.compact))

        Text(
            text = "Log Out",
            style = MaterialTheme.typography.bodyMedium,
            color = Error
        )
    }
}
