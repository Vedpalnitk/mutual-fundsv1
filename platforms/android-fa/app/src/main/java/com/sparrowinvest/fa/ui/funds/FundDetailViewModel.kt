package com.sparrowinvest.fa.ui.funds

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sparrowinvest.fa.core.network.ApiResult
import com.sparrowinvest.fa.data.model.FundDetail
import com.sparrowinvest.fa.data.model.NavHistoryPoint
import com.sparrowinvest.fa.data.repository.FundsRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import javax.inject.Inject

@HiltViewModel
class FundDetailViewModel @Inject constructor(
    private val fundsRepository: FundsRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<FundDetailUiState>(FundDetailUiState.Loading)
    val uiState: StateFlow<FundDetailUiState> = _uiState.asStateFlow()

    private val _navHistory = MutableStateFlow<List<NavHistoryPoint>>(emptyList())

    private val _selectedPeriod = MutableStateFlow("1Y")
    val selectedPeriod: StateFlow<String> = _selectedPeriod.asStateFlow()

    val filteredHistory: StateFlow<List<NavHistoryPoint>> = combine(
        _navHistory, _selectedPeriod
    ) { history, period ->
        filterByPeriod(history, period)
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    fun loadFund(schemeCode: Int) {
        viewModelScope.launch {
            _uiState.value = FundDetailUiState.Loading
            when (val result = fundsRepository.getFundDetails(schemeCode)) {
                is ApiResult.Success -> {
                    _uiState.value = FundDetailUiState.Success(result.data)
                }
                is ApiResult.Error -> {
                    _uiState.value = FundDetailUiState.Error(result.message)
                }
                else -> {}
            }
        }
        viewModelScope.launch {
            when (val result = fundsRepository.getFundNavHistory(schemeCode)) {
                is ApiResult.Success -> {
                    _navHistory.value = result.data
                }
                else -> {}
            }
        }
    }

    fun onPeriodChange(period: String) {
        _selectedPeriod.value = period
    }

    private fun filterByPeriod(history: List<NavHistoryPoint>, period: String): List<NavHistoryPoint> {
        if (period == "ALL" || history.isEmpty()) return history

        val days = when (period) {
            "1M" -> 30L
            "6M" -> 180L
            "1Y" -> 365L
            "3Y" -> 1095L
            else -> return history
        }

        val cutoff = LocalDate.now().minusDays(days)
        return history.filter { point ->
            try {
                val date = LocalDate.parse(point.date.take(10), DateTimeFormatter.ISO_LOCAL_DATE)
                !date.isBefore(cutoff)
            } catch (_: Exception) {
                true
            }
        }
    }
}

sealed class FundDetailUiState {
    data object Loading : FundDetailUiState()
    data class Success(val fund: FundDetail) : FundDetailUiState()
    data class Error(val message: String) : FundDetailUiState()
}
