package com.sparrowinvest.fa.ui.insights

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sparrowinvest.fa.core.network.ApiResult
import com.sparrowinvest.fa.data.model.Client
import com.sparrowinvest.fa.data.model.ClientDetail
import com.sparrowinvest.fa.data.model.ClassifyResponse
import com.sparrowinvest.fa.data.model.FundRecommendation
import com.sparrowinvest.fa.data.model.GoalAlert
import com.sparrowinvest.fa.data.model.HoldingInput
import com.sparrowinvest.fa.data.model.PortfolioHealthItem
import com.sparrowinvest.fa.data.model.RebalancingAlert
import com.sparrowinvest.fa.data.model.TaxHarvestingOpportunity
import com.sparrowinvest.fa.data.repository.ClientRepository
import com.sparrowinvest.fa.data.repository.InsightsRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class InsightsViewModel @Inject constructor(
    private val clientRepository: ClientRepository,
    private val insightsRepository: InsightsRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<InsightsUiState>(InsightsUiState.Loading)
    val uiState: StateFlow<InsightsUiState> = _uiState.asStateFlow()

    private val _selectedCategory = MutableStateFlow<InsightCategory?>(null)
    val selectedCategory: StateFlow<InsightCategory?> = _selectedCategory.asStateFlow()

    init {
        loadInsights()
    }

    fun loadInsights() {
        viewModelScope.launch {
            _uiState.value = InsightsUiState.Loading

            when (val clientsResult = clientRepository.getClients()) {
                is ApiResult.Success -> {
                    val clients = clientsResult.data
                    val insights = generateEnhancedInsights(clients)
                    _uiState.value = InsightsUiState.Success(insights)
                }
                is ApiResult.Error -> {
                    _uiState.value = InsightsUiState.Error(clientsResult.message)
                }
                else -> {}
            }
        }
    }

    private suspend fun generateEnhancedInsights(clients: List<Client>): FAInsightsData {
        // Load detailed client data and AI classification in parallel
        val clientDetails = loadClientDetails(clients)
        val classifications = classifyClientPortfolios(clientDetails)

        // Generate portfolio health with AI-enhanced scoring
        val portfolioHealth = clientDetails.map { detail ->
            val classification = classifications[detail.id]
            val score = calculateEnhancedHealthScore(detail, classification)
            val issues = mutableListOf<String>()
            val recommendations = mutableListOf<String>()

            if (detail.returns < 5.0) {
                issues.add("Below-average portfolio returns (${"%+.1f".format(detail.returns)}%)")
                recommendations.add("Consider reviewing fund selection for better returns")
            }
            if (detail.sips.isEmpty() || detail.sips.none { it.isActive }) {
                issues.add("No active SIPs")
                recommendations.add("Set up systematic investment plan for disciplined investing")
            }
            if (detail.aum < 100000) {
                issues.add("Low investment value (₹${"%.0f".format(detail.aum)})")
                recommendations.add("Increase investment allocation gradually")
            }

            // AI-driven suggestions from classification
            classification?.suggestions?.forEach { suggestion ->
                recommendations.add(suggestion)
            }

            // Check concentration risk
            if (detail.holdings.isNotEmpty()) {
                val maxHolding = detail.holdings.maxByOrNull { it.currentValue }
                if (maxHolding != null && detail.aum > 0) {
                    val concentration = (maxHolding.currentValue / detail.aum) * 100
                    if (concentration > 40) {
                        issues.add("High concentration: ${maxHolding.fundName} (${"%,.0f".format(concentration)}%)")
                        recommendations.add("Diversify holdings to reduce concentration risk")
                    }
                }
            }

            PortfolioHealthItem(
                clientId = detail.id,
                clientName = detail.name,
                score = score,
                issues = issues,
                recommendations = recommendations
            )
        }.filter { it.score < 80 }.sortedBy { it.score }

        // Generate rebalancing alerts using real classification data
        val rebalancingAlerts = clientDetails.mapNotNull { detail ->
            val classification = classifications[detail.id]
            if (classification != null) {
                val equityAllocation = classification.classification.equity
                val targetAllocation = getTargetAllocation(detail.riskProfile)
                val deviation = equityAllocation - targetAllocation

                if (kotlin.math.abs(deviation) > 5) {
                    RebalancingAlert(
                        clientId = detail.id,
                        clientName = detail.name,
                        assetClass = "Equity",
                        currentAllocation = equityAllocation,
                        targetAllocation = targetAllocation,
                        deviation = deviation,
                        action = if (deviation > 0) "DECREASE" else "INCREASE"
                    )
                } else null
            } else {
                // Fallback: estimate from holdings data
                val totalValue = detail.holdings.sumOf { it.currentValue }
                if (totalValue > 0) {
                    val equityValue = detail.holdings
                        .filter { h -> h.category?.contains("Equity", ignoreCase = true) == true }
                        .sumOf { it.currentValue }
                    val equityPct = (equityValue / totalValue) * 100
                    val target = getTargetAllocation(detail.riskProfile)
                    val dev = equityPct - target
                    if (kotlin.math.abs(dev) > 5) {
                        RebalancingAlert(
                            clientId = detail.id,
                            clientName = detail.name,
                            assetClass = "Equity",
                            currentAllocation = equityPct,
                            targetAllocation = target,
                            deviation = dev,
                            action = if (dev > 0) "DECREASE" else "INCREASE"
                        )
                    } else null
                } else null
            }
        }.take(5)

        // Goal alerts from client data
        val goalAlerts = generateGoalAlerts(clientDetails)

        // Tax harvesting from actual holdings with losses
        val taxHarvesting = clientDetails.flatMap { detail ->
            detail.holdings
                .filter { it.returnsPercentage < -5.0 && it.currentValue > 5000 }
                .map { holding ->
                    val unrealizedLoss = holding.investedValue - holding.currentValue
                    TaxHarvestingOpportunity(
                        clientId = detail.id,
                        clientName = detail.name,
                        fundName = holding.fundName,
                        unrealizedLoss = unrealizedLoss,
                        potentialSavings = unrealizedLoss * 0.15
                    )
                }
        }.sortedByDescending { it.potentialSavings }.take(5)

        // SIP opportunities
        val sipOpportunities = clientDetails
            .filter { it.sips.isEmpty() || it.sips.none { sip -> sip.isActive } }
            .map { detail ->
                SipOpportunity(
                    clientId = detail.id,
                    clientName = detail.name,
                    currentAum = detail.aum,
                    suggestedSipAmount = (detail.aum * 0.05).coerceIn(1000.0, 25000.0)
                )
            }

        // AI-powered fund recommendations for clients with low returns
        val recommendations = loadRecommendations(clientDetails)

        return FAInsightsData(
            portfolioHealth = portfolioHealth,
            rebalancingAlerts = rebalancingAlerts,
            goalAlerts = goalAlerts,
            taxHarvesting = taxHarvesting,
            sipOpportunities = sipOpportunities,
            aiRecommendations = recommendations,
            totalClients = clientDetails.size,
            averageHealthScore = if (clientDetails.isNotEmpty()) {
                clientDetails.map { detail ->
                    calculateEnhancedHealthScore(detail, classifications[detail.id])
                }.average().toInt()
            } else 0
        )
    }

    private suspend fun loadClientDetails(clients: List<Client>): List<ClientDetail> {
        return try {
            coroutineScope {
                clients.map { client ->
                    async {
                        when (val result = clientRepository.getClient(client.id)) {
                            is ApiResult.Success -> result.data
                            else -> null
                        }
                    }
                }.awaitAll().filterNotNull()
            }
        } catch (e: Exception) {
            // Fallback: create minimal ClientDetail from Client
            clients.map { client ->
                ClientDetail(
                    id = client.id,
                    name = client.name,
                    email = client.email,
                    phone = client.phone,
                    aum = client.aum,
                    returns = client.returns,
                    riskProfile = client.riskProfile,
                    kycStatus = client.kycStatus
                )
            }
        }
    }

    private suspend fun classifyClientPortfolios(
        clientDetails: List<ClientDetail>
    ): Map<String, ClassifyResponse> {
        val results = mutableMapOf<String, ClassifyResponse>()

        for (detail in clientDetails) {
            if (detail.holdings.isEmpty()) continue

            val holdingInputs = detail.holdings.mapNotNull { holding ->
                holding.schemeCode?.let { code ->
                    HoldingInput(schemeCode = code, amount = holding.currentValue)
                }
            }
            if (holdingInputs.isEmpty()) continue

            when (val result = insightsRepository.classifyPortfolio(
                holdings = holdingInputs,
                riskProfile = detail.riskProfile
            )) {
                is ApiResult.Success -> results[detail.id] = result.data
                else -> {} // Skip if API fails for this client
            }
        }

        return results
    }

    private suspend fun loadRecommendations(
        clientDetails: List<ClientDetail>
    ): List<ClientRecommendation> {
        val results = mutableListOf<ClientRecommendation>()

        // Get recommendations for clients with poor returns or low diversification
        val needsRecs = clientDetails
            .filter { it.returns < 8.0 && it.aum > 50000 }
            .take(3) // Limit API calls

        for (detail in needsRecs) {
            val holdingInputs = detail.holdings.mapNotNull { holding ->
                holding.schemeCode?.let { code ->
                    HoldingInput(schemeCode = code, amount = holding.currentValue)
                }
            }

            when (val result = insightsRepository.getRecommendations(
                riskProfile = detail.riskProfile ?: "MODERATE",
                investmentAmount = (detail.aum * 0.1).coerceAtLeast(10000.0),
                investmentHorizon = "LONG",
                existingHoldings = holdingInputs
            )) {
                is ApiResult.Success -> {
                    results.add(
                        ClientRecommendation(
                            clientId = detail.id,
                            clientName = detail.name,
                            recommendations = result.data.recommendations,
                            rationale = result.data.rationale
                        )
                    )
                }
                else -> {}
            }
        }

        return results
    }

    private fun generateGoalAlerts(clientDetails: List<ClientDetail>): List<GoalAlert> {
        // Generate goal-based alerts from portfolio performance
        return clientDetails.mapNotNull { detail ->
            when {
                detail.returns < 0 -> GoalAlert(
                    clientId = detail.id,
                    clientName = detail.name,
                    goalName = "Portfolio Recovery",
                    status = "OFF_TRACK",
                    message = "Negative returns (${"%+.1f".format(detail.returns)}%). Review asset allocation."
                )
                detail.returns < 5 && detail.aum > 100000 -> GoalAlert(
                    clientId = detail.id,
                    clientName = detail.name,
                    goalName = "Growth Target",
                    status = "AT_RISK",
                    message = "Returns below inflation. Consider increasing equity exposure."
                )
                else -> null
            }
        }
    }

    private fun calculateEnhancedHealthScore(
        detail: ClientDetail,
        classification: ClassifyResponse?
    ): Int {
        var score = 100

        // Returns-based scoring
        if (detail.returns < 0) score -= 30
        else if (detail.returns < 5) score -= 20
        else if (detail.returns < 10) score -= 10

        // SIP discipline
        if (detail.sips.isEmpty() || detail.sips.none { it.isActive }) score -= 15

        // AUM level
        if (detail.aum < 50000) score -= 15
        else if (detail.aum < 100000) score -= 10

        // Diversification (from classification or holdings)
        if (classification != null) {
            val riskScore = classification.riskScore
            if (riskScore > 80) score -= 10 // Too aggressive
            if (classification.classification.equity > 85) score -= 10 // Over-concentrated
            if (classification.classification.debt == 0.0 && detail.aum > 200000) score -= 5 // No debt allocation
        } else if (detail.holdings.size == 1) {
            score -= 15 // Single fund
        } else if (detail.holdings.size <= 2) {
            score -= 10 // Low diversification
        }

        // Holding performance check
        val underperformers = detail.holdings.count { it.returnsPercentage < -10 }
        if (underperformers > 0) score -= (underperformers * 5).coerceAtMost(15)

        return score.coerceIn(0, 100)
    }

    private fun getTargetAllocation(riskProfile: String?): Double {
        return when (riskProfile?.uppercase()) {
            "CONSERVATIVE" -> 30.0
            "MODERATELY_CONSERVATIVE" -> 45.0
            "MODERATE" -> 60.0
            "MODERATELY_AGGRESSIVE" -> 75.0
            "AGGRESSIVE" -> 85.0
            else -> 60.0
        }
    }

    fun selectCategory(category: InsightCategory?) {
        _selectedCategory.value = category
    }

    fun refresh() {
        loadInsights()
    }
}

sealed class InsightsUiState {
    data object Loading : InsightsUiState()
    data class Success(val data: FAInsightsData) : InsightsUiState()
    data class Error(val message: String) : InsightsUiState()
}

data class FAInsightsData(
    val portfolioHealth: List<PortfolioHealthItem>,
    val rebalancingAlerts: List<RebalancingAlert>,
    val goalAlerts: List<GoalAlert>,
    val taxHarvesting: List<TaxHarvestingOpportunity>,
    val sipOpportunities: List<SipOpportunity>,
    val aiRecommendations: List<ClientRecommendation> = emptyList(),
    val totalClients: Int,
    val averageHealthScore: Int
)

data class SipOpportunity(
    val clientId: String,
    val clientName: String,
    val currentAum: Double,
    val suggestedSipAmount: Double
)

data class ClientRecommendation(
    val clientId: String,
    val clientName: String,
    val recommendations: List<FundRecommendation>,
    val rationale: String? = null
)

enum class InsightCategory {
    PORTFOLIO_HEALTH,
    REBALANCING,
    GOAL_ALERTS,
    TAX_HARVESTING
}
