package com.sparrowinvest.app.ui.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import com.sparrowinvest.app.ui.components.GlassTextField
import com.sparrowinvest.app.ui.components.LinkButton
import com.sparrowinvest.app.ui.components.PrimaryButton
import com.sparrowinvest.app.ui.components.TopBar
import com.sparrowinvest.app.ui.theme.Error
import com.sparrowinvest.app.ui.theme.Spacing

@Composable
fun SignupScreen(
    viewModel: AuthViewModel,
    onSignupComplete: () -> Unit,
    onLoginClick: () -> Unit,
    onBackClick: () -> Unit
) {
    var name by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }
    var passwordVisible by remember { mutableStateOf(false) }

    val signupState by viewModel.signupState.collectAsState()

    val isLoading = signupState is AuthState.Loading
    val errorMessage = (signupState as? AuthState.Error)?.message

    val isFormValid = name.isNotBlank() &&
            email.isNotBlank() &&
            android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches() &&
            password.length >= 6 &&
            password == confirmPassword

    LaunchedEffect(signupState) {
        if (signupState is AuthState.SignupComplete) {
            onSignupComplete()
            viewModel.resetSignupState()
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .statusBarsPadding()
            .imePadding()
            .verticalScroll(rememberScrollState())
    ) {
        TopBar(
            title = "",
            onBackClick = onBackClick
        )

        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(Spacing.large)
        ) {
            Spacer(modifier = Modifier.height(Spacing.large))

            Text(
                text = "Create Account",
                style = MaterialTheme.typography.headlineLarge,
                color = MaterialTheme.colorScheme.onSurface
            )

            Spacer(modifier = Modifier.height(Spacing.small))

            Text(
                text = "Start your investment journey today",
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Spacer(modifier = Modifier.height(Spacing.xxLarge))

            // Name field
            GlassTextField(
                value = name,
                onValueChange = { name = it },
                placeholder = "Full Name",
                prefix = {
                    Icon(
                        imageVector = Icons.Default.Person,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                },
                keyboardType = KeyboardType.Text,
                imeAction = ImeAction.Next
            )

            Spacer(modifier = Modifier.height(Spacing.medium))

            // Email field
            GlassTextField(
                value = email,
                onValueChange = { email = it },
                placeholder = "Email",
                prefix = {
                    Icon(
                        imageVector = Icons.Default.Email,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                },
                keyboardType = KeyboardType.Email,
                imeAction = ImeAction.Next
            )

            Spacer(modifier = Modifier.height(Spacing.medium))

            // Password field
            GlassTextField(
                value = password,
                onValueChange = { password = it },
                placeholder = "Password",
                prefix = {
                    Icon(
                        imageVector = Icons.Default.Lock,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                },
                suffix = {
                    IconButton(onClick = { passwordVisible = !passwordVisible }) {
                        Icon(
                            imageVector = if (passwordVisible) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                            contentDescription = if (passwordVisible) "Hide password" else "Show password",
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                },
                visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                keyboardType = KeyboardType.Password,
                imeAction = ImeAction.Next
            )

            Spacer(modifier = Modifier.height(Spacing.medium))

            // Confirm Password field
            GlassTextField(
                value = confirmPassword,
                onValueChange = { confirmPassword = it },
                placeholder = "Confirm Password",
                prefix = {
                    Icon(
                        imageVector = Icons.Default.Lock,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                },
                visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                keyboardType = KeyboardType.Password,
                imeAction = ImeAction.Done,
                isError = confirmPassword.isNotEmpty() && password != confirmPassword,
                errorMessage = if (confirmPassword.isNotEmpty() && password != confirmPassword) "Passwords don't match" else null,
                onImeAction = {
                    if (isFormValid) {
                        viewModel.register(name, email, password)
                    }
                }
            )

            if (errorMessage != null) {
                Spacer(modifier = Modifier.height(Spacing.small))
                Text(
                    text = errorMessage,
                    style = MaterialTheme.typography.bodySmall,
                    color = Error
                )
            }

            Spacer(modifier = Modifier.height(Spacing.xxLarge))

            PrimaryButton(
                text = "Create Account",
                onClick = { viewModel.register(name, email, password) },
                enabled = isFormValid,
                isLoading = isLoading
            )

            Spacer(modifier = Modifier.height(Spacing.large))

            LinkButton(
                text = "Already have an account? Sign In",
                onClick = onLoginClick
            )

            Spacer(modifier = Modifier.height(Spacing.medium))

            Text(
                text = "By creating an account, you agree to our Terms of Service and Privacy Policy",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}
