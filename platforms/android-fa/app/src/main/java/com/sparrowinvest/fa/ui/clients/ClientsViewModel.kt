package com.sparrowinvest.fa.ui.clients

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sparrowinvest.fa.core.network.ApiResult
import com.sparrowinvest.fa.data.model.Client
import com.sparrowinvest.fa.data.repository.ClientRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ClientsViewModel @Inject constructor(
    private val clientRepository: ClientRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<ClientsUiState>(ClientsUiState.Loading)
    val uiState: StateFlow<ClientsUiState> = _uiState.asStateFlow()

    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    private val _selectedFilter = MutableStateFlow<ClientFilter>(ClientFilter.All)
    val selectedFilter: StateFlow<ClientFilter> = _selectedFilter.asStateFlow()

    private var allClients: List<Client> = emptyList()

    init {
        loadClients()
    }

    fun loadClients() {
        viewModelScope.launch {
            _uiState.value = ClientsUiState.Loading
            when (val result = clientRepository.getClients()) {
                is ApiResult.Success -> {
                    allClients = result.data
                    applyFilters()
                }
                is ApiResult.Error -> {
                    _uiState.value = ClientsUiState.Error(result.message)
                }
                else -> {}
            }
        }
    }

    fun setSearchQuery(query: String) {
        _searchQuery.value = query
        applyFilters()
    }

    fun setFilter(filter: ClientFilter) {
        _selectedFilter.value = filter
        applyFilters()
    }

    private fun applyFilters() {
        val query = _searchQuery.value.lowercase()
        val filter = _selectedFilter.value

        val filtered = allClients.filter { client ->
            val matchesSearch = query.isEmpty() ||
                    client.name.lowercase().contains(query) ||
                    client.email.lowercase().contains(query) ||
                    (client.phone?.contains(query) == true)

            val matchesFilter = when (filter) {
                ClientFilter.All -> true
                ClientFilter.HighAum -> client.aum >= 1000000
                ClientFilter.ActiveSip -> client.sipCount > 0
                ClientFilter.PendingKyc -> client.kycStatus != "VERIFIED"
            }

            matchesSearch && matchesFilter
        }

        _uiState.value = ClientsUiState.Success(
            clients = filtered,
            totalAum = allClients.sumOf { it.aum },
            sortedBy = SortOption.AumHigh
        )
    }

    fun sortClients(option: SortOption) {
        val currentState = _uiState.value
        if (currentState is ClientsUiState.Success) {
            val sorted = when (option) {
                SortOption.NameAsc -> currentState.clients.sortedBy { it.name }
                SortOption.NameDesc -> currentState.clients.sortedByDescending { it.name }
                SortOption.AumHigh -> currentState.clients.sortedByDescending { it.aum }
                SortOption.AumLow -> currentState.clients.sortedBy { it.aum }
                SortOption.ReturnsHigh -> currentState.clients.sortedByDescending { it.returns }
            }
            _uiState.value = currentState.copy(clients = sorted, sortedBy = option)
        }
    }

    fun refresh() {
        loadClients()
    }
}

sealed class ClientsUiState {
    data object Loading : ClientsUiState()
    data class Success(
        val clients: List<Client>,
        val totalAum: Double = 0.0,
        val sortedBy: SortOption = SortOption.AumHigh
    ) : ClientsUiState()
    data class Error(val message: String) : ClientsUiState()
}

enum class ClientFilter(val label: String) {
    All("All"),
    HighAum("High AUM"),
    ActiveSip("Active SIP"),
    PendingKyc("Pending KYC")
}

enum class SortOption(val label: String) {
    NameAsc("Name A-Z"),
    NameDesc("Name Z-A"),
    AumHigh("AUM High-Low"),
    AumLow("AUM Low-High"),
    ReturnsHigh("Returns High-Low")
}
