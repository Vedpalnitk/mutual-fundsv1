package com.sparrowinvest.fa.ui.clients.reports

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBalance
import androidx.compose.material.icons.filled.Assessment
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.PieChart
import androidx.compose.material.icons.filled.Repeat
import androidx.compose.material.icons.automirrored.filled.TrendingUp
import androidx.compose.ui.graphics.vector.ImageVector

enum class ReportType(
    val title: String,
    val description: String,
    val icon: ImageVector
) {
    PORTFOLIO_STATEMENT(
        "Portfolio Statement",
        "Complete holdings snapshot with NAV, returns & allocation",
        Icons.Default.PieChart
    ),
    MONTHLY_SUMMARY(
        "Monthly Summary",
        "Month-over-month portfolio performance summary",
        Icons.Default.Assessment
    ),
    TRANSACTION_REPORT(
        "Transaction Report",
        "All transactions for a selected period",
        Icons.Default.History
    ),
    CAPITAL_GAINS(
        "Capital Gains",
        "STCG/LTCG breakdown for tax filing",
        Icons.Default.AccountBalance
    ),
    SIP_SUMMARY(
        "SIP Summary",
        "Active/paused SIPs with performance tracking",
        Icons.Default.Repeat
    ),
    PERFORMANCE_REPORT(
        "Performance Report",
        "XIRR, benchmark comparison & category-wise returns",
        Icons.AutoMirrored.Filled.TrendingUp
    )
}

data class GeneratedReport(
    val id: String,
    val clientId: String,
    val type: ReportType,
    val generatedAt: Long,
    val filePath: String,
    val fileSize: Long
) {
    val formattedSize: String
        get() = when {
            fileSize >= 1024 * 1024 -> "%.1f MB".format(fileSize / (1024.0 * 1024.0))
            fileSize >= 1024 -> "%.1f KB".format(fileSize / 1024.0)
            else -> "$fileSize B"
        }
}
