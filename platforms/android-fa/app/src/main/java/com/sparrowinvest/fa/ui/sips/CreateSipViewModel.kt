package com.sparrowinvest.fa.ui.sips

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sparrowinvest.fa.core.network.ApiResult
import com.sparrowinvest.fa.data.model.ClientDetail
import com.sparrowinvest.fa.data.model.CreateSipRequest
import com.sparrowinvest.fa.data.model.Fund
import com.sparrowinvest.fa.data.repository.ClientRepository
import com.sparrowinvest.fa.data.repository.FundsRepository
import com.sparrowinvest.fa.data.repository.SipRepository
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
class CreateSipViewModel @Inject constructor(
    private val clientRepository: ClientRepository,
    private val fundsRepository: FundsRepository,
    private val sipRepository: SipRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(CreateSipUiState())
    val uiState: StateFlow<CreateSipUiState> = _uiState.asStateFlow()

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
        _uiState.update { it.copy(selectedFund = fund) }
        _searchQuery.value = fund.schemeName
        _searchResults.value = emptyList()
    }

    fun clearFund() {
        _uiState.update { it.copy(selectedFund = null) }
        _searchQuery.value = ""
    }

    fun updateAmount(amount: String) {
        _uiState.update { it.copy(amount = amount, amountError = null) }
    }

    fun updateFrequency(frequency: String) {
        _uiState.update { it.copy(frequency = frequency) }
    }

    fun updateSipDate(date: Int) {
        _uiState.update { it.copy(sipDate = date) }
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

    fun createSip(onSuccess: () -> Unit) {
        if (!validate()) return

        viewModelScope.launch {
            _uiState.update { it.copy(isSubmitting = true, error = null) }

            val state = _uiState.value
            val request = CreateSipRequest(
                clientId = state.clientId,
                schemeCode = state.selectedFund!!.schemeCode,
                amount = state.amount.toDouble(),
                frequency = state.frequency,
                sipDate = state.sipDate
            )

            when (val result = sipRepository.createSip(request)) {
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

data class CreateSipUiState(
    val clientId: String = "",
    val client: ClientDetail? = null,
    val isLoadingClient: Boolean = false,
    val selectedFund: Fund? = null,
    val amount: String = "",
    val amountError: String? = null,
    val frequency: String = "MONTHLY",
    val sipDate: Int = 1,
    val isSubmitting: Boolean = false,
    val isSuccess: Boolean = false,
    val error: String? = null
)
