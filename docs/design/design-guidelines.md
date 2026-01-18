# Sparrow Invest UI Guidelines
Reusable visual system to apply across Sparrow projects while preserving the Sparrow Invest look.

## Brand
- **Name:** Sparrow Invest (use consistently; refer to funds, portfolios, and investor profiles).
- **Primary:** `#006BFF` (Sparrow Blue).
- **Gradient:** `#3A7BFF → #0044FF` (accent for CTAs, key highlights).
- **Success:** `#16C47F`; **Error:** `#FF4F4F`.
- **Neutral grays:** `#F4F6F9` (bg), `#E3E6EB` (borders), `#1A1F36` (ink).
- **Card shadow:** `0 4px 14px rgba(0,0,0,0.04)`.
- **Corners:** 16px radius on cards/buttons; 24px on logo badge.

## Typography
- **Body font:** Inter (400/500/600).
- **Brand wordmark / standout labels:** Space Grotesk (500/600/700) via `.brand-font` class; slight tight letter spacing.
- **Sizes:** 28–32 (page titles), 20 (section titles), 16 (body), 14 (meta), 12 (labels).
- Keep headings semibold; avoid ultra-bold. Use color `#1A1F36` at 80–100% opacity for hierarchy.

## Layout & Spacing
- **Grid:** Max width 1200px (Tailwind `max-w-7xl`), 24px horizontal padding.
- **Gutters:** 24px on desktop, 16px on mobile.
- **Vertical rhythm:** 24–32px between sections; 12–16px inside cards.
- **Cards:** White or subtle gradient, 1px `#E3E6EB` border, shadow as above.
- **Background:** Light gray `#F4F6F9`; avoid flat white pages.

## Components
- **Navbar:** Sticky, glassy white with thin border; brand logo + wordmark; nav links; primary CTA on the right.
- **Buttons:**
  - Primary: gradient background, white text, 16px radius, `font-semibold`, small shadow.
  - Secondary: white bg with border `#E3E6EB`; hover shadow-sm.
  - Icon badges: rounded pill, subtle gray bg.
- **Badges/Chips:** Pills with 12–14px text; gray for meta, success/error for state; use translucency (`/15`) for fills.
- **Tables:** Minimal lines, left-aligned labels, 14px text. Use weight/color to separate headers vs rows. Keep rows airy (12–14px vertical padding).
- **Cards with charts:** Use soft gradients; embed simple SVG polylines with gradient fills; keep controls (range tabs) on the top right.
- **Glass panels:** `rgba(255,255,255,0.8)` + blur + light border for promotional callouts.

## Interaction Patterns
- **Tabs/Filters:** Rounded chips; active state uses primary fill, inactive uses border-only.
- **Hover:** Elevate cards subtly (shadow increase); underlines/blue text on links.
- **Focus:** Use a 2px `#006BFF` ring for inputs/buttons.
- **Sliders:** Use primary accent for thumb/track; pair with numeric labels on the right.

## Page Templates
- **Dashboard:** Grid with 2:1 split (content : sidebar). Top hero card with chart + CTA; account summary metrics; movers list; watchlist; holdings table.
- **Fund Universe:** Banners at top, horizontal scroll for core picks, grids for growth/stability funds, categories grid. Fund cards show name, category, returns, expense ratio, and risk.
- **Fund Detail:** Gradient header with name, category, returns badges, risk; sidebar with facts + Start SIP; performance chart with range tabs; top holdings table; about + manager sections.
- **Investor Profile:** Detailed profile form for goals, liquidity, and risk attitude; persona preview; AI completeness meter; rule explanations.

## Icon/Logo Usage
- Use the gradient “wing” mark (svg in `src/components/layout/BrandLogo.tsx`) at 44–48px size. Pair with Space Grotesk wordmark; do not recolor the mark outside brand palette.

## Responsive Rules
- Collapse nav links into vertical stack on <768px (or use menu if added).
- Convert multi-column grids to single-column on mobile; keep cards full-width with 16px side padding.
- Horizontal scroll strips should have `min-width` cards and 12–16px gap.

## Tone & Copy
- Clear, instructive microcopy; avoid jargon. Use “nests,” “clusters,” “manager,” “invest,” “rebalance.”
- CTA verbs: “Start SIP,” “Review plan,” “Run diagnostics,” “View all.”

## Accessibility
- Aim for 4.5:1 contrast on text; avoid gradient-on-gradient text.
- Provide focus states on all interactive elements; label sliders and ranges.
- Use semantic headings and list/table structures.

