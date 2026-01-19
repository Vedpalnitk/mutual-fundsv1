package com.sparrowinvest.app.data.model

import androidx.compose.ui.graphics.Color
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class Fund(
    val id: String = "",
    @SerialName("scheme_code")
    val schemeCode: Int,
    @SerialName("scheme_name")
    val schemeName: String,
    val category: String = "",
    @SerialName("asset_class")
    val assetClass: String = "equity",
    val nav: Double = 0.0,
    @SerialName("nav_date")
    val navDate: String? = null,
    val returns: FundReturns? = null,
    val aum: Double? = null,
    @SerialName("expense_ratio")
    val expenseRatio: Double? = null,
    @SerialName("risk_rating")
    val riskRating: Int? = null, // 1-5
    @SerialName("min_sip")
    val minSip: Double = 500.0,
    @SerialName("min_lumpsum")
    val minLumpsum: Double = 5000.0,
    @SerialName("fund_manager")
    val fundManager: String? = null,
    @SerialName("fund_house")
    val fundHouse: String? = null
)

@Serializable
data class FundDetail(
    val id: String = "",
    @SerialName("scheme_code")
    val schemeCode: Int,
    @SerialName("scheme_name")
    val schemeName: String,
    val category: String = "",
    @SerialName("asset_class")
    val assetClass: String = "equity",
    val nav: Double = 0.0,
    @SerialName("nav_date")
    val navDate: String? = null,
    val returns: FundReturns? = null,
    val aum: Double? = null,
    @SerialName("expense_ratio")
    val expenseRatio: Double? = null,
    @SerialName("risk_rating")
    val riskRating: Int? = null,
    @SerialName("min_sip")
    val minSip: Double = 500.0,
    @SerialName("min_lumpsum")
    val minLumpsum: Double = 5000.0,
    @SerialName("fund_manager")
    val fundManager: String? = null,
    @SerialName("fund_house")
    val fundHouse: String? = null,
    val description: String? = null,
    @SerialName("inception_date")
    val inceptionDate: String? = null,
    val benchmark: String? = null,
    @SerialName("nav_history")
    val navHistory: List<NavPoint>? = null,
    @SerialName("sector_allocation")
    val sectorAllocation: Map<String, Double>? = null,
    @SerialName("top_holdings")
    val topHoldings: List<HoldingInfo>? = null
)

@Serializable
data class FundReturns(
    @SerialName("1m")
    val oneMonth: Double? = null,
    @SerialName("3m")
    val threeMonth: Double? = null,
    @SerialName("6m")
    val sixMonth: Double? = null,
    @SerialName("1y")
    val oneYear: Double? = null,
    @SerialName("3y")
    val threeYear: Double? = null,
    @SerialName("5y")
    val fiveYear: Double? = null
)

@Serializable
data class NavPoint(
    val date: String,
    val nav: Double
)

@Serializable
data class HoldingInfo(
    val name: String,
    val percentage: Double,
    val sector: String? = null
)

enum class FundCategory(val displayName: String, val color: Long) {
    EQUITY("Equity", 0xFF2563EB),
    DEBT("Debt", 0xFF10B981),
    HYBRID("Hybrid", 0xFFF59E0B),
    ELSS("ELSS", 0xFF8B5CF6),
    INDEX("Index", 0xFF14B8A6),
    GOLD("Gold", 0xFFEAB308);

    companion object {
        fun fromString(value: String): FundCategory {
            return entries.find {
                it.name.equals(value, ignoreCase = true) ||
                it.displayName.equals(value, ignoreCase = true)
            } ?: EQUITY
        }
    }
}

enum class AssetClass(val displayName: String, val color: Long) {
    EQUITY("Equity", 0xFF3B82F6),
    DEBT("Debt", 0xFF10B981),
    HYBRID("Hybrid", 0xFF8B5CF6),
    GOLD("Gold", 0xFFF59E0B),
    OTHER("Other", 0xFF64748B);

    companion object {
        fun fromString(value: String): AssetClass {
            return entries.find {
                it.name.equals(value, ignoreCase = true) ||
                it.displayName.equals(value, ignoreCase = true)
            } ?: OTHER
        }
    }
}
