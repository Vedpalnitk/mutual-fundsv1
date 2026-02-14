package com.sparrowinvest.fa.ui.funds

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Sort
import androidx.compose.material.icons.automirrored.filled.TrendingUp
import androidx.compose.material.icons.filled.AccountBalance
import androidx.compose.material.icons.filled.BarChart
import androidx.compose.material.icons.filled.Diamond
import androidx.compose.material.icons.filled.Savings
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.StarBorder
import androidx.compose.material.icons.automirrored.filled.ShowChart
import androidx.compose.material.icons.filled.Speed
import androidx.compose.material.icons.filled.SwapHoriz
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sparrowinvest.fa.core.network.ApiResult
import com.sparrowinvest.fa.data.model.Fund
import com.sparrowinvest.fa.data.repository.FundsRepository
import com.sparrowinvest.fa.ui.components.EmptyState
import com.sparrowinvest.fa.ui.components.ErrorState
import com.sparrowinvest.fa.ui.components.GlassCard
import com.sparrowinvest.fa.ui.components.GlassTextField
import com.sparrowinvest.fa.ui.components.ListItemCard
import com.sparrowinvest.fa.ui.components.LoadingIndicator
import com.sparrowinvest.fa.ui.components.ReturnBadge
import com.sparrowinvest.fa.ui.components.TopBar
import com.sparrowinvest.fa.ui.theme.CornerRadius
import com.sparrowinvest.fa.ui.theme.Primary
import com.sparrowinvest.fa.ui.theme.Secondary
import com.sparrowinvest.fa.ui.theme.Spacing
import com.sparrowinvest.fa.ui.theme.Success
import com.sparrowinvest.fa.ui.theme.Warning
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class FundCategory(
    val name: String,
    val apiKey: String,
    val icon: ImageVector,
    val tint: Color
)

val fundCategories = listOf(
    FundCategory("Large Cap", "large_cap", Icons.Default.AccountBalance, Color(0xFF3B82F6)),
    FundCategory("Mid Cap", "mid_cap", Icons.AutoMirrored.Filled.TrendingUp, Color(0xFF8B5CF6)),
    FundCategory("Small Cap", "small_cap", Icons.Default.Diamond, Color(0xFFEC4899)),
    FundCategory("Flexi Cap", "flexi_cap", Icons.Default.SwapHoriz, Color(0xFF06B6D4)),
    FundCategory("ELSS", "ELSS", Icons.Default.School, Color(0xFF10B981)),
    FundCategory("Debt", "Debt", Icons.Default.Savings, Color(0xFFF59E0B)),
    FundCategory("Hybrid", "Hybrid", Icons.Default.BarChart, Color(0xFFEF4444)),
    FundCategory("Index", "Index", Icons.AutoMirrored.Filled.ShowChart, Color(0xFF6366F1))
)

enum class FundSortOption(val label: String) {
    RETURNS_1Y("1Y Returns ↓"),
    RETURNS_3Y("3Y Returns ↓"),
    AUM("AUM ↓"),
    RATING("Rating ↓"),
    NAME_AZ("Name A→Z")
}

@HiltViewModel
class FundUniverseViewModel @Inject constructor(
    private val fundsRepository: FundsRepository
) : ViewModel() {

    private val _selectedCategory = MutableStateFlow<FundCategory?>(null)
    val selectedCategory: StateFlow<FundCategory?> = _selectedCategory.asStateFlow()

    private val _fundsState = MutableStateFlow<FundUniverseUiState>(FundUniverseUiState.Idle)
    val fundsState: StateFlow<FundUniverseUiState> = _fundsState.asStateFlow()

    fun selectCategory(category: FundCategory) {
        _selectedCategory.value = category
        loadFunds(category.apiKey)
    }

    fun clearCategory() {
        _selectedCategory.value = null
        _fundsState.value = FundUniverseUiState.Idle
    }

    private fun loadFunds(category: String) {
        viewModelScope.launch {
            _fundsState.value = FundUniverseUiState.Loading
            when (val result = fundsRepository.getFundsByCategory(category)) {
                is ApiResult.Success -> {
                    _fundsState.value = FundUniverseUiState.Success(result.data)
                }
                is ApiResult.Error -> {
                    _fundsState.value = FundUniverseUiState.Error(result.message)
                }
                else -> {}
            }
        }
    }

    fun retry() {
        _selectedCategory.value?.let { selectCategory(it) }
    }
}