## Do & Don't
- Do: Light, clean cards; structured spacing; gradient CTAs; pill badges; thin borders.
- Don't: Heavy drop shadows, dark themes, neon palettes, dense tables without breathing room, sharp corners.

---

## iOS Native App (SwiftUI) - Tile Design System

### Overview

The iOS app uses a consistent tile system across all screens. All tiles adapt to light and dark modes with distinct visual treatments.

---

### 1. Primary Glass Tile (Section Container)

Use for: Main section containers, hero cards, dashboard widgets.

| Property | Light Mode | Dark Mode |
|----------|------------|-----------|
| Background | `.regularMaterial` | `.ultraThinMaterial` |
| Border | None | `white.opacity(0.1)` gradient |
| Shadow | None (material provides depth) | None |
| Corner Radius | `24pt` (xxLarge) | `24pt` |
| Padding | `20pt` (large) | `20pt` |

```swift
// Light & Dark Mode (adapts automatically)
.background(.regularMaterial, in: RoundedRectangle(cornerRadius: 24, style: .continuous))

// Dark mode with glass border (optional)
.overlay(
    RoundedRectangle(cornerRadius: 24, style: .continuous)
        .stroke(Color.white.opacity(0.1), lineWidth: 0.5)
)
```

---

### 2. Quick Access Tile (Action Cards)

Use for: Points, Find Advisor, quick action buttons on Explore tab.

| Property | Light Mode | Dark Mode |
|----------|------------|-----------|
| Background | `Color.white` (pure) | `.ultraThinMaterial` + `white.opacity(0.05)` overlay |
| Border | `blue.opacity(0.15)` solid | Gradient `white.opacity(0.3)` → `white.opacity(0.1)` |
| Shadow | `black.opacity(0.15)`, radius 12, y: 4 | None |
| Corner Radius | `16pt` (large) | `16pt` |
| Padding | `16pt` (medium) | `16pt` |

```swift
// Light Mode
.background(Color(uiColor: .white))
.overlay(
    RoundedRectangle(cornerRadius: 16, style: .continuous)
        .stroke(Color.blue.opacity(0.15), lineWidth: 1)
)
.shadow(color: Color.black.opacity(0.15), radius: 12, x: 0, y: 4)

// Dark Mode
.background(
    RoundedRectangle(cornerRadius: 16, style: .continuous)
        .fill(.ultraThinMaterial)
        .overlay(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(Color.white.opacity(0.05))
        )
)
.overlay(
    RoundedRectangle(cornerRadius: 16, style: .continuous)
        .stroke(
            LinearGradient(
                colors: [Color.white.opacity(0.3), Color.white.opacity(0.1)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            ),
            lineWidth: 1
        )
)
```

---

### 3. List Item Tile (Nested Cards)

Use for: Items within lists, goal rows, transaction rows, fund items.

| Property | Light Mode | Dark Mode |
|----------|------------|-----------|
| Background | `tertiarySystemFill` | `white.opacity(0.06)` |
| Border | None | `white.opacity(0.08)` |
| Shadow | None | None |
| Corner Radius | `12pt` (medium) | `12pt` |
| Padding | `12pt` (compact) | `12pt` |

```swift
// Light Mode
.background(
    Color(uiColor: .tertiarySystemFill),
    in: RoundedRectangle(cornerRadius: 12, style: .continuous)
)

// Dark Mode
.background(
    Color.white.opacity(0.06),
    in: RoundedRectangle(cornerRadius: 12, style: .continuous)
)
.overlay(
    RoundedRectangle(cornerRadius: 12, style: .continuous)
        .stroke(Color.white.opacity(0.08), lineWidth: 0.5)
)
```

---

### 4. Category Tile (Grid Items)

Use for: Category cards (Equity, Debt, Hybrid), filter chips.

| Property | Light Mode | Dark Mode |
|----------|------------|-----------|
| Background | `categoryColor.opacity(0.1)` | `categoryColor.opacity(0.15)` |
| Border | None | `categoryColor.opacity(0.2)` |
| Shadow | None | None |
| Corner Radius | `12pt` (medium) | `12pt` |
| Padding | `16pt` vertical | `16pt` |

```swift
// Both modes (color-tinted)
.background(
    categoryColor.opacity(colorScheme == .dark ? 0.15 : 0.1),
    in: RoundedRectangle(cornerRadius: 12, style: .continuous)
)

// Dark mode border (optional)
.overlay(
    RoundedRectangle(cornerRadius: 12, style: .continuous)
        .stroke(categoryColor.opacity(0.2), lineWidth: 0.5)
)
```

