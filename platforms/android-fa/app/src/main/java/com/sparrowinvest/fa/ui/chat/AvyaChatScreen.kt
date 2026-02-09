package com.sparrowinvest.fa.ui.chat

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.*
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.ArrowUpward
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.sparrowinvest.fa.data.model.AvyaChatMessage
import com.sparrowinvest.fa.ui.theme.*
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

// Avya gradient colors (purple to blue to cyan)
private val AvyaGradient = Brush.linearGradient(
    colors = listOf(
        Color(0xFF6366F1), // Purple
        Color(0xFF3B82F6), // Blue
        Color(0xFF06B6D4)  // Cyan
    )
)

private val AvyaGradientColors = listOf(
    Color(0xFF6366F1),
    Color(0xFF3B82F6),
    Color(0xFF06B6D4)
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AvyaChatScreen(
    onBackClick: () -> Unit,
    initialQuery: String? = null,
    viewModel: AvyaChatViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val isDark = LocalIsDarkTheme.current
    var messageText by remember { mutableStateOf("") }
    var showMenu by remember { mutableStateOf(false) }
    val focusManager = LocalFocusManager.current
    val listState = rememberLazyListState()
    val coroutineScope = rememberCoroutineScope()

    // Auto-send initial query if provided
    LaunchedEffect(initialQuery) {
        if (!initialQuery.isNullOrBlank()) {
            viewModel.sendMessage(initialQuery)
        }
    }

    // Auto-scroll to bottom when new messages arrive
    LaunchedEffect(uiState.messages.size, uiState.isProcessing) {
        if (uiState.messages.isNotEmpty() || uiState.isProcessing) {
            coroutineScope.launch {
                listState.animateScrollToItem(
                    if (uiState.isProcessing) uiState.messages.size else uiState.messages.size - 1
                )
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(Spacing.compact)
                    ) {
                        // Avya avatar
                        Box(
                            modifier = Modifier
                                .size(32.dp)
                                .clip(CircleShape)
                                .background(AvyaGradient),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "✨",
                                fontSize = 14.sp
                            )
                        }
                        Column {
                            Text(
                                text = "Avya",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.SemiBold
                            )
                            Text(
                                text = "Your client portfolio assistant",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Back"
                        )
                    }
                },
                actions = {
                    IconButton(onClick = { showMenu = true }) {
                        Icon(
                            imageVector = Icons.Default.MoreVert,
                            contentDescription = "More"
                        )
                    }
                    DropdownMenu(
                        expanded = showMenu,
                        onDismissRequest = { showMenu = false }
                    ) {
                        DropdownMenuItem(
                            text = { Text("Clear Chat") },
                            onClick = {
                                viewModel.clearChat()
                                showMenu = false
                            }
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // Chat messages
            LazyColumn(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth(),
                state = listState,
                contentPadding = PaddingValues(Spacing.medium),
                verticalArrangement = Arrangement.spacedBy(Spacing.medium)
            ) {
                // Welcome card when no messages
                if (uiState.messages.isEmpty() && !uiState.isProcessing) {
                    item {
                        WelcomeCard(
                            onQuestionTap = { question ->
                                messageText = question
                                viewModel.sendMessage(question)
                                messageText = ""
                            }
                        )
                    }
                }

                // Messages
                items(uiState.messages) { message ->
                    ChatBubble(message = message, isDark = isDark)
                }

                // Typing indicator
                if (uiState.isProcessing) {
                    item {
                        TypingIndicator(isDark = isDark)
                    }
                }
            }

            // Input bar
            ChatInputBar(
                messageText = messageText,
                onMessageChange = { messageText = it },
                isProcessing = uiState.isProcessing,
                isDark = isDark,
                onSend = {
                    if (messageText.isNotBlank()) {
                        viewModel.sendMessage(messageText)
                        messageText = ""
                        focusManager.clearFocus()
                    }
                }
            )
        }
    }

    // Error dialog
    uiState.errorMessage?.let { error ->
        AlertDialog(
            onDismissRequest = { viewModel.dismissError() },
            title = { Text("Error") },
            text = { Text(error) },
            confirmButton = {
                TextButton(onClick = { viewModel.dismissError() }) {
                    Text("OK")
                }
            }
        )
    }
}

private object AvyaSuggestions {
    val defaultQuestions = listOf(
        "Which clients need portfolio rebalancing?",
        "Show me clients with underperforming funds",
        "What are the top tax-saving opportunities?",
        "Summarize my clients' risk exposure"
    )
}

@Composable
private fun WelcomeCard(
    onQuestionTap: (String) -> Unit,
    suggestedQuestions: List<String> = AvyaSuggestions.defaultQuestions
) {
    val isDark = LocalIsDarkTheme.current

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(CornerRadius.xLarge))
            .background(
                if (isDark) GlassBackgroundDark else Color(0xFFF8FAFC)
            )
            .padding(Spacing.large),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(Spacing.medium)
    ) {
        // Avya Avatar
        Box(
            modifier = Modifier
                .size(72.dp)
                .clip(CircleShape)
                .background(AvyaGradient),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "✨",
                fontSize = 32.sp
            )
        }

        // Title
        Text(
            text = "Avya",
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.SemiBold,
            color = MaterialTheme.colorScheme.onSurface
        )

        Text(
            text = "Your intelligent portfolio assistant for client management",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(Spacing.small))

        // Suggested questions
        Column(
            modifier = Modifier.fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(Spacing.small)
        ) {
            Text(
                text = "TRY ASKING",
                style = MaterialTheme.typography.labelSmall,
                color = Primary,
                letterSpacing = 1.sp
            )

            suggestedQuestions.forEach { question ->
                SuggestedQuestionChip(
                    question = question,
                    onClick = { onQuestionTap(question) },
                    isDark = isDark
                )
            }
        }
    }
}

