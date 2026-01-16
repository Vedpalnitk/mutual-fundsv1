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

## Do & Don’t
- Do: Light, clean cards; structured spacing; gradient CTAs; pill badges; thin borders.
- Don’t: Heavy drop shadows, dark themes, neon palettes, dense tables without breathing room, sharp corners.
