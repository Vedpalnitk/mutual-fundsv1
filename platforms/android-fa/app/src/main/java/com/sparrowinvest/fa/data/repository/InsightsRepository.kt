package com.sparrowinvest.fa.data.repository

import com.sparrowinvest.fa.core.network.ApiResult
import com.sparrowinvest.fa.core.network.ApiService
import com.sparrowinvest.fa.data.model.ClassifyRequest
import com.sparrowinvest.fa.data.model.ClassifyResponse
import com.sparrowinvest.fa.data.model.HoldingInput
import com.sparrowinvest.fa.data.model.RecommendationsRequest
import com.sparrowinvest.fa.data.model.RecommendationsResponse
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class InsightsRepository @Inject constructor(
    private val apiService: ApiService
) {

    suspend fun classifyPortfolio(
        holdings: List<HoldingInput>,
        riskProfile: String? = null
    ): ApiResult<ClassifyResponse> = withContext(Dispatchers.IO) {
        try {
            val request = ClassifyRequest(holdings = holdings, riskProfile = riskProfile)
            val response = apiService.classifyPortfolio(request)
            if (response.isSuccessful) {
                response.body()?.let {
                    ApiResult.success(it)
                } ?: ApiResult.error("Empty response")
            } else {
                ApiResult.error(
                    response.errorBody()?.string() ?: "Classification failed",
                    response.code()
                )
            }
        } catch (e: Exception) {
            ApiResult.error(e.message ?: "Network error", exception = e)
        }
    }

    suspend fun getRecommendations(
        riskProfile: String,
        investmentAmount: Double,
        investmentHorizon: String,
        goals: List<String> = emptyList(),
        existingHoldings: List<HoldingInput> = emptyList()
    ): ApiResult<RecommendationsResponse> = withContext(Dispatchers.IO) {
        try {
            val request = RecommendationsRequest(
                riskProfile = riskProfile,
                investmentAmount = investmentAmount,
                investmentHorizon = investmentHorizon,
                goals = goals,
                existingHoldings = existingHoldings
            )
            val response = apiService.getRecommendations(request)
            if (response.isSuccessful) {
                response.body()?.let {
                    ApiResult.success(it)
                } ?: ApiResult.error("Empty response")
            } else {
                ApiResult.error(
                    response.errorBody()?.string() ?: "Recommendations failed",
                    response.code()
                )
            }
        } catch (e: Exception) {
            ApiResult.error(e.message ?: "Network error", exception = e)
        }
    }
}
