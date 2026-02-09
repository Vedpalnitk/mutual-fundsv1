package com.sparrowinvest.fa.ui.clients

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sparrowinvest.fa.core.network.ApiResult
import com.sparrowinvest.fa.data.model.ClientDetail
import com.sparrowinvest.fa.data.repository.ClientRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ClientDetailViewModel @Inject constructor(
    private val clientRepository: ClientRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<ClientDetailUiState>(ClientDetailUiState.Loading)
    val uiState: StateFlow<ClientDetailUiState> = _uiState.asStateFlow()

    fun loadClient(clientId: String) {
        viewModelScope.launch {
            _uiState.value = ClientDetailUiState.Loading
            when (val result = clientRepository.getClient(clientId)) {
                is ApiResult.Success -> {
                    _uiState.value = ClientDetailUiState.Success(result.data)
                }
                is ApiResult.Error -> {
                    _uiState.value = ClientDetailUiState.Error(result.message)
                }
                else -> {}
            }
        }
    }
}

sealed class ClientDetailUiState {
    data object Loading : ClientDetailUiState()
    data class Success(val client: ClientDetail) : ClientDetailUiState()
    data class Error(val message: String) : ClientDetailUiState()
}
