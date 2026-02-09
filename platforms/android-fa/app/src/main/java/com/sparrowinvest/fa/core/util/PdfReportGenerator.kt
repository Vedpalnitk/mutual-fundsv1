package com.sparrowinvest.fa.core.util

import android.content.Context
import android.content.Intent
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Typeface
import android.graphics.pdf.PdfDocument
import android.os.Environment
import androidx.core.content.FileProvider
import com.sparrowinvest.fa.data.model.ClientDetail
import com.sparrowinvest.fa.ui.clients.reports.ReportType
import java.io.File
import java.io.FileOutputStream
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

object PdfReportGenerator {

    private const val PAGE_WIDTH = 595  // A4
    private const val PAGE_HEIGHT = 842 // A4
    private const val MARGIN = 40f
    private const val CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN

    private val titlePaint = Paint().apply {
        color = Color.parseColor("#1E293B")
        textSize = 20f
        typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        isAntiAlias = true
    }

    private val sectionPaint = Paint().apply {
        color = Color.parseColor("#2563EB")
        textSize = 14f
        typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        isAntiAlias = true
    }

    private val labelPaint = Paint().apply {
        color = Color.parseColor("#64748B")
        textSize = 10f
        typeface = Typeface.create(Typeface.DEFAULT, Typeface.NORMAL)
        isAntiAlias = true
    }

    private val valuePaint = Paint().apply {
        color = Color.parseColor("#1E293B")
        textSize = 10f
        typeface = Typeface.create(Typeface.DEFAULT, Typeface.NORMAL)
        isAntiAlias = true
    }

    private val valueBoldPaint = Paint().apply {
        color = Color.parseColor("#1E293B")
        textSize = 11f
        typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        isAntiAlias = true
    }

    private val headerPaint = Paint().apply {
        color = Color.parseColor("#F1F5F9")
        style = Paint.Style.FILL
    }

    private val linePaint = Paint().apply {
        color = Color.parseColor("#E2E8F0")
        strokeWidth = 0.5f
    }

    private val greenPaint = Paint().apply {
        color = Color.parseColor("#10B981")
        textSize = 10f
        typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        isAntiAlias = true
    }

    private val redPaint = Paint().apply {
        color = Color.parseColor("#EF4444")
        textSize = 10f
        typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        isAntiAlias = true
    }

    // Dispatcher: generate report by type
    fun generateReport(context: Context, client: ClientDetail, reportType: ReportType): File? {
        return when (reportType) {
            ReportType.PORTFOLIO_STATEMENT -> generatePortfolioStatement(context, client)
            ReportType.MONTHLY_SUMMARY -> generateMonthlySummary(context, client)
            ReportType.TRANSACTION_REPORT -> generateTransactionReport(context, client)
            ReportType.CAPITAL_GAINS -> generateCapitalGains(context, client)
            ReportType.SIP_SUMMARY -> generateSipSummary(context, client)
            ReportType.PERFORMANCE_REPORT -> generatePerformanceReport(context, client)
        }
    }

    // Existing full client report (kept for backward compatibility)
    fun generateClientReport(context: Context, client: ClientDetail): File? {
        return generatePortfolioStatement(context, client)
    }

