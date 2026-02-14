package com.sparrowinvest.fa.ui.components.charts

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.sparrowinvest.fa.data.model.PortfolioHistoryPoint

@Composable
fun PortfolioValueChart(
    historyData: List<PortfolioHistoryPoint>,
    selectedPeriod: String,
    onPeriodChange: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val periods = listOf("1M", "6M", "1Y", "3Y", "ALL")
    val isDark = com.sparrowinvest.fa.ui.theme.LocalIsDarkTheme.current
    val primaryColor = if (isDark) Color(0xFF93C5FD) else Color(0xFF3B82F6)
    val gradientTop = primaryColor.copy(alpha = if (isDark) 0.20f else 0.15f)
    val gradientBottom = primaryColor.copy(alpha = 0f)

    var animationPlayed by remember { mutableStateOf(false) }
    val animationProgress by animateFloatAsState(
        targetValue = if (animationPlayed) 1f else 0f,
        animationSpec = tween(durationMillis = 600),
        label = "lineAnimation"
    )

    LaunchedEffect(historyData) {
        animationPlayed = false
        animationPlayed = true
    }

    // Calculate period return
    val periodReturn = remember(historyData) {
        if (historyData.size < 2) null
        else {
            val start = historyData.first().value
            val end = historyData.last().value
            if (start > 0) ((end - start) / start) * 100 else null
        }
    }

    Column(modifier = modifier) {
        // Period selector + return badge
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Return badge
            periodReturn?.let { ret ->
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = "${if (ret >= 0) "+" else ""}${"%.2f".format(ret)}%",
                        style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.SemiBold),
                        color = if (ret >= 0) Color(0xFF10B981) else Color(0xFFEF4444),
                        modifier = Modifier
                            .background(
                                color = if (ret >= 0) Color(0xFF10B981).copy(alpha = 0.1f) else Color(0xFFEF4444).copy(alpha = 0.1f),
                                shape = RoundedCornerShape(12.dp)
                            )
                            .padding(horizontal = 10.dp, vertical = 4.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = if (selectedPeriod == "ALL") "All time" else "$selectedPeriod return",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            } ?: Spacer(modifier = Modifier)

            // Period selector chips
            Row(
                modifier = Modifier
                    .background(
                        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                        shape = RoundedCornerShape(8.dp)
                    )
                    .padding(2.dp),
                horizontalArrangement = Arrangement.spacedBy(2.dp)
            ) {
                periods.forEach { period ->
                    Text(
                        text = period,
                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Medium),
                        color = if (selectedPeriod == period) Color.White else MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(
                                if (selectedPeriod == period)
                                    Brush.linearGradient(
                                        if (isDark) listOf(Color(0xFF1E3A6E), Color(0xFF152C54))
                                        else listOf(Color(0xFF3B82F6), Color(0xFF2563EB))
                                    )
                                else
                                    Brush.linearGradient(listOf(Color.Transparent, Color.Transparent))
                            )
                            .clickable { onPeriodChange(period) }
                            .padding(horizontal = 10.dp, vertical = 6.dp)
                    )
                }
            }
        }

        // Chart area
        if (historyData.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(180.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "No data for this period",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        } else {
            Canvas(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(180.dp)
            ) {
                val values = historyData.map { it.value.toFloat() }
                val minVal = values.min()
                val maxVal = values.max()
                val range = if (maxVal - minVal > 0) maxVal - minVal else 1f

                val padding = 8.dp.toPx()
                val chartWidth = size.width - padding * 2
                val chartHeight = size.height - padding * 2

                // Build points
                val animatedCount = (values.size * animationProgress).toInt().coerceAtLeast(1)
                val points = values.take(animatedCount).mapIndexed { index, value ->
                    val x = padding + (index.toFloat() / (values.size - 1).coerceAtLeast(1)) * chartWidth
                    val y = padding + chartHeight - ((value - minVal) / range) * chartHeight
                    Offset(x, y)
                }

                if (points.size >= 2) {
                    // Draw gradient fill
                    val fillPath = Path().apply {
                        moveTo(points.first().x, size.height)
                        points.forEach { lineTo(it.x, it.y) }
                        lineTo(points.last().x, size.height)
                        close()
                    }
                    drawPath(
                        path = fillPath,
                        brush = Brush.verticalGradient(
                            colors = listOf(gradientTop, gradientBottom),
                            startY = points.minOf { it.y },
                            endY = size.height
                        )
                    )

                    // Draw line
                    val linePath = Path().apply {
                        moveTo(points.first().x, points.first().y)
                        for (i in 1 until points.size) {
                            val prev = points[i - 1]
                            val curr = points[i]
                            val cx1 = (prev.x + curr.x) / 2
                            cubicTo(cx1, prev.y, cx1, curr.y, curr.x, curr.y)
                        }
                    }
                    drawPath(
                        path = linePath,
                        brush = Brush.horizontalGradient(
                            colors = if (isDark) listOf(Color(0xFF93C5FD), Color(0xFF7DD3FC))
                                else listOf(Color(0xFF3B82F6), Color(0xFF38BDF8))
                        ),
                        style = Stroke(width = 3.dp.toPx(), cap = StrokeCap.Round)
                    )

                    // Draw last point dot
                    if (animationProgress >= 1f) {
                        drawCircle(
                            color = primaryColor,
                            radius = 5.dp.toPx(),
                            center = points.last()
                        )
                        drawCircle(
                            color = Color.White,
                            radius = 3.dp.toPx(),
                            center = points.last()
                        )
                    }
                }
            }
        }
    }
}