@Composable
private fun SuggestedQuestionChip(
    question: String,
    onClick: () -> Unit,
    isDark: Boolean
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(CornerRadius.medium))
            .background(
                if (isDark) SecondaryFillDark else TertiaryFillLight
            )
            .clickable(onClick = onClick)
            .padding(horizontal = Spacing.compact, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(Spacing.small)
    ) {
        Text(
            text = "✨",
            fontSize = 12.sp,
            color = Primary
        )
        Text(
            text = question,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurface,
            modifier = Modifier.weight(1f)
        )
        Text(
            text = "→",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
private fun ChatBubble(
    message: AvyaChatMessage,
    isDark: Boolean
) {
    val timeFormat = remember { SimpleDateFormat("h:mm a", Locale.getDefault()) }

    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = if (message.isUser) Arrangement.End else Arrangement.Start,
        verticalAlignment = Alignment.Bottom
    ) {
        if (!message.isUser) {
            // AI Avatar
            Box(
                modifier = Modifier
                    .size(28.dp)
                    .clip(CircleShape)
                    .background(AvyaGradient),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "✨",
                    fontSize = 12.sp
                )
            }
            Spacer(modifier = Modifier.width(Spacing.small))
        }

        Column(
            horizontalAlignment = if (message.isUser) Alignment.End else Alignment.Start,
            modifier = Modifier.weight(1f, fill = false)
        ) {
            Box(
                modifier = Modifier
                    .clip(
                        RoundedCornerShape(
                            topStart = 18.dp,
                            topEnd = 18.dp,
                            bottomStart = if (message.isUser) 18.dp else 4.dp,
                            bottomEnd = if (message.isUser) 4.dp else 18.dp
                        )
                    )
                    .background(
                        if (message.isUser) {
                            AvyaGradient
                        } else {
                            Brush.linearGradient(
                                colors = if (isDark) {
                                    listOf(
                                        Color.White.copy(alpha = 0.1f),
                                        Color.White.copy(alpha = 0.1f)
                                    )
                                } else {
                                    listOf(
                                        Color(0xFFF1F5F9), // Subtle grey
                                        Color(0xFFF8FAFC)  // Slightly lighter
                                    )
                                }
                            )
                        }
                    )
                    .padding(horizontal = Spacing.medium, vertical = Spacing.compact)
            ) {
                Text(
                    text = message.content,
                    style = MaterialTheme.typography.bodyMedium,
                    color = if (message.isUser) Color.White else MaterialTheme.colorScheme.onSurface
                )
            }

            Spacer(modifier = Modifier.height(4.dp))

            Text(
                text = timeFormat.format(Date(message.timestamp)),
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
            )
        }

        if (message.isUser) {
            Spacer(modifier = Modifier.width(60.dp))
        } else {
            Spacer(modifier = Modifier.width(60.dp))
        }
    }
}