    private fun generatePortfolioStatement(context: Context, client: ClientDetail): File? {
        return buildPdf(context, client, "Portfolio_Statement") { pdfCtx ->
            var y = pdfCtx.y

            // Client Information
            y = drawSectionTitle(pdfCtx.canvas, "CLIENT INFORMATION", y + 20f)
            y = drawInfoRow(pdfCtx.canvas, "Name", client.name, y)
            y = drawInfoRow(pdfCtx.canvas, "Email", client.email, y)
            client.phone?.let { y = drawInfoRow(pdfCtx.canvas, "Phone", it, y) }
            client.panNumber?.let { y = drawInfoRow(pdfCtx.canvas, "PAN", it, y) }
            client.riskProfile?.let { y = drawInfoRow(pdfCtx.canvas, "Risk Profile", it, y) }
            client.kycStatus?.let { y = drawInfoRow(pdfCtx.canvas, "KYC Status", it, y) }

            // Portfolio Summary
            y = drawSectionTitle(pdfCtx.canvas, "PORTFOLIO SUMMARY", y + 20f)
            y = drawInfoRow(pdfCtx.canvas, "Total AUM", formatCurrency(client.aum), y)
            y = drawInfoRow(pdfCtx.canvas, "Overall Returns", "${"%+.2f".format(client.returns)}%", y)
            y = drawInfoRow(pdfCtx.canvas, "Holdings", "${client.holdings.size} funds", y)
            y = drawInfoRow(pdfCtx.canvas, "Active SIPs", "${client.sips.count { it.isActive }}", y)

            // Holdings Table
            if (client.holdings.isNotEmpty()) {
                y += 20f
                y = pdfCtx.checkPageBreak(y, 200f)
                y = drawSectionTitle(pdfCtx.canvas, "HOLDINGS", y)
                y = drawHoldingsTable(pdfCtx, client, y)
            }

            // SIPs
            if (client.sips.isNotEmpty()) {
                y = pdfCtx.checkPageBreak(y, 200f)
                y = drawSectionTitle(pdfCtx.canvas, "SYSTEMATIC INVESTMENT PLANS", y + 20f)
                client.sips.forEach { sip ->
                    y = pdfCtx.checkPageBreak(y, 80f)
                    y = drawInfoRow(pdfCtx.canvas, sip.fundName, "${sip.formattedAmount}/month (${sip.status})", y)
                }
            }

            // Allocation breakdown
            if (client.holdings.isNotEmpty()) {
                y = pdfCtx.checkPageBreak(y, 200f)
                y = drawSectionTitle(pdfCtx.canvas, "ALLOCATION BREAKDOWN", y + 20f)
                val categoryGroups = client.holdings.groupBy { it.category ?: "Other" }
                val totalValue = client.holdings.sumOf { it.currentValue }
                categoryGroups.forEach { (category, holdings) ->
                    val catValue = holdings.sumOf { it.currentValue }
                    val pct = if (totalValue > 0) (catValue / totalValue * 100) else 0.0
                    y = drawInfoRow(pdfCtx.canvas, category, "${formatCurrency(catValue)} (${"%,.1f".format(pct)}%)", y)
                }
            }

            pdfCtx.y = y
        }
    }

    private fun generateMonthlySummary(context: Context, client: ClientDetail): File? {
        return buildPdf(context, client, "Monthly_Summary") { pdfCtx ->
            var y = pdfCtx.y

            val dateStr = SimpleDateFormat("MMMM yyyy", Locale.getDefault()).format(Date())
            y = drawSectionTitle(pdfCtx.canvas, "MONTHLY SUMMARY - $dateStr", y + 20f)

            // Portfolio value
            y = drawInfoRow(pdfCtx.canvas, "Portfolio Value", formatCurrency(client.aum), y)
            val totalInvested = client.holdings.sumOf { it.investedValue }
            val totalCurrent = client.holdings.sumOf { it.currentValue }
            val absoluteGain = totalCurrent - totalInvested
            y = drawInfoRow(pdfCtx.canvas, "Total Invested", formatCurrency(totalInvested), y)
            y = drawInfoRow(pdfCtx.canvas, "Current Value", formatCurrency(totalCurrent), y)
            y = drawInfoRow(pdfCtx.canvas, "Absolute Gain", formatCurrency(absoluteGain), y)
            y = drawInfoRow(pdfCtx.canvas, "Overall Returns", "${"%+.2f".format(client.returns)}%", y)

            // Top performers
            if (client.holdings.isNotEmpty()) {
                y = pdfCtx.checkPageBreak(y, 200f)
                y = drawSectionTitle(pdfCtx.canvas, "TOP PERFORMERS", y + 20f)
                val topHoldings = client.holdings.sortedByDescending { it.returnsPercentage }.take(5)
                topHoldings.forEach { holding ->
                    y = pdfCtx.checkPageBreak(y, 40f)
                    val fundName = if (holding.fundName.length > 35) holding.fundName.take(32) + "..." else holding.fundName
                    y = drawInfoRow(pdfCtx.canvas, fundName, "${"%+.2f".format(holding.returnsPercentage)}%", y)
                }

                // Bottom performers
                y = pdfCtx.checkPageBreak(y, 200f)
                y = drawSectionTitle(pdfCtx.canvas, "BOTTOM PERFORMERS", y + 20f)
                val bottomHoldings = client.holdings.sortedBy { it.returnsPercentage }.take(3)
                bottomHoldings.forEach { holding ->
                    y = pdfCtx.checkPageBreak(y, 40f)
                    val fundName = if (holding.fundName.length > 35) holding.fundName.take(32) + "..." else holding.fundName
                    y = drawInfoRow(pdfCtx.canvas, fundName, "${"%+.2f".format(holding.returnsPercentage)}%", y)
                }
            }

            // SIP overview
            if (client.sips.isNotEmpty()) {
                y = pdfCtx.checkPageBreak(y, 150f)
                y = drawSectionTitle(pdfCtx.canvas, "SIP OVERVIEW", y + 20f)
                val activeSips = client.sips.count { it.isActive }
                val totalSipAmount = client.sips.filter { it.isActive }.sumOf { it.amount }
                y = drawInfoRow(pdfCtx.canvas, "Active SIPs", "$activeSips", y)
                y = drawInfoRow(pdfCtx.canvas, "Monthly SIP Amount", formatCurrency(totalSipAmount), y)
            }

            pdfCtx.y = y
        }
    }

