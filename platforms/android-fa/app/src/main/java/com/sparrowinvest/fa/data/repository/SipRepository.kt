package com.sparrowinvest.fa.data.repository

import com.sparrowinvest.fa.core.network.ApiResult
import com.sparrowinvest.fa.core.network.ApiService
import com.sparrowinvest.fa.data.model.CreateSipRequest
import com.sparrowinvest.fa.data.model.FASip
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SipRepository @Inject constructor(
    private val apiService: ApiService
) {

    suspend fun getSips(clientId: String? = null, status: String? = null): ApiResult<List<FASip>> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getSips(clientId = clientId, status = status, limit = 100)
            if (response.isSuccessful) {
                response.body()?.let { paginated ->
                    ApiResult.success(paginated.data)
                } ?: ApiResult.success(emptyList())
            } else {
                ApiResult.error(
                    response.errorBody()?.string() ?: "Failed to fetch SIPs",
                    response.code()
                )
            }
        } catch (e: Exception) {
            ApiResult.error(e.message ?: "Network error", exception = e)
        }
    }

    suspend fun createSip(request: CreateSipRequest): ApiResult<FASip> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.createSip(request)
            if (response.isSuccessful) {
                response.body()?.let { sip ->
                    ApiResult.success(sip)
                } ?: ApiResult.error("Empty response")
            } else {
                ApiResult.error(
                    response.errorBody()?.string() ?: "Failed to create SIP",
                    response.code()
                )
            }
        } catch (e: Exception) {
            ApiResult.error(e.message ?: "Network error", exception = e)
        }
    }

    suspend fun pauseSip(id: String): ApiResult<FASip> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.pauseSip(id)
            if (response.isSuccessful) {
                response.body()?.let { sip ->
                    ApiResult.success(sip)
                } ?: ApiResult.error("Empty response")
            } else {
                ApiResult.error(
                    response.errorBody()?.string() ?: "Failed to pause SIP",
                    response.code()
                )
            }
        } catch (e: Exception) {
            ApiResult.error(e.message ?: "Network error", exception = e)
        }
    }

    suspend fun resumeSip(id: String): ApiResult<FASip> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.resumeSip(id)
            if (response.isSuccessful) {
                response.body()?.let { sip ->
                    ApiResult.success(sip)
                } ?: ApiResult.error("Empty response")
            } else {
                ApiResult.error(
                    response.errorBody()?.string() ?: "Failed to resume SIP",
                    response.code()
                )
            }
        } catch (e: Exception) {
            ApiResult.error(e.message ?: "Network error", exception = e)
        }
    }

    suspend fun cancelSip(id: String): ApiResult<FASip> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.cancelSip(id)
            if (response.isSuccessful) {
                response.body()?.let { sip ->
                    ApiResult.success(sip)
                } ?: ApiResult.error("Empty response")
            } else {
                ApiResult.error(
                    response.errorBody()?.string() ?: "Failed to cancel SIP",
                    response.code()
                )
            }
        } catch (e: Exception) {
            ApiResult.error(e.message ?: "Network error", exception = e)
        }
    }
}
