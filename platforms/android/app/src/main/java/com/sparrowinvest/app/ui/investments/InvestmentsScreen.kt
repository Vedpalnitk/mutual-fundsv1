package com.sparrowinvest.app.ui.investments

import androidx.compose.animation.animateColorAsState
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
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowDownward
import androidx.compose.material.icons.filled.ArrowUpward
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.FilterList
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.TrendingDown
import androidx.compose.material.icons.filled.TrendingUp
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.sparrowinvest.app.data.model.AssetClass
import com.sparrowinvest.app.data.model.FamilyMember
import com.sparrowinvest.app.data.model.FamilyPortfolio
import com.sparrowinvest.app.data.model.Holding
import com.sparrowinvest.app.data.model.Portfolio
import com.sparrowinvest.app.data.model.Sip
import com.sparrowinvest.app.data.model.SipStatus
import com.sparrowinvest.app.data.model.Transaction
import com.sparrowinvest.app.data.model.TransactionType
import com.sparrowinvest.app.ui.components.CurrencyText
import com.sparrowinvest.app.ui.components.FullScreenLoading
import com.sparrowinvest.app.ui.components.ReturnBadge
import com.sparrowinvest.app.ui.components.SegmentedControl
import com.sparrowinvest.app.ui.components.formatCompactCurrency
import com.sparrowinvest.app.ui.theme.AppColors
import com.sparrowinvest.app.ui.theme.LocalIsDarkTheme
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
fun InvestmentsScreen(
    viewModel: InvestmentsViewModel = hiltViewModel(),
    onNavigateToFund: (Int) -> Unit,
    onNavigateToTransactions: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    val portfolio by viewModel.portfolio.collectAsState()
    val filteredHoldings by viewModel.filteredHoldings.collectAsState()
    val sips by viewModel.sips.collectAsState()
    val transactions by viewModel.transactions.collectAsState()
    val selectedTab by viewModel.selectedTab.collectAsState()
    val portfolioViewMode by viewModel.portfolioViewMode.collectAsState()
    val familyPortfolio by viewModel.familyPortfolio.collectAsState()
    val selectedFamilyMember by viewModel.selectedFamilyMember.collectAsState()
    val selectedAssetFilter by viewModel.selectedAssetFilter.collectAsState()

    when (uiState) {
        is InvestmentsUiState.Loading -> {
            FullScreenLoading()
        }
        is InvestmentsUiState.Success -> {
            Box(modifier = Modifier.fillMaxSize()) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(MaterialTheme.colorScheme.background)
                        .statusBarsPadding()
                ) {
                    // Header with View Mode Toggle
                    InvestmentsHeader(
                        portfolioViewMode = portfolioViewMode,
                        onViewModeChange = { viewModel.setPortfolioViewMode(it) }
                    )

                    // Family Member Selector (only in family mode)
                    if (portfolioViewMode == PortfolioViewMode.FAMILY) {
                        familyPortfolio?.let { family ->
                            FamilyMemberSelector(
                                members = family.members,
                                selectedMember = selectedFamilyMember,
                                onMemberSelected = { viewModel.selectFamilyMember(it) }
                            )
                        }
                    }

                    // Portfolio Summary
                    val displayPortfolio = if (portfolioViewMode == PortfolioViewMode.FAMILY) {
                        familyPortfolio?.let { family ->
                            Portfolio(
                                totalValue = family.totalValue,
                                totalInvested = family.totalInvested,
                                totalReturns = family.totalReturns,
                                returnsPercentage = family.returnsPercentage,
                                assetAllocation = family.assetAllocation
                            )
                        }
                    } else {
                        portfolio
                    }
                    displayPortfolio?.let { p ->
                        PortfolioSummaryCard(
                            portfolio = p,
                            isFamily = portfolioViewMode == PortfolioViewMode.FAMILY,
                            memberCount = familyPortfolio?.members?.size ?: 0
                        )
                    }

                    // Tabs
                    InvestmentTabs(
                        selectedTab = selectedTab,
                        holdingsCount = filteredHoldings.size,
                        sipsCount = sips.size,
                        transactionsCount = transactions.size,
                        onTabSelected = { viewModel.selectTab(it) }
                    )

                    // Content based on selected tab
                    when (selectedTab) {
                        InvestmentTab.PORTFOLIO -> {
                            // Asset Class Filter
                            AssetClassFilter(
                                selectedFilter = selectedAssetFilter,
                                assetCounts = viewModel.getAssetClassCounts(),
                                onFilterSelected = { viewModel.setAssetFilter(it) }
                            )

                            HoldingsList(
                                holdings = filteredHoldings,
                                onHoldingClick = { holding ->
                                    holding.fundCode.toIntOrNull()?.let { onNavigateToFund(it) }
                                }
                            )
                        }
                        InvestmentTab.SIPS -> {
                            SipsList(
                                sips = sips,
                                onSipClick = { sip ->
                                    sip.fundCode.toIntOrNull()?.let { onNavigateToFund(it) }
                                }
                            )
                        }
                        InvestmentTab.TRANSACTIONS -> {
                            TransactionsList(
                                transactions = transactions,
                                onTransactionClick = { }
                            )
                        }
                    }
                }

                // FAB for adding new investment
                FloatingActionButton(
                    onClick = { /* TODO: Navigate to add investment */ },
                    modifier = Modifier
                        .align(Alignment.BottomEnd)
                        .padding(Spacing.medium),
                    containerColor = Primary,
                    contentColor = Color.White
                ) {
                    Icon(
                        imageVector = Icons.Default.Add,
                        contentDescription = "Add Investment"
                    )
                }
            }
        }
        is InvestmentsUiState.Error -> {
            // Error state
        }
    }
}