    private fun generateTransactionReport(context: Context, client: ClientDetail): File? {
        return buildPdf(context, client, "Transaction_Report") { pdfCtx ->
            var y = pdfCtx.y

            y = drawSectionTitle(pdfCtx.canvas, "TRANSACTION REPORT", y + 20f)
            y = drawInfoRow(pdfCtx.canvas, "Total Transactions", "${client.recentTransactions.size}", y)

            // Summary by type
            val byType = client.recentTransactions.groupBy { it.type }
            byType.forEach { (type, txns) ->
                val total = txns.sumOf { it.amount }
                y = drawInfoRow(pdfCtx.canvas, "$type (${txns.size})", formatCurrency(total), y)
            }

            // Transaction details table
            if (client.recentTransactions.isNotEmpty()) {
                y = pdfCtx.checkPageBreak(y, 200f)
                y = drawSectionTitle(pdfCtx.canvas, "TRANSACTION DETAILS", y + 20f)

                // Table header
                y += 8f
                pdfCtx.canvas.drawRect(MARGIN, y, PAGE_WIDTH - MARGIN, y + 20f, headerPaint)
                y += 14f
                val headerTextPaint = Paint().apply {
                    color = Color.parseColor("#475569")
                    textSize = 8f
                    typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
                    isAntiAlias = true
                }
                pdfCtx.canvas.drawText("Date", MARGIN + 4f, y, headerTextPaint)
                pdfCtx.canvas.drawText("Fund Name", 110f, y, headerTextPaint)
                pdfCtx.canvas.drawText("Type", 360f, y, headerTextPaint)
                pdfCtx.canvas.drawText("Amount", 410f, y, headerTextPaint)
                pdfCtx.canvas.drawText("Status", 490f, y, headerTextPaint)
                y += 8f

                val cellPaint = Paint().apply {
                    color = Color.parseColor("#1E293B")
                    textSize = 8f
                    isAntiAlias = true
                }

                client.recentTransactions.forEach { tx ->
                    y = pdfCtx.checkPageBreak(y, 30f)
                    y += 14f
                    pdfCtx.canvas.drawText(tx.date.take(10), MARGIN + 4f, y, cellPaint)
                    val fundName = if (tx.fundName.length > 30) tx.fundName.take(27) + "..." else tx.fundName
                    pdfCtx.canvas.drawText(fundName, 110f, y, cellPaint)
                    pdfCtx.canvas.drawText(tx.type, 360f, y, cellPaint)
                    pdfCtx.canvas.drawText(tx.formattedAmount, 410f, y, cellPaint)
                    val statusPaint = when (tx.status.uppercase()) {
                        "COMPLETED", "EXECUTED" -> greenPaint
                        "FAILED", "CANCELLED" -> redPaint
                        else -> cellPaint
                    }
                    pdfCtx.canvas.drawText(tx.status, 490f, y, statusPaint)
                    y += 4f
                    pdfCtx.canvas.drawLine(MARGIN, y, PAGE_WIDTH - MARGIN, y, linePaint)
                }
            }

            pdfCtx.y = y
        }
    }

