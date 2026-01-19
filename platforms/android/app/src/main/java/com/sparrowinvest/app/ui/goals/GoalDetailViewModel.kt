package com.sparrowinvest.app.ui.goals

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sparrowinvest.app.core.network.ApiResult
import com.sparrowinvest.app.data.model.Goal
import com.sparrowinvest.app.data.model.GoalCategory
import com.sparrowinvest.app.data.repository.GoalsRepository
import com.sparrowinvest.app.ui.navigation.NavArguments
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

// Contribution data class
data class Contribution(
    val id: String,
    val amount: Double,
    val date: String,
    val type: ContributionType,
    val fundName: String? = null
)

enum class ContributionType {
    SIP, LUMPSUM, RETURNS
}

// Linked fund for goal
data class LinkedFund(
    val id: String,
    val fundName: String,
    val schemeCode: Int,
    val currentValue: Double,
    val investedAmount: Double,
    val returns: Double,
    val returnsPercentage: Double,
    val sipAmount: Double? = null
)

// Goal milestone
data class Milestone(
    val id: String,
    val title: String,
    val targetAmount: Double,
    val targetDate: String,
    val isCompleted: Boolean,
    val completedDate: String? = null
)

// Goal projection
data class GoalProjection(
    val projectedValue: Double,
    val projectedDate: String,
    val isOnTrack: Boolean,
    val shortfall: Double?,
    val recommendedSipIncrease: Double?
)

