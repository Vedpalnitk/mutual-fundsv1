package com.sparrowinvest.app.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sparrowinvest.app.core.network.ApiResult
import com.sparrowinvest.app.data.model.User
import com.sparrowinvest.app.data.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {

    val isAuthenticated: StateFlow<Boolean> = authRepository.isAuthenticated
    val isGuestUser: StateFlow<Boolean> = authRepository.isGuestUser
    val currentUser: StateFlow<User?> = authRepository.currentUser

    private val _hasCompletedOnboarding = MutableStateFlow(authRepository.hasCompletedOnboarding)
    val hasCompletedOnboarding: StateFlow<Boolean> = _hasCompletedOnboarding.asStateFlow()

    private val _loginState = MutableStateFlow<AuthState>(AuthState.Idle)
    val loginState: StateFlow<AuthState> = _loginState.asStateFlow()

    private val _signupState = MutableStateFlow<AuthState>(AuthState.Idle)
    val signupState: StateFlow<AuthState> = _signupState.asStateFlow()

    init {
        authRepository.restoreAuthState()
    }

    fun setOnboardingCompleted() {
        authRepository.setOnboardingCompleted()
        _hasCompletedOnboarding.value = true
    }

    fun continueAsGuest() {
        authRepository.continueAsGuest()
        _hasCompletedOnboarding.value = true
    }

    fun login(email: String, password: String) {
        viewModelScope.launch {
            _loginState.value = AuthState.Loading

            when (val result = authRepository.login(email, password)) {
                is ApiResult.Success -> {
                    _loginState.value = AuthState.LoginSuccess(result.data.user)
                }
                is ApiResult.Error -> {
                    _loginState.value = AuthState.Error(result.message)
                }
                is ApiResult.Loading -> {
                    // Already handling loading state
                }
            }
        }
    }

    fun register(name: String, email: String, password: String) {
        viewModelScope.launch {
            _signupState.value = AuthState.Loading

            when (val result = authRepository.register(name, email, password)) {
                is ApiResult.Success -> {
                    _signupState.value = AuthState.SignupComplete(result.data.user)
                }
                is ApiResult.Error -> {
                    _signupState.value = AuthState.Error(result.message)
                }
                is ApiResult.Loading -> {
                    // Already handling loading state
                }
            }
        }
    }

    fun logout() {
        viewModelScope.launch {
            authRepository.logout()
            resetState()
        }
    }

    fun resetLoginState() {
        _loginState.value = AuthState.Idle
    }

    fun resetSignupState() {
        _signupState.value = AuthState.Idle
    }

    private fun resetState() {
        _loginState.value = AuthState.Idle
        _signupState.value = AuthState.Idle
    }
}

sealed class AuthState {
    data object Idle : AuthState()
    data object Loading : AuthState()
    data class LoginSuccess(val user: User?) : AuthState()
    data class SignupComplete(val user: User?) : AuthState()
    data class Error(val message: String) : AuthState()
}
