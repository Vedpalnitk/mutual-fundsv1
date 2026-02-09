package com.sparrowinvest.fa.ui.clients

import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Badge
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.PersonAdd
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.sparrowinvest.fa.ui.components.GlassCard
import com.sparrowinvest.fa.ui.components.GlassTextField
import com.sparrowinvest.fa.ui.components.PrimaryButton
import com.sparrowinvest.fa.ui.theme.CornerRadius
import com.sparrowinvest.fa.ui.theme.LocalIsDarkTheme
import com.sparrowinvest.fa.ui.theme.Primary
import com.sparrowinvest.fa.ui.theme.Spacing

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddClientScreen(
    onBackClick: () -> Unit,
    onClientCreated: (String) -> Unit,
    viewModel: AddClientViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }

    // Show error messages
    LaunchedEffect(uiState.error) {
        uiState.error?.let { error ->
            snackbarHostState.showSnackbar(error)
            viewModel.clearError()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(Spacing.small)
                    ) {
                        Icon(
                            imageVector = Icons.Default.PersonAdd,
                            contentDescription = null,
                            tint = Primary,
                            modifier = Modifier.size(24.dp)
                        )
                        Text(
                            text = "Onboard Client",
                            style = MaterialTheme.typography.titleLarge
                        )
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
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color.Transparent
                )
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = Spacing.medium)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(Spacing.medium)
        ) {
            Spacer(modifier = Modifier.height(Spacing.small))

            // Basic Information Section
            FormSection(
                title = "Basic Information",
                subtitle = "Required details for client registration",
                icon = Icons.Default.Person
            ) {
                GlassTextField(
                    value = uiState.name,
                    onValueChange = viewModel::updateName,
                    label = "Full Name",
                    placeholder = "Enter client's full name",
                    isError = uiState.nameError != null,
                    errorMessage = uiState.nameError,
                    keyboardType = KeyboardType.Text,
                    imeAction = ImeAction.Next
                )

                Spacer(modifier = Modifier.height(Spacing.compact))

                GlassTextField(
                    value = uiState.email,
                    onValueChange = viewModel::updateEmail,
                    label = "Email Address",
                    placeholder = "client@email.com",
                    isError = uiState.emailError != null,
                    errorMessage = uiState.emailError,
                    keyboardType = KeyboardType.Email,
                    imeAction = ImeAction.Next
                )

                Spacer(modifier = Modifier.height(Spacing.compact))

                GlassTextField(
                    value = uiState.phone,
                    onValueChange = viewModel::updatePhone,
                    label = "Phone Number",
                    placeholder = "+91 XXXXX XXXXX",
                    isError = uiState.phoneError != null,
                    errorMessage = uiState.phoneError,
                    keyboardType = KeyboardType.Phone,
                    imeAction = ImeAction.Next
                )
            }

            // KYC Information Section
            FormSection(
                title = "KYC Information",
                subtitle = "Optional identity verification details",
                icon = Icons.Default.Badge
            ) {
                GlassTextField(
                    value = uiState.panNumber,
                    onValueChange = viewModel::updatePanNumber,
                    label = "PAN Number",
                    placeholder = "ABCDE1234F",
                    isError = uiState.panError != null,
                    errorMessage = uiState.panError,
                    keyboardType = KeyboardType.Text,
                    imeAction = ImeAction.Next
                )
            }

            // Risk Profile Section
            FormSection(
                title = "Risk Profile",
                subtitle = "Select client's investment risk tolerance",
                icon = Icons.Default.Shield
            ) {
                RiskProfileSelector(
                    selectedProfile = uiState.riskProfile,
                    onProfileSelected = viewModel::updateRiskProfile
                )
            }

            // Address Section
            FormSection(
                title = "Address",
                subtitle = "Client's residential address (optional)",
                icon = Icons.Default.Home
            ) {
                GlassTextField(
                    value = uiState.address,
                    onValueChange = viewModel::updateAddress,
                    label = "Full Address",
                    placeholder = "Enter complete address",
                    singleLine = false,
                    imeAction = ImeAction.Done
                )
            }

            Spacer(modifier = Modifier.height(Spacing.medium))

            // Submit Button
            PrimaryButton(
                text = if (uiState.isLoading) "Creating..." else "Create Client",
                onClick = {
                    viewModel.createClient { client ->
                        onClientCreated(client.id)
                    }
                },
                enabled = uiState.isFormValid && !uiState.isLoading,
                isLoading = uiState.isLoading
            )

            Spacer(modifier = Modifier.height(Spacing.large))
        }
    }
}

@Composable
private fun FormSection(
    title: String,
    subtitle: String,
    icon: ImageVector,
    content: @Composable () -> Unit
) {
    val isDark = LocalIsDarkTheme.current

    GlassCard {
        Column(
            modifier = Modifier.fillMaxWidth()
        ) {
            // Section Header
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(Spacing.compact)
            ) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(RoundedCornerShape(CornerRadius.small))
                        .background(Primary.copy(alpha = 0.1f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = icon,
                        contentDescription = null,
                        tint = Primary,
                        modifier = Modifier.size(20.dp)
                    )
                }

                Column {
                    Text(
                        text = title,
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = subtitle,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            Spacer(modifier = Modifier.height(Spacing.medium))

            // Content
            content()
        }
    }
}

@Composable
private fun RiskProfileSelector(
    selectedProfile: String,
    onProfileSelected: (String) -> Unit
) {
    val isDark = LocalIsDarkTheme.current

    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(Spacing.compact)
    ) {
        RiskProfileOption.entries.forEach { option ->
            val isSelected = selectedProfile == option.value
            val backgroundColor = when {
                isSelected -> Primary.copy(alpha = 0.15f)
                isDark -> Color.White.copy(alpha = 0.06f)
                else -> MaterialTheme.colorScheme.surfaceVariant
            }
            val borderColor = if (isSelected) Primary else Color.Transparent
            val textColor = if (isSelected) Primary else MaterialTheme.colorScheme.onSurface

            Box(
                modifier = Modifier
                    .weight(1f)
                    .clip(RoundedCornerShape(CornerRadius.medium))
                    .background(backgroundColor)
                    .border(
                        width = if (isSelected) 1.5.dp else 0.dp,
                        color = borderColor,
                        shape = RoundedCornerShape(CornerRadius.medium)
                    )
                    .clickable { onProfileSelected(option.value) }
                    .padding(vertical = Spacing.compact, horizontal = Spacing.small),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Text(
                        text = option.label,
                        style = MaterialTheme.typography.labelLarge,
                        color = textColor
                    )
                    Text(
                        text = when (option) {
                            RiskProfileOption.CONSERVATIVE -> "Low risk"
                            RiskProfileOption.MODERATE -> "Medium risk"
                            RiskProfileOption.AGGRESSIVE -> "High risk"
                        },
                        style = MaterialTheme.typography.labelSmall,
                        color = textColor.copy(alpha = 0.7f)
                    )
                }
            }
        }
    }
}
