package com.sparrowinvest.fa.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class WhitelistedFund(
    @SerialName("id") val id: String,
    @SerialName("schemeCode") val schemeCode: Int,
    @SerialName("schemeName") val schemeName: String,
    @SerialName("schemeCategory") val schemeCategory: String? = null,
    @SerialName("nav") val nav: Double? = null,
    @SerialName("returns1y") val returns1y: Double? = null,
    @SerialName("returns3y") val returns3y: Double? = null,
    @SerialName("returns5y") val returns5y: Double? = null,
    @SerialName("riskRating") val riskRating: Int? = null,
    @SerialName("fundRating") val fundRating: Int? = null,
    @SerialName("aum") val aum: Double? = null,
    @SerialName("year") val year: Int,
    @SerialName("notes") val notes: String? = null,
    @SerialName("addedAt") val addedAt: String
) {
    val riskLevel: String? get() = when (riskRating) {
        1 -> "Low"
        2 -> "Low to Moderate"
        3 -> "Moderate"
        4 -> "Moderately High"
        5 -> "High"
        else -> null
    }
}

@Serializable
data class AddToWhitelistRequest(
    @SerialName("schemeCode") val schemeCode: Int,
    @SerialName("year") val year: Int,
    @SerialName("notes") val notes: String? = null
)
