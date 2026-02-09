package com.sparrowinvest.fa.data.model

import kotlinx.serialization.Serializable

// Generic API response wrapper
@Serializable
data class ApiResponse<T>(
    val data: T
)

@Serializable
data class Client(
    val id: String,
    val name: String,
    val email: String,
    val phone: String? = null,
    val aum: Double = 0.0,
    val returns: Double = 0.0,
    val riskProfile: String? = null,
    val kycStatus: String? = "PENDING",
    val sipCount: Int = 0,
    val familyGroupId: String? = null,
    val familyRole: String? = null,
    val status: String? = null,
    val lastActive: String? = null,
    val joinedDate: String? = null,
    val createdAt: String? = null
) {
    val initials: String get() = name.split(" ").mapNotNull { it.firstOrNull()?.uppercase() }.take(2).joinToString("")

    val formattedAum: String get() {
        return when {
            aum >= 10000000 -> "%.2f Cr".format(aum / 10000000)
            aum >= 100000 -> "%.2f L".format(aum / 100000)
            aum >= 1000 -> "%.2f K".format(aum / 1000)
            else -> "%.0f".format(aum)
        }
    }
}

@Serializable
data class ClientDetail(
    val id: String,
    val name: String,
    val email: String,
    val phone: String? = null,
    val aum: Double = 0.0,
    val returns: Double = 0.0,
    val riskProfile: String? = null,
    val kycStatus: String? = "PENDING",
    val panNumber: String? = null,
    val address: String? = null,
    val holdings: List<Holding> = emptyList(),
    val sips: List<FASip> = emptyList(),
    val familyMembers: List<FamilyMember> = emptyList(),
    val recentTransactions: List<FATransaction> = emptyList(),
    val createdAt: String? = null
)

@Serializable
data class Holding(
    val id: String,
    val schemeCode: Int? = null,
    val fundName: String,
    val fundSchemeCode: String? = null,
    val fundCategory: String? = null,
    val category: String? = null,
    val units: Double = 0.0,
    val nav: Double? = null,
    val avgNav: Double? = null,
    val currentNav: Double? = null,
    val currentValue: Double = 0.0,
    val investedValue: Double = 0.0,
    val absoluteGain: Double? = null,
    val absoluteGainPct: Double? = null,
    val returns: Double = 0.0,
    val returnsPercentage: Double = 0.0,
    val xirr: Double? = null
)

@Serializable
data class FamilyMember(
    val id: String,
    val name: String,
    val relationship: String, // "SELF", "SPOUSE", "CHILD", "PARENT", "SIBLING"
    val aum: Double = 0.0,
    val clientId: String? = null, // Link to client profile for navigation
    val holdingsCount: Int = 0,
    val sipCount: Int = 0,
    val returns: Double = 0.0,
    val kycStatus: String? = null,
    val hasFolio: Boolean = true // Only show members with folio
) {
    val relationshipLabel: String get() = when (relationship.uppercase()) {
        "SELF" -> "Head"
        "SPOUSE" -> "Spouse"
        "CHILD" -> "Child"
        "PARENT" -> "Parent"
        "SIBLING" -> "Sibling"
        else -> relationship
    }

    val initials: String get() = name.split(" ").mapNotNull { it.firstOrNull()?.uppercase() }.take(2).joinToString("")
}

@Serializable
data class CreateClientRequest(
    val name: String,
    val email: String,
    val phone: String? = null,
    val panNumber: String? = null,
    val riskProfile: String? = null,
    val address: String? = null
)

@Serializable
data class UpdateClientRequest(
    val name: String? = null,
    val email: String? = null,
    val phone: String? = null,
    val panNumber: String? = null,
    val riskProfile: String? = null,
    val address: String? = null
)
