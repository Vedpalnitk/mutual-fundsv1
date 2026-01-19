package com.sparrowinvest.app.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class PointsBalance(
    @SerialName("total_points")
    val totalPoints: Int = 0,
    @SerialName("lifetime_earned")
    val lifetimeEarned: Int = 0,
    @SerialName("lifetime_redeemed")
    val lifetimeRedeemed: Int = 0,
    @SerialName("points_expiring_soon")
    val pointsExpiringSoon: Int = 0,
    @SerialName("expiry_date")
    val expiryDate: String? = null
)

@Serializable
data class PointsTransaction(
    val id: String,
    val type: PointsTransactionType,
    val points: Int,
    val description: String,
    val date: String,
    @SerialName("reference_id")
    val referenceId: String? = null
)

@Serializable
enum class PointsTransactionType {
    @SerialName("earned")
    EARNED,
    @SerialName("redeemed")
    REDEEMED,
    @SerialName("expired")
    EXPIRED,
    @SerialName("bonus")
    BONUS;

    val displayName: String
        get() = when (this) {
            EARNED -> "Earned"
            REDEEMED -> "Redeemed"
            EXPIRED -> "Expired"
            BONUS -> "Bonus"
        }

    val isCredit: Boolean
        get() = this in listOf(EARNED, BONUS)
}

@Serializable
data class Reward(
    val id: String,
    val name: String,
    val description: String,
    @SerialName("points_required")
    val pointsRequired: Int,
    val category: RewardCategory,
    @SerialName("image_url")
    val imageUrl: String? = null,
    @SerialName("expiry_date")
    val expiryDate: String? = null,
    val available: Boolean = true
)

@Serializable
enum class RewardCategory {
    @SerialName("fee_waiver")
    FEE_WAIVER,
    @SerialName("cashback")
    CASHBACK,
    @SerialName("gift_card")
    GIFT_CARD,
    @SerialName("premium_feature")
    PREMIUM_FEATURE;

    val displayName: String
        get() = when (this) {
            FEE_WAIVER -> "Fee Waiver"
            CASHBACK -> "Cashback"
            GIFT_CARD -> "Gift Card"
            PREMIUM_FEATURE -> "Premium Feature"
        }
}
