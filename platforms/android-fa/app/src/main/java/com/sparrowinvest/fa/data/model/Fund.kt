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
    @SerialName("schemeCategory")
    val schemeCategory: String? = null,
    val nav: Double? = null,
    @SerialName("navDate")
    val navDate: String? = null,
    @SerialName("aum")
    val aum: Double? = null,
    @SerialName("expenseRatio")
    val expenseRatio: Double? = null,
    @SerialName("returns1y")
    val returns1y: Double? = null,
    @SerialName("returns3y")
    val returns3y: Double? = null,
    @SerialName("returns5y")
    val returns5y: Double? = null,
    @SerialName("riskLevel")
    val riskLevel: String? = null
)

@Serializable
data class FundDetail(
    @SerialName("schemeCode")
    val schemeCode: Int,
    @SerialName("schemeName")
    val schemeName: String,
    @SerialName("schemeType")
    val schemeType: String? = null,
    @SerialName("schemeCategory")
    val schemeCategory: String? = null,
    val nav: Double? = null,
    @SerialName("navDate")
    val navDate: String? = null,
    @SerialName("aum")
    val aum: Double? = null,
    @SerialName("expenseRatio")
    val expenseRatio: Double? = null,
    @SerialName("returns1y")
    val returns1y: Double? = null,
    @SerialName("returns3y")
    val returns3y: Double? = null,
    @SerialName("returns5y")
    val returns5y: Double? = null,
    @SerialName("riskLevel")
    val riskLevel: String? = null,
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
    val holdings: List<FundHolding>? = null
)

@Serializable
data class FundHolding(
    val name: String,
    val sector: String? = null,
    val percentage: Double
)
