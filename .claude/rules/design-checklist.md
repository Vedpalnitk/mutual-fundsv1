# Design V4 Validation Checklist

Use this checklist after implementing or updating any page to ensure consistency with the Sparrow Invest design system.

---

## Font

**Primary Font: Manrope** — A modern, versatile, semi-rounded sans-serif.

### Import
```css
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap');
```

### CSS Variable
```css
--font-main: 'Manrope', system-ui, -apple-system, sans-serif;
```

### Font Weights
| Weight | Value | Use Case |
|--------|-------|----------|
| Regular | `400` | Body text, descriptions |
| Medium | `500` | Labels, subtitles |
| Semibold | `600` | Headings, buttons, emphasis |
| Bold | `700` | Stats, values, key metrics |

### Key Rules
- [ ] All UI text uses Manrope font family
- [ ] Never use font weights below 400 or above 700
- [ ] Use `font-semibold` (600) for interactive elements
- [ ] Use `font-bold` (700) for numerical values and stats

---

## Border Radius

| Element | Radius | Notes |
|---------|--------|-------|
| Buttons | `rounded-full` | Pill shape for all buttons |
| Inputs/Selects | `rounded-xl` | All form controls |
| Glass Cards | `rounded-xl` | Main section containers |
| Blue Tinted Cards | `rounded-2xl` | Interactive list items with hover |
| Liquid Blue Glass | `rounded-3xl` | Premium KPI tiles |
| Chips/Tags | `rounded` | Small inline elements |
| Icon Containers | `rounded-xl` | Icon wrapper divs |
| Avatars | `rounded-xl` | Not `rounded-full` unless circular by design |

---

## Form Elements

- [ ] **Labels**: Blue (`colors.primary`), uppercase, `text-xs font-semibold mb-1.5 uppercase tracking-wide`
- [ ] **Input Height**: Consistent `h-10` for ALL inputs and selects (no `py-*` padding)
- [ ] **Input Padding**: `px-4` horizontal padding only
- [ ] **Input Background**: `colors.inputBg`
- [ ] **Input Border**: `1px solid ${colors.inputBorder}`
- [ ] **Input Text**: `text-sm` with `colors.textPrimary`
- [ ] **Focus States**: `focus:outline-none`

### Common Mistakes to Avoid
- ❌ Using `py-2.5` instead of `h-10` (causes inconsistent heights between inputs and selects)
- ❌ Using gray color for labels instead of blue
- ❌ Using lowercase labels instead of uppercase
- ❌ Using `rounded-lg` instead of `rounded-xl`

---

## List Items (in forms/inputs)

- [ ] **Container Padding**: `p-3`
- [ ] **Container Border Radius**: `rounded-xl`
- [ ] **Item Title**: `text-sm font-medium` with `colors.textPrimary`
- [ ] **Item Value**: `text-sm font-bold` with `colors.primary`
- [ ] **Item Subtitle**: `text-xs` with `colors.textSecondary`, `mt-1` margin
- [ ] **Background**: `colors.chipBg`
- [ ] **Border**: `1px solid ${colors.chipBorder}`

---

## Buttons

