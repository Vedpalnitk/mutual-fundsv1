package com.sparrowinvest.fa.ui.calculators

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.TrendingUp
import androidx.compose.material.icons.filled.AccountBalance
import androidx.compose.material.icons.filled.Calculate
import androidx.compose.material.icons.filled.Flag
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Repeat
import androidx.compose.material.icons.filled.Savings
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
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
import androidx.compose.ui.unit.sp
import com.sparrowinvest.fa.ui.components.GlassCard
import com.sparrowinvest.fa.ui.theme.CornerRadius
import com.sparrowinvest.fa.ui.theme.LocalIsDarkTheme
import com.sparrowinvest.fa.ui.theme.Primary
import com.sparrowinvest.fa.ui.theme.Secondary
import com.sparrowinvest.fa.ui.theme.Spacing
import com.sparrowinvest.fa.ui.theme.Success
import java.text.NumberFormat
import java.util.Locale
import kotlin.math.ceil
import kotlin.math.ln
import kotlin.math.pow
import kotlin.math.roundToLong

private enum class CalculatorType(val label: String, val icon: ImageVector) {
    SIP("SIP", Icons.Default.Repeat),
    LUMPSUM("Lumpsum", Icons.Default.AccountBalance),
    GOAL("Goal", Icons.Default.Flag),
    SWP("SWP", Icons.Default.Savings),
    RETIREMENT("Retirement", Icons.AutoMirrored.Filled.TrendingUp)
}

private val indianNumberFormat = NumberFormat.getNumberInstance(Locale("en", "IN"))

private fun formatIndianCurrency(value: Double): String {
    return when {
        value >= 1_00_00_000 -> "%.2f Cr".format(value / 1_00_00_000)
        value >= 1_00_000 -> "%.2f L".format(value / 1_00_000)
        value >= 1_000 -> "%.1f K".format(value / 1_000)
        else -> indianNumberFormat.format(value.roundToLong())
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CalculatorsScreen(
    onBackClick: () -> Unit
) {
    var selectedCalculator by remember { mutableIntStateOf(0) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Calculators") },
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
            // Calculator chips
            LazyRow(
                contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = Spacing.medium),
                horizontalArrangement = Arrangement.spacedBy(Spacing.small),
                modifier = Modifier.padding(bottom = Spacing.medium)
            ) {
                itemsIndexed(CalculatorType.entries.toList()) { index, calc ->
                    CalculatorChip(
                        label = calc.label,
                        icon = calc.icon,
                        isSelected = index == selectedCalculator,
                        onClick = { selectedCalculator = index }
                    )
                }
            }

            // Calculator content
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = Spacing.medium)
            ) {
                when (CalculatorType.entries[selectedCalculator]) {
                    CalculatorType.SIP -> SipCalculator()
                    CalculatorType.LUMPSUM -> LumpsumCalculator()
                    CalculatorType.GOAL -> GoalCalculator()
                    CalculatorType.SWP -> SwpCalculator()
                    CalculatorType.RETIREMENT -> RetirementCalculator()
                }
                Spacer(modifier = Modifier.height(Spacing.xxLarge))
            }
        }
    }
}

@Composable
private fun CalculatorChip(
    label: String,
    icon: ImageVector,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    val isDark = LocalIsDarkTheme.current
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(50))
            .background(
                if (isSelected) Brush.linearGradient(listOf(Primary, Secondary))
                else Brush.linearGradient(
                    listOf(
                        if (isDark) Color.White.copy(alpha = 0.08f) else Color(0xFFF1F5F9),
                        if (isDark) Color.White.copy(alpha = 0.08f) else Color(0xFFF1F5F9)
                    )
                )
            )
            .clickable(onClick = onClick)
            .padding(horizontal = Spacing.medium, vertical = Spacing.small)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(Spacing.small)
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                modifier = Modifier.size(16.dp),
                tint = if (isSelected) Color.White
                else MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                text = label,
                style = MaterialTheme.typography.labelMedium,
                color = if (isSelected) Color.White
                else MaterialTheme.colorScheme.onSurfaceVariant,
                fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal
            )
        }
    }
}

