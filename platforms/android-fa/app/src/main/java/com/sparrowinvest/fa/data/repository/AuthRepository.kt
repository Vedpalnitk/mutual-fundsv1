package com.sparrowinvest.fa.data.repository

import com.sparrowinvest.fa.core.network.ApiResult
import com.sparrowinvest.fa.core.network.ApiService
import com.sparrowinvest.fa.core.storage.PreferencesManager
import com.sparrowinvest.fa.core.storage.TokenManager
import com.sparrowinvest.fa.data.model.AdvisorProfile
import com.sparrowinvest.fa.data.model.FAUser
import com.sparrowinvest.fa.data.model.LoginRequest
import com.sparrowinvest.fa.data.model.LoginResponse
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepository @Inject constructor(
    private val apiService: ApiService,
    private val tokenManager: TokenManager,
    private val preferencesManager: PreferencesManager,
    private val chatRepository: ChatRepository
) {
    private val _isAuthenticated = MutableStateFlow(
        tokenManager.hasToken() && preferencesManager.isAuthenticated
    )
    val isAuthenticated: StateFlow<Boolean> = _isAuthenticated.asStateFlow()

    private val _currentUser = MutableStateFlow(preferencesManager.getUser())
    val currentUser: StateFlow<FAUser?> = _currentUser.asStateFlow()

    private val _advisorProfile = MutableStateFlow(preferencesManager.getAdvisorProfile())
    val advisorProfile: StateFlow<AdvisorProfile?> = _advisorProfile.asStateFlow()

    suspend fun login(email: String, password: String): ApiResult<LoginResponse> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.login(LoginRequest(email, password))
            if (response.isSuccessful) {
                response.body()?.let { loginResponse ->
                    // Save tokens
                    tokenManager.saveTokens(
                        accessToken = loginResponse.accessToken,
                        refreshToken = loginResponse.refreshToken,
                        expiryTime = loginResponse.expiresIn?.let {
                            System.currentTimeMillis() + (it * 1000)
                        }
                    )

                    // Save user if present
                    loginResponse.user?.let { user ->
                        preferencesManager.saveUser(user)
                        _currentUser.value = user
                    }

                    // Update auth state
                    preferencesManager.isAuthenticated = true
                    _isAuthenticated.value = true

                    // Fetch advisor profile
                    fetchAdvisorProfile()

                    ApiResult.success(loginResponse)
                } ?: ApiResult.error("Empty response")
            } else {
                when (response.code()) {
                    401 -> ApiResult.unauthorized("Invalid email or password")
                    404 -> ApiResult.notFound("User not found")
                    else -> ApiResult.error(
                        response.errorBody()?.string() ?: "Login failed",
                        response.code()
                    )
                }
            }
        } catch (e: Exception) {
            ApiResult.error(e.message ?: "Network error", exception = e)
        }
    }

    suspend fun logout() {
        withContext(Dispatchers.IO) {
            try {
                apiService.logout()
            } catch (_: Exception) {
                // Ignore errors, continue with local logout
            }
        }
        tokenManager.clearTokens()
        preferencesManager.clearAll()
        _currentUser.value = null
        _advisorProfile.value = null
        _isAuthenticated.value = false
        // Clear chat data to prevent cross-user data leakage
        chatRepository.onUserLogout()
    }

    fun restoreAuthState() {
        val hasToken = tokenManager.hasToken()
        val isAuth = preferencesManager.isAuthenticated
        _isAuthenticated.value = hasToken && isAuth
        _currentUser.value = preferencesManager.getUser()
        _advisorProfile.value = preferencesManager.getAdvisorProfile()
    }

    private suspend fun fetchAdvisorProfile() {
        try {
            val response = apiService.getMe()
            if (response.isSuccessful) {
                response.body()?.advisorProfile?.let { profile ->
                    preferencesManager.saveAdvisorProfile(profile)
                    _advisorProfile.value = profile
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
