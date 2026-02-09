package com.sparrowinvest.fa.ui.clients

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sparrowinvest.fa.core.network.ApiResult
import com.sparrowinvest.fa.data.model.AssetAllocationItem
import com.sparrowinvest.fa.data.model.ClientDetail
import com.sparrowinvest.fa.data.model.PortfolioHistoryPoint
import com.sparrowinvest.fa.data.repository.ClientRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ClientDetailViewModel @Inject constructor(
    private val clientRepository: ClientRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<ClientDetailUiState>(ClientDetailUiState.Loading)
    val uiState: StateFlow<ClientDetailUiState> = _uiState.asStateFlow()

    private val _allocationState = MutableStateFlow<List<AssetAllocationItem>>(emptyList())
    val allocationState: StateFlow<List<AssetAllocationItem>> = _allocationState.asStateFlow()

    private val _historyState = MutableStateFlow<List<PortfolioHistoryPoint>>(emptyList())
    val historyState: StateFlow<List<PortfolioHistoryPoint>> = _historyState.asStateFlow()

    private val _selectedPeriod = MutableStateFlow("1Y")
    val selectedPeriod: StateFlow<String> = _selectedPeriod.asStateFlow()

    private var currentClientId: String? = null

    fun loadClient(clientId: String) {
        currentClientId = clientId
        viewModelScope.launch {
            _uiState.value = ClientDetailUiState.Loading
            when (val result = clientRepository.getClient(clientId)) {
                is ApiResult.Success -> {
                    _uiState.value = ClientDetailUiState.Success(result.data)
                }
                is ApiResult.Error -> {
                    _uiState.value = ClientDetailUiState.Error(result.message)
                }
                else -> {}
            }
        }
        loadAllocation(clientId)
        loadHistory(clientId, _selectedPeriod.value)
    }

    fun onPeriodChange(period: String) {
        _selectedPeriod.value = period
        currentClientId?.let { loadHistory(it, period) }
    }

    private fun loadAllocation(clientId: String) {
        viewModelScope.launch {
            when (val result = clientRepository.getAssetAllocation(clientId)) {
                is ApiResult.Success -> {
                    _allocationState.value = result.data
                }
                is ApiResult.Error -> {
                    _allocationState.value = emptyList()
                }
                else -> {}
            }
        }
    }

    private fun loadHistory(clientId: String, period: String) {
        viewModelScope.launch {
            when (val result = clientRepository.getPortfolioHistory(clientId, period)) {
                is ApiResult.Success -> {
                    _historyState.value = result.data
                }
                is ApiResult.Error -> {
                    _historyState.value = emptyList()
                }
                else -> {}
            }
        }
    }
}

sealed class ClientDetailUiState {
    data object Loading : ClientDetailUiState()
    data class Success(val client: ClientDetail) : ClientDetailUiState()
    data class Error(val message: String) : ClientDetailUiState()
}