// --- SIP Calculator ---

@Composable
private fun SipCalculator() {
    var monthlyAmount by remember { mutableFloatStateOf(10000f) }
    var period by remember { mutableFloatStateOf(10f) }
    var returnRate by remember { mutableFloatStateOf(12f) }
    var stepUp by remember { mutableFloatStateOf(0f) }

    val result by remember {
        derivedStateOf {
            calculateSip(monthlyAmount.toDouble(), period.toInt(), returnRate.toDouble(), stepUp.toDouble())
        }
    }

    Column(verticalArrangement = Arrangement.spacedBy(Spacing.medium)) {
        SliderInput(
            label = "Monthly Investment",
            value = monthlyAmount,
            onValueChange = { monthlyAmount = it },
            valueRange = 500f..500000f,
            steps = 0,
            prefix = "\u20B9",
            formatValue = { indianNumberFormat.format(it.roundToLong()) }
        )

        SliderInput(
            label = "Time Period",
            value = period,
            onValueChange = { period = it },
            valueRange = 1f..40f,
            steps = 38,
            suffix = "Years",
            formatValue = { "${it.toInt()}" }
        )

        SliderInput(
            label = "Expected Return",
            value = returnRate,
            onValueChange = { returnRate = it },
            valueRange = 1f..30f,
            steps = 28,
            suffix = "%",
            formatValue = { "${it.toInt()}" }
        )

        SliderInput(
            label = "Annual Step-up",
            value = stepUp,
            onValueChange = { stepUp = it },
            valueRange = 0f..25f,
            steps = 24,
            suffix = "%",
            formatValue = { "${it.toInt()}" }
        )

        // Results
        ResultCard(
            results = listOf(
                ResultItem("Future Value", "\u20B9${formatIndianCurrency(result.futureValue)}", Primary),
                ResultItem("Invested", "\u20B9${formatIndianCurrency(result.invested)}", MaterialTheme.colorScheme.onSurfaceVariant),
                ResultItem("Returns", "\u20B9${formatIndianCurrency(result.returns)}", Success)
            ),
            investedRatio = if (result.futureValue > 0) (result.invested / result.futureValue).toFloat() else 0f
        )

        InfoTip("SIP returns are compounded monthly. Step-up increases your SIP amount annually by the specified percentage.")
    }
}

// --- Lumpsum Calculator ---

@Composable
private fun LumpsumCalculator() {
    var amount by remember { mutableFloatStateOf(100000f) }
    var period by remember { mutableFloatStateOf(10f) }
    var returnRate by remember { mutableFloatStateOf(12f) }

    val result by remember {
        derivedStateOf {
            calculateLumpsum(amount.toDouble(), period.toInt(), returnRate.toDouble())
        }
    }

    Column(verticalArrangement = Arrangement.spacedBy(Spacing.medium)) {
        SliderInput(
            label = "Investment Amount",
            value = amount,
            onValueChange = { amount = it },
            valueRange = 10000f..10000000f,
            steps = 0,
            prefix = "\u20B9",
            formatValue = { indianNumberFormat.format(it.roundToLong()) }
        )

        SliderInput(
            label = "Time Period",
            value = period,
            onValueChange = { period = it },
            valueRange = 1f..40f,
            steps = 38,
            suffix = "Years",
            formatValue = { "${it.toInt()}" }
        )

        SliderInput(
            label = "Expected Return",
            value = returnRate,
            onValueChange = { returnRate = it },
            valueRange = 1f..30f,
            steps = 28,
            suffix = "%",
            formatValue = { "${it.toInt()}" }
        )

        val multiplier = if (amount > 0) result.futureValue / amount else 0.0

        ResultCard(
            results = listOf(
                ResultItem("Future Value", "\u20B9${formatIndianCurrency(result.futureValue)}", Primary),
                ResultItem("Invested", "\u20B9${formatIndianCurrency(result.invested)}", MaterialTheme.colorScheme.onSurfaceVariant),
                ResultItem("Returns", "\u20B9${formatIndianCurrency(result.returns)}", Success),
                ResultItem("Growth", "%.1fx".format(multiplier), Primary)
            ),
            investedRatio = if (result.futureValue > 0) (result.invested / result.futureValue).toFloat() else 0f
        )

        InfoTip("Lumpsum investments grow through the power of compounding. The longer you stay invested, the higher the growth multiplier.")
    }
}

