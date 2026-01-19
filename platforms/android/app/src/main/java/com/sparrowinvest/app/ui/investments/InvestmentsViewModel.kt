package com.sparrowinvest.app.ui.investments

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sparrowinvest.app.core.network.ApiResult
import com.sparrowinvest.app.data.model.AssetAllocation
import com.sparrowinvest.app.data.model.AssetClass
import com.sparrowinvest.app.data.model.FamilyMember
import com.sparrowinvest.app.data.model.FamilyPortfolio
import com.sparrowinvest.app.data.model.Holding
import com.sparrowinvest.app.data.model.Portfolio
import com.sparrowinvest.app.data.model.Relationship
import com.sparrowinvest.app.data.model.Sip
import com.sparrowinvest.app.data.model.SipFrequency
import com.sparrowinvest.app.data.model.SipStatus
import com.sparrowinvest.app.data.model.Transaction
import com.sparrowinvest.app.data.model.TransactionStatus
import com.sparrowinvest.app.data.model.TransactionType
import com.sparrowinvest.app.data.repository.PortfolioRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

enum class PortfolioViewMode {
    INDIVIDUAL,
    FAMILY
}

@HiltViewModel
class InvestmentsViewModel @Inject constructor(
    private val portfolioRepository: PortfolioRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<InvestmentsUiState>(InvestmentsUiState.Loading)
    val uiState: StateFlow<InvestmentsUiState> = _uiState.asStateFlow()

    private val _portfolio = MutableStateFlow<Portfolio?>(null)
    val portfolio: StateFlow<Portfolio?> = _portfolio.asStateFlow()

    private val _holdings = MutableStateFlow<List<Holding>>(emptyList())
    val holdings: StateFlow<List<Holding>> = _holdings.asStateFlow()

    private val _filteredHoldings = MutableStateFlow<List<Holding>>(emptyList())
    val filteredHoldings: StateFlow<List<Holding>> = _filteredHoldings.asStateFlow()

    private val _sips = MutableStateFlow<List<Sip>>(emptyList())
    val sips: StateFlow<List<Sip>> = _sips.asStateFlow()

    private val _transactions = MutableStateFlow<List<Transaction>>(emptyList())
    val transactions: StateFlow<List<Transaction>> = _transactions.asStateFlow()

    private val _selectedTab = MutableStateFlow(InvestmentTab.PORTFOLIO)
    val selectedTab: StateFlow<InvestmentTab> = _selectedTab.asStateFlow()

    private val _portfolioViewMode = MutableStateFlow(PortfolioViewMode.INDIVIDUAL)
    val portfolioViewMode: StateFlow<PortfolioViewMode> = _portfolioViewMode.asStateFlow()

    private val _familyPortfolio = MutableStateFlow<FamilyPortfolio?>(null)
    val familyPortfolio: StateFlow<FamilyPortfolio?> = _familyPortfolio.asStateFlow()

    private val _selectedFamilyMember = MutableStateFlow<FamilyMember?>(null)
    val selectedFamilyMember: StateFlow<FamilyMember?> = _selectedFamilyMember.asStateFlow()

    private val _selectedAssetFilter = MutableStateFlow<AssetClass?>(null)
    val selectedAssetFilter: StateFlow<AssetClass?> = _selectedAssetFilter.asStateFlow()

    init {
        loadData()
    }

    fun loadData() {
        viewModelScope.launch {
            _uiState.value = InvestmentsUiState.Loading

            // Load portfolio
            when (val result = portfolioRepository.getPortfolio()) {
                is ApiResult.Success -> {
                    _portfolio.value = result.data
                    _holdings.value = result.data.holdings
                    _filteredHoldings.value = result.data.holdings
                    _sips.value = result.data.sips
                }
                is ApiResult.Error -> {
                    _portfolio.value = createMockPortfolio()
                    _holdings.value = createMockHoldings()
                    _filteredHoldings.value = createMockHoldings()
                    _sips.value = createMockSips()
                }
                else -> {}
            }

            // Load transactions
            when (val result = portfolioRepository.getTransactions()) {
                is ApiResult.Success -> {
                    _transactions.value = result.data
                }
                is ApiResult.Error -> {
                    _transactions.value = createMockTransactions()
                }
                else -> {}
            }

            // Load family portfolio (mock for now)
            _familyPortfolio.value = createMockFamilyPortfolio()

            _uiState.value = InvestmentsUiState.Success
        }
    }

    fun selectTab(tab: InvestmentTab) {
        _selectedTab.value = tab
    }

    fun setPortfolioViewMode(mode: PortfolioViewMode) {
        _portfolioViewMode.value = mode
        if (mode == PortfolioViewMode.INDIVIDUAL) {
            _selectedFamilyMember.value = null
        }
    }

    fun selectFamilyMember(member: FamilyMember?) {
        _selectedFamilyMember.value = member
    }

    fun setAssetFilter(assetClass: AssetClass?) {
        _selectedAssetFilter.value = assetClass
        applyFilter()
    }

    private fun applyFilter() {
        val filter = _selectedAssetFilter.value
        val allHoldings = _holdings.value
        _filteredHoldings.value = if (filter == null) {
            allHoldings
        } else {
            allHoldings.filter { it.assetClassEnum == filter }
        }
    }

    fun getAssetClassCounts(): Map<AssetClass, Int> {
        return _holdings.value.groupingBy { it.assetClassEnum }.eachCount()
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
            )
        )
    }

    private fun createMockHoldings(): List<Holding> {
        return listOf(
            Holding(
                id = "1",
                fundCode = "122639",
                fundName = "Parag Parikh Flexi Cap Fund",
                category = "Flexi Cap",
                assetClass = "equity",
                units = 1250.45,
                averageNav = 65.50,
                currentNav = 78.45,
                investedAmount = 81904.0,
                currentValue = 98110.0,
                returns = 16206.0,
                returnsPercentage = 19.78,
                dayChange = 245.0,
                dayChangePercentage = 0.25
            ),
            Holding(
                id = "2",
                fundCode = "112090",
                fundName = "HDFC Mid-Cap Opportunities",
                category = "Mid Cap",
                assetClass = "equity",
                units = 850.25,
                averageNav = 95.20,
                currentNav = 112.35,
                investedAmount = 80923.0,
                currentValue = 95526.0,
                returns = 14603.0,
                returnsPercentage = 18.01,
                dayChange = -120.0,
                dayChangePercentage = -0.12
            ),
            Holding(
                id = "3",
                fundCode = "120465",
                fundName = "ICICI Prudential Corporate Bond",
                category = "Corporate Bond",
                assetClass = "debt",
                units = 2500.0,
                averageNav = 22.50,
                currentNav = 24.10,
                investedAmount = 56250.0,
                currentValue = 60250.0,
                returns = 4000.0,
                returnsPercentage = 7.11,
                dayChange = 50.0,
                dayChangePercentage = 0.08
            ),
            Holding(
                id = "4",
                fundCode = "118551",
                fundName = "Axis Bluechip Fund",
                category = "Large Cap",
                assetClass = "equity",
                units = 620.0,
                averageNav = 48.50,
                currentNav = 52.18,
                investedAmount = 30070.0,
                currentValue = 32352.0,
                returns = 2282.0,
                returnsPercentage = 7.59,
                dayChange = 85.0,
                dayChangePercentage = 0.26
            ),
            Holding(
                id = "5",
                fundCode = "135781",
                fundName = "SBI Gold Fund",
                category = "Gold",
                assetClass = "gold",
                units = 750.0,
                averageNav = 12.80,
                currentNav = 14.24,
                investedAmount = 9600.0,
                currentValue = 10680.0,
                returns = 1080.0,
                returnsPercentage = 11.25,
                dayChange = 42.0,
                dayChangePercentage = 0.39
            )
        )
    }

    private fun createMockSips(): List<Sip> {
        return listOf(
            Sip(
                id = "1",
                fundCode = "122639",
                fundName = "Parag Parikh Flexi Cap Fund",
                amount = 10000.0,
                frequency = SipFrequency.MONTHLY,
                nextDate = "Jan 15",
                status = SipStatus.ACTIVE,
                totalInvested = 120000.0,
                sipCount = 12
            ),
            Sip(
                id = "2",
                fundCode = "112090",
                fundName = "HDFC Mid-Cap Opportunities",
                amount = 5000.0,
                frequency = SipFrequency.MONTHLY,
                nextDate = "Jan 20",
                status = SipStatus.ACTIVE,
                totalInvested = 60000.0,
                sipCount = 12
            ),
            Sip(
                id = "3",
                fundCode = "118551",
                fundName = "Axis Bluechip Fund",
                amount = 3000.0,
                frequency = SipFrequency.MONTHLY,
                nextDate = "Jan 25",
                status = SipStatus.ACTIVE,
                totalInvested = 36000.0,
                sipCount = 12
            ),
            Sip(
                id = "4",
                fundCode = "120465",
                fundName = "ICICI Prudential Corporate Bond",
                amount = 2000.0,
                frequency = SipFrequency.MONTHLY,
                nextDate = "Feb 1",
                status = SipStatus.PAUSED,
                totalInvested = 24000.0,
                sipCount = 12
            )
        )
    }

    private fun createMockTransactions(): List<Transaction> {
        return listOf(
            Transaction(
                id = "1",
                fundCode = "122639",
                fundName = "Parag Parikh Flexi Cap Fund",
                type = TransactionType.SIP_INSTALLMENT,
                amount = 10000.0,
                units = 127.45,
                nav = 78.45,
                date = "Jan 15, 2026",
                status = TransactionStatus.COMPLETED
            ),
            Transaction(
                id = "2",
                fundCode = "112090",
                fundName = "HDFC Mid-Cap Opportunities",
                type = TransactionType.SIP_INSTALLMENT,
                amount = 5000.0,
                units = 44.50,
                nav = 112.35,
                date = "Jan 10, 2026",
                status = TransactionStatus.COMPLETED
            ),
            Transaction(
                id = "3",
                fundCode = "118551",
                fundName = "Axis Bluechip Fund",
                type = TransactionType.PURCHASE,
                amount = 25000.0,
                units = 479.11,
                nav = 52.18,
                date = "Jan 5, 2026",
                status = TransactionStatus.COMPLETED
            ),
            Transaction(
                id = "4",
                fundCode = "120465",
                fundName = "ICICI Prudential Corporate Bond",
                type = TransactionType.REDEMPTION,
                amount = 15000.0,
                units = 622.41,
                nav = 24.10,
                date = "Dec 28, 2025",
                status = TransactionStatus.COMPLETED
            ),
            Transaction(
                id = "5",
                fundCode = "135781",
                fundName = "SBI Gold Fund",
                type = TransactionType.PURCHASE,
                amount = 5000.0,
                units = 351.12,
                nav = 14.24,
                date = "Dec 20, 2025",
                status = TransactionStatus.COMPLETED
            ),
            Transaction(
                id = "6",
                fundCode = "122639",
                fundName = "Parag Parikh Flexi Cap Fund",
                type = TransactionType.DIVIDEND,
                amount = 1250.0,
                units = 0.0,
                nav = 78.45,
                date = "Dec 15, 2025",
                status = TransactionStatus.COMPLETED
            )
        )
    }

    private fun createMockFamilyPortfolio(): FamilyPortfolio {
        return FamilyPortfolio(
            id = "family_1",
            name = "Family Portfolio",
            members = listOf(
                FamilyMember(
                    id = "1",
                    name = "Rahul Sharma",
                    relationship = Relationship.SELF,
                    portfolioValue = 245680.0,
                    contribution = 45.0
                ),
                FamilyMember(
                    id = "2",
                    name = "Priya Sharma",
                    relationship = Relationship.SPOUSE,
                    portfolioValue = 185420.0,
                    contribution = 34.0
                ),
                FamilyMember(
                    id = "3",
                    name = "Arun Sharma",
                    relationship = Relationship.PARENT,
                    portfolioValue = 115230.0,
                    contribution = 21.0
                )
            ),
            totalValue = 546330.0,
            totalInvested = 498750.0,
            totalReturns = 47580.0,
            returnsPercentage = 9.54,
            assetAllocation = AssetAllocation(
                equity = 320000.0,
                debt = 145000.0,
                hybrid = 51330.0,
                gold = 30000.0,
                other = 0.0
            )
        )
    }
}

enum class InvestmentTab {
    PORTFOLIO, SIPS, TRANSACTIONS
}

sealed class InvestmentsUiState {
    data object Loading : InvestmentsUiState()
    data object Success : InvestmentsUiState()
    data class Error(val message: String) : InvestmentsUiState()
}
