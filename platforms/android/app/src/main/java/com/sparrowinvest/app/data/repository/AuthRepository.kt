package com.sparrowinvest.app.data.repository

import com.sparrowinvest.app.core.network.ApiResult
import com.sparrowinvest.app.core.network.ApiService
import com.sparrowinvest.app.core.storage.PreferencesManager
import com.sparrowinvest.app.core.storage.TokenManager
import com.sparrowinvest.app.data.model.LoginRequest
import com.sparrowinvest.app.data.model.LoginResponse
import com.sparrowinvest.app.data.model.RegisterRequest
import com.sparrowinvest.app.data.model.RegisterResponse
import com.sparrowinvest.app.data.model.User
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
    private val preferencesManager: PreferencesManager
) {
    private val _isAuthenticated = MutableStateFlow(
        (tokenManager.hasToken() && preferencesManager.isAuthenticated) || preferencesManager.isGuestUser
    )
    val isAuthenticated: StateFlow<Boolean> = _isAuthenticated.asStateFlow()

    private val _isGuestUser = MutableStateFlow(preferencesManager.isGuestUser)
    val isGuestUser: StateFlow<Boolean> = _isGuestUser.asStateFlow()

    private val _currentUser = MutableStateFlow(preferencesManager.getUser())
    val currentUser: StateFlow<User?> = _currentUser.asStateFlow()

    val hasCompletedOnboarding: Boolean
        get() = preferencesManager.hasCompletedOnboarding

    fun setOnboardingCompleted() {
        preferencesManager.hasCompletedOnboarding = true
    }

    fun continueAsGuest() {
        preferencesManager.isGuestUser = true
        preferencesManager.isAuthenticated = true
        preferencesManager.hasCompletedOnboarding = true
        _isGuestUser.value = true
        _isAuthenticated.value = true
        _currentUser.value = null
    }

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

    suspend fun register(
        name: String,
        email: String,
        password: String
    ): ApiResult<RegisterResponse> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.register(
                RegisterRequest(name, email, password)
            )
            if (response.isSuccessful) {
                response.body()?.let { registerResponse ->
                    // Save tokens
                    tokenManager.saveTokens(
                        accessToken = registerResponse.accessToken,
                        refreshToken = registerResponse.refreshToken,
                        expiryTime = registerResponse.expiresIn?.let {
                            System.currentTimeMillis() + (it * 1000)
                        }
                    )

                    // Save user
                    registerResponse.user?.let { user ->
                        preferencesManager.saveUser(user)
                        _currentUser.value = user
                    }

                    // Update auth state
                    preferencesManager.isAuthenticated = true
                    _isAuthenticated.value = true

                    ApiResult.success(registerResponse)
                } ?: ApiResult.error("Empty response")
            } else {
                ApiResult.error(
                    response.errorBody()?.string() ?: "Registration failed",
                    response.code()
                )
            }
        } catch (e: Exception) {
            ApiResult.error(e.message ?: "Network error", exception = e)
        }
    }

    suspend fun getCurrentUser(): ApiResult<User> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getCurrentUser()
            if (response.isSuccessful) {
                response.body()?.let { user ->
                    preferencesManager.saveUser(user)
                    _currentUser.value = user
                    ApiResult.success(user)
                } ?: ApiResult.error("Empty response")
            } else {
                when (response.code()) {
                    401 -> {
                        logout()
                        ApiResult.unauthorized()
                    }
                    else -> ApiResult.error("Failed to get user", response.code())
                }
            }
        } catch (e: Exception) {
            ApiResult.error(e.message ?: "Network error", exception = e)
        }
    }

    suspend fun logout() {
        withContext(Dispatchers.IO) {
            try {
                if (!_isGuestUser.value) {
                    apiService.logout()
                }
            } catch (_: Exception) {
                // Ignore errors, continue with local logout
            }
        }
        tokenManager.clearTokens()
        preferencesManager.clearAll()
        _currentUser.value = null
        _isGuestUser.value = false
        _isAuthenticated.value = false
    }

    fun restoreAuthState() {
        val hasToken = tokenManager.hasToken()
        val isAuth = preferencesManager.isAuthenticated
        val isGuest = preferencesManager.isGuestUser
        _isGuestUser.value = isGuest
        _isAuthenticated.value = (hasToken && isAuth) || isGuest
        _currentUser.value = preferencesManager.getUser()
    }
}
