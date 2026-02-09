package com.sparrowinvest.fa.ui.clients.reports

import android.content.Context
import android.content.SharedPreferences
import com.sparrowinvest.fa.core.util.PdfReportGenerator
import com.sparrowinvest.fa.data.model.ClientDetail
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.util.UUID

class ReportsViewModel(private val context: Context) {

    private val prefs: SharedPreferences =
        context.getSharedPreferences("report_history", Context.MODE_PRIVATE)

    suspend fun generateReport(client: ClientDetail, reportType: ReportType): File? {
        return withContext(Dispatchers.IO) {
            val file = PdfReportGenerator.generateReport(context, client, reportType)
            if (file != null) {
                saveToHistory(
                    GeneratedReport(
                        id = UUID.randomUUID().toString(),
                        clientId = client.id,
                        type = reportType,
                        generatedAt = System.currentTimeMillis(),
                        filePath = file.absolutePath,
                        fileSize = file.length()
                    )
                )
            }
            file
        }
    }

    fun getReportHistory(clientId: String): List<GeneratedReport> {
        val json = prefs.getString("reports_$clientId", null) ?: return emptyList()
        return try {
            val arr = JSONArray(json)
            (0 until arr.length()).mapNotNull { i ->
                val obj = arr.getJSONObject(i)
                val filePath = obj.getString("filePath")
                // Only include reports whose files still exist
                if (File(filePath).exists()) {
                    GeneratedReport(
                        id = obj.getString("id"),
                        clientId = obj.getString("clientId"),
                        type = ReportType.valueOf(obj.getString("type")),
                        generatedAt = obj.getLong("generatedAt"),
                        filePath = filePath,
                        fileSize = obj.getLong("fileSize")
                    )
                } else null
            }.sortedByDescending { it.generatedAt }
        } catch (_: Exception) {
            emptyList()
        }
    }

    fun deleteReport(clientId: String, reportId: String) {
        val reports = getReportHistory(clientId).toMutableList()
        val report = reports.find { it.id == reportId }
        if (report != null) {
            File(report.filePath).delete()
            reports.remove(report)
            saveHistoryList(clientId, reports)
        }
    }

    private fun saveToHistory(report: GeneratedReport) {
        val reports = getReportHistory(report.clientId).toMutableList()
        reports.add(0, report)
        // Keep only last 20 reports per client
        val trimmed = reports.take(20)
        saveHistoryList(report.clientId, trimmed)
    }

    private fun saveHistoryList(clientId: String, reports: List<GeneratedReport>) {
        val arr = JSONArray()
        reports.forEach { r ->
            arr.put(JSONObject().apply {
                put("id", r.id)
                put("clientId", r.clientId)
                put("type", r.type.name)
                put("generatedAt", r.generatedAt)
                put("filePath", r.filePath)
                put("fileSize", r.fileSize)
            })
        }
        prefs.edit().putString("reports_$clientId", arr.toString()).apply()
    }
}
