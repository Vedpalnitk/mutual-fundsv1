package com.sparrowinvest.app.data.repository

import com.sparrowinvest.app.core.network.ApiResult
import com.sparrowinvest.app.core.network.ApiService
import com.sparrowinvest.app.data.model.ClassifyRequest
import com.sparrowinvest.app.data.model.ClassifyResponse
import com.sparrowinvest.app.data.model.Portfolio
import com.sparrowinvest.app.data.model.RecommendationsRequest
import com.sparrowinvest.app.data.model.RecommendationsResponse
import com.sparrowinvest.app.data.model.Transaction
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class PortfolioRepository @Inject constructor(
    private val apiService: ApiService
) {
    suspend fun getPortfolio(): ApiResult<Portfolio> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getPortfolio()
            if (response.isSuccessful) {
                response.body()?.let {
                    ApiResult.success(it)
                } ?: ApiResult.success(Portfolio())
            } else {
                when (response.code()) {
                    401 -> ApiResult.unauthorized()
                    else -> ApiResult.error("Failed to get portfolio", response.code())
                }
            }
        } catch (e: Exception) {
            ApiResult.error(e.message ?: "Network error", exception = e)
        }
    }

    suspend fun getTransactions(): ApiResult<List<Transaction>> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getTransactions()
            if (response.isSuccessful) {
                response.body()?.let {
                    ApiResult.success(it)
                } ?: ApiResult.success(emptyList())
            } else {
                when (response.code()) {
                    401 -> ApiResult.unauthorized()
                    else -> ApiResult.error("Failed to get transactions", response.code())
                }
            }
        } catch (e: Exception) {
            ApiResult.error(e.message ?: "Network error", exception = e)
        }
    }

    suspend fun classifyPortfolio(request: ClassifyRequest): ApiResult<ClassifyResponse> =
        withContext(Dispatchers.IO) {
            try {
                val response = apiService.classifyPortfolio(request)
                if (response.isSuccessful) {
                    response.body()?.let {
                        ApiResult.success(it)
                    } ?: ApiResult.error("Empty response")
                } else {
                    when (response.code()) {
                        401 -> ApiResult.unauthorized()
                        else -> ApiResult.error("Failed to classify portfolio", response.code())
                    }
                }
            } catch (e: Exception) {
                ApiResult.error(e.message ?: "Network error", exception = e)
            }
        }

    suspend fun getRecommendations(request: RecommendationsRequest): ApiResult<RecommendationsResponse> =
        withContext(Dispatchers.IO) {
            try {
                val response = apiService.getRecommendations(request)
                if (response.isSuccessful) {
                    response.body()?.let {
                        ApiResult.success(it)
                    } ?: ApiResult.error("Empty response")
                } else {
                    when (response.code()) {
                        401 -> ApiResult.unauthorized()
                        else -> ApiResult.error("Failed to get recommendations", response.code())
                    }
                }
            } catch (e: Exception) {
                ApiResult.error(e.message ?: "Network error", exception = e)
            }
        }
}
