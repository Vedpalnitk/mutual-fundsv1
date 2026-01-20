package com.sparrowinvest.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.sparrowinvest.app.ui.theme.CornerRadius
import com.sparrowinvest.app.ui.theme.LocalIsDarkTheme
import com.sparrowinvest.app.ui.theme.Error
import com.sparrowinvest.app.ui.theme.LocalIsDarkTheme
import com.sparrowinvest.app.ui.theme.Primary
import com.sparrowinvest.app.ui.theme.LocalIsDarkTheme
import com.sparrowinvest.app.ui.theme.TertiaryFillDark
import com.sparrowinvest.app.ui.theme.LocalIsDarkTheme
import com.sparrowinvest.app.ui.theme.TertiaryFillLight
import com.sparrowinvest.app.ui.theme.LocalIsDarkTheme

@Composable
fun OtpTextField(
    otpLength: Int = 6,
    onOtpComplete: (String) -> Unit,
    modifier: Modifier = Modifier,
    isError: Boolean = false
) {
    var otpValue by remember { mutableStateOf("") }
    val focusRequester = remember { FocusRequester() }
    val isDark = LocalIsDarkTheme.current

    LaunchedEffect(Unit) {
        focusRequester.requestFocus()
    }

    LaunchedEffect(otpValue) {
        if (otpValue.length == otpLength) {
            onOtpComplete(otpValue)
        }
    }

    Box(modifier = modifier.fillMaxWidth()) {
        // Hidden text field for input
        BasicTextField(
            value = otpValue,
            onValueChange = { newValue ->
                if (newValue.length <= otpLength && newValue.all { it.isDigit() }) {
                    otpValue = newValue
                }
            },
            modifier = Modifier
                .fillMaxWidth()
                .focusRequester(focusRequester),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
            decorationBox = {
                // OTP boxes display
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp, Alignment.CenterHorizontally)
                ) {
                    repeat(otpLength) { index ->
                        val char = otpValue.getOrNull(index)?.toString() ?: ""
                        val isFilled = char.isNotEmpty()
                        val isCurrent = index == otpValue.length

                        OtpBox(
                            char = char,
                            isFocused = isCurrent,
                            isFilled = isFilled,
                            isError = isError,
                            isDark = isDark
                        )
                    }
                }
            }
        )
    }
}

@Composable
private fun OtpBox(
    char: String,
    isFocused: Boolean,
    isFilled: Boolean,
    isError: Boolean,
    isDark: Boolean
) {
    val backgroundColor = if (isDark) TertiaryFillDark else TertiaryFillLight
    val borderColor = when {
        isError -> Error
        isFocused -> Primary
        isFilled -> Primary.copy(alpha = 0.5f)
        else -> Color.Transparent
    }

    Box(
        modifier = Modifier
            .width(48.dp)
            .height(56.dp)
            .clip(RoundedCornerShape(CornerRadius.medium))
            .background(backgroundColor)
            .border(
                width = if (isFocused || isFilled || isError) 2.dp else 1.dp,
                color = borderColor,
                shape = RoundedCornerShape(CornerRadius.medium)
            ),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = char,
            style = MaterialTheme.typography.headlineMedium,
            color = MaterialTheme.colorScheme.onSurface,
            textAlign = TextAlign.Center
        )
    }
}

@Composable
fun OtpInput(
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    otpLength: Int = 6,
    isError: Boolean = false
) {
    val focusRequester = remember { FocusRequester() }
    val isDark = LocalIsDarkTheme.current

    LaunchedEffect(Unit) {
        focusRequester.requestFocus()
    }

    Box(modifier = modifier.fillMaxWidth()) {
        BasicTextField(
            value = value,
            onValueChange = { newValue ->
                if (newValue.length <= otpLength && newValue.all { it.isDigit() }) {
                    onValueChange(newValue)
                }
            },
            modifier = Modifier
                .fillMaxWidth()
                .focusRequester(focusRequester),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
            decorationBox = {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp, Alignment.CenterHorizontally)
                ) {
                    repeat(otpLength) { index ->
                        val char = value.getOrNull(index)?.toString() ?: ""
                        val isFilled = char.isNotEmpty()
                        val isCurrent = index == value.length

                        OtpBox(
                            char = char,
                            isFocused = isCurrent,
                            isFilled = isFilled,
                            isError = isError,
                            isDark = isDark
                        )
                    }
                }
            }
        )
    }
}