    private fun generateCapitalGains(context: Context, client: ClientDetail): File? {
        return buildPdf(context, client, "Capital_Gains") { pdfCtx ->
            var y = pdfCtx.y

            val fyStr = SimpleDateFormat("yyyy", Locale.getDefault()).format(Date())
            y = drawSectionTitle(pdfCtx.canvas, "CAPITAL GAINS REPORT - FY $fyStr", y + 20f)

            if (client.holdings.isEmpty()) {
                y += 20f
                pdfCtx.canvas.drawText("No holdings data available for capital gains computation.", MARGIN, y, valuePaint)
                pdfCtx.y = y
                return@buildPdf
            }

            val totalInvested = client.holdings.sumOf { it.investedValue }
            val totalCurrent = client.holdings.sumOf { it.currentValue }
            val totalGain = totalCurrent - totalInvested

            // Approximate STCG/LTCG split: holdings with >1yr considered LTCG
            // In absence of purchase date, we use a heuristic split
            val equityHoldings = client.holdings.filter { it.category?.contains("Equity", ignoreCase = true) == true }
            val debtHoldings = client.holdings.filter { it.category?.contains("Equity", ignoreCase = true) != true }

            val equityGain = equityHoldings.sumOf { it.currentValue - it.investedValue }
            val debtGain = debtHoldings.sumOf { it.currentValue - it.investedValue }

            y = drawSectionTitle(pdfCtx.canvas, "SUMMARY", y + 10f)
            y = drawInfoRow(pdfCtx.canvas, "Total Invested", formatCurrency(totalInvested), y)
            y = drawInfoRow(pdfCtx.canvas, "Current Value", formatCurrency(totalCurrent), y)
            y = drawInfoRow(pdfCtx.canvas, "Total Gain/Loss", formatCurrency(totalGain), y)

            y = pdfCtx.checkPageBreak(y, 200f)
            y = drawSectionTitle(pdfCtx.canvas, "EQUITY - CAPITAL GAINS", y + 20f)
            y = drawInfoRow(pdfCtx.canvas, "Equity Holdings", "${equityHoldings.size} funds", y)
            y = drawInfoRow(pdfCtx.canvas, "Equity Gain/Loss", formatCurrency(equityGain), y)
            y = drawInfoRow(pdfCtx.canvas, "STCG (estimated <1yr)", formatCurrency(equityGain * 0.4), y)
            y = drawInfoRow(pdfCtx.canvas, "LTCG (estimated >1yr)", formatCurrency(equityGain * 0.6), y)

            y = pdfCtx.checkPageBreak(y, 200f)
            y = drawSectionTitle(pdfCtx.canvas, "DEBT - CAPITAL GAINS", y + 20f)
            y = drawInfoRow(pdfCtx.canvas, "Debt/Other Holdings", "${debtHoldings.size} funds", y)
            y = drawInfoRow(pdfCtx.canvas, "Debt Gain/Loss", formatCurrency(debtGain), y)
            y = drawInfoRow(pdfCtx.canvas, "STCG (estimated <3yr)", formatCurrency(debtGain * 0.5), y)
            y = drawInfoRow(pdfCtx.canvas, "LTCG (estimated >3yr)", formatCurrency(debtGain * 0.5), y)

            // Per-holding breakdown
            y = pdfCtx.checkPageBreak(y, 200f)
            y = drawSectionTitle(pdfCtx.canvas, "HOLDING-WISE BREAKDOWN", y + 20f)
            client.holdings.forEach { holding ->
                y = pdfCtx.checkPageBreak(y, 40f)
                val gain = holding.currentValue - holding.investedValue
                val fundName = if (holding.fundName.length > 35) holding.fundName.take(32) + "..." else holding.fundName
                y = drawInfoRow(pdfCtx.canvas, fundName, "${formatCurrency(gain)} (${"%+.1f".format(holding.returnsPercentage)}%)", y)
            }

            y += 20f
            y = pdfCtx.checkPageBreak(y, 60f)
            pdfCtx.canvas.drawText("Note: STCG/LTCG split is estimated. Consult your CA for exact figures.", MARGIN, y, labelPaint)

            pdfCtx.y = y
        }
    }

