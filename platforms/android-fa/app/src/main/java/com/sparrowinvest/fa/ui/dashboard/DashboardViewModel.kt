package com.sparrowinvest.fa.ui.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sparrowinvest.fa.core.network.ApiResult
import com.sparrowinvest.fa.core.network.ApiService
import com.sparrowinvest.fa.data.model.Client
import com.sparrowinvest.fa.data.model.FADashboard
import com.sparrowinvest.fa.data.model.FASip
import com.sparrowinvest.fa.data.model.FATransaction
import com.sparrowinvest.fa.data.model.GrowthDataPoint
import com.sparrowinvest.fa.data.model.KpiGrowth
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
import java.time.format.TextStyle
import java.time.temporal.ChronoUnit
import java.util.Locale
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
            val allSips = _sips.value
            val activeSipsList = allSips.filter { it.isActive }
            val monthlySipValue = activeSipsList.sumOf { it.amount }

            // Get upcoming SIPs from real data
            val upcomingSips = allSips
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

            // Compute growth metrics
            val aumGrowth = computeAumGrowth(totalAum, avgReturns)
            val clientsGrowth = computeClientsGrowth(clients)
            val sipsGrowth = computeSipsGrowth(activeSipsList)

            val dashboard = FADashboard(
                totalAum = totalAum,
                totalClients = clients.size,
                activeSips = activeSips,
                pendingActions = _pendingTransactions.value.size + failedSips.size,
                avgReturns = avgReturns,
                monthlySipValue = monthlySipValue,
                recentClients = clients.take(5),
                pendingTransactions = _pendingTransactions.value.take(5),
                upcomingSips = upcomingSips,
                failedSips = failedSips,
                topPerformers = topPerformers,
                aumGrowth = aumGrowth,
                clientsGrowth = clientsGrowth,
                sipsGrowth = sipsGrowth
            )

            // Compute breakdown data for KPI detail sheet
            _breakdown.value = computeBreakdown(clients, _sips.value)

            _uiState.value = DashboardUiState.Success(dashboard)
        }
    }

    private fun computeAumGrowth(totalAum: Double, avgReturns: Double): KpiGrowth {
        val monthlyRate = avgReturns / 100.0 / 12.0
        val prevMonthAum = if (monthlyRate > -1.0) totalAum / (1 + monthlyRate) else totalAum
        val prevYearAum = if (avgReturns > -100.0) totalAum / (1 + avgReturns / 100.0) else totalAum

        val momAbsolute = totalAum - prevMonthAum
        val momChange = if (prevMonthAum != 0.0) (momAbsolute / prevMonthAum) * 100.0 else 0.0
        val yoyAbsolute = totalAum - prevYearAum
        val yoyChange = if (prevYearAum != 0.0) (yoyAbsolute / prevYearAum) * 100.0 else 0.0

        // Generate 6-month backward-projected trend
        val now = LocalDate.now()
        val trend = (5 downTo 0).map { monthsAgo ->
            val date = now.minusMonths(monthsAgo.toLong())
            val label = date.month.getDisplayName(TextStyle.SHORT, Locale.ENGLISH)
            val projectedValue = totalAum / Math.pow(1 + monthlyRate, monthsAgo.toDouble())
            GrowthDataPoint(month = label, value = projectedValue)
        }

        return KpiGrowth(
            momChange = momChange,
            momAbsolute = momAbsolute,
            yoyChange = yoyChange,
            yoyAbsolute = yoyAbsolute,
            prevMonthValue = prevMonthAum,
            prevYearValue = prevYearAum,
            trend = trend
        )
    }

    private fun computeClientsGrowth(clients: List<Client>): KpiGrowth {
        val now = LocalDate.now()
        val oneMonthAgo = now.minusMonths(1)
        val oneYearAgo = now.minusYears(1)
        val currentCount = clients.size.toDouble()

        // Count clients that existed before the cutoff dates
        val countBeforeMonth = clients.count { client ->
            client.joinedDate?.let {
                try {
                    LocalDate.parse(it.take(10)).isBefore(oneMonthAgo)
                } catch (e: Exception) { true }
            } ?: true // If no joinedDate, assume they existed
        }.toDouble()

        val countBeforeYear = clients.count { client ->
            client.joinedDate?.let {
                try {
                    LocalDate.parse(it.take(10)).isBefore(oneYearAgo)
                } catch (e: Exception) { true }
            } ?: true
        }.toDouble()

        val momAbsolute = currentCount - countBeforeMonth
        val momChange = if (countBeforeMonth > 0) (momAbsolute / countBeforeMonth) * 100.0 else 0.0
        val yoyAbsolute = currentCount - countBeforeYear
        val yoyChange = if (countBeforeYear > 0) (yoyAbsolute / countBeforeYear) * 100.0 else 0.0

        // Build 6-month trend from join dates
        val trend = (5 downTo 0).map { monthsAgo ->
            val date = now.minusMonths(monthsAgo.toLong())
            val label = date.month.getDisplayName(TextStyle.SHORT, Locale.ENGLISH)
            val endOfMonth = date.withDayOfMonth(date.lengthOfMonth())
            val countAtMonth = clients.count { client ->
                client.joinedDate?.let {
                    try {
                        !LocalDate.parse(it.take(10)).isAfter(endOfMonth)
                    } catch (e: Exception) { true }
                } ?: true
            }.toDouble()
            GrowthDataPoint(month = label, value = countAtMonth)
        }

        return KpiGrowth(
            momChange = momChange,
            momAbsolute = momAbsolute,
            yoyChange = yoyChange,
            yoyAbsolute = yoyAbsolute,
            prevMonthValue = countBeforeMonth,
            prevYearValue = countBeforeYear,
            trend = trend
        )
    }

    private fun computeSipsGrowth(activeSips: List<FASip>): KpiGrowth {
        val now = LocalDate.now()
        val oneMonthAgo = now.minusMonths(1)
        val oneYearAgo = now.minusYears(1)
        val currentCount = activeSips.size.toDouble()

        val countBeforeMonth = activeSips.count { sip ->
            sip.startDate?.let {
                try {
                    LocalDate.parse(it.take(10)).isBefore(oneMonthAgo)
                } catch (e: Exception) { true }
            } ?: true
        }.toDouble()

        val countBeforeYear = activeSips.count { sip ->
            sip.startDate?.let {
                try {
                    LocalDate.parse(it.take(10)).isBefore(oneYearAgo)
                } catch (e: Exception) { true }
            } ?: true
        }.toDouble()

        val momAbsolute = currentCount - countBeforeMonth
        val momChange = if (countBeforeMonth > 0) (momAbsolute / countBeforeMonth) * 100.0 else 0.0
        val yoyAbsolute = currentCount - countBeforeYear
        val yoyChange = if (countBeforeYear > 0) (yoyAbsolute / countBeforeYear) * 100.0 else 0.0

        // Build 6-month trend from start dates
        val trend = (5 downTo 0).map { monthsAgo ->
            val date = now.minusMonths(monthsAgo.toLong())
            val label = date.month.getDisplayName(TextStyle.SHORT, Locale.ENGLISH)
            val endOfMonth = date.withDayOfMonth(date.lengthOfMonth())
            val countAtMonth = activeSips.count { sip ->
                sip.startDate?.let {
                    try {
                        !LocalDate.parse(it.take(10)).isAfter(endOfMonth)
                    } catch (e: Exception) { true }
                } ?: true
            }.toDouble()
            GrowthDataPoint(month = label, value = countAtMonth)
        }

        return KpiGrowth(
            momChange = momChange,
            momAbsolute = momAbsolute,
            yoyChange = yoyChange,
            yoyAbsolute = yoyAbsolute,
            prevMonthValue = countBeforeMonth,
            prevYearValue = countBeforeYear,
            trend = trend
        )
    }

    private fun computeBreakdown(clients: List<Client>, sips: List<FASip>): DashboardBreakdown {
        val totalAum = clients.sumOf { it.aum }

        // AUM breakdown: top 5 clients by AUM share
        val aumBreakdown = if (totalAum > 0 && clients.isNotEmpty()) {
            clients
                .sortedByDescending { it.aum }
                .take(5)
                .map { client ->
                    val share = (client.aum / totalAum).toFloat()
                    val formatted = when {
                        client.aum >= 10000000 -> "₹%.1fCr".format(client.aum / 10000000)
                        client.aum >= 100000 -> "₹%.1fL".format(client.aum / 100000)
                        client.aum >= 1000 -> "₹%.1fK".format(client.aum / 1000)
                        else -> "₹%.0f".format(client.aum)
                    }
                    BreakdownItem(client.name, formatted, share)
                }
        } else emptyList()

        // Clients breakdown
        val now = LocalDate.now()
        val thirtyDaysAgo = now.minusDays(30)

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
            aumBreakdown = aumBreakdown,
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
