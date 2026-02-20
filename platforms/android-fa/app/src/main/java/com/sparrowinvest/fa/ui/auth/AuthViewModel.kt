package com.sparrowinvest.fa.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sparrowinvest.fa.core.network.ApiResult
import com.sparrowinvest.fa.data.model.AdvisorProfile
import com.sparrowinvest.fa.data.model.FAUser
import com.sparrowinvest.fa.data.repository.AuthRepository
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
    val currentUser: StateFlow<FAUser?> = authRepository.currentUser
    val advisorProfile: StateFlow<AdvisorProfile?> = authRepository.advisorProfile

    private val _loginState = MutableStateFlow<LoginState>(LoginState.Idle)
    val loginState: StateFlow<LoginState> = _loginState.asStateFlow()

    fun login(email: String, password: String) {
        viewModelScope.launch {
            _loginState.value = LoginState.Loading
            when (val result = authRepository.login(email, password)) {
                is ApiResult.Success -> {
                    _loginState.value = LoginState.Success
                }
                is ApiResult.Error -> {
                    _loginState.value = LoginState.Error(result.message)
                }
                is ApiResult.Loading -> {
                    _loginState.value = LoginState.Loading
                }
            }
        }
    }

    fun logout() {
        viewModelScope.launch {
            authRepository.logout()
            _loginState.value = LoginState.Idle
        }
    }

    fun resetLoginState() {
        _loginState.value = LoginState.Idle
    }
}

sealed class LoginState {
    data object Idle : LoginState()
    data object Loading : LoginState()
    data object Success : LoginState()
    data class Error(val message: String) : LoginState()
}
