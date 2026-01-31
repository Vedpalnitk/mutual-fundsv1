package com.sparrowinvest.app.core.network

import com.sparrowinvest.app.data.model.ClassifyRequest
import com.sparrowinvest.app.data.model.ClassifyResponse
import com.sparrowinvest.app.data.model.Fund
import com.sparrowinvest.app.data.model.FundDetail
import com.sparrowinvest.app.data.model.Goal
import com.sparrowinvest.app.data.model.LoginRequest
import com.sparrowinvest.app.data.model.LoginResponse
import com.sparrowinvest.app.data.model.MyTradeRequest
import com.sparrowinvest.app.data.model.Portfolio
import com.sparrowinvest.app.data.model.PortfolioResponse
import com.sparrowinvest.app.data.model.RecommendationsRequest
import com.sparrowinvest.app.data.model.RecommendationsResponse
import com.sparrowinvest.app.data.model.RegisterRequest
import com.sparrowinvest.app.data.model.RegisterResponse
import com.sparrowinvest.app.data.model.TradeRequest
import com.sparrowinvest.app.data.model.TradeRequestResponse
import com.sparrowinvest.app.data.model.User
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path
import retrofit2.http.Query

interface ApiService {

    // Auth endpoints
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>

    @POST("auth/register")
    suspend fun register(@Body request: RegisterRequest): Response<RegisterResponse>

    @POST("auth/refresh")
    suspend fun refreshToken(): Response<LoginResponse>

    @POST("auth/logout")
    suspend fun logout(): Response<Unit>

    // User endpoints
    @GET("users/me")
    suspend fun getCurrentUser(): Response<User>

    @PUT("users/me")
    suspend fun updateUser(@Body user: User): Response<User>

    // Funds endpoints (public)
    @GET("funds/live/search")
    suspend fun searchFunds(@Query("q") query: String): Response<List<Fund>>

    @GET("funds/live/popular")
    suspend fun getPopularFunds(): Response<List<Fund>>

    @GET("funds/live/{schemeCode}")
    suspend fun getFundDetails(@Path("schemeCode") schemeCode: Int): Response<FundDetail>

    @GET("funds/live/category/{category}")
    suspend fun getFundsByCategory(@Path("category") category: String): Response<List<Fund>>

    // Portfolio endpoints
    @GET("portfolio")
    suspend fun getPortfolio(): Response<Portfolio>

    @GET("portfolio/transactions")
    suspend fun getTransactions(): Response<List<com.sparrowinvest.app.data.model.Transaction>>

    // Portfolio with clientType and advisor info
    @GET("auth/me/portfolio")
    suspend fun getMyPortfolio(): Response<PortfolioResponse>

    // Trade request endpoints (for FA-managed clients)
    @POST("transactions/trade-request")
    suspend fun submitTradeRequest(@Body request: TradeRequest): Response<TradeRequestResponse>

    @GET("transactions/my-requests")
    suspend fun getMyTradeRequests(): Response<List<MyTradeRequest>>

    // Goals endpoints
    @GET("goals")
    suspend fun getGoals(): Response<List<Goal>>

    @GET("goals/{id}")
    suspend fun getGoal(@Path("id") id: String): Response<Goal>

    @POST("goals")
    suspend fun createGoal(@Body goal: Goal): Response<Goal>

    @PUT("goals/{id}")
    suspend fun updateGoal(@Path("id") id: String, @Body goal: Goal): Response<Goal>

    @DELETE("goals/{id}")
    suspend fun deleteGoal(@Path("id") id: String): Response<Unit>

    // AI endpoints (authenticated)
    @POST("classify/blended")
    suspend fun classifyPortfolio(@Body request: ClassifyRequest): Response<ClassifyResponse>

    @POST("recommendations/blended")
    suspend fun getRecommendations(@Body request: RecommendationsRequest): Response<RecommendationsResponse>
}
