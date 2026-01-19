package com.sparrowinvest.app.data.repository

import com.sparrowinvest.app.core.network.ApiResult
import com.sparrowinvest.app.core.network.ApiService
import com.sparrowinvest.app.data.model.Fund
import com.sparrowinvest.app.data.model.FundDetail
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class FundsRepository @Inject constructor(
    private val apiService: ApiService
) {
    suspend fun searchFunds(query: String): ApiResult<List<Fund>> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.searchFunds(query)
            if (response.isSuccessful) {
                response.body()?.let {
                    ApiResult.success(it)
                } ?: ApiResult.success(emptyList())
            } else {
                ApiResult.error("Search failed", response.code())
            }
        } catch (e: Exception) {
            ApiResult.error(e.message ?: "Network error", exception = e)
        }
    }

    suspend fun getPopularFunds(): ApiResult<List<Fund>> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getPopularFunds()
            if (response.isSuccessful) {
                response.body()?.let {
                    ApiResult.success(it)
                } ?: ApiResult.success(emptyList())
            } else {
                ApiResult.error("Failed to get popular funds", response.code())
            }
        } catch (e: Exception) {
            ApiResult.error(e.message ?: "Network error", exception = e)
        }
    }

    suspend fun getFundDetails(schemeCode: Int): ApiResult<FundDetail> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getFundDetails(schemeCode)
            if (response.isSuccessful) {
                response.body()?.let {
                    ApiResult.success(it)
                } ?: ApiResult.error("Fund not found")
            } else {
                when (response.code()) {
                    404 -> ApiResult.notFound("Fund not found")
                    else -> ApiResult.error("Failed to get fund details", response.code())
                }
            }
        } catch (e: Exception) {
            ApiResult.error(e.message ?: "Network error", exception = e)
        }
    }

    suspend fun getFundsByCategory(category: String): ApiResult<List<Fund>> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getFundsByCategory(category)
            if (response.isSuccessful) {
                response.body()?.let {
                    ApiResult.success(it)
                } ?: ApiResult.success(emptyList())
            } else {
                ApiResult.error("Failed to get funds by category", response.code())
            }
        } catch (e: Exception) {
            ApiResult.error(e.message ?: "Network error", exception = e)
        }
    }
}
