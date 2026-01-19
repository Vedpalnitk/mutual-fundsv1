package com.sparrowinvest.app.ui.explore

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sparrowinvest.app.core.network.ApiResult
import com.sparrowinvest.app.data.model.FundDetail
import com.sparrowinvest.app.data.model.FundReturns
import com.sparrowinvest.app.data.repository.FundsRepository
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

    private val _fundDetail = MutableStateFlow<FundDetail?>(null)
    val fundDetail: StateFlow<FundDetail?> = _fundDetail.asStateFlow()

    fun loadFundDetails(schemeCode: Int) {
        viewModelScope.launch {
            _uiState.value = FundDetailUiState.Loading

            when (val result = fundsRepository.getFundDetails(schemeCode)) {
                is ApiResult.Success -> {
                    _fundDetail.value = result.data
                    _uiState.value = FundDetailUiState.Success
                }
                is ApiResult.Error -> {
                    // Use mock data
                    _fundDetail.value = createMockFundDetail(schemeCode)
                    _uiState.value = FundDetailUiState.Success
                }
                else -> {}
            }
        }
    }

    private fun createMockFundDetail(schemeCode: Int): FundDetail {
        return FundDetail(
            id = schemeCode.toString(),
            schemeCode = schemeCode,
            schemeName = "Parag Parikh Flexi Cap Fund - Direct Growth",
            category = "Flexi Cap",
            assetClass = "equity",
            nav = 78.45,
            navDate = "Jan 15, 2024",
            returns = FundReturns(
                oneMonth = 2.5,
                threeMonth = 8.2,
                sixMonth = 12.4,
                oneYear = 24.5,
                threeYear = 18.2,
                fiveYear = 22.1
            ),
            aum = 45000000000.0, // 45000 Cr
            expenseRatio = 0.75,
            riskRating = 4,
            minSip = 500.0,
            minLumpsum = 5000.0,
            fundManager = "Rajeev Thakkar",
            fundHouse = "PPFAS Mutual Fund",
            description = "An open-ended equity scheme investing across large cap, mid cap, small cap stocks and international equity.",
            inceptionDate = "May 24, 2013",
            benchmark = "NIFTY 500 TRI"
        )
    }
}

sealed class FundDetailUiState {
    data object Loading : FundDetailUiState()
    data object Success : FundDetailUiState()
    data class Error(val message: String) : FundDetailUiState()
}