@HiltViewModel
class GoalDetailViewModel @Inject constructor(
    private val goalsRepository: GoalsRepository,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val goalId: String = savedStateHandle[NavArguments.GOAL_ID] ?: ""

    private val _uiState = MutableStateFlow<GoalDetailUiState>(GoalDetailUiState.Loading)
    val uiState: StateFlow<GoalDetailUiState> = _uiState.asStateFlow()

    private val _goal = MutableStateFlow<Goal?>(null)
    val goal: StateFlow<Goal?> = _goal.asStateFlow()

    private val _linkedFunds = MutableStateFlow<List<LinkedFund>>(emptyList())
    val linkedFunds: StateFlow<List<LinkedFund>> = _linkedFunds.asStateFlow()

    private val _contributions = MutableStateFlow<List<Contribution>>(emptyList())
    val contributions: StateFlow<List<Contribution>> = _contributions.asStateFlow()

    private val _milestones = MutableStateFlow<List<Milestone>>(emptyList())
    val milestones: StateFlow<List<Milestone>> = _milestones.asStateFlow()

    private val _projection = MutableStateFlow<GoalProjection?>(null)
    val projection: StateFlow<GoalProjection?> = _projection.asStateFlow()

    private val _totalContributions = MutableStateFlow(0.0)
    val totalContributions: StateFlow<Double> = _totalContributions.asStateFlow()

    private val _totalReturns = MutableStateFlow(0.0)
    val totalReturns: StateFlow<Double> = _totalReturns.asStateFlow()

    init {
        loadGoalDetail()
    }

    fun loadGoalDetail() {
        viewModelScope.launch {
            _uiState.value = GoalDetailUiState.Loading

            when (val result = goalsRepository.getGoal(goalId)) {
                is ApiResult.Success -> {
                    _goal.value = result.data
                    loadLinkedFunds()
                    loadContributions()
                    loadMilestones()
                    calculateProjection()
                    _uiState.value = GoalDetailUiState.Success
                }
                is ApiResult.Error -> {
                    // Use mock data for demo
                    _goal.value = createMockGoal()
                    loadLinkedFunds()
                    loadContributions()
                    loadMilestones()
                    calculateProjection()
                    _uiState.value = GoalDetailUiState.Success
                }
                else -> {}
            }
        }
    }

    private fun loadLinkedFunds() {
        _linkedFunds.value = listOf(
            LinkedFund(
                id = "1",
                fundName = "Axis Bluechip Fund Direct Growth",
                schemeCode = 119598,
                currentValue = 485000.0,
                investedAmount = 420000.0,
                returns = 65000.0,
                returnsPercentage = 15.48,
                sipAmount = 15000.0
            ),
            LinkedFund(
                id = "2",
                fundName = "Parag Parikh Flexi Cap Fund Direct Growth",
                schemeCode = 122639,
                currentValue = 320000.0,
                investedAmount = 280000.0,
                returns = 40000.0,
                returnsPercentage = 14.29,
                sipAmount = 10000.0
            ),
            LinkedFund(
                id = "3",
                fundName = "HDFC Mid-Cap Opportunities Direct Growth",
                schemeCode = 112090,
                currentValue = 445000.0,
                investedAmount = 350000.0,
                returns = 95000.0,
                returnsPercentage = 27.14,
                sipAmount = 25000.0
            )
        )

        // Calculate totals
        val funds = _linkedFunds.value
        _totalContributions.value = funds.sumOf { it.investedAmount }
        _totalReturns.value = funds.sumOf { it.returns }
    }

    private fun loadContributions() {
        _contributions.value = listOf(
            Contribution(
                id = "1",
                amount = 50000.0,
                date = "Jan 15, 2026",
                type = ContributionType.SIP,
                fundName = "Axis Bluechip Fund"
            ),
            Contribution(
                id = "2",
                amount = 50000.0,
                date = "Jan 15, 2026",
                type = ContributionType.SIP,
                fundName = "HDFC Mid-Cap Opportunities"
            ),
            Contribution(
                id = "3",
                amount = 25000.0,
                date = "Jan 10, 2026",
                type = ContributionType.SIP,
                fundName = "Parag Parikh Flexi Cap"
            ),
            Contribution(
                id = "4",
                amount = 100000.0,
                date = "Jan 5, 2026",
                type = ContributionType.LUMPSUM,
                fundName = "Axis Bluechip Fund"
            ),
            Contribution(
                id = "5",
                amount = 15000.0,
                date = "Dec 31, 2025",
                type = ContributionType.RETURNS,
                fundName = null
            ),
            Contribution(
                id = "6",
                amount = 50000.0,
                date = "Dec 15, 2025",
                type = ContributionType.SIP,
                fundName = "Mixed Funds"
            )
        )
    }

    private fun loadMilestones() {
        _milestones.value = listOf(
            Milestone(
                id = "1",
                title = "First ₹10 Lakhs",
                targetAmount = 1000000.0,
                targetDate = "Dec 2024",
                isCompleted = true,
                completedDate = "Nov 2024"
            ),
            Milestone(
                id = "2",
                title = "₹50 Lakhs",
                targetAmount = 5000000.0,
                targetDate = "Dec 2028",
                isCompleted = false
            ),
            Milestone(
                id = "3",
                title = "₹1 Crore",
                targetAmount = 10000000.0,
                targetDate = "Dec 2032",
                isCompleted = false
            ),
            Milestone(
                id = "4",
                title = "₹2.5 Crores",
                targetAmount = 25000000.0,
                targetDate = "Dec 2038",
                isCompleted = false
            ),
            Milestone(
                id = "5",
                title = "Goal Complete - ₹5 Crores",
                targetAmount = 50000000.0,
                targetDate = "Jan 2045",
                isCompleted = false
            )
        )
    }

    private fun calculateProjection() {
        val goal = _goal.value ?: return
        val monthlySip = goal.monthlySip ?: 50000.0

        // Simple projection calculation (in real app, use proper financial formulas)
        val yearsRemaining = 19 // Simplified
        val expectedReturn = 0.12 // 12% annual return
        val monthlyRate = expectedReturn / 12
        val months = yearsRemaining * 12

        // Future value of SIP
        val fvSip = monthlySip * (((1 + monthlyRate).pow(months) - 1) / monthlyRate) * (1 + monthlyRate)

        // Future value of current amount
        val fvCurrent = goal.currentAmount * (1 + expectedReturn).pow(yearsRemaining)

        val projectedValue = fvSip + fvCurrent
        val isOnTrack = projectedValue >= goal.targetAmount
        val shortfall = if (isOnTrack) null else goal.targetAmount - projectedValue

        _projection.value = GoalProjection(
            projectedValue = projectedValue,
            projectedDate = "Jan 2045",
            isOnTrack = isOnTrack,
            shortfall = shortfall,
            recommendedSipIncrease = if (isOnTrack) null else (shortfall ?: 0.0) / months
        )
    }

    private fun Double.pow(n: Int): Double {
        var result = 1.0
        repeat(n) { result *= this }
        return result
    }

    fun deleteGoal() {
        viewModelScope.launch {
            when (goalsRepository.deleteGoal(goalId)) {
                is ApiResult.Success -> {
                    _uiState.value = GoalDetailUiState.Deleted
                }
                is ApiResult.Error -> {
                    // Handle error
                }
                else -> {}
            }
        }
    }

    private fun createMockGoal(): Goal {
        return when (goalId) {
            "1" -> Goal(
                id = "1",
                name = "Retirement Fund",
                icon = "account_balance",
                targetAmount = 50000000.0,
                currentAmount = 12500000.0,
                targetDate = "2045-01-01",
                category = GoalCategory.RETIREMENT,
                monthlySip = 50000.0,
                linkedFunds = listOf("119598", "122639", "112090"),
                createdAt = "2022-01-01"
            )
            "2" -> Goal(
                id = "2",
                name = "Child Education",
                icon = "school",
                targetAmount = 20000000.0,
                currentAmount = 4500000.0,
                targetDate = "2035-06-01",
                category = GoalCategory.EDUCATION,
                monthlySip = 25000.0,
                linkedFunds = listOf("119598"),
                createdAt = "2023-06-01"
            )
            "3" -> Goal(
                id = "3",
                name = "Dream Home",
                icon = "home",
                targetAmount = 15000000.0,
                currentAmount = 3200000.0,
                targetDate = "2028-12-01",
                category = GoalCategory.HOME,
                monthlySip = 35000.0,
                linkedFunds = listOf("112090"),
                createdAt = "2024-01-01"
            )
            "4" -> Goal(
                id = "4",
                name = "Emergency Fund",
                icon = "savings",
                targetAmount = 1000000.0,
                currentAmount = 850000.0,
                targetDate = "2024-06-01",
                category = GoalCategory.EMERGENCY,
                monthlySip = 15000.0,
                linkedFunds = listOf(),
                createdAt = "2023-01-01"
            )
            else -> Goal(
                id = goalId,
                name = "Custom Goal",
                targetAmount = 1000000.0,
                currentAmount = 250000.0,
                targetDate = "2027-01-01",
                category = GoalCategory.CUSTOM,
                monthlySip = 10000.0
            )
        }
    }
}

sealed class GoalDetailUiState {
    data object Loading : GoalDetailUiState()
    data object Success : GoalDetailUiState()
    data object Deleted : GoalDetailUiState()
    data class Error(val message: String) : GoalDetailUiState()
}