- [ ] **Shape**: `rounded-full` (pill) - NEVER `rounded-lg` or `rounded-xl`
- [ ] **Height**: `py-2.5` for consistent height
- [ ] **Font**: `text-sm font-semibold text-white`
- [ ] **Background**: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`
- [ ] **Shadow**: `boxShadow: 0 4px 14px ${colors.glassShadow}`
- [ ] **Hover**: `hover:shadow-lg`
- [ ] **Transition**: `transition-all`

---

## Typography

### Font Scale (V4 - 15px Base)

| Class | Size | Use Case |
|-------|------|----------|
| `text-xs` | 11px | Small captions, meta info |
| `text-sm` | 13px | Secondary content, subtitles |
| `text-base` | **15px** | Primary body text (default) |
| `text-lg` | 17px | Large body, card titles |
| `text-xl` | 19px | Section headers (H3) |
| `text-2xl` | 21px | Page subtitles (H2) |
| `text-3xl` | 26px | Page titles (H1) |

### Hierarchy (Large to Small)

| Element | Classes | Color |
|---------|---------|-------|
| Page Title | `text-2xl font-bold` | `colors.textPrimary` |
| Result Title | `text-base font-semibold` | `colors.textPrimary` |
| Card Title | `text-base font-semibold` | `colors.textPrimary` |
| Large Stats | `text-lg font-bold` | `colors.primary` |
| Medium Stats | `text-base font-bold` | `colors.primary` |
| Body Text | `text-base` | `colors.textSecondary` |
| Secondary Text | `text-sm` | `colors.textSecondary` |
| Labels/Headers | `text-xs font-semibold uppercase tracking-wide` | `colors.primary` (blue) |
| Subtitles/Meta | `text-xs` | `colors.textTertiary` |

### Key Rules
- [ ] Section labels are ALWAYS blue (`colors.primary`), uppercase, with tracking
- [ ] Primary body text uses `text-base` (15px)
- [ ] Secondary/supporting text uses `text-sm` (13px)
- [ ] Stats/values use bold weight
- [ ] Avatar letters use `text-lg font-bold` white

---

## Output/Results Section

- [ ] **Avatar Size**: `w-11 h-11` (not `w-9 h-9`)
- [ ] **Avatar Text**: `text-lg font-bold` white
- [ ] **Result Title**: `text-base font-semibold`
- [ ] **Result Description**: `text-sm`
- [ ] **Section Labels**: `text-xs font-semibold uppercase tracking-wide` with `colors.primary`
- [ ] **Stat Values**: `text-lg font-bold` for percentages/scores
- [ ] **List Items**: `text-sm` with `space-y-2` spacing
- [ ] **Meta Footer**: `text-xs` with `colors.textTertiary`

---

## Colors (V4 Refined Blue)

### Light Mode
```
primary: '#2563EB'
primaryDark: '#1D4ED8'
success: '#10B981'
warning: '#F59E0B'
error: '#EF4444'
```

### Dark Mode
```
primary: '#60A5FA'
primaryDark: '#3B82F6'
success: '#34D399'
warning: '#FBBF24'
error: '#F87171'
```

### Requirements
- [ ] Use `V4_COLORS_LIGHT` and `V4_COLORS_DARK` constants
- [ ] Implement `useDarkMode()` and `useV4Colors()` hooks
- [ ] Never hardcode color values in JSX

---

## Icons

- [ ] **NO EMOJIS** - Use SVG vector icons only
- [ ] **Size**: `w-5 h-5` (standard) or `w-4 h-4` (small)
- [ ] **Stroke**: `strokeWidth={1.5}` or `strokeWidth={2}`
- [ ] **Style**: `fill="none"` with `stroke="currentColor"`
- [ ] **Color**: Inherit via `currentColor` or use `colors.primary`

### Icon in Container
```tsx
<div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: colors.chipBg }}>
  <svg className="w-5 h-5" style={{ color: colors.primary }} ...>
</div>
```

---

## Spacing

| Context | Value |
|---------|-------|
| Card Padding | `p-4` or `p-5` |
| List Item Padding | `p-3` |
| Section Gaps | `gap-3` or `space-y-3` |
| Label to Input | `mb-1.5` |
| Grid Gaps | `gap-3` |
| List Item Gaps | `space-y-2` |

---

## Card Types (V4 Design System)

The V4 design system uses **3 distinct card styles** based on purpose and hierarchy:

| Card Type | Purpose | Border Radius | Key Feature |
|-----------|---------|---------------|-------------|
| **Glass Card** | Main containers, sections | `rounded-xl` | Frosted glass with shadow |
| **Blue Tinted Card** | Interactive list items | `rounded-2xl` | Hover lift effect |
| **Liquid Blue Glass** | Premium KPIs, hero metrics | `rounded-3xl` | Maximum blur, blue-sky gradient |

---

### 1. Glass Card (Main Containers)

Use for: Section containers, modal bodies, form containers, sidebar cards.

**Characteristics:**
- [ ] Frosted glass appearance
- [ ] Border radius: `rounded-xl`
- [ ] Padding: `p-5`
- [ ] Static (no hover effects)

**Styling:**
```tsx
<div
  className="p-5 rounded-xl"
  style={{
    background: colors.cardBackground,
    border: `1px solid ${colors.cardBorder}`,
    boxShadow: `0 4px 24px ${colors.glassShadow}`
  }}
>
```

---

### 2. Blue Tinted Card (Interactive List Items)

Use for: Model cards, activity items, sidebar list items, clickable cards.

**Characteristics:**
- [ ] Subtle blue gradient tint
- [ ] Border radius: `rounded-2xl`
- [ ] Padding: `p-3`
- [ ] **Hover lift effect** (required for interactivity)

**Styling:**
```tsx
<div
  className="p-3 rounded-2xl transition-all duration-200 hover:-translate-y-0.5"
  style={{
    background: isDark
      ? 'linear-gradient(135deg, rgba(96, 165, 250, 0.08) 0%, rgba(147, 197, 253, 0.04) 100%)'
      : 'linear-gradient(135deg, rgba(37, 99, 235, 0.04) 0%, rgba(59, 130, 246, 0.02) 100%)',
    border: `1px solid ${colors.cardBorder}`,
    boxShadow: `0 4px 20px ${colors.glassShadow}`
  }}
