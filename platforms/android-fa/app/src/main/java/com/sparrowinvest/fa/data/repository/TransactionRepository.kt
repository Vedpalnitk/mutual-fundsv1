package com.sparrowinvest.fa.data.repository

import com.sparrowinvest.fa.core.network.ApiResult
import com.sparrowinvest.fa.core.network.ApiService
import com.sparrowinvest.fa.data.model.ApiResponse
import com.sparrowinvest.fa.data.model.ExecuteTradeRequest
import com.sparrowinvest.fa.data.model.FATransaction
import com.sparrowinvest.fa.data.model.UpdateStatusRequest
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TransactionRepository @Inject constructor(
    private val apiService: ApiService
) {

    suspend fun getTransactions(
        status: String? = null,
        clientId: String? = null
    ): ApiResult<List<FATransaction>> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getTransactions(status, clientId)
            if (response.isSuccessful) {
                response.body()?.let { apiResponse ->
                    ApiResult.success(apiResponse.data)
                } ?: ApiResult.success(emptyList())
            } else {
                ApiResult.error(
                    response.errorBody()?.string() ?: "Failed to fetch transactions",
                    response.code()
                )
            }
        } catch (e: Exception) {
            ApiResult.error(e.message ?: "Network error", exception = e)
        }
    }

    suspend fun getPendingTransactions(): ApiResult<List<FATransaction>> {
        return getTransactions(status = "PENDING")
    }

    suspend fun executeBuy(request: ExecuteTradeRequest): ApiResult<FATransaction> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.executeBuy(request)
            if (response.isSuccessful) {
                response.body()?.let { transaction ->
                    ApiResult.success(transaction)
                } ?: ApiResult.error("Empty response")
            } else {
                ApiResult.error(
                    response.errorBody()?.string() ?: "Failed to execute buy",
                    response.code()
                )
            }
        } catch (e: Exception) {
            ApiResult.error(e.message ?: "Network error", exception = e)
        }
    }

    suspend fun executeSell(request: ExecuteTradeRequest): ApiResult<FATransaction> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.executeSell(request)
            if (response.isSuccessful) {
                response.body()?.let { transaction ->
                    ApiResult.success(transaction)
                } ?: ApiResult.error("Empty response")
            } else {
                ApiResult.error(
                    response.errorBody()?.string() ?: "Failed to execute sell",
                    response.code()
                )
            }
        } catch (e: Exception) {
            ApiResult.error(e.message ?: "Network error", exception = e)
        }
    }

    suspend fun updateTransactionStatus(
        id: String,
        status: String,
        notes: String? = null
    ): ApiResult<FATransaction> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.updateTransactionStatus(id, UpdateStatusRequest(status, notes))
            if (response.isSuccessful) {
                response.body()?.let { transaction ->
                    ApiResult.success(transaction)
                } ?: ApiResult.error("Empty response")
            } else {
                ApiResult.error(
                    response.errorBody()?.string() ?: "Failed to update transaction",
                    response.code()
                )
            }
        } catch (e: Exception) {
            ApiResult.error(e.message ?: "Network error", exception = e)
        }
    }

    suspend fun approveTransaction(id: String, notes: String? = null): ApiResult<FATransaction> {
        return updateTransactionStatus(id, "APPROVED", notes)
    }

    suspend fun rejectTransaction(id: String, notes: String? = null): ApiResult<FATransaction> {
        return updateTransactionStatus(id, "REJECTED", notes)
    }

    suspend fun executeTransaction(id: String, notes: String? = null): ApiResult<FATransaction> {
        return updateTransactionStatus(id, "EXECUTED", notes)
    }
}
