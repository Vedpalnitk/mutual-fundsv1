package com.sparrowinvest.app.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class ClassifyRequest(
    val holdings: List<ClassifyHolding>,
    @SerialName("risk_profile")
    val riskProfile: String? = null
)

@Serializable
data class ClassifyHolding(
    @SerialName("fund_name")
    val fundName: String,
    @SerialName("scheme_code")
    val schemeCode: Int? = null,
    @SerialName("current_value")
    val currentValue: Double
)

@Serializable
data class ClassifyResponse(
    val analysis: PortfolioAnalysis,
    val recommendations: List<String> = emptyList(),
    @SerialName("risk_assessment")
    val riskAssessment: RiskAssessment? = null
)

@Serializable
data class PortfolioAnalysis(
    @SerialName("overall_score")
    val overallScore: Int, // 1-100
    @SerialName("diversification_score")
    val diversificationScore: Int,
    @SerialName("risk_alignment_score")
    val riskAlignmentScore: Int,
    @SerialName("cost_efficiency_score")
    val costEfficiencyScore: Int,
    val summary: String,
    val strengths: List<String> = emptyList(),
    val weaknesses: List<String> = emptyList(),
    @SerialName("asset_breakdown")
    val assetBreakdown: Map<String, Double>? = null
)

@Serializable
data class RiskAssessment(
    @SerialName("current_risk_level")
    val currentRiskLevel: String,
    @SerialName("recommended_risk_level")
    val recommendedRiskLevel: String,
    val aligned: Boolean,
    val explanation: String
)

@Serializable
data class RecommendationsRequest(
    val holdings: List<ClassifyHolding>,
    @SerialName("risk_profile")
    val riskProfile: String? = null,
    @SerialName("investment_goal")
    val investmentGoal: String? = null,
    @SerialName("investment_horizon")
    val investmentHorizon: String? = null, // "short", "medium", "long"
    @SerialName("monthly_investment")
    val monthlyInvestment: Double? = null
)

@Serializable
data class RecommendationsResponse(
    val recommendations: List<FundRecommendation>,
    val rationale: String,
    @SerialName("suggested_allocation")
    val suggestedAllocation: Map<String, Double>? = null,
    @SerialName("action_items")
    val actionItems: List<ActionItem> = emptyList()
)

@Serializable
data class FundRecommendation(
    @SerialName("scheme_code")
    val schemeCode: Int,
    @SerialName("scheme_name")
    val schemeName: String,
    val category: String,
    val reason: String,
    @SerialName("suggested_allocation")
    val suggestedAllocation: Double, // Percentage
    @SerialName("expected_returns")
    val expectedReturns: String? = null,
    @SerialName("risk_level")
    val riskLevel: String? = null
)

@Serializable
data class ActionItem(
    val action: ActionType,
    @SerialName("fund_name")
    val fundName: String,
    @SerialName("scheme_code")
    val schemeCode: Int? = null,
    val amount: Double? = null,
    val percentage: Double? = null,
    val reason: String,
    val priority: ActionPriority = ActionPriority.MEDIUM
)

@Serializable
enum class ActionType {
    @SerialName("buy")
    BUY,
    @SerialName("sell")
    SELL,
    @SerialName("hold")
    HOLD,
    @SerialName("increase_sip")
    INCREASE_SIP,
    @SerialName("start_sip")
    START_SIP,
    @SerialName("rebalance")
    REBALANCE;

    val displayName: String
        get() = when (this) {
            BUY -> "Buy"
            SELL -> "Sell"
            HOLD -> "Hold"
            INCREASE_SIP -> "Increase SIP"
            START_SIP -> "Start SIP"
            REBALANCE -> "Rebalance"
        }

    val color: Long
        get() = when (this) {
            BUY, START_SIP, INCREASE_SIP -> 0xFF10B981
            SELL -> 0xFFEF4444
            HOLD -> 0xFF64748B
            REBALANCE -> 0xFFF59E0B
        }
}

@Serializable
enum class ActionPriority {
    @SerialName("high")
    HIGH,
    @SerialName("medium")
    MEDIUM,
    @SerialName("low")
    LOW;

    val displayName: String
        get() = when (this) {
            HIGH -> "High"
            MEDIUM -> "Medium"
            LOW -> "Low"
        }
}

@Serializable
data class InvestorProfile(
    val age: Int? = null,
    @SerialName("income_range")
    val incomeRange: String? = null,
    @SerialName("investment_experience")
    val investmentExperience: String? = null,
    @SerialName("risk_tolerance")
    val riskTolerance: String? = null,
    @SerialName("primary_goal")
    val primaryGoal: String? = null,
    @SerialName("investment_horizon")
    val investmentHorizon: String? = null,
    @SerialName("existing_investments")
    val existingInvestments: List<String>? = null
)
