package com.sparrowinvest.fa.ui.funds

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sparrowinvest.fa.core.network.ApiResult
import com.sparrowinvest.fa.data.model.Fund
import com.sparrowinvest.fa.data.repository.FundsRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class FundSearchViewModel @Inject constructor(
    private val fundsRepository: FundsRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<FundSearchUiState>(FundSearchUiState.Idle)
    val uiState: StateFlow<FundSearchUiState> = _uiState.asStateFlow()

    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    private var searchJob: Job? = null

    fun setSearchQuery(query: String) {
        _searchQuery.value = query

        // Debounce search
        searchJob?.cancel()
        if (query.length >= 3) {
            searchJob = viewModelScope.launch {
                delay(300) // Debounce
                search()
            }
        } else if (query.isEmpty()) {
            _uiState.value = FundSearchUiState.Idle
        }
    }

    fun search() {
        val query = _searchQuery.value
        if (query.length < 3) return

        viewModelScope.launch {
            _uiState.value = FundSearchUiState.Loading
            when (val result = fundsRepository.searchFunds(query)) {
                is ApiResult.Success -> {
                    _uiState.value = FundSearchUiState.Success(result.data)
                }
                is ApiResult.Error -> {
                    _uiState.value = FundSearchUiState.Error(result.message)
                }
                else -> {}
            }
        }
    }
}

sealed class FundSearchUiState {
    data object Idle : FundSearchUiState()
    data object Loading : FundSearchUiState()
    data class Success(val funds: List<Fund>) : FundSearchUiState()
    data class Error(val message: String) : FundSearchUiState()
}
