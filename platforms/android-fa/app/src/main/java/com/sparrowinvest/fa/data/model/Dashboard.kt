package com.sparrowinvest.fa.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class FADashboard(
    @SerialName("total_aum")
    val totalAum: Double = 0.0,
    @SerialName("total_clients")
    val totalClients: Int = 0,
    @SerialName("active_sips")
    val activeSips: Int = 0,
    @SerialName("pending_actions")
    val pendingActions: Int = 0,
    @SerialName("avg_returns")
    val avgReturns: Double = 0.0,
    @SerialName("monthly_sip_value")
    val monthlySipValue: Double = 0.0,
    @SerialName("recent_clients")
    val recentClients: List<Client> = emptyList(),
    @SerialName("pending_transactions")
    val pendingTransactions: List<FATransaction> = emptyList(),
    @SerialName("top_performers")
    val topPerformers: List<Client> = emptyList(),
    @SerialName("upcoming_sips")
    val upcomingSips: List<FASip> = emptyList(),
    @SerialName("failed_sips")
    val failedSips: List<FASip> = emptyList(),
    @SerialName("market_indices")
    val marketIndices: List<MarketIndex> = emptyList(),
    // Growth metrics
    @SerialName("aum_growth")
    val aumGrowth: KpiGrowth? = null,
    @SerialName("clients_growth")
    val clientsGrowth: KpiGrowth? = null,
    @SerialName("sips_growth")
    val sipsGrowth: KpiGrowth? = null
) {
    val formattedAum: String get() {
        return when {
            totalAum >= 10000000 -> "₹%.2f Cr".format(totalAum / 10000000)
            totalAum >= 100000 -> "₹%.2f L".format(totalAum / 100000)
            totalAum >= 1000 -> "₹%.2f K".format(totalAum / 1000)
            else -> "₹%.0f".format(totalAum)
        }
    }

    val formattedMonthlySip: String get() {
        return when {
            monthlySipValue >= 100000 -> "₹%.2f L".format(monthlySipValue / 100000)
            monthlySipValue >= 1000 -> "₹%.2f K".format(monthlySipValue / 1000)
            else -> "₹%.0f".format(monthlySipValue)
        }
    }
}

@Serializable
data class KpiGrowth(
    @SerialName("mom_change")
    val momChange: Double = 0.0,  // Month-over-month change percentage
    @SerialName("mom_absolute")
    val momAbsolute: Double = 0.0,  // Month-over-month absolute change
    @SerialName("yoy_change")
    val yoyChange: Double = 0.0,  // Year-over-year change percentage
    @SerialName("yoy_absolute")
    val yoyAbsolute: Double = 0.0,  // Year-over-year absolute change
    @SerialName("prev_month_value")
    val prevMonthValue: Double = 0.0,
    @SerialName("prev_year_value")
    val prevYearValue: Double = 0.0,
    @SerialName("trend")
    val trend: List<GrowthDataPoint> = emptyList()  // Last 6 months trend data
) {
    val isMomPositive: Boolean get() = momChange >= 0
    val isYoyPositive: Boolean get() = yoyChange >= 0

    val formattedMomChange: String get() = "${if (isMomPositive) "+" else ""}%.1f%%".format(momChange)
    val formattedYoyChange: String get() = "${if (isYoyPositive) "+" else ""}%.1f%%".format(yoyChange)
}

@Serializable
data class GrowthDataPoint(
    val month: String,  // e.g., "Jan", "Feb"
    val value: Double
)

@Serializable
data class FAInsights(
    @SerialName("portfolio_health")
    val portfolioHealth: List<PortfolioHealthItem> = emptyList(),
    @SerialName("rebalancing_alerts")
    val rebalancingAlerts: List<RebalancingAlert> = emptyList(),
    @SerialName("tax_harvesting")
    val taxHarvesting: List<TaxHarvestingOpportunity> = emptyList(),
    @SerialName("goal_alerts")
    val goalAlerts: List<GoalAlert> = emptyList(),
    @SerialName("market_insights")
    val marketInsights: List<MarketInsight> = emptyList()
)

@Serializable
data class PortfolioHealthItem(
    @SerialName("client_id")
    val clientId: String,
    @SerialName("client_name")
    val clientName: String,
    val score: Int, // 0-100
    val issues: List<String> = emptyList(),
    val recommendations: List<String> = emptyList()
)

@Serializable
data class RebalancingAlert(
    @SerialName("client_id")
    val clientId: String,
    @SerialName("client_name")
    val clientName: String,
    @SerialName("asset_class")
    val assetClass: String,
    @SerialName("current_allocation")
    val currentAllocation: Double,
    @SerialName("target_allocation")
    val targetAllocation: Double,
    val deviation: Double,
    val action: String // "INCREASE" or "DECREASE"
)

@Serializable
data class TaxHarvestingOpportunity(
    @SerialName("client_id")
    val clientId: String,
    @SerialName("client_name")
    val clientName: String,
    @SerialName("fund_name")
    val fundName: String,
    @SerialName("unrealized_loss")
    val unrealizedLoss: Double,
    @SerialName("potential_savings")
    val potentialSavings: Double
)

@Serializable
data class GoalAlert(
    @SerialName("client_id")
    val clientId: String,
    @SerialName("client_name")
    val clientName: String,
    @SerialName("goal_name")
    val goalName: String,
    val status: String, // "ON_TRACK", "AT_RISK", "OFF_TRACK"
    val message: String
)

@Serializable
data class MarketInsight(
    val title: String,
    val summary: String,
    val category: String,
    val impact: String, // "POSITIVE", "NEGATIVE", "NEUTRAL"
    @SerialName("created_at")
    val createdAt: String
)

@Serializable
data class MarketIndex(
    val name: String,
    val symbol: String = "",
    val currentValue: Double = 0.0,
    val change: Double = 0.0,
    val changePercent: Double = 0.0,
    val previousClose: Double = 0.0,
    val dayHigh: Double? = null,
    val dayLow: Double? = null,
    val lastUpdated: String? = null
) {
    val isPositive: Boolean get() = change >= 0
    val formattedValue: String get() = "%,.2f".format(currentValue)
    val formattedChange: String get() = "${if (isPositive) "+" else ""}%,.2f".format(change)
    val formattedChangePercent: String get() = "${if (isPositive) "+" else ""}%.2f%%".format(changePercent)
}
