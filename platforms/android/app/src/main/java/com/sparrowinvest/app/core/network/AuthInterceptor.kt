package com.sparrowinvest.app.core.network

import com.sparrowinvest.app.core.storage.TokenManager
import okhttp3.Interceptor
import okhttp3.Response
import javax.inject.Inject

class AuthInterceptor @Inject constructor(
    private val tokenManager: TokenManager
) : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()

        // Skip auth header for public endpoints
        val path = originalRequest.url.encodedPath
        if (isPublicEndpoint(path)) {
            return chain.proceed(originalRequest)
        }

        val token = tokenManager.getAccessToken()

        return if (token != null) {
            val authenticatedRequest = originalRequest.newBuilder()
                .header("Authorization", "Bearer $token")
                .header("Content-Type", "application/json")
                .build()
            chain.proceed(authenticatedRequest)
        } else {
            chain.proceed(originalRequest)
        }
    }

    private fun isPublicEndpoint(path: String): Boolean {
        val publicEndpoints = listOf(
            "/api/v1/auth/login",
            "/api/v1/auth/register",
            "/api/v1/auth/verify-otp",
            "/api/v1/funds/live/search",
            "/api/v1/funds/live/popular"
        )
        return publicEndpoints.any { path.contains(it) }
    }
}
