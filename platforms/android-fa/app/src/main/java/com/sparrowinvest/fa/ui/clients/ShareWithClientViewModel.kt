package com.sparrowinvest.fa.ui.clients

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sparrowinvest.fa.core.network.ApiResult
import com.sparrowinvest.fa.data.model.CommunicationChannel
import com.sparrowinvest.fa.data.model.CommunicationTemplate
import com.sparrowinvest.fa.data.model.PreviewCommunicationRequest
import com.sparrowinvest.fa.data.model.SendCommunicationRequest
import com.sparrowinvest.fa.data.repository.CommunicationRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.serialization.json.JsonObject
import javax.inject.Inject

data class ShareWithClientUiState(
    val clientId: String = "",
    val channel: CommunicationChannel = CommunicationChannel.EMAIL,
    val templates: List<CommunicationTemplate> = emptyList(),
    val selectedType: String = "",
    val subject: String = "",
    val emailBody: String = "",
    val whatsappBody: String = "",
    val contextData: JsonObject? = null,
    val isLoadingTemplates: Boolean = false,
    val isLoadingPreview: Boolean = false,
    val isSending: Boolean = false,
    val isSent: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class ShareWithClientViewModel @Inject constructor(
    private val communicationRepository: CommunicationRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(ShareWithClientUiState())
    val uiState: StateFlow<ShareWithClientUiState> = _uiState.asStateFlow()

    fun initialize(clientId: String, defaultType: String? = null, contextData: JsonObject? = null) {
        _uiState.update { it.copy(clientId = clientId, contextData = contextData) }
        loadTemplates(defaultType)
    }

    private fun loadTemplates(defaultType: String?) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoadingTemplates = true) }
            when (val result = communicationRepository.getTemplates()) {
                is ApiResult.Success -> {
                    val templates = result.data
                    val type = defaultType ?: templates.firstOrNull()?.type ?: ""
                    _uiState.update {
                        it.copy(
                            templates = templates,
                            selectedType = type,
                            isLoadingTemplates = false
                        )
                    }
                    if (type.isNotEmpty()) loadPreview()
                }
                is ApiResult.Error -> {
                    _uiState.update {
                        it.copy(
                            isLoadingTemplates = false,
                            error = "Failed to load templates"
                        )
                    }
                }
                else -> {}
            }
        }
    }

    private fun loadPreview() {
        val state = _uiState.value
        if (state.selectedType.isEmpty() || state.clientId.isEmpty()) return

        viewModelScope.launch {
            _uiState.update { it.copy(isLoadingPreview = true, error = null) }
            val request = PreviewCommunicationRequest(
                clientId = state.clientId,
                type = state.selectedType,
                contextData = state.contextData
            )
            when (val result = communicationRepository.preview(request)) {
                is ApiResult.Success -> {
                    _uiState.update {
                        it.copy(
                            subject = result.data.emailSubject,
                            emailBody = result.data.emailBody,
                            whatsappBody = result.data.whatsappBody,
                            isLoadingPreview = false
                        )
                    }
                }
                is ApiResult.Error -> {
                    _uiState.update {
                        it.copy(
                            subject = "",
                            emailBody = "",
                            whatsappBody = "",
                            isLoadingPreview = false,
                            error = "Failed to load preview"
                        )
                    }
                }
                else -> {}
            }
        }
    }

    fun onChannelChange(channel: CommunicationChannel) {
        _uiState.update { it.copy(channel = channel, error = null) }
    }

    fun onTemplateChange(type: String) {
        _uiState.update { it.copy(selectedType = type, error = null) }
        loadPreview()
    }

    fun onSubjectChange(subject: String) {
        _uiState.update { it.copy(subject = subject) }
    }

    fun onWhatsappBodyChange(body: String) {
        _uiState.update { it.copy(whatsappBody = body) }
    }

    fun send(context: Context) {
        val state = _uiState.value
        val body = if (state.channel == CommunicationChannel.EMAIL) state.emailBody else state.whatsappBody
        if (body.isBlank()) return
        if (state.channel == CommunicationChannel.EMAIL && state.subject.isBlank()) return

        viewModelScope.launch {
            _uiState.update { it.copy(isSending = true, error = null) }
            val request = SendCommunicationRequest(
                clientId = state.clientId,
                channel = state.channel.value,
                type = state.selectedType,
                subject = state.subject,
                body = body,
                metadata = state.contextData
            )
            when (val result = communicationRepository.send(request)) {
                is ApiResult.Success -> {
                    result.data.waLink?.let { waLink ->
                        try {
                            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(waLink))
                            context.startActivity(intent)
                        } catch (_: Exception) {}
                    }
                    _uiState.update { it.copy(isSending = false, isSent = true) }
                }
                is ApiResult.Error -> {
                    _uiState.update {
                        it.copy(
                            isSending = false,
                            error = result.message
                        )
                    }
                }
                else -> {}
            }
        }
    }

    fun reset() {
        _uiState.value = ShareWithClientUiState()
    }
}
