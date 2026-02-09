package com.sparrowinvest.fa.ui.funds

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sparrowinvest.fa.core.network.ApiResult
import com.sparrowinvest.fa.data.model.FundDetail
import com.sparrowinvest.fa.data.repository.FundsRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class FundDetailViewModel @Inject constructor(
    private val fundsRepository: FundsRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<FundDetailUiState>(FundDetailUiState.Loading)
    val uiState: StateFlow<FundDetailUiState> = _uiState.asStateFlow()

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
    }
}

sealed class FundDetailUiState {
    data object Loading : FundDetailUiState()
    data class Success(val fund: FundDetail) : FundDetailUiState()
    data class Error(val message: String) : FundDetailUiState()
}
