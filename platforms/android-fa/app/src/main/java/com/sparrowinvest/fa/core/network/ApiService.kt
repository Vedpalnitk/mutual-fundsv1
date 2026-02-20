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

    @GET("auth/me")
    suspend fun getMe(): Response<MeResponse>

    // Client endpoints
    @GET("clients")
    suspend fun getClients(): Response<ApiResponse<List<Client>>>

    @GET("clients/{id}")
    suspend fun getClient(@Path("id") id: String): Response<ClientDetail>

    @POST("clients")
    suspend fun createClient(@Body client: CreateClientRequest): Response<Client>

    @PUT("clients/{id}")
    suspend fun updateClient(@Path("id") id: String, @Body client: UpdateClientRequest): Response<Client>

    // Portfolio endpoints
    @GET("portfolio/clients/{clientId}/allocation")
    suspend fun getAssetAllocation(@Path("clientId") clientId: String): Response<List<AssetAllocationItem>>

    @GET("portfolio/clients/{clientId}/history")
    suspend fun getPortfolioHistory(
        @Path("clientId") clientId: String,
        @Query("period") period: String = "1Y"
    ): Response<List<PortfolioHistoryPoint>>

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

    @POST("transactions/lumpsum")
    suspend fun createTransaction(@Body request: CreateTransactionRequest): Response<FATransaction>

    @POST("transactions/redemption")
    suspend fun createRedemption(@Body request: CreateTransactionRequest): Response<FATransaction>

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

    @GET("funds/live/{schemeCode}/nav-history")
    suspend fun getFundNavHistory(@Path("schemeCode") schemeCode: Int): Response<List<NavHistoryPoint>>

    @GET("funds/live/category/{category}")
    suspend fun getFundsByCategory(@Path("category") category: String): Response<List<Fund>>

    // Meeting Notes endpoints
    @GET("clients/{clientId}/notes")
    suspend fun getClientNotes(@Path("clientId") clientId: String): Response<List<MeetingNote>>

    @POST("clients/{clientId}/notes")
    suspend fun createNote(@Path("clientId") clientId: String, @Body request: CreateNoteRequest): Response<MeetingNote>

    @DELETE("clients/{clientId}/notes/{noteId}")
    suspend fun deleteNote(@Path("clientId") clientId: String, @Path("noteId") noteId: String): Response<Unit>

    // Whitelisted Funds endpoints
    @GET("advisor/whitelist")
    suspend fun getWhitelistedFunds(): Response<List<WhitelistedFund>>

    @POST("advisor/whitelist")
    suspend fun addToWhitelist(@Body request: AddToWhitelistRequest): Response<WhitelistedFund>

    @DELETE("advisor/whitelist/{id}")
    suspend fun removeFromWhitelist(@Path("id") id: String): Response<Unit>

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

    // Notification endpoints
    @GET("notifications/preferences")
    suspend fun getNotificationPreferences(): Response<NotificationPreferences>

    @PUT("notifications/preferences")
    suspend fun updateNotificationPreferences(@Body request: UpdatePreferencesRequest): Response<NotificationPreferences>

    @GET("notifications/logs")
    suspend fun getNotificationLogs(
        @Query("limit") limit: Int = 50,
        @Query("offset") offset: Int = 0
    ): Response<NotificationLogsResponse>

    // Communication endpoints
    @GET("communications/templates")
    suspend fun getCommunicationTemplates(): Response<List<CommunicationTemplate>>

    @POST("communications/preview")
    suspend fun previewCommunication(@Body request: PreviewCommunicationRequest): Response<CommunicationPreview>

    @POST("communications/send")
    suspend fun sendCommunication(@Body request: SendCommunicationRequest): Response<CommunicationSendResult>

    @GET("communications/history")
    suspend fun getCommunicationHistory(
        @Query("clientId") clientId: String? = null,
        @Query("channel") channel: String? = null,
        @Query("type") type: String? = null,
        @Query("page") page: Int? = null,
        @Query("limit") limit: Int? = null
    ): Response<PaginatedCommunicationResponse>

    @GET("communications/history/stats")
    suspend fun getCommunicationStats(): Response<CommunicationStats>

    @POST("communications/send-bulk")
    suspend fun sendBulkCommunication(@Body request: BulkSendRequest): Response<BulkSendResult>

    // Insurance endpoints
    @GET("clients/{clientId}/insurance")
    suspend fun getInsurancePolicies(@Path("clientId") clientId: String): Response<List<InsurancePolicy>>

    @POST("clients/{clientId}/insurance")
    suspend fun createInsurancePolicy(@Path("clientId") clientId: String, @Body request: CreateInsurancePolicyRequest): Response<InsurancePolicy>

    @PUT("clients/{clientId}/insurance/{id}")
    suspend fun updateInsurancePolicy(@Path("clientId") clientId: String, @Path("id") id: String, @Body request: CreateInsurancePolicyRequest): Response<InsurancePolicy>

    @DELETE("clients/{clientId}/insurance/{id}")
    suspend fun deleteInsurancePolicy(@Path("clientId") clientId: String, @Path("id") id: String): Response<Unit>

    @GET("clients/{clientId}/insurance/gap-analysis")
    suspend fun getGapAnalysis(
        @Path("clientId") clientId: String,
        @Query("annualIncome") annualIncome: Double? = null,
        @Query("age") age: Int? = null,
        @Query("familySize") familySize: Int? = null
    ): Response<GapAnalysisResponse>

    // Premium payment endpoints
    @POST("clients/{clientId}/insurance/{policyId}/payments")
    suspend fun recordPremiumPayment(
        @Path("clientId") clientId: String,
        @Path("policyId") policyId: String,
        @Body request: RecordPremiumPaymentRequest
    ): Response<PremiumPayment>

    @GET("clients/{clientId}/insurance/{policyId}/payments")
    suspend fun getPaymentHistory(
        @Path("clientId") clientId: String,
        @Path("policyId") policyId: String
    ): Response<List<PremiumPayment>>

    // Policy document endpoints
    @Multipart
    @POST("clients/{clientId}/insurance/{policyId}/documents")
    suspend fun uploadPolicyDocument(
        @Path("clientId") clientId: String,
        @Path("policyId") policyId: String,
        @Part file: okhttp3.MultipartBody.Part
    ): Response<PolicyDocument>

    @GET("clients/{clientId}/insurance/{policyId}/documents")
    suspend fun getPolicyDocuments(
        @Path("clientId") clientId: String,
        @Path("policyId") policyId: String
    ): Response<List<PolicyDocument>>

    @GET("clients/{clientId}/insurance/{policyId}/documents/{docId}/download")
    suspend fun getDocumentDownloadUrl(
        @Path("clientId") clientId: String,
        @Path("policyId") policyId: String,
        @Path("docId") docId: String
    ): Response<DocumentDownloadResponse>

    @DELETE("clients/{clientId}/insurance/{policyId}/documents/{docId}")
    suspend fun deletePolicyDocument(
        @Path("clientId") clientId: String,
        @Path("policyId") policyId: String,
        @Path("docId") docId: String
    ): Response<Unit>
}