>
```

**Key Rules:**
- ❌ Do NOT add gradient overlays (specular highlights) to Blue Tinted Cards
- ❌ Do NOT use `backdropFilter: blur()` on Blue Tinted Cards
- ✅ Always include `hover:-translate-y-0.5` for interactive feedback

---

### 3. Liquid Blue Glass (Premium KPIs)

Use for: Dashboard KPI tiles, hero metrics, prominent stat displays.

**Characteristics:**
- [ ] Maximum blur effect (24px)
- [ ] Blue-to-sky gradient background
- [ ] Border radius: `rounded-3xl`
- [ ] Padding: `p-4`
- [ ] Premium/elevated appearance

**Styling:**
```tsx
<div
  className="p-4 rounded-3xl"
  style={{
    background: isDark
      ? 'linear-gradient(135deg, rgba(96, 165, 250, 0.08) 0%, rgba(56, 189, 248, 0.04) 100%)'
      : 'linear-gradient(135deg, rgba(37, 99, 235, 0.06) 0%, rgba(14, 165, 233, 0.03) 100%)',
    backdropFilter: 'blur(24px)',
    border: `1px solid ${colors.cardBorder}`
  }}
>
```

**Typography Inside Liquid Blue Glass:**
- [ ] **Label**: `text-xs font-semibold uppercase tracking-wider` with `colors.primary`
- [ ] **Value**: `text-xl font-bold mt-2` with `colors.textPrimary`
- [ ] **Change Badge**: `text-xs font-medium px-2 py-0.5 rounded-full mt-3`

**Change Badge Styling:**
```tsx
<span
  className="text-xs font-medium px-2 py-0.5 rounded-full"
  style={{
    background: isDark ? 'rgba(52, 211, 153, 0.15)' : 'rgba(16, 185, 129, 0.15)',
    border: `1px solid ${isDark ? 'rgba(52, 211, 153, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`,
    color: colors.success
  }}
>
  +12.4%
</span>
```

---

### Card Selection Guide

| Scenario | Card Type |
|----------|-----------|
| Page section wrapper | Glass Card |
| Sidebar container | Glass Card |
| Modal/Dialog body | Glass Card |
| Clickable list item | Blue Tinted Card |
| Model/Engine status card | Blue Tinted Card |
| Activity feed item | Blue Tinted Card |
| Dashboard KPI tile | Liquid Blue Glass |
| Hero stat display | Liquid Blue Glass |
| Total/Summary metric | Liquid Blue Glass |

---

## Information Tiles

Use visual weight and color to establish information hierarchy and semantic meaning.

### Hierarchy Levels

| Level | Background | Border | Use Case |
|-------|------------|--------|----------|
| **Primary** | Solid gradient `${colors.primary}` → `${colors.primaryDark}` | None | Hero metrics, critical alerts, main CTAs |
| **Secondary** | `rgba(37, 99, 235, 0.1)` / `rgba(96, 165, 250, 0.15)` | `1px solid` with 0.15-0.2 opacity | Supporting stats, section highlights |
| **Tertiary** | `rgba(248, 250, 252, 0.8)` / `rgba(30, 41, 59, 0.5)` | Neutral gray border | Background info, metadata, footnotes |

### Primary Tile (Highest Priority)
```tsx
<div className="p-4 rounded-2xl" style={{
  background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
  boxShadow: `0 8px 32px ${isDark ? 'rgba(96, 165, 250, 0.3)' : 'rgba(37, 99, 235, 0.25)'}`
}}>
  <p className="text-xs font-semibold uppercase tracking-wider text-white/70">Label</p>
  <p className="text-xl font-bold text-white">₹12.4 Cr</p>
</div>
```

### Secondary Tile (Medium Priority)
```tsx
<div className="p-4 rounded-2xl" style={{
  background: isDark
    ? 'linear-gradient(135deg, rgba(96, 165, 250, 0.15) 0%, rgba(56, 189, 248, 0.08) 100%)'
    : 'linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(14, 165, 233, 0.05) 100%)',
  border: `1px solid ${isDark ? 'rgba(96, 165, 250, 0.2)' : 'rgba(37, 99, 235, 0.15)'}`,
  boxShadow: `0 4px 20px ${colors.glassShadow}`
}}>
  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>Label</p>
  <p className="text-xl font-bold" style={{ color: colors.textPrimary }}>₹8.2 Cr</p>
