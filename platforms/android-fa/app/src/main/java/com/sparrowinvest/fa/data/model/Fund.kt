package com.sparrowinvest.fa.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class Fund(
    @SerialName("schemeCode")
    val schemeCode: Int,
    @SerialName("schemeName")
    val schemeName: String,
    @SerialName("schemeType")
    val schemeType: String? = null,
    @SerialName("category")
    val schemeCategory: String? = null,
    @SerialName("currentNav")
    val nav: Double? = null,
    @SerialName("navDate")
    val navDate: String? = null,
    @SerialName("aum")
    val aum: Double? = null,
    @SerialName("expenseRatio")
    val expenseRatio: Double? = null,
    @SerialName("return1Y")
    val returns1y: Double? = null,
    @SerialName("return3Y")
    val returns3y: Double? = null,
    @SerialName("return5Y")
    val returns5y: Double? = null,
    @SerialName("riskRating")
    val riskRating: Int? = null,
    @SerialName("fundRating")
    val fundRating: Int? = null
) {
    val riskLevel: String? get() = when (riskRating) {
        1 -> "Low"
        2 -> "Low to Moderate"
        3 -> "Moderate"
        4 -> "Moderately High"
        5 -> "High"
        else -> null
    }

    val formattedNavDate: String? get() {
        val dateStr = navDate ?: return null
        return try {
            val parsed = java.time.OffsetDateTime.parse(dateStr)
            parsed.format(java.time.format.DateTimeFormatter.ofPattern("dd MMM yyyy"))
        } catch (_: Exception) {
            try {
                val parsed = java.time.LocalDate.parse(dateStr.take(10))
                parsed.format(java.time.format.DateTimeFormatter.ofPattern("dd MMM yyyy"))
            } catch (_: Exception) {
                dateStr
            }
        }
    }
}

@Serializable
data class FundDetail(
    @SerialName("schemeCode")
    val schemeCode: Int,
    @SerialName("schemeName")
    val schemeName: String,
    @SerialName("schemeType")
    val schemeType: String? = null,
    @SerialName("category")
    val schemeCategory: String? = null,
    @SerialName("currentNav")
    val nav: Double? = null,
    @SerialName("navDate")
    val navDate: String? = null,
    @SerialName("aum")
    val aum: Double? = null,
    @SerialName("expenseRatio")
    val expenseRatio: Double? = null,
    @SerialName("return1Y")
    val returns1y: Double? = null,
    @SerialName("return3Y")
    val returns3y: Double? = null,
    @SerialName("return5Y")
    val returns5y: Double? = null,
    @SerialName("riskRating")
    val riskRating: Int? = null,
    @SerialName("minSipAmount")
    val minSipAmount: Double? = null,
    @SerialName("minLumpsumAmount")
    val minLumpsumAmount: Double? = null,
    @SerialName("exitLoad")
    val exitLoad: String? = null,
    @SerialName("fundManager")
    val fundManager: String? = null,
    @SerialName("fundHouse")
    val fundHouse: String? = null,
    @SerialName("launchDate")
    val launchDate: String? = null,
    @SerialName("benchmark")
    val benchmark: String? = null,
    val holdings: List<FundHolding>? = null,
    @SerialName("fundRating")
    val fundRating: Int? = null
) {
    val riskLevel: String? get() = when (riskRating) {
        1 -> "Low"
        2 -> "Low to Moderate"
        3 -> "Moderate"
        4 -> "Moderately High"
        5 -> "High"
        else -> null
    }

    val formattedNavDate: String? get() {
        val dateStr = navDate ?: return null
        return try {
            val parsed = java.time.OffsetDateTime.parse(dateStr)
            parsed.format(java.time.format.DateTimeFormatter.ofPattern("dd MMM yyyy"))
        } catch (_: Exception) {
            try {
                val parsed = java.time.LocalDate.parse(dateStr.take(10))
                parsed.format(java.time.format.DateTimeFormatter.ofPattern("dd MMM yyyy"))
            } catch (_: Exception) {
                dateStr
            }
        }
    }
}

@Serializable
data class FundHolding(
    val name: String,
    val sector: String? = null,
    val percentage: Double
)

@Serializable
data class NavHistoryPoint(
    val date: String,
    val nav: Double
)
