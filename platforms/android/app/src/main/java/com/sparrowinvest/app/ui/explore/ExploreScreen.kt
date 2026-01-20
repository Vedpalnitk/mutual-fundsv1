package com.sparrowinvest.app.ui.explore

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
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
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ShowChart
import androidx.compose.material.icons.automirrored.filled.TrendingUp
import androidx.compose.material.icons.filled.AccountBalance
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.Diamond
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Savings
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.SwapHoriz
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.sparrowinvest.app.data.model.Fund
import com.sparrowinvest.app.data.model.FundCategory
import com.sparrowinvest.app.ui.components.EmptyState
import com.sparrowinvest.app.ui.components.FullScreenLoading
import com.sparrowinvest.app.ui.components.GlassCard
import com.sparrowinvest.app.ui.components.GlassTextField
import com.sparrowinvest.app.ui.components.IconContainer
import com.sparrowinvest.app.ui.components.ListItemCard
import com.sparrowinvest.app.ui.components.QuickAccessCard
import com.sparrowinvest.app.ui.components.ReturnText
import com.sparrowinvest.app.ui.components.SectionHeader
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
import com.sparrowinvest.app.ui.theme.ShadowColor
import com.sparrowinvest.app.ui.theme.LocalIsDarkTheme
import com.sparrowinvest.app.ui.theme.Spacing
import com.sparrowinvest.app.ui.theme.LocalIsDarkTheme

