package com.sparrowinvest.fa.ui.reports

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Assessment
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.Flag
import androidx.compose.material.icons.filled.PictureAsPdf
import androidx.compose.material.icons.filled.Receipt
import androidx.compose.material.icons.filled.Repeat
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.automirrored.filled.ShowChart
import androidx.compose.material.icons.filled.TableChart
import androidx.compose.material.icons.automirrored.filled.TrendingUp
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.TabRowDefaults
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.sparrowinvest.fa.ui.components.GlassCard
import com.sparrowinvest.fa.ui.theme.CornerRadius
import com.sparrowinvest.fa.ui.theme.LocalIsDarkTheme
import com.sparrowinvest.fa.ui.theme.Primary
import com.sparrowinvest.fa.ui.theme.Secondary
import com.sparrowinvest.fa.ui.theme.Spacing
import com.sparrowinvest.fa.ui.theme.Success
import com.sparrowinvest.fa.ui.theme.Warning
import com.sparrowinvest.fa.ui.theme.Info

private data class ReportType(
    val name: String,
    val description: String,
    val icon: ImageVector,
    val iconColor: Color
)

private val reportTypes = listOf(
    ReportType("Portfolio Statement", "Client holdings & valuations", Icons.Default.Description, Color(0xFF3B82F6)),
    ReportType("Transaction Report", "Buy, sell & SIP history", Icons.Default.Receipt, Color(0xFF8B5CF6)),
    ReportType("Capital Gains", "Short & long term gains", Icons.AutoMirrored.Filled.TrendingUp, Color(0xFF10B981)),
    ReportType("Performance Report", "Returns & benchmarking", Icons.AutoMirrored.Filled.ShowChart, Color(0xFFF59E0B)),
    ReportType("SIP Summary", "Active SIPs & projections", Icons.Default.Repeat, Color(0xFF06B6D4)),
    ReportType("Goal Report", "Goal progress & tracking", Icons.Default.Flag, Color(0xFFEF4444))
)

private data class RecentReport(
    val name: String,
    val clientName: String,
    val date: String,
    val format: String
)

private val mockRecentReports = listOf(
    RecentReport("Portfolio Statement", "Priya Patel", "10 Feb 2026", "PDF"),
    RecentReport("Transaction Report", "Rajesh Sharma", "8 Feb 2026", "Excel"),
    RecentReport("Capital Gains", "Vikram Patel", "5 Feb 2026", "PDF"),
    RecentReport("Performance Report", "Ananya Patel", "3 Feb 2026", "CSV"),
    RecentReport("SIP Summary", "Sunita Sharma", "1 Feb 2026", "PDF"),
    RecentReport("Goal Report", "Arjun Sharma", "28 Jan 2026", "Excel")
)

private val mockClients = listOf("All Clients", "Priya Patel", "Rajesh Sharma", "Vikram Patel", "Ananya Patel", "Sunita Sharma")
private val formatOptions = listOf("PDF", "Excel", "CSV")
private val dateRangeOptions = listOf("Last 30 Days", "Last 3 Months", "Last 6 Months", "Last 1 Year", "Financial Year", "Custom")

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ReportsScreen(
    onBackClick: () -> Unit
) {
    var selectedTab by remember { mutableIntStateOf(0) }
    var showGenerateSheet by remember { mutableStateOf(false) }
    var selectedReportType by remember { mutableStateOf<ReportType?>(null) }
    var showPreview by remember { mutableStateOf(false) }
    val isDark = LocalIsDarkTheme.current

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Reports") },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color.Transparent
                )
            )
        },
        containerColor = Color.Transparent
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // Tabs
            TabRow(
                selectedTabIndex = selectedTab,
                containerColor = Color.Transparent,
                contentColor = MaterialTheme.colorScheme.primary,
                indicator = { tabPositions ->
                    TabRowDefaults.SecondaryIndicator(
                        modifier = Modifier.tabIndicatorOffset(tabPositions[selectedTab]),
                        color = MaterialTheme.colorScheme.primary
                    )
                },
                modifier = Modifier.padding(horizontal = Spacing.medium)
            ) {
                Tab(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    text = { Text("Generate") }
                )
                Tab(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    text = { Text("Recent") }
                )
            }

            Spacer(modifier = Modifier.height(Spacing.medium))

            when (selectedTab) {
                0 -> GenerateTab(
                    onGenerateClick = { reportType ->
                        selectedReportType = reportType
                        showGenerateSheet = true
                    }
                )
                1 -> RecentTab()
            }
        }

        // Generate Bottom Sheet
        if (showGenerateSheet && selectedReportType != null) {
            val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
            ModalBottomSheet(
                onDismissRequest = {
                    showGenerateSheet = false
                    showPreview = false
                    selectedReportType = null
                },
                sheetState = sheetState,
                containerColor = if (isDark) Color(0xFF1E293B) else Color.White
            ) {
                GenerateBottomSheetContent(
                    reportType = selectedReportType!!,
                    showPreview = showPreview,
                    onGenerate = { showPreview = true },
                    onDismiss = {
                        showGenerateSheet = false
                        showPreview = false
                        selectedReportType = null
                    }
                )
            }
        }
    }
}

