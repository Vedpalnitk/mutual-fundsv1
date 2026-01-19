# Sparrow Invest - Android Design Guidelines

A comprehensive design system for the Sparrow Invest Android application built with Jetpack Compose and Material 3.

---

## Table of Contents

1. [Typography](#typography)
2. [Color System](#color-system)
3. [Spacing](#spacing)
4. [Corner Radius](#corner-radius)
5. [Icon Sizes](#icon-sizes)
6. [Components](#components)
7. [Gradients](#gradients)
8. [Elevation & Shadows](#elevation--shadows)
9. [Dark Mode](#dark-mode)

---

## Typography

### Font Family: Manrope

Manrope is a modern, geometric sans-serif typeface with excellent readability. It provides a clean, professional look suitable for financial applications.

**Font Weights Available:**
| Weight | Value | Usage |
|--------|-------|-------|
| Light | 300 | Display text, large promotional content |
| Regular | 400 | Body text, descriptions |
| Medium | 500 | Subtitles, emphasized body text |
| SemiBold | 600 | Headlines, titles, buttons |
| Bold | 700 | Large numeric displays |
| ExtraBold | 800 | Hero text, special emphasis |

### Type Scale

#### Display Styles
For large promotional text and hero sections.

```kotlin
displayLarge    // 32sp, Light, -0.25 letter spacing
displayMedium   // 28sp, Light
displaySmall    // 24sp, Light
```

#### Headline Styles
For section headers and important titles.

```kotlin
headlineLarge   // 24sp, SemiBold - Main screen titles
headlineMedium  // 20sp, SemiBold - Section headers
headlineSmall   // 18sp, Medium   - Subsection headers
```

#### Title Styles
For card titles and list headers.

```kotlin
titleLarge      // 18sp, SemiBold - Card titles
titleMedium     // 16sp, Medium   - List item titles
titleSmall      // 14sp, Medium   - Secondary titles
```

#### Body Styles
For main content and descriptions.

```kotlin
bodyLarge       // 16sp, Regular - Primary body text
bodyMedium      // 14sp, Regular - Secondary body text
bodySmall       // 12sp, Regular - Tertiary text, captions
```

#### Label Styles
For buttons, tabs, and captions.

```kotlin
labelLarge      // 14sp, Medium - Buttons, tabs
labelMedium     // 12sp, Medium - Badges, chips
labelSmall      // 10sp, Medium - Timestamps, metadata
```

### Custom Text Styles

```kotlin
AppTextStyles.numeric       // 20sp, SemiBold - Portfolio values
AppTextStyles.numericLarge  // 28sp, Bold     - Hero amounts
AppTextStyles.numericSmall  // 16sp, Medium   - Small amounts
AppTextStyles.buttonText    // 16sp, SemiBold - Button labels
AppTextStyles.caption       // 12sp, Regular  - Timestamps
AppTextStyles.accent        // 14sp, SemiBold - Highlights
AppTextStyles.overline      // 10sp, SemiBold, 1.5sp tracking - Category labels
```

### Usage Examples

```kotlin
// Screen title
Text(
    text = "Portfolio",
    style = MaterialTheme.typography.headlineLarge
)

// Card title
Text(
    text = "Total Investment",
    style = MaterialTheme.typography.titleMedium
)

// Amount display
Text(
    text = "₹12,45,000",
    style = AppTextStyles.numericLarge
)

// Body content
Text(
    text = "Your portfolio has grown 12.5% this month",
    style = MaterialTheme.typography.bodyMedium
)
```

---

## Color System

### Brand Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Primary | `#2563EB` | Main actions, active states, links |
| Primary Light | `#60A5FA` | Primary in dark mode, highlights |
| Primary Dark | `#1D4ED8` | Pressed states |
| Secondary | `#06B6D4` | Accent elements, secondary actions |
| Accent | `#14B8A6` | Tertiary highlights |

```kotlin
val Primary = Color(0xFF2563EB)
val PrimaryLight = Color(0xFF60A5FA)
val PrimaryDark = Color(0xFF1D4ED8)
val Secondary = Color(0xFF06B6D4)
val Accent = Color(0xFF14B8A6)
```

### Semantic Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Success | `#10B981` | Positive returns, confirmations |
| Success Light | `#34D399` | Success backgrounds |
| Warning | `#F59E0B` | Caution states, pending |
| Warning Light | `#FBBF24` | Warning backgrounds |
| Error | `#EF4444` | Negative returns, errors |
| Error Light | `#F87171` | Error backgrounds |
| Info | `#8B5CF6` | Informational, ELSS funds |

```kotlin
val Success = Color(0xFF10B981)
val Warning = Color(0xFFF59E0B)
val Error = Color(0xFFEF4444)
val Info = Color(0xFF8B5CF6)
```

### Text Colors

#### Light Mode
| Color | Hex | Usage |
|-------|-----|-------|
| Primary | `#1F2937` | Main text |
| Secondary | `#6B7280` | Subtitles, descriptions |
| Tertiary | `#9CA3AF` | Placeholders, disabled |

#### Dark Mode
| Color | Hex | Usage |
|-------|-----|-------|
| Primary | `#F9FAFB` | Main text |
| Secondary | `#D1D5DB` | Subtitles, descriptions |
| Tertiary | `#9CA3AF` | Placeholders, disabled |

### Background Colors

#### Light Mode
```kotlin
val BackgroundLight = Color(0xFFFFFFFF)      // Main background
val SurfaceLight = Color(0xFFF9FAFB)          // Elevated surfaces
val CardBackgroundLight = Color(0xFFFFFFFF)   // Cards
```

#### Dark Mode
```kotlin
val BackgroundDark = Color(0xFF0F172A)        // Main background
val SurfaceDark = Color(0xFF1E293B)           // Elevated surfaces
val CardBackgroundDark = Color(0xFF1E293B)    // Cards
```

### Fund Category Colors

| Category | Color | Hex |
|----------|-------|-----|
| Equity | Blue | `#2563EB` |
| Debt | Green | `#10B981` |
| Hybrid | Amber | `#F59E0B` |
| ELSS | Purple | `#8B5CF6` |
| Index | Teal | `#14B8A6` |
| Gold | Gold | `#EAB308` |

### Usage with Return Values

```kotlin
@Composable
fun returnColor(value: Double): Color {
    return when {
        value > 0 -> Success   // Green for positive
        value < 0 -> Error     // Red for negative
        else -> TextSecondary  // Gray for zero
    }
}
```

---

## Spacing

A consistent 4dp base unit spacing system.

| Token | Value | Usage |
|-------|-------|-------|
| `micro` | 4dp | Icon gaps, tight spacing |
| `small` | 8dp | Related elements, list items |
| `compact` | 12dp | Card padding, button padding |
| `medium` | 16dp | Standard padding, section gaps |
| `large` | 20dp | Major section separation |
| `xLarge` | 24dp | Screen padding |
| `xxLarge` | 32dp | Hero sections |
| `xxxLarge` | 48dp | Large separations |

```kotlin
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
```

### Usage Examples

```kotlin
// Screen padding
Column(
    modifier = Modifier.padding(Spacing.medium)
)

// Space between elements
Spacer(modifier = Modifier.height(Spacing.small))

// Card content padding
GlassCard(contentPadding = Spacing.medium) { }
```

---

## Corner Radius

| Token | Value | Usage |
|-------|-------|-------|
| `small` | 8dp | Badges, icons, buttons |
| `medium` | 12dp | List items, chips |
| `large` | 16dp | Action cards, dialogs |
| `xLarge` | 20dp | Section cards |
| `xxLarge` | 24dp | Hero cards |
| `hero` | 32dp | Maximum radius |

```kotlin
object CornerRadius {
    val small = 8.dp
    val medium = 12.dp
    val large = 16.dp
    val xLarge = 20.dp
    val xxLarge = 24.dp
    val hero = 32.dp
}
```

### Material 3 Shapes

```kotlin
val Shapes = Shapes(
    extraSmall = RoundedCornerShape(4.dp),   // Rarely used
    small = RoundedCornerShape(8.dp),         // Chips, badges
    medium = RoundedCornerShape(12.dp),       // Buttons, text fields
    large = RoundedCornerShape(16.dp),        // Cards
    extraLarge = RoundedCornerShape(24.dp)    // Bottom sheets
)
```

---

## Icon Sizes

| Token | Value | Usage |
|-------|-------|-------|
| `small` | 16dp | Inline icons, badges |
| `medium` | 20dp | List item icons |
| `large` | 24dp | Standard icons, nav |
| `xLarge` | 32dp | Action icons |
| `xxLarge` | 48dp | Empty states |
| `hero` | 60dp | Onboarding, features |

```kotlin
object IconSize {
    val small = 16.dp
    val medium = 20.dp
    val large = 24.dp
    val xLarge = 32.dp
    val xxLarge = 48.dp
    val hero = 60.dp
}
```

---

## Components

### Buttons

#### PrimaryButton
Full-width gradient button for main actions.

```kotlin
PrimaryButton(
    text = "Sign In",
    onClick = { },
    enabled = true,
    isLoading = false,
    fullWidth = true  // Default
)
```

**Specs:**
- Height: 52dp
- Corner Radius: 12dp (medium)
- Background: Linear gradient (Primary → Secondary)
- Text: 16sp, SemiBold, White

#### SecondaryButton
Outlined button for secondary actions.

```kotlin
SecondaryButton(
    text = "Cancel",
    onClick = { }
)
```

**Specs:**
- Height: 52dp
- Border: 1dp, Primary color
- Text: 16sp, SemiBold, Primary color

#### LinkButton
Text-only button for tertiary actions.

```kotlin
LinkButton(
    text = "Forgot Password?",
    onClick = { }
)
```

#### QuickActionButton
Compact button with icon for quick actions.

```kotlin
QuickActionButton(
    text = "Invest",
    icon = { Icon(Icons.Default.Add, null) },
    onClick = { }
)
```

### Cards

#### GlassCard
Primary card component with glassmorphism effect.

```kotlin
GlassCard(
    cornerRadius = CornerRadius.xLarge,  // 20dp default
    contentPadding = Spacing.medium      // 16dp default
) {
    // Content
}
```

**Light Mode:**
- Background: White
- Border: Gradient (8% → 2% → 6% black)
- Shadow: 12dp elevation

**Dark Mode:**
- Background: `#1E293B`
- Border: Gradient (40% → 5% → 10% white)
- No shadow

#### ListItemCard
Compact card for list items.

```kotlin
ListItemCard(
    cornerRadius = CornerRadius.medium,  // 12dp
    contentPadding = Spacing.compact     // 12dp
) {
    // Content
}
```

**Light Mode:**
- Background: `surfaceVariant`

**Dark Mode:**
- Background: 6% white
- Border: 1dp, 8% white

#### IconContainer
Container for icons with tinted background.

```kotlin
IconContainer(
    size = 36.dp,
    backgroundColor = Primary.copy(alpha = 0.1f)
) {
    Icon(...)
}
```

### Text Fields

#### GlassTextField
Primary text input with glassmorphism styling.

```kotlin
GlassTextField(
    value = text,
    onValueChange = { text = it },
    placeholder = "Email",
    prefix = { Icon(Icons.Default.Email, null) },
    suffix = { IconButton(...) },
    keyboardType = KeyboardType.Email,
    imeAction = ImeAction.Next,
    isError = false,
    errorMessage = null
)
```

**Specs:**
- Height: 56dp
- Corner Radius: 12dp
- Border: 1dp gradient
- Error State: Red border, error message below

### Status Components

#### StatusBadge
Colored badge for status indicators.

```kotlin
StatusBadge(
    text = "Active",
    color = Success
)
```

#### ReturnBadge
Badge showing return percentage with color coding.

```kotlin
ReturnBadge(value = 12.5)  // Green, "+12.50%"
ReturnBadge(value = -3.2)  // Red, "-3.20%"
```

### Navigation

#### TopBar
Screen header with optional back button.

```kotlin
TopBar(
    title = "Portfolio",
    showBackButton = true,
    onBackClick = { },
    actions = { /* Action icons */ }
)
```

#### BottomNavBar
5-tab bottom navigation.

Tabs: Home, Investments, Explore, Insights, Profile

**Specs:**
- Icons: 24dp
- Selected: Primary color
- Unselected: `onSurfaceVariant`

### Feedback Components

#### EmptyState
Full empty state with icon, title, message.

```kotlin
EmptyState(
    icon = Icons.Default.Search,
    title = "No Results",
    message = "Try adjusting your search terms",
    action = { PrimaryButton("Search Again", onClick = {}) }
)
```

#### ErrorState
Error display with optional retry.

```kotlin
ErrorState(
    message = "Something went wrong",
    onRetry = { }
)
```

#### LoadingIndicator
Centered loading spinner.

```kotlin
LoadingIndicator()
```

---

## Gradients

### Primary Gradient
Main brand gradient for buttons, headers.

```kotlin
Brush.linearGradient(
    colors = listOf(Primary, Secondary)
    // #2563EB → #06B6D4
)
```

### Success Gradient
For positive states, achievements.

```kotlin
Brush.linearGradient(
    colors = listOf(Success, SuccessLight)
    // #10B981 → #34D399
)
```

### Warm Gradient
For warnings, attention states.

```kotlin
Brush.linearGradient(
    colors = listOf(Warning, WarningLight)
    // #F59E0B → #FBBF24
)
```

### Glass Border Gradient
For card borders.

**Light Mode:**
```kotlin
listOf(
    Color(0x14000000),  // 8% black
    Color(0x05000000),  // 2% black
    Color(0x0F000000)   // 6% black
)
```

**Dark Mode:**
```kotlin
listOf(
    Color(0x66FFFFFF),  // 40% white
    Color(0x0DFFFFFF),  // 5% white
    Color(0x1AFFFFFF)   // 10% white
)
```

---

## Elevation & Shadows

### Shadow Color
```kotlin
val ShadowColor = Color(0x14000000)  // 8% black
```

### Card Elevation
- Light Mode: 12dp shadow
- Dark Mode: No shadow (borders provide depth)

```kotlin
Modifier.shadow(
    elevation = 12.dp,
    shape = RoundedCornerShape(20.dp),
    spotColor = ShadowColor,
    ambientColor = ShadowColor
)
```

---

## Dark Mode

The app supports system dark mode with optimized colors.

### Key Differences

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Background | White `#FFFFFF` | Slate `#0F172A` |
| Surface | Gray `#F9FAFB` | Slate `#1E293B` |
| Primary | Blue `#2563EB` | Light Blue `#60A5FA` |
| Cards | White + Shadow | Dark + Border |
| Text Primary | Dark `#1F2937` | Light `#F9FAFB` |

### Adaptive Colors

```kotlin
@Composable
fun adaptiveColor(): Color {
    return if (isSystemInDarkTheme()) {
        DarkModeColor
    } else {
        LightModeColor
    }
}
```

---

## File Reference

| Purpose | File Path |
|---------|-----------|
| Colors | `ui/theme/Color.kt` |
| Typography | `ui/theme/Type.kt` |
| Shapes & Spacing | `ui/theme/Shape.kt` |
| Theme Setup | `ui/theme/Theme.kt` |
| Buttons | `ui/components/PrimaryButton.kt` |
| Cards | `ui/components/GlassCard.kt` |
| Text Fields | `ui/components/GlassTextField.kt` |
| Common Components | `ui/components/CommonComponents.kt` |
| Fonts | `res/font/manrope_*.ttf` |

---

## Best Practices

1. **Always use theme tokens** - Never hardcode colors or sizes
2. **Respect spacing scale** - Use `Spacing.*` values consistently
3. **Use semantic colors** - Success for positive, Error for negative
4. **Test both modes** - Verify appearance in light and dark themes
5. **Maintain hierarchy** - Use typography scale appropriately
6. **Keep accessibility** - Ensure sufficient contrast ratios

---

*Last updated: January 2026*
*Sparrow Invest Android v1.0*