@Composable
private fun InvestmentsHeader(
    portfolioViewMode: PortfolioViewMode,
    onViewModeChange: (PortfolioViewMode) -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = Spacing.medium, vertical = Spacing.compact),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = "Investments",
            style = MaterialTheme.typography.headlineMedium,
            color = MaterialTheme.colorScheme.onSurface,
            fontWeight = FontWeight.Bold
        )

        SegmentedControl(
            options = listOf(PortfolioViewMode.INDIVIDUAL, PortfolioViewMode.FAMILY),
            selectedOption = portfolioViewMode,
            onOptionSelected = onViewModeChange,
            optionLabel = { mode ->
                when (mode) {
                    PortfolioViewMode.INDIVIDUAL -> "Individual"
                    PortfolioViewMode.FAMILY -> "Family"
                }
            }
        )
    }
}

@Composable
private fun FamilyMemberSelector(
    members: List<FamilyMember>,
    selectedMember: FamilyMember?,
    onMemberSelected: (FamilyMember?) -> Unit
) {
    val isDark = LocalIsDarkTheme.current

    LazyRow(
        modifier = Modifier.fillMaxWidth(),
        contentPadding = PaddingValues(horizontal = Spacing.medium),
        horizontalArrangement = Arrangement.spacedBy(Spacing.small)
    ) {
        // "All" option
        item {
            val isSelected = selectedMember == null
            FamilyMemberChip(
                text = "All",
                isSelected = isSelected,
                color = Primary,
                onClick = { onMemberSelected(null) }
            )
        }

        items(members) { member ->
            val isSelected = selectedMember?.id == member.id
            FamilyMemberChip(
                text = member.name.split(" ").first(),
                isSelected = isSelected,
                color = Color(member.relationship.color),
                onClick = { onMemberSelected(member) }
            )
        }
    }

    Spacer(modifier = Modifier.height(Spacing.compact))
}

@Composable
private fun FamilyMemberChip(
    text: String,
    isSelected: Boolean,
    color: Color,
    onClick: () -> Unit
) {
    val isDark = LocalIsDarkTheme.current
    val backgroundColor by animateColorAsState(
        targetValue = if (isSelected) color else if (isDark) CardBackgroundDark else CardBackgroundLight,
        label = "chipBackground"
    )
    val textColor by animateColorAsState(
        targetValue = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurface,
        label = "chipText"
    )

    Box(
        modifier = Modifier
            .clip(CircleShape)
            .background(backgroundColor)
            .clickable(onClick = onClick)
            .padding(horizontal = Spacing.medium, vertical = Spacing.small)
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.labelMedium,
            color = textColor
        )
    }
}