    private fun generateSipSummary(context: Context, client: ClientDetail): File? {
        return buildPdf(context, client, "SIP_Summary") { pdfCtx ->
            var y = pdfCtx.y

            y = drawSectionTitle(pdfCtx.canvas, "SIP SUMMARY", y + 20f)

            if (client.sips.isEmpty()) {
                y += 20f
                pdfCtx.canvas.drawText("No SIPs found for this client.", MARGIN, y, valuePaint)
                pdfCtx.y = y
                return@buildPdf
            }

            // Overall SIP stats
            val activeSips = client.sips.filter { it.isActive }
            val pausedSips = client.sips.filter { it.isPaused }
            val cancelledSips = client.sips.filter { it.status == "CANCELLED" }
            val totalMonthly = activeSips.sumOf { it.amount }
            val totalSipInvested = client.sips.sumOf { it.totalInvested }

            y = drawInfoRow(pdfCtx.canvas, "Total SIPs", "${client.sips.size}", y)
            y = drawInfoRow(pdfCtx.canvas, "Active", "${activeSips.size}", y)
            y = drawInfoRow(pdfCtx.canvas, "Paused", "${pausedSips.size}", y)
            y = drawInfoRow(pdfCtx.canvas, "Cancelled", "${cancelledSips.size}", y)
            y = drawInfoRow(pdfCtx.canvas, "Monthly Investment", formatCurrency(totalMonthly), y)
            y = drawInfoRow(pdfCtx.canvas, "Total Invested via SIPs", formatCurrency(totalSipInvested), y)

            // SIP details table
            y = pdfCtx.checkPageBreak(y, 200f)
            y = drawSectionTitle(pdfCtx.canvas, "SIP DETAILS", y + 20f)

            y += 8f
            pdfCtx.canvas.drawRect(MARGIN, y, PAGE_WIDTH - MARGIN, y + 20f, headerPaint)
            y += 14f
            val headerTextPaint = Paint().apply {
                color = Color.parseColor("#475569")
                textSize = 8f
                typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
                isAntiAlias = true
            }
            pdfCtx.canvas.drawText("Fund Name", MARGIN + 4f, y, headerTextPaint)
            pdfCtx.canvas.drawText("Amount", 310f, y, headerTextPaint)
            pdfCtx.canvas.drawText("Freq", 380f, y, headerTextPaint)
            pdfCtx.canvas.drawText("Invested", 430f, y, headerTextPaint)
            pdfCtx.canvas.drawText("Status", 510f, y, headerTextPaint)
            y += 8f

            val cellPaint = Paint().apply {
                color = Color.parseColor("#1E293B")
                textSize = 8f
                isAntiAlias = true
            }

            client.sips.forEach { sip ->
                y = pdfCtx.checkPageBreak(y, 30f)
                y += 14f
                val fundName = if (sip.fundName.length > 35) sip.fundName.take(32) + "..." else sip.fundName
                pdfCtx.canvas.drawText(fundName, MARGIN + 4f, y, cellPaint)
                pdfCtx.canvas.drawText(sip.formattedAmount, 310f, y, cellPaint)
                pdfCtx.canvas.drawText(sip.frequency, 380f, y, cellPaint)
                pdfCtx.canvas.drawText(formatCurrency(sip.totalInvested), 430f, y, cellPaint)
                val statusPaint = when (sip.status) {
                    "ACTIVE" -> greenPaint
                    "PAUSED" -> Paint().apply {
                        color = Color.parseColor("#F59E0B")
                        textSize = 8f
                        typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
                        isAntiAlias = true
                    }
                    else -> redPaint
                }
                pdfCtx.canvas.drawText(sip.status, 510f, y, statusPaint)
                y += 4f
                pdfCtx.canvas.drawLine(MARGIN, y, PAGE_WIDTH - MARGIN, y, linePaint)
            }

            pdfCtx.y = y
        }
    }

