package com.sparrowinvest.fa.data.model

import kotlinx.serialization.Serializable

@Serializable
data class FASip(
    val id: String,
    val clientId: String = "",
    val clientName: String? = null,
    val schemeCode: Int = 0,
    val fundName: String,
    val amount: Double,
    val frequency: String = "MONTHLY", // "WEEKLY", "MONTHLY", "QUARTERLY"
    val sipDate: Int = 1, // Day of month (1-28)
    val nextDate: String? = null,
    val status: String = "ACTIVE", // "ACTIVE", "PAUSED", "CANCELLED"
    val totalInvested: Double = 0.0,
    val totalUnits: Double = 0.0,
    val installmentsPaid: Int = 0,
    val startDate: String? = null,
    val createdAt: String? = null
) {
    val formattedAmount: String get() = "₹${"%,.0f".format(amount)}"
    val formattedTotalInvested: String get() = "₹${"%,.0f".format(totalInvested)}"

    val isActive: Boolean get() = status == "ACTIVE"
    val isPaused: Boolean get() = status == "PAUSED"
}

@Serializable
data class PaginatedSipsResponse(
    val data: List<FASip> = emptyList(),
    val total: Int = 0,
    val page: Int = 1,
    val limit: Int = 20,
    val totalPages: Int = 0
)

@Serializable
data class CreateSipRequest(
    val clientId: String,
    val schemeCode: Int,
    val amount: Double,
    val frequency: String = "MONTHLY",
    val sipDate: Int = 1,
    val familyMemberId: String? = null
)