---

### 5. Stat Badge Tile (Metrics)

Use for: Returns badge, percentage indicators, status pills.

| Property | Light Mode | Dark Mode |
|----------|------------|-----------|
| Background | `statusColor.opacity(0.12)` | `statusColor.opacity(0.15)` |
| Border | None | None |
| Shape | Capsule | Capsule |
| Padding | `14pt` horizontal, `8pt` vertical | Same |

```swift
.background(
    (isPositive ? Color.green : Color.red).opacity(0.12),
    in: Capsule()
)
```

---

### 6. Icon Container

Use for: Icons within tiles, avatar placeholders.

| Property | Value |
|----------|-------|
| Background | `iconColor.opacity(0.15)` |
| Corner Radius | `8pt` (small) |
| Size | `32x32pt` (small), `36x36pt` (medium), `48x48pt` (large) |

```swift
ZStack {
    RoundedRectangle(cornerRadius: 8, style: .continuous)
        .fill(iconColor.opacity(0.15))
        .frame(width: 32, height: 32)

    Image(systemName: icon)
        .font(.system(size: 14, weight: .semibold))
        .foregroundStyle(iconColor)
}
```

---

### 7. Segmented Control / Toggle

Use for: View mode toggle (Individual/Family), tab selection.

| Property | Light Mode | Dark Mode |
|----------|------------|-----------|
| Track Background | `tertiarySystemFill` | `white.opacity(0.08)` |
| Active Segment | `Color.blue` | `Color.blue` |
| Shape | Capsule | Capsule |

```swift
HStack(spacing: 4) {
    ForEach(options) { option in
        Text(option.title)
            .foregroundColor(isSelected ? .white : .secondary)
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
            .background {
                if isSelected {
                    Capsule().fill(Color.blue)
                }
            }
    }
}
.padding(4)
.background(Color(uiColor: .tertiarySystemFill), in: Capsule())
```

---

### Corner Radius Reference

| Name | Value | Use Case |
|------|-------|----------|
| `small` | 8pt | Icon containers, small badges |
| `medium` | 12pt | List items, nested cards |
| `large` | 16pt | Quick access tiles, action cards |
| `xLarge` | 20pt | Section cards |
| `xxLarge` | 24pt | Hero cards, primary containers |

---

### Spacing Reference

| Name | Value | Use Case |
|------|-------|----------|
| `small` | 8pt | Tight spacing, icon gaps |
| `compact` | 12pt | List item padding, row spacing |
| `medium` | 16pt | Card padding, section gaps |
| `large` | 20pt | Hero card padding |
| `xLarge` | 24pt | Major section separation |

---

### Complete Example: Quick Access Card

```swift
struct QuickAccessCard: View {
    let icon: String
    let iconColor: Color
    let title: String
    let value: String
    let subtitle: String

    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Header
            HStack(spacing: 8) {
                // Icon container
                ZStack {
                    RoundedRectangle(cornerRadius: 8, style: .continuous)
                        .fill(iconColor.opacity(0.15))
                        .frame(width: 32, height: 32)
                    Image(systemName: icon)
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(iconColor)
                }
                Text(title)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(.secondary)
            }

            // Value
            Text(value)
                .font(.system(size: 18, weight: .semibold))

            // Subtitle
            Text(subtitle)
                .font(.system(size: 12))
                .foregroundStyle(iconColor)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .background(tileBackground)
        .overlay(tileBorder)
        .shadow(color: tileShadow, radius: 12, x: 0, y: 4)
    }

    @ViewBuilder
    private var tileBackground: some View {
        if colorScheme == .dark {
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(.ultraThinMaterial)
                .overlay(
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .fill(Color.white.opacity(0.05))
                )
        } else {
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(Color(uiColor: .white))
        }
    }

    private var tileBorder: some View {
        RoundedRectangle(cornerRadius: 16, style: .continuous)
            .stroke(
                colorScheme == .dark
                    ? LinearGradient(
                        colors: [.white.opacity(0.3), .white.opacity(0.1)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                      )
                    : LinearGradient(
                        colors: [.blue.opacity(0.15), .blue.opacity(0.15)],
                        startPoint: .top,
                        endPoint: .bottom
                      ),
                lineWidth: 1
            )
    }

    private var tileShadow: Color {
        colorScheme == .dark ? .clear : .black.opacity(0.15)
    }
}
```
