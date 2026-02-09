package com.sparrowinvest.fa.ui.clients.reports

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyListScope
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.sparrowinvest.fa.data.model.ClientDetail
import com.sparrowinvest.fa.ui.components.GlassCard
import com.sparrowinvest.fa.ui.theme.CornerRadius
import com.sparrowinvest.fa.ui.theme.Error
import com.sparrowinvest.fa.ui.theme.Primary
import com.sparrowinvest.fa.ui.theme.Spacing
import kotlinx.coroutines.launch
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

fun LazyListScope.reportsTabContent(
    client: ClientDetail
) {
    item {
        ReportsTabContentInternal(client = client)
    }
}

@Composable
private fun ReportsTabContentInternal(client: ClientDetail) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val viewModel = remember { ReportsViewModel(context) }

    var generatingType by remember { mutableStateOf<ReportType?>(null) }
    var shareFile by remember { mutableStateOf<File?>(null) }
    var recentReports by remember { mutableStateOf(viewModel.getReportHistory(client.id)) }

    // Refresh recent reports when returning from share
    LaunchedEffect(shareFile) {
        if (shareFile == null) {
            recentReports = viewModel.getReportHistory(client.id)
        }
    }

    Column(
        verticalArrangement = Arrangement.spacedBy(Spacing.compact)
    ) {
        // Report Type Cards Grid
        Text(
            text = "GENERATE REPORT",
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.padding(bottom = Spacing.small)
        )

        LazyVerticalGrid(
            columns = GridCells.Fixed(2),
            horizontalArrangement = Arrangement.spacedBy(Spacing.compact),
            verticalArrangement = Arrangement.spacedBy(Spacing.compact),
            modifier = Modifier
                .fillMaxWidth()
                .height(520.dp),
            userScrollEnabled = false
        ) {
            items(ReportType.entries.toList()) { reportType ->
                ReportTypeCard(
                    reportType = reportType,
                    isGenerating = generatingType == reportType,
                    onGenerate = {
                        generatingType = reportType
                        scope.launch {
                            val file = viewModel.generateReport(client, reportType)
                            generatingType = null
                            if (file != null) {
                                recentReports = viewModel.getReportHistory(client.id)
                                shareFile = file
                            } else {
                                Toast.makeText(context, "Failed to generate report", Toast.LENGTH_SHORT).show()
                            }
                        }
                    }
                )
            }
        }

        // Recent Reports Section
        if (recentReports.isNotEmpty()) {
            Spacer(modifier = Modifier.height(Spacing.small))
            Text(
                text = "RECENT REPORTS (${recentReports.size})",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(bottom = Spacing.small)
            )

            recentReports.forEach { report ->
                GeneratedReportItem(
                    report = report,
                    onShare = {
                        val file = File(report.filePath)
                        if (file.exists()) {
                            shareFile = file
                        } else {
                            Toast.makeText(context, "File not found", Toast.LENGTH_SHORT).show()
                            recentReports = viewModel.getReportHistory(client.id)
                        }
                    },
                    onDelete = {
                        viewModel.deleteReport(client.id, report.id)
                        recentReports = viewModel.getReportHistory(client.id)
                    }
                )
            }
        }
    }

    // Share bottom sheet
    shareFile?.let { file ->
        ShareReportBottomSheet(
            file = file,
            clientName = client.name,
            clientEmail = client.email,
            clientPhone = client.phone,
            context = context,
            onDismiss = { shareFile = null }
        )
    }
}

@Composable
private fun ReportTypeCard(
    reportType: ReportType,
    isGenerating: Boolean,
    onGenerate: () -> Unit
) {
    GlassCard(
        cornerRadius = CornerRadius.large,
        contentPadding = Spacing.compact
    ) {
        Column(
            verticalArrangement = Arrangement.spacedBy(Spacing.small)
        ) {
            // Icon
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .clip(RoundedCornerShape(CornerRadius.small))
                    .background(Primary.copy(alpha = 0.1f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = reportType.icon,
                    contentDescription = null,
                    modifier = Modifier.size(20.dp),
                    tint = Primary
                )
            }

            Text(
                text = reportType.title,
                style = MaterialTheme.typography.labelLarge,
                color = MaterialTheme.colorScheme.onSurface,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )

            Text(
                text = reportType.description,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
                minLines = 2
            )

            // Generate button
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(CornerRadius.small))
                    .background(
                        if (isGenerating) Primary.copy(alpha = 0.05f) else Primary.copy(alpha = 0.1f)
                    )
                    .clickable(enabled = !isGenerating, onClick = onGenerate)
                    .padding(vertical = Spacing.small),
                contentAlignment = Alignment.Center
            ) {
                if (isGenerating) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(16.dp),
                        strokeWidth = 2.dp,
                        color = Primary
                    )
                } else {
                    Text(
                        text = "Generate",
                        style = MaterialTheme.typography.labelMedium,
                        color = Primary
                    )
                }
            }
        }
    }
}

@Composable
private fun GeneratedReportItem(
    report: GeneratedReport,
    onShare: () -> Unit,
    onDelete: () -> Unit
) {
    val dateFormat = remember { SimpleDateFormat("dd MMM yyyy, hh:mm a", Locale.getDefault()) }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(CornerRadius.medium))
            .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
            .clickable(onClick = onShare)
            .padding(Spacing.compact),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Icon
        Box(
            modifier = Modifier
                .size(36.dp)
                .clip(RoundedCornerShape(CornerRadius.small))
                .background(Primary.copy(alpha = 0.1f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = report.type.icon,
                contentDescription = null,
                modifier = Modifier.size(18.dp),
                tint = Primary
            )
        }

        Spacer(modifier = Modifier.width(Spacing.compact))

        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = report.type.title,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurface,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Text(
                text = "${dateFormat.format(Date(report.generatedAt))} - ${report.formattedSize}",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        IconButton(onClick = onShare, modifier = Modifier.size(32.dp)) {
            Icon(
                imageVector = Icons.Default.Share,
                contentDescription = "Share",
                modifier = Modifier.size(18.dp),
                tint = Primary
            )
        }

        IconButton(onClick = onDelete, modifier = Modifier.size(32.dp)) {
            Icon(
                imageVector = Icons.Default.Delete,
                contentDescription = "Delete",
                modifier = Modifier.size(18.dp),
                tint = Error
            )
        }
    }

    Spacer(modifier = Modifier.height(Spacing.small))
}