</div>
```

### Tertiary Tile (Lower Priority)
```tsx
<div className="p-4 rounded-2xl" style={{
  background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.8)',
  border: `1px solid ${isDark ? 'rgba(71, 85, 105, 0.3)' : 'rgba(226, 232, 240, 0.8)'}`
}}>
  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.textTertiary }}>Label</p>
  <p className="text-xl font-bold" style={{ color: colors.textSecondary }}>₹3.1 Cr</p>
</div>
```

---

### Semantic Backgrounds

Color-coded panels for different information types:

| Type | Light Mode Background | Dark Mode Background | Border Opacity | Use Case |
|------|----------------------|---------------------|----------------|----------|
| **Info** | `rgba(37, 99, 235, 0.08)` | `rgba(96, 165, 250, 0.12)` | 0.12 / 0.2 | Tips, guidance, neutral info |
| **Success** | `rgba(16, 185, 129, 0.08)` | `rgba(52, 211, 153, 0.12)` | 0.12 / 0.2 | Gains, completions, positive |
| **Warning** | `rgba(245, 158, 11, 0.08)` | `rgba(251, 191, 36, 0.12)` | 0.12 / 0.2 | Cautions, pending, reviews |
| **Error** | `rgba(239, 68, 68, 0.08)` | `rgba(248, 113, 113, 0.12)` | 0.12 / 0.2 | Alerts, losses, critical |

### Semantic Tile Template
```tsx
<div className="p-4 rounded-2xl" style={{
  background: isDark
    ? 'linear-gradient(135deg, rgba(52, 211, 153, 0.12) 0%, rgba(52, 211, 153, 0.06) 100%)'
    : 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.03) 100%)',
  border: `1px solid ${isDark ? 'rgba(52, 211, 153, 0.2)' : 'rgba(16, 185, 129, 0.12)'}`
}}>
  <div className="flex items-center gap-2 mb-2">
    <div className="w-6 h-6 rounded-lg flex items-center justify-center"
         style={{ background: isDark ? 'rgba(52, 211, 153, 0.2)' : 'rgba(16, 185, 129, 0.1)' }}>
      <svg className="w-3.5 h-3.5" style={{ color: colors.success }}>...</svg>
    </div>
    <span className="text-xs font-semibold uppercase" style={{ color: colors.success }}>Success</span>
  </div>
  <p className="text-sm" style={{ color: colors.textSecondary }}>Message content</p>
</div>
```

---

### Background Opacity Guide

Use these opacity values to establish visual hierarchy:

| Visual Weight | Light Mode | Dark Mode | Use For |
|--------------|------------|-----------|---------|
| **Highest** | 0.1 | 0.15 | KPI tiles, hero metrics |
| **High** | 0.06 | 0.1 | Section containers |
| **Medium** | 0.04 | 0.08 | Cards, panels |
| **Low** | 0.02 | 0.05 | List items |
| **Subtle** | 0.01 | 0.03 | Hover states |

### Nested Panel Hierarchy

When nesting panels, decrease opacity at each level:

```
Level 1 (Container): colors.glassBackground + glassBorder
  └─ Level 2 (Subsection): rgba(primary, 0.04-0.08) + cardBorder
       └─ Level 3 (Items): rgba(neutral, 0.02-0.05) + subtle border + hover:-translate-y-0.5
```

---

## Progress Bars

- [ ] **Track**: `colors.progressBg`
- [ ] **Fill**: Gradient `linear-gradient(90deg, ${colors.primary} 0%, ${colors.secondary} 100%)`
- [ ] **Height**: `h-2` (not `h-1.5`)
- [ ] **Border Radius**: `rounded-full`

---

## Operation Cards / Tabs

- [ ] **Layout**: Grid with cards (not button-like tabs)
- [ ] **Card Padding**: `p-4`
- [ ] **Icon Container**: `w-9 h-9 rounded-xl`
- [ ] **Active State**: Gradient background with white text
- [ ] **Inactive State**: `colors.cardBackground` with border
- [ ] **Include**: Icon, label, and description

---

## Page Structure

- [ ] **Background**: Clean solid color `colors.background`
  - Light: `#F8FAFC`
  - Dark: `#0F172A`
- [ ] **Container**: `<div className="min-h-screen" style={{ background: colors.background }}>`
- [ ] **Max Width**: `max-w-6xl mx-auto`
- [ ] **Padding**: `px-6 py-8`
- [ ] **Admin Badge**: Blue chip with "Admin" text

