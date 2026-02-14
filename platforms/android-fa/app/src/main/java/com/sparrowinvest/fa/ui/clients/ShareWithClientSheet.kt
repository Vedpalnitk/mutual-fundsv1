package com.sparrowinvest.fa.ui.clients

import android.text.Html
import android.widget.TextView
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.MenuAnchorType
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.hilt.navigation.compose.hiltViewModel
import com.sparrowinvest.fa.data.model.CommunicationChannel
import com.sparrowinvest.fa.ui.theme.CornerRadius
import com.sparrowinvest.fa.ui.theme.Error
import com.sparrowinvest.fa.ui.theme.Primary
import com.sparrowinvest.fa.ui.theme.Spacing
import com.sparrowinvest.fa.ui.theme.Success
import kotlinx.coroutines.delay

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ShareWithClientSheet(
    clientId: String,
    clientName: String,
    defaultType: String? = null,
    contextData: kotlinx.serialization.json.JsonObject? = null,
    viewModel: ShareWithClientViewModel = hiltViewModel(),
    onDismiss: () -> Unit
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    val state by viewModel.uiState.collectAsState()
    val context = LocalContext.current

    LaunchedEffect(clientId) {
        viewModel.initialize(clientId, defaultType, contextData)
    }

    // Auto-dismiss after success
    LaunchedEffect(state.isSent) {
        if (state.isSent) {
            delay(1500)
            viewModel.reset()
            onDismiss()
        }
    }

    ModalBottomSheet(
        onDismissRequest = {
            viewModel.reset()
            onDismiss()
        },
        sheetState = sheetState,
        shape = RoundedCornerShape(topStart = CornerRadius.xLarge, topEnd = CornerRadius.xLarge),
        containerColor = MaterialTheme.colorScheme.surface
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = Spacing.medium)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(Spacing.compact)
        ) {
            // Header
            Text(
                text = "Share with $clientName",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onSurface
            )
            Text(
                text = "Send via email or WhatsApp",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Spacer(modifier = Modifier.height(Spacing.small))

            if (state.isSent) {
                ShareSuccessState(channel = state.channel)
            } else {
                // Channel Toggle
                ChannelToggle(
                    selected = state.channel,
                    onChannelChange = viewModel::onChannelChange
                )

                // Template Dropdown
                TemplateDropdown(
                    templates = state.templates,
                    selectedType = state.selectedType,
                    isLoading = state.isLoadingTemplates,
                    onTemplateChange = viewModel::onTemplateChange
                )

                // Subject (email only)
                AnimatedVisibility(visible = state.channel == CommunicationChannel.EMAIL) {
                    Column {
                        SectionLabel("Subject")
                        OutlinedTextField(
                            value = state.subject,
                            onValueChange = viewModel::onSubjectChange,
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                            shape = RoundedCornerShape(CornerRadius.medium),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = Primary,
                                unfocusedBorderColor = MaterialTheme.colorScheme.outline.copy(alpha = 0.3f)
                            )
                        )
                    }
                }

                // Body
                BodySection(
                    channel = state.channel,
                    emailBody = state.emailBody,
                    whatsappBody = state.whatsappBody,
                    isLoading = state.isLoadingPreview,
                    onWhatsappBodyChange = viewModel::onWhatsappBodyChange
                )

                // Error Banner
                state.error?.let { errorMsg ->
                    ErrorBanner(message = errorMsg)
                }

                // Actions
                ActionsRow(
                    channel = state.channel,
                    isSending = state.isSending,
                    canSend = when (state.channel) {
                        CommunicationChannel.EMAIL -> state.emailBody.isNotBlank() && state.subject.isNotBlank()
                        CommunicationChannel.WHATSAPP -> state.whatsappBody.isNotBlank()
                    } && !state.isLoadingPreview,
                    onCancel = {
                        viewModel.reset()
                        onDismiss()
                    },
                    onSend = { viewModel.send(context) }
                )
            }

            Spacer(modifier = Modifier.height(Spacing.large))
        }
    }
}

