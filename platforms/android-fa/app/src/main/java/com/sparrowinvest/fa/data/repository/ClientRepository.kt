package com.sparrowinvest.fa.data.repository

import com.sparrowinvest.fa.core.network.ApiResult
import com.sparrowinvest.fa.core.network.ApiService
import com.sparrowinvest.fa.data.model.ApiResponse
import com.sparrowinvest.fa.data.model.Client
import com.sparrowinvest.fa.data.model.ClientDetail
import com.sparrowinvest.fa.data.model.CreateClientRequest
import com.sparrowinvest.fa.data.model.UpdateClientRequest
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ClientRepository @Inject constructor(
    private val apiService: ApiService
) {

    suspend fun getClients(): ApiResult<List<Client>> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getClients()
            if (response.isSuccessful) {
                response.body()?.let { apiResponse ->
                    ApiResult.success(apiResponse.data)
                } ?: ApiResult.success(emptyList())
            } else {
                ApiResult.error(
                    response.errorBody()?.string() ?: "Failed to fetch clients",
                    response.code()
                )
            }
        } catch (e: Exception) {
            ApiResult.error(e.message ?: "Network error", exception = e)
        }
    }

    suspend fun getClient(id: String): ApiResult<ClientDetail> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getClient(id)
            if (response.isSuccessful) {
                response.body()?.let { client ->
                    ApiResult.success(client)
                } ?: ApiResult.notFound("Client not found")
            } else {
                when (response.code()) {
                    404 -> ApiResult.notFound("Client not found")
                    else -> ApiResult.error(
                        response.errorBody()?.string() ?: "Failed to fetch client",
                        response.code()
                    )
                }
            }
        } catch (e: Exception) {
            ApiResult.error(e.message ?: "Network error", exception = e)
        }
    }

    suspend fun createClient(request: CreateClientRequest): ApiResult<Client> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.createClient(request)
            if (response.isSuccessful) {
                response.body()?.let { client ->
                    ApiResult.success(client)
                } ?: ApiResult.error("Empty response")
            } else {
                ApiResult.error(
                    response.errorBody()?.string() ?: "Failed to create client",
                    response.code()
                )
            }
        } catch (e: Exception) {
            ApiResult.error(e.message ?: "Network error", exception = e)
        }
    }

    suspend fun updateClient(id: String, request: UpdateClientRequest): ApiResult<Client> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.updateClient(id, request)
            if (response.isSuccessful) {
                response.body()?.let { client ->
                    ApiResult.success(client)
                } ?: ApiResult.error("Empty response")
            } else {
                ApiResult.error(
                    response.errorBody()?.string() ?: "Failed to update client",
                    response.code()
                )
            }
        } catch (e: Exception) {
            ApiResult.error(e.message ?: "Network error", exception = e)
        }
    }
}