// --- Goal Calculator ---

@Composable
private fun GoalCalculator() {
    var targetAmount by remember { mutableFloatStateOf(5000000f) }
    var period by remember { mutableFloatStateOf(15f) }
    var returnRate by remember { mutableFloatStateOf(12f) }

    val requiredSip by remember {
        derivedStateOf {
            calculateGoalSip(targetAmount.toDouble(), period.toInt(), returnRate.toDouble())
        }
    }

    Column(verticalArrangement = Arrangement.spacedBy(Spacing.medium)) {
        SliderInput(
            label = "Target Amount",
            value = targetAmount,
            onValueChange = { targetAmount = it },
            valueRange = 100000f..100000000f,
            steps = 0,
            prefix = "\u20B9",
            formatValue = { indianNumberFormat.format(it.roundToLong()) }
        )

        SliderInput(
            label = "Time Period",
            value = period,
            onValueChange = { period = it },
            valueRange = 1f..40f,
            steps = 38,
            suffix = "Years",
            formatValue = { "${it.toInt()}" }
        )

        SliderInput(
            label = "Expected Return",
            value = returnRate,
            onValueChange = { returnRate = it },
            valueRange = 1f..30f,
            steps = 28,
            suffix = "%",
            formatValue = { "${it.toInt()}" }
        )

        val totalInvested = requiredSip * period.toInt() * 12

        ResultCard(
            results = listOf(
                ResultItem("Required Monthly SIP", "\u20B9${formatIndianCurrency(requiredSip)}", Primary),
                ResultItem("Total Investment", "\u20B9${formatIndianCurrency(totalInvested)}", MaterialTheme.colorScheme.onSurfaceVariant),
                ResultItem("Target Amount", "\u20B9${formatIndianCurrency(targetAmount.toDouble())}", Success)
            ),
            investedRatio = if (targetAmount > 0) (totalInvested / targetAmount).toFloat().coerceIn(0f, 1f) else 0f
        )

        InfoTip("This calculator tells you how much monthly SIP you need to reach your financial goal in the given time frame.")
    }
}

// --- SWP Calculator ---

@Composable
private fun SwpCalculator() {
    var corpus by remember { mutableFloatStateOf(5000000f) }
    var withdrawal by remember { mutableFloatStateOf(30000f) }
    var returnRate by remember { mutableFloatStateOf(8f) }

    val durationMonths by remember {
        derivedStateOf {
            calculateSwpDuration(corpus.toDouble(), withdrawal.toDouble(), returnRate.toDouble())
        }
    }

    Column(verticalArrangement = Arrangement.spacedBy(Spacing.medium)) {
        SliderInput(
            label = "Total Corpus",
            value = corpus,
            onValueChange = { corpus = it },
            valueRange = 100000f..100000000f,
            steps = 0,
            prefix = "\u20B9",
            formatValue = { indianNumberFormat.format(it.roundToLong()) }
        )

        SliderInput(
            label = "Monthly Withdrawal",
            value = withdrawal,
            onValueChange = { withdrawal = it },
            valueRange = 1000f..1000000f,
            steps = 0,
            prefix = "\u20B9",
            formatValue = { indianNumberFormat.format(it.roundToLong()) }
        )

        SliderInput(
            label = "Expected Return",
            value = returnRate,
            onValueChange = { returnRate = it },
            valueRange = 1f..20f,
            steps = 18,
            suffix = "%",
            formatValue = { "${it.toInt()}" }
        )

        val years = durationMonths / 12
        val months = durationMonths % 12
        val durationText = if (durationMonths >= 600) "30+ years" else "${years}y ${months}m"
        val totalWithdrawn = withdrawal.toDouble() * durationMonths

        ResultCard(
            results = listOf(
                ResultItem("Duration", durationText, Primary),
                ResultItem("Total Withdrawn", "\u20B9${formatIndianCurrency(totalWithdrawn)}", Success),
                ResultItem("Corpus", "\u20B9${formatIndianCurrency(corpus.toDouble())}", MaterialTheme.colorScheme.onSurfaceVariant)
            )
        )

        InfoTip("SWP lets you withdraw a fixed amount monthly while the remaining corpus continues to earn returns.")
    }
}

