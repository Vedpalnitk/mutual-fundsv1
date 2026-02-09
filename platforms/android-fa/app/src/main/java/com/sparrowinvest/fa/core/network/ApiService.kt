package com.sparrowinvest.fa.core.network

import com.sparrowinvest.fa.data.model.*
import retrofit2.Response
import retrofit2.http.*

interface ApiService {

    // Auth endpoints
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>

    @POST("auth/logout")
    suspend fun logout(): Response<Unit>

    // Client endpoints
    @GET("clients")
    suspend fun getClients(): Response<ApiResponse<List<Client>>>

    @GET("clients/{id}")
    suspend fun getClient(@Path("id") id: String): Response<ClientDetail>

    @POST("clients")
    suspend fun createClient(@Body client: CreateClientRequest): Response<Client>

    @PUT("clients/{id}")
    suspend fun updateClient(@Path("id") id: String, @Body client: UpdateClientRequest): Response<Client>

    // Transaction endpoints
    @GET("transactions")
    suspend fun getTransactions(
        @Query("status") status: String? = null,
        @Query("clientId") clientId: String? = null
    ): Response<ApiResponse<List<FATransaction>>>

    @POST("transactions/lumpsum")
    suspend fun executeBuy(@Body request: ExecuteTradeRequest): Response<FATransaction>

    @POST("transactions/redemption")
    suspend fun executeSell(@Body request: ExecuteTradeRequest): Response<FATransaction>

    @PUT("transactions/{id}/status")
    suspend fun updateTransactionStatus(
        @Path("id") id: String,
        @Body request: UpdateStatusRequest
    ): Response<FATransaction>

    // SIP endpoints
    @GET("sips")
    suspend fun getSips(
        @Query("clientId") clientId: String? = null,
        @Query("status") status: String? = null,
        @Query("limit") limit: Int? = null
    ): Response<PaginatedSipsResponse>

    @POST("sips")
    suspend fun createSip(@Body sip: CreateSipRequest): Response<FASip>

    @POST("sips/{id}/pause")
    suspend fun pauseSip(@Path("id") id: String): Response<FASip>

    @POST("sips/{id}/resume")
    suspend fun resumeSip(@Path("id") id: String): Response<FASip>

    @POST("sips/{id}/cancel")
    suspend fun cancelSip(@Path("id") id: String): Response<FASip>

    // Fund endpoints
    @GET("funds/live/search")
    suspend fun searchFunds(@Query("q") query: String): Response<List<Fund>>

    @GET("funds/live/{schemeCode}")
    suspend fun getFundDetails(@Path("schemeCode") schemeCode: Int): Response<FundDetail>

    @GET("funds/live/category/{category}")
    suspend fun getFundsByCategory(@Path("category") category: String): Response<List<Fund>>

    // Market endpoints
    @GET("market/indices")
    suspend fun getMarketIndices(): Response<List<MarketIndex>>

    // Dashboard/KPI endpoints
    @GET("advisor/dashboard")
    suspend fun getDashboard(): Response<FADashboard>

    @GET("advisor/insights")
    suspend fun getInsights(): Response<FAInsights>

    // AI endpoints
    @POST("classify/blended")
    suspend fun classifyPortfolio(@Body request: ClassifyRequest): Response<ClassifyResponse>

    @POST("recommendations/blended")
    suspend fun getRecommendations(@Body request: RecommendationsRequest): Response<RecommendationsResponse>

    // Avya Chat endpoints
    @POST("chat/sessions")
    suspend fun createChatSession(@Body request: CreateSessionRequest): Response<ChatSession>

    @GET("chat/sessions/{sessionId}/messages")
    suspend fun getChatHistory(@Path("sessionId") sessionId: String): Response<List<ChatHistoryMessage>>

    @POST("chat/messages")
    suspend fun sendChatMessage(@Body request: SendMessageRequest): Response<ChatMessageResponse>

    @GET("chat/messages/{messageId}/status")
    suspend fun getChatMessageStatus(@Path("messageId") messageId: String): Response<ChatMessageStatus>
}
