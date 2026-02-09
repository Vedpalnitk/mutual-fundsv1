package com.sparrowinvest.fa.ui.clients

import androidx.compose.foundation.background
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
import androidx.compose.material.icons.filled.Badge
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.sparrowinvest.fa.ui.components.GlassCard
import com.sparrowinvest.fa.ui.components.GlassTextField
import com.sparrowinvest.fa.ui.components.LoadingIndicator
import com.sparrowinvest.fa.ui.components.PrimaryButton
import com.sparrowinvest.fa.ui.components.TopBar
import com.sparrowinvest.fa.ui.theme.CornerRadius
import com.sparrowinvest.fa.ui.theme.Primary
import com.sparrowinvest.fa.ui.theme.Spacing

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EditClientScreen(
    clientId: String,
    onBackClick: () -> Unit,
    onClientUpdated: () -> Unit,
    viewModel: EditClientViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(clientId) {
        viewModel.loadClient(clientId)
    }

    LaunchedEffect(uiState.error) {
        uiState.error?.let { error ->
            snackbarHostState.showSnackbar(error)
            viewModel.clearError()
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            TopBar(title = "Edit Client", onBackClick = onBackClick)

            if (uiState.isLoadingClient) {
                LoadingIndicator(
                    modifier = Modifier.fillMaxSize(),
                    message = "Loading client..."
                )
            } else {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(horizontal = Spacing.medium)
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(Spacing.medium)
                ) {
                    Spacer(modifier = Modifier.height(Spacing.compact))

                    // Personal Info
                    EditFormSection(
                        title = "Personal Information",
                        subtitle = "Basic client details",
                        icon = Icons.Default.Person
                    ) {
                        GlassTextField(
                            value = uiState.name,
                            onValueChange = { viewModel.updateName(it) },
                            label = "Full Name",
                            placeholder = "Enter full name",
                            isError = uiState.nameError != null,
                            errorMessage = uiState.nameError,
                            imeAction = ImeAction.Next
                        )
                        Spacer(modifier = Modifier.height(Spacing.small))
                        GlassTextField(
                            value = uiState.email,
                            onValueChange = { viewModel.updateEmail(it) },
                            label = "Email Address",
                            placeholder = "Enter email",
                            keyboardType = KeyboardType.Email,
                            isError = uiState.emailError != null,
                            errorMessage = uiState.emailError,
                            imeAction = ImeAction.Next
                        )
                        Spacer(modifier = Modifier.height(Spacing.small))
                        GlassTextField(
                            value = uiState.phone,
                            onValueChange = { viewModel.updatePhone(it) },
                            label = "Phone Number",
                            placeholder = "+91 XXXXX XXXXX",
                            keyboardType = KeyboardType.Phone,
                            imeAction = ImeAction.Next
                        )
                    }

                    // KYC Info
                    EditFormSection(
                        title = "KYC Details",
                        subtitle = "Identity verification",
                        icon = Icons.Default.Badge
                    ) {
                        GlassTextField(
                            value = uiState.panNumber,
                            onValueChange = { viewModel.updatePanNumber(it) },
                            label = "PAN Number",
                            placeholder = "ABCDE1234F",
                            imeAction = ImeAction.Next
                        )
                    }

                    // Risk Profile
                    EditFormSection(
                        title = "Risk Profile",
                        subtitle = "Investment risk tolerance",
                        icon = Icons.Default.Shield
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(Spacing.compact)
                        ) {
                            RiskProfileOption.entries.forEach { option ->
                                val isSelected = uiState.riskProfile == option.value
                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .clip(RoundedCornerShape(CornerRadius.medium))
                                        .background(
                                            if (isSelected) Primary.copy(alpha = 0.15f)
                                            else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                                        )
                                        .clickable { viewModel.updateRiskProfile(option.value) }
                                        .padding(vertical = Spacing.small),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = option.label,
                                        style = MaterialTheme.typography.labelMedium,
                                        color = if (isSelected) Primary
                                        else MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                        }
                    }

                    // Address
                    EditFormSection(
                        title = "Address",
                        subtitle = "Correspondence address",
                        icon = Icons.Default.Home
                    ) {
                        GlassTextField(
                            value = uiState.address,
                            onValueChange = { viewModel.updateAddress(it) },
                            label = "Address",
                            placeholder = "Enter address",
                            singleLine = false
                        )
                    }

                    PrimaryButton(
                        text = "Save Changes",
                        onClick = { viewModel.saveClient(onClientUpdated) },
                        isLoading = uiState.isLoading,
                        enabled = !uiState.isLoading
                    )

                    Spacer(modifier = Modifier.height(Spacing.large))
                }
            }
        }
    }
}

@Composable
private fun EditFormSection(
    title: String,
    subtitle: String,
    icon: ImageVector,
    content: @Composable () -> Unit
) {
    GlassCard {
        Column(modifier = Modifier.fillMaxWidth()) {
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
            content()
        }
    }
}
