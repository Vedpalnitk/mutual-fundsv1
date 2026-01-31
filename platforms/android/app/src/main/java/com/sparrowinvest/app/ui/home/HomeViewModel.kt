package com.sparrowinvest.app.ui.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sparrowinvest.app.core.network.ApiResult
import com.sparrowinvest.app.data.model.AdvisorInfo
import com.sparrowinvest.app.data.model.AssetAllocation
import com.sparrowinvest.app.data.model.ClientType
import com.sparrowinvest.app.data.model.Goal
import com.sparrowinvest.app.data.model.Holding
import com.sparrowinvest.app.data.model.Portfolio
import com.sparrowinvest.app.data.model.Sip
import com.sparrowinvest.app.data.model.SipFrequency
import com.sparrowinvest.app.data.model.SipStatus
import com.sparrowinvest.app.data.model.Transaction
import com.sparrowinvest.app.data.model.TransactionType
import com.sparrowinvest.app.data.model.TransactionStatus
import com.sparrowinvest.app.data.model.User
import com.sparrowinvest.app.data.repository.AuthRepository
import com.sparrowinvest.app.data.repository.GoalsRepository
import com.sparrowinvest.app.data.repository.PortfolioRepository
import com.sparrowinvest.app.ui.components.ActionType
import com.sparrowinvest.app.ui.components.UpcomingAction
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.util.Calendar
import javax.inject.Inject

