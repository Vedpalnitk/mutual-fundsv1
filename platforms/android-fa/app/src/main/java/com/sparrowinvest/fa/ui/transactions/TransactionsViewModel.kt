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
class TransactionsViewModel @Inject constructor(
    private val transactionRepository: TransactionRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<TransactionsUiState>(TransactionsUiState.Loading)
    val uiState: StateFlow<TransactionsUiState> = _uiState.asStateFlow()

    private val _selectedFilter = MutableStateFlow(TransactionFilter.All)
    val selectedFilter: StateFlow<TransactionFilter> = _selectedFilter.asStateFlow()

    private val _actionError = MutableStateFlow<String?>(null)
    val actionError: StateFlow<String?> = _actionError.asStateFlow()

    private val _actionSuccess = MutableStateFlow<String?>(null)
    val actionSuccess: StateFlow<String?> = _actionSuccess.asStateFlow()

    private val _processingTransactionId = MutableStateFlow<String?>(null)
    val processingTransactionId: StateFlow<String?> = _processingTransactionId.asStateFlow()

    private var allTransactions: List<FATransaction> = emptyList()

    init {
        loadTransactions()
    }

    fun loadTransactions() {
        viewModelScope.launch {
            _uiState.value = TransactionsUiState.Loading
            when (val result = transactionRepository.getTransactions()) {
                is ApiResult.Success -> {
                    allTransactions = result.data
                    applyFilter()
                }
                is ApiResult.Error -> {
                    _uiState.value = TransactionsUiState.Error(result.message)
                }
                else -> {}
            }
        }
    }

    fun setFilter(filter: TransactionFilter) {
        _selectedFilter.value = filter
        applyFilter()
    }

    private fun applyFilter() {
        val filter = _selectedFilter.value
        val filtered = when (filter) {
            TransactionFilter.All -> allTransactions
            TransactionFilter.Pending -> allTransactions.filter { it.status == "Pending" }
            TransactionFilter.Executed -> allTransactions.filter { it.status == "Completed" }
            TransactionFilter.Rejected -> allTransactions.filter { it.status == "Failed" || it.status == "Cancelled" }
        }

        val summary = TransactionSummary(
            total = allTransactions.size,
            pending = allTransactions.count { it.status == "Pending" || it.status == "Processing" },
            executed = allTransactions.count { it.status == "Completed" },
            rejected = allTransactions.count { it.status == "Failed" || it.status == "Cancelled" },
            totalValue = allTransactions.sumOf { it.amount },
            pendingValue = allTransactions.filter { it.status == "Pending" || it.status == "Processing" }.sumOf { it.amount }
        )

        _uiState.value = TransactionsUiState.Success(filtered, summary)
    }

    fun approveTransaction(id: String) {
        if (_processingTransactionId.value != null) return
        viewModelScope.launch {
            _processingTransactionId.value = id
            when (val result = transactionRepository.executeTransaction(id)) {
                is ApiResult.Success -> {
                    _actionSuccess.value = "Transaction approved successfully"
                    loadTransactions()
                }
                is ApiResult.Error -> {
                    _actionError.value = result.message ?: "Failed to approve transaction"
                }
                else -> {}
            }
            _processingTransactionId.value = null
        }
    }

    fun rejectTransaction(id: String) {
        if (_processingTransactionId.value != null) return
        viewModelScope.launch {
            _processingTransactionId.value = id
            when (val result = transactionRepository.rejectTransaction(id)) {
                is ApiResult.Success -> {
                    _actionSuccess.value = "Transaction rejected"
                    loadTransactions()
                }
                is ApiResult.Error -> {
                    _actionError.value = result.message ?: "Failed to reject transaction"
                }
                else -> {}
            }
            _processingTransactionId.value = null
        }
    }

    fun clearActionError() {
        _actionError.value = null
    }

    fun clearActionSuccess() {
        _actionSuccess.value = null
    }

    fun refresh() {
        loadTransactions()
    }
}

sealed class TransactionsUiState {
    data object Loading : TransactionsUiState()
    data class Success(
        val transactions: List<FATransaction>,
        val summary: TransactionSummary
    ) : TransactionsUiState()
    data class Error(val message: String) : TransactionsUiState()
}

data class TransactionSummary(
    val total: Int,
    val pending: Int,
    val executed: Int,
    val rejected: Int,
    val totalValue: Double,
    val pendingValue: Double
)

enum class TransactionFilter(val label: String) {
    All("All"),
    Pending("Pending"),
    Executed("Executed"),
    Rejected("Rejected")
}
