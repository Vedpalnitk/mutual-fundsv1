package com.sparrowinvest.fa.ui.components.charts

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.sparrowinvest.fa.data.model.AssetAllocationItem

private val assetClassColors = mapOf(
    "Equity" to Color(0xFF3B82F6),
    "Debt" to Color(0xFF10B981),
    "Hybrid" to Color(0xFF8B5CF6),
    "Gold" to Color(0xFFF59E0B),
    "International" to Color(0xFFEC4899),
    "Liquid" to Color(0xFF06B6D4),
    "Other" to Color(0xFF94A3B8)
)

@Composable
fun AllocationDonutChart(
    allocation: List<AssetAllocationItem>,
    totalValue: Double,
    modifier: Modifier = Modifier
) {
    var animationPlayed by remember { mutableStateOf(false) }
    val animationProgress by animateFloatAsState(
        targetValue = if (animationPlayed) 1f else 0f,
        animationSpec = tween(durationMillis = 800),
        label = "donutAnimation"
    )

    LaunchedEffect(Unit) {
        animationPlayed = true
    }

    if (allocation.isEmpty()) {
        Box(
            modifier = modifier.height(200.dp),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "No allocation data",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
        return
    }

    Row(
        modifier = modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Donut chart
        Box(
            modifier = Modifier
                .size(160.dp)
                .weight(1f),
            contentAlignment = Alignment.Center
        ) {
            Canvas(modifier = Modifier.size(140.dp)) {
                val strokeWidth = 28.dp.toPx()
                val radius = (size.minDimension - strokeWidth) / 2
                val topLeft = Offset(
                    (size.width - radius * 2) / 2,
                    (size.height - radius * 2) / 2
                )
                val arcSize = Size(radius * 2, radius * 2)

                var startAngle = -90f
                allocation.forEach { item ->
                    val sweepAngle = (item.percentage / 100f * 360f * animationProgress).toFloat()
                    val color = assetClassColors[item.assetClass] ?: assetClassColors["Other"]!!

                    drawArc(
                        color = color,
                        startAngle = startAngle,
                        sweepAngle = sweepAngle,
                        useCenter = false,
                        topLeft = topLeft,
                        size = arcSize,
                        style = Stroke(width = strokeWidth, cap = StrokeCap.Round)
                    )
                    startAngle += sweepAngle
                }
            }

            // Center text
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = formatCompactValue(totalValue),
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = "Total",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }

        // Legend
        Column(
            modifier = Modifier
                .weight(1f)
                .padding(start = 8.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            allocation.forEach { item ->
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Canvas(modifier = Modifier.size(10.dp)) {
                        val color = assetClassColors[item.assetClass] ?: assetClassColors["Other"]!!
                        drawCircle(color = color)
                    }
                    Text(
                        text = item.assetClass,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface,
                        modifier = Modifier.weight(1f)
                    )
                    Text(
                        text = "${String.format("%.1f", item.percentage)}%",
                        style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.SemiBold),
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }
            }
        }
    }
}

private fun formatCompactValue(value: Double): String {
    return when {
        value >= 10000000 -> "%.2f Cr".format(value / 10000000)
        value >= 100000 -> "%.2f L".format(value / 100000)
        value >= 1000 -> "%.1f K".format(value / 1000)
        else -> "%.0f".format(value)
    }
}
