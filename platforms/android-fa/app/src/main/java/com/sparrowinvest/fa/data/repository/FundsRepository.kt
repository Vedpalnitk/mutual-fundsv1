package com.sparrowinvest.fa.data.repository

import com.sparrowinvest.fa.core.network.ApiResult
import com.sparrowinvest.fa.core.network.ApiService
import com.sparrowinvest.fa.data.model.Fund
import com.sparrowinvest.fa.data.model.FundDetail
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
                response.body()?.let { funds ->
                    ApiResult.success(funds)
                } ?: ApiResult.success(emptyList())
            } else {
                ApiResult.error(
                    response.errorBody()?.string() ?: "Failed to search funds",
                    response.code()
                )
            }
        } catch (e: Exception) {
            ApiResult.error(e.message ?: "Network error", exception = e)
        }
    }

    suspend fun getFundDetails(schemeCode: Int): ApiResult<FundDetail> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getFundDetails(schemeCode)
            if (response.isSuccessful) {
                response.body()?.let { fund ->
                    ApiResult.success(fund)
                } ?: ApiResult.notFound("Fund not found")
            } else {
                when (response.code()) {
                    404 -> ApiResult.notFound("Fund not found")
                    else -> ApiResult.error(
                        response.errorBody()?.string() ?: "Failed to fetch fund details",
                        response.code()
                    )
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
                response.body()?.let { funds ->
                    ApiResult.success(funds)
                } ?: ApiResult.success(emptyList())
            } else {
                ApiResult.error(
                    response.errorBody()?.string() ?: "Failed to fetch funds",
                    response.code()
                )
            }
        } catch (e: Exception) {
            ApiResult.error(e.message ?: "Network error", exception = e)
        }
    }
}
