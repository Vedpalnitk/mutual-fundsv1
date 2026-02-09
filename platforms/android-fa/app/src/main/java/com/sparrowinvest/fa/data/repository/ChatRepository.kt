package com.sparrowinvest.fa.data.repository

import com.sparrowinvest.fa.core.network.ApiResult
import com.sparrowinvest.fa.core.network.ApiService
import com.sparrowinvest.fa.data.model.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ChatRepository @Inject constructor(
    private val apiService: ApiService
) {
    suspend fun createSession(title: String? = null): ApiResult<ChatSession> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.createChatSession(CreateSessionRequest(title))
            if (response.isSuccessful) {
                response.body()?.let { session ->
                    ApiResult.success(session)
                } ?: ApiResult.error("Empty response")
            } else {
                ApiResult.error(
                    response.errorBody()?.string() ?: "Failed to create session",
                    response.code()
                )
            }
        } catch (e: Exception) {
            ApiResult.error(e.message ?: "Network error", exception = e)
        }
    }

    suspend fun loadChatHistory(sessionId: String): ApiResult<List<ChatHistoryMessage>> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getChatHistory(sessionId)
            if (response.isSuccessful) {
                response.body()?.let { history ->
                    ApiResult.success(history)
                } ?: ApiResult.success(emptyList())
            } else {
                ApiResult.error(
                    response.errorBody()?.string() ?: "Failed to load history",
                    response.code()
                )
            }
        } catch (e: Exception) {
            ApiResult.error(e.message ?: "Network error", exception = e)
        }
    }

    suspend fun sendMessage(
        sessionId: String,
        content: String,
        speakResponse: Boolean = false
    ): ApiResult<ChatMessageResponse> = withContext(Dispatchers.IO) {
        try {
            val request = SendMessageRequest(
                sessionId = sessionId,
                content = content,
                speakResponse = speakResponse
            )
            val response = apiService.sendChatMessage(request)
            if (response.isSuccessful) {
                response.body()?.let { messageResponse ->
                    ApiResult.success(messageResponse)
                } ?: ApiResult.error("Empty response")
            } else {
                ApiResult.error(
                    response.errorBody()?.string() ?: "Failed to send message",
                    response.code()
                )
            }
        } catch (e: Exception) {
            ApiResult.error(e.message ?: "Network error", exception = e)
        }
    }

    suspend fun getMessageStatus(messageId: String): ApiResult<ChatMessageStatus> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getChatMessageStatus(messageId)
            if (response.isSuccessful) {
                response.body()?.let { status ->
                    ApiResult.success(status)
                } ?: ApiResult.error("Empty response")
            } else {
                ApiResult.error(
                    response.errorBody()?.string() ?: "Failed to get status",
                    response.code()
                )
            }
        } catch (e: Exception) {
            ApiResult.error(e.message ?: "Network error", exception = e)
        }
    }
}
