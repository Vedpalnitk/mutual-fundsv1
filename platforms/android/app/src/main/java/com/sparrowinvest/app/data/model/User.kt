package com.sparrowinvest.app.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class User(
    val id: String,
    @SerialName("first_name")
    val firstName: String,
    @SerialName("last_name")
    val lastName: String,
    val email: String,
    val phone: String,
    @SerialName("pan_number")
    val panNumber: String? = null,
    @SerialName("kyc_status")
    val kycStatus: KycStatus = KycStatus.PENDING,
    @SerialName("risk_profile")
    val riskProfile: RiskProfile? = null,
    @SerialName("created_at")
    val createdAt: String? = null
) {
    val fullName: String get() = "$firstName $lastName"
    val initials: String get() = "${firstName.firstOrNull() ?: ""}${lastName.firstOrNull() ?: ""}".uppercase()
}

@Serializable
enum class KycStatus {
    @SerialName("pending")
    PENDING,
    @SerialName("in_progress")
    IN_PROGRESS,
    @SerialName("verified")
    VERIFIED,
    @SerialName("rejected")
    REJECTED
}

@Serializable
data class RiskProfile(
    val score: Int, // 1-10
    val category: RiskCategory,
    @SerialName("assessed_at")
    val assessedAt: String? = null
)

@Serializable
enum class RiskCategory {
    @SerialName("Conservative")
    CONSERVATIVE,
    @SerialName("Moderately Conservative")
    MODERATELY_CONSERVATIVE,
    @SerialName("Moderate")
    MODERATE,
    @SerialName("Moderately Aggressive")
    MODERATELY_AGGRESSIVE,
    @SerialName("Aggressive")
    AGGRESSIVE;

    val displayName: String
        get() = when (this) {
            CONSERVATIVE -> "Conservative"
            MODERATELY_CONSERVATIVE -> "Moderately Conservative"
            MODERATE -> "Moderate"
            MODERATELY_AGGRESSIVE -> "Moderately Aggressive"
            AGGRESSIVE -> "Aggressive"
        }
}
