package com.sparrowinvest.app.ui.theme

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Shapes
import androidx.compose.ui.unit.dp

val Shapes = Shapes(
    extraSmall = RoundedCornerShape(4.dp),
    small = RoundedCornerShape(8.dp),
    medium = RoundedCornerShape(12.dp),
    large = RoundedCornerShape(16.dp),
    extraLarge = RoundedCornerShape(24.dp)
)

// Custom corner radii matching iOS design
object CornerRadius {
    val small = 8.dp        // Icon containers, badges
    val medium = 12.dp      // List items
    val large = 16.dp       // Action cards
    val xLarge = 20.dp      // Section cards, hero
    val xxLarge = 24.dp     // Large hero cards
    val hero = 32.dp        // Maximum
}

// Custom spacing values matching iOS design
object Spacing {
    val micro = 4.dp
    val small = 8.dp
    val compact = 12.dp
    val medium = 16.dp
    val large = 20.dp
    val xLarge = 24.dp
    val xxLarge = 32.dp
    val xxxLarge = 48.dp
}

// Icon sizes
object IconSize {
    val small = 16.dp
    val medium = 20.dp
    val large = 24.dp
    val xLarge = 32.dp
    val xxLarge = 48.dp
    val hero = 60.dp
}