// --- Retirement Calculator ---

@Composable
private fun RetirementCalculator() {
    var currentAge by remember { mutableFloatStateOf(30f) }
    var retirementAge by remember { mutableFloatStateOf(60f) }
    var monthlyExpenses by remember { mutableFloatStateOf(50000f) }
    var inflationRate by remember { mutableFloatStateOf(6f) }
    var preReturnRate by remember { mutableFloatStateOf(12f) }
    var postReturnRate by remember { mutableFloatStateOf(8f) }

    val result by remember {
        derivedStateOf {
            calculateRetirement(
                currentAge.toInt(), retirementAge.toInt(),
                monthlyExpenses.toDouble(), inflationRate.toDouble(),
                preReturnRate.toDouble(), postReturnRate.toDouble()
            )
        }
    }

    Column(verticalArrangement = Arrangement.spacedBy(Spacing.medium)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(Spacing.compact)
        ) {
            Column(modifier = Modifier.weight(1f)) {
                SliderInput(
                    label = "Current Age",
                    value = currentAge,
                    onValueChange = { currentAge = it },
                    valueRange = 18f..55f,
                    steps = 36,
                    suffix = "yrs",
                    formatValue = { "${it.toInt()}" }
                )
            }
            Column(modifier = Modifier.weight(1f)) {
                SliderInput(
                    label = "Retirement Age",
                    value = retirementAge,
                    onValueChange = { retirementAge = it },
                    valueRange = 45f..70f,
                    steps = 24,
                    suffix = "yrs",
                    formatValue = { "${it.toInt()}" }
                )
            }
        }

        SliderInput(
            label = "Monthly Expenses (Today)",
            value = monthlyExpenses,
            onValueChange = { monthlyExpenses = it },
            valueRange = 10000f..500000f,
            steps = 0,
            prefix = "\u20B9",
            formatValue = { indianNumberFormat.format(it.roundToLong()) }
        )

        SliderInput(
            label = "Inflation Rate",
            value = inflationRate,
            onValueChange = { inflationRate = it },
            valueRange = 3f..12f,
            steps = 8,
            suffix = "%",
            formatValue = { "${it.toInt()}" }
        )

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(Spacing.compact)
        ) {
            Column(modifier = Modifier.weight(1f)) {
                SliderInput(
                    label = "Pre-Ret. Return",
                    value = preReturnRate,
                    onValueChange = { preReturnRate = it },
                    valueRange = 6f..20f,
                    steps = 13,
                    suffix = "%",
                    formatValue = { "${it.toInt()}" }
                )
            }
            Column(modifier = Modifier.weight(1f)) {
                SliderInput(
                    label = "Post-Ret. Return",
                    value = postReturnRate,
                    onValueChange = { postReturnRate = it },
                    valueRange = 4f..15f,
                    steps = 10,
                    suffix = "%",
                    formatValue = { "${it.toInt()}" }
                )
            }
        }

        ResultCard(
            results = listOf(
                ResultItem("Corpus Needed", "\u20B9${formatIndianCurrency(result.corpusNeeded)}", Primary),
                ResultItem("Required Monthly SIP", "\u20B9${formatIndianCurrency(result.requiredSip)}", Success),
                ResultItem("Monthly Expense at Retirement", "\u20B9${formatIndianCurrency(result.inflatedExpenses)}", MaterialTheme.colorScheme.onSurfaceVariant)
            )
        )

        InfoTip("Assumes 25 years of post-retirement life. Accounts for inflation impact on current expenses and different pre/post retirement returns.")
    }
}

