package com.sparrowinvest.fa.ui.dashboard

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.TrendingDown
import androidx.compose.material.icons.automirrored.filled.TrendingUp
import androidx.compose.material.icons.filled.AccountBalance
import androidx.compose.material.icons.filled.AutoGraph
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.Repeat
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.sparrowinvest.fa.ui.components.GlassCard
import com.sparrowinvest.fa.ui.theme.CornerRadius
import com.sparrowinvest.fa.ui.theme.Error
import com.sparrowinvest.fa.ui.theme.LocalIsDarkTheme
import com.sparrowinvest.fa.ui.theme.Primary
import com.sparrowinvest.fa.ui.theme.Secondary
import com.sparrowinvest.fa.ui.theme.Spacing
import com.sparrowinvest.fa.ui.theme.Success
import com.sparrowinvest.fa.ui.theme.Warning

// -- Demo data models local to this sheet --

private data class GrowthPill(
    val label: String,
    val value: String,
    val isPositive: Boolean? = null // null = neutral
)

private data class TrendMonth(
    val month: String,
    val value: Float // 0..1 proportion for bar width
)

private data class BreakdownBar(
    val label: String,
    val displayValue: String,
    val progress: Float, // 0..1
    val color: Color
)

private data class PerformerEntry(
    val rank: Int,
    val name: String,
    val returnPct: Double
)