    private fun generatePerformanceReport(context: Context, client: ClientDetail): File? {
        return buildPdf(context, client, "Performance_Report") { pdfCtx ->
            var y = pdfCtx.y

            y = drawSectionTitle(pdfCtx.canvas, "PERFORMANCE REPORT", y + 20f)

            if (client.holdings.isEmpty()) {
                y += 20f
                pdfCtx.canvas.drawText("No holdings data available.", MARGIN, y, valuePaint)
                pdfCtx.y = y
                return@buildPdf
            }

            val totalInvested = client.holdings.sumOf { it.investedValue }
            val totalCurrent = client.holdings.sumOf { it.currentValue }
            val absoluteReturn = totalCurrent - totalInvested
            val returnPct = if (totalInvested > 0) (absoluteReturn / totalInvested) * 100 else 0.0

            // Portfolio level metrics
            y = drawInfoRow(pdfCtx.canvas, "Total Invested", formatCurrency(totalInvested), y)
            y = drawInfoRow(pdfCtx.canvas, "Current Value", formatCurrency(totalCurrent), y)
            y = drawInfoRow(pdfCtx.canvas, "Absolute Return", formatCurrency(absoluteReturn), y)
            y = drawInfoRow(pdfCtx.canvas, "Return %", "${"%+.2f".format(returnPct)}%", y)

            // XIRR if available
            val xirrValues = client.holdings.mapNotNull { it.xirr }
            if (xirrValues.isNotEmpty()) {
                val avgXirr = xirrValues.average()
                y = drawInfoRow(pdfCtx.canvas, "Avg XIRR", "${"%,.2f".format(avgXirr)}%", y)
            }

            // Category-wise returns
            y = pdfCtx.checkPageBreak(y, 200f)
            y = drawSectionTitle(pdfCtx.canvas, "CATEGORY-WISE RETURNS", y + 20f)
            val categoryGroups = client.holdings.groupBy { it.category ?: "Other" }
            categoryGroups.forEach { (category, holdings) ->
                y = pdfCtx.checkPageBreak(y, 60f)
                val catInvested = holdings.sumOf { it.investedValue }
                val catCurrent = holdings.sumOf { it.currentValue }
                val catReturn = if (catInvested > 0) ((catCurrent - catInvested) / catInvested) * 100 else 0.0
                y = drawInfoRow(pdfCtx.canvas, "$category (${holdings.size} funds)", "${"%+.2f".format(catReturn)}%", y)
                y = drawInfoRow(pdfCtx.canvas, "  Invested", formatCurrency(catInvested), y)
                y = drawInfoRow(pdfCtx.canvas, "  Current", formatCurrency(catCurrent), y)
            }

            // Per-holding performance table
            y = pdfCtx.checkPageBreak(y, 200f)
            y = drawSectionTitle(pdfCtx.canvas, "HOLDING-WISE PERFORMANCE", y + 20f)

            y += 8f
            pdfCtx.canvas.drawRect(MARGIN, y, PAGE_WIDTH - MARGIN, y + 20f, headerPaint)
            y += 14f
            val headerTextPaint = Paint().apply {
                color = Color.parseColor("#475569")
                textSize = 8f
                typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
                isAntiAlias = true
            }
            pdfCtx.canvas.drawText("Fund Name", MARGIN + 4f, y, headerTextPaint)
            pdfCtx.canvas.drawText("Invested", 290f, y, headerTextPaint)
            pdfCtx.canvas.drawText("Current", 365f, y, headerTextPaint)
            pdfCtx.canvas.drawText("Return %", 440f, y, headerTextPaint)
            pdfCtx.canvas.drawText("XIRR", 510f, y, headerTextPaint)
            y += 8f

            val cellPaint = Paint().apply {
                color = Color.parseColor("#1E293B")
                textSize = 8f
                isAntiAlias = true
            }

            client.holdings.sortedByDescending { it.returnsPercentage }.forEach { holding ->
                y = pdfCtx.checkPageBreak(y, 30f)
                y += 14f
                val fundName = if (holding.fundName.length > 35) holding.fundName.take(32) + "..." else holding.fundName
                pdfCtx.canvas.drawText(fundName, MARGIN + 4f, y, cellPaint)
                pdfCtx.canvas.drawText(formatCurrency(holding.investedValue), 290f, y, cellPaint)
                pdfCtx.canvas.drawText(formatCurrency(holding.currentValue), 365f, y, cellPaint)

                val retPaint = if (holding.returnsPercentage >= 0) greenPaint else redPaint
                pdfCtx.canvas.drawText("${"%+.1f".format(holding.returnsPercentage)}%", 440f, y, retPaint)

                val xirrStr = holding.xirr?.let { "${"%,.1f".format(it)}%" } ?: "-"
                pdfCtx.canvas.drawText(xirrStr, 510f, y, cellPaint)

                y += 4f
                pdfCtx.canvas.drawLine(MARGIN, y, PAGE_WIDTH - MARGIN, y, linePaint)
            }

            pdfCtx.y = y
        }
    }

