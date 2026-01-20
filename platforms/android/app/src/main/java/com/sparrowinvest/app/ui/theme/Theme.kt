package com.sparrowinvest.app.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

// CompositionLocal to provide dark theme state to all components
val LocalIsDarkTheme = compositionLocalOf { false }

private val LightColorScheme = lightColorScheme(
    primary = Primary,
    onPrimary = Color.White,
    primaryContainer = PrimaryLight,
    onPrimaryContainer = PrimaryDark,

    secondary = Secondary,
    onSecondary = Color.White,
    secondaryContainer = Color(0xFFCCF2F5),
    onSecondaryContainer = Color(0xFF002022),

    tertiary = Accent,
    onTertiary = Color.White,
    tertiaryContainer = Color(0xFFCCECE9),
    onTertiaryContainer = Color(0xFF002321),

    error = Error,
    onError = Color.White,
    errorContainer = Color(0xFFFEE2E2),
    onErrorContainer = Color(0xFF7F1D1D),

    background = BackgroundLight,
    onBackground = TextPrimaryLight,

    surface = SurfaceLight,
    onSurface = TextPrimaryLight,
    surfaceVariant = Color(0xFFF3F4F6),
    onSurfaceVariant = TextSecondaryLight,

    outline = SeparatorLight,
    outlineVariant = CardBorderLight
)

private val DarkColorScheme = darkColorScheme(
    primary = PrimaryLight,
    onPrimary = Color(0xFF003258),
    primaryContainer = PrimaryDark,
    onPrimaryContainer = Color(0xFFD6E3FF),

    secondary = Color(0xFF4DD0E1),
    onSecondary = Color(0xFF003737),
    secondaryContainer = Color(0xFF004F50),
    onSecondaryContainer = Color(0xFFCCF2F5),

    tertiary = Color(0xFF5EEAD4),
    onTertiary = Color(0xFF003735),
    tertiaryContainer = Color(0xFF00504D),
    onTertiaryContainer = Color(0xFFCCECE9),

    error = ErrorLight,
    onError = Color(0xFF690005),
    errorContainer = Color(0xFF93000A),
    onErrorContainer = Color(0xFFFFDAD6),

    background = BackgroundDark,
    onBackground = TextPrimaryDark,

    surface = SurfaceDark,
    onSurface = TextPrimaryDark,
    surfaceVariant = Color(0xFF334155),
    onSurfaceVariant = TextSecondaryDark,

    outline = SeparatorDark,
    outlineVariant = CardBorderDark
)

@Composable
fun SparrowInvestTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = Color.Transparent.toArgb()
            window.navigationBarColor = Color.Transparent.toArgb()
            WindowCompat.getInsetsController(window, view).apply {
                isAppearanceLightStatusBars = !darkTheme
                isAppearanceLightNavigationBars = !darkTheme
            }
        }
    }

    CompositionLocalProvider(LocalIsDarkTheme provides darkTheme) {
        MaterialTheme(
            colorScheme = colorScheme,
            typography = Typography,
            shapes = Shapes,
            content = content
        )
    }
}

// Gradient definitions
object AppGradients {
    val primary: Brush
        @Composable get() = Brush.linearGradient(
            colors = listOf(Primary, Secondary)
        )

    val success: Brush
        @Composable get() = Brush.linearGradient(
            colors = listOf(Success, SuccessLight)
        )

    val warm: Brush
        @Composable get() = Brush.linearGradient(
            colors = listOf(Warning, WarningLight)
        )

    @Composable
    fun glassGradient(isDark: Boolean): Brush {
        return if (isDark) {
            Brush.linearGradient(
                colors = listOf(
                    GlassBorderStartDark,
                    GlassBorderMidDark,
                    GlassBorderEndDark
                )
            )
        } else {
            Brush.linearGradient(
                colors = listOf(
                    GlassBorderStartLight,
                    GlassBorderMidLight,
                    GlassBorderEndLight
                )
            )
        }
    }
}

// Extension to get semantic colors
object AppColors {
    val positive: Color @Composable get() = Success
    val negative: Color @Composable get() = Error
    val neutral: Color @Composable get() = TextSecondaryLight

    @Composable
    fun returnColor(value: Double): Color {
        return when {
            value > 0 -> Success
            value < 0 -> Error
            else -> MaterialTheme.colorScheme.onSurfaceVariant
        }
    }
}