### Page Background Code
```tsx
<div className="min-h-screen" style={{ background: colors.background }}>
  <Navbar mode="admin" />
  <main className="max-w-6xl mx-auto px-6 py-8">
    {/* Page content */}
  </main>
  <Footer />
</div>
```

---

## Dark Mode Support

- [ ] All colors use V4 color system
- [ ] Backgrounds use `isDark ? darkValue : lightValue` pattern
- [ ] Borders use theme-aware `colors.cardBorder`
- [ ] Shadows use theme-aware `colors.glassShadow`

---

## Accessibility

- [ ] Focus indicators visible
- [ ] Color contrast meets WCAG
- [ ] Hover/active states on interactive elements
- [ ] Labels associated with inputs

---

# Quick Reference - Code Snippets

### Form Label
```tsx
<label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>
  FIELD NAME
</label>
```

### Input Field
```tsx
<input
  className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none"
  style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
/>
```

### Select Dropdown
```tsx
<select
  className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none"
  style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
>
```

### Primary Button
```tsx
<button
  className="w-full py-2.5 rounded-full font-semibold text-sm text-white transition-all hover:shadow-lg"
  style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`, boxShadow: `0 4px 14px ${colors.glassShadow}` }}
>
  Button Text
</button>
```

### Section Header
```tsx
<span className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>
  SECTION TITLE
</span>
```

### Glass Card (Container)
```tsx
<div
  className="p-5 rounded-xl"
  style={{ background: colors.cardBackground, border: `1px solid ${colors.cardBorder}`, boxShadow: `0 4px 24px ${colors.glassShadow}` }}
>
  {/* Section content */}
</div>
```

### Blue Tinted Card (List Item)
```tsx
<div
  className="p-3 rounded-2xl transition-all duration-200 hover:-translate-y-0.5"
  style={{
    background: isDark
      ? 'linear-gradient(135deg, rgba(96, 165, 250, 0.08) 0%, rgba(147, 197, 253, 0.04) 100%)'
      : 'linear-gradient(135deg, rgba(37, 99, 235, 0.04) 0%, rgba(59, 130, 246, 0.02) 100%)',
    border: `1px solid ${colors.cardBorder}`,
    boxShadow: `0 4px 20px ${colors.glassShadow}`
  }}
>
  <div className="flex items-center justify-between">
    <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>Item Name</span>
    <span className="text-sm font-bold" style={{ color: colors.primary }}>Value</span>
  </div>
  <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>Subtitle</p>
</div>
```

### Result Avatar
```tsx
<div
  className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-lg"
  style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }}
>
  A
</div>
```

### Chip/Tag
```tsx
<span
  className="text-xs px-2 py-0.5 rounded"
  style={{ background: colors.chipBg, color: colors.primary, border: `1px solid ${colors.chipBorder}` }}
>
  Tag
</span>
```

### Progress Bar
```tsx
<div className="h-2 rounded-full overflow-hidden" style={{ background: colors.progressBg }}>
  <div
    className="h-full rounded-full"
    style={{ width: '75%', background: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.secondary} 100%)` }}
  />
</div>
```

### Stat Display
```tsx
<div className="flex items-center justify-between mb-2">
  <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>LABEL</span>
  <span className="text-lg font-bold" style={{ color: colors.primary }}>71.8%</span>
</div>
```

### Liquid Blue Glass (KPI Tile)
```tsx
<div
  className="p-4 rounded-3xl"
  style={{
    background: isDark
      ? 'linear-gradient(135deg, rgba(96, 165, 250, 0.08) 0%, rgba(56, 189, 248, 0.04) 100%)'
      : 'linear-gradient(135deg, rgba(37, 99, 235, 0.06) 0%, rgba(14, 165, 233, 0.03) 100%)',
    backdropFilter: 'blur(24px)',
    border: `1px solid ${colors.cardBorder}`
  }}
>
  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>
    TOTAL AUM
  </p>
  <p className="text-xl font-bold mt-2" style={{ color: colors.textPrimary }}>
    ₹847.2 Cr
  </p>
  <div className="mt-3 flex items-center gap-2">
    <span
      className="text-xs font-medium px-2 py-0.5 rounded-full"
      style={{
        background: isDark ? 'rgba(52, 211, 153, 0.15)' : 'rgba(16, 185, 129, 0.15)',
        border: `1px solid ${isDark ? 'rgba(52, 211, 153, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`,
        color: colors.success
      }}
    >
      +12.4%
    </span>
  </div>
</div>
```