@Composable
private fun ChannelToggle(
    selected: CommunicationChannel,
    onChannelChange: (CommunicationChannel) -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(CornerRadius.medium))
            .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
            .padding(Spacing.micro),
        horizontalArrangement = Arrangement.spacedBy(Spacing.micro)
    ) {
        CommunicationChannel.entries.forEach { channel ->
            val isSelected = channel == selected
            Row(
                modifier = Modifier
                    .weight(1f)
                    .clip(RoundedCornerShape(CornerRadius.small))
                    .background(
                        if (isSelected) MaterialTheme.colorScheme.surface
                        else Color.Transparent
                    )
                    .clickable { onChannelChange(channel) }
                    .padding(vertical = Spacing.small, horizontal = Spacing.compact),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = if (channel == CommunicationChannel.EMAIL) Icons.Default.Email else Icons.Default.Share,
                    contentDescription = null,
                    modifier = Modifier.size(16.dp),
                    tint = if (isSelected) Primary else MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(modifier = Modifier.width(Spacing.small))
                Text(
                    text = if (channel == CommunicationChannel.EMAIL) "Email" else "WhatsApp",
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal,
                    color = if (isSelected) Primary else MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun TemplateDropdown(
    templates: List<com.sparrowinvest.fa.data.model.CommunicationTemplate>,
    selectedType: String,
    isLoading: Boolean,
    onTemplateChange: (String) -> Unit
) {
    var expanded by remember { mutableStateOf(false) }
    val selectedLabel = templates.find { it.type == selectedType }?.label ?: "Select template"

    Column {
        SectionLabel("Template")
        ExposedDropdownMenuBox(
            expanded = expanded,
            onExpandedChange = { if (!isLoading) expanded = it }
        ) {
            OutlinedTextField(
                value = selectedLabel,
                onValueChange = {},
                readOnly = true,
                modifier = Modifier
                    .fillMaxWidth()
                    .menuAnchor(MenuAnchorType.PrimaryNotEditable),
                trailingIcon = {
                    if (isLoading) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(18.dp),
                            strokeWidth = 2.dp,
                            color = Primary
                        )
                    } else {
                        ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded)
                    }
                },
                shape = RoundedCornerShape(CornerRadius.medium),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Primary,
                    unfocusedBorderColor = MaterialTheme.colorScheme.outline.copy(alpha = 0.3f)
                ),
                singleLine = true
            )
            ExposedDropdownMenu(
                expanded = expanded,
                onDismissRequest = { expanded = false }
            ) {
                templates.forEach { template ->
                    DropdownMenuItem(
                        text = {
                            Column {
                                Text(
                                    text = template.label,
                                    style = MaterialTheme.typography.bodyMedium
                                )
                                Text(
                                    text = template.description,
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        },
                        onClick = {
                            onTemplateChange(template.type)
                            expanded = false
                        }
                    )
                }
            }
        }
    }
}

@Composable
private fun BodySection(
    channel: CommunicationChannel,
    emailBody: String,
    whatsappBody: String,
    isLoading: Boolean,
    onWhatsappBodyChange: (String) -> Unit
) {
    Column {
        SectionLabel(
            if (channel == CommunicationChannel.EMAIL) "Email Preview" else "Message"
        )

        if (isLoading) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(160.dp)
                    .clip(RoundedCornerShape(CornerRadius.medium))
                    .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f)),
                contentAlignment = Alignment.Center
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(Spacing.small)
                ) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(16.dp),
                        strokeWidth = 2.dp,
                        color = Primary
                    )
                    Text(
                        text = "Loading preview...",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        } else if (channel == CommunicationChannel.EMAIL) {
            // HTML rendered in an AndroidView(TextView) — read only
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(CornerRadius.medium))
                    .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.2f))
                    .padding(Spacing.compact)
            ) {
                AndroidView(
                    factory = { ctx ->
                        TextView(ctx).apply {
                            setPadding(8, 8, 8, 8)
                            textSize = 14f
                        }
                    },
                    update = { textView ->
                        textView.text = Html.fromHtml(emailBody, Html.FROM_HTML_MODE_COMPACT)
                    },
                    modifier = Modifier.fillMaxWidth()
                )
            }
        } else {
            // WhatsApp — editable text field
            OutlinedTextField(
                value = whatsappBody,
                onValueChange = onWhatsappBodyChange,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(180.dp),
                shape = RoundedCornerShape(CornerRadius.medium),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Primary,
                    unfocusedBorderColor = MaterialTheme.colorScheme.outline.copy(alpha = 0.3f)
                )
            )
        }
    }
}

@Composable
private fun ErrorBanner(message: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(CornerRadius.small))
            .background(Error.copy(alpha = 0.1f))
            .padding(Spacing.compact),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(Spacing.small)
    ) {
        Icon(
            imageVector = Icons.Default.Warning,
            contentDescription = null,
            tint = Error,
            modifier = Modifier.size(16.dp)
        )
        Text(
            text = message,
            style = MaterialTheme.typography.bodySmall,
            color = Error
        )
    }
}

@Composable
private fun ActionsRow(
    channel: CommunicationChannel,
    isSending: Boolean,
    canSend: Boolean,
    onCancel: () -> Unit,
    onSend: () -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.End,
        verticalAlignment = Alignment.CenterVertically
    ) {
        TextButton(onClick = onCancel) {
            Text("Cancel", color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        Spacer(modifier = Modifier.width(Spacing.small))
        Button(
            onClick = onSend,
            enabled = canSend && !isSending,
            colors = ButtonDefaults.buttonColors(containerColor = Primary),
            shape = RoundedCornerShape(CornerRadius.xLarge)
        ) {
            if (isSending) {
                CircularProgressIndicator(
                    modifier = Modifier.size(16.dp),
                    strokeWidth = 2.dp,
                    color = Color.White
                )
                Spacer(modifier = Modifier.width(Spacing.small))
            }
            Text(
                text = when {
                    isSending -> "Sending..."
                    channel == CommunicationChannel.EMAIL -> "Send Email"
                    else -> "Open WhatsApp"
                }
            )
        }
    }
}

@Composable
private fun ShareSuccessState(channel: CommunicationChannel) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = Spacing.xxLarge),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(Spacing.compact)
    ) {
        Box(
            modifier = Modifier
                .size(64.dp)
                .clip(RoundedCornerShape(CornerRadius.large))
                .background(Success.copy(alpha = 0.1f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.Check,
                contentDescription = null,
                tint = Success,
                modifier = Modifier.size(32.dp)
            )
        }
        Text(
            text = if (channel == CommunicationChannel.EMAIL) "Email sent successfully!" else "WhatsApp opened!",
            style = MaterialTheme.typography.bodyLarge,
            fontWeight = FontWeight.Medium,
            color = MaterialTheme.colorScheme.onSurface
        )
    }
}

@Composable
private fun SectionLabel(text: String) {
    Text(
        text = text,
        style = MaterialTheme.typography.labelMedium,
        fontWeight = FontWeight.SemiBold,
        color = Primary,
        modifier = Modifier.padding(bottom = Spacing.micro)
    )
}
