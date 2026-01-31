package com.sparrowinvest.app.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/**
 * Trade request for FA-managed users
 */
@Serializable
data class TradeRequest(
    val fundName: String,
    val fundSchemeCode: String,
    val fundCategory: String,
    val type: TradeType,
    val amount: Double,
    val remarks: String? = null
)

@Serializable
enum class TradeType {
    @SerialName("BUY")
    BUY,
    @SerialName("SELL")
    SELL,
    @SerialName("SIP")
    SIP;

    val displayName: String
        get() = when (this) {
            BUY -> "Buy"
            SELL -> "Sell"
            SIP -> "SIP"
        }
}

/**
 * Response from trade request submission
 */
@Serializable
data class TradeRequestResponse(
    val success: Boolean,
    val message: String,
    val transaction: TransactionSummary? = null,
    val advisorId: String? = null
)

@Serializable
data class TransactionSummary(
    val id: String,
    val fundName: String,
    val type: String,
    val amount: Double,
    val status: String,
    val date: String,
    val orderId: String? = null
)

/**
 * Trade request history item
 */
@Serializable
data class MyTradeRequest(
    val id: String,
    val fundName: String,
    val fundCategory: String,
    val type: String,
    val amount: Double,
    val units: Double = 0.0,
    val nav: Double = 0.0,
    val status: String,
    val date: String,
    val folioNumber: String = "",
    val orderId: String? = null,
    val remarks: String? = null
) {
    val statusColor: Long
        get() = when (status.lowercase()) {
            "completed" -> 0xFF10B981
            "pending" -> 0xFFF59E0B
            "processing" -> 0xFF3B82F6
            "failed", "cancelled" -> 0xFFEF4444
            else -> 0xFF64748B
        }

    val isCompleted: Boolean
        get() = status.lowercase() == "completed"

    val isPending: Boolean
        get() = status.lowercase() == "pending"
}
