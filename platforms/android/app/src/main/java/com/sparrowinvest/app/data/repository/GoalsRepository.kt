package com.sparrowinvest.app.data.repository

import com.sparrowinvest.app.core.network.ApiResult
import com.sparrowinvest.app.core.network.ApiService
import com.sparrowinvest.app.data.model.Goal
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class GoalsRepository @Inject constructor(
    private val apiService: ApiService
) {
    suspend fun getGoals(): ApiResult<List<Goal>> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getGoals()
            if (response.isSuccessful) {
                response.body()?.let {
                    ApiResult.success(it)
                } ?: ApiResult.success(emptyList())
            } else {
                when (response.code()) {
                    401 -> ApiResult.unauthorized()
                    else -> ApiResult.error("Failed to get goals", response.code())
                }
            }
        } catch (e: Exception) {
            ApiResult.error(e.message ?: "Network error", exception = e)
        }
    }

    suspend fun getGoal(id: String): ApiResult<Goal> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getGoal(id)
            if (response.isSuccessful) {
                response.body()?.let {
                    ApiResult.success(it)
                } ?: ApiResult.error("Goal not found")
            } else {
                when (response.code()) {
                    401 -> ApiResult.unauthorized()
                    404 -> ApiResult.notFound("Goal not found")
                    else -> ApiResult.error("Failed to get goal", response.code())
                }
            }
        } catch (e: Exception) {
            ApiResult.error(e.message ?: "Network error", exception = e)
        }
    }

    suspend fun createGoal(goal: Goal): ApiResult<Goal> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.createGoal(goal)
            if (response.isSuccessful) {
                response.body()?.let {
                    ApiResult.success(it)
                } ?: ApiResult.error("Empty response")
            } else {
                when (response.code()) {
                    401 -> ApiResult.unauthorized()
                    else -> ApiResult.error("Failed to create goal", response.code())
                }
            }
        } catch (e: Exception) {
            ApiResult.error(e.message ?: "Network error", exception = e)
        }
    }

    suspend fun updateGoal(id: String, goal: Goal): ApiResult<Goal> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.updateGoal(id, goal)
            if (response.isSuccessful) {
                response.body()?.let {
                    ApiResult.success(it)
                } ?: ApiResult.error("Empty response")
            } else {
                when (response.code()) {
                    401 -> ApiResult.unauthorized()
                    404 -> ApiResult.notFound("Goal not found")
                    else -> ApiResult.error("Failed to update goal", response.code())
                }
            }
        } catch (e: Exception) {
            ApiResult.error(e.message ?: "Network error", exception = e)
        }
    }

    suspend fun deleteGoal(id: String): ApiResult<Unit> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.deleteGoal(id)
            if (response.isSuccessful) {
                ApiResult.success(Unit)
            } else {
                when (response.code()) {
                    401 -> ApiResult.unauthorized()
                    404 -> ApiResult.notFound("Goal not found")
                    else -> ApiResult.error("Failed to delete goal", response.code())
                }
            }
        } catch (e: Exception) {
            ApiResult.error(e.message ?: "Network error", exception = e)
        }
    }
}
