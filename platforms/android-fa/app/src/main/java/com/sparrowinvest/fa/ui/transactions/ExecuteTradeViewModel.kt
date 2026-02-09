package com.sparrowinvest.fa.ui.transactions

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sparrowinvest.fa.core.network.ApiResult
import com.sparrowinvest.fa.data.model.ClientDetail
import com.sparrowinvest.fa.data.model.ExecuteTradeRequest
import com.sparrowinvest.fa.data.model.Fund
import com.sparrowinvest.fa.data.repository.ClientRepository
import com.sparrowinvest.fa.data.repository.FundsRepository
import com.sparrowinvest.fa.data.repository.TransactionRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ExecuteTradeViewModel @Inject constructor(
    private val clientRepository: ClientRepository,
    private val fundsRepository: FundsRepository,
    private val transactionRepository: TransactionRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(ExecuteTradeUiState())
    val uiState: StateFlow<ExecuteTradeUiState> = _uiState.asStateFlow()

    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    private val _searchResults = MutableStateFlow<List<Fund>>(emptyList())
    val searchResults: StateFlow<List<Fund>> = _searchResults.asStateFlow()

    private var searchJob: Job? = null

    fun loadClient(clientId: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoadingClient = true) }
            when (val result = clientRepository.getClient(clientId)) {
                is ApiResult.Success -> {
                    _uiState.update {
                        it.copy(isLoadingClient = false, client = result.data, clientId = clientId)
                    }
                }
                is ApiResult.Error -> {
                    _uiState.update { it.copy(isLoadingClient = false, error = result.message) }
                }
                else -> {}
            }
        }
    }

    fun setSearchQuery(query: String) {
        _searchQuery.value = query
        searchJob?.cancel()
        if (query.length >= 3) {
            searchJob = viewModelScope.launch {
                delay(300)
                when (val result = fundsRepository.searchFunds(query)) {
                    is ApiResult.Success -> _searchResults.value = result.data
                    else -> _searchResults.value = emptyList()
                }
            }
        } else {
            _searchResults.value = emptyList()
        }
    }

    fun selectFund(fund: Fund) {
        _uiState.update {
            it.copy(
                selectedFund = fund,
                schemeCode = fund.schemeCode.toString()
            )
        }
        _searchQuery.value = fund.schemeName
        _searchResults.value = emptyList()
    }

    fun clearFund() {
        _uiState.update { it.copy(selectedFund = null, schemeCode = "") }
        _searchQuery.value = ""
    }

    fun updateAmount(amount: String) {
        _uiState.update { it.copy(amount = amount, amountError = null) }
    }

    fun updateTradeType(type: TradeType) {
        _uiState.update { it.copy(tradeType = type) }
    }

    fun updateNotes(notes: String) {
        _uiState.update { it.copy(notes = notes) }
    }

    fun clearError() {
        _uiState.update { it.copy(error = null) }
    }

    private fun validate(): Boolean {
        var isValid = true
        val state = _uiState.value

        if (state.selectedFund == null) {
            _uiState.update { it.copy(error = "Please select a fund") }
            isValid = false
        }
        val amount = state.amount.toDoubleOrNull()
        if (amount == null || amount <= 0) {
            _uiState.update { it.copy(amountError = "Enter a valid amount") }
            isValid = false
        }

        return isValid
    }

    fun executeTrade(onSuccess: () -> Unit) {
        if (!validate()) return

        viewModelScope.launch {
            _uiState.update { it.copy(isSubmitting = true, error = null) }

            val state = _uiState.value
            val request = ExecuteTradeRequest(
                clientId = state.clientId,
                schemeCode = state.schemeCode,
                amount = state.amount.toDouble(),
                notes = state.notes.takeIf { it.isNotBlank() }
            )

            val result = when (state.tradeType) {
                TradeType.BUY -> transactionRepository.executeBuy(request)
                TradeType.SELL -> transactionRepository.executeSell(request)
            }

            when (result) {
                is ApiResult.Success -> {
                    _uiState.update { it.copy(isSubmitting = false, isSuccess = true) }
                    onSuccess()
                }
                is ApiResult.Error -> {
                    _uiState.update { it.copy(isSubmitting = false, error = result.message) }
                }
                else -> {
                    _uiState.update { it.copy(isSubmitting = false, error = "Unexpected error") }
                }
            }
        }
    }
}

data class ExecuteTradeUiState(
    val clientId: String = "",
    val client: ClientDetail? = null,
    val isLoadingClient: Boolean = false,
    val tradeType: TradeType = TradeType.BUY,
    val selectedFund: Fund? = null,
    val schemeCode: String = "",
    val amount: String = "",
    val amountError: String? = null,
    val notes: String = "",
    val isSubmitting: Boolean = false,
    val isSuccess: Boolean = false,
    val error: String? = null
)

enum class TradeType(val label: String) {
    BUY("Buy"),
    SELL("Sell")
}