/**
 * A reusable KPI drill-down bottom sheet.
 *
 * All growth / trend / breakdown data is synthesized demo data since the
 * backend does not yet return dedicated growth fields for every metric.
 *
 * @param kpiType  One of "aum", "clients", "returns", or "sips" (case-insensitive).
 * @param kpiTitle Human-readable title displayed in the header.
 * @param kpiValue Formatted current value string (e.g. "₹12.4 Cr").
 * @param kpiColor Accent color used for the header gradient.
 * @param onDismiss Callback when the sheet is dismissed.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun KpiDetailSheet(
    kpiType: String,
    kpiTitle: String,
    kpiValue: String,
    kpiColor: Color,
    onDismiss: () -> Unit
) {
    val isDark = LocalIsDarkTheme.current
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = if (isDark) Color(0xFF1E293B) else Color.White,
        contentColor = MaterialTheme.colorScheme.onSurface,
        dragHandle = {
            Box(
                modifier = Modifier
                    .padding(vertical = Spacing.compact)
                    .size(width = 40.dp, height = 4.dp)
                    .clip(RoundedCornerShape(2.dp))
                    .background(
                        Brush.linearGradient(colors = listOf(Primary, Secondary))
                    )
            )
        },
        scrimColor = Color.Black.copy(alpha = 0.5f)
    ) {
        KpiDetailSheetContent(
            kpiType = kpiType,
            kpiTitle = kpiTitle,
            kpiValue = kpiValue,
            kpiColor = kpiColor,
            onDismiss = onDismiss
        )
    }
}

@Composable
private fun KpiDetailSheetContent(
    kpiType: String,
    kpiTitle: String,
    kpiValue: String,
    kpiColor: Color,
    onDismiss: () -> Unit
) {
    val isDark = LocalIsDarkTheme.current
    val type = kpiType.lowercase()

    // Resolve icon for header
    val headerIcon: ImageVector = remember(type) {
        when (type) {
            "aum" -> Icons.Default.AccountBalance
            "clients" -> Icons.Default.People
            "returns" -> Icons.Default.AutoGraph
            "sips" -> Icons.Default.Repeat
            else -> Icons.Default.AutoGraph
        }
    }

    // Header gradient — darker in dark mode
    val headerGradient = remember(kpiColor, isDark) {
        if (isDark) {
            Brush.linearGradient(
                colors = listOf(
                    kpiColor.copy(alpha = 0.35f),
                    kpiColor.copy(alpha = 0.20f)
                )
            )
        } else {
            Brush.linearGradient(
                colors = listOf(kpiColor, kpiColor.copy(alpha = 0.85f))
            )
        }
    }

    // Synthesized growth pills
    val growthPills: List<GrowthPill> = remember(type) {
        when (type) {
            "aum" -> listOf(
                GrowthPill("MoM", "+3.2%", isPositive = true),
                GrowthPill("YoY", "+12.5%", isPositive = true),
                GrowthPill("Prev Month", "₹11.8 Cr"),
                GrowthPill("Current", kpiValue)
            )
            "clients" -> listOf(
                GrowthPill("MoM", "+5.1%", isPositive = true),
                GrowthPill("YoY", "+18.3%", isPositive = true),
                GrowthPill("Prev Month", "142"),
                GrowthPill("Current", kpiValue)
            )
            "returns" -> listOf(
                GrowthPill("MoM", "+0.8%", isPositive = true),
                GrowthPill("YoY", "+4.5%", isPositive = true),
                GrowthPill("Prev Month", "14.7%"),
                GrowthPill("Current", kpiValue)
            )
            "sips" -> listOf(
                GrowthPill("MoM", "-1.4%", isPositive = false),
                GrowthPill("YoY", "+22.1%", isPositive = true),
                GrowthPill("Prev Month", "₹8.1 L"),
                GrowthPill("Current", kpiValue)
            )
            else -> listOf(
                GrowthPill("MoM", "+2.0%", isPositive = true),
                GrowthPill("YoY", "+10.0%", isPositive = true),
                GrowthPill("Prev Month", "--"),
                GrowthPill("Current", kpiValue)
            )
        }
    }

    // Synthesized 6-month trend data (proportional bar widths 0..1)
    val trendData: List<TrendMonth> = remember(type) {
        when (type) {
            "aum" -> listOf(
                TrendMonth("Sep", 0.72f),
                TrendMonth("Oct", 0.78f),
                TrendMonth("Nov", 0.82f),
                TrendMonth("Dec", 0.85f),
                TrendMonth("Jan", 0.90f),
                TrendMonth("Feb", 1.00f)
            )
            "clients" -> listOf(
                TrendMonth("Sep", 0.65f),
                TrendMonth("Oct", 0.70f),
                TrendMonth("Nov", 0.76f),
                TrendMonth("Dec", 0.80f),
                TrendMonth("Jan", 0.88f),
                TrendMonth("Feb", 1.00f)
            )
            "returns" -> listOf(
                TrendMonth("Sep", 0.80f),
                TrendMonth("Oct", 0.75f),
                TrendMonth("Nov", 0.88f),
                TrendMonth("Dec", 0.92f),
                TrendMonth("Jan", 0.85f),
                TrendMonth("Feb", 1.00f)
            )
            "sips" -> listOf(
                TrendMonth("Sep", 0.60f),
                TrendMonth("Oct", 0.68f),
                TrendMonth("Nov", 0.74f),
                TrendMonth("Dec", 0.82f),
                TrendMonth("Jan", 0.95f),
                TrendMonth("Feb", 0.90f)
            )
            else -> listOf(
                TrendMonth("Sep", 0.70f),
                TrendMonth("Oct", 0.75f),
                TrendMonth("Nov", 0.80f),
                TrendMonth("Dec", 0.85f),
                TrendMonth("Jan", 0.90f),
                TrendMonth("Feb", 1.00f)
            )
        }
    }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .verticalScroll(rememberScrollState())
    ) {
        // ---- 1. HEADER ----
        SheetHeader(
            icon = headerIcon,
            title = kpiTitle,
            value = kpiValue,
            gradient = headerGradient,
            onDismiss = onDismiss
        )

        Spacer(modifier = Modifier.height(Spacing.medium))

        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = Spacing.large)
                .padding(bottom = Spacing.xLarge)
        ) {
            // ---- 2. GROWTH PILLS (2x2 grid) ----
            GrowthPillsGrid(pills = growthPills)

            Spacer(modifier = Modifier.height(Spacing.large))

            // ---- 3. TREND SECTION (horizontal bar chart) ----
            TrendSection(
                data = trendData,
                barColor = kpiColor,
                isDark = isDark
            )

            Spacer(modifier = Modifier.height(Spacing.large))

            // ---- 4. BREAKDOWN SECTION (type-dependent) ----
            BreakdownSection(
                type = type,
                isDark = isDark
            )
        }
    }
}

// ---------------------------------------------------------------------------
// 1. Header
// ---------------------------------------------------------------------------

@Composable
private fun SheetHeader(
    icon: ImageVector,
    title: String,
    value: String,
    gradient: Brush,
    onDismiss: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(brush = gradient)
            .padding(horizontal = Spacing.large, vertical = Spacing.medium)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(Spacing.compact)
            ) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(RoundedCornerShape(CornerRadius.small))
                        .background(Color.White.copy(alpha = 0.2f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = icon,
                        contentDescription = null,
                        modifier = Modifier.size(22.dp),
                        tint = Color.White
                    )
                }
                Column {
                    Text(
                        text = title,
                        style = MaterialTheme.typography.titleMedium,
                        color = Color.White.copy(alpha = 0.85f)
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = value,
                        style = MaterialTheme.typography.headlineSmall,
                        color = Color.White,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            IconButton(
                onClick = onDismiss,
                modifier = Modifier.size(32.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Close,
                    contentDescription = "Close",
                    modifier = Modifier.size(18.dp),
                    tint = Color.White.copy(alpha = 0.8f)
                )
            }
        }
    }
}

// ---------------------------------------------------------------------------
// 2. Growth Pills (2x2 grid)
// ---------------------------------------------------------------------------

@Composable
private fun GrowthPillsGrid(pills: List<GrowthPill>) {
    val isDark = LocalIsDarkTheme.current

    Column(verticalArrangement = Arrangement.spacedBy(Spacing.small)) {
        // First row: pills 0 & 1
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(Spacing.small)
        ) {
            pills.getOrNull(0)?.let { pill ->
                GrowthPillCard(pill = pill, isDark = isDark, modifier = Modifier.weight(1f))
            }
            pills.getOrNull(1)?.let { pill ->
                GrowthPillCard(pill = pill, isDark = isDark, modifier = Modifier.weight(1f))
            }
        }
        // Second row: pills 2 & 3
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(Spacing.small)
        ) {
            pills.getOrNull(2)?.let { pill ->
                GrowthPillCard(pill = pill, isDark = isDark, modifier = Modifier.weight(1f))
            }
            pills.getOrNull(3)?.let { pill ->
                GrowthPillCard(pill = pill, isDark = isDark, modifier = Modifier.weight(1f))
            }
        }
    }
}

@Composable
private fun GrowthPillCard(
    pill: GrowthPill,
    isDark: Boolean,
    modifier: Modifier = Modifier
) {
    val accentColor = when (pill.isPositive) {
        true -> Success
        false -> Error
        null -> Primary
    }
    val pillBg = when (pill.isPositive) {
        true -> Success.copy(alpha = 0.08f)
        false -> Error.copy(alpha = 0.08f)
        null -> if (isDark) Color.White.copy(alpha = 0.06f) else Primary.copy(alpha = 0.04f)
    }
    val pillBorder = when (pill.isPositive) {
        true -> Success.copy(alpha = 0.20f)
        false -> Error.copy(alpha = 0.20f)
        null -> if (isDark) Color.White.copy(alpha = 0.10f) else Primary.copy(alpha = 0.10f)
    }

    GlassCard(
        modifier = modifier,
        cornerRadius = CornerRadius.large,
        contentPadding = Spacing.compact
    ) {
        Column(
            modifier = Modifier.fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                text = pill.label,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                fontSize = 10.sp,
                letterSpacing = 0.5.sp
            )
            Spacer(modifier = Modifier.height(Spacing.micro))
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(2.dp)
            ) {
                if (pill.isPositive != null) {
                    Icon(
                        imageVector = if (pill.isPositive)
                            Icons.AutoMirrored.Filled.TrendingUp
                        else
                            Icons.AutoMirrored.Filled.TrendingDown,
                        contentDescription = null,
                        modifier = Modifier.size(14.dp),
                        tint = accentColor
                    )
                }
                Text(
                    text = pill.value,
                    style = MaterialTheme.typography.titleSmall,
                    color = accentColor,
                    fontWeight = FontWeight.SemiBold
                )
            }
        }
    }
}

// ---------------------------------------------------------------------------
// 3. Trend Section (horizontal bar chart with month labels)
// ---------------------------------------------------------------------------

@Composable
private fun TrendSection(
    data: List<TrendMonth>,
    barColor: Color,
    isDark: Boolean
) {
    Column {
        Text(
            text = "TREND (6 MONTHS)",
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            letterSpacing = 1.sp
        )
        Spacer(modifier = Modifier.height(Spacing.compact))

        GlassCard(
            cornerRadius = CornerRadius.large,
            contentPadding = Spacing.medium
        ) {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(Spacing.compact)
            ) {
                data.forEach { point ->
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(Spacing.small)
                    ) {
                        // Month label
                        Text(
                            text = point.month,
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.width(32.dp),
                            fontSize = 11.sp
                        )
                        // Bar track + fill
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .height(10.dp)
                                .clip(RoundedCornerShape(5.dp))
                                .background(
                                    barColor.copy(
                                        alpha = if (isDark) 0.12f else 0.10f
                                    )
                                )
                        ) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth(point.value.coerceIn(0f, 1f))
                                    .height(10.dp)
                                    .clip(RoundedCornerShape(5.dp))
                                    .background(
                                        Brush.linearGradient(
                                            colors = listOf(
                                                barColor,
                                                barColor.copy(alpha = 0.7f)
                                            )
                                        )
                                    )
                            )
                        }
                    }
                }
            }
        }
    }
}

// ---------------------------------------------------------------------------
// 4. Breakdown Section (content depends on kpiType)
// ---------------------------------------------------------------------------

@Composable
private fun BreakdownSection(
    type: String,
    isDark: Boolean
) {
    when (type) {
        "aum" -> AumBreakdown(isDark)
        "clients" -> ClientsBreakdown(isDark)
        "returns" -> ReturnsBreakdown(isDark)
        "sips" -> SipsBreakdown(isDark)
        else -> AumBreakdown(isDark) // fallback
    }
}

// -- AUM: Category distribution bars --

@Composable
private fun AumBreakdown(isDark: Boolean) {
    val items = remember {
        listOf(
            BreakdownBar("Equity", "60%", 0.60f, Primary),
            BreakdownBar("Debt", "25%", 0.25f, Success),
            BreakdownBar("Hybrid", "15%", 0.15f, Warning)
        )
    }

    BreakdownBars(
        sectionTitle = "AUM BY CATEGORY",
        items = items,
        isDark = isDark
    )
}

// -- Clients: Status distribution bars --

@Composable
private fun ClientsBreakdown(isDark: Boolean) {
    val items = remember {
        listOf(
            BreakdownBar("Active", "112", 0.75f, Success),
            BreakdownBar("KYC Pending", "23", 0.15f, Warning),
            BreakdownBar("Inactive", "15", 0.10f, Error)
        )
    }

    BreakdownBars(
        sectionTitle = "CLIENTS BY STATUS",
        items = items,
        isDark = isDark
    )
}

// -- Returns: Top 3 performers with rank badges --

@Composable
private fun ReturnsBreakdown(isDark: Boolean) {
    val performers = remember {
        listOf(
            PerformerEntry(1, "Priya Patel", 24.5),
            PerformerEntry(2, "Rajesh Sharma", 19.8),
            PerformerEntry(3, "Sunita Mehta", 17.2)
        )
    }

    Column {
        HorizontalDivider(
            color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f)
        )
        Spacer(modifier = Modifier.height(Spacing.compact))

        Text(
            text = "TOP PERFORMERS",
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            letterSpacing = 1.sp
        )
        Spacer(modifier = Modifier.height(Spacing.small))

        performers.forEachIndexed { index, performer ->
            val rankColors = listOf(
                Color(0xFFFFD700), // Gold
                Color(0xFFC0C0C0), // Silver
                Color(0xFFCD7F32)  // Bronze
            )
            val rankColor = rankColors.getOrElse(index) { Primary }

            GlassCard(
                cornerRadius = CornerRadius.medium,
                contentPadding = Spacing.compact
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(Spacing.compact)
                    ) {
                        // Rank badge
                        Box(
                            modifier = Modifier
                                .size(28.dp)
                                .clip(CircleShape)
                                .background(rankColor.copy(alpha = 0.15f))
                                .border(
                                    width = 1.dp,
                                    color = rankColor.copy(alpha = 0.4f),
                                    shape = CircleShape
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "#${performer.rank}",
                                style = MaterialTheme.typography.labelSmall,
                                color = rankColor,
                                fontWeight = FontWeight.Bold,
                                fontSize = 10.sp
                            )
                        }
                        Column {
                            Text(
                                text = performer.name,
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurface,
                                fontWeight = FontWeight.Medium
                            )
                            Text(
                                text = "Portfolio Returns",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                fontSize = 10.sp
                            )
                        }
                    }

                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(2.dp)
                    ) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.TrendingUp,
                            contentDescription = null,
                            modifier = Modifier.size(14.dp),
                            tint = Success
                        )
                        Text(
                            text = "+${"%.1f".format(performer.returnPct)}%",
                            style = MaterialTheme.typography.titleSmall,
                            color = Success,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }

            if (index < performers.lastIndex) {
                Spacer(modifier = Modifier.height(Spacing.small))
            }
        }
    }
}

// -- SIPs: Category distribution bars --

@Composable
private fun SipsBreakdown(isDark: Boolean) {
    val items = remember {
        listOf(
            BreakdownBar("Equity SIPs", "₹5.2 L", 0.65f, Primary),
            BreakdownBar("Debt SIPs", "₹1.8 L", 0.22f, Secondary),
            BreakdownBar("Hybrid SIPs", "₹1.0 L", 0.13f, Warning)
        )
    }

    BreakdownBars(
        sectionTitle = "SIP BY CATEGORY",
        items = items,
        isDark = isDark
    )
}

// -- Shared: Breakdown bars list --

@Composable
private fun BreakdownBars(
    sectionTitle: String,
    items: List<BreakdownBar>,
    isDark: Boolean
) {
    Column {
        HorizontalDivider(
            color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f)
        )
        Spacer(modifier = Modifier.height(Spacing.compact))

        Text(
            text = sectionTitle,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            letterSpacing = 1.sp
        )
        Spacer(modifier = Modifier.height(Spacing.small))

        GlassCard(
            cornerRadius = CornerRadius.large,
            contentPadding = Spacing.medium
        ) {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(Spacing.compact)
            ) {
                items.forEach { item ->
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.weight(1f)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(10.dp)
                                    .clip(CircleShape)
                                    .background(item.color)
                            )
                            Spacer(modifier = Modifier.width(Spacing.small))
                            Text(
                                text = item.label,
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                        }
                        Text(
                            text = item.displayValue,
                            style = MaterialTheme.typography.titleSmall,
                            color = MaterialTheme.colorScheme.onSurface,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                    // Progress bar
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(6.dp)
                            .clip(RoundedCornerShape(3.dp))
                            .background(item.color.copy(alpha = 0.15f))
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth(item.progress.coerceIn(0f, 1f))
                                .height(6.dp)
                                .clip(RoundedCornerShape(3.dp))
                                .background(
                                    Brush.linearGradient(
                                        colors = listOf(
                                            item.color,
                                            item.color.copy(alpha = 0.7f)
                                        )
                                    )
                                )
                        )
                    }
                }
            }
        }
    }
}