@Composable
private fun GenerateTab(
    onGenerateClick: (ReportType) -> Unit
) {
    LazyVerticalGrid(
        columns = GridCells.Fixed(2),
        contentPadding = PaddingValues(horizontal = Spacing.medium),
        horizontalArrangement = Arrangement.spacedBy(Spacing.compact),
        verticalArrangement = Arrangement.spacedBy(Spacing.compact),
        modifier = Modifier.fillMaxSize()
    ) {
        items(reportTypes) { reportType ->
            ReportTypeCard(
                reportType = reportType,
                onGenerateClick = { onGenerateClick(reportType) }
            )
        }
    }
}

@Composable
private fun ReportTypeCard(
    reportType: ReportType,
    onGenerateClick: () -> Unit
) {
    GlassCard(
        cornerRadius = CornerRadius.large,
        contentPadding = Spacing.medium
    ) {
        Column(
            modifier = Modifier.fillMaxWidth()
        ) {
            // Icon
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(RoundedCornerShape(CornerRadius.small))
                    .background(reportType.iconColor.copy(alpha = 0.1f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = reportType.icon,
                    contentDescription = null,
                    modifier = Modifier.size(24.dp),
                    tint = reportType.iconColor
                )
            }

            Spacer(modifier = Modifier.height(Spacing.compact))

            Text(
                text = reportType.name,
                style = MaterialTheme.typography.titleSmall,
                color = MaterialTheme.colorScheme.onSurface,
                fontWeight = FontWeight.SemiBold
            )

            Text(
                text = reportType.description,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Spacer(modifier = Modifier.height(Spacing.compact))

            // Generate button
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(50))
                    .background(
                        Brush.linearGradient(
                            colors = listOf(Primary, Secondary)
                        )
                    )
                    .clickable(onClick = onGenerateClick)
                    .padding(vertical = Spacing.small),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "Generate",
                    style = MaterialTheme.typography.labelMedium,
                    color = Color.White,
                    fontWeight = FontWeight.SemiBold
                )
            }
        }
    }
}

@Composable
private fun RecentTab() {
    LazyColumn(
        contentPadding = PaddingValues(horizontal = Spacing.medium),
        verticalArrangement = Arrangement.spacedBy(Spacing.compact),
        modifier = Modifier.fillMaxSize()
    ) {
        items(mockRecentReports) { report ->
            RecentReportItem(report = report)
        }
        item {
            Spacer(modifier = Modifier.height(Spacing.large))
        }
    }
}

