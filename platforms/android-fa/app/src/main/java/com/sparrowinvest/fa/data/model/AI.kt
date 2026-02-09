package com.sparrowinvest.fa.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class ClassifyRequest(
    val holdings: List<HoldingInput>,
    @SerialName("risk_profile")
    val riskProfile: String? = null
)

@Serializable
data class HoldingInput(
    @SerialName("scheme_code")
    val schemeCode: Int,
    val amount: Double
)

@Serializable
data class ClassifyResponse(
    val classification: PortfolioClassification,
    @SerialName("risk_score")
    val riskScore: Int,
    val suggestions: List<String> = emptyList()
)

@Serializable
data class PortfolioClassification(
    val equity: Double,
    val debt: Double,
    val hybrid: Double,
    val gold: Double = 0.0,
    val other: Double = 0.0
)

@Serializable
data class RecommendationsRequest(
    @SerialName("risk_profile")
    val riskProfile: String,
    @SerialName("investment_amount")
    val investmentAmount: Double,
    @SerialName("investment_horizon")
    val investmentHorizon: String, // "SHORT", "MEDIUM", "LONG"
    val goals: List<String> = emptyList(),
    @SerialName("existing_holdings")
    val existingHoldings: List<HoldingInput> = emptyList()
)

@Serializable
data class RecommendationsResponse(
    val recommendations: List<FundRecommendation>,
    @SerialName("suggested_allocation")
    val suggestedAllocation: PortfolioClassification,
    val rationale: String? = null
)

@Serializable
data class FundRecommendation(
    @SerialName("scheme_code")
    val schemeCode: Int,
    @SerialName("fund_name")
    val fundName: String,
    val category: String,
    @SerialName("allocation_percentage")
    val allocationPercentage: Double,
    @SerialName("suggested_amount")
    val suggestedAmount: Double,
    val reason: String? = null,
    @SerialName("returns_1y")
    val returns1y: Double? = null,
    @SerialName("risk_level")
    val riskLevel: String? = null
)

// MARK: - Avya Chat Models

@Serializable
data class ChatSession(
    val id: String,
    val userId: String,
    val title: String? = null,
    val isActive: Boolean,
    val createdAt: String
)

@Serializable
data class CreateSessionRequest(
    val title: String? = null
)

@Serializable
data class SendMessageRequest(
    val sessionId: String,
    val content: String,
    val speakResponse: Boolean? = null
)

@Serializable
data class ChatMessageResponse(
    val messageId: String,
    val status: String,
    val content: String? = null,
    val audioUrl: String? = null,
    val error: String? = null,
    val createdAt: String? = null
)

@Serializable
data class ChatMessageStatus(
    val messageId: String,
    val status: String,
    val content: String? = null,
    val audioUrl: String? = null,
    val error: String? = null
)

@Serializable
data class ChatHistoryMessage(
    val id: String,
    val role: String,
    val content: String,
    val createdAt: String
)

// UI Model for chat messages
data class AvyaChatMessage(
    val id: String,
    val content: String,
    val isUser: Boolean,
    val timestamp: Long = System.currentTimeMillis(),
    val audioUrl: String? = null
)
