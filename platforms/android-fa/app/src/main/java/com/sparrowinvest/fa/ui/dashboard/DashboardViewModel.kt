package com.sparrowinvest.fa.ui.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sparrowinvest.fa.core.network.ApiResult
import com.sparrowinvest.fa.core.network.ApiService
import com.sparrowinvest.fa.data.model.Client
import com.sparrowinvest.fa.data.model.FADashboard
import com.sparrowinvest.fa.data.model.FASip
import com.sparrowinvest.fa.data.model.FATransaction
import com.sparrowinvest.fa.data.model.MarketIndex
import com.sparrowinvest.fa.data.repository.ClientRepository
import com.sparrowinvest.fa.data.repository.SipRepository
import com.sparrowinvest.fa.data.repository.TransactionRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit
import javax.inject.Inject

@HiltViewModel
class DashboardViewModel @Inject constructor(
    private val clientRepository: ClientRepository,
    private val transactionRepository: TransactionRepository,
    private val sipRepository: SipRepository,
    private val apiService: ApiService
) : ViewModel() {

    private val _uiState = MutableStateFlow<DashboardUiState>(DashboardUiState.Loading)
    val uiState: StateFlow<DashboardUiState> = _uiState.asStateFlow()

    private val _clients = MutableStateFlow<List<Client>>(emptyList())
    val clients: StateFlow<List<Client>> = _clients.asStateFlow()

    private val _pendingTransactions = MutableStateFlow<List<FATransaction>>(emptyList())
    val pendingTransactions: StateFlow<List<FATransaction>> = _pendingTransactions.asStateFlow()

    private val _sips = MutableStateFlow<List<FASip>>(emptyList())
    val sips: StateFlow<List<FASip>> = _sips.asStateFlow()

    private val _breakdown = MutableStateFlow(DashboardBreakdown())
    val breakdown: StateFlow<DashboardBreakdown> = _breakdown.asStateFlow()

    init {
        loadDashboard()
    }

    fun loadDashboard() {
        viewModelScope.launch {
            _uiState.value = DashboardUiState.Loading

            // Load clients
            when (val clientsResult = clientRepository.getClients()) {
                is ApiResult.Success -> {
                    _clients.value = clientsResult.data
                }
                is ApiResult.Error -> {
                    _uiState.value = DashboardUiState.Error(clientsResult.message)
                    return@launch
                }
                else -> {}
            }

            // Load pending transactions
            when (val transactionsResult = transactionRepository.getPendingTransactions()) {
                is ApiResult.Success -> {
                    _pendingTransactions.value = transactionsResult.data
                }
                is ApiResult.Error -> {
                    _pendingTransactions.value = emptyList()
                }
                else -> {}
            }

            // Load SIPs for upcoming SIPs section
            when (val sipsResult = sipRepository.getSips()) {
                is ApiResult.Success -> {
                    _sips.value = sipsResult.data
                }
                is ApiResult.Error -> {
                    _sips.value = emptyList()
                }
                else -> {}
            }

            // Calculate KPIs
            val clients = _clients.value
            val totalAum = clients.sumOf { it.aum }
            val avgReturns = if (clients.isNotEmpty()) clients.map { it.returns }.average() else 0.0
            val activeSips = clients.sumOf { it.sipCount }
            val monthlySipValue = _sips.value.filter { it.isActive }.sumOf { it.amount }

            // Get upcoming SIPs from real data
            val upcomingSips = _sips.value
                .filter { it.isActive }
                .sortedBy { it.sipDate }
                .take(5)

            // Load failed SIPs from backend
            val failedSips = when (val failedResult = sipRepository.getSips(status = "FAILED")) {
                is ApiResult.Success -> failedResult.data
                else -> emptyList()
            }

            // Top performers - clients sorted by returns
            val topPerformers = clients
                .filter { it.returns > 0 }
                .sortedByDescending { it.returns }
                .take(5)

            // Load market indices from backend
            val marketIndices = try {
                val response = apiService.getMarketIndices()
                if (response.isSuccessful) {
                    response.body() ?: emptyList()
                } else {
                    emptyList()
                }
            } catch (e: Exception) {
                emptyList<MarketIndex>()
            }

            val dashboard = FADashboard(
                totalAum = totalAum,
                totalClients = clients.size,
                activeSips = activeSips,
                pendingActions = _pendingTransactions.value.size,
                avgReturns = avgReturns,
                monthlySipValue = monthlySipValue,
                recentClients = clients.take(5),
                pendingTransactions = _pendingTransactions.value.take(5),
                upcomingSips = upcomingSips,
                failedSips = failedSips,
                topPerformers = topPerformers,
                marketIndices = marketIndices
            )

            // Compute breakdown data for KPI detail sheet
            _breakdown.value = computeBreakdown(clients, _sips.value)

            _uiState.value = DashboardUiState.Success(dashboard)
        }
    }

    private fun computeBreakdown(clients: List<Client>, sips: List<FASip>): DashboardBreakdown {
        // AUM breakdown: group by rough fund category from client-level data
        // Since we don't have per-holding category at dashboard level, use client AUM distribution
        val totalAum = clients.sumOf { it.aum }

        // Clients breakdown
        val now = LocalDate.now()
        val thirtyDaysAgo = now.minusDays(30)
        val dateFormatter = DateTimeFormatter.ISO_DATE_TIME

        val activeCount = clients.count { it.status != "inactive" }
        val newCount = clients.count { client ->
            client.joinedDate?.let {
                try {
                    val joined = LocalDate.parse(it.take(10))
                    !joined.isBefore(thirtyDaysAgo)
                } catch (e: Exception) { false }
            } ?: false
        }
        val inactiveCount = clients.count { it.status == "inactive" }
        val pendingKycCount = clients.count { it.kycStatus != "VERIFIED" && it.kycStatus != null }
        val clientsTotal = (activeCount + inactiveCount).coerceAtLeast(1).toFloat()

        // SIPs breakdown by frequency
        val activeSips = sips.filter { it.isActive }
        val monthlySips = activeSips.count { it.frequency.equals("MONTHLY", ignoreCase = true) }
        val quarterlySips = activeSips.count { it.frequency.equals("QUARTERLY", ignoreCase = true) }
        val weeklySips = activeSips.count { it.frequency.equals("WEEKLY", ignoreCase = true) }
        val dailySips = activeSips.count { it.frequency.equals("DAILY", ignoreCase = true) }
        val sipTotal = activeSips.size.coerceAtLeast(1).toFloat()

        return DashboardBreakdown(
            aumBreakdown = emptyList(), // We don't have per-holding category at dashboard level
            clientsBreakdown = listOf(
                BreakdownItem("Active", activeCount.toString(), activeCount / clientsTotal),
                BreakdownItem("New (30d)", newCount.toString(), newCount / clientsTotal),
                BreakdownItem("Inactive", inactiveCount.toString(), inactiveCount / clientsTotal),
                BreakdownItem("Pending KYC", pendingKycCount.toString(), pendingKycCount / clientsTotal)
            ),
            sipsBreakdown = listOf(
                BreakdownItem("Monthly", monthlySips.toString(), monthlySips / sipTotal),
                BreakdownItem("Quarterly", quarterlySips.toString(), quarterlySips / sipTotal),
                BreakdownItem("Weekly", weeklySips.toString(), weeklySips / sipTotal),
                BreakdownItem("Daily", dailySips.toString(), dailySips / sipTotal)
            ).filter { it.label != "0" || it.progress > 0f }
        )
    }

    fun refresh() {
        loadDashboard()
    }
}

sealed class DashboardUiState {
    data object Loading : DashboardUiState()
    data class Success(val dashboard: FADashboard) : DashboardUiState()
    data class Error(val message: String) : DashboardUiState()
}

data class BreakdownItem(
    val label: String,
    val value: String,
    val progress: Float
)

data class DashboardBreakdown(
    val aumBreakdown: List<BreakdownItem> = emptyList(),
    val clientsBreakdown: List<BreakdownItem> = emptyList(),
    val sipsBreakdown: List<BreakdownItem> = emptyList()
)