@Composable
private fun RecentReportItem(report: RecentReport) {
    GlassCard(
        cornerRadius = CornerRadius.large,
        contentPadding = Spacing.compact
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Icon
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(RoundedCornerShape(CornerRadius.small))
                    .background(Primary.copy(alpha = 0.1f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = when (report.format) {
                        "PDF" -> Icons.Default.PictureAsPdf
                        "Excel" -> Icons.Default.TableChart
                        else -> Icons.Default.Description
                    },
                    contentDescription = null,
                    modifier = Modifier.size(22.dp),
                    tint = Primary
                )
            }

            Spacer(modifier = Modifier.width(Spacing.compact))

            // Info
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = report.name,
                    style = MaterialTheme.typography.titleSmall,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = "${report.clientName} • ${report.date}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            // Format badge
            val badgeColor = when (report.format) {
                "PDF" -> Color(0xFFEF4444)
                "Excel" -> Color(0xFF10B981)
                else -> Color(0xFF3B82F6)
            }
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(50))
                    .background(badgeColor.copy(alpha = 0.1f))
                    .padding(horizontal = 8.dp, vertical = 2.dp)
            ) {
                Text(
                    text = report.format,
                    style = MaterialTheme.typography.labelSmall,
                    color = badgeColor,
                    fontWeight = FontWeight.SemiBold
                )
            }

            Spacer(modifier = Modifier.width(Spacing.small))

            // Actions
            IconButton(
                onClick = { },
                modifier = Modifier.size(32.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Download,
                    contentDescription = "Download",
                    modifier = Modifier.size(18.dp),
                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            IconButton(
                onClick = { },
                modifier = Modifier.size(32.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Share,
                    contentDescription = "Share",
                    modifier = Modifier.size(18.dp),
                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
private fun GenerateBottomSheetContent(
    reportType: ReportType,
    showPreview: Boolean,
    onGenerate: () -> Unit,
    onDismiss: () -> Unit
) {
    val isDark = LocalIsDarkTheme.current
    var selectedClient by remember { mutableIntStateOf(0) }
    var selectedDateRange by remember { mutableIntStateOf(2) }
    var selectedFormat by remember { mutableIntStateOf(0) }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = Spacing.large)
            .padding(bottom = Spacing.xLarge)
    ) {
        // Header
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.padding(bottom = Spacing.medium)
        ) {
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(RoundedCornerShape(CornerRadius.small))
                    .background(reportType.iconColor.copy(alpha = 0.1f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = reportType.icon,
                    contentDescription = null,
                    modifier = Modifier.size(24.dp),
                    tint = reportType.iconColor
                )
            }
            Spacer(modifier = Modifier.width(Spacing.compact))
            Column {
                Text(
                    text = reportType.name,
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = reportType.description,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }

        if (showPreview) {
            // Mock preview
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(200.dp)
                    .clip(RoundedCornerShape(CornerRadius.large))
                    .background(
                        if (isDark) Color.White.copy(alpha = 0.06f)
                        else Color(0xFFF8FAFC)
                    ),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        imageVector = Icons.Default.Assessment,
                        contentDescription = null,
                        modifier = Modifier.size(48.dp),
                        tint = Success
                    )
                    Spacer(modifier = Modifier.height(Spacing.compact))
                    Text(
                        text = "Report Generated",
                        style = MaterialTheme.typography.titleMedium,
                        color = Success
                    )
                    Text(
                        text = "${reportType.name} for ${mockClients[selectedClient]}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.height(Spacing.compact))
                    Text(
                        text = "${dateRangeOptions[selectedDateRange]} • ${formatOptions[selectedFormat]}",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            Spacer(modifier = Modifier.height(Spacing.medium))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(Spacing.compact)
            ) {
                Button(
                    onClick = { },
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Primary
                    ),
                    shape = RoundedCornerShape(50)
                ) {
                    Icon(Icons.Default.Download, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(Spacing.small))
                    Text("Download")
                }
                Button(
                    onClick = { },
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Secondary
                    ),
                    shape = RoundedCornerShape(50)
                ) {
                    Icon(Icons.Default.Share, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(Spacing.small))
                    Text("Share")
                }
            }
        } else {
            // Client selector
            SelectorSection(
                label = "CLIENT",
                options = mockClients,
                selectedIndex = selectedClient,
                onSelect = { selectedClient = it }
            )

            Spacer(modifier = Modifier.height(Spacing.medium))

            // Date range
            SelectorSection(
                label = "DATE RANGE",
                options = dateRangeOptions,
                selectedIndex = selectedDateRange,
                onSelect = { selectedDateRange = it }
            )

            Spacer(modifier = Modifier.height(Spacing.medium))

            // Format
            SelectorSection(
                label = "FORMAT",
                options = formatOptions,
                selectedIndex = selectedFormat,
                onSelect = { selectedFormat = it }
            )

            Spacer(modifier = Modifier.height(Spacing.large))

            // Generate button
            Button(
                onClick = onGenerate,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color.Transparent
                ),
                shape = RoundedCornerShape(50),
                contentPadding = PaddingValues()
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(
                            Brush.linearGradient(
                                colors = listOf(Primary, Secondary)
                            ),
                            RoundedCornerShape(50)
                        )
                        .padding(vertical = Spacing.compact),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "Generate & Preview",
                        style = MaterialTheme.typography.titleSmall,
                        color = Color.White,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }
        }
    }
}

@Composable
private fun SelectorSection(
    label: String,
    options: List<String>,
    selectedIndex: Int,
    onSelect: (Int) -> Unit
) {
    val isDark = LocalIsDarkTheme.current

    Column {
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = Primary,
            fontWeight = FontWeight.SemiBold,
            modifier = Modifier.padding(bottom = Spacing.small)
        )

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(CornerRadius.medium))
                .background(
                    if (isDark) Color.White.copy(alpha = 0.06f)
                    else Color(0xFFF1F5F9)
                )
                .padding(Spacing.micro),
            horizontalArrangement = Arrangement.spacedBy(Spacing.micro)
        ) {
            options.forEachIndexed { index, option ->
                val isSelected = index == selectedIndex
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(CornerRadius.small))
                        .background(
                            if (isSelected) {
                                Brush.linearGradient(listOf(Primary, Secondary))
                            } else {
                                Brush.linearGradient(listOf(Color.Transparent, Color.Transparent))
                            }
                        )
                        .clickable { onSelect(index) }
                        .padding(vertical = Spacing.small, horizontal = Spacing.micro),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = option,
                        style = MaterialTheme.typography.labelSmall,
                        color = if (isSelected) Color.White
                        else MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1
                    )
                }
            }
        }
    }
}