// --- Shared Components ---

@Composable
private fun SliderInput(
    label: String,
    value: Float,
    onValueChange: (Float) -> Unit,
    valueRange: ClosedFloatingPointRange<Float>,
    steps: Int,
    prefix: String = "",
    suffix: String = "",
    formatValue: (Float) -> String
) {
    val isDark = LocalIsDarkTheme.current

    Column {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall,
                color = Primary,
                fontWeight = FontWeight.SemiBold
            )
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(CornerRadius.small))
                    .background(
                        if (isDark) Color.White.copy(alpha = 0.06f)
                        else Primary.copy(alpha = 0.06f)
                    )
                    .padding(horizontal = Spacing.compact, vertical = Spacing.micro)
            ) {
                Text(
                    text = "$prefix${formatValue(value)}${ if (suffix.isNotEmpty()) " $suffix" else "" }",
                    style = MaterialTheme.typography.labelMedium,
                    color = Primary,
                    fontWeight = FontWeight.SemiBold
                )
            }
        }

        Slider(
            value = value,
            onValueChange = onValueChange,
            valueRange = valueRange,
            steps = steps,
            colors = SliderDefaults.colors(
                thumbColor = Primary,
                activeTrackColor = Primary,
                inactiveTrackColor = if (isDark) Color.White.copy(alpha = 0.1f) else Primary.copy(alpha = 0.1f)
            ),
            modifier = Modifier.fillMaxWidth()
        )

        // Range labels
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(
                text = "$prefix${formatValue(valueRange.start)}${if (suffix.isNotEmpty()) " $suffix" else ""}",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                fontSize = 10.sp
            )
            Text(
                text = "$prefix${formatValue(valueRange.endInclusive)}${if (suffix.isNotEmpty()) " $suffix" else ""}",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                fontSize = 10.sp
            )
        }
    }
}

private data class ResultItem(
    val label: String,
    val value: String,
    val color: Color
)

