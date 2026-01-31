package com.sparrowinvest.app.data.repository

import com.sparrowinvest.app.core.network.ApiResult
import com.sparrowinvest.app.core.network.ApiService
import com.sparrowinvest.app.data.model.AdvisorInfo
import com.sparrowinvest.app.data.model.ClassifyRequest
import com.sparrowinvest.app.data.model.ClassifyResponse
import com.sparrowinvest.app.data.model.ClientType
import com.sparrowinvest.app.data.model.MyTradeRequest
import com.sparrowinvest.app.data.model.Portfolio
import com.sparrowinvest.app.data.model.PortfolioResponse
import com.sparrowinvest.app.data.model.RecommendationsRequest
import com.sparrowinvest.app.data.model.RecommendationsResponse
import com.sparrowinvest.app.data.model.TradeRequest
import com.sparrowinvest.app.data.model.TradeRequestResponse
import com.sparrowinvest.app.data.model.Transaction
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class PortfolioRepository @Inject constructor(
    private val apiService: ApiService
) {
    // Client type state (self-service or managed by FA)
    private val _clientType = MutableStateFlow(ClientType.SELF)
    val clientType: StateFlow<ClientType> = _clientType.asStateFlow()

    // Advisor info for managed clients
    private val _advisor = MutableStateFlow<AdvisorInfo?>(null)
    val advisor: StateFlow<AdvisorInfo?> = _advisor.asStateFlow()

    // Full portfolio response with all data
    private val _portfolioResponse = MutableStateFlow<PortfolioResponse?>(null)
    val portfolioResponse: StateFlow<PortfolioResponse?> = _portfolioResponse.asStateFlow()

    /**
     * Check if the current user is managed by a Financial Advisor
     */
    val isManagedClient: Boolean
        get() = _clientType.value == ClientType.MANAGED || _advisor.value != null

    /**
     * Get portfolio with clientType and advisor information
     * This is the main endpoint to use for determining user type
     */
    suspend fun getMyPortfolio(): ApiResult<PortfolioResponse> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getMyPortfolio()
            if (response.isSuccessful) {
                response.body()?.let { portfolioResponse ->
                    // Update state
                    _portfolioResponse.value = portfolioResponse
                    _clientType.value = ClientType.fromString(portfolioResponse.clientType)
                    _advisor.value = portfolioResponse.advisor
                    ApiResult.success(portfolioResponse)
                } ?: ApiResult.error("Empty response")
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

    /**
     * Clear user type state (call on logout)
     */
    fun clearState() {
        _clientType.value = ClientType.SELF
        _advisor.value = null
        _portfolioResponse.value = null
    }

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

    // ==================== Trade Request Methods (for FA-managed clients) ====================

    /**
     * Submit a trade request to the Financial Advisor
     * Only available for managed clients
     */
    suspend fun submitTradeRequest(request: TradeRequest): ApiResult<TradeRequestResponse> =
        withContext(Dispatchers.IO) {
            try {
                val response = apiService.submitTradeRequest(request)
                if (response.isSuccessful) {
                    response.body()?.let {
                        ApiResult.success(it)
                    } ?: ApiResult.error("Empty response")
                } else {
                    when (response.code()) {
                        401 -> ApiResult.unauthorized()
                        403 -> ApiResult.error("Not authorized - must be a managed client")
                        else -> ApiResult.error("Failed to submit trade request", response.code())
                    }
                }
            } catch (e: Exception) {
                ApiResult.error(e.message ?: "Network error", exception = e)
            }
        }

    /**
     * Get user's trade request history
     * Only available for managed clients
     */
    suspend fun getMyTradeRequests(): ApiResult<List<MyTradeRequest>> =
        withContext(Dispatchers.IO) {
            try {
                val response = apiService.getMyTradeRequests()
                if (response.isSuccessful) {
                    response.body()?.let {
                        ApiResult.success(it)
                    } ?: ApiResult.success(emptyList())
                } else {
                    when (response.code()) {
                        401 -> ApiResult.unauthorized()
                        else -> ApiResult.error("Failed to get trade requests", response.code())
                    }
                }
            } catch (e: Exception) {
                ApiResult.error(e.message ?: "Network error", exception = e)
            }
        }
}