@Composable
private fun PortfolioSummaryCard(
    portfolio: Portfolio,
    isFamily: Boolean,
    memberCount: Int
) {
    val isDark = LocalIsDarkTheme.current
    val shape = RoundedCornerShape(CornerRadius.xLarge)

    val backgroundColor = if (isDark) CardBackgroundDark else CardBackgroundLight
    val borderBrush = if (isDark) {
        Brush.linearGradient(
            colors = listOf(GlassBorderStartDark, GlassBorderMidDark, GlassBorderEndDark)
        )
    } else {
        Brush.linearGradient(
            colors = listOf(GlassBorderStartLight, GlassBorderMidLight, GlassBorderEndLight)
        )
    }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = Spacing.medium)
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
            .border(width = 1.dp, brush = borderBrush, shape = shape)
            .padding(Spacing.medium)
    ) {
        // Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = if (isFamily) "Family Portfolio" else "My Portfolio",
                style = MaterialTheme.typography.titleSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            if (isFamily) {
                Box(
                    modifier = Modifier
                        .clip(CircleShape)
                        .background(Primary.copy(alpha = 0.1f))
                        .padding(horizontal = 8.dp, vertical = 2.dp)
                ) {
                    Text(
                        text = "$memberCount members",
                        style = MaterialTheme.typography.labelSmall,
                        color = Primary
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(Spacing.small))

        // Total Value
        CurrencyText(
            amount = portfolio.totalValue,
            style = MaterialTheme.typography.headlineLarge.copy(fontWeight = FontWeight.Bold)
        )

        Spacer(modifier = Modifier.height(Spacing.medium))

        // Stats Row
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column {
                Text(
                    text = "Invested",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                CurrencyText(
                    amount = portfolio.totalInvested,
                    style = MaterialTheme.typography.titleMedium,
                    compact = true
                )
            }

            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = "Returns",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Row(verticalAlignment = Alignment.CenterVertically) {
                    CurrencyText(
                        amount = portfolio.totalReturns,
                        style = MaterialTheme.typography.titleMedium,
                        color = AppColors.returnColor(portfolio.totalReturns),
                        compact = true
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    ReturnBadge(value = portfolio.returnsPercentage)
                }
            }

            Column(horizontalAlignment = Alignment.End) {
                Text(
                    text = "Today",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = if (portfolio.todayChange >= 0) Icons.Default.TrendingUp else Icons.Default.TrendingDown,
                        contentDescription = null,
                        tint = AppColors.returnColor(portfolio.todayChange),
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "${formatCompactCurrency(portfolio.todayChange)} (${String.format("%.2f", portfolio.todayChangePercentage)}%)",
                        style = MaterialTheme.typography.labelMedium,
                        color = AppColors.returnColor(portfolio.todayChange)
                    )
                }
            }
        }
    }

    Spacer(modifier = Modifier.height(Spacing.medium))
}

@Composable
private fun InvestmentTabs(
    selectedTab: InvestmentTab,
    holdingsCount: Int,
    sipsCount: Int,
    transactionsCount: Int,
    onTabSelected: (InvestmentTab) -> Unit
) {
    val tabs = listOf(
        InvestmentTab.PORTFOLIO to "Portfolio ($holdingsCount)",
        InvestmentTab.SIPS to "SIPs ($sipsCount)",
        InvestmentTab.TRANSACTIONS to "Transactions"
    )

    TabRow(
        selectedTabIndex = tabs.indexOfFirst { it.first == selectedTab },
        containerColor = Color.Transparent,
        contentColor = Primary,
        indicator = { tabPositions ->
            Box(
                modifier = Modifier
                    .tabIndicatorOffset(tabPositions[tabs.indexOfFirst { it.first == selectedTab }])
                    .height(3.dp)
                    .padding(horizontal = 24.dp)
                    .background(Primary, RoundedCornerShape(topStart = 3.dp, topEnd = 3.dp))
            )
        },
        modifier = Modifier.padding(horizontal = Spacing.small)
    ) {
        tabs.forEach { (tab, label) ->
            Tab(
                selected = selectedTab == tab,
                onClick = { onTabSelected(tab) },
                text = {
                    Text(
                        text = label,
                        style = MaterialTheme.typography.labelMedium,
                        color = if (selectedTab == tab) Primary else MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            )
        }
    }
}

@Composable
private fun AssetClassFilter(
    selectedFilter: AssetClass?,
    assetCounts: Map<AssetClass, Int>,
    onFilterSelected: (AssetClass?) -> Unit
) {
    val isDark = LocalIsDarkTheme.current

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .horizontalScroll(rememberScrollState())
            .padding(horizontal = Spacing.medium, vertical = Spacing.compact),
        horizontalArrangement = Arrangement.spacedBy(Spacing.small)
    ) {
        // "All" filter
        FilterChip(
            text = "All",
            count = assetCounts.values.sum(),
            isSelected = selectedFilter == null,
            color = Primary,
            onClick = { onFilterSelected(null) }
        )

        // Asset class filters
        AssetClass.entries.forEach { assetClass ->
            val count = assetCounts[assetClass] ?: 0
            if (count > 0) {
                FilterChip(
                    text = assetClass.displayName,
                    count = count,
                    isSelected = selectedFilter == assetClass,
                    color = Color(assetClass.color),
                    onClick = { onFilterSelected(assetClass) }
                )
            }
        }
    }
}

@Composable
private fun FilterChip(
    text: String,
    count: Int,
    isSelected: Boolean,
    color: Color,
    onClick: () -> Unit
) {
    val isDark = LocalIsDarkTheme.current
    val backgroundColor by animateColorAsState(
        targetValue = if (isSelected) color else if (isDark) CardBackgroundDark else CardBackgroundLight,
        label = "filterBackground"
    )
    val textColor by animateColorAsState(
        targetValue = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurface,
        label = "filterText"
    )

    Row(
        modifier = Modifier
            .clip(CircleShape)
            .background(backgroundColor)
            .clickable(onClick = onClick)
            .padding(horizontal = Spacing.compact, vertical = Spacing.small),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.labelMedium,
            color = textColor
        )
        Box(
            modifier = Modifier
                .clip(CircleShape)
                .background(if (isSelected) Color.White.copy(alpha = 0.2f) else color.copy(alpha = 0.1f))
                .padding(horizontal = 6.dp, vertical = 2.dp)
        ) {
            Text(
                text = "$count",
                style = MaterialTheme.typography.labelSmall,
                color = if (isSelected) Color.White else color
            )
        }
    }
}