@Composable
private fun ResultCard(
    results: List<ResultItem>,
    investedRatio: Float? = null
) {
    val isDark = LocalIsDarkTheme.current

    GlassCard(
        cornerRadius = CornerRadius.large
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(Spacing.compact)) {
            results.forEach { item ->
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = item.label,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = item.value,
                        style = MaterialTheme.typography.titleMedium,
                        color = item.color,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            // Progress bar for invested vs returns ratio
            if (investedRatio != null) {
                Spacer(modifier = Modifier.height(Spacing.small))
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(8.dp)
                        .clip(RoundedCornerShape(4.dp))
                        .background(Success.copy(alpha = 0.2f))
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth(investedRatio.coerceIn(0f, 1f))
                            .height(8.dp)
                            .clip(RoundedCornerShape(4.dp))
                            .background(
                                Brush.linearGradient(
                                    colors = listOf(Primary, Secondary)
                                )
                            )
                    )
                }
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(8.dp)
                                .clip(RoundedCornerShape(2.dp))
                                .background(Primary)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "Invested",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(8.dp)
                                .clip(RoundedCornerShape(2.dp))
                                .background(Success)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "Returns",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun InfoTip(text: String) {
    val isDark = LocalIsDarkTheme.current
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(CornerRadius.medium))
            .background(
                if (isDark) Color.White.copy(alpha = 0.04f)
                else Primary.copy(alpha = 0.04f)
            )
            .padding(Spacing.compact),
        verticalAlignment = Alignment.Top,
        horizontalArrangement = Arrangement.spacedBy(Spacing.small)
    ) {
        Icon(
            imageVector = Icons.Default.Info,
            contentDescription = null,
            modifier = Modifier.size(16.dp),
            tint = Primary.copy(alpha = 0.6f)
        )
        Text(
            text = text,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

// --- Calculation Functions ---

private data class SipResult(val futureValue: Double, val invested: Double, val returns: Double)

private fun calculateSip(monthly: Double, years: Int, annualReturn: Double, stepUp: Double): SipResult {
    val monthlyRate = annualReturn / 12 / 100
    val totalMonths = years * 12
    var futureValue = 0.0
    var totalInvested = 0.0
    var currentMonthly = monthly

    for (month in 1..totalMonths) {
        futureValue = (futureValue + currentMonthly) * (1 + monthlyRate)
        totalInvested += currentMonthly
        // Step up annually
        if (stepUp > 0 && month % 12 == 0 && month < totalMonths) {
            currentMonthly *= (1 + stepUp / 100)
        }
    }

    return SipResult(futureValue, totalInvested, futureValue - totalInvested)
}

private fun calculateLumpsum(amount: Double, years: Int, annualReturn: Double): SipResult {
    val futureValue = amount * (1 + annualReturn / 100).pow(years)
    return SipResult(futureValue, amount, futureValue - amount)
}

private fun calculateGoalSip(target: Double, years: Int, annualReturn: Double): Double {
    val monthlyRate = annualReturn / 12 / 100
    val totalMonths = years * 12
    // FV = P * [((1+r)^n - 1) / r] * (1+r)
    // P = FV / [((1+r)^n - 1) / r * (1+r)]
    val factor = ((1 + monthlyRate).pow(totalMonths) - 1) / monthlyRate * (1 + monthlyRate)
    return if (factor > 0) target / factor else 0.0
}

private fun calculateSwpDuration(corpus: Double, withdrawal: Double, annualReturn: Double): Int {
    val monthlyRate = annualReturn / 12 / 100

    // If withdrawal <= monthly interest, corpus never depletes
    val monthlyInterest = corpus * monthlyRate
    if (withdrawal <= monthlyInterest) return 600 // 50 years cap

    // n = -ln(1 - C*r/W) / ln(1+r)
    val ratio = corpus * monthlyRate / withdrawal
    if (ratio >= 1) return 600

    val months = -ln(1 - ratio) / ln(1 + monthlyRate)
    return ceil(months).toInt().coerceAtMost(600)
}

private data class RetirementResult(
    val corpusNeeded: Double,
    val requiredSip: Double,
    val inflatedExpenses: Double
)

private fun calculateRetirement(
    currentAge: Int, retirementAge: Int,
    monthlyExpenses: Double, inflation: Double,
    preReturn: Double, postReturn: Double
): RetirementResult {
    val yearsToRetirement = (retirementAge - currentAge).coerceAtLeast(1)
    val postRetirementYears = 25

    // Monthly expenses at retirement (adjusted for inflation)
    val inflatedMonthlyExpenses = monthlyExpenses * (1 + inflation / 100).pow(yearsToRetirement)

    // Corpus needed at retirement (PV of annuity for post-retirement period)
    val monthlyPostReturn = postReturn / 12 / 100
    val postMonths = postRetirementYears * 12
    val corpusNeeded = if (monthlyPostReturn > 0) {
        inflatedMonthlyExpenses * ((1 - (1 + monthlyPostReturn).pow(-postMonths)) / monthlyPostReturn)
    } else {
        inflatedMonthlyExpenses * postMonths
    }

    // Required SIP
    val requiredSip = calculateGoalSip(corpusNeeded, yearsToRetirement, preReturn)

    return RetirementResult(corpusNeeded, requiredSip, inflatedMonthlyExpenses)
}