    fun shareReport(context: Context, file: File) {
        val uri = FileProvider.getUriForFile(
            context,
            "${context.packageName}.fileprovider",
            file
        )
        val intent = Intent(Intent.ACTION_SEND).apply {
            type = "application/pdf"
            putExtra(Intent.EXTRA_STREAM, uri)
            putExtra(Intent.EXTRA_SUBJECT, "Client Portfolio Report - Sparrow Invest")
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        context.startActivity(Intent.createChooser(intent, "Share Report"))
    }

    fun shareViaWhatsApp(context: Context, file: File, phone: String?, clientName: String) {
        val uri = FileProvider.getUriForFile(
            context,
            "${context.packageName}.fileprovider",
            file
        )
        val message = "Hi, please find the attached report for $clientName from Sparrow Invest."
        val intent = Intent(Intent.ACTION_SEND).apply {
            type = "application/pdf"
            setPackage("com.whatsapp")
            putExtra(Intent.EXTRA_STREAM, uri)
            putExtra(Intent.EXTRA_TEXT, message)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        if (!phone.isNullOrBlank()) {
            intent.putExtra("jid", "91$phone@s.whatsapp.net")
        }
        try {
            context.startActivity(intent)
        } catch (_: Exception) {
            // Fallback to generic share if WhatsApp not installed
            shareReport(context, file)
        }
    }

    fun shareViaEmail(context: Context, file: File, clientName: String, clientEmail: String) {
        val uri = FileProvider.getUriForFile(
            context,
            "${context.packageName}.fileprovider",
            file
        )
        val intent = Intent(Intent.ACTION_SEND).apply {
            type = "application/pdf"
            putExtra(Intent.EXTRA_EMAIL, arrayOf(clientEmail))
            putExtra(Intent.EXTRA_SUBJECT, "Portfolio Report - $clientName - Sparrow Invest")
            putExtra(
                Intent.EXTRA_TEXT,
                "Dear $clientName,\n\nPlease find your portfolio report attached.\n\nBest regards,\nSparrow Invest"
            )
            putExtra(Intent.EXTRA_STREAM, uri)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        context.startActivity(Intent.createChooser(intent, "Send Email"))
    }

    // --- PDF builder infrastructure ---

    private class PdfContext(
        val pdfDoc: PdfDocument,
        var canvas: Canvas,
        var page: PdfDocument.Page,
        var pageNumber: Int,
        var y: Float
    ) {
        fun checkPageBreak(currentY: Float, requiredSpace: Float): Float {
            if (currentY > PAGE_HEIGHT - MARGIN - requiredSpace) {
                drawFooter(canvas, pageNumber)
                pdfDoc.finishPage(page)
                pageNumber++
                val pageInfo = PdfDocument.PageInfo.Builder(PAGE_WIDTH, PAGE_HEIGHT, pageNumber).create()
                page = pdfDoc.startPage(pageInfo)
                canvas = page.canvas
                return MARGIN
            }
            return currentY
        }
    }

    private fun buildPdf(
        context: Context,
        client: ClientDetail,
        reportPrefix: String,
        content: (PdfContext) -> Unit
    ): File? {
        return try {
            val pdfDoc = PdfDocument()
            val pageInfo = PdfDocument.PageInfo.Builder(PAGE_WIDTH, PAGE_HEIGHT, 1).create()
            val page = pdfDoc.startPage(pageInfo)

            val pdfCtx = PdfContext(pdfDoc, page.canvas, page, 1, MARGIN)

            // Header
            pdfCtx.y = drawHeader(pdfCtx.canvas, client, pdfCtx.y, reportPrefix.replace("_", " "))

            // Render report content
            content(pdfCtx)

            // Footer on last page
            drawFooter(pdfCtx.canvas, pdfCtx.pageNumber)
            pdfDoc.finishPage(pdfCtx.page)

            // Save file
            val timestamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(Date())
            val fileName = "SparrowFA_${client.name.replace(" ", "_")}_${reportPrefix}_$timestamp.pdf"
            val dir = File(context.getExternalFilesDir(Environment.DIRECTORY_DOCUMENTS), "reports")
            dir.mkdirs()
            val file = File(dir, fileName)

            FileOutputStream(file).use { out ->
                pdfDoc.writeTo(out)
            }
            pdfDoc.close()

            file
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    private fun drawHeader(canvas: Canvas, client: ClientDetail, startY: Float, reportTitle: String = "Portfolio Report"): Float {
        var y = startY

        // Brand bar
        val brandPaint = Paint().apply {
            color = Color.parseColor("#2563EB")
            style = Paint.Style.FILL
        }
        canvas.drawRect(0f, 0f, PAGE_WIDTH.toFloat(), 4f, brandPaint)

        y += 20f
        canvas.drawText("Sparrow Invest", MARGIN, y, titlePaint)

        y += 16f
        val subtitlePaint = Paint().apply {
            color = Color.parseColor("#64748B")
            textSize = 10f
            isAntiAlias = true
        }
        canvas.drawText(reportTitle, MARGIN, y, subtitlePaint)

        // Date on right side
        val dateStr = SimpleDateFormat("dd MMM yyyy", Locale.getDefault()).format(Date())
        val dateWidth = subtitlePaint.measureText(dateStr)
        canvas.drawText(dateStr, PAGE_WIDTH - MARGIN - dateWidth, y, subtitlePaint)

        y += 10f
        canvas.drawLine(MARGIN, y, PAGE_WIDTH - MARGIN, y, linePaint)

        y += 20f
        val clientNamePaint = Paint().apply {
            color = Color.parseColor("#1E293B")
            textSize = 16f
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            isAntiAlias = true
        }
        canvas.drawText(client.name, MARGIN, y, clientNamePaint)

        y += 14f
        canvas.drawText(client.email, MARGIN, y, subtitlePaint)

        return y
    }

    private fun drawSectionTitle(canvas: Canvas, title: String, startY: Float): Float {
        var y = startY + 16f
        canvas.drawText(title, MARGIN, y, sectionPaint)
        y += 4f
        val underlinePaint = Paint().apply {
            color = Color.parseColor("#2563EB")
            strokeWidth = 2f
        }
        canvas.drawLine(MARGIN, y, MARGIN + sectionPaint.measureText(title), y + 2f, underlinePaint)
        return y + 12f
    }

    private fun drawInfoRow(canvas: Canvas, label: String, value: String, startY: Float): Float {
        val y = startY + 16f
        canvas.drawText(label, MARGIN, y, labelPaint)
        val valueWidth = valuePaint.measureText(value)
        canvas.drawText(value, PAGE_WIDTH - MARGIN - valueWidth, y, valuePaint)
        return y
    }

    private fun drawHoldingsTable(
        pdfCtx: PdfContext,
        client: ClientDetail,
        startY: Float
    ): Float {
        var y = startY + 8f

        // Table header
        pdfCtx.canvas.drawRect(MARGIN, y, PAGE_WIDTH - MARGIN, y + 20f, headerPaint)
        y += 14f
        val headerTextPaint = Paint().apply {
            color = Color.parseColor("#475569")
            textSize = 8f
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            isAntiAlias = true
        }

        pdfCtx.canvas.drawText("Fund Name", MARGIN + 4f, y, headerTextPaint)
        pdfCtx.canvas.drawText("Invested", 320f, y, headerTextPaint)
        pdfCtx.canvas.drawText("Current", 400f, y, headerTextPaint)
        pdfCtx.canvas.drawText("Returns", 480f, y, headerTextPaint)
        y += 8f

        // Table rows
        val cellPaint = Paint().apply {
            color = Color.parseColor("#1E293B")
            textSize = 9f
            isAntiAlias = true
        }

        client.holdings.forEach { holding ->
            y = pdfCtx.checkPageBreak(y, 30f)
            y += 14f
            val fundName = if (holding.fundName.length > 40) holding.fundName.take(37) + "..." else holding.fundName
            pdfCtx.canvas.drawText(fundName, MARGIN + 4f, y, cellPaint)
            pdfCtx.canvas.drawText(formatCurrency(holding.investedValue), 320f, y, cellPaint)
            pdfCtx.canvas.drawText(formatCurrency(holding.currentValue), 400f, y, cellPaint)

            val returnPct = holding.returnsPercentage
            val returnPaint = if (returnPct >= 0) greenPaint else redPaint
            pdfCtx.canvas.drawText("${"%+.1f".format(returnPct)}%", 480f, y, returnPaint)

            y += 4f
            pdfCtx.canvas.drawLine(MARGIN, y, PAGE_WIDTH - MARGIN, y, linePaint)
        }

        // Totals row
        y += 16f
        pdfCtx.canvas.drawText("Total", MARGIN + 4f, y, valueBoldPaint)
        val totalInvested = client.holdings.sumOf { it.investedValue }
        val totalCurrent = client.holdings.sumOf { it.currentValue }
        pdfCtx.canvas.drawText(formatCurrency(totalInvested), 320f, y, valueBoldPaint)
        pdfCtx.canvas.drawText(formatCurrency(totalCurrent), 400f, y, valueBoldPaint)

        val totalReturnPct = if (totalInvested > 0) ((totalCurrent - totalInvested) / totalInvested) * 100 else 0.0
        val totalReturnPaint = if (totalReturnPct >= 0) greenPaint else redPaint
        pdfCtx.canvas.drawText("${"%+.1f".format(totalReturnPct)}%", 480f, y, totalReturnPaint)

        return y
    }

    private fun drawFooter(canvas: Canvas, pageNumber: Int) {
        val y = PAGE_HEIGHT - MARGIN
        canvas.drawLine(MARGIN, y - 16f, PAGE_WIDTH - MARGIN, y - 16f, linePaint)

        val footerPaint = Paint().apply {
            color = Color.parseColor("#94A3B8")
            textSize = 8f
            isAntiAlias = true
        }
        canvas.drawText("Generated by Sparrow Invest FA App", MARGIN, y.toFloat(), footerPaint)
        val pageText = "Page $pageNumber"
        val pageWidth = footerPaint.measureText(pageText)
        canvas.drawText(pageText, PAGE_WIDTH - MARGIN - pageWidth, y.toFloat(), footerPaint)
    }

    private fun formatCurrency(amount: Double): String {
        return when {
            amount >= 10000000 -> "₹%.2f Cr".format(amount / 10000000)
            amount >= 100000 -> "₹%.2f L".format(amount / 100000)
            else -> "₹%,.0f".format(amount)
        }
    }
}