enum class PortfolioViewMode {
    INDIVIDUAL,
    FAMILY
}

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val portfolioRepository: PortfolioRepository,
    private val goalsRepository: GoalsRepository
) : ViewModel() {

    val currentUser: StateFlow<User?> = authRepository.currentUser
    val isGuest: StateFlow<Boolean> = authRepository.isGuestUser

    // Client type and advisor info from portfolio repository
    val clientType: StateFlow<ClientType> = portfolioRepository.clientType
    val advisor: StateFlow<AdvisorInfo?> = portfolioRepository.advisor

    /**
     * Check if user is a managed client (has FA advisor)
     */
    val isManagedClient: Boolean
        get() = portfolioRepository.isManagedClient

    private val _uiState = MutableStateFlow<HomeUiState>(HomeUiState.Loading)
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    private val _portfolio = MutableStateFlow<Portfolio?>(null)
    val portfolio: StateFlow<Portfolio?> = _portfolio.asStateFlow()

    private val _goals = MutableStateFlow<List<Goal>>(emptyList())
    val goals: StateFlow<List<Goal>> = _goals.asStateFlow()

    private val _recentTransactions = MutableStateFlow<List<Transaction>>(emptyList())
    val recentTransactions: StateFlow<List<Transaction>> = _recentTransactions.asStateFlow()

    private val _activeSIPs = MutableStateFlow<List<Sip>>(emptyList())
    val activeSIPs: StateFlow<List<Sip>> = _activeSIPs.asStateFlow()

    private val _upcomingActions = MutableStateFlow<List<UpcomingAction>>(emptyList())
    val upcomingActions: StateFlow<List<UpcomingAction>> = _upcomingActions.asStateFlow()

    private val _portfolioViewMode = MutableStateFlow(PortfolioViewMode.INDIVIDUAL)
    val portfolioViewMode: StateFlow<PortfolioViewMode> = _portfolioViewMode.asStateFlow()

    private val _profileCompletion = MutableStateFlow(65)
    val profileCompletion: StateFlow<Int> = _profileCompletion.asStateFlow()

    init {
        loadData()
    }

    fun setPortfolioViewMode(mode: PortfolioViewMode) {
        _portfolioViewMode.value = mode
    }

    fun loadData() {
        viewModelScope.launch {
            _uiState.value = HomeUiState.Loading

            // Load portfolio with clientType and advisor info
            val myPortfolioResult = portfolioRepository.getMyPortfolio()
            when (myPortfolioResult) {
                is ApiResult.Success -> {
                    // Convert PortfolioResponse to Portfolio for UI
                    val response = myPortfolioResult.data
                    _portfolio.value = Portfolio(
                        totalValue = response.portfolio.totalValue,
                        totalInvested = response.portfolio.totalInvested,
                        totalReturns = response.portfolio.totalReturns,
                        returnsPercentage = response.portfolio.returnsPercentage,
                        todayChange = 0.0,
                        todayChangePercentage = 0.0,
                        xirr = null,
                        assetAllocation = AssetAllocation(),
                        holdings = emptyList(),
                        sips = emptyList()
                    )
                }
                is ApiResult.Error -> {
                    // Fall back to old endpoint
                    val portfolioResult = portfolioRepository.getPortfolio()
                    when (portfolioResult) {
                        is ApiResult.Success -> {
                            _portfolio.value = portfolioResult.data
                        }
                        is ApiResult.Error -> {
                            // Use mock data for demo
                            _portfolio.value = createMockPortfolio()
                        }
                        else -> {}
                    }
                }
            }

            // Load goals
            val goalsResult = goalsRepository.getGoals()
            when (goalsResult) {
                is ApiResult.Success -> {
                    _goals.value = goalsResult.data
                }
                is ApiResult.Error -> {
                    _goals.value = createMockGoals()
                }
                else -> {}
            }

            // Load transactions
            val transactionsResult = portfolioRepository.getTransactions()
            when (transactionsResult) {
                is ApiResult.Success -> {
                    _recentTransactions.value = transactionsResult.data.take(5)
                }
                is ApiResult.Error -> {
                    _recentTransactions.value = createMockTransactions()
                }
                else -> {}
            }

            // Load SIPs (mock for now)
            _activeSIPs.value = createMockSIPs()

            // Load upcoming actions (mock for now)
            _upcomingActions.value = createMockUpcomingActions()

            _uiState.value = HomeUiState.Success
        }
    }

    fun getGreeting(): String {
        val hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
        return when {
            hour < 12 -> "Good morning"
            hour < 17 -> "Good afternoon"
            else -> "Good evening"
        }
    }

    private fun createMockPortfolio(): Portfolio {
        return Portfolio(
            totalValue = 245680.0,
            totalInvested = 233230.0,
            totalReturns = 12450.0,
            returnsPercentage = 5.34,
            todayChange = 890.0,
            todayChangePercentage = 0.36,
            xirr = 14.2,
            assetAllocation = AssetAllocation(
                equity = 145000.0,
                debt = 65000.0,
                hybrid = 25000.0,
                gold = 10680.0,
                other = 0.0
            ),
            holdings = createMockHoldings(),
            sips = createMockSIPs()
        )
    }

    private fun createMockHoldings(): List<Holding> {
        return listOf(
            Holding(
                id = "1",
                fundCode = "119598",
                fundName = "Axis Bluechip Fund Direct Growth",
                category = "Large Cap",
                assetClass = "equity",
                units = 234.56,
                averageNav = 45.23,
                currentNav = 52.10,
                investedAmount = 10610.0,
                currentValue = 12218.5,
                returns = 1608.5,
                returnsPercentage = 15.15,
                dayChange = 45.0,
                dayChangePercentage = 0.37
            ),
            Holding(
                id = "2",
                fundCode = "145552",
                fundName = "Mirae Asset Large Cap Fund Direct Growth",
                category = "Large Cap",
                assetClass = "equity",
                units = 189.32,
                averageNav = 78.45,
                currentNav = 85.23,
                investedAmount = 14855.0,
                currentValue = 16132.9,
                returns = 1277.9,
                returnsPercentage = 8.6,
                dayChange = 32.0,
                dayChangePercentage = 0.2
            ),
            Holding(
                id = "3",
                fundCode = "120594",
                fundName = "HDFC Corporate Bond Fund Direct Growth",
                category = "Corporate Bond",
                assetClass = "debt",
                units = 500.0,
                averageNav = 25.10,
                currentNav = 26.80,
                investedAmount = 12550.0,
                currentValue = 13400.0,
                returns = 850.0,
                returnsPercentage = 6.77,
                dayChange = 8.0,
                dayChangePercentage = 0.06
            )
        )
    }

    private fun createMockSIPs(): List<Sip> {
        return listOf(
            Sip(
                id = "1",
                fundCode = "119598",
                fundName = "Axis Bluechip Fund Direct Growth",
                amount = 5000.0,
                frequency = SipFrequency.MONTHLY,
                nextDate = "Jan 15",
                status = SipStatus.ACTIVE,
                totalInvested = 60000.0,
                sipCount = 12
            ),
            Sip(
                id = "2",
                fundCode = "145552",
                fundName = "Mirae Asset Large Cap Fund Direct Growth",
                amount = 3000.0,
                frequency = SipFrequency.MONTHLY,
                nextDate = "Jan 20",
                status = SipStatus.ACTIVE,
                totalInvested = 36000.0,
                sipCount = 12
            ),
            Sip(
                id = "3",
                fundCode = "120594",
                fundName = "HDFC Corporate Bond Fund Direct Growth",
                amount = 2000.0,
                frequency = SipFrequency.MONTHLY,
                nextDate = "Jan 25",
                status = SipStatus.ACTIVE,
                totalInvested = 24000.0,
                sipCount = 12
            )
        )
    }

    private fun createMockTransactions(): List<Transaction> {
        return listOf(
            Transaction(
                id = "1",
                fundCode = "119598",
                fundName = "Axis Bluechip Fund Direct Growth",
                type = TransactionType.SIP_INSTALLMENT,
                amount = 5000.0,
                units = 95.23,
                nav = 52.50,
                date = "Jan 10, 2026",
                status = TransactionStatus.COMPLETED
            ),
            Transaction(
                id = "2",
                fundCode = "145552",
                fundName = "Mirae Asset Large Cap Fund",
                type = TransactionType.PURCHASE,
                amount = 10000.0,
                units = 117.37,
                nav = 85.20,
                date = "Jan 5, 2026",
                status = TransactionStatus.COMPLETED
            ),
            Transaction(
                id = "3",
                fundCode = "120594",
                fundName = "HDFC Corporate Bond Fund",
                type = TransactionType.SIP_INSTALLMENT,
                amount = 2000.0,
                units = 74.63,
                nav = 26.80,
                date = "Jan 1, 2026",
                status = TransactionStatus.COMPLETED
            )
        )
    }

    private fun createMockUpcomingActions(): List<UpcomingAction> {
        return listOf(
            UpcomingAction(
                id = "1",
                title = "SIP Due: Axis Bluechip",
                description = "₹5,000 on Jan 15",
                type = ActionType.SIP_DUE,
                dueDate = "Jan 15"
            ),
            UpcomingAction(
                id = "2",
                title = "Tax Saving Deadline",
                description = "₹50,000 remaining under 80C",
                type = ActionType.TAX_SAVING,
                dueDate = "Mar 31"
            ),
            UpcomingAction(
                id = "3",
                title = "Portfolio Rebalance",
                description = "Equity allocation above target",
                type = ActionType.REBALANCE,
                dueDate = "Review"
            )
        )
    }

    private fun createMockGoals(): List<Goal> {
        return listOf(
            Goal(
                id = "1",
                name = "Retirement Fund",
                targetAmount = 5000000.0,
                currentAmount = 1250000.0,
                targetDate = "2045-01-01"
            ),
            Goal(
                id = "2",
                name = "Child Education",
                targetAmount = 2000000.0,
                currentAmount = 450000.0,
                targetDate = "2035-06-01"
            )
        )
    }
}

sealed class HomeUiState {
    data object Loading : HomeUiState()
    data object Success : HomeUiState()
    data class Error(val message: String) : HomeUiState()
}
