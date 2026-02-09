package com.sparrowinvest.fa.ui.chat

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sparrowinvest.fa.core.network.ApiResult
import com.sparrowinvest.fa.data.model.AvyaChatMessage
import com.sparrowinvest.fa.data.repository.ChatRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.util.UUID
import javax.inject.Inject

data class AvyaChatUiState(
    val messages: List<AvyaChatMessage> = emptyList(),
    val isProcessing: Boolean = false,
    val currentSessionId: String? = null,
    val errorMessage: String? = null
)

@HiltViewModel
class AvyaChatViewModel @Inject constructor(
    private val chatRepository: ChatRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(AvyaChatUiState())
    val uiState: StateFlow<AvyaChatUiState> = _uiState.asStateFlow()

    private var pollingJob: Job? = null
    private var pendingMessageId: String? = null

    private val pollingIntervalMs = 500L
    private val maxPollingAttempts = 120 // 60 seconds max

    fun sendMessage(content: String) {
        val trimmedContent = content.trim()
        if (trimmedContent.isEmpty()) return

        viewModelScope.launch {
            // Create session if needed
            if (_uiState.value.currentSessionId == null) {
                val sessionResult = chatRepository.createSession("FA Chat Session")
                when (sessionResult) {
                    is ApiResult.Success -> {
                        _uiState.update { it.copy(currentSessionId = sessionResult.data.id) }
                    }
                    is ApiResult.Error -> {
                        _uiState.update { it.copy(errorMessage = sessionResult.message) }
                        return@launch
                    }
                    else -> return@launch
                }
            }

            val sessionId = _uiState.value.currentSessionId ?: return@launch

            // Add user message to UI immediately
            val userMessage = AvyaChatMessage(
                id = UUID.randomUUID().toString(),
                content = trimmedContent,
                isUser = true
            )
            _uiState.update { state ->
                state.copy(
                    messages = state.messages + userMessage,
                    isProcessing = true,
                    errorMessage = null
                )
            }

            // Send to backend
            val result = chatRepository.sendMessage(
                sessionId = sessionId,
                content = trimmedContent,
                speakResponse = false
            )

            when (result) {
                is ApiResult.Success -> {
                    pendingMessageId = result.data.messageId
                    startPolling()
                }
                is ApiResult.Error -> {
                    _uiState.update { state ->
                        state.copy(
                            isProcessing = false,
                            messages = state.messages + AvyaChatMessage(
                                id = UUID.randomUUID().toString(),
                                content = "Sorry, I couldn't process your request. Please try again.",
                                isUser = false
                            )
                        )
                    }
                }
                else -> {
                    _uiState.update { it.copy(isProcessing = false) }
                }
            }
        }
    }

    private fun startPolling() {
        pollingJob?.cancel()
        pollingJob = viewModelScope.launch {
            var attempts = 0

            while (attempts < maxPollingAttempts) {
                delay(pollingIntervalMs)
                attempts++

                val messageId = pendingMessageId ?: break

                val result = chatRepository.getMessageStatus(messageId)

                when (result) {
                    is ApiResult.Success -> {
                        val status = result.data

                        when (status.status) {
                            "complete" -> {
                                pendingMessageId = null
                                _uiState.update { state ->
                                    state.copy(
                                        isProcessing = false,
                                        messages = state.messages + AvyaChatMessage(
                                            id = messageId,
                                            content = status.content ?: "",
                                            isUser = false,
                                            audioUrl = status.audioUrl
                                        )
                                    )
                                }
                                break
                            }
                            "error" -> {
                                pendingMessageId = null
                                _uiState.update { state ->
                                    state.copy(
                                        isProcessing = false,
                                        messages = state.messages + AvyaChatMessage(
                                            id = messageId,
                                            content = status.error ?: "An error occurred.",
                                            isUser = false
                                        )
                                    )
                                }
                                break
                            }
                            // "processing" - continue polling
                        }
                    }
                    is ApiResult.Error -> {
                        // Silently continue polling on network errors
                    }
                    else -> {}
                }
            }

            // Timeout handling
            if (attempts >= maxPollingAttempts && pendingMessageId != null) {
                pendingMessageId = null
                _uiState.update { state ->
                    state.copy(
                        isProcessing = false,
                        messages = state.messages + AvyaChatMessage(
                            id = UUID.randomUUID().toString(),
                            content = "Sorry, the response took too long. Please try again.",
                            isUser = false
                        )
                    )
                }
            }
        }
    }

    fun clearChat() {
        pollingJob?.cancel()
        pendingMessageId = null
        _uiState.update {
            AvyaChatUiState()
        }
    }

    fun dismissError() {
        _uiState.update { it.copy(errorMessage = null) }
    }

    override fun onCleared() {
        super.onCleared()
        pollingJob?.cancel()
    }
}
