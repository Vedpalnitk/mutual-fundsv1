package com.sparrowinvest.fa.ui.funds

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.StarBorder
import androidx.compose.material.icons.automirrored.filled.TrendingUp
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.SwipeToDismissBox
import androidx.compose.material3.SwipeToDismissBoxValue
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.material3.rememberSwipeToDismissBoxState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.sparrowinvest.fa.data.model.Fund
import com.sparrowinvest.fa.data.model.WhitelistedFund
import com.sparrowinvest.fa.ui.components.EmptyState
import com.sparrowinvest.fa.ui.components.ErrorState
import com.sparrowinvest.fa.ui.components.GlassCard
import com.sparrowinvest.fa.ui.components.GlassTextField
import com.sparrowinvest.fa.ui.components.ListItemCard
import com.sparrowinvest.fa.ui.components.LoadingIndicator
import com.sparrowinvest.fa.ui.components.PrimaryButton
import com.sparrowinvest.fa.ui.components.ReturnBadge
import com.sparrowinvest.fa.ui.components.TopBar
import com.sparrowinvest.fa.ui.theme.CornerRadius
import com.sparrowinvest.fa.ui.theme.GradientEndCyan
import com.sparrowinvest.fa.ui.theme.GradientStartBlue
import com.sparrowinvest.fa.ui.theme.LocalIsDarkTheme
import com.sparrowinvest.fa.ui.theme.Primary
import com.sparrowinvest.fa.ui.theme.Secondary
import com.sparrowinvest.fa.ui.theme.Spacing
import com.sparrowinvest.fa.ui.theme.Success
import com.sparrowinvest.fa.ui.theme.Warning
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun WhitelistedFundsScreen(
    viewModel: WhitelistViewModel = hiltViewModel(),
    onBackClick: () -> Unit,
    onNavigateToFund: (Int) -> Unit
) {
    val funds by viewModel.funds.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val isRefreshing by viewModel.isRefreshing.collectAsState()
    val error by viewModel.error.collectAsState()
    val selectedYear by viewModel.selectedYear.collectAsState()

    var showAddSheet by remember { mutableStateOf(false) }
    var fundToDelete by remember { mutableStateOf<WhitelistedFund?>(null) }

    val filteredFunds = remember(funds, selectedYear) {
        viewModel.filteredFunds()
    }

    Column(modifier = Modifier.fillMaxSize()) {
        // Top Bar
        TopBar(
            title = "My Picks",
            onBackClick = onBackClick,
            actions = {
                IconButton(onClick = { showAddSheet = true }) {
                    Icon(
                        imageVector = Icons.Default.Add,
                        contentDescription = "Add Fund",
                        tint = MaterialTheme.colorScheme.primary
                    )
                }
            }
        )

        when {
            isLoading -> {
                LoadingIndicator(
                    modifier = Modifier.fillMaxSize(),
                    message = "Loading your picks..."
                )
            }
            error != null && funds.isEmpty() -> {
                ErrorState(
                    message = error ?: "Something went wrong",
                    onRetry = { viewModel.loadFunds() },
                    modifier = Modifier.fillMaxSize()
                )
            }
            else -> {
                PullToRefreshBox(
                    isRefreshing = isRefreshing,
                    onRefresh = { viewModel.refreshFunds() },
                    modifier = Modifier.fillMaxSize()
                ) {
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(horizontal = Spacing.medium),
                        verticalArrangement = Arrangement.spacedBy(Spacing.compact)
                    ) {
                        // Summary Card
                        item {
                            SummaryCard(viewModel = viewModel)
                        }

                        // Year Picker
                        item {
                            Spacer(modifier = Modifier.height(Spacing.small))
                            YearPicker(
                                years = viewModel.availableYears,
                                selectedYear = selectedYear,
                                onYearSelected = { viewModel.selectYear(it) }
                            )
                            Spacer(modifier = Modifier.height(Spacing.small))
                        }

                        // Fund List or Empty State
                        if (filteredFunds.isEmpty()) {
                            item {
                                EmptyState(
                                    icon = Icons.AutoMirrored.Filled.TrendingUp,
                                    title = "No picks for $selectedYear",
                                    message = "Add funds to your curated list for clients",
                                    action = {
                                        PrimaryButton(
                                            text = "Browse Funds",
                                            onClick = { showAddSheet = true },
                                            fullWidth = false
                                        )
                                    },
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(vertical = Spacing.xLarge)
                                )
                            }
                        } else {
                            items(
                                items = filteredFunds,
                                key = { it.id }
                            ) { fund ->
                                SwipeableWhitelistItem(
                                    fund = fund,
                                    onClick = { onNavigateToFund(fund.schemeCode) },
                                    onDelete = { fundToDelete = fund }
                                )
                            }
                        }

                        // Bottom spacing
                        item {
                            Spacer(modifier = Modifier.height(Spacing.large))
                        }
                    }
                }
            }
        }
    }

    // Add Fund Bottom Sheet
    if (showAddSheet) {
        AddFundBottomSheet(
            viewModel = viewModel,
            onDismiss = {
                showAddSheet = false
                viewModel.clearSearch()
            },
            onFundAdded = {
                // Keep sheet open so user can add more
            }
        )
    }

    // Delete Confirmation Dialog
    fundToDelete?.let { fund ->
        AlertDialog(
            onDismissRequest = { fundToDelete = null },
            title = {
                Text(
                    text = "Remove Fund",
                    style = MaterialTheme.typography.titleMedium
                )
            },
            text = {
                Text(
                    text = "Remove \"${fund.schemeName}\" from your ${fund.year} picks?",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        viewModel.removeFund(fund)
                        fundToDelete = null
                    }
                ) {
                    Text(
                        text = "Remove",
                        color = com.sparrowinvest.fa.ui.theme.Error
                    )
                }
            },
            dismissButton = {
                TextButton(onClick = { fundToDelete = null }) {
                    Text("Cancel")
                }
            }
        )
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun SummaryCard(viewModel: WhitelistViewModel) {
    val isDark = LocalIsDarkTheme.current
    val totalFunds = viewModel.totalFunds()
    val avg1Y = viewModel.avgReturn1Y()
    val avg3Y = viewModel.avgReturn3Y()
    val categories = viewModel.categoryBreakdown()

    GlassCard(
        cornerRadius = CornerRadius.xLarge,
        contentPadding = Spacing.medium
    ) {
        Column {
            // Gradient header strip
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(4.dp)
                    .clip(RoundedCornerShape(2.dp))
                    .background(
                        Brush.horizontalGradient(
                            colors = listOf(GradientStartBlue, GradientEndCyan)
                        )
                    )
            )

            Spacer(modifier = Modifier.height(Spacing.compact))

            // Stats Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                StatItem(
                    label = "Total Funds",
                    value = totalFunds.toString(),
                    valueColor = MaterialTheme.colorScheme.primary
                )
                StatItem(
                    label = "Avg 1Y Return",
                    value = "${if (avg1Y >= 0) "+" else ""}${"%.1f".format(avg1Y)}%",
                    valueColor = if (avg1Y >= 0) Success else com.sparrowinvest.fa.ui.theme.Error
                )
                StatItem(
                    label = "Avg 3Y Return",
                    value = "${if (avg3Y >= 0) "+" else ""}${"%.1f".format(avg3Y)}%",
                    valueColor = if (avg3Y >= 0) Success else com.sparrowinvest.fa.ui.theme.Error
                )
            }

            // Category Breakdown Chips
            if (categories.isNotEmpty()) {
                Spacer(modifier = Modifier.height(Spacing.compact))
                FlowRow(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(Spacing.small),
                    verticalArrangement = Arrangement.spacedBy(Spacing.micro)
                ) {
                    categories.forEach { (category, count) ->
                        CategoryChip(
                            category = category,
                            count = count
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun StatItem(
    label: String,
    value: String,
    valueColor: Color
) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            text = value,
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold,
            color = valueColor
        )
        Spacer(modifier = Modifier.height(Spacing.micro))
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
private fun CategoryChip(
    category: String,
    count: Int
) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(CornerRadius.small))
            .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.08f))
            .padding(horizontal = Spacing.small, vertical = Spacing.micro)
    ) {
        Text(
            text = "$category ($count)",
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.primary
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun YearPicker(
    years: List<Int>,
    selectedYear: Int,
    onYearSelected: (Int) -> Unit
) {
    LazyRow(
        horizontalArrangement = Arrangement.spacedBy(Spacing.small)
    ) {
        items(years) { year ->
            FilterChip(
                selected = year == selectedYear,
                onClick = { onYearSelected(year) },
                label = {
                    Text(
                        text = year.toString(),
                        style = MaterialTheme.typography.labelLarge
                    )
                },
                colors = FilterChipDefaults.filterChipColors(
                    selectedContainerColor = Primary.copy(alpha = 0.15f),
                    selectedLabelColor = Primary
                )
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun SwipeableWhitelistItem(
    fund: WhitelistedFund,
    onClick: () -> Unit,
    onDelete: () -> Unit
) {
    val dismissState = rememberSwipeToDismissBoxState(
        confirmValueChange = { value ->
            if (value == SwipeToDismissBoxValue.EndToStart) {
                onDelete()
                false // Don't auto-dismiss; let the dialog confirm
            } else {
                false
            }
        }
    )

    SwipeToDismissBox(
        state = dismissState,
        backgroundContent = {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .clip(RoundedCornerShape(CornerRadius.medium))
                    .background(com.sparrowinvest.fa.ui.theme.Error.copy(alpha = 0.12f))
                    .padding(horizontal = Spacing.large),
                contentAlignment = Alignment.CenterEnd
            ) {
                Icon(
                    imageVector = Icons.Default.Delete,
                    contentDescription = "Delete",
                    tint = com.sparrowinvest.fa.ui.theme.Error
                )
            }
        },
        enableDismissFromStartToEnd = false
    ) {
        WhitelistFundItem(
            fund = fund,
            onClick = onClick
        )
    }
}

@Composable
private fun WhitelistFundItem(
    fund: WhitelistedFund,
    onClick: () -> Unit
) {
    ListItemCard(
        modifier = Modifier.clickable(onClick = onClick)
    ) {
        Column {
            // Fund name and rating
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Text(
                    text = fund.schemeName,
                    style = MaterialTheme.typography.titleSmall,
                    color = MaterialTheme.colorScheme.onSurface,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f)
                )
                fund.fundRating?.let { rating ->
                    StarRating(
                        rating = rating,
                        modifier = Modifier.padding(start = Spacing.small, top = 2.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(4.dp))

            // Category, risk, and returns
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    fund.schemeCategory?.let { category ->
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(CornerRadius.small))
                                .background(Secondary.copy(alpha = 0.1f))
                                .padding(horizontal = Spacing.small, vertical = Spacing.micro)
                        ) {
                            Text(
                                text = category,
                                style = MaterialTheme.typography.labelSmall,
                                color = Secondary
                            )
                        }
                    }
                    Spacer(modifier = Modifier.height(2.dp))
                    fund.riskLevel?.let { risk ->
                        RiskBadge(risk = risk)
                    }
                }
                Column(horizontalAlignment = Alignment.End) {
                    fund.returns1y?.let { ret ->
                        ReturnBadge(returnValue = ret)
                    }
                    fund.returns3y?.let { ret ->
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = "3Y ${if (ret >= 0) "+" else ""}${"%.1f".format(ret)}%",
                            style = MaterialTheme.typography.labelSmall,
                            color = if (ret >= 0) Success else com.sparrowinvest.fa.ui.theme.Error
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun RiskBadge(risk: String) {
    val color = when (risk) {
        "Low" -> Success
        "Low to Moderate" -> Color(0xFF34D399)
        "Moderate" -> Warning
        "Moderately High" -> Color(0xFFF97316)
        "High" -> com.sparrowinvest.fa.ui.theme.Error
        else -> MaterialTheme.colorScheme.onSurfaceVariant
    }

    Text(
        text = risk,
        style = MaterialTheme.typography.labelSmall,
        color = color
    )
}

@Composable
private fun StarRating(rating: Int, modifier: Modifier = Modifier) {
    Row(modifier = modifier) {
        for (i in 1..5) {
            Icon(
                imageVector = if (i <= rating) Icons.Default.Star else Icons.Default.StarBorder,
                contentDescription = null,
                modifier = Modifier.size(12.dp),
                tint = if (i <= rating) Warning else MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.3f)
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun AddFundBottomSheet(
    viewModel: WhitelistViewModel,
    onDismiss: () -> Unit,
    onFundAdded: () -> Unit
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    val searchQuery by viewModel.searchQuery.collectAsState()
    val searchResults by viewModel.searchResults.collectAsState()
    val isSearching by viewModel.isSearching.collectAsState()
    val addingFundCode by viewModel.addingFundCode.collectAsState()
    val selectedYear by viewModel.selectedYear.collectAsState()

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = MaterialTheme.colorScheme.surface
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = Spacing.medium)
                .padding(bottom = Spacing.large)
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Add to $selectedYear Picks",
                    style = MaterialTheme.typography.titleLarge,
                    color = MaterialTheme.colorScheme.onSurface
                )
                IconButton(onClick = onDismiss) {
                    Icon(
                        imageVector = Icons.Default.Close,
                        contentDescription = "Close",
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            Spacer(modifier = Modifier.height(Spacing.compact))

            // Search Field
            GlassTextField(
                value = searchQuery,
                onValueChange = { viewModel.updateSearchQuery(it) },
                placeholder = "Search funds by name...",
                prefix = {
                    Icon(
                        imageVector = Icons.Default.Search,
                        contentDescription = null,
                        modifier = Modifier.size(20.dp),
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            )

            Spacer(modifier = Modifier.height(Spacing.compact))

            // Search Results
            when {
                isSearching -> {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(200.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(32.dp),
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                }
                searchQuery.length < 2 -> {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(200.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "Type at least 2 characters to search",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                searchResults.isEmpty() -> {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(200.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "No funds found for \"$searchQuery\"",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                else -> {
                    LazyColumn(
                        modifier = Modifier.height(400.dp),
                        verticalArrangement = Arrangement.spacedBy(Spacing.small)
                    ) {
                        items(searchResults, key = { it.schemeCode }) { fund ->
                            SearchResultItem(
                                fund = fund,
                                isAdding = addingFundCode == fund.schemeCode,
                                onAdd = {
                                    viewModel.addFund(fund.schemeCode)
                                    onFundAdded()
                                }
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun SearchResultItem(
    fund: Fund,
    isAdding: Boolean,
    onAdd: () -> Unit
) {
    ListItemCard {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = fund.schemeName,
                    style = MaterialTheme.typography.titleSmall,
                    color = MaterialTheme.colorScheme.onSurface,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
                Spacer(modifier = Modifier.height(2.dp))
                Row(
                    horizontalArrangement = Arrangement.spacedBy(Spacing.small),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    fund.schemeCategory?.let { cat ->
                        Text(
                            text = cat,
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    fund.returns1y?.let { ret ->
                        Text(
                            text = "1Y ${if (ret >= 0) "+" else ""}${"%.1f".format(ret)}%",
                            style = MaterialTheme.typography.labelSmall,
                            color = if (ret >= 0) Success else com.sparrowinvest.fa.ui.theme.Error
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.width(Spacing.small))

            if (isAdding) {
                CircularProgressIndicator(
                    modifier = Modifier.size(24.dp),
                    color = MaterialTheme.colorScheme.primary,
                    strokeWidth = 2.dp
                )
            } else {
                IconButton(onClick = onAdd) {
                    Icon(
                        imageVector = Icons.Default.Add,
                        contentDescription = "Add to picks",
                        tint = MaterialTheme.colorScheme.primary
                    )
                }
            }
        }
    }
}
