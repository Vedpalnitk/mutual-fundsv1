package com.sparrowinvest.fa.ui.funds

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sparrowinvest.fa.core.network.ApiResult
import com.sparrowinvest.fa.data.model.AddToWhitelistRequest
import com.sparrowinvest.fa.data.model.Fund
import com.sparrowinvest.fa.data.model.WhitelistedFund
import com.sparrowinvest.fa.data.repository.FundsRepository
import com.sparrowinvest.fa.data.repository.WhitelistRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class WhitelistViewModel @Inject constructor(
    private val whitelistRepository: WhitelistRepository,
    private val fundsRepository: FundsRepository
) : ViewModel() {

    private val _funds = MutableStateFlow<List<WhitelistedFund>>(emptyList())
    val funds: StateFlow<List<WhitelistedFund>> = _funds.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _isRefreshing = MutableStateFlow(false)
    val isRefreshing: StateFlow<Boolean> = _isRefreshing.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    private val _selectedYear = MutableStateFlow(2026)
    val selectedYear: StateFlow<Int> = _selectedYear.asStateFlow()

    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    private val _searchResults = MutableStateFlow<List<Fund>>(emptyList())
    val searchResults: StateFlow<List<Fund>> = _searchResults.asStateFlow()

    private val _isSearching = MutableStateFlow(false)
    val isSearching: StateFlow<Boolean> = _isSearching.asStateFlow()

    private val _addingFundCode = MutableStateFlow<Int?>(null)
    val addingFundCode: StateFlow<Int?> = _addingFundCode.asStateFlow()

    private var searchJob: Job? = null

    val availableYears = listOf(2026, 2025, 2024)

    init {
        loadFunds()
    }

    fun loadFunds() {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            when (val result = whitelistRepository.getWhitelistedFunds()) {
                is ApiResult.Success -> {
                    _funds.value = result.data
                }
                is ApiResult.Error -> {
                    _error.value = result.message
                }
                else -> {}
            }
            _isLoading.value = false
        }
    }

    fun refreshFunds() {
        viewModelScope.launch {
            _isRefreshing.value = true
            when (val result = whitelistRepository.getWhitelistedFunds()) {
                is ApiResult.Success -> {
                    _funds.value = result.data
                    _error.value = null
                }
                is ApiResult.Error -> {
                    _error.value = result.message
                }
                else -> {}
            }
            _isRefreshing.value = false
        }
    }

    fun selectYear(year: Int) {
        _selectedYear.value = year
    }

    fun filteredFunds(): List<WhitelistedFund> {
        return _funds.value.filter { it.year == _selectedYear.value }
    }

    fun totalFunds(): Int = filteredFunds().size

    fun avgReturn1Y(): Double {
        val funds = filteredFunds().mapNotNull { it.returns1y }
        return if (funds.isEmpty()) 0.0 else funds.average()
    }

    fun avgReturn3Y(): Double {
        val funds = filteredFunds().mapNotNull { it.returns3y }
        return if (funds.isEmpty()) 0.0 else funds.average()
    }

    fun categoryBreakdown(): Map<String, Int> {
        return filteredFunds()
            .mapNotNull { it.schemeCategory }
            .groupingBy { it }
            .eachCount()
    }

    fun updateSearchQuery(query: String) {
        _searchQuery.value = query
        searchJob?.cancel()
        if (query.length >= 2) {
            searchJob = viewModelScope.launch {
                delay(350)
                searchFunds(query)
            }
        } else {
            _searchResults.value = emptyList()
        }
    }

    private suspend fun searchFunds(query: String) {
        _isSearching.value = true
        when (val result = fundsRepository.searchFunds(query)) {
            is ApiResult.Success -> {
                // Filter out funds already whitelisted for this year
                val existingCodes = filteredFunds().map { it.schemeCode }.toSet()
                _searchResults.value = result.data.filter { it.schemeCode !in existingCodes }
            }
            is ApiResult.Error -> {
                _searchResults.value = emptyList()
            }
            else -> {}
        }
        _isSearching.value = false
    }

    fun addFund(schemeCode: Int) {
        viewModelScope.launch {
            _addingFundCode.value = schemeCode
            val request = AddToWhitelistRequest(
                schemeCode = schemeCode,
                year = _selectedYear.value
            )
            when (val result = whitelistRepository.addToWhitelist(request)) {
                is ApiResult.Success -> {
                    _funds.value = _funds.value + result.data
                    // Remove from search results
                    _searchResults.value = _searchResults.value.filter { it.schemeCode != schemeCode }
                }
                is ApiResult.Error -> {
                    _error.value = result.message
                }
                else -> {}
            }
            _addingFundCode.value = null
        }
    }

    fun removeFund(fund: WhitelistedFund) {
        viewModelScope.launch {
            when (whitelistRepository.removeFromWhitelist(fund.id)) {
                is ApiResult.Success -> {
                    _funds.value = _funds.value.filter { it.id != fund.id }
                }
                is ApiResult.Error -> {
                    // Silently fail or show error
                }
                else -> {}
            }
        }
    }

    fun clearSearch() {
        _searchQuery.value = ""
        _searchResults.value = emptyList()
    }
}
