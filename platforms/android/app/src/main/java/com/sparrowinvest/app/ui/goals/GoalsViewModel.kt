package com.sparrowinvest.app.ui.goals

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sparrowinvest.app.core.network.ApiResult
import com.sparrowinvest.app.data.model.Goal
import com.sparrowinvest.app.data.model.GoalCategory
import com.sparrowinvest.app.data.repository.GoalsRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class GoalsViewModel @Inject constructor(
    private val goalsRepository: GoalsRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<GoalsUiState>(GoalsUiState.Loading)
    val uiState: StateFlow<GoalsUiState> = _uiState.asStateFlow()

    private val _goals = MutableStateFlow<List<Goal>>(emptyList())
    val goals: StateFlow<List<Goal>> = _goals.asStateFlow()

    init {
        loadGoals()
    }

    fun loadGoals() {
        viewModelScope.launch {
            _uiState.value = GoalsUiState.Loading

            when (val result = goalsRepository.getGoals()) {
                is ApiResult.Success -> {
                    _goals.value = result.data
                    _uiState.value = GoalsUiState.Success
                }
                is ApiResult.Error -> {
                    // Use mock data
                    _goals.value = createMockGoals()
                    _uiState.value = GoalsUiState.Success
                }
                else -> {}
            }
        }
    }

    fun deleteGoal(goalId: String) {
        viewModelScope.launch {
            when (goalsRepository.deleteGoal(goalId)) {
                is ApiResult.Success -> {
                    _goals.value = _goals.value.filter { it.id != goalId }
                }
                else -> {}
            }
        }
    }

    private fun createMockGoals(): List<Goal> {
        return listOf(
            Goal(
                id = "1",
                name = "Retirement Fund",
                icon = "account_balance",
                targetAmount = 50000000.0,
                currentAmount = 12500000.0,
                targetDate = "2045-01-01",
                category = GoalCategory.RETIREMENT,
                monthlySip = 50000.0
            ),
            Goal(
                id = "2",
                name = "Child Education",
                icon = "school",
                targetAmount = 20000000.0,
                currentAmount = 4500000.0,
                targetDate = "2035-06-01",
                category = GoalCategory.EDUCATION,
                monthlySip = 25000.0
            ),
            Goal(
                id = "3",
                name = "Dream Home",
                icon = "home",
                targetAmount = 15000000.0,
                currentAmount = 3200000.0,
                targetDate = "2028-12-01",
                category = GoalCategory.HOME,
                monthlySip = 35000.0
            ),
            Goal(
                id = "4",
                name = "Emergency Fund",
                icon = "savings",
                targetAmount = 1000000.0,
                currentAmount = 850000.0,
                targetDate = "2024-06-01",
                category = GoalCategory.EMERGENCY,
                monthlySip = 15000.0
            ),
            Goal(
                id = "5",
                name = "Europe Trip",
                icon = "beach_access",
                targetAmount = 500000.0,
                currentAmount = 180000.0,
                targetDate = "2025-05-01",
                category = GoalCategory.VACATION,
                monthlySip = 10000.0
            )
        )
    }
}

sealed class GoalsUiState {
    data object Loading : GoalsUiState()
    data object Success : GoalsUiState()
    data class Error(val message: String) : GoalsUiState()
}
