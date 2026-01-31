package com.sparrowinvest.app.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/**
 * Response from /auth/me/portfolio endpoint
 * Contains clientType to determine if user is self-service or managed by FA
 */
@Serializable
data class PortfolioResponse(
    @SerialName("clientType")
    val clientType: String = "self", // "self" or "managed"
    val portfolio: PortfolioData,
    val advisor: AdvisorInfo? = null,
    val family: FamilyData? = null
)

@Serializable
data class PortfolioData(
    @SerialName("totalValue")
    val totalValue: Double = 0.0,
    @SerialName("totalInvested")
    val totalInvested: Double = 0.0,
    @SerialName("totalReturns")
    val totalReturns: Double = 0.0,
    @SerialName("returnsPercentage")
    val returnsPercentage: Double = 0.0,
    @SerialName("holdingsCount")
    val holdingsCount: Int = 0,
    @SerialName("activeSIPs")
    val activeSIPs: Int = 0,
    val holdings: List<HoldingData>? = null
)

@Serializable
data class HoldingData(
    val id: String,
    val fundName: String,
    val fundCategory: String,
    val assetClass: String = "equity",
    val units: String = "0",
    val avgNav: String = "0",
    val currentNav: String = "0",
    val investedValue: String = "0",
    val currentValue: String = "0",
    val gain: String = "0",
    val gainPercent: String = "0"
)

@Serializable
data class AdvisorInfo(
    val id: String,
    val name: String,
    val email: String
)

@Serializable
data class FamilyData(
    val id: String? = null,
    val name: String? = null,
    val members: List<FamilyMemberData> = emptyList(),
    val totalValue: Double = 0.0,
    val totalInvested: Double = 0.0,
    val totalReturns: Double = 0.0,
    val returnsPercentage: Double = 0.0
)

@Serializable
data class FamilyMemberData(
    val id: String,
    val name: String,
    val role: String? = null,
    val isCurrentUser: Boolean = false,
    val portfolio: PortfolioData
)

/**
 * Enum for client types
 */
enum class ClientType(val value: String) {
    SELF("self"),
    MANAGED("managed");

    companion object {
        fun fromString(value: String): ClientType {
            return entries.find { it.value == value.lowercase() } ?: SELF
        }
    }
}
