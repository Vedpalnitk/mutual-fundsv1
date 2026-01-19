package com.sparrowinvest.app.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class MarketIndex(
    val name: String,
    val value: Double,
    val change: Double,
    @SerialName("change_percentage")
    val changePercentage: Double,
    @SerialName("last_updated")
    val lastUpdated: String? = null
) {
    val isPositive: Boolean get() = change >= 0
}

@Serializable
data class MarketSummary(
    val nifty50: MarketIndex? = null,
    val sensex: MarketIndex? = null,
    val niftyBank: MarketIndex? = null,
    @SerialName("market_status")
    val marketStatus: MarketStatus = MarketStatus.CLOSED,
    @SerialName("next_open")
    val nextOpen: String? = null
)

@Serializable
enum class MarketStatus {
    @SerialName("open")
    OPEN,
    @SerialName("closed")
    CLOSED,
    @SerialName("pre_open")
    PRE_OPEN;

    val displayName: String
        get() = when (this) {
            OPEN -> "Market Open"
            CLOSED -> "Market Closed"
            PRE_OPEN -> "Pre-Open"
        }

    val color: Long
        get() = when (this) {
            OPEN -> 0xFF10B981
            CLOSED -> 0xFFEF4444
            PRE_OPEN -> 0xFFF59E0B
        }
}

@Serializable
data class Watchlist(
    val id: String,
    val name: String,
    val funds: List<String> = emptyList(), // Fund scheme codes
    @SerialName("created_at")
    val createdAt: String? = null
)