@Composable
private fun HoldingsList(
    holdings: List<Holding>,
    onHoldingClick: (Holding) -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(Spacing.medium),
        verticalArrangement = Arrangement.spacedBy(Spacing.compact)
    ) {
        items(holdings) { holding ->
            HoldingItem(
                holding = holding,
                onClick = { onHoldingClick(holding) }
            )
        }
    }
}

@Composable
private fun HoldingItem(
    holding: Holding,
    onClick: () -> Unit
) {
    val isDark = LocalIsDarkTheme.current
    val shape = RoundedCornerShape(CornerRadius.large)

    val backgroundColor = if (isDark) CardBackgroundDark else CardBackgroundLight
    val borderBrush = if (isDark) {
        Brush.linearGradient(
            colors = listOf(GlassBorderStartDark, GlassBorderMidDark, GlassBorderEndDark)
        )
    } else {
        Brush.linearGradient(
            colors = listOf(GlassBorderStartLight, GlassBorderMidLight, GlassBorderEndLight)
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
            .border(width = 1.dp, brush = borderBrush, shape = shape)
            .clickable(onClick = onClick)
            .padding(Spacing.compact),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Asset class indicator
        Box(
            modifier = Modifier
                .size(44.dp)
                .clip(RoundedCornerShape(CornerRadius.medium))
                .background(Color(holding.assetClassEnum.color).copy(alpha = 0.15f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = if (holding.isPositiveReturn) Icons.Default.TrendingUp else Icons.Default.TrendingDown,
                contentDescription = null,
                tint = Color(holding.assetClassEnum.color),
                modifier = Modifier.size(24.dp)
            )
        }

        Spacer(modifier = Modifier.width(Spacing.compact))

        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = holding.fundName,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurface,
                maxLines = 1
            )
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(4.dp))
                        .background(Color(holding.assetClassEnum.color).copy(alpha = 0.1f))
                        .padding(horizontal = 4.dp, vertical = 1.dp)
                ) {
                    Text(
                        text = holding.category,
                        style = MaterialTheme.typography.labelSmall,
                        color = Color(holding.assetClassEnum.color)
                    )
                }
                Text(
                    text = "${String.format("%.2f", holding.units)} units",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }

        Column(horizontalAlignment = Alignment.End) {
            CurrencyText(
                amount = holding.currentValue,
                style = MaterialTheme.typography.titleSmall,
                compact = true
            )
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = formatCompactCurrency(holding.returns),
                    style = MaterialTheme.typography.labelSmall,
                    color = AppColors.returnColor(holding.returns)
                )
                Text(
                    text = " (${String.format("%.1f", holding.returnsPercentage)}%)",
                    style = MaterialTheme.typography.labelSmall,
                    color = AppColors.returnColor(holding.returnsPercentage)
                )
            }
        }
    }
}

@Composable
private fun SipsList(
    sips: List<Sip>,
    onSipClick: (Sip) -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(Spacing.medium),
        verticalArrangement = Arrangement.spacedBy(Spacing.compact)
    ) {
        items(sips) { sip ->
            SipItem(
                sip = sip,
                onClick = { onSipClick(sip) }
            )
        }
    }
}

