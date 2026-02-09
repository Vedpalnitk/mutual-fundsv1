package com.sparrowinvest.fa.ui.clients

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sparrowinvest.fa.core.network.ApiResult
import com.sparrowinvest.fa.data.model.UpdateClientRequest
import com.sparrowinvest.fa.data.repository.ClientRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class EditClientViewModel @Inject constructor(
    private val clientRepository: ClientRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(EditClientUiState())
    val uiState: StateFlow<EditClientUiState> = _uiState.asStateFlow()

    fun loadClient(clientId: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoadingClient = true) }
            when (val result = clientRepository.getClient(clientId)) {
                is ApiResult.Success -> {
                    val client = result.data
                    _uiState.update {
                        it.copy(
                            isLoadingClient = false,
                            clientId = client.id,
                            name = client.name,
                            email = client.email,
                            phone = client.phone ?: "",
                            panNumber = client.panNumber ?: "",
                            riskProfile = client.riskProfile ?: "",
                            address = client.address ?: ""
                        )
                    }
                }
                is ApiResult.Error -> {
                    _uiState.update { it.copy(isLoadingClient = false, error = result.message) }
                }
                else -> {}
            }
        }
    }

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
        val state = _uiState.value

        if (state.name.isBlank()) {
            _uiState.update { it.copy(nameError = "Name is required") }
            isValid = false
        }
        if (state.email.isBlank()) {
            _uiState.update { it.copy(emailError = "Email is required") }
            isValid = false
        } else if (!android.util.Patterns.EMAIL_ADDRESS.matcher(state.email).matches()) {
            _uiState.update { it.copy(emailError = "Invalid email format") }
            isValid = false
        }

        // Phone validation — Indian mobile: 10 digits starting with 6-9
        if (state.phone.isNotBlank()) {
            val cleaned = state.phone.replace("[\\s-]".toRegex(), "")
            if (cleaned.length != 10 || !cleaned.matches("^[6-9]\\d{9}$".toRegex())) {
                _uiState.update { it.copy(phoneError = "Enter a valid 10-digit Indian mobile number") }
                isValid = false
            }
        }

        // PAN validation — force uppercase before checking
        if (state.panNumber.isNotBlank()) {
            val pan = state.panNumber.uppercase()
            val panRegex = Regex("^[A-Z]{5}[0-9]{4}[A-Z]$")
            if (!panRegex.matches(pan)) {
                _uiState.update { it.copy(panError = "Invalid PAN format (e.g., ABCDE1234F)") }
                isValid = false
            }
        }

        return isValid
    }

    fun saveClient(onSuccess: () -> Unit) {
        if (!validate()) return

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }

            val state = _uiState.value
            val request = UpdateClientRequest(
                name = state.name.trim(),
                email = state.email.trim().lowercase(),
                phone = state.phone.takeIf { it.isNotBlank() }?.trim(),
                panNumber = state.panNumber.takeIf { it.isNotBlank() }?.trim(),
                riskProfile = state.riskProfile.takeIf { it.isNotBlank() },
                address = state.address.takeIf { it.isNotBlank() }?.trim()
            )

            when (val result = clientRepository.updateClient(state.clientId, request)) {
                is ApiResult.Success -> {
                    _uiState.update { it.copy(isLoading = false, isSuccess = true) }
                    onSuccess()
                }
                is ApiResult.Error -> {
                    _uiState.update { it.copy(isLoading = false, error = result.message) }
                }
                else -> {
                    _uiState.update { it.copy(isLoading = false, error = "Unexpected error") }
                }
            }
        }
    }
}

data class EditClientUiState(
    val clientId: String = "",
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
    val isLoadingClient: Boolean = false,
    val isLoading: Boolean = false,
    val isSuccess: Boolean = false,
    val error: String? = null
)
