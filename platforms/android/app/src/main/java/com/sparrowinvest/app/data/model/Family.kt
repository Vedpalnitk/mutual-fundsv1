package com.sparrowinvest.app.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class FamilyPortfolio(
    val id: String,
    val name: String,
    val members: List<FamilyMember> = emptyList(),
    @SerialName("total_value")
    val totalValue: Double = 0.0,
    @SerialName("total_invested")
    val totalInvested: Double = 0.0,
    @SerialName("total_returns")
    val totalReturns: Double = 0.0,
    @SerialName("returns_percentage")
    val returnsPercentage: Double = 0.0,
    @SerialName("asset_allocation")
    val assetAllocation: AssetAllocation = AssetAllocation()
)

@Serializable
data class FamilyMember(
    val id: String,
    val name: String,
    val relationship: Relationship,
    @SerialName("portfolio_value")
    val portfolioValue: Double = 0.0,
    val contribution: Double = 0.0, // Percentage contribution to family portfolio
    val avatar: String? = null
) {
    val initials: String
        get() = name.split(" ")
            .take(2)
            .mapNotNull { it.firstOrNull()?.uppercase() }
            .joinToString("")
}

@Serializable
enum class Relationship {
    @SerialName("self")
    SELF,
    @SerialName("spouse")
    SPOUSE,
    @SerialName("parent")
    PARENT,
    @SerialName("child")
    CHILD,
    @SerialName("sibling")
    SIBLING,
    @SerialName("other")
    OTHER;

    val displayName: String
        get() = when (this) {
            SELF -> "Self"
            SPOUSE -> "Spouse"
            PARENT -> "Parent"
            CHILD -> "Child"
            SIBLING -> "Sibling"
            OTHER -> "Other"
        }

    val color: Long
        get() = when (this) {
            SELF -> 0xFF2563EB
            SPOUSE -> 0xFFEC4899
            PARENT -> 0xFF10B981
            CHILD -> 0xFFF59E0B
            SIBLING -> 0xFF8B5CF6
            OTHER -> 0xFF64748B
        }
}
