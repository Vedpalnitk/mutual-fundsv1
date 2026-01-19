package com.sparrowinvest.app.ui.explore

import androidx.compose.ui.graphics.Color
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sparrowinvest.app.core.network.ApiResult
import com.sparrowinvest.app.data.model.Fund
import com.sparrowinvest.app.data.model.FundCategory
import com.sparrowinvest.app.data.repository.FundsRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

// Points data class
data class UserPoints(
    val totalPoints: Int = 1250,
    val tier: PointsTier = PointsTier.SILVER,
    val pointsToNextTier: Int = 750
)

enum class PointsTier(val displayName: String, val color: Long) {
    BRONZE("Bronze", 0xFFCD7F32),
    SILVER("Silver", 0xFFC0C0C0),
    GOLD("Gold", 0xFFFFD700),
    PLATINUM("Platinum", 0xFFE5E4E2)
}

// Advisor data class
data class AdvisorInfo(
    val nearbyCount: Int = 12,
    val topRated: String = "4.8★"
)

@HiltViewModel
class ExploreViewModel @Inject constructor(
    private val fundsRepository: FundsRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<ExploreUiState>(ExploreUiState.Idle)
    val uiState: StateFlow<ExploreUiState> = _uiState.asStateFlow()

    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    private val _searchResults = MutableStateFlow<List<Fund>>(emptyList())
    val searchResults: StateFlow<List<Fund>> = _searchResults.asStateFlow()

    private val _popularFunds = MutableStateFlow<List<Fund>>(emptyList())
    val popularFunds: StateFlow<List<Fund>> = _popularFunds.asStateFlow()

    private val _topPerformers = MutableStateFlow<List<Fund>>(emptyList())
    val topPerformers: StateFlow<List<Fund>> = _topPerformers.asStateFlow()

    private val _selectedCategory = MutableStateFlow<FundCategory?>(null)
    val selectedCategory: StateFlow<FundCategory?> = _selectedCategory.asStateFlow()

    private val _watchlist = MutableStateFlow<List<Fund>>(emptyList())
    val watchlist: StateFlow<List<Fund>> = _watchlist.asStateFlow()

    private val _userPoints = MutableStateFlow(UserPoints())
    val userPoints: StateFlow<UserPoints> = _userPoints.asStateFlow()

    private val _advisorInfo = MutableStateFlow(AdvisorInfo())
    val advisorInfo: StateFlow<AdvisorInfo> = _advisorInfo.asStateFlow()

    private var searchJob: Job? = null

    init {
        loadPopularFunds()
        loadTopPerformers()
    }

    private fun loadTopPerformers() {
        viewModelScope.launch {
            // Load top performers (using popular funds for demo)
            when (val result = fundsRepository.getPopularFunds()) {
                is ApiResult.Success -> {
                    _topPerformers.value = result.data.sortedByDescending { it.returns?.oneYear ?: 0.0 }.take(5)
                }
                is ApiResult.Error -> {
                    _topPerformers.value = createMockFunds().sortedByDescending { it.returns?.oneYear ?: 0.0 }.take(5)
                }
                else -> {}
            }
        }
    }

    fun toggleWatchlist(fund: Fund) {
        val currentList = _watchlist.value.toMutableList()
        if (currentList.any { it.schemeCode == fund.schemeCode }) {
            currentList.removeAll { it.schemeCode == fund.schemeCode }
        } else {
            currentList.add(fund)
        }
        _watchlist.value = currentList
    }

    fun isInWatchlist(fund: Fund): Boolean {
        return _watchlist.value.any { it.schemeCode == fund.schemeCode }
    }

    fun loadPopularFunds() {
        viewModelScope.launch {
            _uiState.value = ExploreUiState.Loading

            when (val result = fundsRepository.getPopularFunds()) {
                is ApiResult.Success -> {
                    _popularFunds.value = result.data
                    _uiState.value = ExploreUiState.Success
                }
                is ApiResult.Error -> {
                    _popularFunds.value = createMockFunds()
                    _uiState.value = ExploreUiState.Success
                }
                else -> {}
            }
        }
    }

    fun onSearchQueryChange(query: String) {
        _searchQuery.value = query
        searchJob?.cancel()

        if (query.isBlank()) {
            _searchResults.value = emptyList()
            _uiState.value = ExploreUiState.Success
            return
        }

        searchJob = viewModelScope.launch {
            delay(300) // Debounce
            searchFunds(query)
        }
    }

    private suspend fun searchFunds(query: String) {
        _uiState.value = ExploreUiState.Searching

        when (val result = fundsRepository.searchFunds(query)) {
            is ApiResult.Success -> {
                _searchResults.value = result.data
                _uiState.value = ExploreUiState.Success
            }
            is ApiResult.Error -> {
                _searchResults.value = emptyList()
                _uiState.value = ExploreUiState.Error(result.message)
            }
            else -> {}
        }
    }

    fun selectCategory(category: FundCategory?) {
        _selectedCategory.value = category
        if (category != null) {
            loadFundsByCategory(category)
        }
    }

    private fun loadFundsByCategory(category: FundCategory) {
        viewModelScope.launch {
            _uiState.value = ExploreUiState.Loading

            when (val result = fundsRepository.getFundsByCategory(category.name.lowercase())) {
                is ApiResult.Success -> {
                    _searchResults.value = result.data
                    _uiState.value = ExploreUiState.Success
                }
                is ApiResult.Error -> {
                    _uiState.value = ExploreUiState.Error(result.message)
                }
                else -> {}
            }
        }
    }

    fun clearSearch() {
        _searchQuery.value = ""
        _searchResults.value = emptyList()
        _selectedCategory.value = null
    }

    private fun createMockFunds(): List<Fund> {
        return listOf(
            Fund(
                id = "1",
                schemeCode = 122639,
                schemeName = "Parag Parikh Flexi Cap Fund - Direct Growth",
                category = "Flexi Cap",
                assetClass = "equity",
                nav = 78.45,
                returns = com.sparrowinvest.app.data.model.FundReturns(
                    oneYear = 24.5,
                    threeYear = 18.2,
                    fiveYear = 22.1
                ),
                riskRating = 4,
                fundHouse = "PPFAS Mutual Fund"
            ),
            Fund(
                id = "2",
                schemeCode = 112090,
                schemeName = "HDFC Mid-Cap Opportunities Fund - Direct Growth",
                category = "Mid Cap",
                assetClass = "equity",
                nav = 112.35,
                returns = com.sparrowinvest.app.data.model.FundReturns(
                    oneYear = 32.1,
                    threeYear = 25.4,
                    fiveYear = 18.9
                ),
                riskRating = 5,
                fundHouse = "HDFC Mutual Fund"
            ),
            Fund(
                id = "3",
                schemeCode = 120465,
                schemeName = "ICICI Prudential Corporate Bond Fund - Direct Growth",
                category = "Corporate Bond",
                assetClass = "debt",
                nav = 24.10,
                returns = com.sparrowinvest.app.data.model.FundReturns(
                    oneYear = 7.2,
                    threeYear = 6.8,
                    fiveYear = 7.5
                ),
                riskRating = 2,
                fundHouse = "ICICI Prudential Mutual Fund"
            ),
            Fund(
                id = "4",
                schemeCode = 118551,
                schemeName = "Axis Bluechip Fund - Direct Growth",
                category = "Large Cap",
                assetClass = "equity",
                nav = 52.18,
                returns = com.sparrowinvest.app.data.model.FundReturns(
                    oneYear = 15.3,
                    threeYear = 12.1,
                    fiveYear = 14.8
                ),
                riskRating = 3,
                fundHouse = "Axis Mutual Fund"
            )
        )
    }
}

sealed class ExploreUiState {
    data object Idle : ExploreUiState()
    data object Loading : ExploreUiState()
    data object Searching : ExploreUiState()
    data object Success : ExploreUiState()
    data class Error(val message: String) : ExploreUiState()
}
