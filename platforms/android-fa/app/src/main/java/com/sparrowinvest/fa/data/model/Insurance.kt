package com.sparrowinvest.fa.data.model

import kotlinx.serialization.Serializable

@Serializable
data class PremiumPayment(
    val id: String,
    val policyId: String,
    val amountPaid: Double,
    val paymentDate: String,
    val paymentMode: String? = null,
    val receiptNumber: String? = null,
    val notes: String? = null,
    val createdAt: String? = null
)

@Serializable
data class RecordPremiumPaymentRequest(
    val amountPaid: Double,
    val paymentDate: String,
    val paymentMode: String? = null,
    val receiptNumber: String? = null,
    val notes: String? = null
)

@Serializable
data class InsurancePolicy(
    val id: String,
    val clientId: String,
    val policyNumber: String,
    val provider: String,
    val type: String,
    val status: String = "ACTIVE",
    val sumAssured: Double,
    val premiumAmount: Double,
    val premiumFrequency: String = "ANNUAL",
    val startDate: String,
    val maturityDate: String? = null,
    val nextPremiumDate: String? = null,
    val lastPremiumDate: String? = null,
    val nominees: String? = null,
    val notes: String? = null,
    val createdAt: String? = null,
    val updatedAt: String? = null
) {
    val formattedSumAssured: String get() = when {
        sumAssured >= 10000000 -> "₹${"%.1f".format(sumAssured / 10000000)} Cr"
        sumAssured >= 100000 -> "₹${"%.1f".format(sumAssured / 100000)} L"
        else -> "₹${"%,.0f".format(sumAssured)}"
    }

    val formattedPremium: String get() = when {
        premiumAmount >= 100000 -> "₹${"%.1f".format(premiumAmount / 100000)} L"
        else -> "₹${"%,.0f".format(premiumAmount)}"
    }

    val typeLabel: String get() = when (type) {
        "TERM_LIFE" -> "Term Life"
        "WHOLE_LIFE" -> "Whole Life"
        "ENDOWMENT" -> "Endowment"
        "ULIP" -> "ULIP"
        "HEALTH" -> "Health"
        "CRITICAL_ILLNESS" -> "Critical Illness"
        "PERSONAL_ACCIDENT" -> "Personal Accident"
        else -> "Other"
    }

    val isLifeCover: Boolean get() = type in listOf("TERM_LIFE", "WHOLE_LIFE", "ENDOWMENT", "ULIP")
    val isHealthCover: Boolean get() = type in listOf("HEALTH", "CRITICAL_ILLNESS")
    val isActive: Boolean get() = status == "ACTIVE"

    val daysUntilDue: Int? get() {
        val dateStr = nextPremiumDate ?: return null
        return try {
            val formats = listOf("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", "yyyy-MM-dd")
            var parsed: java.util.Date? = null
            for (fmt in formats) {
                try {
                    parsed = java.text.SimpleDateFormat(fmt, java.util.Locale.US).parse(dateStr)
                    if (parsed != null) break
                } catch (_: Exception) {}
            }
            if (parsed == null) return null
            val diff = parsed.time - System.currentTimeMillis()
            (diff / (1000 * 60 * 60 * 24)).toInt()
        } catch (_: Exception) { null }
    }

    val isDueSoon: Boolean get() {
        val days = daysUntilDue ?: return false
        return days in -30..7
    }
}

@Serializable
data class CoverageGap(
    val recommended: Double,
    val current: Double,
    val gap: Double,
    val adequate: Boolean
)

@Serializable
data class GapAnalysisResponse(
    val life: CoverageGap,
    val health: CoverageGap,
    val policies: List<InsurancePolicy> = emptyList()
)

@Serializable
data class PolicyDocument(
    val id: String,
    val policyId: String,
    val fileName: String,
    val mimeType: String,
    val fileSize: Int,
    val uploadedAt: String
) {
    val formattedFileSize: String get() = when {
        fileSize >= 1_048_576 -> "${"%.1f".format(fileSize / 1_048_576.0)} MB"
        else -> "${"%.0f".format(fileSize / 1024.0)} KB"
    }

    val isPDF: Boolean get() = mimeType == "application/pdf"
    val isImage: Boolean get() = mimeType.startsWith("image/")
}

@Serializable
data class DocumentDownloadResponse(
    val url: String,
    val fileName: String,
    val mimeType: String
)

@Serializable
data class CreateInsurancePolicyRequest(
    val policyNumber: String,
    val provider: String,
    val type: String,
    val status: String? = null,
    val sumAssured: Double,
    val premiumAmount: Double,
    val premiumFrequency: String? = null,
    val startDate: String,
    val maturityDate: String? = null,
    val nominees: String? = null,
    val notes: String? = null
)
