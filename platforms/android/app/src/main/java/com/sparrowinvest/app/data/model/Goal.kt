package com.sparrowinvest.app.data.model

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBalance
import androidx.compose.material.icons.filled.AttachMoney
import androidx.compose.material.icons.filled.BeachAccess
import androidx.compose.material.icons.filled.DirectionsCar
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.SaveAlt
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.filled.Star
import androidx.compose.ui.graphics.vector.ImageVector
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class Goal(
    val id: String = "",
    val name: String,
    val icon: String = "star",
    @SerialName("target_amount")
    val targetAmount: Double,
    @SerialName("current_amount")
    val currentAmount: Double = 0.0,
    @SerialName("target_date")
    val targetDate: String,
    val category: GoalCategory = GoalCategory.CUSTOM,
    @SerialName("linked_funds")
    val linkedFunds: List<String> = emptyList(),
    @SerialName("monthly_sip")
    val monthlySip: Double? = null,
    @SerialName("created_at")
    val createdAt: String? = null
) {
    val progressPercentage: Double
        get() = if (targetAmount > 0) (currentAmount / targetAmount * 100).coerceIn(0.0, 100.0) else 0.0

    val remainingAmount: Double
        get() = (targetAmount - currentAmount).coerceAtLeast(0.0)

    val isCompleted: Boolean
        get() = currentAmount >= targetAmount
}

@Serializable
enum class GoalCategory {
    @SerialName("Retirement")
    RETIREMENT,
    @SerialName("Education")
    EDUCATION,
    @SerialName("Home")
    HOME,
    @SerialName("Car")
    CAR,
    @SerialName("Vacation")
    VACATION,
    @SerialName("Wedding")
    WEDDING,
    @SerialName("Emergency Fund")
    EMERGENCY,
    @SerialName("Wealth Creation")
    WEALTH,
    @SerialName("Custom")
    CUSTOM;

    val displayName: String
        get() = when (this) {
            RETIREMENT -> "Retirement"
            EDUCATION -> "Education"
            HOME -> "Home"
            CAR -> "Car"
            VACATION -> "Vacation"
            WEDDING -> "Wedding"
            EMERGENCY -> "Emergency Fund"
            WEALTH -> "Wealth Creation"
            CUSTOM -> "Custom"
        }

    val icon: ImageVector
        get() = when (this) {
            RETIREMENT -> Icons.Default.AccountBalance
            EDUCATION -> Icons.Default.School
            HOME -> Icons.Default.Home
            CAR -> Icons.Default.DirectionsCar
            VACATION -> Icons.Default.BeachAccess
            WEDDING -> Icons.Default.Favorite
            EMERGENCY -> Icons.Default.SaveAlt
            WEALTH -> Icons.Default.AttachMoney
            CUSTOM -> Icons.Default.Star
        }

    val color: Long
        get() = when (this) {
            RETIREMENT -> 0xFF2563EB
            EDUCATION -> 0xFF8B5CF6
            HOME -> 0xFF10B981
            CAR -> 0xFFF59E0B
            VACATION -> 0xFF14B8A6
            WEDDING -> 0xFFEC4899
            EMERGENCY -> 0xFFEF4444
            WEALTH -> 0xFF6366F1
            CUSTOM -> 0xFF64748B
        }
}