sealed class FundUniverseUiState {
    data object Idle : FundUniverseUiState()
    data object Loading : FundUniverseUiState()
    data class Success(val funds: List<Fund>) : FundUniverseUiState()
    data class Error(val message: String) : FundUniverseUiState()
}

private fun formatAum(aum: Double): String {
    return when {
        aum >= 1_00_00_00_000 -> "\u20B9${"%.0f".format(aum / 1_00_00_00_000)} K Cr"
        aum >= 1_00_00_000 -> "\u20B9${"%.0f".format(aum / 1_00_00_000)} Cr"
        aum >= 1_00_000 -> "\u20B9${"%.0f".format(aum / 1_00_000)} L"
        else -> "\u20B9${"%.0f".format(aum)}"
    }
}

@Composable
fun FundUniverseScreen(
    viewModel: FundUniverseViewModel = hiltViewModel(),
    onBackClick: () -> Unit,
    onNavigateToFund: (Int) -> Unit,
    onNavigateToSearch: () -> Unit = {}
) {
    val selectedCategory by viewModel.selectedCategory.collectAsState()
    val fundsState by viewModel.fundsState.collectAsState()

    Column(modifier = Modifier.fillMaxSize()) {
        TopBar(
            title = selectedCategory?.let { "Fund Universe - ${it.name}" } ?: "Fund Universe",
            onBackClick = {
                if (selectedCategory != null) {
                    viewModel.clearCategory()
                } else {
                    onBackClick()
                }
            }
        )

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = Spacing.medium)
        ) {
            if (selectedCategory == null) {
                // Search bar on landing page
                GlassTextField(
                    value = "",
                    onValueChange = {},
                    placeholder = "Search funds...",
                    imeAction = ImeAction.Search,
                    onImeAction = onNavigateToSearch,
                    prefix = {
                        Icon(
                            imageVector = Icons.Default.Search,
                            contentDescription = null,
                            modifier = Modifier
                                .size(20.dp)
                                .clickable(onClick = onNavigateToSearch),
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    },
                    modifier = Modifier
                        .clickable(onClick = onNavigateToSearch)
                        .padding(bottom = Spacing.compact)
                )

                // Category grid
                CategoryGrid(
                    onCategoryClick = { viewModel.selectCategory(it) }
                )
            } else {
                // Fund list for selected category
                when (val state = fundsState) {
                    is FundUniverseUiState.Idle -> {}
                    is FundUniverseUiState.Loading -> {
                        LoadingIndicator(
                            modifier = Modifier.fillMaxSize(),
                            message = "Loading ${selectedCategory?.name} funds..."
                        )
                    }
                    is FundUniverseUiState.Error -> {
                        ErrorState(
                            message = state.message,
                            onRetry = { viewModel.retry() },
                            modifier = Modifier.fillMaxSize()
                        )
                    }
                    is FundUniverseUiState.Success -> {
                        if (state.funds.isEmpty()) {
                            EmptyState(
                                title = "No funds found",
                                message = "No ${selectedCategory?.name} funds available",
                                modifier = Modifier.fillMaxSize()
                            )
                        } else {
                            FundListWithControls(
                                funds = state.funds,
                                onNavigateToFund = onNavigateToFund
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun FundListWithControls(
    funds: List<Fund>,
    onNavigateToFund: (Int) -> Unit
) {
    var localSearch by remember { mutableStateOf("") }
    var sortOption by remember { mutableStateOf(FundSortOption.RETURNS_1Y) }
    var showSortMenu by remember { mutableStateOf(false) }

    val filteredAndSorted = remember(funds, localSearch, sortOption) {
        val filtered = if (localSearch.isBlank()) funds
        else funds.filter { it.schemeName.contains(localSearch, ignoreCase = true) }

        when (sortOption) {
            FundSortOption.RETURNS_1Y -> filtered.sortedByDescending { it.returns1y ?: Double.MIN_VALUE }
            FundSortOption.RETURNS_3Y -> filtered.sortedByDescending { it.returns3y ?: Double.MIN_VALUE }
            FundSortOption.AUM -> filtered.sortedByDescending { it.aum ?: 0.0 }
            FundSortOption.RATING -> filtered.sortedByDescending { it.fundRating ?: 0 }
            FundSortOption.NAME_AZ -> filtered.sortedBy { it.schemeName }
        }
    }

    // Local search + sort controls
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = Spacing.compact),
        verticalAlignment = Alignment.CenterVertically
    ) {
        GlassTextField(
            value = localSearch,
            onValueChange = { localSearch = it },
            placeholder = "Filter funds...",
            imeAction = ImeAction.Search,
            prefix = {
                Icon(
                    imageVector = Icons.Default.Search,
                    contentDescription = null,
                    modifier = Modifier.size(20.dp),
                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                )
            },
            modifier = Modifier.weight(1f)
        )
        Spacer(modifier = Modifier.width(Spacing.small))
        Box {
            IconButton(onClick = { showSortMenu = true }) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.Sort,
                    contentDescription = "Sort",
                    tint = MaterialTheme.colorScheme.onSurface
                )
            }
            DropdownMenu(
                expanded = showSortMenu,
                onDismissRequest = { showSortMenu = false }
            ) {
                FundSortOption.entries.forEach { option ->
                    DropdownMenuItem(
                        text = {
                            Text(
                                text = option.label,
                                style = MaterialTheme.typography.bodyMedium,
                                color = if (option == sortOption) Primary
                                else MaterialTheme.colorScheme.onSurface
                            )
                        },
                        onClick = {
                            sortOption = option
                            showSortMenu = false
                        }
                    )
                }
            }
        }
    }

    if (filteredAndSorted.isEmpty()) {
        EmptyState(
            title = "No matches",
            message = "No funds match \"$localSearch\"",
            modifier = Modifier.fillMaxSize()
        )
    } else {
        LazyColumn(
            verticalArrangement = Arrangement.spacedBy(Spacing.compact)
        ) {
            items(filteredAndSorted, key = { it.schemeCode }) { fund ->
                FundUniverseItem(
                    fund = fund,
                    onClick = { onNavigateToFund(fund.schemeCode) }
                )
            }
            item {
                Spacer(modifier = Modifier.height(Spacing.large))
            }
        }
    }
}

@Composable
private fun CategoryGrid(
    onCategoryClick: (FundCategory) -> Unit
) {
    LazyVerticalGrid(
        columns = GridCells.Fixed(2),
        contentPadding = PaddingValues(vertical = Spacing.compact),
        horizontalArrangement = Arrangement.spacedBy(Spacing.compact),
        verticalArrangement = Arrangement.spacedBy(Spacing.compact)
    ) {
        items(fundCategories) { category ->
            CategoryCard(
                category = category,
                onClick = { onCategoryClick(category) }
            )
        }
    }
}

@Composable
private fun CategoryCard(
    category: FundCategory,
    onClick: () -> Unit
) {
    GlassCard(
        cornerRadius = CornerRadius.large,
        onClick = onClick
    ) {
        Column(
            modifier = Modifier.fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(RoundedCornerShape(CornerRadius.medium))
                    .background(category.tint.copy(alpha = 0.12f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = category.icon,
                    contentDescription = null,
                    modifier = Modifier.size(24.dp),
                    tint = category.tint
                )
            }
            Spacer(modifier = Modifier.height(Spacing.compact))
            Text(
                text = category.name,
                style = MaterialTheme.typography.titleSmall,
                color = MaterialTheme.colorScheme.onSurface,
                textAlign = TextAlign.Center
            )
        }
    }
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

@Composable
private fun FundUniverseItem(
    fund: Fund,
    onClick: () -> Unit
) {
    ListItemCard(
        modifier = Modifier.clickable(onClick = onClick)
    ) {
        Column {
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
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    fund.schemeCategory?.let {
                        Text(
                            text = it,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    fund.nav?.let {
                        Text(
                            text = "NAV: \u20B9${String.format("%.2f", it)}",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    fund.aum?.let {
                        Text(
                            text = "AUM: ${formatAum(it)}",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                Column(horizontalAlignment = Alignment.End) {
                    fund.returns1y?.let {
                        ReturnBadge(returnValue = it)
                    }
                    fund.returns3y?.let {
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = "3Y ${if (it >= 0) "+" else ""}${"%.1f".format(it)}%",
                            style = MaterialTheme.typography.labelSmall,
                            color = if (it >= 0) Success else com.sparrowinvest.fa.ui.theme.Error
                        )
                    }
                    fund.riskLevel?.let {
                        Text(
                            text = it,
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }
    }
}
