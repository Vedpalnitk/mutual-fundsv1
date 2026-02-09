package com.sparrowinvest.fa.data.model

import kotlinx.serialization.Serializable

@Serializable
data class FATransaction(
    val id: String,
    val clientId: String,
    val clientName: String,
    val fundName: String,
    val fundSchemeCode: String,
    val fundCategory: String,
    val type: String, // "Buy", "Sell", "SIP", "SWP", "Switch", "STP"
    val amount: Double,
    val units: Double = 0.0,
    val nav: Double = 0.0,
    val status: String, // "Pending", "Completed", "Processing", "Failed", "Cancelled"
    val date: String,
    val folioNumber: String,
    val orderId: String? = null,
    val paymentMode: String? = null,
    val remarks: String? = null
) {
    val formattedAmount: String get() = "₹${"%,.0f".format(amount)}"
    val formattedUnits: String get() = if (units > 0) "%.4f".format(units) else "-"

    val isPending: Boolean get() = status == "Pending"
    val isClientRequest: Boolean get() = remarks?.contains("Client Request") == true
}

@Serializable
data class ExecuteTradeRequest(
    val clientId: String,
    val schemeCode: String,
    val amount: Double,
    val familyMemberId: String? = null,
    val notes: String? = null
)

@Serializable
data class UpdateStatusRequest(
    val status: String, // "Approved", "Rejected", "Executed"
    val notes: String? = null
)
