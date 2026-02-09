package com.sparrowinvest.fa.ui.clients

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sparrowinvest.fa.core.network.ApiResult
import com.sparrowinvest.fa.data.model.Client
import com.sparrowinvest.fa.data.model.CreateClientRequest
import com.sparrowinvest.fa.data.repository.ClientRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class AddClientViewModel @Inject constructor(
    private val clientRepository: ClientRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(AddClientUiState())
    val uiState: StateFlow<AddClientUiState> = _uiState.asStateFlow()

    fun updateName(name: String) {
        _uiState.update { it.copy(name = name, nameError = null) }
    }

    fun updateEmail(email: String) {
        _uiState.update { it.copy(email = email, emailError = null) }
    }

    fun updatePhone(phone: String) {
        _uiState.update { it.copy(phone = phone, phoneError = null) }
    }

    fun updatePanNumber(panNumber: String) {
        _uiState.update { it.copy(panNumber = panNumber.uppercase(), panError = null) }
    }

    fun updateRiskProfile(riskProfile: String) {
        _uiState.update { it.copy(riskProfile = riskProfile) }
    }

    fun updateAddress(address: String) {
        _uiState.update { it.copy(address = address) }
    }

    fun clearError() {
        _uiState.update { it.copy(error = null) }
    }

    private fun validate(): Boolean {
        var isValid = true
        val currentState = _uiState.value

        // Name validation
        if (currentState.name.isBlank()) {
            _uiState.update { it.copy(nameError = "Name is required") }
            isValid = false
        }

        // Email validation
        if (currentState.email.isBlank()) {
            _uiState.update { it.copy(emailError = "Email is required") }
            isValid = false
        } else if (!android.util.Patterns.EMAIL_ADDRESS.matcher(currentState.email).matches()) {
            _uiState.update { it.copy(emailError = "Invalid email format") }
            isValid = false
        }

        // Phone validation — Indian mobile: 10 digits starting with 6-9
        if (currentState.phone.isNotBlank()) {
            val cleaned = currentState.phone.replace("[\\s-]".toRegex(), "")
            if (cleaned.length != 10 || !cleaned.matches("^[6-9]\\d{9}$".toRegex())) {
                _uiState.update { it.copy(phoneError = "Enter a valid 10-digit Indian mobile number") }
                isValid = false
            }
        }

        // PAN validation — force uppercase before checking
        if (currentState.panNumber.isNotBlank()) {
            val pan = currentState.panNumber.uppercase()
            val panRegex = Regex("^[A-Z]{5}[0-9]{4}[A-Z]$")
            if (!panRegex.matches(pan)) {
                _uiState.update { it.copy(panError = "Invalid PAN format (e.g., ABCDE1234F)") }
                isValid = false
            }
        }

        // Risk profile mandatory for new clients
        if (currentState.riskProfile.isBlank()) {
            _uiState.update { it.copy(error = "Risk profile is required") }
            isValid = false
        }

        return isValid
    }

    fun createClient(onSuccess: (Client) -> Unit) {
        if (!validate()) return

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }

            val currentState = _uiState.value
            val request = CreateClientRequest(
                name = currentState.name.trim(),
                email = currentState.email.trim().lowercase(),
                phone = currentState.phone.takeIf { it.isNotBlank() }?.trim(),
                panNumber = currentState.panNumber.takeIf { it.isNotBlank() }?.trim(),
                riskProfile = currentState.riskProfile.takeIf { it.isNotBlank() },
                address = currentState.address.takeIf { it.isNotBlank() }?.trim()
            )

            when (val result = clientRepository.createClient(request)) {
                is ApiResult.Success -> {
                    _uiState.update { it.copy(isLoading = false, isSuccess = true) }
                    onSuccess(result.data)
                }
                is ApiResult.Error -> {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            error = result.message ?: "Failed to create client"
                        )
                    }
                }
                else -> {
                    _uiState.update {
                        it.copy(isLoading = false, error = "Unexpected error occurred")
                    }
                }
            }
        }
    }
}

data class AddClientUiState(
    val name: String = "",
    val email: String = "",
    val phone: String = "",
    val panNumber: String = "",
    val riskProfile: String = "",
    val address: String = "",
    val nameError: String? = null,
    val emailError: String? = null,
    val phoneError: String? = null,
    val panError: String? = null,
    val isLoading: Boolean = false,
    val isSuccess: Boolean = false,
    val error: String? = null
) {
    val isFormValid: Boolean
        get() = name.isNotBlank() && email.isNotBlank() && riskProfile.isNotBlank()
                && nameError == null && emailError == null && phoneError == null && panError == null
}

enum class RiskProfileOption(val label: String, val value: String) {
    CONSERVATIVE("Conservative", "CONSERVATIVE"),
    MODERATE("Moderate", "MODERATE"),
    AGGRESSIVE("Aggressive", "AGGRESSIVE");

    companion object {
        fun fromValue(value: String): RiskProfileOption? {
            return entries.find { it.value == value }
        }
    }
}
