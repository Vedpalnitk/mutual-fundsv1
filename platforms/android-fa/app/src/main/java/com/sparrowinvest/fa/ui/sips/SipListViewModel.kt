package com.sparrowinvest.fa.ui.sips

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sparrowinvest.fa.core.network.ApiResult
import com.sparrowinvest.fa.data.model.FASip
import com.sparrowinvest.fa.data.repository.SipRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class SipListViewModel @Inject constructor(
    private val sipRepository: SipRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<SipListUiState>(SipListUiState.Loading)
    val uiState: StateFlow<SipListUiState> = _uiState.asStateFlow()

    private val _selectedFilter = MutableStateFlow(SipFilter.All)
    val selectedFilter: StateFlow<SipFilter> = _selectedFilter.asStateFlow()

    private val _actionError = MutableStateFlow<String?>(null)
    val actionError: StateFlow<String?> = _actionError.asStateFlow()

    private val _actionSuccess = MutableStateFlow<String?>(null)
    val actionSuccess: StateFlow<String?> = _actionSuccess.asStateFlow()

    private val _processingId = MutableStateFlow<String?>(null)
    val processingId: StateFlow<String?> = _processingId.asStateFlow()

    private var allSips: List<FASip> = emptyList()

    init {
        loadSips()
    }

    fun loadSips() {
        viewModelScope.launch {
            _uiState.value = SipListUiState.Loading
            when (val result = sipRepository.getSips()) {
                is ApiResult.Success -> {
                    allSips = result.data
                    applyFilter()
                }
                is ApiResult.Error -> {
                    _uiState.value = SipListUiState.Error(result.message)
                }
                else -> {}
            }
        }
    }

    fun setFilter(filter: SipFilter) {
        _selectedFilter.value = filter
        applyFilter()
    }

    private fun applyFilter() {
        val filter = _selectedFilter.value
        val filtered = when (filter) {
            SipFilter.All -> allSips
            SipFilter.Active -> allSips.filter { it.status == "ACTIVE" }
            SipFilter.Paused -> allSips.filter { it.status == "PAUSED" }
            SipFilter.Cancelled -> allSips.filter { it.status == "CANCELLED" }
        }

        val activeSips = allSips.filter { it.isActive }
        val totalMonthlyValue = activeSips.sumOf { it.amount }

        val summary = SipSummary(
            totalCount = allSips.size,
            activeCount = allSips.count { it.status == "ACTIVE" },
            pausedCount = allSips.count { it.status == "PAUSED" },
            cancelledCount = allSips.count { it.status == "CANCELLED" },
            totalMonthlyValue = totalMonthlyValue
        )

        _uiState.value = SipListUiState.Success(filtered, summary)
    }

    fun pauseSip(id: String) {
        if (_processingId.value != null) return
        viewModelScope.launch {
            _processingId.value = id
            when (val result = sipRepository.pauseSip(id)) {
                is ApiResult.Success -> {
                    _actionSuccess.value = "SIP paused"
                    loadSips()
                }
                is ApiResult.Error -> {
                    _actionError.value = result.message ?: "Failed to pause SIP"
                }
                else -> {}
            }
            _processingId.value = null
        }
    }

    fun resumeSip(id: String) {
        if (_processingId.value != null) return
        viewModelScope.launch {
            _processingId.value = id
            when (val result = sipRepository.resumeSip(id)) {
                is ApiResult.Success -> {
                    _actionSuccess.value = "SIP resumed"
                    loadSips()
                }
                is ApiResult.Error -> {
                    _actionError.value = result.message ?: "Failed to resume SIP"
                }
                else -> {}
            }
            _processingId.value = null
        }
    }

    fun cancelSip(id: String) {
        if (_processingId.value != null) return
        viewModelScope.launch {
            _processingId.value = id
            when (val result = sipRepository.cancelSip(id)) {
                is ApiResult.Success -> {
                    _actionSuccess.value = "SIP cancelled"
                    loadSips()
                }
                is ApiResult.Error -> {
                    _actionError.value = result.message ?: "Failed to cancel SIP"
                }
                else -> {}
            }
            _processingId.value = null
        }
    }

    fun clearActionError() { _actionError.value = null }
    fun clearActionSuccess() { _actionSuccess.value = null }

    fun refresh() {
        loadSips()
    }
}

sealed class SipListUiState {
    data object Loading : SipListUiState()
    data class Success(
        val sips: List<FASip>,
        val summary: SipSummary
    ) : SipListUiState()
    data class Error(val message: String) : SipListUiState()
}

data class SipSummary(
    val totalCount: Int,
    val activeCount: Int,
    val pausedCount: Int,
    val cancelledCount: Int,
    val totalMonthlyValue: Double
)

enum class SipFilter(val label: String) {
    All("All"),
    Active("Active"),
    Paused("Paused"),
    Cancelled("Cancelled")
}