@Composable
fun ExploreScreen(
    viewModel: ExploreViewModel = hiltViewModel(),
    onNavigateToFund: (Int) -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    val searchQuery by viewModel.searchQuery.collectAsState()
    val searchResults by viewModel.searchResults.collectAsState()
    val popularFunds by viewModel.popularFunds.collectAsState()
    val topPerformers by viewModel.topPerformers.collectAsState()
    val selectedCategory by viewModel.selectedCategory.collectAsState()
    val userPoints by viewModel.userPoints.collectAsState()
    val advisorInfo by viewModel.advisorInfo.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .statusBarsPadding()
    ) {
        // Header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = Spacing.medium, vertical = Spacing.compact),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Explore",
                style = MaterialTheme.typography.headlineMedium,
                color = MaterialTheme.colorScheme.onSurface
            )
            IconButton(onClick = { /* Navigate to watchlist */ }) {
                Icon(
                    imageVector = Icons.Default.Favorite,
                    contentDescription = "Watchlist",
                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }

        // Search Bar
        GlassTextField(
            value = searchQuery,
            onValueChange = { viewModel.onSearchQueryChange(it) },
            modifier = Modifier.padding(horizontal = Spacing.medium),
            placeholder = "Search funds...",
            prefix = {
                Icon(
                    imageVector = Icons.Default.Search,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.size(20.dp)
                )
            },
            suffix = if (searchQuery.isNotEmpty()) {
                {
                    IconButton(
                        onClick = { viewModel.clearSearch() },
                        modifier = Modifier.size(20.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Clear,
                            contentDescription = "Clear",
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            } else null,
            imeAction = ImeAction.Search
        )

        Spacer(modifier = Modifier.height(Spacing.medium))

        // Content
        when {
            uiState is ExploreUiState.Loading -> {
                FullScreenLoading()
            }
            searchQuery.isNotEmpty() || selectedCategory != null -> {
                // Search/Filter Results
                if (searchResults.isEmpty() && uiState !is ExploreUiState.Searching) {
                    EmptyState(
                        icon = Icons.Default.Search,
                        title = "No funds found",
                        message = "Try a different search term or category"
                    )
                } else {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(Spacing.medium),
                        verticalArrangement = Arrangement.spacedBy(Spacing.compact)
                    ) {
                        items(searchResults) { fund ->
                            FundItem(
                                fund = fund,
                                isInWatchlist = viewModel.isInWatchlist(fund),
                                onFundClick = { onNavigateToFund(fund.schemeCode) },
                                onToggleWatchlist = { viewModel.toggleWatchlist(fund) }
                            )
                        }
                    }
                }
            }
            else -> {
                // Main Explore Content
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(Spacing.medium),
                    verticalArrangement = Arrangement.spacedBy(Spacing.medium)
                ) {
                    // Quick Access Section
                    item {
                        QuickAccessSection(
                            userPoints = userPoints,
                            advisorInfo = advisorInfo,
                            onPointsClick = { /* Navigate to Points */ },
                            onAdvisorClick = { /* Navigate to Advisors */ }
                        )
                    }

                    // Categories Section
                    item {
                        CategoriesSection(
                            selectedCategory = selectedCategory,
                            onCategorySelect = { viewModel.selectCategory(it) }
                        )
                    }

                    // Top Performers Section
                    item {
                        SectionHeader(
                            title = "Top Performers",
                            action = {
                                Text(
                                    text = "See All",
                                    style = MaterialTheme.typography.labelMedium,
                                    color = Primary,
                                    modifier = Modifier.clickable { /* View all */ }
                                )
                            }
                        )
                    }

                    items(topPerformers) { fund ->
                        val rank = topPerformers.indexOf(fund) + 1
                        TopPerformerItem(
                            fund = fund,
                            rank = rank,
                            onFundClick = { onNavigateToFund(fund.schemeCode) }
                        )
                    }

                    // Popular Funds Section
                    if (popularFunds.isNotEmpty()) {
                        item {
                            Spacer(modifier = Modifier.height(Spacing.small))
                            SectionHeader(title = "Popular Funds")
                        }

                        items(popularFunds.take(5)) { fund ->
                            FundItem(
                                fund = fund,
                                isInWatchlist = viewModel.isInWatchlist(fund),
                                onFundClick = { onNavigateToFund(fund.schemeCode) },
                                onToggleWatchlist = { viewModel.toggleWatchlist(fund) }
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun QuickAccessSection(
    userPoints: UserPoints,
    advisorInfo: AdvisorInfo,
    onPointsClick: () -> Unit,
    onAdvisorClick: () -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(Spacing.compact)
    ) {
        QuickAccessCard(
            icon = Icons.Default.Star,
            iconColor = Color(userPoints.tier.color),
            title = "Points",
            value = "${userPoints.totalPoints} pts",
            subtitle = "${userPoints.tier.displayName} Tier",
            onClick = onPointsClick,
            modifier = Modifier.weight(1f)
        )

        QuickAccessCard(
            icon = Icons.Default.Person,
            iconColor = Primary,
            title = "Find Advisor",
            value = "${advisorInfo.nearbyCount} nearby",
            subtitle = "Browse All →",
            onClick = onAdvisorClick,
            modifier = Modifier.weight(1f)
        )
    }
}

data class CategoryItem(
    val category: FundCategory,
    val color: Long,
    val icon: ImageVector
)

@Composable
private fun CategoriesSection(
    selectedCategory: FundCategory?,
    onCategorySelect: (FundCategory?) -> Unit
) {
    val categories = listOf(
        CategoryItem(FundCategory.EQUITY, 0xFF2563EB, Icons.AutoMirrored.Filled.TrendingUp),
        CategoryItem(FundCategory.DEBT, 0xFF10B981, Icons.Default.Shield),
        CategoryItem(FundCategory.HYBRID, 0xFFF59E0B, Icons.Default.SwapHoriz),
        CategoryItem(FundCategory.ELSS, 0xFF8B5CF6, Icons.Default.Savings),
        CategoryItem(FundCategory.INDEX, 0xFF14B8A6, Icons.AutoMirrored.Filled.ShowChart),
        CategoryItem(FundCategory.GOLD, 0xFFEAB308, Icons.Default.Diamond)
    )

    Column {
        Text(
            text = "BROWSE BY CATEGORY",
            style = MaterialTheme.typography.labelSmall,
            color = Primary,
            modifier = Modifier.padding(bottom = Spacing.compact)
        )

        LazyVerticalGrid(
            columns = GridCells.Fixed(3),
            horizontalArrangement = Arrangement.spacedBy(Spacing.compact),
            verticalArrangement = Arrangement.spacedBy(Spacing.compact),
            modifier = Modifier.height(180.dp)
        ) {
            items(categories) { item ->
                CategoryCard(
                    name = item.category.displayName,
                    color = Color(item.color),
                    icon = item.icon,
                    isSelected = selectedCategory == item.category,
                    onClick = { onCategorySelect(if (selectedCategory == item.category) null else item.category) }
                )
            }
        }
    }
}

@Composable
private fun CategoryCard(
    name: String,
    color: Color,
    icon: ImageVector,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    val isDark = LocalIsDarkTheme.current
    val shape = RoundedCornerShape(CornerRadius.medium)

    val backgroundColor = if (isSelected) {
        color.copy(alpha = if (isDark) 0.25f else 0.15f)
    } else {
        color.copy(alpha = if (isDark) 0.15f else 0.08f)
    }

    Column(
        modifier = Modifier
            .clip(shape)
            .background(backgroundColor)
            .border(
                width = if (isSelected) 2.dp else 1.dp,
                color = if (isSelected) color else color.copy(alpha = 0.2f),
                shape = shape
            )
            .clickable(onClick = onClick)
            .padding(vertical = Spacing.medium),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Icon(
            imageVector = icon,
            contentDescription = name,
            tint = color,
            modifier = Modifier.size(24.dp)
        )
        Spacer(modifier = Modifier.height(6.dp))
        Text(
            text = name,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurface
        )
    }
}

@Composable
private fun TopPerformerItem(
    fund: Fund,
    rank: Int,
    onFundClick: () -> Unit
) {
    val isDark = LocalIsDarkTheme.current
    val shape = RoundedCornerShape(CornerRadius.medium)

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
                        elevation = 12.dp,
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
            .clickable(onClick = onFundClick)
            .padding(Spacing.medium),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Rank
        Text(
            text = "$rank",
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.width(24.dp)
        )

        Spacer(modifier = Modifier.width(Spacing.compact))

        // Category indicator
        Box(
            modifier = Modifier
                .size(40.dp)
                .clip(RoundedCornerShape(CornerRadius.small))
                .background(
                    Color(FundCategory.fromString(fund.assetClass).color).copy(alpha = 0.1f)
                ),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = fund.schemeName.take(2).uppercase(),
                style = MaterialTheme.typography.labelSmall,
                color = Color(FundCategory.fromString(fund.assetClass).color)
            )
        }

        Spacer(modifier = Modifier.width(Spacing.compact))

        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = fund.schemeName,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurface,
                maxLines = 1
            )
            Text(
                text = fund.category,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        Column(horizontalAlignment = Alignment.End) {
            fund.returns?.oneYear?.let { returns ->
                ReturnText(
                    value = returns,
                    style = MaterialTheme.typography.titleSmall
                )
                Text(
                    text = "1Y",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
private fun FundItem(
    fund: Fund,
    isInWatchlist: Boolean,
    onFundClick: () -> Unit,
    onToggleWatchlist: () -> Unit
) {
    ListItemCard(
        modifier = Modifier.clickable(onClick = onFundClick)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Category indicator
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(RoundedCornerShape(CornerRadius.small))
                    .background(
                        Color(FundCategory.fromString(fund.assetClass).color).copy(alpha = 0.1f)
                    ),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = fund.schemeName.take(2).uppercase(),
                    style = MaterialTheme.typography.titleSmall,
                    color = Color(FundCategory.fromString(fund.assetClass).color)
                )
            }

            Spacer(modifier = Modifier.width(Spacing.compact))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = fund.schemeName,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurface,
                    maxLines = 2
                )

                Spacer(modifier = Modifier.height(4.dp))

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(Spacing.small)
                ) {
                    Text(
                        text = fund.category,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )

                    fund.riskRating?.let { rating ->
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            repeat(rating.coerceIn(1, 5)) {
                                Icon(
                                    imageVector = Icons.Default.Star,
                                    contentDescription = null,
                                    modifier = Modifier.size(12.dp),
                                    tint = Color(0xFFF59E0B)
                                )
                            }
                        }
                    }
                }
            }

            Column(horizontalAlignment = Alignment.End) {
                fund.returns?.oneYear?.let { returns ->
                    ReturnText(
                        value = returns,
                        style = MaterialTheme.typography.titleSmall
                    )
                    Text(
                        text = "1Y Returns",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            Spacer(modifier = Modifier.width(Spacing.small))

            IconButton(
                onClick = onToggleWatchlist,
                modifier = Modifier.size(32.dp)
            ) {
                Icon(
                    imageVector = if (isInWatchlist) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
                    contentDescription = if (isInWatchlist) "Remove from watchlist" else "Add to watchlist",
                    tint = if (isInWatchlist) Color(0xFFEF4444) else MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.size(20.dp)
                )
            }
        }
    }
}
