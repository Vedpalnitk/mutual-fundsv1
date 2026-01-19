package com.sparrowinvest.app.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class Portfolio(
    @SerialName("total_value")
    val totalValue: Double = 0.0,
    @SerialName("total_invested")
    val totalInvested: Double = 0.0,
    @SerialName("total_returns")
    val totalReturns: Double = 0.0,
    @SerialName("returns_percentage")
    val returnsPercentage: Double = 0.0,
    @SerialName("today_change")
    val todayChange: Double = 0.0,
    @SerialName("today_change_percentage")
    val todayChangePercentage: Double = 0.0,
    val xirr: Double? = null,
    @SerialName("asset_allocation")
    val assetAllocation: AssetAllocation = AssetAllocation(),
    val holdings: List<Holding> = emptyList(),
    val sips: List<Sip> = emptyList()
)

@Serializable
data class AssetAllocation(
    val equity: Double = 0.0,
    val debt: Double = 0.0,
    val hybrid: Double = 0.0,
    val gold: Double = 0.0,
    val other: Double = 0.0
) {
    val total: Double get() = equity + debt + hybrid + gold + other

    fun toList(): List<Pair<AssetClass, Double>> {
        return listOf(
            AssetClass.EQUITY to equity,
            AssetClass.DEBT to debt,
            AssetClass.HYBRID to hybrid,
            AssetClass.GOLD to gold,
            AssetClass.OTHER to other
        ).filter { it.second > 0 }
    }
}

@Serializable
data class Holding(
    val id: String,
    @SerialName("fund_code")
    val fundCode: String,
    @SerialName("fund_name")
    val fundName: String,
    val category: String,
    @SerialName("asset_class")
    val assetClass: String = "equity",
    val units: Double,
    @SerialName("average_nav")
    val averageNav: Double,
    @SerialName("current_nav")
    val currentNav: Double,
    @SerialName("invested_amount")
    val investedAmount: Double,
    @SerialName("current_value")
    val currentValue: Double,
    val returns: Double,
    @SerialName("returns_percentage")
    val returnsPercentage: Double,
    @SerialName("day_change")
    val dayChange: Double = 0.0,
    @SerialName("day_change_percentage")
    val dayChangePercentage: Double = 0.0
) {
    val assetClassEnum: AssetClass get() = AssetClass.fromString(assetClass)
    val isPositiveReturn: Boolean get() = returns >= 0
    val isPositiveDayChange: Boolean get() = dayChange >= 0
}

@Serializable
data class Sip(
    val id: String,
    @SerialName("fund_code")
    val fundCode: String,
    @SerialName("fund_name")
    val fundName: String,
    val amount: Double,
    val frequency: SipFrequency = SipFrequency.MONTHLY,
    @SerialName("next_date")
    val nextDate: String,
    val status: SipStatus = SipStatus.ACTIVE,
    @SerialName("total_invested")
    val totalInvested: Double = 0.0,
    @SerialName("sip_count")
    val sipCount: Int = 0
)

@Serializable
enum class SipFrequency {
    @SerialName("monthly")
    MONTHLY,
    @SerialName("quarterly")
    QUARTERLY,
    @SerialName("weekly")
    WEEKLY;

    val displayName: String
        get() = when (this) {
            MONTHLY -> "Monthly"
            QUARTERLY -> "Quarterly"
            WEEKLY -> "Weekly"
        }
}

@Serializable
enum class SipStatus {
    @SerialName("active")
    ACTIVE,
    @SerialName("paused")
    PAUSED,
    @SerialName("completed")
    COMPLETED,
    @SerialName("cancelled")
    CANCELLED;

    val displayName: String
        get() = when (this) {
            ACTIVE -> "Active"
            PAUSED -> "Paused"
            COMPLETED -> "Completed"
            CANCELLED -> "Cancelled"
        }
}

@Serializable
data class Transaction(
    val id: String,
    @SerialName("fund_code")
    val fundCode: String,
    @SerialName("fund_name")
    val fundName: String,
    val type: TransactionType,
    val amount: Double,
    val units: Double,
    val nav: Double,
    val date: String,
    val status: TransactionStatus = TransactionStatus.COMPLETED
)

@Serializable
enum class TransactionType {
    @SerialName("purchase")
    PURCHASE,
    @SerialName("redemption")
    REDEMPTION,
    @SerialName("sip")
    SIP_INSTALLMENT,
    @SerialName("switch_in")
    SWITCH_IN,
    @SerialName("switch_out")
    SWITCH_OUT,
    @SerialName("dividend")
    DIVIDEND;

    val displayName: String
        get() = when (this) {
            PURCHASE -> "Purchase"
            REDEMPTION -> "Redemption"
            SIP_INSTALLMENT -> "SIP"
            SWITCH_IN -> "Switch In"
            SWITCH_OUT -> "Switch Out"
            DIVIDEND -> "Dividend"
        }

    val isCredit: Boolean
        get() = this in listOf(PURCHASE, SIP_INSTALLMENT, SWITCH_IN, DIVIDEND)
}

@Serializable
enum class TransactionStatus {
    @SerialName("pending")
    PENDING,
    @SerialName("processing")
    PROCESSING,
    @SerialName("completed")
    COMPLETED,
    @SerialName("failed")
    FAILED;

    val displayName: String
        get() = when (this) {
            PENDING -> "Pending"
            PROCESSING -> "Processing"
            COMPLETED -> "Completed"
            FAILED -> "Failed"
        }
}
