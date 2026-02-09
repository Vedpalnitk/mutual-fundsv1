package com.sparrowinvest.fa.ui.transactions

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sparrowinvest.fa.core.network.ApiResult
import com.sparrowinvest.fa.data.model.FATransaction
import com.sparrowinvest.fa.data.repository.TransactionRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class TransactionDetailViewModel @Inject constructor(
    private val transactionRepository: TransactionRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<TransactionDetailUiState>(TransactionDetailUiState.Loading)
    val uiState: StateFlow<TransactionDetailUiState> = _uiState.asStateFlow()

    private val _actionState = MutableStateFlow<ActionState>(ActionState.Idle)
    val actionState: StateFlow<ActionState> = _actionState.asStateFlow()

    fun loadTransaction(transactionId: String) {
        viewModelScope.launch {
            _uiState.value = TransactionDetailUiState.Loading
            when (val result = transactionRepository.getTransactions()) {
                is ApiResult.Success -> {
                    val transaction = result.data.find { it.id == transactionId }
                    if (transaction != null) {
                        _uiState.value = TransactionDetailUiState.Success(transaction)
                    } else {
                        _uiState.value = TransactionDetailUiState.Error("Transaction not found")
                    }
                }
                is ApiResult.Error -> {
                    _uiState.value = TransactionDetailUiState.Error(result.message)
                }
                else -> {}
            }
        }
    }

    fun approveTransaction(id: String) {
        viewModelScope.launch {
            _actionState.value = ActionState.Loading
            when (val result = transactionRepository.approveTransaction(id)) {
                is ApiResult.Success -> {
                    _actionState.value = ActionState.Success("Transaction approved")
                    _uiState.value = TransactionDetailUiState.Success(result.data)
                }
                is ApiResult.Error -> {
                    _actionState.value = ActionState.Error(result.message)
                }
                else -> {}
            }
        }
    }

    fun rejectTransaction(id: String, notes: String? = null) {
        viewModelScope.launch {
            _actionState.value = ActionState.Loading
            when (val result = transactionRepository.rejectTransaction(id, notes)) {
                is ApiResult.Success -> {
                    _actionState.value = ActionState.Success("Transaction rejected")
                    _uiState.value = TransactionDetailUiState.Success(result.data)
                }
                is ApiResult.Error -> {
                    _actionState.value = ActionState.Error(result.message)
                }
                else -> {}
            }
        }
    }

    fun executeTransaction(id: String) {
        viewModelScope.launch {
            _actionState.value = ActionState.Loading
            when (val result = transactionRepository.executeTransaction(id)) {
                is ApiResult.Success -> {
                    _actionState.value = ActionState.Success("Transaction executed")
                    _uiState.value = TransactionDetailUiState.Success(result.data)
                }
                is ApiResult.Error -> {
                    _actionState.value = ActionState.Error(result.message)
                }
                else -> {}
            }
        }
    }

    fun clearActionState() {
        _actionState.value = ActionState.Idle
    }
}

sealed class TransactionDetailUiState {
    data object Loading : TransactionDetailUiState()
    data class Success(val transaction: FATransaction) : TransactionDetailUiState()
    data class Error(val message: String) : TransactionDetailUiState()
}

sealed class ActionState {
    data object Idle : ActionState()
    data object Loading : ActionState()
    data class Success(val message: String) : ActionState()
    data class Error(val message: String) : ActionState()
}