@Composable
private fun SipItem(
    sip: Sip,
    onClick: () -> Unit
) {
    val isDark = LocalIsDarkTheme.current
    val shape = RoundedCornerShape(CornerRadius.large)

    val backgroundColor = if (isDark) CardBackgroundDark else CardBackgroundLight
    val borderBrush = if (isDark) {
        Brush.linearGradient(
            colors = listOf(GlassBorderStartDark, GlassBorderMidDark, GlassBorderEndDark)
        )
    } else {
        Brush.linearGradient(
            colors = listOf(GlassBorderStartLight, GlassBorderMidLight, GlassBorderEndLight)
        )
    }

    val statusColor = when (sip.status) {
        SipStatus.ACTIVE -> Success
        SipStatus.PAUSED -> Warning
        SipStatus.COMPLETED -> Primary
        SipStatus.CANCELLED -> Error
    }

    val statusIcon = when (sip.status) {
        SipStatus.ACTIVE -> Icons.Default.PlayArrow
        SipStatus.PAUSED -> Icons.Default.Pause
        SipStatus.COMPLETED -> Icons.Default.Check
        SipStatus.CANCELLED -> Icons.Default.TrendingDown
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
            .border(width = 1.dp, brush = borderBrush, shape = shape)
            .clickable(onClick = onClick)
            .padding(Spacing.compact),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Status indicator
        Box(
            modifier = Modifier
                .size(44.dp)
                .clip(RoundedCornerShape(CornerRadius.medium))
                .background(statusColor.copy(alpha = 0.15f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = statusIcon,
                contentDescription = null,
                tint = statusColor,
                modifier = Modifier.size(24.dp)
            )
        }

        Spacer(modifier = Modifier.width(Spacing.compact))

        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = sip.fundName,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurface,
                maxLines = 1
            )
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(4.dp))
                        .background(statusColor.copy(alpha = 0.1f))
                        .padding(horizontal = 4.dp, vertical = 1.dp)
                ) {
                    Text(
                        text = sip.status.displayName,
                        style = MaterialTheme.typography.labelSmall,
                        color = statusColor
                    )
                }
                Text(
                    text = "${sip.frequency.displayName} • Next: ${sip.nextDate}",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }

        Column(horizontalAlignment = Alignment.End) {
            CurrencyText(
                amount = sip.amount,
                style = MaterialTheme.typography.titleSmall,
                compact = true
            )
            Text(
                text = "${sip.sipCount} installments",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun TransactionsList(
    transactions: List<Transaction>,
    onTransactionClick: (Transaction) -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(Spacing.medium),
        verticalArrangement = Arrangement.spacedBy(Spacing.compact)
    ) {
        items(transactions) { transaction ->
            TransactionItem(
                transaction = transaction,
                onClick = { onTransactionClick(transaction) }
            )
        }
    }
}

@Composable
private fun TransactionItem(
    transaction: Transaction,
    onClick: () -> Unit
) {
    val isDark = LocalIsDarkTheme.current
    val shape = RoundedCornerShape(CornerRadius.large)

    val backgroundColor = if (isDark) CardBackgroundDark else CardBackgroundLight
    val borderBrush = if (isDark) {
        Brush.linearGradient(
            colors = listOf(GlassBorderStartDark, GlassBorderMidDark, GlassBorderEndDark)
        )
    } else {
        Brush.linearGradient(
            colors = listOf(GlassBorderStartLight, GlassBorderMidLight, GlassBorderEndLight)
        )
    }

    val isCredit = transaction.type.isCredit
    val typeColor = if (isCredit) Success else Error
    val typeIcon = if (isCredit) Icons.Default.ArrowDownward else Icons.Default.ArrowUpward

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
            .border(width = 1.dp, brush = borderBrush, shape = shape)
            .clickable(onClick = onClick)
            .padding(Spacing.compact),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Type indicator
        Box(
            modifier = Modifier
                .size(44.dp)
                .clip(RoundedCornerShape(CornerRadius.medium))
                .background(typeColor.copy(alpha = 0.15f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = typeIcon,
                contentDescription = null,
                tint = typeColor,
                modifier = Modifier.size(24.dp)
            )
        }

        Spacer(modifier = Modifier.width(Spacing.compact))

        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = transaction.fundName,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurface,
                maxLines = 1
            )
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(4.dp))
                        .background(typeColor.copy(alpha = 0.1f))
                        .padding(horizontal = 4.dp, vertical = 1.dp)
                ) {
                    Text(
                        text = transaction.type.displayName,
                        style = MaterialTheme.typography.labelSmall,
                        color = typeColor
                    )
                }
                Text(
                    text = transaction.date,
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }

        Column(horizontalAlignment = Alignment.End) {
            Text(
                text = (if (isCredit) "+" else "-") + formatCompactCurrency(transaction.amount),
                style = MaterialTheme.typography.titleSmall,
                color = typeColor
            )
            if (transaction.units > 0) {
                Text(
                    text = "${String.format("%.2f", transaction.units)} units",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}