@Composable
private fun TypingIndicator(isDark: Boolean) {
    val infiniteTransition = rememberInfiniteTransition(label = "typing")

    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.Start,
        verticalAlignment = Alignment.Bottom
    ) {
        // AI Avatar
        Box(
            modifier = Modifier
                .size(28.dp)
                .clip(CircleShape)
                .background(AvyaGradient),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "✨",
                fontSize = 12.sp
            )
        }

        Spacer(modifier = Modifier.width(Spacing.small))

        Row(
            modifier = Modifier
                .clip(RoundedCornerShape(18.dp))
                .background(
                    if (isDark) Color.White.copy(alpha = 0.1f) else Color(0xFFF1F5F9)
                )
                .padding(horizontal = Spacing.medium, vertical = Spacing.compact),
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            repeat(3) { index ->
                val scale by infiniteTransition.animateFloat(
                    initialValue = 0.8f,
                    targetValue = 1.2f,
                    animationSpec = infiniteRepeatable(
                        animation = tween(400),
                        repeatMode = RepeatMode.Reverse,
                        initialStartOffset = StartOffset(index * 133)
                    ),
                    label = "dot$index"
                )

                Box(
                    modifier = Modifier
                        .size((8 * scale).dp)
                        .clip(CircleShape)
                        .background(Primary)
                )
            }
        }
    }
}

@Composable
private fun ChatInputBar(
    messageText: String,
    onMessageChange: (String) -> Unit,
    isProcessing: Boolean,
    isDark: Boolean,
    onSend: () -> Unit
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        color = MaterialTheme.colorScheme.surface,
        tonalElevation = if (isDark) 0.dp else 2.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = Spacing.medium, vertical = Spacing.compact),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(Spacing.compact)
        ) {
            // Text input
            OutlinedTextField(
                value = messageText,
                onValueChange = onMessageChange,
                modifier = Modifier.weight(1f),
                placeholder = {
                    Text(
                        text = "Ask about your clients...",
                        style = MaterialTheme.typography.bodyMedium
                    )
                },
                enabled = !isProcessing,
                maxLines = 4,
                shape = RoundedCornerShape(20.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Primary,
                    unfocusedBorderColor = if (isDark) CardBorderDark else CardBorderLight,
                    focusedContainerColor = if (isDark) SecondaryFillDark else TertiaryFillLight,
                    unfocusedContainerColor = if (isDark) SecondaryFillDark else TertiaryFillLight
                ),
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Send),
                keyboardActions = KeyboardActions(onSend = { onSend() }),
                trailingIcon = {
                    if (messageText.isNotBlank()) {
                        IconButton(onClick = { onMessageChange("") }) {
                            Icon(
                                imageVector = Icons.Default.Clear,
                                contentDescription = "Clear",
                                tint = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            )

            // Send button
            val sendButtonEnabled = messageText.isNotBlank() && !isProcessing
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(CircleShape)
                    .background(
                        if (sendButtonEnabled) AvyaGradient else Brush.linearGradient(
                            colors = listOf(Color.Gray.copy(alpha = 0.3f), Color.Gray.copy(alpha = 0.3f))
                        )
                    )
                    .clickable(enabled = sendButtonEnabled) { onSend() },
                contentAlignment = Alignment.Center
            ) {
                if (isProcessing) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(24.dp),
                        color = Color.White,
                        strokeWidth = 2.dp
                    )
                } else {
                    Icon(
                        imageVector = Icons.Default.ArrowUpward,
                        contentDescription = "Send",
                        tint = if (messageText.isBlank()) Color.Gray else Color.White
                    )
                }
            }
        }
    }
}
