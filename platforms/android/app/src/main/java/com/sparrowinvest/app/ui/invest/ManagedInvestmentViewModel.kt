package com.sparrowinvest.app.ui.invest

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sparrowinvest.app.core.network.ApiResult
import com.sparrowinvest.app.data.model.AdvisorInfo
import com.sparrowinvest.app.data.model.Fund
import com.sparrowinvest.app.data.model.TradeRequest
import com.sparrowinvest.app.data.model.TradeRequestResponse
import com.sparrowinvest.app.data.model.TradeType
import com.sparrowinvest.app.data.repository.PortfolioRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

enum class InvestmentType(val displayName: String) {
    SIP("SIP"),
    ONE_TIME("One-time")
}

sealed class ManagedInvestmentUiState {
    data object Idle : ManagedInvestmentUiState()
    data object Submitting : ManagedInvestmentUiState()
    data class Success(val message: String) : ManagedInvestmentUiState()
    data class Error(val message: String) : ManagedInvestmentUiState()
}

@HiltViewModel
class ManagedInvestmentViewModel @Inject constructor(
    private val portfolioRepository: PortfolioRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<ManagedInvestmentUiState>(ManagedInvestmentUiState.Idle)
    val uiState: StateFlow<ManagedInvestmentUiState> = _uiState.asStateFlow()

    private val _investmentType = MutableStateFlow(InvestmentType.SIP)
    val investmentType: StateFlow<InvestmentType> = _investmentType.asStateFlow()

    private val _amount = MutableStateFlow("")
    val amount: StateFlow<String> = _amount.asStateFlow()

    private val _remarks = MutableStateFlow("")
    val remarks: StateFlow<String> = _remarks.asStateFlow()

    val advisor: StateFlow<AdvisorInfo?> = portfolioRepository.advisor

    fun setInvestmentType(type: InvestmentType) {
        _investmentType.value = type
    }

    fun setAmount(value: String) {
        // Only allow digits
        _amount.value = value.filter { it.isDigit() }
    }

    fun setRemarks(value: String) {
        _remarks.value = value
    }

    fun setQuickAmount(value: Int) {
        _amount.value = value.toString()
    }

    fun submitTradeRequest(fund: Fund) {
        val amountValue = _amount.value.toDoubleOrNull()
        if (amountValue == null || amountValue <= 0) {
            _uiState.value = ManagedInvestmentUiState.Error("Please enter a valid amount")
            return
        }

        _uiState.value = ManagedInvestmentUiState.Submitting

        viewModelScope.launch {
            val request = TradeRequest(
                fundName = fund.schemeName,
                fundSchemeCode = fund.schemeCode.toString(),
                fundCategory = fund.category,
                type = if (_investmentType.value == InvestmentType.SIP) TradeType.SIP else TradeType.BUY,
                amount = amountValue,
                remarks = _remarks.value.ifBlank { null }
            )

            when (val result = portfolioRepository.submitTradeRequest(request)) {
                is ApiResult.Success -> {
                    val response = result.data
                    val advisorName = advisor.value?.name ?: "your advisor"
                    val message = if (response.message.isNotBlank()) {
                        response.message
                    } else {
                        "Your investment request has been sent to $advisorName. You will receive confirmation once processed."
                    }
                    _uiState.value = ManagedInvestmentUiState.Success(message)
                }
                is ApiResult.Error -> {
                    _uiState.value = ManagedInvestmentUiState.Error(
                        result.message ?: "Failed to submit trade request. Please try again."
                    )
                }
            }
        }
    }

    fun resetState() {
        _uiState.value = ManagedInvestmentUiState.Idle
    }

    fun clearError() {
        if (_uiState.value is ManagedInvestmentUiState.Error) {
            _uiState.value = ManagedInvestmentUiState.Idle
        }
    }
}
