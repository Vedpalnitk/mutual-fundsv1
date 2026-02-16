package com.sparrowinvest.fa.data.repository

import com.sparrowinvest.fa.core.network.ApiResult
import com.sparrowinvest.fa.core.network.ApiService
import com.sparrowinvest.fa.data.model.AddToWhitelistRequest
import com.sparrowinvest.fa.data.model.WhitelistedFund
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class WhitelistRepository @Inject constructor(
    private val apiService: ApiService
) {

    suspend fun getWhitelistedFunds(): ApiResult<List<WhitelistedFund>> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getWhitelistedFunds()
            if (response.isSuccessful) {
                response.body()?.let { funds ->
                    ApiResult.success(funds)
                } ?: ApiResult.success(emptyList())
            } else {
                ApiResult.error(
                    response.errorBody()?.string() ?: "Failed to fetch whitelisted funds",
                    response.code()
                )
            }
        } catch (e: Exception) {
            ApiResult.error(e.message ?: "Network error", exception = e)
        }
    }

    suspend fun addToWhitelist(request: AddToWhitelistRequest): ApiResult<WhitelistedFund> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.addToWhitelist(request)
            if (response.isSuccessful) {
                response.body()?.let { fund ->
                    ApiResult.success(fund)
                } ?: ApiResult.error("Empty response")
            } else {
                ApiResult.error(
                    response.errorBody()?.string() ?: "Failed to add fund to whitelist",
                    response.code()
                )
            }
        } catch (e: Exception) {
            ApiResult.error(e.message ?: "Network error", exception = e)
        }
    }

    suspend fun removeFromWhitelist(id: String): ApiResult<Unit> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.removeFromWhitelist(id)
            if (response.isSuccessful) {
                ApiResult.success(Unit)
            } else {
                ApiResult.error(
                    response.errorBody()?.string() ?: "Failed to remove fund from whitelist",
                    response.code()
                )
            }
        } catch (e: Exception) {
            ApiResult.error(e.message ?: "Network error", exception = e)
        }
    }
}
